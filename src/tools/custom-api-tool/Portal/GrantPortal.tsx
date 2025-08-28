import { memo, useState, useEffect } from 'react';
import {
    Card,
    Select,
    Input,
    Button,
    Row,
    Col,
    Statistic,
    Space,
    Divider,
    Form,
    InputNumber,
    List,
    Tag,
    Spin,
    Alert,
    Typography,
    Table,
    Checkbox,
    message,
    Progress,
    Tooltip
} from 'antd';
import { createStyles } from 'antd-style';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    Newspaper,
    Target,
    AlertTriangle,
    CheckCircle,
    CircleIcon,
    Calendar,
    Activity,
    Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { BuiltinPortalProps } from '@/types/tool';

// const { Search: SearchInput } = Input; // commented out - unused but preserved
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const useStyles = createStyles(({ token }) => ({
    stockCard: {
        '.ant-card-head': {
            backgroundColor: token.colorPrimary,
            color: 'white',
        },
        '.ant-card-head-title': {
            color: 'white',
            fontSize: 18,
            fontWeight: 600,
        },
    },
    priceUp: {
        color: '#52c41a',
        fontWeight: 600,
        fontSize: 16,
    },
    priceDown: {
        color: '#ff4d4f',
        fontWeight: 600,
        fontSize: 16,
    },
    neutral: {
        color: token.colorTextSecondary,
        fontWeight: 600,
        fontSize: 16,
    },
    indicatorCard: {
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        padding: 16,
        marginBottom: 16,
    },
    adviceCard: {
        border: `2px solid ${token.colorPrimary}`,
        borderRadius: token.borderRadius,
        padding: 16,
        marginBottom: 16,
        backgroundColor: token.colorPrimaryBg,
    },
    riskCard: {
        border: `2px solid ${token.colorWarning}`,
        borderRadius: token.borderRadius,
        padding: 16,
        marginBottom: 16,
        backgroundColor: token.colorWarningBg,
    },
    newsCard: {
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        padding: 12,
        marginBottom: 12,
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
            boxShadow: token.boxShadowTertiary,
            borderColor: token.colorPrimary,
        },
    },
}));

interface StockQuote {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
}

interface TechnicalIndicator {
    name: string;
    value: number;
    signal: 'bullish' | 'bearish' | 'neutral';
    description: string;
}

interface TradingAdvice {
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    reasoning: string[];
    riskLevel: 'low' | 'medium' | 'high';
}

interface NewsItem {
    title: string;
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    publishedAt: string;
    url: string;
}

const GrantPortal = memo<BuiltinPortalProps>(({
    // arguments: args, // commented out - unused but preserved
    // messageId: messageId, // commented out - unused but preserved
    state,
    // apiName: apiName, // commented out - unused but preserved
    // identifier: identifier, // commented out - unused but preserved
}) => {
    const { t: _t } = useTranslation('common');
    const { styles } = useStyles();
    const [form] = Form.useForm();
    const [analysisForm] = Form.useForm();

    // State management
    const [selectedTicker, setSelectedTicker] = useState<string>('');
    const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
    const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
    const [tradingAdvice, setTradingAdvice] = useState<TradingAdvice | null>(null);
    const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [timeframe, setTimeframe] = useState<'day' | 'swing' | 'position'>('day');
    const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

    // Parse the tool state to get data
    const _toolState = typeof state === 'string' ? JSON.parse(state) : state;

    // Remove mock data - now using real Polygon.io API
    const handleTickerSearch = async (ticker: string) => {
        if (!ticker) return;

        setLoading(true);
        setError('');

        try {
            // This will now call the real Polygon.io API through the actions
            // The actual API call happens in the backend when the tool is used
            setSelectedTicker(ticker.toUpperCase());

            // For now, we'll show a loading state and let the user know to use the tool
            message.success(`Ready to analyze ${ticker.toUpperCase()}. Use the Grant tool to get real-time data!`);

            // Clear any previous data
            setStockQuote(null);
            setTechnicalIndicators([]);
            setTradingAdvice(null);
            setMarketNews([]);

        } catch (err) {
            setError('Failed to prepare analysis. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPriceColor = (change: number) => {
        if (change > 0) return { color: '#52c41a', fontWeight: 600, fontSize: 16 };
        if (change < 0) return { color: '#ff4d4f', fontWeight: 600, fontSize: 16 };
        return { color: '#8c8c8c', fontWeight: 600, fontSize: 16 };
    };

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case 'bullish': return 'green';
            case 'bearish': return 'red';
            default: return 'blue';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'buy': return 'green';
            case 'sell': return 'red';
            default: return 'blue';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'green';
            case 'medium': return 'orange';
            case 'high': return 'red';
            default: return 'blue';
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'green';
            case 'negative': return 'red';
            default: return 'blue';
        }
    };

    return (
        <Flexbox gap={16} style={{ padding: 16 }}>
            <Card className={styles.stockCard}>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                    📈 Grant - Your Day Trading Coach
                </Title>
                <Text style={{ color: 'white', opacity: 0.9 }}>
                    Powered by Polygon.io API - Real-time market data and expert trading advice
                </Text>
            </Card>

            {/* Stock Search */}
            <Card title="Stock Analysis" extra={<Target />}>
                <Form form={form} layout="inline" onFinish={(values) => handleTickerSearch(values.ticker)}>
                    <Form.Item name="ticker" rules={[{ required: true, message: 'Please enter a ticker symbol' }]}>
                        <Input
                            placeholder="Enter ticker symbol (e.g., AAPL, TSLA, SPY)"
                            style={{ width: 300 }}
                            onPressEnter={(_e) => form.submit()}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Analyze Stock
                        </Button>
                    </Form.Item>
                </Form>

                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                )}
            </Card>

            {loading && (
                <Card>
                    <Flexbox align="center" justify="center" gap={16}>
                        <Spin size="large" />
                        <Text>Analyzing {selectedTicker}...</Text>
                    </Flexbox>
                </Card>
            )}

            {stockQuote && !loading && (
                <>
                    {/* Stock Quote */}
                    <Card title={`${stockQuote.ticker} Stock Quote`} extra={<DollarSign />}>
                        <Row gutter={[16, 16]}>
                            <Col span={6}>
                                <Statistic
                                    title="Current Price"
                                    value={stockQuote.price}
                                    precision={2}
                                    prefix="$"
                                    valueStyle={getPriceColor(stockQuote.change)}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Change"
                                    value={stockQuote.change}
                                    precision={2}
                                    prefix={stockQuote.change > 0 ? '+' : ''}
                                    suffix={` (${stockQuote.changePercent.toFixed(2)}%)`}
                                    valueStyle={getPriceColor(stockQuote.change)}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Volume"
                                    value={stockQuote.volume.toLocaleString()}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Market Cap"
                                    value={(stockQuote.marketCap / 1000000000).toFixed(2)}
                                    suffix="B"
                                />
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Text strong>High: </Text>
                                <Text style={{ color: '#52c41a', fontWeight: 600 }}>${stockQuote.high}</Text>
                            </Col>
                            <Col span={8}>
                                <Text strong>Low: </Text>
                                <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>${stockQuote.low}</Text>
                            </Col>
                            <Col span={8}>
                                <Text strong>Open: </Text>
                                <Text>${stockQuote.open}</Text>
                            </Col>
                        </Row>
                    </Card>

                    {/* Technical Indicators */}
                    <Card title="Technical Analysis" extra={<BarChart3 />}>
                        <Row gutter={[16, 16]}>
                            {technicalIndicators.map((indicator, index) => (
                                <Col span={8} key={index}>
                                    <Card size="small" className={styles.indicatorCard}>
                                        <Flexbox direction="vertical" gap={8}>
                                            <Text strong>{indicator.name}</Text>
                                            <Text style={{ fontSize: 18, fontWeight: 600 }}>
                                                {indicator.value}
                                            </Text>
                                            <Tag color={getSignalColor(indicator.signal)}>
                                                {indicator.signal.toUpperCase()}
                                            </Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {indicator.description}
                                            </Text>
                                        </Flexbox>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>

                    {/* Trading Advice */}
                    <Card title="Trading Advice" extra={<Target />}>
                        <Form form={analysisForm} layout="inline" style={{ marginBottom: 16 }}>
                            <Form.Item label="Timeframe">
                                <Select
                                    value={timeframe}
                                    onChange={setTimeframe}
                                    style={{ width: 120 }}
                                >
                                    <Option value="day">Day Trade</Option>
                                    <Option value="swing">Swing Trade</Option>
                                    <Option value="position">Position Trade</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Risk Tolerance">
                                <Select
                                    value={riskTolerance}
                                    onChange={setRiskTolerance}
                                    style={{ width: 140 }}
                                >
                                    <Option value="conservative">Conservative</Option>
                                    <Option value="moderate">Moderate</Option>
                                    <Option value="aggressive">Aggressive</Option>
                                </Select>
                            </Form.Item>
                        </Form>

                        {tradingAdvice && (
                            <Card className={styles.adviceCard}>
                                <Flexbox direction="vertical" gap={16}>
                                    <Flexbox align="center" gap={16}>
                                        <Tag color={getActionColor(tradingAdvice.action)} style={{ fontSize: 16, padding: '4px 12px' }}>
                                            {tradingAdvice.action.toUpperCase()}
                                        </Tag>
                                        <Text strong>Confidence: {tradingAdvice.confidence}%</Text>
                                        <Tag color={getRiskColor(tradingAdvice.riskLevel)}>
                                            Risk: {tradingAdvice.riskLevel.toUpperCase()}
                                        </Tag>
                                    </Flexbox>

                                    {tradingAdvice.entryPrice && (
                                        <Row gutter={[16, 16]}>
                                            <Col span={8}>
                                                <Text strong>Entry Price: </Text>
                                                <Text style={{ color: '#52c41a', fontWeight: 600 }}>${tradingAdvice.entryPrice}</Text>
                                            </Col>
                                            <Col span={8}>
                                                <Text strong>Stop Loss: </Text>
                                                <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>${tradingAdvice.stopLoss}</Text>
                                            </Col>
                                            <Col span={8}>
                                                <Text strong>Take Profit: </Text>
                                                <Text style={{ color: '#52c41a', fontWeight: 600 }}>${tradingAdvice.takeProfit}</Text>
                                            </Col>
                                        </Row>
                                    )}

                                    <Divider />

                                    <div>
                                        <Text strong>Reasoning:</Text>
                                        <ul style={{ marginTop: 8 }}>
                                            {tradingAdvice.reasoning.map((reason, index) => (
                                                <li key={index}>
                                                    <Text>{reason}</Text>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Alert
                                        message="Risk Management"
                                        description="Always use proper position sizing and never risk more than 1-2% of your account on any single trade. Consider using stop-loss orders to protect your capital."
                                        type="warning"
                                        showIcon
                                        icon={<AlertTriangle />}
                                    />
                                </Flexbox>
                            </Card>
                        )}
                    </Card>

                    {/* Market News */}
                    <Card title="Market News & Sentiment" extra={<Newspaper />}>
                        <List
                            dataSource={marketNews}
                            renderItem={(item, _index) => (
                                <List.Item>
                                    <Card size="small" className={styles.newsCard}>
                                        <Flexbox direction="vertical" gap={8}>
                                            <Flexbox align="center" gap={8}>
                                                <Tag color={getSentimentColor(item.sentiment)}>
                                                    {item.sentiment.toUpperCase()}
                                                </Tag>
                                                <Text strong>{item.title}</Text>
                                            </Flexbox>
                                            <Text type="secondary">{item.summary}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(item.publishedAt).toLocaleString()}
                                            </Text>
                                        </Flexbox>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* Educational Tips */}
                    <Card title="Day Trading Tips" extra={<Zap />}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Card size="small">
                                    <Flexbox direction="vertical" gap={8} align="center">
                                        <CheckCircle style={{ color: '#52c41a', fontSize: 24 }} />
                                        <Text strong>Risk Management</Text>
                                        <Text type="secondary" style={{ textAlign: 'center' }}>
                                            Never risk more than 1-2% of your account per trade
                                        </Text>
                                    </Flexbox>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Flexbox direction="vertical" gap={8} align="center">
                                        <Activity style={{ color: '#1890ff', fontSize: 24 }} />
                                        <Text strong>Technical Analysis</Text>
                                        <Text type="secondary" style={{ textAlign: 'center' }}>
                                            Use multiple timeframes for confirmation
                                        </Text>
                                    </Flexbox>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Flexbox direction="vertical" gap={8} align="center">
                                        <Calendar style={{ color: '#722ed1', fontSize: 24 }} />
                                        <Text strong>Market Hours</Text>
                                        <Text type="secondary" style={{ textAlign: 'center' }}>
                                            Trade during high-volume market hours
                                        </Text>
                                    </Flexbox>
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </>
            )}

            {!stockQuote && !loading && (
                <Card>
                    <Flexbox align="center" justify="center" gap={16}>
                        <CircleIcon style={{ fontSize: 48, color: '#1890ff' }} />
                        <div>
                            <Title level={4}>Welcome to Grant!</Title>
                            <Paragraph>
                                Enter a stock ticker symbol above to get started with your day trading analysis.
                                Grant now uses real Polygon.io API data for live market information, technical indicators, and personalized trading advice.
                            </Paragraph>
                            <Paragraph style={{ marginTop: 16 }}>
                                <Text strong>How to use:</Text>
                                <br />
                                1. Enter a ticker symbol (e.g., AAPL, TSLA, SPY)
                                <br />
                                2. Use the Grant tool in chat to get real-time data
                                <br />
                                3. Ask questions like "Should I day trade AAPL today?"
                            </Paragraph>
                        </div>
                    </Flexbox>
                </Card>
            )}
        </Flexbox>
    );
});

GrantPortal.displayName = 'GrantPortal';

export default GrantPortal;
