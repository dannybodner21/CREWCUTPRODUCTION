import { useState } from 'react';
import { Modal, Button, Card, Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            console.log('Creating Stripe checkout session...');

            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { url } = await response.json();

            if (url) {
                // Redirect to Stripe Checkout
                window.location.href = url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Upgrade failed:', error);
            // You might want to show an error message to the user here
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        'Unlimited LEWIS chat sessions',
        'Full construction portal access',
        'Jurisdiction fee analysis',
        'Project cost calculations',
        'Real-time fee comparisons',
        'Export reports and data',
    ];

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={600}
            centered
            closeIcon={<CloseOutlined />}
            className="upgrade-modal"
        >
            <div className="p-6">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Title level={2} style={{ margin: 0, textAlign: 'center' }}>
                            Upgrade to LEWIS Pro
                        </Title>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '1px',
                        backgroundColor: '#d1d5db',
                        marginBottom: '16px'
                    }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" className="text-lg">
                            Unlock the full power of construction fee analysis
                        </Text>
                    </div>
                </div>

                <Card className="my-8 border-2 border-blue-200">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                            $5,000
                            <span className="text-lg font-normal text-gray-500 ml-1">/month</span>
                        </div>
                        <Text type="secondary">Billed monthly • Cancel anytime</Text>
                    </div>
                </Card>

                <div className="mb-6" style={{ marginTop: '24px' }}>
                    <Title level={4} className="mb-4">
                        What's included:
                    </Title>
                    <Space direction="vertical" size="small" className="w-full">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center" style={{ paddingLeft: '16px' }}>
                                <CheckCircleOutlined className="text-green-500" style={{ marginRight: '12px' }} />
                                <Text>{feature}</Text>
                            </div>
                        ))}
                    </Space>
                </div>

                <Divider />

                <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: '20px',
                    marginBottom: '10px'
                }}>
                    <Button
                        size="large"
                        onClick={onClose}
                        style={{ width: '40%' }}
                    >
                        Maybe Later
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleUpgrade}
                        loading={isLoading}
                        style={{ width: '40%' }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isLoading ? 'Processing...' : 'Upgrade Now'}
                    </Button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Text type="secondary" className="text-sm">
                        Secure payment powered by Stripe • 30-day money-back guarantee
                    </Text>
                </div>
            </div>
        </Modal>
    );
};
