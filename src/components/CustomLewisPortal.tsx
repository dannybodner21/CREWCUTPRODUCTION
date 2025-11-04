'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Input, Select, Button, Row, Col, message, Spin, Checkbox, AutoComplete } from 'antd';
import { useTheme } from 'antd-style';
import { Building, MapPin } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';
import { useChatStore } from '@/store/chat';
import { PaywallGuard } from './PaywallGuard';
import { FeeCalculator } from '@/lib/fee-calculator';
import type { ProjectInputs, FeeBreakdown } from '@/lib/fee-calculator';
import { mapProjectType } from '@/lib/project-type-mapping';
import dynamic from 'next/dynamic';

// Dynamically import PDF button to avoid SSR issues
const PDFDownloadButton = dynamic(
    () => import('./PDFDownloadButton').then(mod => ({ default: mod.PDFDownloadButton })),
    { ssr: false }
);

const { Title, Text } = Typography;
const { Search: SearchInput } = Input;
const { Option } = Select;

interface Jurisdiction {
    id: string;
    jurisdiction_name: string;
    jurisdiction_type: string;
    state_code: string;
    state_name: string;
    population?: number | null;
}

const CustomLewisPortal = () => {
    const theme = useTheme();
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
    const [searchJurisdiction, setSearchJurisdiction] = useState('');
    const [filteredJurisdictions, setFilteredJurisdictions] = useState<Jurisdiction[]>([]);

    // Comparison feature state
    const [compareTwoLocations, setCompareTwoLocations] = useState(false);
    const [selectedJurisdiction2, setSelectedJurisdiction2] = useState<Jurisdiction | null>(null);
    const [searchJurisdiction2, setSearchJurisdiction2] = useState('');
    const [filteredJurisdictions2, setFilteredJurisdictions2] = useState<Jurisdiction[]>([]);

    // Project parameters
    const [projectValue, setProjectValue] = useState('');
    const [squareFootage, setSquareFootage] = useState('');
    const [projectUnits, setProjectUnits] = useState('');
    const [projectAcreage, setProjectAcreage] = useState('');
    const [meterSize, setMeterSize] = useState('');
    const [projectType, setProjectType] = useState('');
    const [useSubtype, setUseSubtype] = useState('');
    const [selectedServiceAreaIds, setSelectedServiceAreaIds] = useState<string[]>([]);
    const [selectedServiceAreaIds2, setSelectedServiceAreaIds2] = useState<string[]>([]);
    const [availableServiceAreas, setAvailableServiceAreas] = useState<any[]>([]);
    const [availableServiceAreas2, setAvailableServiceAreas2] = useState<any[]>([]);

    // Fee calculator state
    const [calculator, setCalculator] = useState<FeeCalculator | null>(null);
    const [calculatedFees, setCalculatedFees] = useState<FeeBreakdown | null>(null);
    const [calculatedFees2, setCalculatedFees2] = useState<FeeBreakdown | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Jurisdiction fees state
    const [jurisdictionFees, setJurisdictionFees] = useState<any[]>([]);
    const [jurisdictionFees2, setJurisdictionFees2] = useState<any[]>([]);

    // Feasibility report inputs
    const [reportProjectName, setReportProjectName] = useState('');
    const [reportProjectAddress, setReportProjectAddress] = useState('');
    const [reportDeveloperName, setReportDeveloperName] = useState('');
    const [reportContactEmail, setReportContactEmail] = useState('');
    const [reportProjectDescription, setReportProjectDescription] = useState('');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportCompletionDate, setReportCompletionDate] = useState('');
    const [jurisdictionContactInfo, setJurisdictionContactInfo] = useState<any>(null);

    // Portal integration - get chat store for portal state
    const chatStore = useChatStore();

    // Initialize fee calculator
    useEffect(() => {
        try {
            console.log('🔧 Initializing FeeCalculator...');
            const calc = new FeeCalculator(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            console.log('✅ FeeCalculator created successfully:', calc);
            setCalculator(calc);
        } catch (error) {
            console.error('❌ Failed to initialize fee calculator:', error);
            message.error('Failed to initialize fee calculator. Please check your environment variables.');
        }
    }, []);

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
                            j.jurisdiction_name.toLowerCase().includes(projectData.jurisdictionName.toLowerCase()) ||
                            projectData.jurisdictionName.toLowerCase().includes(j.jurisdiction_name.toLowerCase())
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

        // Clear localStorage to prevent pre-populating form fields with old data
        try {
            localStorage.removeItem('lewis-portal-state');
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }

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

                // Step 1: Get list of available jurisdictions
                const response = await fetch('/api/lewis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getJurisdictions',
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

    // Fetch jurisdiction contact info when jurisdiction is selected
    useEffect(() => {
        const fetchJurisdictionContactInfo = async () => {
            if (!selectedJurisdiction) {
                setJurisdictionContactInfo(null);
                return;
            }

            try {
                const response = await fetch('/api/lewis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getJurisdictionContactInfo',
                        params: { jurisdictionId: selectedJurisdiction.id }
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setJurisdictionContactInfo(result.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch jurisdiction contact info:', error);
            }
        };

        fetchJurisdictionContactInfo();
    }, [selectedJurisdiction]);

    // Filter jurisdictions based on search
    useEffect(() => {
        if (searchJurisdiction.trim() === '') {
            setFilteredJurisdictions(jurisdictions);
        } else {
            const searchTerm = searchJurisdiction.toLowerCase().trim();
            const filtered = jurisdictions.filter(jurisdiction =>
                jurisdiction.jurisdiction_name?.toLowerCase().includes(searchTerm) ||
                jurisdiction.jurisdiction_type?.toLowerCase().includes(searchTerm) ||
                jurisdiction.state_name?.toLowerCase().includes(searchTerm) ||
                jurisdiction.state_code?.toLowerCase().includes(searchTerm)
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
                jurisdiction.jurisdiction_name?.toLowerCase().includes(searchTerm) ||
                jurisdiction.jurisdiction_type?.toLowerCase().includes(searchTerm) ||
                jurisdiction.state_name?.toLowerCase().includes(searchTerm) ||
                jurisdiction.state_code?.toLowerCase().includes(searchTerm)
            );
            setFilteredJurisdictions2(filtered);
        }
    }, [searchJurisdiction2, jurisdictions]);

    // Get jurisdiction stats (total fee count) when jurisdiction is selected
    useEffect(() => {
        if (selectedJurisdiction) {
            const fetchJurisdictionStats = async () => {
                try {
                    const response = await fetch('/api/lewis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getJurisdictionStats',
                            params: {
                                jurisdictionName: selectedJurisdiction.jurisdiction_name,
                                stateCode: selectedJurisdiction.state_code
                            }
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('🔧 getJurisdictionStats result:', result);
                        if (result.success && result.data) {
                            console.log('🔧 Setting jurisdictionFees with totalFees:', result.data.totalFees);
                            setJurisdictionFees([{ totalFees: result.data.totalFees }]);
                        } else {
                            setJurisdictionFees([]);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching jurisdiction stats:', error);
                    setJurisdictionFees([]);
                }
            };

            fetchJurisdictionStats();
        }
    }, [selectedJurisdiction]);

    // Get jurisdiction stats for second jurisdiction
    useEffect(() => {
        if (selectedJurisdiction2) {
            const fetchJurisdictionStats2 = async () => {
                try {
                    const response = await fetch('/api/lewis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getJurisdictionStats',
                            params: {
                                jurisdictionName: selectedJurisdiction2.jurisdiction_name,
                                stateCode: selectedJurisdiction2.state_code
                            }
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            setJurisdictionFees2([{ totalFees: result.data.totalFees }]);
                        } else {
                            setJurisdictionFees2([]);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching jurisdiction stats 2:', error);
                    setJurisdictionFees2([]);
                }
            };

            fetchJurisdictionStats2();
        }
    }, [selectedJurisdiction2]);

    // Fetch service areas when jurisdiction is selected
    useEffect(() => {
        if (selectedJurisdiction) {
            const fetchServiceAreas = async () => {
                try {
                    const response = await fetch('/api/lewis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getServiceAreas',
                            params: { jurisdictionId: selectedJurisdiction.id }
                        })
                    });
                    const result = await response.json();
                    if (result.success && result.data) {
                        setAvailableServiceAreas(result.data);
                        // Reset to empty selection when jurisdiction changes
                        setSelectedServiceAreaIds([]);
                    } else {
                        setAvailableServiceAreas([]);
                    }
                } catch (error) {
                    console.error('Error fetching service areas:', error);
                    setAvailableServiceAreas([]);
                }
            };
            fetchServiceAreas();
        } else {
            setAvailableServiceAreas([]);
            setSelectedServiceAreaIds([]);
        }
    }, [selectedJurisdiction]);

    // Fetch service areas for second jurisdiction
    useEffect(() => {
        if (selectedJurisdiction2) {
            const fetchServiceAreas2 = async () => {
                try {
                    const response = await fetch('/api/lewis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getServiceAreas',
                            params: { jurisdictionId: selectedJurisdiction2.id }
                        })
                    });
                    const result = await response.json();
                    if (result.success && result.data) {
                        setAvailableServiceAreas2(result.data);
                    } else {
                        setAvailableServiceAreas2([]);
                    }
                } catch (error) {
                    console.error('Error fetching service areas 2:', error);
                    setAvailableServiceAreas2([]);
                }
            };
            fetchServiceAreas2();
        } else {
            setAvailableServiceAreas2([]);
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


    // Calculate fees using the working calculateProjectFees API
    const calculateTotalFees = async (): Promise<void> => {
        console.log('🔧 calculateTotalFees called with:', { selectedJurisdiction });
        if (!selectedJurisdiction) {
            console.log('❌ Missing required data for calculation');
            setCalculatedFees(null);
            return;
        }

        setIsCalculating(true);

        try {
            const mapped = mapProjectType(projectType);
            const params = {
                jurisdictionName: selectedJurisdiction.jurisdiction_name,
                stateCode: selectedJurisdiction.state_code,
                selectedServiceAreaIds: selectedServiceAreaIds,
                projectType: mapped?.projectType || projectType,
                useSubtype: mapped?.useSubtype,
                numUnits: parseInt(projectUnits) || 0,
                squareFeet: parseInt(squareFootage) || 0,
                projectValue: parseInt(projectValue) || 0,
                meterSize: meterSize
            };

            console.log('🔥 SENDING TO API:', JSON.stringify(params, null, 2));

            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculateProjectFees',
                    params: params
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ calculateProjectFees result:', result);
                if (result.success && result.data) {
                    console.log('🔥 SETTING calculatedFees with:', {
                        feesArrayLength: result.data.fees?.length,
                        feesArray: result.data.fees,
                        oneTimeFees: result.data.oneTimeFees,
                        monthlyFees: result.data.monthlyFees
                    });
                    setCalculatedFees(result.data);
                    // Update jurisdiction fees with accurate counts from selected service area
                    setJurisdictionFees([{
                        totalFees: result.data.totalFeesFetched || 0,
                        applicableFees: result.data.applicableFeesCount || 0
                    }]);
                    console.log('📊 Updated jurisdiction fees:', {
                        totalFees: result.data.totalFeesFetched,
                        applicableFees: result.data.applicableFeesCount
                    });
                } else {
                    setCalculatedFees(null);
                }
            } else {
                setCalculatedFees(null);
            }

        } catch (error) {
            console.error('Error calculating fees:', error);
            setCalculatedFees(null);
            message.error('Failed to calculate fees. Please check your project parameters.');
        } finally {
            setIsCalculating(false);
        }
    };

    // Recalculate fees when project parameters change
    useEffect(() => {
        console.log('🔧 calculateTotalFees useEffect triggered with:', { selectedJurisdiction: !!selectedJurisdiction, projectType, serviceAreas: selectedServiceAreaIds.length });
        if (selectedJurisdiction) {
            calculateTotalFees();
        }
    }, [selectedJurisdiction, projectType, projectUnits, squareFootage, projectValue, projectAcreage, meterSize, selectedServiceAreaIds]);

    // Calculate fees for second jurisdiction when it changes
    useEffect(() => {
        console.log('🔧 calculateTotalFees2 useEffect triggered with:', { selectedJurisdiction2: !!selectedJurisdiction2, projectType, serviceAreas: selectedServiceAreaIds2.length });
        if (selectedJurisdiction2) {
            calculateTotalFees2();
        }
    }, [selectedJurisdiction2, projectType, projectUnits, squareFootage, projectValue, projectAcreage, meterSize, selectedServiceAreaIds2]);

    // Calculate total fees for second jurisdiction using the same API as first jurisdiction
    const calculateTotalFees2 = async (): Promise<void> => {
        console.log('🔧 calculateTotalFees2 called with:', { selectedJurisdiction2 });
        if (!selectedJurisdiction2) {
            console.log('❌ Missing required data for calculation');
            setCalculatedFees2(null);
            return;
        }

        try {
            const mapped = mapProjectType(projectType);
            const params = {
                jurisdictionName: selectedJurisdiction2.jurisdiction_name,
                stateCode: selectedJurisdiction2.state_code,
                selectedServiceAreaIds: selectedServiceAreaIds2,
                projectType: mapped?.projectType || projectType,
                useSubtype: mapped?.useSubtype,
                numUnits: parseInt(projectUnits) || 0,
                squareFeet: parseInt(squareFootage) || 0,
                projectValue: parseInt(projectValue) || 0,
                meterSize: meterSize
            };

            console.log('🔥 SENDING TO API (jurisdiction 2):', JSON.stringify(params, null, 2));

            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculateProjectFees',
                    params: params
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ calculateProjectFees result for second jurisdiction:', result);
                if (result.success && result.data) {
                    console.log('🔥 SETTING calculatedFees2 with:', {
                        feesArrayLength: result.data.fees?.length,
                        feesArray: result.data.fees,
                        oneTimeFees: result.data.oneTimeFees,
                        monthlyFees: result.data.monthlyFees
                    });
                    setCalculatedFees2(result.data);
                    // Update jurisdiction fees with accurate counts from selected service area
                    setJurisdictionFees2([{
                        totalFees: result.data.totalFeesFetched || 0,
                        applicableFees: result.data.applicableFeesCount || 0
                    }]);
                    console.log('📊 Updated jurisdiction fees 2:', {
                        totalFees: result.data.totalFeesFetched,
                        applicableFees: result.data.applicableFeesCount
                    });
                } else {
                    setCalculatedFees2(null);
                }
            } else {
                setCalculatedFees2(null);
            }

        } catch (error) {
            console.error('Error calculating fees for second jurisdiction:', error);
            setCalculatedFees2(null);
        }
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
                                onChange={(value) => setSearchJurisdiction(value || '')}
                                onSelect={(value) => {
                                    if (!value) return;
                                    setSearchJurisdiction(value);
                                    // Find and select the jurisdiction
                                    const jurisdiction = jurisdictions.find(j =>
                                        j.jurisdiction_name.toLowerCase() === value.toLowerCase() ||
                                        `${j.jurisdiction_name} (${j.jurisdiction_type})`.toLowerCase() === value.toLowerCase()
                                    );
                                    if (jurisdiction) {
                                        setSelectedJurisdiction(jurisdiction);
                                    }
                                }}
                                placeholder="Search cities, towns, counties..."
                                style={{ width: '100%', borderRadius: '8px' }}
                                options={filteredJurisdictions.map(jurisdiction => ({
                                    value: jurisdiction.jurisdiction_name,
                                    label: (
                                        <div style={{ padding: '4px 0' }}>
                                            <div style={{ fontWeight: 500 }}>{jurisdiction.jurisdiction_name}</div>
                                            <div style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                {jurisdiction.jurisdiction_type} • {jurisdiction.population ? jurisdiction.population.toLocaleString() : 'N/A'} people
                                            </div>
                                        </div>
                                    )
                                }))}
                                filterOption={false}
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
                                        {jurisdiction.jurisdiction_name} ({jurisdiction.jurisdiction_type})
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                    </Row>

                    {selectedJurisdiction && (
                        <div style={{ display: 'flex', width: '100%' }}>
                            <div style={{ width: '25%', textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Jurisdiction</Text>
                                <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{selectedJurisdiction.jurisdiction_name}</Text>
                            </div>
                            <div style={{ width: '25%', textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Type</Text>
                                <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                    {selectedJurisdiction.jurisdiction_type}
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
                                <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees[0]?.totalFees || 0}</Text>
                            </div>
                        </div>
                    )}

                    {/* Service Area Multi-Select - Only show if jurisdiction has service areas */}
                    {selectedJurisdiction && availableServiceAreas.length > 1 && (
                        <Row gutter={16} style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <Col span={24}>
                                {/* Special helper text for Los Angeles */}
                                {selectedJurisdiction.jurisdiction_name === 'Los Angeles' && (
                                    <div style={{
                                        marginBottom: '12px',
                                        padding: '12px',
                                        backgroundColor: theme.appearance === 'dark' ? '#1a3a52' : '#e6f4ff',
                                        border: theme.appearance === 'dark' ? '1px solid #2d5a7b' : '1px solid #91caff',
                                        borderRadius: '8px'
                                    }}>
                                        <Text strong style={{ display: 'block', marginBottom: '4px', color: theme.appearance === 'dark' ? '#91caff' : '#0958d9' }}>
                                            ⚠️ Los Angeles requires market area selection
                                        </Text>
                                        <Text style={{ fontSize: '13px', color: theme.appearance === 'dark' ? '#b8d4e8' : '#1677ff' }}>
                                            Fees vary significantly by market area. Please select your project's market area below to see accurate fee calculations.
                                        </Text>
                                    </div>
                                )}

                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                                    Service Areas:{selectedJurisdiction.jurisdiction_name === 'Los Angeles' && <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>}
                                </Text>
                                <Select
                                    mode="multiple"
                                    value={selectedServiceAreaIds}
                                    onChange={setSelectedServiceAreaIds}
                                    placeholder={
                                        selectedJurisdiction.jurisdiction_name === 'Los Angeles'
                                            ? "Select market area (required for accurate calculations)"
                                            : "Select service areas (leave empty for citywide fees only)"
                                    }
                                    style={{
                                        width: '100%',
                                        borderRadius: '8px',
                                        ...(selectedJurisdiction.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds.length === 0 && {
                                            borderColor: theme.appearance === 'dark' ? '#d48806' : '#faad14',
                                            boxShadow: theme.appearance === 'dark' ? '0 0 0 2px rgba(250, 173, 20, 0.2)' : '0 0 0 2px rgba(250, 173, 20, 0.1)'
                                        })
                                    }}
                                    maxTagCount="responsive"
                                >
                                    {availableServiceAreas
                                        .filter(area => area.id !== null) // Exclude the "Citywide" option
                                        .map((area) => (
                                            <Option key={area.id} value={area.id}>
                                                {area.name}
                                                {area.description && ` - ${area.description}`}
                                            </Option>
                                        ))}
                                </Select>
                                <Text style={{
                                    fontSize: '12px',
                                    color: selectedJurisdiction.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds.length === 0
                                        ? (theme.appearance === 'dark' ? '#faad14' : '#d46b08')
                                        : (theme.appearance === 'dark' ? '#888' : '#666'),
                                    marginTop: '4px',
                                    display: 'block',
                                    fontWeight: selectedJurisdiction.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds.length === 0 ? 500 : 400
                                }}>
                                    {selectedJurisdiction.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds.length === 0
                                        ? '⚠️ Select a market area above to see location-specific fees. Affordable Housing Linkage Fees range from $10.32/sq ft (Low Market) to $23.20/sq ft (High Market).'
                                        : selectedServiceAreaIds.length === 0
                                        ? 'No service areas selected - showing jurisdiction-wide fees only'
                                        : `Selected ${selectedServiceAreaIds.length} service area${selectedServiceAreaIds.length > 1 ? 's' : ''} - showing citywide + area-specific fees`}
                                </Text>
                            </Col>
                        </Row>
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
                                        onChange={(value) => setSearchJurisdiction2(value || '')}
                                        onSelect={(value) => {
                                            if (!value) return;
                                            setSearchJurisdiction2(value);
                                            // Find and select the jurisdiction
                                            const jurisdiction = jurisdictions.find(j =>
                                                j.jurisdiction_name.toLowerCase() === value.toLowerCase() ||
                                                `${j.jurisdiction_name} (${j.jurisdiction_type})`.toLowerCase() === value.toLowerCase()
                                            );
                                            if (jurisdiction) {
                                                setSelectedJurisdiction2(jurisdiction);
                                            }
                                        }}
                                        placeholder="Search cities, towns, counties..."
                                        style={{ width: '100%', borderRadius: '8px' }}
                                        options={filteredJurisdictions2.map(jurisdiction => ({
                                            value: jurisdiction.jurisdiction_name,
                                            label: (
                                                <div style={{ padding: '4px 0' }}>
                                                    <div style={{ fontWeight: 500 }}>{jurisdiction.jurisdiction_name}</div>
                                                    <div style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                        {jurisdiction.jurisdiction_type} • {jurisdiction.population ? jurisdiction.population.toLocaleString() : 'N/A'} people
                                                    </div>
                                                </div>
                                            )
                                        }))}
                                        filterOption={false}
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
                                                {jurisdiction.jurisdiction_name} ({jurisdiction.jurisdiction_type})
                                            </Option>
                                        ))}
                                    </Select>
                                </Col>
                            </Row>

                            {selectedJurisdiction2 && (
                                <div style={{ display: 'flex', width: '100%' }}>
                                    <div style={{ width: '25%', textAlign: 'left' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Jurisdiction</Text>
                                        <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{selectedJurisdiction2.jurisdiction_name}</Text>
                                    </div>
                                    <div style={{ width: '25%', textAlign: 'left' }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Type</Text>
                                        <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                            {selectedJurisdiction2.jurisdiction_type}
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
                                        <Text style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees2[0]?.totalFees || 0}</Text>
                                    </div>
                                </div>
                            )}

                            {/* Service Area Multi-Select for Second Jurisdiction */}
                            {selectedJurisdiction2 && availableServiceAreas2.length > 1 && (
                                <Row gutter={16} style={{ marginTop: '20px', marginBottom: '20px' }}>
                                    <Col span={24}>
                                        {/* Special helper text for Los Angeles */}
                                        {selectedJurisdiction2.jurisdiction_name === 'Los Angeles' && (
                                            <div style={{
                                                marginBottom: '12px',
                                                padding: '12px',
                                                backgroundColor: theme.appearance === 'dark' ? '#1a3a52' : '#e6f4ff',
                                                border: theme.appearance === 'dark' ? '1px solid #2d5a7b' : '1px solid #91caff',
                                                borderRadius: '8px'
                                            }}>
                                                <Text strong style={{ display: 'block', marginBottom: '4px', color: theme.appearance === 'dark' ? '#91caff' : '#0958d9' }}>
                                                    ⚠️ Los Angeles requires market area selection
                                                </Text>
                                                <Text style={{ fontSize: '13px', color: theme.appearance === 'dark' ? '#b8d4e8' : '#1677ff' }}>
                                                    Fees vary significantly by market area. Please select your project's market area below to see accurate fee calculations.
                                                </Text>
                                            </div>
                                        )}

                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                                            Service Areas:{selectedJurisdiction2.jurisdiction_name === 'Los Angeles' && <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>}
                                        </Text>
                                        <Select
                                            mode="multiple"
                                            value={selectedServiceAreaIds2}
                                            onChange={setSelectedServiceAreaIds2}
                                            placeholder={
                                                selectedJurisdiction2.jurisdiction_name === 'Los Angeles'
                                                    ? "Select market area (required for accurate calculations)"
                                                    : "Select service areas (leave empty for citywide fees only)"
                                            }
                                            style={{
                                                width: '100%',
                                                borderRadius: '8px',
                                                ...(selectedJurisdiction2.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds2.length === 0 && {
                                                    borderColor: theme.appearance === 'dark' ? '#d48806' : '#faad14',
                                                    boxShadow: theme.appearance === 'dark' ? '0 0 0 2px rgba(250, 173, 20, 0.2)' : '0 0 0 2px rgba(250, 173, 20, 0.1)'
                                                })
                                            }}
                                            maxTagCount="responsive"
                                        >
                                            {availableServiceAreas2
                                                .filter(area => area.id !== null) // Exclude the "Citywide" option
                                                .map((area) => (
                                                    <Option key={area.id} value={area.id}>
                                                        {area.name}
                                                        {area.description && ` - ${area.description}`}
                                                    </Option>
                                                ))}
                                        </Select>
                                        <Text style={{
                                            fontSize: '12px',
                                            color: selectedJurisdiction2.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds2.length === 0
                                                ? (theme.appearance === 'dark' ? '#faad14' : '#d46b08')
                                                : (theme.appearance === 'dark' ? '#888' : '#666'),
                                            marginTop: '4px',
                                            display: 'block',
                                            fontWeight: selectedJurisdiction2.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds2.length === 0 ? 500 : 400
                                        }}>
                                            {selectedJurisdiction2.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds2.length === 0
                                                ? '⚠️ Select a market area above to see location-specific fees. Affordable Housing Linkage Fees range from $10.32/sq ft (Low Market) to $23.20/sq ft (High Market).'
                                                : selectedServiceAreaIds2.length === 0
                                                ? 'No service areas selected - showing jurisdiction-wide fees only'
                                                : `Selected ${selectedServiceAreaIds2.length} service area${selectedServiceAreaIds2.length > 1 ? 's' : ''} - showing citywide + area-specific fees`}
                                        </Text>
                                    </Col>
                                </Row>
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
                                    disabled={!selectedJurisdiction}
                                    placeholder="Choose project type"
                                >
                                    <Option value="" disabled>Choose project type</Option>
                                    <Option value="Single-Family Residential">Single-Family Residential</Option>
                                    <Option value="Multi-Family Residential">Multi-Family Residential</Option>
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
                                    placeholder="Choose meter size"
                                >
                                    <Option value="" disabled>Choose meter size</Option>
                                    <Option value='5/8"'>5/8"</Option>
                                    <Option value='3/4"'>3/4"</Option>
                                    <Option value='1"'>1"</Option>
                                    <Option value='1-1/2"'>1-1/2"</Option>
                                    <Option value='2"'>2"</Option>
                                    <Option value='3"'>3"</Option>
                                    <Option value='4"'>4"</Option>
                                    <Option value='6"'>6"</Option>
                                    <Option value='6" and greater'>6" and greater</Option>
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
                                            Select a jurisdiction and enter project details to calculate fees
                                        </Text>
                                    </div>
                                );
                            }

                            const applicableFees = calculatedFees?.fees?.filter(fee => fee.calculatedAmount > 0) || [];

                            if (applicableFees.length === 0) {
                                // Special message for Los Angeles when no service areas are selected
                                if (selectedJurisdiction.jurisdiction_name === 'Los Angeles' && selectedServiceAreaIds.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <div style={{
                                                maxWidth: '600px',
                                                margin: '0 auto',
                                                padding: '24px',
                                                backgroundColor: theme.appearance === 'dark' ? '#1a3a52' : '#e6f4ff',
                                                border: theme.appearance === 'dark' ? '2px solid #2d5a7b' : '2px solid #91caff',
                                                borderRadius: '12px'
                                            }}>
                                                <Text strong style={{ display: 'block', fontSize: '18px', marginBottom: '12px', color: theme.appearance === 'dark' ? '#91caff' : '#0958d9' }}>
                                                    📍 Market Area Selection Required
                                                </Text>
                                                <Text style={{ display: 'block', fontSize: '15px', marginBottom: '8px', color: theme.appearance === 'dark' ? '#b8d4e8' : '#1677ff' }}>
                                                    Los Angeles fees vary significantly by market area. Please select a market area above to see accurate fee calculations.
                                                </Text>
                                                <Text style={{ display: 'block', fontSize: '14px', color: theme.appearance === 'dark' ? '#94b3c9' : '#4096ff', marginTop: '12px' }}>
                                                    Example: Affordable Housing Linkage Fees range from $10.32/sq ft (Low Market Area) to $23.20/sq ft (High Market Area).
                                                </Text>
                                            </div>
                                        </div>
                                    );
                                }

                                // Default message for other jurisdictions
                                return (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <Text style={{ fontSize: '16px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                            No fees found for this jurisdiction. Please check if the fee data has been loaded correctly.
                                        </Text>
                                    </div>
                                );
                            }

                            // If comparing two locations, show side-by-side comparison
                            if (compareTwoLocations && selectedJurisdiction2 && calculatedFees2) {
                                const applicableFees2 = calculatedFees2?.fees?.filter(fee => fee.calculatedAmount > 0) || [];

                                return (
                                    <>
                                        {/* First Location Summary */}
                                        <div style={{ marginBottom: '30px' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '15px', fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                                {selectedJurisdiction.jurisdiction_name}
                                            </Text>
                                            <Row gutter={24}>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Total Fee Records</Text>
                                                        <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees[0]?.totalFees || 0}</Text>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Calculated Total Cost</Text>
                                                        <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                            ${calculatedFees?.firstYearTotal?.toLocaleString() || '0'}
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Applicable Fees</Text>
                                                        <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                            {jurisdictionFees[0]?.applicableFees || 0}
                                                        </Text>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Second Location Summary */}
                                        <div style={{ marginBottom: '30px' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '15px', fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                                {selectedJurisdiction2.jurisdiction_name}
                                            </Text>
                                            <Row gutter={24}>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Total Fee Records</Text>
                                                        <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{jurisdictionFees2[0]?.totalFees || 0}</Text>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Calculated Total Cost</Text>
                                                        <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                            ${calculatedFees2?.firstYearTotal?.toLocaleString() || '0'}
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col span={6}>
                                                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Applicable Fees</Text>
                                                        <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                            {jurisdictionFees2[0]?.applicableFees || 0}
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
                                                            {selectedJurisdiction.jurisdiction_name} - Fee Breakdown
                                                        </Text>
                                                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9', borderRadius: '8px', padding: '12px' }}>
                                                            {applicableFees
                                                                .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
                                                                .map((fee, index) => (
                                                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees.length - 1 ? (theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9') : 'none' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{fee.feeName}</Text>
                                                                            <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                                                {fee.calculation}
                                                                            </Text>
                                                                        </div>
                                                                        <Text strong style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000', marginLeft: '12px' }}>
                                                                            ${fee.calculatedAmount.toLocaleString()}
                                                                        </Text>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                        <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666', marginTop: '8px', textAlign: 'center' }}>
                                                            {applicableFees.length} applicable fees
                                                        </Text>
                                                    </div>
                                                )}
                                            </Col>

                                            {/* Second Location Fee Breakdown */}
                                            <Col span={12}>
                                                {applicableFees2.length > 0 && (
                                                    <div>
                                                        <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#1f2937' }}>
                                                            {selectedJurisdiction2.jurisdiction_name} - Fee Breakdown
                                                        </Text>
                                                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9', borderRadius: '8px', padding: '12px' }}>
                                                            {applicableFees2
                                                                .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
                                                                .map((fee, index) => (
                                                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < applicableFees2.length - 1 ? (theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9') : 'none' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <Text style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', paddingRight: '25px' }}>{fee.feeName}</Text>
                                                                            <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#cccccc' : '#666' }}>
                                                                                {fee.calculation}
                                                                            </Text>
                                                                        </div>
                                                                        <Text strong style={{ fontSize: '14px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000', marginLeft: '12px' }}>
                                                                            ${fee.calculatedAmount.toLocaleString()}
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

                                        {/* Comparison Summary Table */}
                                        <div style={{
                                            marginTop: '40px',
                                            padding: '24px',
                                            backgroundColor: theme.appearance === 'dark' ? '#1a3a52' : '#e6f4ff',
                                            border: theme.appearance === 'dark' ? '2px solid #2d5a7b' : '2px solid #3b82f6',
                                            borderRadius: '12px'
                                        }}>
                                            <Title level={4} style={{ marginBottom: '20px', color: theme.appearance === 'dark' ? '#91caff' : '#0958d9' }}>
                                                📊 Comparison Summary
                                            </Title>

                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                backgroundColor: theme.appearance === 'dark' ? '#141414' : '#ffffff',
                                                borderRadius: '8px',
                                                overflow: 'hidden'
                                            }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: theme.appearance === 'dark' ? '#1f1f1f' : '#f5f5f5' }}>
                                                        <th style={{
                                                            padding: '12px',
                                                            textAlign: 'left',
                                                            borderBottom: theme.appearance === 'dark' ? '2px solid #3b82f6' : '2px solid #3b82f6',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                                                            fontWeight: 600
                                                        }}>Fee Type</th>
                                                        <th style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '2px solid #3b82f6' : '2px solid #3b82f6',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                                                            fontWeight: 600
                                                        }}>{selectedJurisdiction.jurisdiction_name}</th>
                                                        <th style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '2px solid #3b82f6' : '2px solid #3b82f6',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                                                            fontWeight: 600
                                                        }}>{selectedJurisdiction2.jurisdiction_name}</th>
                                                        <th style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '2px solid #3b82f6' : '2px solid #3b82f6',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                                                            fontWeight: 600
                                                        }}>Difference</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td style={{
                                                            padding: '12px',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                                        }}>One-Time Development Fees</td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                                        }}>${calculatedFees?.oneTimeFees?.toLocaleString() || '0'}</td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                                        }}>${calculatedFees2?.oneTimeFees?.toLocaleString() || '0'}</td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: (calculatedFees?.oneTimeFees || 0) < (calculatedFees2?.oneTimeFees || 0) ? '#059669' : '#dc2626',
                                                            fontWeight: 600
                                                        }}>
                                                            ${Math.abs((calculatedFees?.oneTimeFees || 0) - (calculatedFees2?.oneTimeFees || 0)).toLocaleString()}
                                                            {(calculatedFees?.oneTimeFees || 0) < (calculatedFees2?.oneTimeFees || 0) ? ' cheaper' : ' more expensive'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{
                                                            padding: '12px',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                                        }}>Monthly Operating Costs</td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                                        }}>${calculatedFees?.monthlyFees?.toLocaleString() || '0'}/mo</td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                                        }}>${calculatedFees2?.monthlyFees?.toLocaleString() || '0'}/mo</td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            borderBottom: theme.appearance === 'dark' ? '1px solid #333' : '1px solid #ddd',
                                                            color: (calculatedFees?.monthlyFees || 0) < (calculatedFees2?.monthlyFees || 0) ? '#059669' : '#dc2626',
                                                            fontWeight: 600
                                                        }}>
                                                            ${Math.abs((calculatedFees?.monthlyFees || 0) - (calculatedFees2?.monthlyFees || 0)).toLocaleString()}/mo
                                                            {(calculatedFees?.monthlyFees || 0) < (calculatedFees2?.monthlyFees || 0) ? ' cheaper' : ' more expensive'}
                                                        </td>
                                                    </tr>
                                                    <tr style={{ backgroundColor: theme.appearance === 'dark' ? '#1f1f1f' : '#f5f5f5' }}>
                                                        <td style={{
                                                            padding: '12px',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                                                            fontWeight: 700
                                                        }}><strong>First Year Total</strong></td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                                                            fontWeight: 700
                                                        }}>
                                                            <strong>${calculatedFees?.firstYearTotal?.toLocaleString() || '0'}</strong>
                                                        </td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            color: theme.appearance === 'dark' ? '#ffffff' : '#000000',
                                                            fontWeight: 700
                                                        }}>
                                                            <strong>${calculatedFees2?.firstYearTotal?.toLocaleString() || '0'}</strong>
                                                        </td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'right',
                                                            color: (calculatedFees?.firstYearTotal || 0) < (calculatedFees2?.firstYearTotal || 0) ? '#059669' : '#dc2626',
                                                            fontWeight: 700
                                                        }}>
                                                            <strong>${Math.abs((calculatedFees?.firstYearTotal || 0) - (calculatedFees2?.firstYearTotal || 0)).toLocaleString()}</strong>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <div style={{
                                                marginTop: '20px',
                                                padding: '16px',
                                                backgroundColor: theme.appearance === 'dark' ? '#141414' : '#ffffff',
                                                borderRadius: '8px'
                                            }}>
                                                <Text style={{
                                                    fontSize: '16px',
                                                    color: theme.appearance === 'dark' ? '#ffffff' : '#000000'
                                                }}>
                                                    💡 <strong>
                                                        {(calculatedFees?.oneTimeFees || 0) < (calculatedFees2?.oneTimeFees || 0)
                                                            ? selectedJurisdiction.jurisdiction_name
                                                            : selectedJurisdiction2.jurisdiction_name}
                                                    </strong> is ${Math.abs((calculatedFees?.oneTimeFees || 0) - (calculatedFees2?.oneTimeFees || 0)).toLocaleString()} cheaper in development fees
                                                </Text>
                                            </div>
                                        </div>
                                    </>
                                );
                            }

                            // Single location view - separate one-time vs recurring
                            const oneTimeFees = applicableFees.filter(f => !f.isRecurring);
                            const recurringFees = applicableFees.filter(f => f.isRecurring);

                            return (
                                <>
                                    {/* Summary Cards */}
                                    <Row gutter={16} style={{ marginBottom: '24px' }}>
                                        <Col span={6}>
                                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Text style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Applicable Fees</Text>
                                                <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>{applicableFees.length}</Text>
                                                <Text style={{ display: 'block', fontSize: '11px', color: theme.appearance === 'dark' ? '#999999' : '#999999', marginTop: '4px' }}>
                                                    {oneTimeFees.length} one-time, {recurringFees.length} recurring
                                                </Text>
                                            </div>
                                        </Col>
                                        <Col span={6}>
                                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Text style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>One-Time Costs</Text>
                                                <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                    ${calculatedFees?.oneTimeFees?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                                                </Text>
                                                <Text style={{ display: 'block', fontSize: '11px', color: theme.appearance === 'dark' ? '#999999' : '#999999', marginTop: '4px' }}>
                                                    {oneTimeFees.length} fees
                                                </Text>
                                            </div>
                                        </Col>
                                        <Col span={6}>
                                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Text style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Monthly Costs</Text>
                                                <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                    ${calculatedFees?.monthlyFees?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                                                </Text>
                                                <Text style={{ display: 'block', fontSize: '11px', color: theme.appearance === 'dark' ? '#999999' : '#999999', marginTop: '4px' }}>
                                                    {recurringFees.length} fees | ${calculatedFees?.annualOperatingCosts?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}/year
                                                </Text>
                                            </div>
                                        </Col>
                                        <Col span={6}>
                                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: theme.appearance === 'dark' ? '#222222' : '#ffffff', borderRadius: '8px', boxShadow: theme.appearance === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Text style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>First Year Total</Text>
                                                <Text strong style={{ fontSize: '20px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                    ${calculatedFees?.firstYearTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                                                </Text>
                                                <Text style={{ display: 'block', fontSize: '11px', color: theme.appearance === 'dark' ? '#999999' : '#999999', marginTop: '4px' }}>
                                                    One-time + 12 months
                                                </Text>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* One-Time Development Fees */}
                                    {oneTimeFees.length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>
                                                One-Time Development Fees ({oneTimeFees.length})
                                            </Text>
                                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9', borderRadius: '8px', padding: '12px', backgroundColor: theme.appearance === 'dark' ? '#1a1a1a' : '#fafafa' }}>
                                                {oneTimeFees
                                                    .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
                                                    .map((fee, index) => (
                                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: index < oneTimeFees.length - 1 ? (theme.appearance === 'dark' ? '1px solid #333333' : '1px solid #e8e8e8') : 'none' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>{fee.feeName}</Text>
                                                                <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#999999' : '#666666', display: 'block' }}>
                                                                    {fee.agencyName} • {fee.serviceArea}
                                                                </Text>
                                                                <Text style={{ fontSize: '11px', color: theme.appearance === 'dark' ? '#888888' : '#888888', display: 'block', marginTop: '2px' }}>
                                                                    {fee.calculation}
                                                                </Text>
                                                            </div>
                                                            <Text strong style={{ fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000', marginLeft: '16px', whiteSpace: 'nowrap' }}>
                                                                ${fee.calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </Text>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: theme.appearance === 'dark' ? '#1a1a1a' : '#e8e8e8', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text strong style={{ fontSize: '14px' }}>Subtotal</Text>
                                                <Text strong style={{ fontSize: '18px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                    ${calculatedFees?.oneTimeFees?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                                                </Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Monthly Operating Fees */}
                                    {recurringFees.length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>
                                                Monthly Operating Fees ({recurringFees.length})
                                            </Text>
                                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: theme.appearance === 'dark' ? '1px solid #444444' : '1px solid #d9d9d9', borderRadius: '8px', padding: '12px', backgroundColor: theme.appearance === 'dark' ? '#1a1a1a' : '#fafafa' }}>
                                                {recurringFees
                                                    .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
                                                    .map((fee, index) => (
                                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: index < recurringFees.length - 1 ? (theme.appearance === 'dark' ? '1px solid #333333' : '1px solid #e8e8e8') : 'none' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>{fee.feeName}</Text>
                                                                <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#999999' : '#666666', display: 'block' }}>
                                                                    {fee.agencyName} • {fee.serviceArea}
                                                                </Text>
                                                                <Text style={{ fontSize: '11px', color: theme.appearance === 'dark' ? '#888888' : '#888888', display: 'block', marginTop: '2px' }}>
                                                                    {fee.calculation}
                                                                </Text>
                                                            </div>
                                                            <div style={{ marginLeft: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                                <Text strong style={{ fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000', display: 'block' }}>
                                                                    ${fee.calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                                                                </Text>
                                                                <Text style={{ fontSize: '12px', color: theme.appearance === 'dark' ? '#999999' : '#666666' }}>
                                                                    ${(fee.calculatedAmount * 12).toLocaleString(undefined, { minimumFractionDigits: 2 })}/yr
                                                                </Text>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: theme.appearance === 'dark' ? '#1a1a1a' : '#e8e8e8', borderRadius: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <Text strong style={{ fontSize: '14px' }}>Monthly Subtotal</Text>
                                                    <Text strong style={{ fontSize: '18px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                        ${calculatedFees?.monthlyFees?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}/month
                                                    </Text>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={{ fontSize: '13px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>Annual Subtotal (×12)</Text>
                                                    <Text strong style={{ fontSize: '16px', color: theme.appearance === 'dark' ? '#ffffff' : '#000000' }}>
                                                        ${calculatedFees?.annualOperatingCosts?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}/year
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </Card>
                )}

                {/* Feasibility Report Section */}
                {selectedJurisdiction && calculatedFees && (
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
                            Feasibility Report
                        </Title>

                        <Text style={{ display: 'block', marginBottom: '20px', color: theme.appearance === 'dark' ? '#cccccc' : '#666666' }}>
                            Complete the information below to generate a professional feasibility report PDF with all project details.
                        </Text>

                        {/* Report Inputs */}
                        <Row gutter={16} style={{ marginBottom: '20px' }}>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Name</Text>
                                <Input
                                    value={reportProjectName}
                                    onChange={(e) => setReportProjectName(e.target.value)}
                                    placeholder="e.g., Sunset Ridge Development"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Address</Text>
                                <Input
                                    value={reportProjectAddress}
                                    onChange={(e) => setReportProjectAddress(e.target.value)}
                                    placeholder="Street address or general location"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: '20px' }}>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Developer/Company Name</Text>
                                <Input
                                    value={reportDeveloperName}
                                    onChange={(e) => setReportDeveloperName(e.target.value)}
                                    placeholder="Your company name"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Contact Email</Text>
                                <Input
                                    type="email"
                                    value={reportContactEmail}
                                    onChange={(e) => setReportContactEmail(e.target.value)}
                                    placeholder="your.email@company.com"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: '20px' }}>
                            <Col span={24}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Project Description (Optional)</Text>
                                <Input.TextArea
                                    value={reportProjectDescription}
                                    onChange={(e) => setReportProjectDescription(e.target.value)}
                                    placeholder="Brief description of the development"
                                    rows={3}
                                    style={{ borderRadius: '8px' }}
                                />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: '30px' }}>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Expected Start Date (Optional)</Text>
                                <Input
                                    type="date"
                                    value={reportStartDate}
                                    onChange={(e) => setReportStartDate(e.target.value)}
                                    style={{ borderRadius: '8px' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Expected Completion Date (Optional)</Text>
                                <Input
                                    type="date"
                                    value={reportCompletionDate}
                                    onChange={(e) => setReportCompletionDate(e.target.value)}
                                    style={{ borderRadius: '8px' }}
                                />
                            </Col>
                        </Row>

                        {/* PDF Download Button */}
                        <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: theme.appearance === 'dark' ? '1px solid #333333' : '1px solid #e8e8e8' }}>
                            <PDFDownloadButton
                                breakdown={calculatedFees}
                                projectName={reportProjectName || `${projectType} Project`}
                                projectAddress={reportProjectAddress || selectedJurisdiction.jurisdiction_name}
                                jurisdictionName={selectedJurisdiction.jurisdiction_name}
                                developerName={reportDeveloperName}
                                contactEmail={reportContactEmail}
                                projectDescription={reportProjectDescription}
                                startDate={reportStartDate}
                                completionDate={reportCompletionDate}
                                jurisdictionContactInfo={jurisdictionContactInfo}
                            />
                        </div>
                    </Card>
                )}

            </div>
        </PaywallGuard>
    );
};

export default CustomLewisPortal;
