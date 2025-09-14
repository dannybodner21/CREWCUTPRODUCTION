'use client';

import { Button, Table, message } from 'antd';
import { useTheme } from 'antd-style';
import { Building, X } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/slices/portal/selectors';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors, sessionSelectors } from '@/store/session/selectors';
import { PaywallGuard } from './PaywallGuard';

interface JurisdictionData {
    id: string;
    name: string;
    type: string;
    population: number | null;
    totalFees: number;
}

interface Fee {
    id: string;
    name: string;
    category: string;
    rate: string;
    formula?: string;
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
    acreage: number;
    meterSize: string;
    trips?: number;
}

const LewisPortalButton = memo(() => {
    const [showJurisdictionsPopup, setShowJurisdictionsPopup] = useState(false);
    const [jurisdictionsData, setJurisdictionsData] = useState<JurisdictionData[]>([]);
    const [loading, setLoading] = useState(false);
    const currentSession = useSessionStore(sessionSelectors.currentSession);
    const currentAgent = useChatStore((s) => s.currentAgent);
    const title = useSessionStore(sessionMetaSelectors.currentAgentTitle);
    const theme = useTheme();

    // Use the same detection logic as useLewisPortalAutoOpen
    const isLewisSession = currentSession?.agentId === 'lewis' ||
        currentAgent?.identifier === 'lewis' ||
        currentSession?.meta?.title?.toLowerCase().includes('lewis');

    const togglePortal = useChatStore((s) => s.togglePortal);
    const showPortal = useChatStore(chatPortalSelectors.showPortal);

    // Fee calculation function using proper fee_versions logic
    const calculateFeeAmount = (fee: Fee, projectParams: ProjectParameters): number => {
        const { units, squareFootage, projectValue, acreage = 0, meterSize = '6"' } = projectParams;

        // Check if we have valid fee_versions data
        if (!fee.calc_method || fee.base_rate === null || fee.base_rate === undefined) {
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
                break;

            case 'per_sqft':
                amount = baseRate * squareFootage;
                break;

            case 'per_unit':
                amount = baseRate * units;
                break;

            case 'percent_of_valuation':
                amount = baseRate * projectValue;
                break;

            case 'per_trip':
                // For now, assume trips are passed in projectParams or derive from units
                const trips = projectParams.trips || (units * 2); // Simple fallback: 2 trips per unit
                amount = baseRate * trips;
                break;

            case 'meter_size':
                if (fee.formula_json && typeof fee.formula_json === 'object') {
                    const meterKey = `METER_${meterSize.replace(/"/g, '').replace('.', '_')}IN`;
                    amount = fee.formula_json[meterKey] || baseRate;
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
                            const context = {
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

                            // Simple expression parser
                            let evaluatedExpr = expr;
                            Object.keys(context).forEach(key => {
                                const regex = new RegExp(`\\b${key}\\b`, 'g');
                                evaluatedExpr = evaluatedExpr.replace(regex, context[key]);
                            });

                            amount = eval(evaluatedExpr);
                        } else if (fee.formula_json.switch) {
                            // Switch statement evaluation
                            const context = {
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
                        }
                    } catch (error) {
                        console.error('Custom fee evaluation error:', error);
                        amount = baseRate;
                    }
                } else {
                    amount = baseRate;
                }
                break;

            default:
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

        return amount;
    };

    // Debug logging
    console.log('🔧 LewisPortalButton DEBUG:', {
        currentSession,
        currentAgent,
        title,
        isLewisSession,
        showPortal,
        agentId: currentSession?.agentId,
        identifier: currentAgent?.identifier
    });

    // Fetch jurisdictions data for the popup
    const fetchJurisdictionsData = async () => {
        setLoading(true);
        try {
            // First, get all jurisdictions
            const jurisdictionsResponse = await fetch('/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getJurisdictionsWithFees',
                }),
            });

            if (!jurisdictionsResponse.ok) {
                throw new Error('Failed to fetch jurisdictions data');
            }

            const jurisdictionsResult = await jurisdictionsResponse.json();
            console.log('🔧 Jurisdictions API Response:', jurisdictionsResult);

            if (jurisdictionsResult.success && jurisdictionsResult.data) {
                // For each jurisdiction, fetch its fees and calculate total
                const transformedData = await Promise.all(
                    jurisdictionsResult.data.map(async (jurisdiction: any) => {
                        try {
                            // Fetch fees for this jurisdiction
                            const feesResponse = await fetch('/api/lewis', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'getJurisdictionFees',
                                    params: { jurisdictionId: jurisdiction.id }
                                })
                            });

                            let totalFees = 0;
                            if (feesResponse.ok) {
                                const feesResult = await feesResponse.json();
                                if (feesResult.success && feesResult.data) {
                                    // Use standard project parameters for calculation
                                    const projectParams: ProjectParameters = {
                                        units: 100, // Default values for comparison
                                        squareFootage: 10000,
                                        projectValue: 1000000,
                                        acreage: 1,
                                        meterSize: '6"'
                                    };

                                    // Calculate total fees for ALL fees (not just applicable ones)
                                    totalFees = feesResult.data.reduce((sum: number, fee: Fee) => {
                                        return sum + calculateFeeAmount(fee, projectParams);
                                    }, 0);
                                }
                            }

                            return {
                                id: jurisdiction.id,
                                name: jurisdiction.name,
                                type: jurisdiction.type,
                                population: jurisdiction.population,
                                totalFees: totalFees,
                            };
                        } catch (error) {
                            console.error(`Error fetching fees for jurisdiction ${jurisdiction.name}:`, error);
                            return {
                                id: jurisdiction.id,
                                name: jurisdiction.name,
                                type: jurisdiction.type,
                                population: jurisdiction.population,
                                totalFees: 0,
                            };
                        }
                    })
                );

                setJurisdictionsData(transformedData);
            } else {
                message.error('Failed to load jurisdictions data');
            }
        } catch (error) {
            console.error('Error fetching jurisdictions data:', error);
            message.error('Failed to load jurisdictions data');
        } finally {
            setLoading(false);
        }
    };

    // TEMPORARY: Force show button for debugging
    const forceShow = true;

    if (!isLewisSession && !forceShow) {
        console.log('🔧 LewisPortalButton: Not a Lewis session, returning null');
        return null;
    }

    return (
        <PaywallGuard>
            <Flexbox
                align="center"
                justify="center"
                horizontal
                gap={16}
                style={{
                    padding: '16px 0',
                    marginTop: '20px',
                    marginBottom: '20px',
                    borderBottom: theme.appearance === 'dark' ? '1px solid #333333' : '1px solid #f0f0f0',
                    backgroundColor: theme.appearance === 'dark' ? '#000000' : '#fafafa'
                }}
            >
                <Button
                    onClick={() => togglePortal()}
                    size="large"
                    style={{
                        height: 50,
                        width: 250,
                        fontSize: 14,
                        paddingInline: 32,
                        borderRadius: 12,
                        backgroundColor: theme.appearance === 'dark' ? '#000000' : '#ffffff',
                        borderColor: theme.appearance === 'dark' ? '#666666' : '#d9d9d9',
                        color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                        fontWeight: 400,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        background: theme.appearance === 'dark'
                            ? 'linear-gradient(135deg, #000000 0%, #111111 25%, #000000 50%, #222222 75%, #000000 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%)',
                        backgroundSize: '200% 200%',
                        animation: 'shimmer 3s ease-in-out infinite',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(1px)';
                        e.currentTarget.style.animation = 'none';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.animation = 'shimmer 3s ease-in-out infinite';
                    }}
                    type="default"
                >
                    {showPortal ? 'Close Construction Portal' : 'Open Construction Portal'}
                </Button>
                <Button
                    onClick={() => {
                        setShowJurisdictionsPopup(true);
                        fetchJurisdictionsData();
                    }}
                    size="large"
                    style={{
                        height: 50,
                        width: 250,
                        fontSize: 14,
                        paddingInline: 32,
                        borderRadius: 12,
                        backgroundColor: theme.appearance === 'dark' ? '#000000' : '#ffffff',
                        borderColor: theme.appearance === 'dark' ? '#666666' : '#d9d9d9',
                        color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                        fontWeight: 400,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        background: theme.appearance === 'dark'
                            ? 'linear-gradient(135deg, #000000 0%, #111111 25%, #000000 50%, #222222 75%, #000000 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%)',
                        backgroundSize: '200% 200%',
                        animation: 'shimmer 3s ease-in-out infinite',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(1px)';
                        e.currentTarget.style.animation = 'none';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.animation = 'shimmer 3s ease-in-out infinite';
                    }}
                    type="default"
                >
                    View Top Jurisdictions
                </Button>
            </Flexbox>

            {/* Jurisdictions Popup Overlay */}
            {showJurisdictionsPopup && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowJurisdictionsPopup(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            width: '60%',
                            height: '60%',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowJurisdictionsPopup(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={24} color="#000000" />
                        </button>

                        {/* Content Area */}
                        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
                            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                                All Jurisdictions
                            </h2>
                            <p style={{ color: '#666666', marginBottom: '24px' }}>
                                View all jurisdictions with their total fees and population. Click column headers to sort.
                            </p>

                            <Table
                                dataSource={jurisdictionsData}
                                loading={loading}
                                pagination={{
                                    pageSize: 50,
                                    showSizeChanger: false,
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jurisdictions`,
                                }}
                                columns={[
                                    {
                                        title: 'Jurisdiction Name',
                                        dataIndex: 'name',
                                        key: 'name',
                                        sorter: (a, b) => a.name.localeCompare(b.name),
                                        render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
                                    },
                                    {
                                        title: 'Type',
                                        dataIndex: 'type',
                                        key: 'type',
                                        sorter: (a, b) => a.type.localeCompare(b.type),
                                        render: (text) => <span style={{ textTransform: 'capitalize', color: '#666666' }}>{text}</span>,
                                    },
                                    {
                                        title: 'Population',
                                        dataIndex: 'population',
                                        key: 'population',
                                        sorter: (a, b) => (a.population || 0) - (b.population || 0),
                                        render: (value) => value ? value.toLocaleString() : 'N/A',
                                        align: 'right' as const,
                                    },
                                    {
                                        title: 'Total Fees',
                                        dataIndex: 'totalFees',
                                        key: 'totalFees',
                                        sorter: (a, b) => a.totalFees - b.totalFees,
                                        render: (value) => (
                                            <span style={{ fontWeight: 600, color: '#1f2937' }}>
                                                ${value.toLocaleString()}
                                            </span>
                                        ),
                                        align: 'right' as const,
                                    },
                                ]}
                                rowKey="id"
                                style={{ marginTop: '16px' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        background-position: -200% -200%;
                    }
                    100% {
                        background-position: 200% 200%;
                    }
                }
            `}</style>
        </PaywallGuard>
    );
});

LewisPortalButton.displayName = 'LewisPortalButton';

export default LewisPortalButton;
