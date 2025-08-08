-- ===== 監視・ログシステム用テーブル =====

-- Webhook ログテーブル
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- システムログテーブル
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service TEXT NOT NULL, -- 'auto_payment', 'push_notifications', 'retry_system'
    level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 決済統計ビュー
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_payments,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
    COUNT(*) FILTER (WHERE payment_method LIKE '%auto%') as auto_payments,
    ROUND(AVG(amount), 2) as average_amount,
    SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as success_rate,
    MAX(retry_count) as max_retries
FROM payments
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- チャレンジ統計ビュー
CREATE OR REPLACE VIEW challenge_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_challenges,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_challenges,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_challenges,
    COUNT(*) FILTER (WHERE status = 'active') as active_challenges,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
         NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'failed')), 0)) * 100, 
        2
    ) as success_rate,
    ROUND(AVG(penalty_amount), 2) as average_penalty
FROM challenges
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 通知統計ビュー
CREATE OR REPLACE VIEW notification_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE push_sent = true) as sent_notifications,
    COUNT(*) FILTER (WHERE push_status = 'sent') as successful_pushes,
    COUNT(*) FILTER (WHERE push_status = 'failed') as failed_pushes,
    ROUND(
        (COUNT(*) FILTER (WHERE push_status = 'sent')::DECIMAL / 
         NULLIF(COUNT(*) FILTER (WHERE push_sent = true), 0)) * 100, 
        2
    ) as push_success_rate,
    COUNT(DISTINCT user_id) as unique_users_notified
FROM notifications
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- システム健全性チェック関数
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS TABLE (
    metric TEXT,
    value NUMERIC,
    status TEXT,
    threshold NUMERIC,
    last_check TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH health_metrics AS (
        -- 決済成功率（過去24時間）
        SELECT 
            'payment_success_rate' as metric,
            COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours')::NUMERIC / 
                 NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) * 100
                 FROM payments), 
                0
            ) as value,
            95.0 as threshold
        
        UNION ALL
        
        -- 自動決済処理率（過去24時間）
        SELECT 
            'auto_payment_rate' as metric,
            COALESCE(
                (SELECT COUNT(*) FILTER (WHERE payment_method LIKE '%auto%' AND created_at > NOW() - INTERVAL '24 hours')::NUMERIC / 
                 NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) * 100
                 FROM payments), 
                0
            ) as value,
            80.0 as threshold
            
        UNION ALL
        
        -- プッシュ通知成功率（過去24時間）
        SELECT 
            'push_success_rate' as metric,
            COALESCE(
                (SELECT COUNT(*) FILTER (WHERE push_status = 'sent' AND created_at > NOW() - INTERVAL '24 hours')::NUMERIC / 
                 NULLIF(COUNT(*) FILTER (WHERE push_sent = true AND created_at > NOW() - INTERVAL '24 hours'), 0) * 100
                 FROM notifications), 
                0
            ) as value,
            90.0 as threshold
            
        UNION ALL
        
        -- 期限切れチャレンジ処理遅延（分）
        SELECT 
            'challenge_processing_delay' as metric,
            COALESCE(
                (SELECT EXTRACT(EPOCH FROM AVG(NOW() - target_time)) / 60
                 FROM challenges 
                 WHERE status = 'active' AND target_time < NOW() - INTERVAL '5 minutes'), 
                0
            ) as value,
            10.0 as threshold -- 10分以内に処理
            
        UNION ALL
        
        -- 失敗したWebhook数（過去1時間）
        SELECT 
            'failed_webhooks' as metric,
            COALESCE(
                (SELECT COUNT(*)::NUMERIC 
                 FROM webhook_logs 
                 WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour'), 
                0
            ) as value,
            5.0 as threshold -- 5件未満
    )
    SELECT 
        h.metric,
        h.value,
        CASE 
            WHEN h.metric = 'challenge_processing_delay' THEN
                CASE WHEN h.value <= h.threshold THEN 'healthy' ELSE 'warning' END
            WHEN h.metric = 'failed_webhooks' THEN
                CASE WHEN h.value <= h.threshold THEN 'healthy' ELSE 'critical' END
            ELSE
                CASE WHEN h.value >= h.threshold THEN 'healthy' ELSE 'warning' END
        END as status,
        h.threshold,
        NOW() as last_check
    FROM health_metrics h;
END;
$$;

-- アラート生成関数
CREATE OR REPLACE FUNCTION generate_system_alerts()
RETURNS TABLE (
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'payment_failure' as alert_type,
        'critical' as severity,
        format('決済成功率が低下しています: %.1f%% (過去24時間)', 
               COALESCE(
                   (SELECT COUNT(*) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours')::NUMERIC / 
                    NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) * 100
                    FROM payments), 
                   0
               )
        ) as message,
        NOW() as created_at
    WHERE (
        SELECT COUNT(*) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours')::NUMERIC / 
               NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) * 100
        FROM payments
    ) < 90
    
    UNION ALL
    
    SELECT 
        'processing_delay' as alert_type,
        'warning' as severity,
        format('期限切れチャレンジの処理に遅延があります: %s件が未処理', 
               (SELECT COUNT(*) FROM challenges WHERE status = 'active' AND target_time < NOW() - INTERVAL '5 minutes')
        ) as message,
        NOW() as created_at
    WHERE (
        SELECT COUNT(*) FROM challenges WHERE status = 'active' AND target_time < NOW() - INTERVAL '5 minutes'
    ) > 0
    
    UNION ALL
    
    SELECT 
        'webhook_failures' as alert_type,
        'critical' as severity,
        format('Webhookエラーが多発しています: %s件 (過去1時間)', 
               (SELECT COUNT(*) FROM webhook_logs WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour')
        ) as message,
        NOW() as created_at
    WHERE (
        SELECT COUNT(*) FROM webhook_logs WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour'
    ) > 5;
END;
$$;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_service_level ON system_logs(service, level, timestamp);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_challenges_status_target_time ON challenges(status, target_time);
CREATE INDEX IF NOT EXISTS idx_notifications_push_sent ON notifications(push_sent, created_at);

-- RLS設定
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "Admin access only" ON webhook_logs FOR ALL USING (false);
CREATE POLICY "Admin access only" ON system_logs FOR ALL USING (false);

-- 権限設定
GRANT EXECUTE ON FUNCTION get_system_health() TO postgres;
GRANT EXECUTE ON FUNCTION generate_system_alerts() TO postgres;

COMMENT ON TABLE webhook_logs IS 'Webhook処理ログ（管理者用）';
COMMENT ON TABLE system_logs IS 'システムログ（管理者用）';
COMMENT ON VIEW payment_analytics IS '決済分析データ';
COMMENT ON VIEW challenge_analytics IS 'チャレンジ分析データ';
COMMENT ON VIEW notification_analytics IS '通知分析データ';
COMMENT ON FUNCTION get_system_health() IS 'システム健全性チェック';
COMMENT ON FUNCTION generate_system_alerts() IS 'システムアラート生成';