-- Migration: Secure payment methods with Stripe-only architecture
-- This migration ensures payment_methods table only stores minimal metadata
-- and adds proper Stripe integration columns

-- Add Stripe-specific columns for better integration
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_method_id VARCHAR(255);

-- Add unique constraint to prevent duplicate Stripe payment methods
ALTER TABLE payment_methods 
ADD CONSTRAINT unique_stripe_payment_method 
UNIQUE (user_id, stripe_payment_method_id);

-- Add index for better performance on Stripe lookups
CREATE INDEX IF NOT EXISTS payment_methods_stripe_pm_id_idx 
ON payment_methods(stripe_payment_method_id);

CREATE INDEX IF NOT EXISTS payment_methods_stripe_customer_id_idx 
ON payment_methods(stripe_customer_id);

-- Update RLS policies to be more specific about Stripe integration
-- (Keep existing policies but add comments for clarity)

COMMENT ON TABLE payment_methods IS 
'Stores minimal payment method metadata for UI/search. 
Actual card data is stored securely in Stripe.
This table should never contain PAN, CVV, or other sensitive card data.';

COMMENT ON COLUMN payment_methods.stripe_payment_method_id IS 
'References Stripe PaymentMethod ID. This is the source of truth for payment methods.';

COMMENT ON COLUMN payment_methods.stripe_customer_id IS 
'References Stripe Customer ID for faster queries.';

COMMENT ON COLUMN payment_methods.last4 IS 
'Last 4 digits only - safe for display purposes.';

-- Add a function to clean up orphaned payment methods (those without Stripe IDs)
CREATE OR REPLACE FUNCTION cleanup_legacy_payment_methods()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete payment methods that don't have Stripe payment method IDs
  -- These are legacy entries that should be re-registered via SetupIntent
  DELETE FROM payment_methods 
  WHERE stripe_payment_method_id IS NULL 
    OR stripe_payment_method_id = '';
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_legacy_payment_methods() IS 
'Removes legacy payment methods without Stripe IDs. 
These should be re-registered through the secure SetupIntent flow.';