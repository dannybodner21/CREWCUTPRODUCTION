import { NextRequest, NextResponse } from 'next/server';
import { getDBInstance } from '@/database/core/web-server';
import { userSubscriptions } from '@/database/schemas';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { userId, subscriptionId } = await request.json();

        console.log('🧪 Test webhook called with:', { userId, subscriptionId });

        const db = getDBInstance();

        // Insert test subscription record
        await db
            .insert(userSubscriptions)
            .values({
                id: `test_${Date.now()}_${userId}`,
                userId: userId,
                stripeId: subscriptionId,
                lewisAccess: true,
                lewisSubscriptionTier: 'pro',
                lewisPaymentStatus: 'active',
                lewisSubscriptionStart: new Date(),
                lewisSubscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'active',
                plan: 'lewis_pro',
                recurring: true,
                billingCycleStart: new Date(),
                billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

        console.log('✅ Test subscription created successfully');

        return NextResponse.json({
            success: true,
            message: 'Test subscription created',
            userId,
            subscriptionId
        });

    } catch (error) {
        console.error('❌ Test webhook failed:', error);
        return NextResponse.json(
            { error: 'Test webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
