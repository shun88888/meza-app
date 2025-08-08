-- ===== Supabase cron拡張とジョブ設定 =====

-- pg_cron拡張を有効化（Supabase Pro以上で利用可能）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- cron関数の作成（HTTP関数呼び出し用）
CREATE OR REPLACE FUNCTION call_edge_function(function_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT;
    supabase_url TEXT;
BEGIN
    -- Supabase URLを取得（環境変数から）
    supabase_url := current_setting('app.supabase_url', true);
    
    IF supabase_url IS NULL THEN
        supabase_url := 'https://protfbiygiyfikeigwiv.supabase.co'; -- デフォルトURL
    END IF;

    -- Edge Functionを呼び出し
    SELECT content INTO result
    FROM http((
        'POST',
        supabase_url || '/functions/v1/' || function_name,
        ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key', true))],
        'application/json',
        '{}'
    )::http_request);
    
    -- システムログに記録
    INSERT INTO system_logs (service, level, message, metadata)
    VALUES (
        'cron_job',
        'info',
        'Edge function called: ' || function_name,
        jsonb_build_object('function_name', function_name, 'result', result, 'timestamp', NOW())
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- エラーログに記録
    INSERT INTO system_logs (service, level, message, metadata)
    VALUES (
        'cron_job',
        'error',
        'Failed to call edge function: ' || function_name,
        jsonb_build_object('function_name', function_name, 'error', SQLERRM, 'timestamp', NOW())
    );
    
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- cron ジョブのスケジュール設定

-- 1. 期限切れチャレンジ処理（1分ごと）
SELECT cron.schedule(
    'process-expired-challenges',
    '* * * * *', -- 毎分実行
    'SELECT call_edge_function(''process-expired-challenges'');'
);

-- 2. 失敗した決済のリトライ（10分ごと）
SELECT cron.schedule(
    'retry-failed-payments',
    '*/10 * * * *', -- 10分ごと実行
    'SELECT call_edge_function(''retry-failed-payments'');'
);

-- 3. プッシュ通知送信（2分ごと）
SELECT cron.schedule(
    'send-push-notifications',
    '*/2 * * * *', -- 2分ごと実行
    'SELECT call_edge_function(''send-push-notifications'');'
);

-- 4. システム健全性チェック（5分ごと）
SELECT cron.schedule(
    'system-health-check',
    '*/5 * * * *', -- 5分ごと実行
    $$
    INSERT INTO system_logs (service, level, message, metadata)
    SELECT 
        'health_check',
        CASE 
            WHEN status = 'critical' THEN 'critical'
            WHEN status = 'warning' THEN 'warn'
            ELSE 'info'
        END,
        'Health check: ' || metric || ' = ' || value || ' (' || status || ')',
        jsonb_build_object(
            'metric', metric,
            'value', value,
            'status', status,
            'threshold', threshold,
            'timestamp', last_check
        )
    FROM get_system_health()
    WHERE status != 'healthy';
    $$
);

-- 5. 古いログのクリーンアップ（毎日午前3時）
SELECT cron.schedule(
    'cleanup-old-logs',
    '0 3 * * *', -- 毎日午前3時
    $$
    -- 30日以上古いWebhookログを削除
    DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- 7日以上古いシステムログを削除（エラーレベル以外）
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND level NOT IN ('error', 'critical');
    
    -- 90日以上古い通知を削除
    DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- ログ記録
    INSERT INTO system_logs (service, level, message, metadata)
    VALUES (
        'cleanup',
        'info',
        'Old logs cleanup completed',
        jsonb_build_object('timestamp', NOW())
    );
    $$
);

-- cron ジョブの確認
SELECT cron.schedule_in_database(
    'check-cron-jobs',
    '0 */6 * * *', -- 6時間ごと
    $$
    INSERT INTO system_logs (service, level, message, metadata)
    VALUES (
        'cron_monitor',
        'info',
        'Cron jobs status check',
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'jobname', jobname,
                    'schedule', schedule,
                    'active', active,
                    'jobid', jobid
                )
            )
            FROM cron.job
        )
    );
    $$
);

-- cronジョブの状態を確認するビュー
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
    jobname,
    schedule,
    active,
    last_run_start_time,
    last_run_status,
    jobid
FROM cron.job
WHERE jobname IN (
    'process-expired-challenges',
    'retry-failed-payments', 
    'send-push-notifications',
    'system-health-check',
    'cleanup-old-logs',
    'check-cron-jobs'
);

-- 権限設定
GRANT SELECT ON cron_job_status TO postgres;
GRANT EXECUTE ON FUNCTION call_edge_function(TEXT) TO postgres;

-- 設定値を保存（Supabaseプロジェクト設定で使用）
-- これらはSupabaseダッシュボードで設定する必要があります:
-- app.supabase_url = 'https://your-project-id.supabase.co'
-- app.service_role_key = 'your-service-role-key'

COMMENT ON FUNCTION call_edge_function(TEXT) IS 'Edge Function呼び出し用関数';
COMMENT ON VIEW cron_job_status IS 'cronジョブの実行状態確認用';

-- 初期化完了ログ
INSERT INTO system_logs (service, level, message, metadata)
VALUES (
    'initialization',
    'info',
    'Auto payment system cron jobs initialized',
    jsonb_build_object(
        'jobs_created', 6,
        'timestamp', NOW(),
        'version', '1.0'
    )
);