'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/store/chat';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

/**
 * Hook that automatically opens the Construction Portal when Lewis is being used
 * This creates a split-screen experience: chat on left, portal on right
 */
export const useLewisPortalAutoOpen = () => {
    const [currentAgent, showPortal, togglePortal] = useChatStore((s) => [
        s.currentAgent,
        s.showPortal,
        s.togglePortal,
    ]);

    const currentSession = useSessionStore(sessionSelectors.currentSession);
    const [portalWidth, updateSystemStatus] = useGlobalStore((s) => [
        systemStatusSelectors.portalWidth(s),
        s.updateSystemStatus,
    ]);

    useEffect(() => {
        // Check if we're in a Lewis session
        const isLewisSession = currentSession?.agentId === 'lewis' ||
            currentAgent?.identifier === 'lewis' ||
            currentSession?.meta?.title?.toLowerCase().includes('lewis');

        // If it's a Lewis session and portal is not open, open it automatically
        if (isLewisSession && !showPortal) {
            console.log('🔧 LEWIS PORTAL: Auto-opening Construction Portal for Lewis session');
            togglePortal(true);

            // Set a better default width for Lewis sessions (split-screen experience)
            if (portalWidth < 600) {
                console.log('🔧 LEWIS PORTAL: Setting optimal portal width for split-screen');
                updateSystemStatus({ portalWidth: 600 });
            }
        }
    }, [currentSession, currentAgent, showPortal, togglePortal, portalWidth, updateSystemStatus]);

    // Listen for session changes to detect Lewis sessions immediately
    useEffect(() => {
        const unsubscribe = useSessionStore.subscribe(
            (s) => s.activeId,
            (activeId) => {
                if (activeId && activeId !== 'inbox') {
                    // Get the session details to check if it's Lewis
                    const session = useSessionStore.getState().sessions.find(s => s.id === activeId);
                    if (session) {
                        const isLewisSession = session.meta?.title?.toLowerCase().includes('lewis') ||
                            session.agentId === 'lewis';

                        if (isLewisSession && !showPortal) {
                            console.log('🔧 LEWIS PORTAL: Session switched to Lewis, opening portal immediately');
                            togglePortal(true);
                            if (portalWidth < 600) {
                                updateSystemStatus({ portalWidth: 600 });
                            }
                        }
                    }
                }
            }
        );

        return () => unsubscribe();
    }, [showPortal, togglePortal, portalWidth, updateSystemStatus]);

    // Immediate check on mount to catch already-active Lewis sessions
    useEffect(() => {
        const checkCurrentSession = () => {
            const currentActiveId = useSessionStore.getState().activeId;
            if (currentActiveId && currentActiveId !== 'inbox') {
                const session = useSessionStore.getState().sessions.find(s => s.id === currentActiveId);
                if (session) {
                    const isLewisSession = session.meta?.title?.toLowerCase().includes('lewis') ||
                        session.agentId === 'lewis';

                    if (isLewisSession && !showPortal) {
                        console.log('🔧 LEWIS PORTAL: Current session is Lewis, opening portal immediately');
                        togglePortal(true);
                        if (portalWidth < 600) {
                            updateSystemStatus({ portalWidth: 600 });
                        }
                    }
                }
            }
        };

        // Check immediately
        checkCurrentSession();

        // Also check after a short delay to ensure stores are fully initialized
        const timer = setTimeout(checkCurrentSession, 100);

        return () => clearTimeout(timer);
    }, [showPortal, togglePortal, portalWidth, updateSystemStatus]);

    return {
        isLewisSession: currentSession?.agentId === 'lewis' ||
            currentAgent?.identifier === 'lewis' ||
            currentSession?.meta?.title?.toLowerCase().includes('lewis'),
        showPortal,
        togglePortal,
    };
};
