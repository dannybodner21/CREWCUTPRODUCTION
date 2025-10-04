'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Input, Select, Button, Row, Col, message, Spin, Checkbox, AutoComplete } from 'antd';
import { useTheme } from 'antd-style';
import { Building, MapPin } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';
import { useChatStore } from '@/store/chat';
import { PaywallGuard } from './PaywallGuard';

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
    // New fee_versions fields
    calc_method: string;
    base_rate: number;
    min_fee: number | null;
    max_fee: number | null;
    unit_id: string;
    formula_json: any;
    status: string;
    effective_start: string;
    effective_end: string | null;
}

interface ProjectParameters {
    units: number;
    squareFootage: number;
    projectValue: number;
    acreage?: number;
    meterSize?: string;
    trips?: number;
}

const CustomLewisPortal = () => {
    const theme = useTheme();
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

    // Fee calculation function using proper fee_versions logic
    const calculateFeeAmount = (fee: Fee, projectParams: ProjectParameters): number => {
        const { units, squareFootage, projectValue, acreage = 0, meterSize = '6"' } = projectParams;

        // Debug logging
        console.log('🔧 FEE CALCULATION DEBUG:', {
            feeName: fee.name,
            calcMethod: fee.calc_method,
            baseRate: fee.base_rate,
            unitId: fee.unit_id,
            minFee: fee.min_fee,
            maxFee: fee.max_fee,
            squareFootage,
            units,
            projectValue,
            meterSize
        });

        // Check if we have valid fee_versions data
        if (!fee.calc_method || fee.base_rate === null || fee.base_rate === undefined) {
            console.log('🔧 FALLBACK TO LEGACY RATE:', { feeName: fee.name, legacyRate: fee.rate });
            // Fallback to legacy rate if fee_versions data is missing
            if (!fee.rate || isNaN(parseFloat(fee.rate))) {
                return 0;
            }
            return parseFloat(fee.rate);
        }

        let amount = 0;
        const baseRate = fee.base_rate;

        // Calculate based on calc_method
        switch (fee.calc_method) {
            case 'flat':
                amount = baseRate;
                console.log('🔧 FLAT FEE:', { feeName: fee.name, baseRate, amount });
                break;

            case 'per_sqft':
                amount = baseRate * squareFootage;
                console.log('🔧 PER SQFT FEE:', { feeName: fee.name, baseRate, squareFootage, amount });
                break;

            case 'per_unit':
                amount = baseRate * units;
                console.log('🔧 PER UNIT FEE:', { feeName: fee.name, baseRate, units, amount });
                break;

            case 'percent_of_valuation':
                amount = baseRate * projectValue;
                console.log('🔧 PERCENT OF VALUATION FEE:', { feeName: fee.name, baseRate, projectValue, amount });
                break;

            case 'per_trip':
                // For now, assume trips are passed in projectParams or derive from units
                const trips = projectParams.trips || (units * 2); // Simple fallback: 2 trips per unit
                amount = baseRate * trips;
                console.log('🔧 PER TRIP FEE:', { feeName: fee.name, baseRate, trips, amount });
                break;

            case 'meter_size':
                if (fee.formula_json && typeof fee.formula_json === 'object') {
                    const meterKey = `METER_${meterSize.replace(/"/g, '').replace('.', '_')}IN`;
                    amount = fee.formula_json[meterKey] || baseRate;
                    console.log('🔧 METER SIZE FEE:', { feeName: fee.name, meterSize, meterKey, amount });
                } else {
                    amount = baseRate;
                }
                break;

            case 'custom':
                if (fee.formula_json) {
                    try {
                        if (fee.formula_json.expr) {
                            // Simple expression evaluation
                            const expr = fee.formula_json.expr;
                            const context: Record<string, any> = {
                                units,
                                squareFootage,
                                projectValue,
                                valuation: projectValue,
                                res_sqft: squareFootage,
                                nonres_sqft: 0,
                                total_sqft: squareFootage,
                                trips: projectParams.trips || (units * 2),
                                meter_size: meterSize
                            };

                            // Simple expression parser (you might want to use a proper math expression library)
                            let evaluatedExpr = expr;
                            Object.keys(context).forEach(key => {
                                const regex = new RegExp(`\\b${key}\\b`, 'g');
                                evaluatedExpr = evaluatedExpr.replace(regex, context[key]);
                            });

                            amount = eval(evaluatedExpr);
                            console.log('🔧 CUSTOM EXPR FEE:', { feeName: fee.name, expr, context, amount });
                        } else if (fee.formula_json.switch) {
                            // Switch statement evaluation
                            const context: Record<string, any> = {
                                units,
                                squareFootage,
                                projectValue,
                                valuation: projectValue,
                                res_sqft: squareFootage,
                                nonres_sqft: 0,
                                total_sqft: squareFootage,
                                trips: projectParams.trips || (units * 2),
                                meter_size: meterSize
                            };

                            for (const case_ of fee.formula_json.switch) {
                                const condition = case_.when.replace(/\bunits\b/g, units)
                                    .replace(/\bvaluation\b/g, projectValue)
                                    .replace(/\bsquareFootage\b/g, squareFootage);

                                if (eval(condition)) {
                                    const expr = case_.expr.replace(/\bunits\b/g, units)
                                        .replace(/\bvaluation\b/g, projectValue)
                                        .replace(/\bsquareFootage\b/g, squareFootage);
                                    amount = eval(expr);
                                    break;
                                }
                            }
                            console.log('🔧 CUSTOM SWITCH FEE:', { feeName: fee.name, switch: fee.formula_json.switch, amount });
                        }
                    } catch (error) {
                        console.error('🔧 CUSTOM FEE EVALUATION ERROR:', error);
                        amount = baseRate;
                    }
                } else {
                    amount = baseRate;
                }
                break;

            default:
                console.log('🔧 UNKNOWN CALC METHOD, USING BASE RATE:', { feeName: fee.name, calcMethod: fee.calc_method, baseRate });
                amount = baseRate;
        }

        // Apply min/max fee constraints
        if (fee.min_fee !== null && fee.min_fee !== undefined) {
            amount = Math.max(amount, fee.min_fee);
        }
        if (fee.max_fee !== null && fee.max_fee !== undefined) {
            amount = Math.min(amount, fee.max_fee);
        }

        // Round to 2 decimal places
        amount = Math.round(amount * 100) / 100;

        console.log('🔧 FINAL FEE AMOUNT:', { feeName: fee.name, amount, minFee: fee.min_fee, maxFee: fee.max_fee });
        return amount;
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

    // Calculate total fees for current project using calc_simple_fees
    const [calculatedFees, setCalculatedFees] = useState<{
        jurisdiction: string;
        items: Array<{ fee: string; method: string; base_rate: number; qty: number; amount: number }>;
        per_sqft_total: string;
        per_unit_total: string;
        flat_total: string;
        grand_total: string;
    } | null>(null);

    const [isCalculating, setIsCalculating] = useState(false);

    // Calculate fees using SQL function
    const calculateTotalFees = async (): Promise<void> => {
        if (!selectedJurisdiction) {
            setCalculatedFees(null);
            return;
        }

        setIsCalculating(true);

        try {
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculateProjectFeesWithSQL',
                    params: {
                        city: selectedJurisdiction.name,
                        use: projectType.toLowerCase().includes('residential') ? 'residential' : 'commercial',
                        useSubtype: projectType.toLowerCase().includes('multi') ? 'multifamily' :
                            projectType.toLowerCase().includes('single') ? 'single_family' : null,
                        dwellings: parseInt(projectUnits) || 0,
                        resSqft: parseInt(squareFootage) || 0,
                        trips: (parseInt(projectUnits) || 0) * 2, // Simple fallback: 2 trips per unit
                        valuation: parseInt(projectValue) || 0
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    // Use the data exactly as returned by calc_simple_fees
                    setCalculatedFees(result.data);
                } else {
                    console.error('Error calculating fees:', result.error);
                    setCalculatedFees(null);
                }
            } else {
                console.error('Failed to calculate fees');
                setCalculatedFees(null);
            }
        } catch (error) {
            console.error('Error calculating fees:', error);
            setCalculatedFees(null);
        } finally {
            setIsCalculating(false);
        }
    };

    // Recalculate fees when project parameters change
    useEffect(() => {
        if (selectedJurisdiction) {
            calculateTotalFees();
        }
    }, [selectedJurisdiction, projectType, projectUnits, squareFootage, projectValue, projectAcreage, meterSize]);

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
                <Card style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    backgroundColor: theme.appearance === 'dark' ? '#111111' : '#ffffff',
                    border: theme.appearance === 'dark' ? '1px solid #333333' : '1px solid #d9d9d9'
                }}>
                    <Title level={3} style={{ color: '#faad14' }}>No Jurisdictions with Fee Data</Title>
                    <Text type="secondary" style={{
                        fontSize: '16px',
                        color: theme.appearance === 'dark' ? '#cccccc' : undefined
                    }}>
                        There was an error retrieving jurisdiction fee data. Please refresh and try again.
                    </Text>
                </Card>
            </div>
        );
    }

    return (
        <PaywallGuard>
            <div style={{
                padding: '24px',
                height: '100%',
                overflow: 'auto',
                backgroundColor: theme.appearance === 'dark' ? '#000000' : '#ffffff'
            }}>
                {/* Header */}
                <div
                    style={{
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: theme.appearance === 'dark' ? '#000000' : '#ffffff'
                    }}
                >
                    <Flexbox align="center" gap={16} style={{ marginBottom: '20px' }}>
                        <Building size={32} style={{ color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }} />
                        <Title level={4} style={{
                            margin: 0,
                            color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937',
                            fontSize: '22px'
                        }}>
                            LEWIS Construction Portal
                        </Title>
                    </Flexbox>
                    <div style={{
                        width: '60%',
                        height: '1px',
                        backgroundColor: theme.appearance === 'dark' ? '#666666' : 'rgba(0, 0, 0, 0.3)',
                        margin: '0 auto 16px auto'
                    }} />

                </div>

                {/* Jurisdiction Selection Section */}
                <Card
                    style={{
                        marginBottom: '24px',
                        border: theme.appearance === 'dark' ? '1px solid #333333' : '1px solid #d9d9d9',
                        borderRadius: '12px',
                        backgroundColor: theme.appearance === 'dark' ? '#111111' : '#ffffff'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <Title level={4} style={{
                            margin: 0,
                            color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937'
                        }}>
                            Jurisdiction Selection
                        </Title>
                        <Checkbox
                            checked={compareTwoLocations}
                            onChange={(e) => setCompareTwoLocations(e.target.checked)}
                            style={{
                                fontSize: '14px',
                                color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                            }}
                        >
                            Compare two locations
                        </Checkbox>
                    </div>

                    <Row gutter={16} style={{ marginBottom: '30px' }}>
                        <Col span={12}>
                            <Text strong style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                            }}>Search Jurisdictions:</Text>
                            <AutoComplete
                                value={searchJurisdiction}
                                onChange={(value) => setSearchJurisdiction(value)}
                                onSelect={(value) => {
                                    setSearchJurisdiction(value);
                                    // Find and select the jurisdiction
                                    const jurisdiction = jurisdictions.find(j =>
                                        j.name.toLowerCase() === value.toLowerCase() ||
                                        `${j.name} (${j.kind || j.type})`.toLowerCase() === value.toLowerCase()
                                    );
                                    if (jurisdiction) {
                                        setSelectedJurisdiction(jurisdiction);
                                    }
                                }}
                                placeholder="Search cities, towns, counties..."
                                style={{ width: '100%', borderRadius: '8px' }}
                                options={filteredJurisdictions.map(jurisdiction => ({
                                    value: jurisdiction.name,
                                    label: (
                                        <div style={{ padding: '4px 0' }}>
                                            <div style={{ fontWeight: 500 }}>{jurisdiction.name}</div>
                                            <div style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                {jurisdiction.kind || jurisdiction.type} • {jurisdiction.population ? jurisdiction.population.toLocaleString() : 'N/A'} people
                                            </div>
                                        </div>
                                    )
                                }))}
                                filterOption={(inputValue, option) => {
                                    if (!inputValue) return true;
                                    return option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false;
                                }}
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
                                <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{selectedJurisdiction.name}</Text>
                            </div>
                            <div style={{ width: '25%', textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Type</Text>
                                <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                    {selectedJurisdiction.kind || selectedJurisdiction.type}
                                </Text>
                            </div>
                            <div style={{ width: '25%', textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Population</Text>
                                <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                    {selectedJurisdiction.population ? selectedJurisdiction.population.toLocaleString() : 'N/A'}
                                </Text>
                            </div>
                            <div style={{ width: '25%', textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Fee Records</Text>
                                <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees.length}</Text>
                            </div>
                        </div>
                    )}

                    {/* Second Jurisdiction Selection - Only show when comparison is enabled */}
                    {compareTwoLocations && (
                        <>
                            <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                                <Title level={5} style={{ marginBottom: '15px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                    Second Location
                                </Title>
                            </div>

                            <Row gutter={16} style={{ marginBottom: '20px' }}>
                                <Col span={12}>
                                    <Text strong style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                    }}>Search Jurisdictions:</Text>
                                    <AutoComplete
                                        value={searchJurisdiction2}
                                        onChange={(value) => setSearchJurisdiction2(value)}
                                        onSelect={(value) => {
                                            setSearchJurisdiction2(value);
                                            // Find and select the jurisdiction
                                            const jurisdiction = jurisdictions.find(j =>
                                                j.name.toLowerCase() === value.toLowerCase() ||
                                                `${j.name} (${j.kind || j.type})`.toLowerCase() === value.toLowerCase()
                                            );
                                            if (jurisdiction) {
                                                setSelectedJurisdiction2(jurisdiction);
                                            }
                                        }}
                                        placeholder="Search cities, towns, counties..."
                                        style={{ width: '100%', borderRadius: '8px' }}
                                        options={filteredJurisdictions2.map(jurisdiction => ({
                                            value: jurisdiction.name,
                                            label: (
                                                <div style={{ padding: '4px 0' }}>
                                                    <div style={{ fontWeight: 500 }}>{jurisdiction.name}</div>
                                                    <div style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                        {jurisdiction.kind || jurisdiction.type} • {jurisdiction.population ? jurisdiction.population.toLocaleString() : 'N/A'} people
                                                    </div>
                                                </div>
                                            )
                                        }))}
                                        filterOption={(inputValue, option) => {
                                            if (!inputValue) return true;
                                            return option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false;
                                        }}
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
                                        <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{selectedJurisdiction2.name}</Text>
                                    </div>
                                    <div style={{ width: '25%', textAlign: 'left' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Type</Text>
                                        <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                            {selectedJurisdiction2.kind || selectedJurisdiction2.type}
                                        </Text>
                                    </div>
                                    <div style={{ width: '25%', textAlign: 'left' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Population</Text>
                                        <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                            {selectedJurisdiction2.population ? selectedJurisdiction2.population.toLocaleString() : 'N/A'}
                                        </Text>
                                    </div>
                                    <div style={{ width: '25%', textAlign: 'left' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Fee Records</Text>
                                        <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees2.length}</Text>
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
                            border: theme.appearance === 'dark' ? '1px solid #333333' : '1px solid #d9d9d9',
                            boxShadow: theme.appearance === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
                            borderRadius: '12px',
                            backgroundColor: theme.appearance === 'dark' ? '#111111' : '#ffffff'
                        }}
                    >
                        <Title level={4} style={{ marginBottom: '30px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
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
                        {isCalculating ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Spin size="large" />
                                <div style={{ marginTop: '16px', fontSize: '16px' }}>Calculating fees...</div>
                            </div>
                        ) : (() => {
                            if (!calculatedFees) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <Text style={{ fontSize: '16px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                            Click "Calculate Fees" to see results
                                        </Text>
                                    </div>
                                );
                            }

                            const { items, per_sqft_total, per_unit_total, flat_total, grand_total } = calculatedFees;
                            const applicableFees = items.filter(item => item.amount > 0);

                            // If comparing two locations, show side-by-side comparison
                            if (compareTwoLocations && selectedJurisdiction2) {
                                const { total: total2, breakdown: breakdown2 } = calculateTotalFees2();
                                const applicableFees2 = breakdown2.filter(item => item.amount > 0);

                                return (
                                    <>
                                        {/* First Location Summary */}
                                        <div style={{ marginBottom: '30px' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '15px', fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                                {selectedJurisdiction.name}
                                            </Text>
                                            <Row gutter={24}>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Total Fee Records</Text>
                                                        <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees.length}</Text>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Calculated Total Cost</Text>
                                                        <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                            {grand_total}
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Applicable Fees</Text>
                                                        <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                            {applicableFees.length}
                                                        </Text>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Second Location Summary */}
                                        <div style={{ marginBottom: '30px' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '15px', fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                                {selectedJurisdiction2.name}
                                            </Text>
                                            <Row gutter={24}>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Total Fee Records</Text>
                                                        <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees2.length}</Text>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Calculated Total Cost</Text>
                                                        <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                            ${total2.toLocaleString()}
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Applicable Fees</Text>
                                                        <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
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
                                                        <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                                            {selectedJurisdiction.name} - Fee Breakdown
                                                        </Text>
                                                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9', borderRadius: '8px', padding: '12px' }}>
                                                            {applicableFees
                                                                .sort((a, b) => b.amount - a.amount)
                                                                .map((item, index) => (
                                                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees.length - 1 ? (theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9') : 'none' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{item.fee}</Text>
                                                                            <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                                                {item.method} • ${item.base_rate} × {item.qty}
                                                                            </Text>
                                                                        </div>
                                                                        <Text strong style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000', marginLeft: '12px' }}>
                                                                            ${item.amount.toLocaleString()}
                                                                        </Text>
                                                                    </div>
                                                                ))}
                                                        </div>
                                            <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666', marginTop: '8px', textAlign: 'center' }}>
                                                {applicableFees.length} applicable fees
                                            </Text>
                                        </div>
                                    )}

                                    {/* Subtotals */}
                                    <div style={{ marginTop: '20px', padding: '16px', backgroundColor: theme.appearance === 'dark' ? '#1a1a1a' : '#f8f9fa', borderRadius: '8px' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>Fee Summary:</Text>
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>Per Sq Ft</Text>
                                                    <Text strong style={{ display: 'block', fontSize: '18px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                        {per_sqft_total}
                                                    </Text>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>Per Unit</Text>
                                                    <Text strong style={{ display: 'block', fontSize: '18px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                        {per_unit_total}
                                                    </Text>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>Flat Fees</Text>
                                                    <Text strong style={{ display: 'block', fontSize: '18px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                        {flat_total}
                                                    </Text>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                            </Col>

                                            {/* Second Location Fee Breakdown */}
                                            <Col span={12}>
                                                {applicableFees2.length > 0 && (
                                                    <div>
                                                        <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                                            {selectedJurisdiction2.name} - Fee Breakdown
                                                        </Text>
                                                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9', borderRadius: '8px', padding: '12px' }}>
                                                            {applicableFees2
                                                                .sort((a, b) => b.amount - a.amount)
                                                                .map((item, index) => (
                                                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees2.length - 1 ? (theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9') : 'none' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{item.fee.name}</Text>
                                                                            <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                                                {item.fee.category} • {item.fee.unit_label}
                                                                            </Text>
                                                                        </div>
                                                                        <Text strong style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000', marginLeft: '12px' }}>
                                                                            ${item.amount.toLocaleString()}
                                                                        </Text>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                        <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666', marginTop: '8px', textAlign: 'center' }}>
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
                                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Total Fee Records</Text>
                                                <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees.length}</Text>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Calculated Total Cost</Text>
                                                <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                    {grand_total}
                                                </Text>
                                            </div>
                                        </Col>
                                        <Col span={6}>
                                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Applicable Fees</Text>
                                                <Text strong style={{ fontSize: '32px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                    {applicableFees.length}
                                                </Text>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Fee Breakdown */}
                                    {applicableFees.length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '12px' }}>Fee Breakdown:</Text>
                                            <div style={{ maxHeight: '400px', overflowY: 'auto', border: theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9', borderRadius: '8px', padding: '12px' }}>
                                                {applicableFees
                                                    .sort((a, b) => b.amount - a.amount)
                                                    .map((item, index) => (
                                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees.length - 1 ? (theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9') : 'none' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{item.fee}</Text>
                                                                <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                                    {item.method} • ${item.base_rate} × {item.qty}
                                                                </Text>
                                                            </div>
                                                            <Text strong style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000', marginLeft: '12px' }}>
                                                                ${item.amount.toLocaleString()}
                                                            </Text>
                                                        </div>
                                                    ))}
                                            </div>

                                            <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666', marginTop: '8px', textAlign: 'center' }}>
                                                Showing all {applicableFees.length} applicable fees
                                            </Text>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                            <Text style={{ fontSize: '14px' }} type="secondary">
                                <strong>Note:</strong> Calculations are performed using the calc_simple_fees database function for accurate results.
                            </Text>
                        </div>
                    </Card>
                )}




            </div>
        </PaywallGuard>
    );
};

export default CustomLewisPortal;
