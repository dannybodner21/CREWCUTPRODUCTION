import MainInterfaceTracker from '@/components/Analytics/MainInterfaceTracker';
import MobileContentLayout from '@/components/server/MobileNavLayout';
import LewisPortalAutoOpener from '@/components/LewisPortalAutoOpener';

import { LayoutProps } from '../type';
import ChatHeader from './ChatHeader';
import TopicModal from './TopicModal';

const Layout = ({ children, topic, conversation, portal }: LayoutProps) => {
  return (
    <>
      <MobileContentLayout header={<ChatHeader />} style={{ overflowY: 'hidden' }}>
        {conversation}
        {children}
      </MobileContentLayout>
      <TopicModal>{topic}</TopicModal>
      {portal}
      <MainInterfaceTracker />
      {/* Client component that auto-opens Construction Portal for Lewis sessions */}
      {/* <LewisPortalAutoOpener /> */}
    </>
  );
};

Layout.displayName = 'MobileConversationLayout';

export default Layout;
