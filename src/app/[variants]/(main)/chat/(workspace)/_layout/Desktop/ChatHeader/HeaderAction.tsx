'use client';

import { ActionIcon, Button } from '@lobehub/ui';
import { PanelRightClose, PanelRightOpen, Database } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

import SettingButton from '../../../features/SettingButton';
import ShareButton from '../../../features/ShareButton';

const HeaderAction = memo<{ className?: string }>(({ className }) => {
  const { t } = useTranslation('chat');
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.ToggleRightPanel));
  const [showAgentSettings, toggleConfig] = useGlobalStore((s) => [
    systemStatusSelectors.showChatSideBar(s),
    s.toggleChatSideBar,
  ]);

  const { isAgentEditable } = useServerConfigStore(featureFlagsSelectors);

  const testLewisDatabase = async () => {
    try {
      console.log('🧪 Testing Lewis database connection...');

      // Test the simple API route
      const response = await fetch('/api/test-lewis');
      const data = await response.json();

      console.log('✅ Lewis database test result:', data);

      if (data.success) {
        console.log(`🎯 Lewis has data for ${data.count} states:`, data.states);
        console.log(`📝 Message: ${data.message}`);
      } else {
        console.log('❌ Lewis database test failed:', data.error);
      }
    } catch (error) {
      console.error('💥 Error testing Lewis database:', error);
    }
  };

  return (
    <Flexbox className={className} gap={4} horizontal>
      <Button
        icon={<Database />}
        onClick={testLewisDatabase}
        size="small"
        title="Test Lewis Database"
        type="default"
      >
        Test Lewis DB
      </Button>
      <ShareButton />
      <ActionIcon
        icon={showAgentSettings ? PanelRightClose : PanelRightOpen}
        onClick={() => toggleConfig()}
        size={DESKTOP_HEADER_ICON_SIZE}
        title={t('toggleRightPanel.title', { ns: 'hotkey' })}
        tooltipProps={{
          hotkey,
          placement: 'bottom',
        }}
      />
      {isAgentEditable && <SettingButton />}
    </Flexbox>
  );
});

export default HeaderAction;
