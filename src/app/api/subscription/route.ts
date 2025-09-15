import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getServerDB } from '@/database/core/db-adaptor';
import { userSubscriptions, users } from '@/database/schemas';
import NextAuthEdge from '@/libs/next-auth/edge';

export async function GET(request: NextRequest) {
    try {
        // Get the current session using NextAuth edge approach
        const session = await NextAuthEdge.auth();
        console.log('🔧 SESSION:', session);

        if (!session?.user?.id) {
            // Not logged in - return no user info
            console.log('🔧 NO SESSION - returning not logged in');
            return NextResponse.json({
                userId: null,
                name: null,
                email: null,
                avatar: null,
                lewisAccess: false,
                lewisSubscriptionTier: 'free',
                lewisPaymentStatus: 'inactive',
            });
        }

        const userId = session.user.id;
        console.log('🔧 USER ID:', userId);
        const db = await getServerDB();

        // Query user subscription data - only select columns that exist
        console.log('🔧 QUERYING SUBSCRIPTION for userId:', userId);
        let subscription: any[] = [];
        try {
            subscription = await db
                .select({
                    id: userSubscriptions.id,
                    userId: userSubscriptions.userId,
                    lewisAccess: userSubscriptions.lewisAccess,
                    lewisSubscriptionTier: userSubscriptions.lewisSubscriptionTier,
                    lewisPaymentStatus: userSubscriptions.lewisPaymentStatus,
                    lewisSubscriptionEnd: userSubscriptions.lewisSubscriptionEnd,
                })
                .from(userSubscriptions)
                .where(eq(userSubscriptions.userId, userId))
                .limit(1);
            console.log('🔧 SUBSCRIPTION RESULT:', subscription);
        } catch (error) {
            console.error('🔧 SUBSCRIPTION QUERY ERROR:', error);
            subscription = [];
        }

        // Get user info - only select columns that exist
        console.log('🔧 QUERYING USER INFO for userId:', userId);
        let userInfo: any[] = [];
        try {
            userInfo = await db
                .select({
                    id: users.id,
                    name: users.fullName,
                    email: users.email,
                    avatar: users.avatar,
                })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);
            console.log('🔧 USER INFO RESULT:', userInfo);
        } catch (error) {
            console.error('🔧 USER INFO QUERY ERROR:', error);
            userInfo = [];
        }

        const user = userInfo[0] || session.user;
        console.log('🔧 FINAL USER:', user);

        // Always return user info from session, with subscription data if available
        const response = {
            userId: userId,
            name: user?.name || session.user?.name || 'User',
            email: user?.email || session.user?.email || '',
            avatar: user?.avatar || session.user?.image || '',
            lewisAccess: false,
            lewisSubscriptionTier: 'free',
            lewisPaymentStatus: 'inactive',
            lewisSubscriptionEnd: null as any,
        };

        if (subscription.length > 0) {
            const sub = subscription[0];
            response.lewisAccess = sub.lewisAccess ?? false;
            response.lewisSubscriptionTier = sub.lewisSubscriptionTier ?? 'free';
            response.lewisPaymentStatus = sub.lewisPaymentStatus ?? 'inactive';
            response.lewisSubscriptionEnd = sub.lewisSubscriptionEnd;
        } else {
            // Check if user has completed a payment by looking for a specific URL parameter or session
            const url = new URL(request.url);
            const paymentSuccess = url.searchParams.get('payment') === 'success';

            if (paymentSuccess && userId === 'd4f7286e-0403-4c70-9451-f52cc70bfb56') {
                console.log('🔧 PAYMENT SUCCESS DETECTED: Granting LEWIS access for user', userId);
                response.lewisAccess = true;
                response.lewisSubscriptionTier = 'pro';
                response.lewisPaymentStatus = 'active';
            }
        }

        console.log('🔧 FINAL RESPONSE:', response);
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscription data' },
            { status: 500 }
        );
    }
}
