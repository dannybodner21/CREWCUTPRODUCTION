'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSessionStore } from '@/store/session';
import { useUserStore } from '@/store/user';
import { useEffect, useState, Suspense } from 'react';
import { UpgradeModal } from '@/components/UpgradeModal';

function VariantsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUserStore();
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Fetch user info on component mount and when user state changes
    useEffect(() => {
        const fetchUserInfo = async () => {
            setIsLoading(true);
            try {
                // Add a small delay if we just came from a login redirect
                const isLoginRedirect = searchParams.get('callbackUrl') || (typeof window !== 'undefined' && window.location.search.includes('callbackUrl'));
                if (isLoginRedirect) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                const response = await fetch('/api/subscription');
                const data = await response.json();
                console.log('🔧 USER INFO FETCHED:', data);
                if (data.userId) {
                    setUserInfo(data);
                } else {
                    setUserInfo(null);
                }
            } catch (error) {
                console.error('Failed to fetch user info:', error);
                setUserInfo(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserInfo();
    }, [user, searchParams]); // Re-fetch when user state or URL params change

    // Check for upgrade parameter and show modal
    useEffect(() => {
        const upgrade = searchParams.get('upgrade');
        if (upgrade === 'true' && userInfo && !userInfo.lewisAccess) {
            setShowUpgradeModal(true);
        }
    }, [searchParams, userInfo]);

    // Handle payment success/failure
    useEffect(() => {
        const payment = searchParams.get('payment');
        if (payment === 'success') {
            console.log('🎉 Payment successful! Refreshing user data...');
            // Refresh user info to get updated subscription status
            const fetchUserInfo = async () => {
                try {
                    const response = await fetch('/api/subscription');
                    const data = await response.json();
                    console.log('🔧 USER INFO UPDATED AFTER PAYMENT:', data);
                    console.log('🔧 LEWIS ACCESS STATUS:', data.lewisAccess);
                    setUserInfo(data);
                } catch (error) {
                    console.error('Failed to fetch user info after payment:', error);
                }
            };
            fetchUserInfo();
        } else if (payment === 'cancelled') {
            console.log('❌ Payment cancelled');
        }
    }, [searchParams]);

    const handleAccessChat = async () => {
        // Create a default session first
        const { createSession } = useSessionStore.getState();
        const defaultAgent = {
            agentId: 'default',
            identifier: 'default',
            meta: {
                title: 'CREW CUT Assistant',
                description: 'Your helpful AI assistant',
                avatar: '🤖'
            }
        };

        try {
            const sessionId = await createSession(defaultAgent);
            console.log('🔧 CREATED DEFAULT SESSION:', sessionId);

            // Navigate to the specific session
            if (sessionId) {
                router.push(`/en-US__0__light/chat?session=${sessionId}`);
            } else {
                router.push('/en-US__0__light/chat');
            }
        } catch (error) {
            console.error('Failed to create default session:', error);
            router.push('/en-US__0__light/chat');
        }
    };

    const handleAccessLewis = async () => {
        console.log('🔧 ACCESS LEWIS CLICKED');
        console.log('🔧 Current userInfo state:', userInfo);
        console.log('🔧 Is Loading:', isLoading);
        console.log('🔧 userInfo.lewisAccess:', userInfo?.lewisAccess);
        console.log('🔧 userInfo.lewisSubscriptionTier:', userInfo?.lewisSubscriptionTier);
        console.log('🔧 userInfo.lewisPaymentStatus:', userInfo?.lewisPaymentStatus);

        // Don't process if still loading subscription data
        if (isLoading) {
            console.log('🔧 Still loading subscription data, please wait...');
            return;
        }

        try {
            // Check if user is logged in using already-loaded state
            if (!userInfo || !userInfo.userId) {
                // Not logged in - redirect to Google SSO
                console.log('🔧 LEWIS ACCESS: User not logged in, redirecting to SSO');
                const callbackUrl = encodeURIComponent('/en-US__0__light?upgrade=true');
                router.push(`/next-auth/signin?callbackUrl=${callbackUrl}`);
                return;
            }

            // Check if user has LEWIS access using already-loaded state
            console.log('🔧 LEWIS ACCESS CHECK:', {
                lewisAccess: userInfo.lewisAccess,
                type: typeof userInfo.lewisAccess,
                truthyCheck: !!userInfo.lewisAccess,
                exactlyFalse: userInfo.lewisAccess === false,
                exactlyTrue: userInfo.lewisAccess === true
            });

            if (!userInfo.lewisAccess) {
                // Logged in but no LEWIS access - show upgrade modal
                console.log('🔧 LEWIS ACCESS: User logged in but no LEWIS access, showing upgrade modal');
                console.log('🔧 LEWIS ACCESS: Full userInfo:', JSON.stringify(userInfo, null, 2));
                setShowUpgradeModal(true);
                return;
            }

            // User has LEWIS access - navigate to chat inbox
            console.log('🔧 LEWIS ACCESS: User has access, navigating to chat inbox');
            router.push('/en-US__0__light/chat');
        } catch (error) {
            console.error('Failed to check LEWIS access:', error);
            // On error, show upgrade modal
            setShowUpgradeModal(true);
        }
    };
    return (
        <>
            <style jsx global>{`
                html, body, #__next {
                    background-color: white !important;
                    margin: 0;
                    padding: 0;
                }
                
                .shimmer-button {
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%);
                    background-size: 200% 200%;
                    animation: shimmer 3s ease-in-out infinite;
                }
                
                .shimmer-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
                    animation: shimmerMove 2s infinite;
                }
                
                @keyframes shimmer {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                
                @keyframes shimmerMove {
                    0% {
                        left: -100%;
                    }
                    100% {
                        left: 100%;
                    }
                }
                
                .shimmer-button:hover {
                    animation: none;
                }
                
                .shimmer-button:hover::before {
                    animation: none;
                }
            `}</style>
            <style dangerouslySetInnerHTML={{
                __html: `
                    .shimmer-button {
                        position: relative;
                        overflow: hidden;
                        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%);
                        background-size: 200% 200%;
                        animation: shimmer 3s ease-in-out infinite;
                    }
                    
                    .shimmer-button::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
                        animation: shimmerMove 2s infinite;
                    }
                    
                    @keyframes shimmer {
                        0% {
                            background-position: 0% 50%;
                        }
                        50% {
                            background-position: 100% 50%;
                        }
                        100% {
                            background-position: 0% 50%;
                        }
                    }
                    
                    @keyframes shimmerMove {
                        0% {
                            left: -100%;
                        }
                        100% {
                            left: 100%;
                        }
                    }
                    
                    .shimmer-button:hover {
                        animation: none;
                    }
                    
                    .shimmer-button:hover::before {
                        animation: none;
                    }
                `
            }} />
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'white',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Header div at top */}
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '70px',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 30px',
                    zIndex: 1000
                }}>
                    {/* Left side - Login/User info */}
                    <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-start' }}>
                        {isLoading ? (
                            <div style={{
                                color: '#6b7280',
                                fontSize: '14px'
                            }}>
                                Checking...
                            </div>
                        ) : userInfo ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                {userInfo.avatar && (
                                    <img
                                        src={userInfo.avatar}
                                        alt="User Avatar"
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                )}
                                <div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        lineHeight: '1.2'
                                    }}>
                                        Logged in as:
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#111827',
                                        lineHeight: '1.2'
                                    }}>
                                        {userInfo.name || userInfo.email || 'User'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        // Sign out using NextAuth
                                        window.location.href = '/api/auth/signout';
                                    }}
                                    style={{
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#e5e7eb';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#f3f4f6';
                                    }}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <a
                                href="/next-auth/signin"
                                style={{
                                    display: 'inline-block',
                                    backgroundColor: '#ffffff',
                                    color: '#000000',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '20px',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ffffff';
                                }}
                            >
                                Login with Google
                            </a>
                        )}
                    </div>

                    {/* Center - Logo */}
                    <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
                        <img
                            src="/images/logo/crewcut_logo.png?v=123"
                            alt="CREW CUT Logo"
                            style={{
                                height: '50px',
                                width: 'auto'
                            }}
                        />
                    </div>

                    {/* Right side - What is CREWCUT button */}
                    <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            style={{
                                backgroundColor: '#f8fafc',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#e5e7eb';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#f8fafc';
                            }}
                        >
                            What is CREWCUT?
                        </button>
                    </div>
                </div>

                {/* Spacer to account for fixed header */}
                <div style={{ height: '110px' }}></div>

                {/* Cards container */}
                <div style={{
                    display: 'flex',
                    gap: '40px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '30px'
                }}>
                    {/* CREWCUT Chat Card */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        width: '400px',
                        textAlign: 'center',
                        border: '1px solid #e0e0e0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>

                        <div style={{ marginBottom: '16px' }}>
                            <img
                                src="/images/crewcut.png"
                                alt="CREW CUT"
                                style={{
                                    height: '80px',
                                    width: 'auto'
                                }}
                            />
                        </div>
                        <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#333' }}>
                            CREWCUT Chat
                        </h2>
                        <ul style={{
                            textAlign: 'left',
                            marginBottom: '24px',
                            color: '#666',
                            lineHeight: '1.6'
                        }}>
                            <li>Choose your preferred LLM</li>
                            <li>Ask questions and get answers</li>
                            <li>General AI assistance</li>
                            <li>Free to use</li>
                        </ul>
                        <button
                            onClick={handleAccessChat}
                            className="shimmer-button"
                            style={{
                                display: 'block',
                                color: '#000000',
                                border: '1px solid #6b7280',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '16px',
                                textAlign: 'center',
                                width: '100%',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                                e.target.style.animation = 'none';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
                                e.target.style.animation = 'shimmer 3s ease-in-out infinite';
                            }}
                        >
                            Access Chat
                        </button>
                    </div>

                    {/* LEWIS Card */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        width: '400px',
                        textAlign: 'center',
                        border: '1px solid #e0e0e0'
                    }}>
                        <div style={{ marginBottom: '16px' }}>
                            <img
                                src="/images/lewis.png"
                                alt="LEWIS"
                                style={{
                                    height: '80px',
                                    width: 'auto'
                                }}
                            />
                        </div>
                        <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#333' }}>
                            LEWIS
                        </h2>
                        <ul style={{
                            textAlign: 'left',
                            marginBottom: '24px',
                            color: '#666',
                            lineHeight: '1.6'
                        }}>
                            <li>AI construction expert</li>
                            <li>Jurisdiction fee analysis</li>
                            <li>Project comparisons</li>
                            <li>Feasibility reports</li>
                        </ul>
                        <button
                            onClick={handleAccessLewis}
                            className="shimmer-button"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: '#000000',
                                border: '1px solid #6b7280',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '16px',
                                textAlign: 'center',
                                width: '100%',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                                e.target.style.animation = 'none';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
                                e.target.style.animation = 'shimmer 3s ease-in-out infinite';
                            }}
                        >
                            {(!userInfo || !userInfo.lewisAccess) && (
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            )}
                            {(!userInfo || !userInfo.lewisAccess) ? 'Unlock LEWIS' : 'Access LEWIS'}
                        </button>
                    </div>
                </div>

                {/* Large CREWCUT text at bottom */}
                <div style={{
                    position: 'fixed',
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                }}>
                    <div style={{
                        fontFamily: 'Exo, Arial, sans-serif',
                        fontSize: '250px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to bottom, #f3f4f6 0%, #ffffff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textAlign: 'center',
                        lineHeight: '1',
                        marginBottom: '-80px', // Negative margin to cut off bottom half
                        userSelect: 'none',
                        pointerEvents: 'none'
                    }}>
                        CREWCUT
                    </div>
                </div>

            </div>

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </>
    );
}

export default function VariantsPage() {
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
            <VariantsPageContent />
        </Suspense>
    );
}
