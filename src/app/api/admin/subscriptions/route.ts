import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '@/database/core/db-adaptor';
import { userSubscriptions } from '@/database/schemas';

export async function GET(request: NextRequest) {
    try {
        const db = await getServerDB();

        // Get all user subscriptions
        const subscriptions = await db
            .select()
            .from(userSubscriptions)
            .limit(50);

        // Get count of total subscriptions
        const countResult = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions');
        const totalCount = countResult.rows[0]?.count || 0;

        return NextResponse.json({
            success: true,
            totalCount: totalCount,
            subscriptions: subscriptions,
            message: `Found ${subscriptions.length} subscription records (showing first 50)`
        });

    } catch (error) {
        console.error('Admin subscriptions error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
