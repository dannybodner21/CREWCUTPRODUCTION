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
    const { hasLewisAccess } = useSubscription();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Auto-open portal if specified in URL
    useLewisPortalAutoOpen();

    // Handle URL parameters
    useEffect(() => {
        const autoOpen = searchParams.get('autoOpen');
        if (autoOpen === 'true') {
            // Portal will auto-open via useLewisPortalAutoOpen hook
        }
    }, [searchParams]);

    if (!hasLewisAccess) {
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
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>
                                L
                            </div>
                            <div>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: '#111827'
                                }}>
                                    LEWIS Construction AI
                                </h1>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#6b7280'
                                }}>
                                    Your AI construction consultant
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Upgrade
                            </button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div style={{
                        flex: 1,
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            maxWidth: '600px',
                            marginBottom: '32px'
                        }}>
                            <h2 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#111827',
                                marginBottom: '16px'
                            }}>
                                Welcome to LEWIS Construction AI
                            </h2>
                            <p style={{
                                fontSize: '16px',
                                color: '#6b7280',
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
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#6b7280'
                            }}>
                                {hasLewisAccess 
                                    ? 'Start a conversation with LEWIS to get construction insights and analysis.'
                                    : 'Upgrade to access the full LEWIS Construction AI experience.'
                                }
                            </p>
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