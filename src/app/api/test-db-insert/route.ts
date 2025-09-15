import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '@/database/core/db-adaptor';

export async function GET(request: NextRequest) {
    try {
        const db = await getServerDB();
        const userId = 'd4f7286e-0403-4c70-9451-f52cc70bfb56';

        console.log('🔧 TESTING DATABASE INSERT FOR USER:', userId);

        // Try to insert a simple record
        const result = await db.execute(`
            INSERT INTO user_subscriptions (id, user_id, lewis_access) 
            VALUES ($1, $2, $3)
        `, [
            `test_${Date.now()}`,
            userId,
            true
        ]);

        console.log('🔧 INSERT RESULT:', result);

        // Verify the insert
        const verification = await db.execute(`
            SELECT * FROM user_subscriptions WHERE user_id = $1
        `, [userId]);

        console.log('🔧 VERIFICATION:', verification.rows);

        return NextResponse.json({
            success: true,
            userId,
            result: result,
            records: verification.rows
        });

    } catch (error) {
        console.error('🔧 DATABASE INSERT ERROR:', error);
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
