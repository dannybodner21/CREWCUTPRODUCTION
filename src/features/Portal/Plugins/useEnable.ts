import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';

export const useEnable = () => {
  const showPluginUI = useChatStore(chatPortalSelectors.showPluginUI);
  const portalToolMessage = useChatStore(chatPortalSelectors.toolMessageId);
  const toolUIIdentifier = useChatStore(chatPortalSelectors.toolUIIdentifier);

  console.log('🔧 PLUGINS PORTAL DEBUG: useEnable called:', {
    showPluginUI,
    portalToolMessage,
    toolUIIdentifier,
    showPortal: useChatStore(chatPortalSelectors.showPortal)
  });

  return showPluginUI;
};
