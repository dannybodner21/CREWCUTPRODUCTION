'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Input, Select, Button, Row, Col, message, Spin, Checkbox } from 'antd';
import { Building, MapPin } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';
import { useChatStore } from '@/store/chat';

const { Title, Text } = Typography;
const { Search: SearchInput } = Input;
const { Option } = Select;

interface Jurisdiction {
    id: string;
    name: string;
    type: string;
    kind: string;
    state_fips: string;
    population: number | null;
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
    formula: string | null;
}

interface ProjectParameters {
    units: number;
    squareFootage: number;
    projectValue: number;
    acreage?: number;
    meterSize?: string;
}

const CustomLewisPortal = () => {
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [jurisdictionFees, setJurisdictionFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
    const [searchJurisdiction, setSearchJurisdiction] = useState('');
    const [filteredJurisdictions, setFilteredJurisdictions] = useState<Jurisdiction[]>([]);

    // Comparison feature state
    const [compareTwoLocations, setCompareTwoLocations] = useState(false);
    const [selectedJurisdiction2, setSelectedJurisdiction2] = useState<Jurisdiction | null>(null);
    const [jurisdictionFees2, setJurisdictionFees2] = useState<Fee[]>([]);
    const [searchJurisdiction2, setSearchJurisdiction2] = useState('');
    const [filteredJurisdictions2, setFilteredJurisdictions2] = useState<Jurisdiction[]>([]);

    const [projectValue, setProjectValue] = useState('100000');
    const [squareFootage, setSquareFootage] = useState('1000');
    const [projectUnits, setProjectUnits] = useState('100');
    const [projectAcreage, setProjectAcreage] = useState('5');
    const [meterSize, setMeterSize] = useState('6"');
    const [projectType, setProjectType] = useState('Multi-Family Residential');

    // Portal integration - get chat store for portal state
    const chatStore = useChatStore();

    // Listen for portal state changes from Lewis tool
    useEffect(() => {
        const handlePortalUpdate = (event: CustomEvent) => {
            try {
                const portalState = event.detail;
                if (portalState?.lewisProjectData) {
                    const projectData = portalState.lewisProjectData;
                    console.log('🔧 PORTAL: Received project data from Lewis tool:', projectData);

                    // Auto-populate portal fields
                    if (projectData.jurisdictionName) {
                        // Find matching jurisdiction
                        const matchingJurisdiction = jurisdictions.find(j =>
                            j.name.toLowerCase().includes(projectData.jurisdictionName.toLowerCase()) ||
                            projectData.jurisdictionName.toLowerCase().includes(j.name.toLowerCase())
                        );
                        if (matchingJurisdiction) {
                            setSelectedJurisdiction(matchingJurisdiction);
                        }
                    }

                    if (projectData.projectType) {
                        setProjectType(projectData.projectType);
                    }
                    if (projectData.projectUnits) {
                        setProjectUnits(projectData.projectUnits.toString());
                    }
                    if (projectData.projectAcreage) {
                        setProjectAcreage(projectData.projectAcreage.toString());
                    }
                    if (projectData.meterSize) {
                        setMeterSize(projectData.meterSize);
                    }
                    if (projectData.squareFootage) {
                        setSquareFootage(projectData.squareFootage.toString());
                    }
                    if (projectData.projectValue) {
                        setProjectValue(projectData.projectValue.toString());
                    }
                }
            } catch (error) {
                console.error('🔧 PORTAL ERROR: Failed to process portal state:', error);
            }
        };

        const checkLocalStorage = () => {
            try {
                const stored = localStorage.getItem('lewis-portal-state');
                if (stored) {
                    const portalState = JSON.parse(stored);
                    if (portalState?.lewisProjectData) {
                        handlePortalUpdate({ detail: portalState } as CustomEvent);
                    }
                }
            } catch (error) {
                console.error('🔧 PORTAL ERROR: Failed to check localStorage:', error);
            }
        };

        // Check localStorage immediately
        checkLocalStorage();

        // Listen for custom events
        window.addEventListener('lewis-portal-update', handlePortalUpdate as EventListener);

        return () => {
            window.removeEventListener('lewis-portal-update', handlePortalUpdate as EventListener);
        };
    }, [jurisdictions]);

    // Fetch jurisdictions that have fees from database
    useEffect(() => {
        const fetchJurisdictions = async () => {
            try {
                setLoading(true);

                // Fetch jurisdictions that have fees from database
                const response = await fetch('/api/lewis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getJurisdictionsWithFees',
                        params: {}
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setJurisdictions(result.data);
                        setFilteredJurisdictions(result.data);

                        // Auto-select the first jurisdiction if available
                        if (result.data.length > 0) {
                            setSelectedJurisdiction(result.data[0]);
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
            const searchTerm = searchJurisdiction.toLowerCase().trim();
            const filtered = jurisdictions.filter(jurisdiction =>
                jurisdiction.name.toLowerCase().includes(searchTerm) ||
                jurisdiction.type.toLowerCase().includes(searchTerm) ||
                (jurisdiction.kind && jurisdiction.kind.toLowerCase().includes(searchTerm)) ||
                (jurisdiction.state_fips && jurisdiction.state_fips.includes(searchTerm))
            );
            setFilteredJurisdictions(filtered);
        }
    }, [searchJurisdiction, jurisdictions]);

    // Filter jurisdictions for second location based on search
    useEffect(() => {
        if (searchJurisdiction2.trim() === '') {
            setFilteredJurisdictions2(jurisdictions);
        } else {
            const searchTerm = searchJurisdiction2.toLowerCase().trim();
            const filtered = jurisdictions.filter(jurisdiction =>
                jurisdiction.name.toLowerCase().includes(searchTerm) ||
                jurisdiction.type.toLowerCase().includes(searchTerm) ||
                (jurisdiction.kind && jurisdiction.kind.toLowerCase().includes(searchTerm)) ||
                (jurisdiction.state_fips && jurisdiction.state_fips.includes(searchTerm))
            );
            setFilteredJurisdictions2(filtered);
        }
    }, [searchJurisdiction2, jurisdictions]);

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

    // Fetch fees for second selected jurisdiction
    useEffect(() => {
        if (selectedJurisdiction2) {
            const fetchJurisdictionFees2 = async () => {
                try {
                    const response = await fetch('/api/lewis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getJurisdictionFees',
                            params: { jurisdictionId: selectedJurisdiction2.id }
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            setJurisdictionFees2(result.data);
                        } else {
                            setJurisdictionFees2([]);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching jurisdiction fees 2:', error);
                    setJurisdictionFees2([]);
                }
            };

            fetchJurisdictionFees2();
        }
    }, [selectedJurisdiction2]);

    // Fee calculation function
    const calculateFeeAmount = (fee: Fee, projectParams: ProjectParameters): number => {
        const { units, squareFootage, projectValue, acreage = 0, meterSize = '6"' } = projectParams;

        // Handle formula-based fees
        if (fee.formula && fee.category === 'formula') {
            // For now, return 0 for complex formulas - we'll implement these later
            return 0;
        }

        // Handle flat fees
        if (fee.category === 'flat') {
            if (fee.rate && !isNaN(parseFloat(fee.rate))) {
                return parseFloat(fee.rate);
            }
            return 0;
        }

        // Handle per_unit fees
        if (fee.category === 'per_unit') {
            if (fee.rate && !isNaN(parseFloat(fee.rate))) {
                return parseFloat(fee.rate) * units;
            }
            return 0;
        }

        // Handle per_sqft fees
        if (fee.category === 'per_sqft') {
            if (fee.rate && !isNaN(parseFloat(fee.rate))) {
                return parseFloat(fee.rate) * squareFootage;
            }
            return 0;
        }

        // Handle per_meter_size fees (monthly)
        if (fee.category === 'per_meter_size') {
            if (fee.rate && !isNaN(parseFloat(fee.rate))) {
                // For monthly fees, we'll calculate for 12 months
                return parseFloat(fee.rate) * 12;
            }
            return 0;
        }

        return 0;
    };

    // Filter fees to show only relevant ones for the project type
    const getRelevantFees = (fees: Fee[], projectType: string): Fee[] => {
        return fees.filter(fee => {
            const feeName = fee.name.toLowerCase();

            switch (projectType) {
                case 'Single Family Residential':
                    return feeName.includes('single family') ||
                        feeName.includes('family residence') ||
                        (!feeName.includes('commercial') && !feeName.includes('dining') && !feeName.includes('per dwelling unit'));

                case 'Multi-Family Residential':
                    return feeName.includes('family residence') ||
                        feeName.includes('per dwelling unit') ||
                        feeName.includes('per unit') ||
                        (!feeName.includes('single family') && !feeName.includes('commercial') && !feeName.includes('dining'));

                case 'Commercial':
                    return feeName.includes('commercial') && !feeName.includes('dining');

                case 'Restaurant/Food Service':
                    return feeName.includes('commercial') && feeName.includes('dining');

                case 'Industrial':
                    return feeName.includes('industrial') ||
                        (!feeName.includes('single family') && !feeName.includes('family residence') && !feeName.includes('commercial'));

                default:
                    return true; // Show all fees if no specific type selected
            }
        });
    };

    // Calculate total fees for current project
    const calculateTotalFees = (): { total: number; breakdown: Array<{ fee: Fee; amount: number }> } => {
        if (!selectedJurisdiction || jurisdictionFees.length === 0) {
            return { total: 0, breakdown: [] };
        }

        const projectParams: ProjectParameters = {
            units: parseInt(projectUnits) || 0,
            squareFootage: parseInt(squareFootage) || 0,
            projectValue: parseInt(projectValue) || 0,
            acreage: parseFloat(projectAcreage) || 0,
            meterSize: meterSize
        };

        // Filter fees based on project type
        const relevantFees = getRelevantFees(jurisdictionFees, projectType);

        const breakdown = relevantFees.map(fee => ({
            fee,
            amount: calculateFeeAmount(fee, projectParams)
        }));

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

        return { total, breakdown };
    };

    // Calculate total fees for second jurisdiction
    const calculateTotalFees2 = (): { total: number; breakdown: Array<{ fee: Fee; amount: number }> } => {
        if (!selectedJurisdiction2 || jurisdictionFees2.length === 0) {
            return { total: 0, breakdown: [] };
        }

        const projectParams: ProjectParameters = {
            units: parseInt(projectUnits) || 0,
            squareFootage: parseInt(squareFootage) || 0,
            projectValue: parseInt(projectValue) || 0,
            acreage: parseFloat(projectAcreage) || 0,
            meterSize: meterSize
        };

        // Filter fees based on project type
        const relevantFees = getRelevantFees(jurisdictionFees2, projectType);

        const breakdown = relevantFees.map(fee => ({
            fee,
            amount: calculateFeeAmount(fee, projectParams)
        }));

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

        return { total, breakdown };
    };

    if (loading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading Construction Portal...</div>
            </div>
        );
    }

    if (jurisdictions.length === 0) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Title level={3} style={{ color: '#faad14' }}>No Jurisdictions with Fee Data</Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                        No Arizona jurisdictions currently have fee data available.
                        Please check back later or contact your administrator to add fee data.
                    </Text>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', height: '100%', overflow: 'auto', backgroundColor: '#ffffff' }}>
            {/* Header */}
            <Card
                style={{
                    marginBottom: '24px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '12px'
                }}
            >
                <Flexbox align="center" gap={16} style={{ marginBottom: '8px' }}>
                    <Building size={32} style={{ color: '#000000' }} />
                    <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                        LEWIS Construction Portal
                    </Title>
                </Flexbox>

            </Card>

            {/* Jurisdiction Selection Section */}
            <Card
                style={{
                    marginBottom: '24px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '12px'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                        Jurisdiction Selection
                    </Title>
                    <Checkbox
                        checked={compareTwoLocations}
                        onChange={(e) => setCompareTwoLocations(e.target.checked)}
                        style={{ fontSize: '14px' }}
                    >
                        Compare two locations
                    </Checkbox>
                </div>

                <Row gutter={16} style={{ marginBottom: '30px' }}>
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
                    <div style={{ display: 'flex', width: '100%' }}>
                        <div style={{ width: '25%', textAlign: 'left' }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Jurisdiction</Text>
                            <Text style={{ fontSize: '18px', color: '#4a5568' }}>{selectedJurisdiction.name}</Text>
                        </div>
                        <div style={{ width: '25%', textAlign: 'left' }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Type</Text>
                            <Text style={{ fontSize: '18px', color: '#4a5568' }}>
                                {selectedJurisdiction.kind || selectedJurisdiction.type}
                            </Text>
                        </div>
                        <div style={{ width: '25%', textAlign: 'left' }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Population</Text>
                            <Text style={{ fontSize: '18px', color: '#4a5568' }}>
                                {selectedJurisdiction.population ? selectedJurisdiction.population.toLocaleString() : 'N/A'}
                            </Text>
                        </div>
                        <div style={{ width: '25%', textAlign: 'left' }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Fee Records</Text>
                            <Text style={{ fontSize: '18px', color: '#4a5568' }}>{jurisdictionFees.length}</Text>
                        </div>
                    </div>
                )}

                {/* Second Jurisdiction Selection - Only show when comparison is enabled */}
                {compareTwoLocations && (
                    <>
                        <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                            <Title level={5} style={{ marginBottom: '15px', color: '#1f2937' }}>
                                Second Location
                            </Title>
                        </div>

                        <Row gutter={16} style={{ marginBottom: '20px' }}>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Search Jurisdictions:</Text>
                                <SearchInput
                                    onChange={(e) => setSearchJurisdiction2(e.target.value)}
                                    placeholder="Search cities, towns, counties..."
                                    style={{ borderRadius: '8px' }}
                                    value={searchJurisdiction2}
                                />
                            </Col>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Select Jurisdiction:</Text>
                                <Select
                                    onChange={(jurisdictionId) => {
                                        const jurisdiction = jurisdictions.find(j => j.id === jurisdictionId);
                                        setSelectedJurisdiction2(jurisdiction || null);
                                    }}
                                    placeholder="Choose a jurisdiction"
                                    style={{ width: '100%', borderRadius: '8px' }}
                                    value={selectedJurisdiction2?.id}
                                >
                                    {filteredJurisdictions2.map(jurisdiction => (
                                        <Option key={jurisdiction.id} value={jurisdiction.id}>
                                            {jurisdiction.name} ({jurisdiction.kind || jurisdiction.type})
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>

                        {selectedJurisdiction2 && (
                            <div style={{ display: 'flex', width: '100%' }}>
                                <div style={{ width: '25%', textAlign: 'left' }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Jurisdiction</Text>
                                    <Text style={{ fontSize: '18px', color: '#4a5568' }}>{selectedJurisdiction2.name}</Text>
                                </div>
                                <div style={{ width: '25%', textAlign: 'left' }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Type</Text>
                                    <Text style={{ fontSize: '18px', color: '#4a5568' }}>
                                        {selectedJurisdiction2.kind || selectedJurisdiction2.type}
                                    </Text>
                                </div>
                                <div style={{ width: '25%', textAlign: 'left' }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Population</Text>
                                    <Text style={{ fontSize: '18px', color: '#4a5568' }}>
                                        {selectedJurisdiction2.population ? selectedJurisdiction2.population.toLocaleString() : 'N/A'}
                                    </Text>
                                </div>
                                <div style={{ width: '25%', textAlign: 'left' }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Fee Records</Text>
                                    <Text style={{ fontSize: '18px', color: '#4a5568' }}>{jurisdictionFees2.length}</Text>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Total Fees Section */}
            {selectedJurisdiction && (
                <Card
                    style={{
                        marginBottom: '24px',
                        border: '1px solid #d9d9d9',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px'
                    }}
                >
                    <Title level={4} style={{ marginBottom: '30px', color: '#1f2937' }}>
                        Project Fee Calculator
                    </Title>

                    {/* Project Parameters */}
                    <Row gutter={16} style={{ marginBottom: '20px' }}>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Type</Text>
                            <Select
                                value={projectType}
                                onChange={setProjectType}
                                style={{ width: '100%', borderRadius: '8px' }}
                            >
                                <Option value="Single Family Residential">Single Family Residential</Option>
                                <Option value="Multi-Family Residential">Multi-Family Residential</Option>
                                <Option value="Commercial">Commercial</Option>
                                <Option value="Restaurant/Food Service">Restaurant/Food Service</Option>
                                <Option value="Industrial">Industrial</Option>
                            </Select>
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Units</Text>
                            <Input
                                value={projectUnits}
                                onChange={(e) => setProjectUnits(e.target.value)}
                                placeholder="100"
                                style={{ borderRadius: '8px' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Square Footage</Text>
                            <Input
                                value={squareFootage}
                                onChange={(e) => setSquareFootage(e.target.value)}
                                placeholder="80000"
                                style={{ borderRadius: '8px' }}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16} style={{ marginBottom: '50px' }}>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Value ($)</Text>
                            <Input
                                value={projectValue}
                                onChange={(e) => setProjectValue(e.target.value)}
                                placeholder="15000000"
                                style={{ borderRadius: '8px' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Acreage</Text>
                            <Input
                                value={projectAcreage}
                                onChange={(e) => setProjectAcreage(e.target.value)}
                                placeholder="5"
                                style={{ borderRadius: '8px' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Meter Size</Text>
                            <Select
                                value={meterSize}
                                onChange={setMeterSize}
                                style={{ width: '100%', borderRadius: '8px' }}
                            >
                                <Option value="5/8&quot;">5/8"</Option>
                                <Option value="3/4&quot;">3/4"</Option>
                                <Option value="1&quot;">1"</Option>
                                <Option value="1 1/2&quot;">1 1/2"</Option>
                                <Option value="2&quot;">2"</Option>
                                <Option value="3&quot;">3"</Option>
                                <Option value="4&quot;">4"</Option>
                                <Option value="6&quot;">6"</Option>
                                <Option value="6&quot; and greater">6" and greater</Option>
                            </Select>
                        </Col>
                    </Row>

                    {/* Calculated Results */}
                    {(() => {
                        const { total, breakdown } = calculateTotalFees();
                        const applicableFees = breakdown.filter(item => item.amount > 0);

                        // If comparing two locations, show side-by-side comparison
                        if (compareTwoLocations && selectedJurisdiction2) {
                            const { total: total2, breakdown: breakdown2 } = calculateTotalFees2();
                            const applicableFees2 = breakdown2.filter(item => item.amount > 0);

                            return (
                                <>
                                    {/* First Location Summary */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '15px', fontSize: '16px', color: '#1f2937' }}>
                                            {selectedJurisdiction.name}
                                        </Text>
                                        <Row gutter={24}>
                                            <Col span={6}>
                                                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Total Fee Records</Text>
                                                    <Text strong style={{ fontSize: '32px', color: '#000000' }}>{jurisdictionFees.length}</Text>
                                                </div>
                                            </Col>
                                            <Col span={12}>
                                                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Calculated Total Cost</Text>
                                                    <Text strong style={{ fontSize: '32px', color: '#000000' }}>
                                                        ${total.toLocaleString()}
                                                    </Text>
                                                </div>
                                            </Col>
                                            <Col span={6}>
                                                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Applicable Fees</Text>
                                                    <Text strong style={{ fontSize: '32px', color: '#000000' }}>
                                                        {applicableFees.length}
                                                    </Text>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Second Location Summary */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '15px', fontSize: '16px', color: '#1f2937' }}>
                                            {selectedJurisdiction2.name}
                                        </Text>
                                        <Row gutter={24}>
                                            <Col span={6}>
                                                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Total Fee Records</Text>
                                                    <Text strong style={{ fontSize: '32px', color: '#000000' }}>{jurisdictionFees2.length}</Text>
                                                </div>
                                            </Col>
                                            <Col span={12}>
                                                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Calculated Total Cost</Text>
                                                    <Text strong style={{ fontSize: '32px', color: '#000000' }}>
                                                        ${total2.toLocaleString()}
                                                    </Text>
                                                </div>
                                            </Col>
                                            <Col span={6}>
                                                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Applicable Fees</Text>
                                                    <Text strong style={{ fontSize: '32px', color: '#000000' }}>
                                                        {applicableFees2.length}
                                                    </Text>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Fee Breakdowns */}
                                    <Row gutter={24}>
                                        {/* First Location Fee Breakdown */}
                                        <Col span={12}>
                                            {applicableFees.length > 0 && (
                                                <div>
                                                    <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
                                                        {selectedJurisdiction.name} - Fee Breakdown
                                                    </Text>
                                                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px' }}>
                                                        {applicableFees
                                                            .sort((a, b) => b.amount - a.amount)
                                                            .map((item, index) => (
                                                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{item.fee.name}</Text>
                                                                        <Text style={{ fontSize: '12px', color: '#666' }}>
                                                                            {item.fee.category} • {item.fee.unit_label}
                                                                        </Text>
                                                                    </div>
                                                                    <Text strong style={{ fontSize: '14px', color: '#000000', marginLeft: '12px' }}>
                                                                        ${item.amount.toLocaleString()}
                                                                    </Text>
                                                                </div>
                                                            ))}
                                                    </div>
                                                    <Text style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                                                        {applicableFees.length} applicable fees
                                                    </Text>
                                                </div>
                                            )}
                                        </Col>

                                        {/* Second Location Fee Breakdown */}
                                        <Col span={12}>
                                            {applicableFees2.length > 0 && (
                                                <div>
                                                    <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
                                                        {selectedJurisdiction2.name} - Fee Breakdown
                                                    </Text>
                                                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px' }}>
                                                        {applicableFees2
                                                            .sort((a, b) => b.amount - a.amount)
                                                            .map((item, index) => (
                                                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees2.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{item.fee.name}</Text>
                                                                        <Text style={{ fontSize: '12px', color: '#666' }}>
                                                                            {item.fee.category} • {item.fee.unit_label}
                                                                        </Text>
                                                                    </div>
                                                                    <Text strong style={{ fontSize: '14px', color: '#000000', marginLeft: '12px' }}>
                                                                        ${item.amount.toLocaleString()}
                                                                    </Text>
                                                                </div>
                                                            ))}
                                                    </div>
                                                    <Text style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                                                        {applicableFees2.length} applicable fees
                                                    </Text>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </>
                            );
                        }

                        // Single location view (original behavior)
                        return (
                            <>
                                <Row gutter={24}>
                                    <Col span={6}>
                                        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Total Fee Records</Text>
                                            <Text strong style={{ fontSize: '32px', color: '#000000' }}>{jurisdictionFees.length}</Text>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Calculated Total Cost</Text>
                                            <Text strong style={{ fontSize: '32px', color: '#000000' }}>
                                                ${total.toLocaleString()}
                                            </Text>
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666666' }}>Applicable Fees</Text>
                                            <Text strong style={{ fontSize: '32px', color: '#000000' }}>
                                                {applicableFees.length}
                                            </Text>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Fee Breakdown */}
                                {applicableFees.length > 0 && (
                                    <div style={{ marginTop: '20px' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '12px' }}>Fee Breakdown:</Text>
                                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px' }}>
                                            {applicableFees
                                                .sort((a, b) => b.amount - a.amount)
                                                .map((item, index) => (
                                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{item.fee.name}</Text>
                                                            <Text style={{ fontSize: '12px', color: '#666' }}>
                                                                {item.fee.category} • {item.fee.unit_label}
                                                            </Text>
                                                        </div>
                                                        <Text strong style={{ fontSize: '14px', color: '#000000', marginLeft: '12px' }}>
                                                            ${item.amount.toLocaleString()}
                                                        </Text>
                                                    </div>
                                                ))}
                                        </div>

                                        <Text style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                                            Showing all {applicableFees.length} applicable fees
                                        </Text>
                                    </div>
                                )}
                            </>
                        );
                    })()}

                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                        <Text style={{ fontSize: '14px' }} type="secondary">
                            <strong>Note:</strong> Calculations based on current project parameters.
                            Formula-based fees and complex calculations are not yet implemented.
                        </Text>
                    </div>
                </Card>
            )}




        </div>
    );
};

export default CustomLewisPortal;
