'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Input, Select, Button, Badge, Row, Col, message, Spin, List, Tag } from 'antd';
import { Building, ArrowLeft, X, MapPin, Home, Calculator, Ruler } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;
const { Search: SearchInput } = Input;
const { Option } = Select;

interface Jurisdiction {
    id: string;
    name: string;
    type: string;
    kind: string;
    state_fips: string;
}

interface Fee {
    id: string;
    name: string;
    category: string;
    rate: string | null;
    unit_label: string;
    description: string | null;
    applies_to: string | null;
    use_subtype: string | null;
}

const CustomLewisPortal = () => {
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [jurisdictionFees, setJurisdictionFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
    const [searchJurisdiction, setSearchJurisdiction] = useState('');
    const [filteredJurisdictions, setFilteredJurisdictions] = useState<Jurisdiction[]>([]);
    const [searchFees, setSearchFees] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [projectType, setProjectType] = useState('Residential');
    const [projectValue, setProjectValue] = useState('100000');
    const [squareFootage, setSquareFootage] = useState('1000');

    // Fetch Arizona jurisdictions from database
    useEffect(() => {
        const fetchJurisdictions = async () => {
            try {
                setLoading(true);

                // Fetch Arizona jurisdictions (state_fips = '04')
                const response = await fetch('/api/lewis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getJurisdictions',
                        params: { stateFips: '04' }
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setJurisdictions(result.data);
                        setFilteredJurisdictions(result.data);

                        // Auto-select Phoenix if it exists
                        const phoenix = result.data.find((j: Jurisdiction) =>
                            j.name === 'Phoenix city' && j.type === 'municipality'
                        );
                        if (phoenix) {
                            setSelectedJurisdiction(phoenix);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching jurisdictions:', error);
                message.error('Failed to load jurisdictions');
            } finally {
                setLoading(false);
            }
        };

        fetchJurisdictions();
    }, []);

    // Filter jurisdictions based on search
    useEffect(() => {
        if (searchJurisdiction.trim() === '') {
            setFilteredJurisdictions(jurisdictions);
        } else {
            const filtered = jurisdictions.filter(jurisdiction =>
                jurisdiction.name.toLowerCase().includes(searchJurisdiction.toLowerCase()) ||
                jurisdiction.type.toLowerCase().includes(searchJurisdiction.toLowerCase()) ||
                (jurisdiction.kind && jurisdiction.kind.toLowerCase().includes(searchJurisdiction.toLowerCase()))
            );
            setFilteredJurisdictions(filtered);
        }
    }, [searchJurisdiction, jurisdictions]);

    // Fetch fees for selected jurisdiction
    useEffect(() => {
        if (selectedJurisdiction) {
            const fetchJurisdictionFees = async () => {
                try {
                    const response = await fetch('/api/lewis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getJurisdictionFees',
                            params: { jurisdictionId: selectedJurisdiction.id }
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            setJurisdictionFees(result.data);
                        } else {
                            setJurisdictionFees([]);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching jurisdiction fees:', error);
                    setJurisdictionFees([]);
                }
            };

            fetchJurisdictionFees();
        }
    }, [selectedJurisdiction]);

    if (loading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading Construction Portal...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', height: '100%', overflow: 'auto', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <Card
                style={{
                    marginBottom: '24px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px'
                }}
            >
                <Flexbox align="center" justify="space-between" style={{ marginBottom: '16px' }}>
                    <Flexbox align="center" gap={12}>
                        <Button icon={<ArrowLeft size={16} />} style={{ padding: 0 }} type="text" />
                        <Text strong style={{ fontSize: '16px' }}>Construction Fee Portal</Text>
                    </Flexbox>
                    <Button icon={<X size={16} />} style={{ padding: 0 }} type="text" />
                </Flexbox>

                <Flexbox align="center" gap={16} style={{ marginBottom: '8px' }}>
                    <Building size={32} style={{ color: '#1890ff' }} />
                    <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                        LEWIS Construction Portal
                    </Title>
                </Flexbox>
                <Text style={{ fontSize: '14px', marginLeft: '48px' }} type="secondary">
                    {jurisdictions.length} Arizona Jurisdictions Available
                </Text>
            </Card>

            {/* Jurisdiction Selection Section */}
            <Card
                style={{
                    marginBottom: '24px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px'
                }}
            >
                <Title level={4} style={{ marginBottom: '20px', color: '#1f2937' }}>
                    Jurisdiction Selection
                </Title>

                <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={12}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Search Jurisdictions:</Text>
                        <SearchInput
                            onChange={(e) => setSearchJurisdiction(e.target.value)}
                            placeholder="Search cities, towns, counties..."
                            style={{ borderRadius: '8px' }}
                            value={searchJurisdiction}
                        />
                    </Col>
                    <Col span={12}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Select Jurisdiction:</Text>
                        <Select
                            onChange={(jurisdictionId) => {
                                const jurisdiction = jurisdictions.find(j => j.id === jurisdictionId);
                                setSelectedJurisdiction(jurisdiction || null);
                            }}
                            placeholder="Choose a jurisdiction"
                            style={{ width: '100%', borderRadius: '8px' }}
                            value={selectedJurisdiction?.id}
                        >
                            {filteredJurisdictions.map(jurisdiction => (
                                <Option key={jurisdiction.id} value={jurisdiction.id}>
                                    {jurisdiction.name} ({jurisdiction.kind || jurisdiction.type})
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>

                {selectedJurisdiction && (
                    <Row gutter={24}>
                        <Col span={8}>
                            <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }} type="secondary">Jurisdiction</Text>
                            <Flexbox align="center" gap={8}>
                                <MapPin size={16} style={{ color: '#1890ff' }} />
                                <Text strong style={{ fontSize: '18px' }}>{selectedJurisdiction.name}</Text>
                            </Flexbox>
                        </Col>
                        <Col span={8}>
                            <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }} type="secondary">Type</Text>
                            <Flexbox align="center" gap={8}>
                                <Text strong style={{ fontSize: '18px' }}>
                                    {selectedJurisdiction.kind || selectedJurisdiction.type}
                                </Text>
                            </Flexbox>
                        </Col>
                        <Col span={8}>
                            <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }} type="secondary">Fee Records</Text>
                            <Flexbox align="center" gap={8}>
                                <Text strong style={{ fontSize: '18px' }}>{jurisdictionFees.length}</Text>
                            </Flexbox>
                        </Col>
                    </Row>
                )}
            </Card>

            {/* Fee Database Section */}
            {selectedJurisdiction && (
                <Card
                    style={{
                        marginBottom: '24px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px'
                    }}
                >
                    <Title level={4} style={{ marginBottom: '20px', color: '#1f2937' }}>
                        Fee Database - {selectedJurisdiction.name}
                    </Title>

                    <Row gutter={16} style={{ marginBottom: '20px' }}>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Search Fees:</Text>
                            <SearchInput
                                onChange={(e) => setSearchFees(e.target.value)}
                                placeholder="Search fee names..."
                                style={{ borderRadius: '8px' }}
                                value={searchFees}
                            />
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Filter by Category:</Text>
                            <Select
                                allowClear
                                onChange={setSelectedCategory}
                                placeholder="All categories"
                                style={{ width: '100%', borderRadius: '8px' }}
                                value={selectedCategory}
                            >
                                <Option value="flat">Flat Fee</Option>
                                <Option value="per_unit">Per Unit</Option>
                                <Option value="per_meter_size">Per Meter Size</Option>
                                <Option value="formula">Formula Based</Option>
                                <Option value="per_sqft">Per Square Foot</Option>
                            </Select>
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Total Fees:</Text>
                            <Badge
                                count={`${jurisdictionFees.length} fees found`}
                                style={{
                                    backgroundColor: '#e6f7ff',
                                    color: '#1890ff',
                                    fontSize: '14px',
                                    padding: '8px 16px',
                                    borderRadius: '20px'
                                }}
                            />
                        </Col>
                    </Row>

                    {jurisdictionFees.length > 0 ? (
                        <List
                            dataSource={jurisdictionFees.filter(fee => {
                                const matchesSearch = !searchFees ||
                                    fee.name.toLowerCase().includes(searchFees.toLowerCase());
                                const matchesCategory = !selectedCategory ||
                                    fee.category === selectedCategory;
                                return matchesSearch && matchesCategory;
                            })}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} items`
                            }}
                            renderItem={(fee) => (
                                <List.Item>
                                    <Card
                                        size="small"
                                        style={{
                                            width: '100%',
                                            border: '1px solid #f0f0f0',
                                            borderRadius: '8px',
                                            backgroundColor: '#fafafa'
                                        }}
                                    >
                                        <Flexbox direction="vertical" gap={8}>
                                            <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                                                {fee.name}
                                            </Text>
                                            <Flexbox align="center" justify="space-between">
                                                <Flexbox gap={8}>
                                                    <Tag color="blue">{fee.category}</Tag>
                                                    {fee.rate && (
                                                        <Tag color="green">
                                                            ${fee.rate} {fee.unit_label}
                                                        </Tag>
                                                    )}
                                                    {!fee.rate && fee.unit_label && (
                                                        <Tag color="orange">
                                                            {fee.unit_label}
                                                        </Tag>
                                                    )}
                                                </Flexbox>
                                            </Flexbox>
                                            {fee.description && (
                                                <Text style={{ fontSize: '14px' }} type="secondary">
                                                    {fee.description}
                                                </Text>
                                            )}
                                        </Flexbox>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Text style={{ fontSize: '16px' }} type="secondary">
                                No fee data available for {selectedJurisdiction.name}
                            </Text>
                            <br />
                            <Text style={{ fontSize: '14px' }} type="secondary">
                                This jurisdiction is ready for future fee data import.
                            </Text>
                        </div>
                    )}
                </Card>
            )}

            {/* Fee Calculator Section */}
            <Card
                style={{
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px'
                }}
            >
                <Title level={4} style={{ marginBottom: '20px', color: '#1f2937' }}>
                    Fee Calculator
                </Title>

                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col span={6}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Type</Text>
                        <Select
                            onChange={setProjectType}
                            style={{ width: '100%', borderRadius: '8px' }}
                            suffixIcon={<Home size={16} />}
                            value={projectType}
                        >
                            <Option value="Residential">Residential</Option>
                            <Option value="Commercial">Commercial</Option>
                            <Option value="Industrial">Industrial</Option>
                            <Option value="Mixed Use">Mixed Use</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Value ($)</Text>
                        <Input
                            onChange={(e) => setProjectValue(e.target.value)}
                            prefix="$"
                            style={{ borderRadius: '8px' }}
                            value={projectValue}
                        />
                    </Col>
                    <Col span={6}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Square Footage</Text>
                        <Input
                            onChange={(e) => setSquareFootage(e.target.value)}
                            style={{ borderRadius: '8px' }}
                            suffix={<Ruler size={16} />}
                            value={squareFootage}
                        />
                    </Col>
                    <Col span={6}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Jurisdiction</Text>
                        <Select
                            disabled
                            style={{ width: '100%', borderRadius: '8px' }}
                            value={selectedJurisdiction?.name}
                        >
                            {selectedJurisdiction && (
                                <Option value={selectedJurisdiction.name}>
                                    {selectedJurisdiction.name}
                                </Option>
                            )}
                        </Select>
                    </Col>
                </Row>

                <Button
                    icon={<Calculator size={16} />}
                    size="large"
                    style={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        height: '48px',
                        paddingInline: '24px',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}
                    type="primary"
                >
                    Calculate Fees
                </Button>
            </Card>
        </div>
    );
};

export default CustomLewisPortal;
