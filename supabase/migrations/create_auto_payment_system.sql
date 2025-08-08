-- ===== 自動決済システム用データベース関数とcron設定 =====

-- 1. 期限切れチャレンジ処理関数
CREATE OR REPLACE FUNCTION process_expired_challenges()
RETURNS TABLE (
    processed_count INTEGER,
    failed_count INTEGER,
    total_found INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_challenge RECORD;
    processed INTEGER := 0;
    failed INTEGER := 0;
    total INTEGER := 0;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 期限切れのアクティブチャレンジを取得
    FOR expired_challenge IN 
        SELECT id, user_id, target_time, penalty_amount, status
        FROM challenges 
        WHERE status = 'active' 
        AND target_time < current_time
    LOOP
        total := total + 1;
        
        BEGIN
            -- チャレンジを失敗状態に更新
            UPDATE challenges 
            SET 
                status = 'failed',
                completed_at = current_time,
                completion_address = '起床時間経過のため自動失敗',
                updated_at = current_time
            WHERE id = expired_challenge.id;
            
            -- 通知を送信
            PERFORM send_notification(
                expired_challenge.user_id,
                'チャレンジ自動失敗',
                '起床時間を過ぎたため、チャレンジが自動的に失敗しました。決済処理を開始します。',
                'challenge_failed'
            );
            
            processed := processed + 1;
            
            RAISE NOTICE 'Challenge % marked as failed for user %', expired_challenge.id, expired_challenge.user_id;
            
        EXCEPTION WHEN OTHERS THEN
            failed := failed + 1;
            RAISE WARNING 'Failed to process challenge %: %', expired_challenge.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT processed, failed, total;
END;
$$;

-- 2. 決済リトライ処理関数
CREATE OR REPLACE FUNCTION retry_failed_payments()
RETURNS TABLE (
    retried_count INTEGER,
    success_count INTEGER,
    final_failure_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_record RECORD;
    retried INTEGER := 0;
    succeeded INTEGER := 0;
    final_failed INTEGER := 0;
BEGIN
    -- 失敗した決済でリトライ可能なものを取得
    FOR payment_record IN 
        SELECT p.id, p.user_id, p.challenge_id, p.amount, p.retry_count
        FROM payments p
        JOIN challenges c ON p.challenge_id = c.id
        WHERE p.status = 'failed' 
        AND p.retry_count < 3
        AND p.created_at > NOW() - INTERVAL '24 hours'
        AND c.status = 'failed'
    LOOP
        retried := retried + 1;
        
        -- リトライカウントを増加
        UPDATE payments 
        SET 
            retry_count = retry_count + 1,
            updated_at = NOW()
        WHERE id = payment_record.id;
        
        -- 通知を送信（リトライ通知）
        PERFORM send_notification(
            payment_record.user_id,
            '決済リトライ中',
            format('決済処理を再試行しています。金額: ¥%s', payment_record.amount::text),
            'payment_retry'
        );
    END LOOP;
    
    RETURN QUERY SELECT retried, succeeded, final_failed;
END;
$$;

-- 3. 通知送信関数の改良
CREATE OR REPLACE FUNCTION send_notification(
    user_id_param UUID,
    title_param TEXT,
    body_param TEXT,
    type_param TEXT DEFAULT 'general'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        is_read,
        push_sent,
        created_at
    ) VALUES (
        user_id_param,
        title_param,
        body_param,
        type_param,
        false,
        false,
        NOW()
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 4. 統計データ取得関数
CREATE OR REPLACE FUNCTION get_payment_statistics()
RETURNS TABLE (
    total_challenges INTEGER,
    successful_payments INTEGER,
    failed_payments INTEGER,
    pending_payments INTEGER,
    total_amount_processed INTEGER,
    success_rate DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM challenges WHERE created_at > NOW() - INTERVAL '30 days'),
        (SELECT COUNT(*)::INTEGER FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'),
        (SELECT COUNT(*)::INTEGER FROM payments WHERE status = 'failed' AND created_at > NOW() - INTERVAL '30 days'),
        (SELECT COUNT(*)::INTEGER FROM payments WHERE status = 'pending' AND created_at > NOW() - INTERVAL '30 days'),
        (SELECT COALESCE(SUM(amount), 0)::INTEGER FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'),
        CASE 
            WHEN (SELECT COUNT(*) FROM payments WHERE created_at > NOW() - INTERVAL '30 days') > 0 
            THEN (SELECT COUNT(*)::DECIMAL FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days') / 
                 (SELECT COUNT(*) FROM payments WHERE created_at > NOW() - INTERVAL '30 days') * 100
            ELSE 0
        END;
END;
$$;

-- 5. Edge Function呼び出し用のHTTPリクエスト関数
CREATE OR REPLACE FUNCTION call_expired_challenges_processing()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Edge Functionを呼び出し
    SELECT content INTO result
    FROM http_post(
        'https://your-project-id.supabase.co/functions/v1/process-expired-challenges',
        '{}',
        'application/json'
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to call edge function: %', SQLERRM;
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- 6. 権限設定
GRANT EXECUTE ON FUNCTION process_expired_challenges() TO postgres;
GRANT EXECUTE ON FUNCTION retry_failed_payments() TO postgres;
GRANT EXECUTE ON FUNCTION send_notification(UUID, TEXT, TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION get_payment_statistics() TO postgres;
GRANT EXECUTE ON FUNCTION call_expired_challenges_processing() TO postgres;

-- 7. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_challenges_status_target_time ON challenges(status, target_time);
CREATE INDEX IF NOT EXISTS idx_payments_status_retry ON payments(status, retry_count, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);

-- 8. パフォーマンス統計用ビュー
CREATE OR REPLACE VIEW payment_performance_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_payments,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
    AVG(amount) as average_amount,
    SUM(amount) FILTER (WHERE status = 'completed') as total_revenue
FROM payments
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMENT ON VIEW payment_performance_stats IS '決済パフォーマンス統計（過去30日間）';