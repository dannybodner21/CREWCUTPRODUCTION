import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';
import { useState } from 'react';

interface PaywallGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
    showUpgradeModal?: boolean;
}

export const PaywallGuard = ({
    children,
    fallback,
    showUpgradeModal = true
}: PaywallGuardProps) => {
    const { hasLewisAccess, isLoading } = useSubscription();
    const [showModal, setShowModal] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!hasLewisAccess) {
        if (fallback) {
            return <>{fallback}</>;
        }

        if (showUpgradeModal) {
            return (
                <>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 20px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        margin: '0 auto',
                        height: 'auto',
                        minHeight: '300px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            margin: '0 auto 16px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b7280' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '8px'
                        }}>
                            LEWIS Access Required
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '20px',
                            fontSize: '14px',
                            lineHeight: '1.5'
                        }}>
                            Upgrade to access LEWIS construction fee analysis and portal features.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                padding: '8px 24px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        >
                            Upgrade Now
                        </button>
                    </div>
                    <UpgradeModal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                    />
                </>
            );
        }

        return null;
    }

    return <>{children}</>;
};
