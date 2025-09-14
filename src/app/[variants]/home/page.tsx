'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    const handleAccessChat = () => {
        router.push('/en-US__0__light/chat');
    };

    const handleAccessLewis = () => {
        router.push('/en-US__0__light/lewis');
    };

    const handleLogin = () => {
        // Redirect to Google SSO login
        router.push('/api/auth/signin/google');
    };
    return (
        <>
            <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .shimmer-button {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%);
          background-size: 200% 200%;
          animation: shimmer 3s ease-in-out infinite;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }
        
        .shimmer-button:hover {
          animation: none;
          background: #ffffff;
          box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .login-shimmer-button {
          background: linear-gradient(135deg, #000000 0%, #2a2a2a 25%, #000000 50%, #1a1a1a 75%, #000000 100%);
          background-size: 200% 200%;
          animation: shimmer 3s ease-in-out infinite;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }
        
        .login-shimmer-button:hover {
          animation: none;
          background: #000000;
          box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        
        html, body {
          background-color: white !important;
          margin: 0;
          padding: 0;
        }
        
        #__next {
          background-color: white !important;
        }
      `}</style>

            <div style={{
                minHeight: '100vh',
                backgroundColor: 'white',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Logo at top center */}
                <div style={{ marginBottom: '60px' }}>
                    <img
                        src="/images/logo/crewcut_logo.png?v=123"
                        alt="CREW CUT Logo"
                        style={{
                            height: '80px',
                            width: 'auto'
                        }}
                    />
                </div>

                {/* Cards container */}
                <div style={{
                    display: 'flex',
                    gap: '40px',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Default Chat Card */}
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
                                src="/images/crewcut.png"
                                alt="CREW CUT"
                                style={{
                                    height: '80px',
                                    width: 'auto'
                                }}
                            />
                        </div>
                        <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#333' }}>
                            Default Chat
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
                            className="shimmer-button"
                            onClick={handleAccessChat}
                            style={{
                                backgroundColor: '#ffffff',
                                color: '#000000',
                                border: '1px solid #6b7280',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                width: '100%',
                                position: 'relative',
                                overflow: 'hidden'
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
                            className="shimmer-button"
                            onClick={handleAccessLewis}
                            style={{
                                backgroundColor: '#ffffff',
                                color: '#000000',
                                border: '1px solid #6b7280',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                width: '100%',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            Access LEWIS
                        </button>
                    </div>
                </div>

                {/* Login Button */}
                <div style={{
                    marginTop: '60px',
                    textAlign: 'center'
                }}>
                    <button
                        className="login-shimmer-button"
                        onClick={handleLogin}
                        style={{
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 32px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        Login with Google
                    </button>
                </div>
            </div>
        </>
    );
}
