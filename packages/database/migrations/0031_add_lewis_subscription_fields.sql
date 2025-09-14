-- Add LEWIS-specific subscription fields
ALTER TABLE "user_subscriptions" ADD COLUMN "lewis_access" boolean DEFAULT false;
ALTER TABLE "user_subscriptions" ADD COLUMN "lewis_subscription_tier" text DEFAULT 'free';
ALTER TABLE "user_subscriptions" ADD COLUMN "lewis_subscription_start" timestamp with time zone;
ALTER TABLE "user_subscriptions" ADD COLUMN "lewis_subscription_end" timestamp with time zone;
ALTER TABLE "user_subscriptions" ADD COLUMN "lewis_payment_status" text DEFAULT 'inactive';

-- Add index for efficient LEWIS access queries
CREATE INDEX IF NOT EXISTS "user_subscriptions_lewis_access_idx" ON "user_subscriptions" ("lewis_access");
CREATE INDEX IF NOT EXISTS "user_subscriptions_lewis_tier_idx" ON "user_subscriptions" ("lewis_subscription_tier");
