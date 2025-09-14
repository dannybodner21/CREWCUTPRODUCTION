-- Update Stripe-related fields in user_subscriptions table
-- Fix field types to match Stripe data types

-- Update billing fields to use timestamptz instead of integer
ALTER TABLE user_subscriptions 
ALTER COLUMN billing_paid_at TYPE timestamptz USING to_timestamp(billing_paid_at),
ALTER COLUMN billing_cycle_start TYPE timestamptz USING to_timestamp(billing_cycle_start),
ALTER COLUMN billing_cycle_end TYPE timestamptz USING to_timestamp(billing_cycle_end),
ALTER COLUMN cancel_at TYPE timestamptz USING to_timestamp(cancel_at);

-- Update status field to use text instead of integer
ALTER TABLE user_subscriptions 
ALTER COLUMN status TYPE text USING CASE 
    WHEN status = 0 THEN 'inactive'
    WHEN status = 1 THEN 'active'
    WHEN status = 2 THEN 'cancelled'
    ELSE 'inactive'
END;

-- Update recurring field to use boolean instead of text
ALTER TABLE user_subscriptions 
ALTER COLUMN recurring TYPE boolean USING CASE 
    WHEN recurring = 'true' OR recurring = '1' THEN true
    ELSE false
END;

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_lewis_access ON user_subscriptions(lewis_access);
