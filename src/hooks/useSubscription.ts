import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';

interface SubscriptionData {
    lewisAccess: boolean;
    lewisSubscriptionTier: 'free' | 'paid' | 'pro';
    lewisPaymentStatus: 'active' | 'inactive' | 'cancelled';
    lewisSubscriptionEnd?: string;
}

export const useSubscription = () => {
    const { user } = useUserStore();

    const { data: subscription, isLoading, error } = useQuery<SubscriptionData>({
        queryKey: ['subscription', user?.id],
        queryFn: async () => {
            if (!user?.id) {
                console.log('🔧 useSubscription: No user ID, returning default');
                return {
                    lewisAccess: false,
                    lewisSubscriptionTier: 'free',
                    lewisPaymentStatus: 'inactive',
                };
            }

            console.log('🔧 useSubscription: Fetching subscription for user:', user.id);
            const response = await fetch('/api/subscription');
            if (!response.ok) {
                throw new Error('Failed to fetch subscription data');
            }
            const data = await response.json();
            console.log('🔧 useSubscription: Received data:', data);
            return data;
        },
        enabled: !!user?.id,
        staleTime: 30 * 1000, // 30 seconds - reduced for testing
        refetchOnWindowFocus: true,
    });

    const hasLewisAccess = subscription?.lewisAccess ?? false;
    const isPaidUser = subscription?.lewisSubscriptionTier === 'paid' || subscription?.lewisSubscriptionTier === 'pro';
    const isActive = subscription?.lewisPaymentStatus === 'active';

    return {
        subscription,
        hasLewisAccess,
        isPaidUser,
        isActive,
        isLoading,
        error,
    };
};
