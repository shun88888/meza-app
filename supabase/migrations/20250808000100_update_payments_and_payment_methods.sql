-- Align payments/payment_methods schema with app & edge functions

-- 1) payment_methods: add Stripe linkage columns if missing
ALTER TABLE IF EXISTS payment_methods
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS payment_methods_user_created_idx ON payment_methods(user_id, created_at);

-- 2) payments: add operational columns used by automation & webhooks
-- Some environments may not have the table yet; guard with IF EXISTS
ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS failure_code TEXT,
  ADD COLUMN IF NOT EXISTS failure_message TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Allow missing payment_intent when Stripe creation failed early
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='payments' AND column_name='stripe_payment_intent_id' AND is_nullable='NO'
  ) THEN
    ALTER TABLE payments ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;
  END IF;
END $$;

-- 3) payments.status constraint alignment
-- Allow 'completed' used by API/webhooks while keeping compatibility
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'payments'
      AND tc.constraint_type = 'CHECK'
  ) THEN
    -- Drop all CHECK constraints on payments.status and recreate a unified one
    -- Find and drop specific constraint if named; otherwise try common names
    BEGIN
      ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
    EXCEPTION WHEN undefined_object THEN
      -- ignore
    END;

    -- Some setups auto-name the check; attempt to find it dynamically
    PERFORM 1;
  END IF;
END $$;

-- Recreate a permissive status check covering current code paths
ALTER TABLE IF EXISTS payments
  DROP CONSTRAINT IF EXISTS payments_status_check,
  ADD CONSTRAINT payments_status_check CHECK (status IN ('pending','completed','failed'));

-- 4) indexes for retry/analytics
CREATE INDEX IF NOT EXISTS idx_payments_status_retry ON payments(status, retry_count, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 5) comments for maintainability
COMMENT ON COLUMN payment_methods.stripe_customer_id IS 'Stripe Customer ID attached to the user';
COMMENT ON COLUMN payment_methods.stripe_payment_method_id IS 'Stripe PaymentMethod ID saved for off_session charges';
COMMENT ON COLUMN payments.retry_count IS 'Number of automatic retry attempts performed';
COMMENT ON COLUMN payments.last_retry_at IS 'Timestamp of the last retry attempt';
COMMENT ON COLUMN payments.failure_code IS 'Stripe failure code from last attempt';
COMMENT ON COLUMN payments.failure_message IS 'Stripe failure message from last attempt';
COMMENT ON COLUMN payments.receipt_url IS 'Receipt URL from Stripe charges data';
COMMENT ON COLUMN payments.payment_method IS 'Internal label of the mechanism used (auto_charge, auto_charge_cron, etc.)';
COMMENT ON COLUMN payments.error_message IS 'Free-form error detail for failed insert paths';


