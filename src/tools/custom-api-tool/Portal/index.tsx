import { memo, useEffect, useState, useCallback } from 'react';
import { Card, Typography, Form, Input, Select, Button, Table, Tag, Row, Col, Statistic, Divider, message, Spin, Alert } from 'antd';
import { createStyles } from 'antd-style';
import { Building, MapPin, Calculator, Search, Filter, Plus, Minus, DollarSign } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';
import { useTranslation } from 'react-i18next';

import { BuiltinPortalProps } from '@/types/tool';
import { hybridLewisService } from '../hybrid-lewis-service';

const { Text, Title } = Typography;
const { Option } = Select;
const { Search: SearchInput } = Input;

const useStyles = createStyles(({ token }) => ({
    container: {
        padding: 16,
        maxWidth: 1200,
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
    },
}));

// Interface definitions
interface City {
    id: number;
    name: string;
    state: string;
    county: string;
    population: number;
}

interface Fee {
    id: number;
    category: string;
    description: string;
    amount: number;
    calculationMethod: string;
    cityId: number;
}

interface ComparisonData {
    cityName: string;
    totalFees: number;
    breakdown: Fee[];
}

const CustomApiToolPortal = memo<BuiltinPortalProps>(({
    arguments: args,
    messageId,
    state,
    apiName
}) => {
    const { t } = useTranslation('common');
    const { styles } = useStyles();
    const [form] = Form.useForm();

    // Debug logging
    console.log('🔧 PORTAL DEBUG: ConstructionFeePortal rendered with:', {
        args,
        messageId,
        state,
        apiName,
        stateType: typeof state,
        stateLength: typeof state === 'string' ? state.length : 'N/A',
        statePreview: typeof state === 'string' ? state.substring(0, 200) + '...' : 'N/A'
    });

    // State management
    const [cities, setCities] = useState<City[]>([]);
    const [fees, setFees] = useState<Fee[]>([]);
    const [selectedCity, setSelectedCity] = useState<number | null>(null);
    const [filteredFees, setFilteredFees] = useState<Fee[]>([]);
    const [feeCategoryFilter, setFeeCategoryFilter] = useState<string>('');
    const [feeSearchTerm, setFeeSearchTerm] = useState<string>('');
    const [citySearchTerm, setCitySearchTerm] = useState<string>('');
    const [stateFilter, setStateFilter] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [selectedState, setSelectedState] = useState<string>('');
    const [stateFeeData, setStateFeeData] = useState<any[]>([]);
    const [loadingStateData, setLoadingStateData] = useState(false);

    // Parse the tool state to get data
    let toolState;
    try {
        // Check if state is empty or undefined
        if (!state || state === '' || state === '{}') {
            console.log('🔧 PORTAL DEBUG: Empty or undefined state, using fallback');
            toolState = { message: 'No data available', states: [] };
        } else {
            // The state comes as a JSON string from the message content
            // We need to parse it to get the actual data
            console.log('🔧 PORTAL DEBUG: Attempting to parse state:', {
                state,
                stateType: typeof state,
                isString: typeof state === 'string',
                isEmpty: state === '',
                isObject: typeof state === 'object'
            });

            toolState = typeof state === 'string' ? JSON.parse(state) : state;
            console.log('🔧 PORTAL DEBUG: Successfully parsed toolState:', toolState);
        }
    } catch (parseError) {
        // If parsing fails, treat as simple text response
        console.log('🔧 PORTAL DEBUG: Failed to parse state, treating as text:', parseError);
        console.log('🔧 PORTAL DEBUG: Raw state that failed to parse:', state);
        toolState = { message: state || 'No response data available', states: [] };
    }

    // Check if this is a simple response or full data
    const isSimpleResponse = toolState && (toolState.message || toolState.error);
    const hasFullData = toolState && toolState.cities && toolState.fees;

    console.log('🔧 PORTAL DEBUG: Response type:', { isSimpleResponse, hasFullData });

    // Define the loadStateFeeData function first
    const loadStateFeeData = useCallback(async (stateName: string) => {
        console.log('🔧 Loading fee data for state:', stateName);
        setLoadingStateData(true);
        setSelectedState(stateName);
        try {
            // Get cities for this state
            const citiesResult = await hybridLewisService.getCities();
            console.log('🔧 Cities result:', citiesResult);

            if (citiesResult.success && citiesResult.data) {
                const stateCities = citiesResult.data.filter((city: any) =>
                    city.state === stateName
                );
                console.log('🔧 Cities in state:', stateCities);

                // Get fees for cities in this state
                let allStateFees: any[] = [];
                for (const city of stateCities) {
                    console.log('🔧 Getting fees for city:', city);
                    const feesResult = await hybridLewisService.getFeesByCity(city.id);
                    console.log('🔧 Fees result for city:', city.id, feesResult);
                    if (feesResult.success && feesResult.data) {
                        allStateFees.push(...feesResult.data);
                    }
                }

                console.log('🔧 All state fees collected:', allStateFees);
                setStateFeeData(allStateFees);
            }
        } catch (err) {
            console.error('🔧 Error loading state fee data:', err);
            setError('Failed to load fee data for selected state');
        } finally {
            setLoadingStateData(false);
        }
    }, []);

    // Define the loadInitialData function
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            // Load cities
            const citiesResult = await hybridLewisService.getCities();
            if (citiesResult.success) {
                setCities(citiesResult.data || []);
            }

            // Load fees
            const feesResult = await hybridLewisService.getFees();
            if (feesResult.success) {
                setFees(feesResult.data || []);
            }
        } catch (err) {
            setError('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Always render something - fallback for debugging
    if (!toolState) {
        return (
            <Flexbox gap={16} style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
                <Card>
                    <Title level={3}>Portal Debug</Title>
                    <Text>No tool state available</Text>
                    <pre>{JSON.stringify({ args, messageId, state, apiName }, null, 2)}</pre>
                </Card>
            </Flexbox>
        );
    }

    // If this is a simple response (like getStatesCount), show it nicely
    if (isSimpleResponse && !hasFullData) {
        return (
            <Flexbox gap={16} style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
                <Card>
                    <Flexbox align="center" gap={16} horizontal>
                        <Building size={32} />
                        <div>
                            <Title level={2} style={{ margin: 0 }}>LEWIS Response</Title>
                            <Text type="secondary">Tool execution result</Text>
                        </div>
                    </Flexbox>
                    <Divider style={{ margin: '16px 0' }} />
                    {/* Show states list if available */}
                    {toolState.states && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {toolState.states.map((state: string, index: number) => (
                                    <Button
                                        key={index}
                                        type={selectedState === state ? 'primary' : 'default'}
                                        size="small"
                                        onClick={() => loadStateFeeData(state)}
                                        style={{ marginBottom: 8 }}
                                    >
                                        {state}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* State Fee Data Table */}
                    {selectedState && (
                        <div style={{ marginTop: 24 }}>
                            <Card size="small">
                                <Title level={4} style={{ marginBottom: 16 }}>
                                    Fee Data for {selectedState}
                                </Title>

                                {/* Debug info */}
                                <div style={{ marginBottom: 16, fontSize: 12, color: '#666' }}>
                                    <Text>Debug: selectedState={selectedState}, stateFeeData.length={stateFeeData.length}</Text>
                                    <pre style={{ marginTop: 8, fontSize: 10 }}>
                                        {JSON.stringify(stateFeeData.slice(0, 2), null, 2)}
                                    </pre>
                                </div>

                                {loadingStateData ? (
                                    <Flexbox align="center" justify="center" style={{ padding: 20 }}>
                                        <Spin size="small" />
                                        <Text style={{ marginLeft: 8 }}>Loading fee data...</Text>
                                    </Flexbox>
                                ) : stateFeeData.length > 0 ? (
                                    <Table
                                        dataSource={stateFeeData}
                                        columns={[
                                            {
                                                title: 'City',
                                                dataIndex: 'city_name',
                                                key: 'city_name',
                                                render: (text) => <Text strong>{text}</Text>
                                            },
                                            {
                                                title: 'Fee Category',
                                                dataIndex: 'fee_category',
                                                key: 'fee_category',
                                                render: (text) => <Tag color="green">{text}</Tag>
                                            },
                                            {
                                                title: 'Description',
                                                dataIndex: 'fee_description',
                                                key: 'fee_description',
                                                ellipsis: true
                                            },
                                            {
                                                title: 'Amount',
                                                dataIndex: 'verified_amounts',
                                                key: 'verified_amounts',
                                                render: (value) => {
                                                    // Handle currency strings like "$77" or "$26"
                                                    let amount = 0;
                                                    if (typeof value === 'string') {
                                                        // Extract numeric value from currency string
                                                        const match = value.match(/\$?(\d+(?:\.\d+)?)/);
                                                        if (match) {
                                                            amount = parseFloat(match[1]);
                                                        }
                                                    } else if (typeof value === 'number') {
                                                        amount = value;
                                                    }

                                                    return (
                                                        <Text strong style={{ color: '#52c41a' }}>
                                                            ${amount.toFixed(2)}
                                                        </Text>
                                                    );
                                                }
                                            },
                                            {
                                                title: 'Calculation Method',
                                                dataIndex: 'calculation_methods',
                                                key: 'calculation_methods'
                                            }
                                        ]}
                                        pagination={{ pageSize: 10 }}
                                        size="small"
                                        rowKey="id"
                                    />
                                ) : (
                                    <Text type="secondary">No fee data available for {selectedState}</Text>
                                )}
                            </Card>
                        </div>
                    )}
                </Card>
            </Flexbox>
        );
    }

    // Don't render the full portal if we don't have cities data yet
    if (cities.length === 0 && !loading) {
        // Check if we're still waiting for the message content to be updated
        if (!state || state === '' || state === '{}') {
            return (
                <Flexbox gap={16} style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
                    <Card>
                        <Title level={3}>Waiting for LEWIS Response...</Title>
                        <Text>The LEWIS tool is processing your request. Please wait a moment...</Text>
                        <div style={{ marginTop: 16 }}>
                            <Text type="secondary">Debug Info:</Text>
                            <pre style={{ fontSize: 12, marginTop: 8 }}>
                                {JSON.stringify({
                                    hasState: !!state,
                                    stateType: typeof state,
                                    stateLength: typeof state === 'string' ? state.length : 'N/A',
                                    messageId,
                                    apiName,
                                    args
                                }, null, 2)}
                            </pre>
                        </div>
                    </Card>
                </Flexbox>
            );
        }

        return (
            <Flexbox gap={16} style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
                <Card>
                    <Title level={3}>Loading...</Title>
                    <Text>Waiting for LEWIS data to load...</Text>
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">Debug Info:</Text>
                        <pre style={{ fontSize: 12, marginTop: 8 }}>
                            {JSON.stringify({
                                hasState: !!state,
                                stateType: typeof state,
                                stateLength: typeof state === 'string' ? state.length : 'N/A',
                                toolState,
                                isSimpleResponse,
                                hasFullData
                            }, null, 2)}
                        </pre>
                    </div>
                </Card>
            </Flexbox>
        );
    }

    // Load initial data
    useEffect(() => {
        // If we have LEWIS response data, use it to populate the interface
        if (isSimpleResponse && toolState.states && cities.length === 0) {
            console.log('🔧 PORTAL DEBUG: Using LEWIS response data to populate interface');
            // Set the cities based on the states we know have data
            // This will give us a basic structure to work with
            const newCities = toolState.states.map((state: string, index: number) => ({
                id: index + 1,
                name: `Cities in ${state}`,
                state: state,
                county: 'Various Counties',
                population: 0
            }));

            // Set basic fee categories
            const newFees = [
                { id: 1, category: 'Building Permit', description: 'Standard building permit fees', amount: 0, calculationMethod: 'Per project', cityId: 1 },
                { id: 2, category: 'Plan Review', description: 'Architectural and engineering review', amount: 0, calculationMethod: 'Per project', cityId: 1 },
                { id: 3, category: 'Inspection', description: 'Construction inspection fees', amount: 0, calculationMethod: 'Per inspection', cityId: 1 }
            ];

            setCities(newCities);
            setFees(newFees);
            setLoading(false);
            return;
        }

        // Only load data if we're not showing a simple response and haven't loaded yet
        if (!isSimpleResponse && cities.length === 0 && !loading) {
            loadInitialData();
        }
    }, [isSimpleResponse, toolState.states, cities.length, loading, loadInitialData]);

    // Filter fees when filters change
    useEffect(() => {
        filterFees();
    }, [fees, selectedCity, feeCategoryFilter, feeSearchTerm]);

    // Load fees when a city is selected
    useEffect(() => {
        if (selectedCity !== null) {
            loadFeesForCity(selectedCity);
        }
    }, [selectedCity]);

    const loadCities = async () => {
        // Use the hybrid Lewis service to get cities from the database
        return await hybridLewisService.getCities();
    };

    const loadFees = async () => {
        // Use the hybrid Lewis service to get fees from the database
        // For now, return empty array - fees will be loaded when a city is selected
        return { success: true, data: [] };
    };

    const loadFeesForCity = async (cityId: number) => {
        try {
            const result = await hybridLewisService.getFeesByCity(cityId);
            if (result.success && result.data) {
                // Transform the data to match our Fee interface
                const transformedFees: Fee[] = result.data.map((fee: any) => ({
                    id: fee.id,
                    category: fee.fee_category || 'Unknown',
                    description: fee.fee_description || 'No description available',
                    amount: parseFloat(fee.verified_amounts || '0') || 0,
                    calculationMethod: fee.calculation_methods || 'Unknown',
                    cityId: fee.city_id
                }));
                setFees(transformedFees);
            }
        } catch (err) {
            setError('Failed to load fees for selected city');
        }
    };

    const filterFees = () => {
        let filtered = fees;

        // Filter by city
        if (selectedCity !== null) {
            filtered = filtered.filter(fee => fee.cityId === selectedCity);
        }

        // Filter by category
        if (feeCategoryFilter) {
            filtered = filtered.filter(fee =>
                fee.category.toLowerCase().includes(feeCategoryFilter.toLowerCase())
            );
        }

        // Filter by search term
        if (feeSearchTerm) {
            filtered = filtered.filter(fee =>
                fee.description.toLowerCase().includes(feeSearchTerm.toLowerCase()) ||
                fee.category.toLowerCase().includes(feeSearchTerm.toLowerCase())
            );
        }

        setFilteredFees(filtered);
    };

    const getUniqueStates = () => {
        return [...new Set(cities.map(city => city.state))];
    };

    const getUniqueCategories = () => {
        return [...new Set(fees.map(fee => fee.category))];
    };

    const getUniqueStatesAsync = async () => {
        try {
            const result = await hybridLewisService.getUniqueStates();
            return result.success ? result.data || [] : [];
        } catch (err) {
            return [];
        }
    };

    if (loading && cities.length === 0) {
        return (
            <Flexbox align="center" justify="center" style={{ height: '100vh' }}>
                <Spin size="large" />
                <Text style={{ marginTop: 16 }}>Loading LEWIS Construction Fee Portal...</Text>
            </Flexbox>
        );
    }

    return (
        <Flexbox gap={16} style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <Card>
                <Flexbox align="center" gap={16} horizontal>
                    <Building size={32} />
                    <div>
                        <Title level={2} style={{ margin: 0 }}>LEWIS - Construction Fee Portal</Title>
                        <Text type="secondary">National Construction Fee Calculator & Database</Text>
                    </div>
                </Flexbox>
                <Divider style={{ margin: '16px 0' }} />
                <Row gutter={16}>
                    <Col span={8}>
                        <Statistic
                            title="Total Cities"
                            value={cities.length}
                            prefix={<MapPin />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="States Covered"
                            value={toolState.states ? toolState.states.length : getUniqueStates().length}
                            prefix={<Building />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Fee Categories"
                            value={fees.length}
                            prefix={<Calculator />}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Filters */}
            <Card>
                <Title level={4}>Search & Filters</Title>
                <Row gutter={16}>
                    <Col span={8}>
                        <Text strong>State</Text>
                        <Select
                            placeholder="All States"
                            value={stateFilter}
                            onChange={setStateFilter}
                            style={{ width: '100%', marginTop: 8 }}
                            allowClear
                        >
                            {(toolState.states || getUniqueStates()).map((state: string) => (
                                <Option key={state} value={state}>
                                    {state}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={8}>
                        <Text strong>City</Text>
                        <SearchInput
                            placeholder="Search cities..."
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                            style={{ marginTop: 8 }}
                        />
                    </Col>
                    <Col span={8}>
                        <Text strong>Fee Category</Text>
                        <Select
                            placeholder="All Categories"
                            value={feeCategoryFilter}
                            onChange={setFeeCategoryFilter}
                            style={{ width: '100%', marginTop: 8 }}
                            allowClear
                        >
                            {getUniqueCategories().map(category => (
                                <Option key={category} value={category}>
                                    {category}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Cities List */}
            <Card>
                <Title level={4}>Cities with Fee Data</Title>
                <Table
                    dataSource={cities}
                    columns={[
                        {
                            title: 'City',
                            dataIndex: 'name',
                            key: 'name',
                            render: (text) => <Text strong>{text}</Text>
                        },
                        {
                            title: 'State',
                            dataIndex: 'state',
                            key: 'state',
                            render: (text) => <Tag color="blue">{text}</Tag>
                        },
                        {
                            title: 'County',
                            dataIndex: 'county',
                            key: 'county'
                        },
                        {
                            title: 'Population',
                            dataIndex: 'population',
                            key: 'population',
                            render: (value) => value.toLocaleString()
                        },
                        {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                                <Button
                                    type={selectedCity === record.id ? 'primary' : 'default'}
                                    onClick={() => setSelectedCity(record.id)}
                                >
                                    {selectedCity === record.id ? 'Selected' : 'Select'}
                                </Button>
                            )
                        }
                    ]}
                    pagination={{ pageSize: 10 }}
                    size="small"
                    rowKey="id"
                />
            </Card>

            {/* Fees for Selected City */}
            {selectedCity && (
                <Card>
                    <Title level={4}>
                        Fees for {cities.find(c => c.id === selectedCity)?.name}
                    </Title>
                    <Table
                        dataSource={filteredFees}
                        columns={[
                            {
                                title: 'Category',
                                dataIndex: 'category',
                                key: 'category',
                                render: (text) => <Tag color="green">{text}</Tag>
                            },
                            {
                                title: 'Description',
                                dataIndex: 'description',
                                key: 'description'
                            },
                            {
                                title: 'Amount',
                                dataIndex: 'amount',
                                key: 'amount',
                                render: (value) => (
                                    <Text strong style={{ color: '#52c41a' }}>
                                        ${value.toFixed(2)}
                                    </Text>
                                )
                            },
                            {
                                title: 'Calculation Method',
                                dataIndex: 'calculationMethod',
                                key: 'calculationMethod'
                            }
                        ]}
                        pagination={{ pageSize: 10 }}
                        size="small"
                        rowKey="id"
                    />
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError('')}
                />
            )}
        </Flexbox>
    );
});

CustomApiToolPortal.displayName = 'CustomApiToolPortal';

export default CustomApiToolPortal;
