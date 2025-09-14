/* eslint-disable sort-keys-fix/sort-keys-fix  */
import { boolean, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';

import { timestamps, timestamptz } from './_helpers';
import { users } from './user';

export const userSubscriptions = pgTable('user_subscriptions', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),

    // Stripe fields
    stripeId: text('stripe_id'),
    currency: text('currency'),
    pricing: integer('pricing'),
    billingPaidAt: integer('billing_paid_at'),
    billingCycleStart: integer('billing_cycle_start'),
    billingCycleEnd: integer('billing_cycle_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end'),
    cancelAt: integer('cancel_at'),
    nextBilling: jsonb('next_billing'),
    plan: text('plan'),
    recurring: text('recurring'),
    storageLimit: integer('storage_limit'),
    status: integer('status'),

    // LEWIS-specific fields
    lewisAccess: boolean('lewis_access').default(false),
    lewisSubscriptionTier: text('lewis_subscription_tier').default('free'),
    lewisSubscriptionStart: timestamptz('lewis_subscription_start'),
    lewisSubscriptionEnd: timestamptz('lewis_subscription_end'),
    lewisPaymentStatus: text('lewis_payment_status').default('inactive'),

    ...timestamps,
});

export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type UserSubscriptionItem = typeof userSubscriptions.$inferSelect;

export const userBudgets = pgTable('user_budgets', {
    id: text('id')
        .references(() => users.id, { onDelete: 'cascade' })
        .primaryKey(),
    freeBudgetId: text('free_budget_id'),
    freeBudgetKey: text('free_budget_key'),
    subscriptionBudgetId: text('subscription_budget_id'),
    subscriptionBudgetKey: text('subscription_budget_key'),
    packageBudgetId: text('package_budget_id'),
    packageBudgetKey: text('package_budget_key'),

    ...timestamps,
});

export type NewUserBudget = typeof userBudgets.$inferInsert;
export type UserBudgetItem = typeof userBudgets.$inferSelect;
