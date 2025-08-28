import { memo } from 'react';
import { Card, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { MessageSquare } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';

import { BuiltinPortalProps } from '@/types/tool';

const { Title } = Typography;

const useStyles = createStyles(({ token }) => ({
    container: {
        padding: 16,
        maxWidth: 800,
        margin: '0 auto',
    },
    card: {
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    content: {
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        color: token.colorText,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
}));

const SimpleTextPortal = memo<BuiltinPortalProps>(({ state }) => {
    const { styles } = useStyles();

    // Parse the state if it's a JSON string, otherwise use as-is
    let displayText = state;
    try {
        if (typeof state === 'string') {
            const parsed = JSON.parse(state);
            if (parsed.message) {
                displayText = parsed.message;
            } else if (parsed.success && parsed.data) {
                displayText = `Result: ${parsed.data}`;
            } else {
                displayText = JSON.stringify(parsed, null, 2);
            }
        }
    } catch {
        // If parsing fails, use the state as-is
        displayText = state;
    }

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <MessageSquare size={24} />
                    <Title level={4} style={{ margin: 0 }}>LEWIS Response</Title>
                </div>
                <div className={styles.content}>
                    {displayText}
                </div>
            </Card>
        </div>
    );
});

SimpleTextPortal.displayName = 'SimpleTextPortal';

export default SimpleTextPortal;
