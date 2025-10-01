'use client';

import { ChatHeader } from '@lobehub/ui/chat';
import { Flexbox } from 'react-layout-kit';
import { useTheme } from 'antd-style';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors } from '@/store/session/selectors';
import { useOpenChatSettings } from '@/hooks/useInterceptingRoutes';
import { Avatar } from '@lobehub/ui';

import HeaderAction from './HeaderAction';
import Main from './Main';

const Header = () => {
  const showHeader = useGlobalStore(systemStatusSelectors.showChatHeader);
  const theme = useTheme();
  const [title, avatar, backgroundColor] = useSessionStore((s) => [
    sessionMetaSelectors.currentAgentTitle(s),
    sessionMetaSelectors.currentAgentAvatar(s),
    sessionMetaSelectors.currentAgentBackgroundColor(s),
  ]);
  const openChatSettings = useOpenChatSettings();

  return (
    showHeader && (
      <Flexbox
        align={'center'}
        horizontal
        justify={'space-between'}
        style={{
          paddingInline: 8,
          position: 'initial',
          zIndex: 11,
          height: 80,
          width: '100%',
          borderBottom: `1px solid ${theme.colorBorder}`,
          backgroundColor: theme.colorBgContainer
        }}
      >
        <Flexbox style={{ flex: 1 }}>
          <Main />
        </Flexbox>
        <Flexbox style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <img
            src="/images/logo/crewcut_logo.png?v=123"
            alt="CREW CUT"
            onClick={() => openChatSettings()}
            style={{ height: 64, width: 'auto', cursor: 'pointer' }}
          />
        </Flexbox>
        <Flexbox style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
          <HeaderAction />
        </Flexbox>
      </Flexbox>
    )
  );
};

export default Header;
