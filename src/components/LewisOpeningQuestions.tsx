'use client';

import { Block } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useSendMessage } from '@/features/ChatInput/useSend';
import { useChatStore } from '@/store/chat';

const useStyles = createStyles(({ css, token, responsive }) => ({
    card: css`
    padding-block: 8px;
    padding-inline: 16px;
    border-radius: 48px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};

    ${responsive.mobile} {
      padding-block: 8px;
      padding-inline: 16px;
    }

    &:hover {
      background: ${token.colorBgContainerHover};
      border-color: ${token.colorPrimary};
    }
  `,

    container: css`
    padding-block: 0;
    padding-inline: 0;
    text-align: left;
  `,

    title: css`
    color: ${token.colorTextDescription};
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 500;
  `,
}));

const projectTypes = [
    'Single Family Residential',
    'Multi-Family Residential',
    'Commercial',
    'Industrial',
    'Mixed-Use',
    'Retail',
    'Office',
    'Hospitality',
    'Healthcare',
    'Educational',
    'Other'
];

const LewisOpeningQuestions = memo(() => {
    const { styles } = useStyles();
    const [updateInputMessage] = useChatStore((s) => [s.updateInputMessage]);
    const { send: sendMessage } = useSendMessage();

    return (
        <div className={styles.container}>
            <p className={styles.title}>What type of construction project are you developing?</p>
            <Flexbox gap={8} horizontal wrap={'wrap'}>
                {projectTypes.map((projectType) => {
                    return (
                        <Block
                            className={styles.card}
                            clickable
                            key={projectType}
                            onClick={() => {
                                updateInputMessage(projectType);
                                sendMessage({ isWelcomeQuestion: true });
                            }}
                            paddingBlock={8}
                            paddingInline={12}
                            variant={'outlined'}
                        >
                            {projectType}
                        </Block>
                    );
                })}
            </Flexbox>
        </div>
    );
});

LewisOpeningQuestions.displayName = 'LewisOpeningQuestions';

export default LewisOpeningQuestions;
