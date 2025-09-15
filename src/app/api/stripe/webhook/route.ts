import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/config/stripe';
import { authEnv } from '@/config/auth';
import { getDBInstance } from '@/database/core/web-server';
import { userSubscriptions } from '@/database/schemas';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !authEnv.STRIPE_WEBHOOK_SECRET) {
        console.error('Missing Stripe signature or webhook secret');
        return NextResponse.json(
            { error: 'Missing signature or webhook secret' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            authEnv.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    try {
        console.log(`Processing webhook event: ${event.type} (${event.id})`);
        const db = getDBInstance();

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription as string;

                console.log('Checkout session completed:', {
                    sessionId: session.id,
                    userId,
                    subscriptionId,
                    metadata: session.metadata,
                });

                if (!userId || !subscriptionId) {
                    console.error('Missing userId or subscriptionId in checkout session');
                    break;
                }

                // Get subscription details from Stripe
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                try {
                    // Insert subscription record using Drizzle ORM
                    await db
                        .insert(userSubscriptions)
                        .values({
                            id: `sub_${Date.now()}_${userId}`,
                            userId: userId,
                            stripeId: subscriptionId,
                            lewisAccess: true,
                            lewisSubscriptionTier: 'pro',
                            lewisPaymentStatus: 'active',
                            lewisSubscriptionStart: new Date(subscription.current_period_start * 1000),
                            lewisSubscriptionEnd: new Date(subscription.current_period_end * 1000),
                            status: 'active',
                            plan: 'lewis_pro',
                            recurring: true,
                            billingCycleStart: new Date(subscription.current_period_start * 1000),
                            billingCycleEnd: new Date(subscription.current_period_end * 1000),
                        });

                    console.log(`✅ Subscription activated for user ${userId}`);
                } catch (dbError) {
                    console.error('Database error in checkout.session.completed:', dbError);
                    console.error('Database error details:', {
                        message: dbError instanceof Error ? dbError.message : 'Unknown error',
                        stack: dbError instanceof Error ? dbError.stack : undefined,
                        userId,
                        subscriptionId
                    });
                    // Don't throw - let other webhooks handle the subscription
                }
                break;
            }

            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                console.log('Subscription created:', {
                    subscriptionId: subscription.id,
                    userId,
                    status: subscription.status,
                    metadata: subscription.metadata,
                });

                if (!userId) {
                    console.error('Missing userId in subscription metadata');
                    break;
                }

                try {
                    // Check if user already has a subscription record
                    const existingSubscription = await db
                        .select()
                        .from(userSubscriptions)
                        .where(eq(userSubscriptions.userId, userId))
                        .limit(1);

                    if (existingSubscription.length > 0) {
                        // Update existing record
                        await db
                            .update(userSubscriptions)
                            .set({
                                stripeId: subscription.id,
                                lewisAccess: true,
                                lewisSubscriptionTier: 'pro',
                                lewisPaymentStatus: 'active',
                                lewisSubscriptionStart: new Date(subscription.current_period_start * 1000),
                                lewisSubscriptionEnd: new Date(subscription.current_period_end * 1000),
                                status: 'active',
                                plan: 'lewis_pro',
                                recurring: true,
                                billingCycleStart: new Date(subscription.current_period_start * 1000),
                                billingCycleEnd: new Date(subscription.current_period_end * 1000),
                            })
                            .where(eq(userSubscriptions.userId, userId));
                    } else {
                        // Create new record
                        await db
                            .insert(userSubscriptions)
                            .values({
                                id: `sub_${Date.now()}_${userId}`,
                                userId: userId,
                                stripeId: subscription.id,
                                lewisAccess: true,
                                lewisSubscriptionTier: 'pro',
                                lewisPaymentStatus: 'active',
                                lewisSubscriptionStart: new Date(subscription.current_period_start * 1000),
                                lewisSubscriptionEnd: new Date(subscription.current_period_end * 1000),
                                status: 'active',
                                plan: 'lewis_pro',
                                recurring: true,
                                billingCycleStart: new Date(subscription.current_period_start * 1000),
                                billingCycleEnd: new Date(subscription.current_period_end * 1000),
                            });
                    }

                    console.log(`✅ Subscription created for user ${userId}`);
                } catch (dbError) {
                    console.error('Database error in customer.subscription.created:', dbError);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                console.log('Subscription updated:', {
                    subscriptionId: subscription.id,
                    userId,
                    status: subscription.status,
                    metadata: subscription.metadata,
                });

                if (!userId) {
                    console.error('Missing userId in subscription metadata');
                    break;
                }

                try {
                    // Update subscription status
                    await db
                        .update(userSubscriptions)
                        .set({
                            lewisPaymentStatus: subscription.status === 'active' ? 'active' : 'inactive',
                            lewisSubscriptionEnd: new Date(subscription.current_period_end * 1000),
                            status: subscription.status === 'active' ? 'active' : 'inactive',
                            billingCycleEnd: new Date(subscription.current_period_end * 1000),
                        })
                        .where(eq(userSubscriptions.userId, userId));

                    console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
                } catch (dbError) {
                    console.error('Database error in customer.subscription.updated:', dbError);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                if (!userId) {
                    console.error('Missing userId in subscription metadata');
                    break;
                }

                // Deactivate subscription
                await db
                    .update(userSubscriptions)
                    .set({
                        lewisAccess: false,
                        lewisPaymentStatus: 'cancelled',
                        status: 'cancelled',
                    })
                    .where(eq(userSubscriptions.userId, userId));

                console.log(`✅ Subscription cancelled for user ${userId}`);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;

                if (!subscriptionId) break;

                // Get subscription to find user
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata?.userId;

                if (!userId) break;

                try {
                    // Update payment status
                    await db
                        .update(userSubscriptions)
                        .set({
                            lewisPaymentStatus: 'active',
                            lewisSubscriptionEnd: new Date(subscription.current_period_end * 1000),
                            billingCycleEnd: new Date(subscription.current_period_end * 1000),
                        })
                        .where(eq(userSubscriptions.userId, userId));

                    console.log(`✅ Payment succeeded for user ${userId}`);
                } catch (dbError) {
                    console.error('Database error in invoice.payment_succeeded:', dbError);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;

                if (!subscriptionId) break;

                // Get subscription to find user
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata?.userId;

                if (!userId) break;

                try {
                    // Update payment status
                    await db
                        .update(userSubscriptions)
                        .set({
                            lewisPaymentStatus: 'failed',
                        })
                        .where(eq(userSubscriptions.userId, userId));

                    console.log(`❌ Payment failed for user ${userId}`);
                } catch (dbError) {
                    console.error('Database error in invoice.payment_failed:', dbError);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            eventType: event?.type,
            eventId: event?.id,
        });
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
