import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG, STRIPE_PRODUCTS } from '@/config/stripe';
import { authEnv } from '@/config/auth';
import NextAuthEdge from '@/libs/next-auth/edge';

export async function POST(request: NextRequest) {
    try {
        // Get the current user session
        const session = await NextAuthEdge.auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const userEmail = session.user.email || session.user.name || 'user@example.com';

        // Create Stripe Checkout session (TEST MODE)
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: STRIPE_CONFIG.CURRENCY,
                        product_data: {
                            name: `${STRIPE_PRODUCTS.LEWIS_PRO.name}${STRIPE_CONFIG.IS_TEST_MODE ? ' (TEST)' : ''}`,
                            description: STRIPE_PRODUCTS.LEWIS_PRO.description + (STRIPE_CONFIG.IS_TEST_MODE ? ' - This is a test transaction' : ''),
                        },
                        unit_amount: STRIPE_CONFIG.LEWIS_PRO_PRICE,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: STRIPE_CONFIG.SUCCESS_URL,
            cancel_url: STRIPE_CONFIG.CANCEL_URL,
            customer_email: userEmail,
            metadata: {
                userId: userId,
                product: 'lewis_pro',
                test_mode: STRIPE_CONFIG.IS_TEST_MODE.toString(),
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    product: 'lewis_pro',
                    test_mode: STRIPE_CONFIG.IS_TEST_MODE.toString(),
                },
            },
        });

        return NextResponse.json({
            sessionId: checkoutSession.id,
            url: checkoutSession.url
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
