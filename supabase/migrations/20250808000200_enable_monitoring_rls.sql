-- Ensure monitoring tables exist and are protected in production

-- webhook_logs & system_logs created by create_monitoring_system.sql
-- Here we only enforce RLS and restrict access by default

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='webhook_logs' AND table_schema='public') THEN
    ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
    -- Lock down by default (admin-only via Postgres role or RPC)
    DROP POLICY IF EXISTS "Admin access only" ON webhook_logs;
    CREATE POLICY "Admin access only" ON webhook_logs FOR ALL USING (false);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='system_logs' AND table_schema='public') THEN
    ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admin access only" ON system_logs;
    CREATE POLICY "Admin access only" ON system_logs FOR ALL USING (false);
  END IF;
END $$;


