import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';

interface SubscriptionData {
    lewisAccess: boolean;
    lewisSubscriptionTier: 'free' | 'paid';
    lewisPaymentStatus: 'active' | 'inactive' | 'cancelled';
    lewisSubscriptionEnd?: string;
}

export const useSubscription = () => {
    const { user } = useUserStore();

    const { data: subscription, isLoading, error } = useQuery<SubscriptionData>({
        queryKey: ['subscription', user?.id],
        queryFn: async () => {
            if (!user?.id) {
                return {
                    lewisAccess: false,
                    lewisSubscriptionTier: 'free',
                    lewisPaymentStatus: 'inactive',
                };
            }

            const response = await fetch(`/api/subscription?userId=${user.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch subscription data');
            }
            return response.json();
        },
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const hasLewisAccess = subscription?.lewisAccess ?? false;
    const isPaidUser = subscription?.lewisSubscriptionTier === 'paid';
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
