import { StateCreator } from 'zustand/vanilla';

import { ChatStore } from '@/store/chat/store';
import { PortalArtifact } from '@/types/artifact';

import { PortalFile } from './initialState';

export interface ChatPortalAction {
  closeArtifact: () => void;
  closeFilePreview: () => void;
  closeMessageDetail: () => void;
  closeToolUI: () => void;
  openArtifact: (artifact: PortalArtifact) => void;
  openFilePreview: (portal: PortalFile) => void;
  openMessageDetail: (messageId: string) => void;
  openToolUI: (messageId: string, identifier: string) => void;
  togglePortal: (open?: boolean) => void;
}

export const chatPortalSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatPortalAction
> = (set, get) => ({
  closeArtifact: () => {
    get().togglePortal(false);
    set({ portalArtifact: undefined }, false, 'closeArtifact');
  },
  closeFilePreview: () => {
    set({ portalFile: undefined }, false, 'closeFilePreview');
  },
  closeMessageDetail: () => {
    set({ portalMessageDetail: undefined }, false, 'openMessageDetail');
  },
  closeToolUI: () => {
    set({ portalToolMessage: undefined }, false, 'closeToolUI');
  },
  openArtifact: (artifact) => {
    get().togglePortal(true);

    set({ portalArtifact: artifact }, false, 'openArtifact');
  },
  openFilePreview: (portal) => {
    get().togglePortal(true);

    set({ portalFile: portal }, false, 'openFilePreview');
  },
  openMessageDetail: (messageId) => {
    get().togglePortal(true);

    set({ portalMessageDetail: messageId }, false, 'openMessageDetail');
  },

  openToolUI: (id, identifier) => {
    console.log('🔧 PORTAL DEBUG: openToolUI called with:', { id, identifier });

    get().togglePortal(true);

    // First clear all portal states to show the home page
    set({
      portalArtifact: undefined,
      portalFile: undefined,
      portalMessageDetail: undefined,
      portalThreadId: undefined,
      threadStartMessageId: undefined,
      portalToolMessage: undefined,
    }, false, 'openToolUI/clear');

    console.log('🔧 PORTAL DEBUG: Portal states cleared, setting tool message...');

    // For LEWIS tool, just open the portal directly without checking message content
    if (identifier === 'lewis') {
      console.log('🔧 PORTAL DEBUG: LEWIS tool detected, opening portal directly');
      const portalState = { id, identifier };
      console.log('🔧 PORTAL DEBUG: Setting portalToolMessage to:', portalState);
      set({ portalToolMessage: portalState }, false, 'openToolUI/setLewisTool');

      // Verify the state was set
      setTimeout(() => {
        const currentState = get().portalToolMessage;
        console.log('🔧 PORTAL DEBUG: Portal state after setting:', currentState);
        console.log('🔧 PORTAL DEBUG: Current portal state:', {
          showPortal: get().showPortal,
          portalToolMessage: get().portalToolMessage,
          showPluginUI: !!get().portalToolMessage
        });
      }, 100);
      return;
    }

    // For other tools, check if the message content is available before opening the portal
    const checkMessageContent = () => {
      const message = get().messagesMap[get().activeId]?.find(m => m.id === id);
      console.log('🔧 PORTAL DEBUG: Checking message content:', {
        messageId: id,
        hasMessage: !!message,
        messageContent: message?.content,
        contentLength: message?.content?.length || 0,
        activeId: get().activeId,
        messagesMapKeys: Object.keys(get().messagesMap || {}),
        allMessages: get().messagesMap[get().activeId]?.map(m => ({ id: m.id, role: m.role, contentLength: m.content?.length || 0 })),
        messageStructure: message ? {
          id: message.id,
          role: message.role,
          content: message.content,
          plugin: message.plugin,
          tool_call_id: message.tool_call_id
        } : null
      });

      if (message?.content && message.content.length > 10) {
        // Message content is available, open the portal
        console.log('🔧 PORTAL DEBUG: Message content available, opening portal');
        const portalState = { id, identifier };
        console.log('🔧 PORTAL DEBUG: Setting portalToolMessage to:', portalState);
        set({ portalToolMessage: portalState }, false, 'openToolUI/setTool');

        // Verify the state was set
        setTimeout(() => {
          const currentState = get().portalToolMessage;
          console.log('🔧 PORTAL DEBUG: Portal state after setting:', currentState);
          console.log('🔧 PORTAL DEBUG: Current portal state:', {
            showPortal: get().showPortal,
            portalToolMessage: get().portalToolMessage,
            showPluginUI: !!get().portalToolMessage
          });
        }, 100);
      } else {
        // Message content not ready yet, wait a bit more
        console.log('🔧 PORTAL DEBUG: Message content not ready, waiting...');
        setTimeout(checkMessageContent, 200);
      }
    };

    // Start checking for message content
    setTimeout(checkMessageContent, 100);
  },
  togglePortal: (open) => {
    const showInspector = open === undefined ? !get().showPortal : open;
    set({ showPortal: showInspector }, false, 'toggleInspector');
  },
  // updateArtifactContent: (content) => {
  //   set({ portalArtifact: content }, false, 'updateArtifactContent');
  // },
});
