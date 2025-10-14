import { CollapseProps, Button } from 'antd';
import isEqual from 'fast-deep-equal';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, Lock, X, MessageCircle } from 'lucide-react';

import { useFetchSessions } from '@/hooks/useFetchSessions';
import { useSubscription } from '@/hooks/useSubscription';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { SessionDefaultGroup } from '@/types/session';
import { useChatStore } from '@/store/chat';

import CollapseGroup from './CollapseGroup';
import Actions from './CollapseGroup/Actions';
import Inbox from './Inbox';
import SessionList from './List';
import ConfigGroupModal from './Modals/ConfigGroupModal';
import RenameGroupModal from './Modals/RenameGroupModal';

const DefaultMode = memo(() => {
  const { t } = useTranslation('chat');

  const [activeGroupId, setActiveGroupId] = useState<string>();
  const [renameGroupModalOpen, setRenameGroupModalOpen] = useState(false);
  const [configGroupModalOpen, setConfigGroupModalOpen] = useState(false);
  const [lewisModalOpen, setLewisModalOpen] = useState(false);

  useFetchSessions();

  // Get portal functions
  const togglePortal = useChatStore((s) => s.togglePortal);

  // Get subscription status
  const { hasLewisAccess, isLoading: subscriptionLoading } = useSubscription();

  // Function to create LEWIS session
  const createLewisSession = () => {
    const { createSession } = useSessionStore.getState();
    const lewisAgent = {
      agentId: 'lewis',
      identifier: 'lewis',
      meta: {
        title: 'LEWIS',
        description: 'Construction fee and development location expert',
        avatar: '/images/logo/crewcut_logo.png'
      }
    };
    createSession(lewisAgent);
  };

  // Function to create Default Chat session
  const createDefaultSession = () => {
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
    createSession(defaultAgent);
  };

  const defaultSessions = useSessionStore(sessionSelectors.defaultSessions, isEqual);
  const customSessionGroups = useSessionStore(sessionSelectors.customSessionGroups, isEqual);
  const pinnedSessions = useSessionStore(sessionSelectors.pinnedSessions, isEqual);

  const [sessionGroupKeys, updateSystemStatus] = useGlobalStore((s) => [
    systemStatusSelectors.sessionGroupKeys(s),
    s.updateSystemStatus,
  ]);

  const items = useMemo(
    () =>
      [
        pinnedSessions &&
        pinnedSessions.length > 0 && {
          children: <SessionList dataSource={pinnedSessions} />,
          extra: <Actions isPinned openConfigModal={() => setConfigGroupModalOpen(true)} />,
          key: SessionDefaultGroup.Pinned,
          label: t('pin'),
        },
        ...(customSessionGroups || []).map(({ id, name, children }) => ({
          children: <SessionList dataSource={children} groupId={id} />,
          extra: (
            <Actions
              id={id}
              isCustomGroup
              onOpenChange={(isOpen) => {
                if (isOpen) setActiveGroupId(id);
              }}
              openConfigModal={() => setConfigGroupModalOpen(true)}
              openRenameModal={() => setRenameGroupModalOpen(true)}
            />
          ),
          key: id,
          label: name,
        })),
        {
          children: <SessionList dataSource={defaultSessions || []} />,
          extra: <Actions openConfigModal={() => setConfigGroupModalOpen(true)} />,
          key: SessionDefaultGroup.Default,
          label: t('defaultList'),
        },
      ].filter(Boolean) as CollapseProps['items'],
    [t, customSessionGroups, pinnedSessions, defaultSessions],
  );

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% -200%;
          }
          100% {
            background-position: 200% 200%;
          }
        }
      `}</style>
      <Inbox />

      {/* Default Chat Button */}
      <div style={{ padding: '16px 16px 8px 16px', textAlign: 'center' }}>
        <Button
          icon={<MessageCircle size={16} />}
          onClick={createDefaultSession}
          size="large"
          style={{
            height: 48,
            fontSize: 16,
            paddingInline: 24,
            borderRadius: 8,
            width: '100%',
            maxWidth: 280,
            backgroundColor: '#ffffff',
            borderColor: '#6b7280',
            borderWidth: '1px',
            color: '#000000',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s ease-in-out infinite',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          type="default"
        >
          Default Chat
        </Button>
      </div>

      {/* Lewis Button */}
      <div style={{ padding: '8px 16px 16px 16px', textAlign: 'center' }}>
        <Button
          icon={hasLewisAccess ? <Building size={16} /> : <Lock size={16} />}
          onClick={() => {
            if (hasLewisAccess) {
              createLewisSession();
            }
            // If no access, the button is disabled and shows lock icon
          }}
          disabled={!hasLewisAccess || subscriptionLoading}
          size="large"
          style={{
            height: 48,
            fontSize: 16,
            paddingInline: 24,
            borderRadius: 8,
            width: '100%',
            maxWidth: 280,
            borderColor: hasLewisAccess ? '#6b7280' : '#d1d5db',
            borderWidth: '1px',
            color: hasLewisAccess ? '#000000' : '#9ca3af',
            backgroundColor: hasLewisAccess ? '#ffffff' : '#f3f4f6',
            backgroundImage: hasLewisAccess
              ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%)'
              : 'none',
            backgroundSize: '200% 200%',
            animation: hasLewisAccess ? 'shimmer 3s ease-in-out infinite' : 'none',
            boxShadow: hasLewisAccess
              ? '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            cursor: hasLewisAccess ? 'pointer' : 'not-allowed',
          }}
          type="default"
        >
          {hasLewisAccess ? 'LEWIS' : 'LEWIS (Locked)'}
        </Button>

        {/* Unlock LEWIS Link - Only show for locked users */}
        {!hasLewisAccess && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => setLewisModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Unlock LEWIS
            </button>
          </div>
        )}
      </div>

      <CollapseGroup
        activeKey={sessionGroupKeys}
        items={items}
        onChange={(keys) => {
          const expandSessionGroupKeys = typeof keys === 'string' ? [keys] : keys;

          updateSystemStatus({ expandSessionGroupKeys });
        }}
      />
      {activeGroupId && (
        <RenameGroupModal
          id={activeGroupId}
          onCancel={() => setRenameGroupModalOpen(false)}
          open={renameGroupModalOpen}
        />
      )}
      <ConfigGroupModal
        onCancel={() => setConfigGroupModalOpen(false)}
        open={configGroupModalOpen}
      />

      {/* LEWIS Modal */}
      {lewisModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setLewisModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px 16px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                }}
              >
                LEWIS
              </h2>
              <button
                onClick={() => setLewisModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: '24px',
                flex: 1,
                overflow: 'auto',
              }}
            >
              {/* LEWIS Overview */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  What is LEWIS?
                </h3>
                <p style={{
                  margin: '0 0 16px 0',
                  color: '#4b5563',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  LEWIS is your AI construction consultant that revolutionizes how you plan and analyze development projects.
                  Get instant fee analysis, jurisdiction comparisons, and feasibility reports for any construction project across the US.
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    Key Features:
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: '#4b5563',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <li><strong>AI Chat Interface:</strong> Ask LEWIS anything about construction fees, regulations, and market conditions</li>
                    <li><strong>Construction Portal:</strong> Interactive dashboard for project analysis and fee calculations</li>
                    <li><strong>Comprehensive Fee Breakdowns:</strong> Detailed analysis of all permit fees, impact fees, and development costs</li>
                    <li><strong>Jurisdiction Comparisons:</strong> Side-by-side analysis of multiple locations with ranked recommendations</li>
                    <li><strong>Feasibility Reports:</strong> Download professional reports for stakeholders and investors (coming soon)</li>
                    <li><strong>Real-time Data:</strong> Access to 50,000+ construction fees across 75+ major US jurisdictions</li>
                  </ul>
                </div>

                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e0f2fe'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0c4a6e'
                  }}>
                    Save Time & Money:
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: '#0c4a6e',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <li><strong>40+ hours</strong> of manual research eliminated per project</li>
                    <li><strong>$15,000+</strong> in consultant fees saved per project</li>
                    <li><strong>Minutes instead of months</strong> to generate comprehensive feasibility reports</li>
                    <li><strong>Instant access</strong> to fee data that would take weeks to collect manually</li>
                  </ul>
                </div>
              </div>

              {/* Subscription Card */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Shimmer effect background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  animation: 'shimmer 3s ease-in-out infinite'
                }} />

                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  LEWIS Pro Subscription
                </h3>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#2563eb',
                    marginBottom: '4px'
                  }}>
                    $5,000
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>/month</span>
                  </div>
                  <p style={{
                    margin: 0,
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Billed monthly • Cancel anytime
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    What's Included:
                  </h4>
                  <ul style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    textAlign: 'left',
                    color: '#4b5563',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <li style={{ marginBottom: '8px' }}>✓ Unlimited LEWIS chat sessions</li>
                    <li style={{ marginBottom: '8px' }}>✓ Full construction portal access</li>
                    <li style={{ marginBottom: '8px' }}>✓ Jurisdiction fee analysis & comparisons</li>
                    <li style={{ marginBottom: '8px' }}>✓ Project cost calculations & breakdowns</li>
                    <li style={{ marginBottom: '8px' }}>✓ Real-time fee data across 75+ jurisdictions</li>
                    <li style={{ marginBottom: '8px' }}>✓ Feasibility report generation</li>
                    <li style={{ marginBottom: '8px' }}>✓ Export reports and data</li>
                    <li style={{ marginBottom: '8px' }}>✓ Priority support</li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    // TODO: Integrate with Stripe
                    console.log('Subscribe clicked - Stripe integration coming soon');
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
                    boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(37, 99, 235, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(37, 99, 235, 0.4)';
                  }}
                >
                  Subscribe Now
                </button>

                <p style={{
                  margin: '12px 0 0 0',
                  color: '#9ca3af',
                  fontSize: '12px'
                }}>
                  Secure payment powered by Stripe • 30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

DefaultMode.displayName = 'SessionDefaultMode';

export default DefaultMode;
