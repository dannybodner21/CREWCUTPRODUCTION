'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { useSessionStore } from '@/store/session';
import { PaywallGuard } from '@/components/PaywallGuard';
import CustomLewisPortal from '@/components/CustomLewisPortal';
import LewisPortalButton from '@/components/LewisPortalButton';
import { useLewisPortalAutoOpen } from '@/hooks/useLewisPortalAutoOpen';
import { UpgradeModal } from '@/components/UpgradeModal';

function LewisPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { hasLewisAccess, isLoading: subscriptionLoading } = useSubscription();
    const { createSession } = useSessionStore();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Auto-open portal for LEWIS sessions
    useLewisPortalAutoOpen();

    // Check for unlock parameter and show upgrade modal
    useEffect(() => {
        const unlock = searchParams.get('unlock');
        if (unlock === 'true' && !hasLewisAccess) {
            setShowUpgradeModal(true);
        }
    }, [searchParams, hasLewisAccess]);

    useEffect(() => {
        // Create LEWIS session when page loads
        if (hasLewisAccess) {
            const lewisAgent = {
                agentId: 'lewis',
                identifier: 'lewis',
                meta: {
                    title: 'LEWIS',
                    description: 'Construction fee and development location expert',
                    avatar: '🏗️'
                }
            };
            createSession(lewisAgent);
        }
    }, [hasLewisAccess, createSession]);

    if (subscriptionLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#6b7280'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{
                display: 'flex',
                height: '100vh',
                backgroundColor: '#f8fafc'
            }}>
                {/* Chat Area */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #e5e7eb'
                }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#059669',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                            }}>
                                🏗️
                            </div>
                            <div>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#111827'
                                }}>
                                    LEWIS
                                </h1>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#6b7280'
                                }}>
                                    Construction fee and development location expert
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#374151'
                            }}
                        >
                            ← Back to Home
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '24px',
                        overflow: 'auto',
                        backgroundColor: '#f8fafc'
                    }}>
                        {/* Welcome Message */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '16px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                margin: '0 0 16px 0',
                                fontSize: '24px',
                                fontWeight: '600',
                                color: '#111827'
                            }}>
                                Welcome to LEWIS
                            </h2>
                            <p style={{
                                margin: '0 0 20px 0',
                                fontSize: '16px',
                                color: '#4b5563',
                                lineHeight: '1.6'
                            }}>
                                I'm your AI construction consultant. I can help you analyze construction fees,
                                compare jurisdictions, and find the best locations for your development projects.
                            </p>

                            {/* Portal Buttons */}
                            <div style={{ marginTop: '20px' }}>
                                <LewisPortalButton />
                            </div>
                        </div>

                        {/* Chat Interface Placeholder */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            opacity: hasLewisAccess ? 1 : 0.5,
                            pointerEvents: hasLewisAccess ? 'auto' : 'none'
                        }}>
                            {hasLewisAccess ? (
                                <p style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    color: '#6b7280',
                                    textAlign: 'center'
                                }}>
                                    Chat interface will be integrated here
                                </p>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '20px'
                                }}>
                                    <div style={{
                                        fontSize: '48px',
                                        marginBottom: '16px'
                                    }}>
                                        🔒
                                    </div>
                                    <h3 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '18px',
                                        color: '#374151'
                                    }}>
                                        LEWIS Access Required
                                    </h3>
                                    <p style={{
                                        margin: '0 0 16px 0',
                                        fontSize: '14px',
                                        color: '#6b7280'
                                    }}>
                                        Please upgrade your subscription to access LEWIS features
                                    </p>
                                    <button
                                        onClick={() => setShowUpgradeModal(true)}
                                        style={{
                                            backgroundColor: '#000000',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '12px 24px',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Unlock LEWIS
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Portal Area */}
                <div style={{
                    width: '600px',
                    backgroundColor: '#ffffff',
                    borderLeft: '1px solid #e5e7eb',
                    overflow: 'auto'
                }}>
                    <CustomLewisPortal />
                </div>
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <UpgradeModal
                    open={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}
        </div>
    );
}

export default function LewisPage() {
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#6b7280'
            }}>
                Loading...
            </div>
        }>
            <LewisPageContent />
        </Suspense>
    );
}
