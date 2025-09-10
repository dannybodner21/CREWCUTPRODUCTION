'use client';

import { FluentEmoji, Markdown } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Button } from 'antd';
import { Building } from 'lucide-react';
import { memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { BRANDING_NAME } from '@/const/branding';
import { isCustomBranding } from '@/const/version';
import { useGreeting } from '@/hooks/useGreeting';
import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/slices/portal/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import LewisOpeningQuestions from '@/components/LewisOpeningQuestions';

import AddButton from './AddButton';
import QuestionSuggest from './QuestionSuggest';

const useStyles = createStyles(({ css, responsive }) => ({
  container: css`
    align-items: center;
    ${responsive.mobile} {
      align-items: flex-start;
    }
  `,
  desc: css`
    font-size: 14px;
    text-align: center;
    ${responsive.mobile} {
      text-align: start;
    }
  `,
  title: css`
    margin-block: 0.2em 0;
    font-size: 32px;
    font-weight: bolder;
    line-height: 1;
    ${responsive.mobile} {
      font-size: 24px;
    }
  `,
}));

const InboxWelcome = memo(() => {
  const { t } = useTranslation('welcome');
  const { styles } = useStyles();
  const mobile = useServerConfigStore((s) => s.isMobile);
  const greeting = useGreeting();
  const { showWelcomeSuggest, showCreateSession } = useServerConfigStore(featureFlagsSelectors);

  // Portal state and toggle function
  const togglePortal = useChatStore((s) => s.togglePortal);
  const showPortal = useChatStore(chatPortalSelectors.showPortal);

  return (
    <Center padding={16} width={'100%'}>
      <Flexbox className={styles.container} gap={16} style={{ maxWidth: 800 }} width={'100%'}>
        <Flexbox align={'center'} gap={8} horizontal>
          <FluentEmoji emoji={'👋'} size={40} type={'anim'} />
          <h1 className={styles.title}>{greeting}</h1>
        </Flexbox>
        <Markdown
          className={styles.desc}
          customRender={(dom, context) => {
            if (context.text.includes('<plus />')) {
              return (
                <Trans
                  components={{
                    br: <br />,
                    plus: <AddButton />,
                  }}
                  i18nKey="guide.defaultMessage"
                  ns="welcome"
                  values={{ appName: BRANDING_NAME }}
                />
              );
            }
            return dom;
          }}
          variant={'chat'}
        >
          {t(showCreateSession ? 'guide.defaultMessage' : 'guide.defaultMessageWithoutCreate', {
            appName: BRANDING_NAME,
          })}
        </Markdown>

        {/* Horizontal Rule */}
        <div style={{
          width: '60%',
          height: '1px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          margin: '20px auto'
        }} />

        {/* Show Lewis opening questions on the main page */}
        <LewisOpeningQuestions />
        {showWelcomeSuggest && (
          <>
            {/* Removed AgentsSuggest component */}
            {!isCustomBranding && <QuestionSuggest mobile={mobile} />}
          </>
        )}
      </Flexbox>
    </Center>
  );
});

export default InboxWelcome;
