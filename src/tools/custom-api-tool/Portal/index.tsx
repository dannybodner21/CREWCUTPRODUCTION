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
    message
} from 'antd';
import { createStyles } from 'antd-style';
import {
    Building,
    MapPin,
    Calculator,
    Search,
    DollarSign,
    Home,
    Briefcase,
    Ruler,
    FileText,
    BarChart3,
    Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { BuiltinPortalProps } from '@/types/tool';

const { Search: SearchInput } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const useStyles = createStyles(({ token }) => ({
    feeTable: {
        '.ant-table-thead > tr > th': {
            backgroundColor: token.colorBgContainer,
            borderBottom: `2px solid ${token.colorBorder}`,
            fontWeight: 600,
            color: token.colorTextHeading,
            fontSize: 13,
            padding: '12px 16px',
        },
        '.ant-table-tbody > tr > td': {
            padding: '12px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
        },
        '.ant-table-tbody > tr:hover > td': {
            backgroundColor: token.colorBgTextHover,
        },
        '.ant-table-tbody > tr:nth-child(even)': {
            backgroundColor: token.colorBgContainer,
        },
        '.ant-table-tbody > tr:nth-child(odd)': {
            backgroundColor: token.colorBgLayout,
        },
        '.ant-table-pagination': {
            margin: '16px 0',
        },
        '.ant-table-container': {
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadius,
            overflow: 'hidden',
        },
    },
    tableContainer: {
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadius,
        border: `1px solid ${token.colorBorder}`,
        overflow: 'hidden',
        boxShadow: token.boxShadowTertiary,
    },
    categoryTag: {
        margin: 0,
        borderRadius: 4,
        fontWeight: 500,
        fontSize: 12,
        border: 'none',
    },
    amountText: {
        fontFamily: 'Monaco, Menlo, monospace',
        color: token.colorPrimary,
        fontSize: 13,
        fontWeight: 500,
    },
    methodText: {
        fontSize: 12,
        color: token.colorTextSecondary,
        fontStyle: 'italic',
    },
}));

interface City {
    id: string;
    name: string;
    population: number;
    county: string;
    state: string;
    stateCode: string;
}

interface Fee {
    id: string;
    category: string;
    description: string;
    amount: number;
    calculationMethod: string;
    cityId: string;
}

interface FeeCalculation {
    projectType: 'residential' | 'commercial' | 'mixed-use';
    projectValue: number;
    squareFootage: number;
    totalUnits: number;
    mixedUseComponents?: {
        residential: number;
        retail: number;
        office?: number;
        industrial?: number;
    };
    cityId: string;
}

interface ComparisonData {
    cityName: string;
    totalFees: number;
    breakdown: {
        category: string;
        amount: number;
        description: string;
    }[];
}

const ConstructionFeePortal = memo<BuiltinPortalProps>(({
    arguments: args,
    messageId,
    state,
    apiName
}) => {
    const { t } = useTranslation('common');
    const { styles } = useStyles();
    const [form] = Form.useForm();
    const [comparisonForm] = Form.useForm();

    // State management
    const [cities, setCities] = useState<City[]>([]);
    const [fees, setFees] = useState<Fee[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [filteredFees, setFilteredFees] = useState<Fee[]>([]);
    const [feeCategoryFilter, setFeeCategoryFilter] = useState<string>('');
    const [feeSearchTerm, setFeeSearchTerm] = useState<string>('');
    const [citySearchTerm, setCitySearchTerm] = useState<string>('');
    const [stateFilter, setStateFilter] = useState<string>('');
    const [calculationResults, setCalculationResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // New state for comparison tool
    const [selectedCitiesForComparison, setSelectedCitiesForComparison] = useState<string[]>([]);
    const [comparisonResults, setComparisonResults] = useState<ComparisonData[]>([]);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    // Parse the tool state to get data
    const toolState = typeof state === 'string' ? JSON.parse(state) : state;

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Filter fees when filters change
    useEffect(() => {
        filterFees();
    }, [fees, selectedCity, feeCategoryFilter, feeSearchTerm]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Load cities
            const citiesResult = await loadCities();
            if (citiesResult.success) {
                setCities(citiesResult.data || []);
            }

            // Load fees
            const feesResult = await loadFees();
            if (feesResult.success) {
                setFees(feesResult.data || []);
            }
        } catch (err) {
            setError('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const loadCities = async () => {
        // This would call your custom API tool
        // For now, return mock data with cities from multiple states
        return {
            success: true,
            data: [
                // Arizona Cities
                { id: '1', name: 'Phoenix', population: 1608139, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '2', name: 'Tucson', population: 542629, county: 'Pima', state: 'Arizona', stateCode: 'AZ' },
                { id: '3', name: 'Mesa', population: 504258, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '4', name: 'Chandler', population: 275987, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '5', name: 'Scottsdale', population: 241361, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '6', name: 'Gilbert', population: 267918, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '7', name: 'Glendale', population: 248325, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '8', name: 'Tempe', population: 180587, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '9', name: 'Peoria', population: 190985, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },
                { id: '10', name: 'Surprise', population: 141664, county: 'Maricopa', state: 'Arizona', stateCode: 'AZ' },

                // California Cities
                { id: '11', name: 'Los Angeles', population: 3979576, county: 'Los Angeles', state: 'California', stateCode: 'CA' },
                { id: '12', name: 'San Diego', population: 1419516, county: 'San Diego', state: 'California', stateCode: 'CA' },
                { id: '13', name: 'San Jose', population: 1030119, county: 'Santa Clara', state: 'California', stateCode: 'CA' },
                { id: '14', name: 'San Francisco', population: 873965, county: 'San Francisco', state: 'California', stateCode: 'CA' },
                { id: '15', name: 'Fresno', population: 542107, county: 'Fresno', state: 'California', stateCode: 'CA' },
                { id: '16', name: 'Sacramento', population: 513624, county: 'Sacramento', state: 'California', stateCode: 'CA' },
                { id: '17', name: 'Long Beach', population: 466742, county: 'Los Angeles', state: 'California', stateCode: 'CA' },
                { id: '18', name: 'Oakland', population: 440646, county: 'Alameda', state: 'California', stateCode: 'CA' },
                { id: '19', name: 'Bakersfield', population: 403455, county: 'Kern', state: 'California', stateCode: 'CA' },
                { id: '20', name: 'Anaheim', population: 346824, county: 'Orange', state: 'California', stateCode: 'CA' },

                // Texas Cities
                { id: '21', name: 'Houston', population: 2320268, county: 'Harris', state: 'Texas', stateCode: 'TX' },
                { id: '22', name: 'San Antonio', population: 1547255, county: 'Bexar', state: 'Texas', stateCode: 'TX' },
                { id: '23', name: 'Dallas', population: 1343573, county: 'Dallas', state: 'Texas', stateCode: 'TX' },
                { id: '24', name: 'Austin', population: 978908, county: 'Travis', state: 'Texas', stateCode: 'TX' },
                { id: '25', name: 'Fort Worth', population: 918915, county: 'Tarrant', state: 'Texas', stateCode: 'TX' },
                { id: '26', name: 'El Paso', population: 682669, county: 'El Paso', state: 'Texas', stateCode: 'TX' },
                { id: '27', name: 'Arlington', population: 398112, county: 'Tarrant', state: 'Texas', stateCode: 'TX' },
                { id: '28', name: 'Corpus Christi', population: 326586, county: 'Nueces', state: 'Texas', stateCode: 'TX' },
                { id: '29', name: 'Plano', population: 285494, county: 'Collin', state: 'Texas', stateCode: 'TX' },
                { id: '30', name: 'Lubbock', population: 257141, county: 'Lubbock', state: 'Texas', stateCode: 'TX' },

                // Florida Cities
                { id: '31', name: 'Jacksonville', population: 949611, county: 'Duval', state: 'Florida', stateCode: 'FL' },
                { id: '32', name: 'Miami', population: 454279, county: 'Miami-Dade', state: 'Florida', stateCode: 'FL' },
                { id: '33', name: 'Tampa', population: 399700, county: 'Hillsborough', state: 'Florida', stateCode: 'FL' },
                { id: '34', name: 'Orlando', population: 307573, county: 'Orange', state: 'Florida', stateCode: 'FL' },
                { id: '35', name: 'St. Petersburg', population: 265098, county: 'Pinellas', state: 'Florida', stateCode: 'FL' },
                { id: '36', name: 'Hialeah', population: 233339, county: 'Miami-Dade', state: 'Florida', stateCode: 'FL' },
                { id: '37', name: 'Tallahassee', population: 194500, county: 'Leon', state: 'Florida', stateCode: 'FL' },
                { id: '38', name: 'Fort Lauderdale', population: 182595, county: 'Broward', state: 'Florida', stateCode: 'FL' },
                { id: '39', name: 'Port St. Lucie', population: 204851, county: 'St. Lucie', state: 'Florida', stateCode: 'FL' },
                { id: '40', name: 'Cape Coral', population: 194016, county: 'Lee', state: 'Florida', stateCode: 'FL' },

                // New York Cities
                { id: '41', name: 'New York City', population: 8336817, county: 'New York', state: 'New York', stateCode: 'NY' },
                { id: '42', name: 'Buffalo', population: 255284, county: 'Erie', state: 'New York', stateCode: 'NY' },
                { id: '43', name: 'Rochester', population: 205695, county: 'Monroe', state: 'New York', stateCode: 'NY' },
                { id: '44', name: 'Yonkers', population: 200370, county: 'Westchester', state: 'New York', stateCode: 'NY' },
                { id: '45', name: 'Syracuse', population: 142749, county: 'Onondaga', state: 'New York', stateCode: 'NY' },

                // Illinois Cities
                { id: '46', name: 'Chicago', population: 2693976, county: 'Cook', state: 'Illinois', stateCode: 'IL' },
                { id: '47', name: 'Aurora', population: 180542, county: 'Kane', state: 'Illinois', stateCode: 'IL' },
                { id: '48', name: 'Naperville', population: 149540, county: 'DuPage', state: 'Illinois', stateCode: 'IL' },
                { id: '49', name: 'Springfield', population: 114394, county: 'Sangamon', state: 'Illinois', stateCode: 'IL' },
                { id: '50', name: 'Peoria', population: 110417, county: 'Peoria', state: 'Illinois', stateCode: 'IL' },

                // Pennsylvania Cities
                { id: '51', name: 'Philadelphia', population: 1603797, county: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA' },
                { id: '52', name: 'Pittsburgh', population: 300286, county: 'Allegheny', state: 'Pennsylvania', stateCode: 'PA' },
                { id: '53', name: 'Allentown', population: 125845, county: 'Lehigh', state: 'Pennsylvania', stateCode: 'PA' },
                { id: '54', name: 'Erie', population: 101786, county: 'Erie', state: 'Pennsylvania', stateCode: 'PA' },
                { id: '55', name: 'Reading', population: 88323, county: 'Berks', state: 'Pennsylvania', stateCode: 'PA' },

                // Ohio Cities
                { id: '56', name: 'Columbus', population: 898553, county: 'Franklin', state: 'Ohio', stateCode: 'OH' },
                { id: '57', name: 'Cleveland', population: 372624, county: 'Cuyahoga', state: 'Ohio', stateCode: 'OH' },
                { id: '58', name: 'Cincinnati', population: 309317, county: 'Hamilton', state: 'Ohio', stateCode: 'OH' },
                { id: '59', name: 'Toledo', population: 275116, county: 'Lucas', state: 'Ohio', stateCode: 'OH' },
                { id: '60', name: 'Akron', population: 197597, county: 'Summit', state: 'Ohio', stateCode: 'OH' },

                // Georgia Cities
                { id: '61', name: 'Atlanta', population: 506811, county: 'Fulton', state: 'Georgia', stateCode: 'GA' },
                { id: '62', name: 'Columbus', population: 195769, county: 'Muscogee', state: 'Georgia', stateCode: 'GA' },
                { id: '63', name: 'Augusta', population: 197166, county: 'Richmond', state: 'Georgia', stateCode: 'GA' },
                { id: '64', name: 'Macon', population: 153159, county: 'Bibb', state: 'Georgia', stateCode: 'GA' },
                { id: '65', name: 'Savannah', population: 145674, county: 'Chatham', state: 'Georgia', stateCode: 'GA' },

                // North Carolina Cities
                { id: '66', name: 'Charlotte', population: 885708, county: 'Mecklenburg', state: 'North Carolina', stateCode: 'NC' },
                { id: '67', name: 'Raleigh', population: 474069, county: 'Wake', state: 'North Carolina', stateCode: 'NC' },
                { id: '68', name: 'Greensboro', population: 299035, county: 'Guilford', state: 'North Carolina', stateCode: 'NC' },
                { id: '69', name: 'Durham', population: 283506, county: 'Durham', state: 'North Carolina', stateCode: 'NC' },
                { id: '70', name: 'Winston-Salem', population: 249545, county: 'Forsyth', state: 'North Carolina', stateCode: 'NC' }
            ]
        };
    };

    const loadFees = async () => {
        // This would call your custom API tool
        // For now, return mock data
        return {
            success: true,
            data: [
                { id: '1', category: 'Building Permit', description: 'Residential building permit fee', amount: 0.5, calculationMethod: 'per $1000 of project value', cityId: '1' },
                { id: '2', category: 'Building Permit', description: 'Commercial building permit fee', amount: 0.75, calculationMethod: 'per $1000 of project value', cityId: '1' },
                { id: '3', category: 'Plan Review', description: 'Plan review fee', amount: 0.25, calculationMethod: 'per $1000 of project value', cityId: '1' },
                { id: '4', category: 'Inspection', description: 'Building inspection fee', amount: 150, calculationMethod: 'flat rate per inspection', cityId: '1' },
                { id: '5', category: 'Impact Fee', description: 'Development impact fee', amount: 2.5, calculationMethod: 'per square foot', cityId: '1' },
                // Add fees for other cities
                { id: '6', category: 'Building Permit', description: 'Residential building permit fee', amount: 0.45, calculationMethod: 'per $1000 of project value', cityId: '2' },
                { id: '7', category: 'Building Permit', description: 'Commercial building permit fee', amount: 0.65, calculationMethod: 'per $1000 of project value', cityId: '2' },
                { id: '8', category: 'Plan Review', description: 'Plan review fee', amount: 0.2, calculationMethod: 'per $1000 of project value', cityId: '2' },
                { id: '9', category: 'Inspection', description: 'Building inspection fee', amount: 125, calculationMethod: 'flat rate per inspection', cityId: '2' },
                { id: '10', category: 'Impact Fee', description: 'Development impact fee', amount: 2.0, calculationMethod: 'per square foot', cityId: '2' },
                // Mesa fees
                { id: '11', category: 'Building Permit', description: 'Residential building permit fee', amount: 0.55, calculationMethod: 'per $1000 of project value', cityId: '3' },
                { id: '12', category: 'Building Permit', description: 'Commercial building permit fee', amount: 0.8, calculationMethod: 'per $1000 of project value', cityId: '3' },
                { id: '13', category: 'Plan Review', description: 'Plan review fee', amount: 0.3, calculationMethod: 'per $1000 of project value', cityId: '3' },
                { id: '14', category: 'Inspection', description: 'Building inspection fee', amount: 175, calculationMethod: 'flat rate per inspection', cityId: '3' },
                { id: '15', category: 'Impact Fee', description: 'Development impact fee', amount: 3.0, calculationMethod: 'per square foot', cityId: '3' },

                // Sample fees for other major cities (you can expand this with real data)
                { id: '16', category: 'Building Permit', description: 'Residential building permit fee', amount: 0.8, calculationMethod: 'per $1000 of project value', cityId: '11' }, // LA
                { id: '17', category: 'Building Permit', description: 'Commercial building permit fee', amount: 1.2, calculationMethod: 'per $1000 of project value', cityId: '11' },
                { id: '18', category: 'Plan Review', description: 'Plan review fee', amount: 0.4, calculationMethod: 'per $1000 of project value', cityId: '11' },
                { id: '19', category: 'Inspection', description: 'Building inspection fee', amount: 200, calculationMethod: 'flat rate per inspection', cityId: '11' },
                { id: '20', category: 'Impact Fee', description: 'Development impact fee', amount: 4.5, calculationMethod: 'per square foot', cityId: '11' },

                { id: '21', category: 'Building Permit', description: 'Residential building permit fee', amount: 0.6, calculationMethod: 'per $1000 of project value', cityId: '21' }, // Houston
                { id: '22', category: 'Building Permit', description: 'Commercial building permit fee', amount: 0.9, calculationMethod: 'per $1000 of project value', cityId: '21' },
                { id: '23', category: 'Plan Review', description: 'Plan review fee', amount: 0.3, calculationMethod: 'per $1000 of project value', cityId: '21' },
                { id: '24', category: 'Inspection', description: 'Building inspection fee', amount: 150, calculationMethod: 'flat rate per inspection', cityId: '21' },
                { id: '25', category: 'Impact Fee', description: 'Development impact fee', amount: 2.8, calculationMethod: 'per square foot', cityId: '21' },

                { id: '26', category: 'Building Permit', description: 'Residential building permit fee', amount: 1.1, calculationMethod: 'per $1000 of project value', cityId: '41' }, // NYC
                { id: '27', category: 'Building Permit', description: 'Commercial building permit fee', amount: 1.5, calculationMethod: 'per $1000 of project value', cityId: '41' },
                { id: '28', category: 'Plan Review', description: 'Plan review fee', amount: 0.6, calculationMethod: 'per $1000 of project value', cityId: '41' },
                { id: '29', category: 'Inspection', description: 'Building inspection fee', amount: 300, calculationMethod: 'flat rate per inspection', cityId: '41' },
                { id: '30', category: 'Impact Fee', description: 'Development impact fee', amount: 6.0, calculationMethod: 'per square foot', cityId: '41' }
            ]
        };
    };

    const filterFees = () => {
        let filtered = fees;

        // Filter by city
        if (selectedCity) {
            filtered = filtered.filter(fee => fee.cityId === selectedCity);
        }

        // Filter by category
        if (feeCategoryFilter) {
            filtered = filtered.filter(fee => fee.category === feeCategoryFilter);
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

    const handleCalculateFees = async (values: FeeCalculation) => {
        setLoading(true);
        try {
            // This would call your custom API tool for fee calculation
            // For now, calculate locally
            const applicableFees = fees.filter(fee => fee.cityId === values.cityId);

            const results = applicableFees.map(fee => {
                let calculatedAmount = 0;

                if (fee.calculationMethod.includes('per $1000')) {
                    calculatedAmount = (values.projectValue / 1000) * fee.amount;
                } else if (fee.calculationMethod.includes('per square foot')) {
                    calculatedAmount = values.squareFootage * fee.amount;
                } else if (fee.calculationMethod.includes('flat rate')) {
                    calculatedAmount = fee.amount;
                }

                return {
                    ...fee,
                    calculatedAmount: Math.round(calculatedAmount * 100) / 100
                };
            });

            setCalculationResults(results);
        } catch (err) {
            setError('Failed to calculate fees');
        } finally {
            setLoading(false);
        }
    };

    // New function for city comparison
    const handleCompareCities = async (values: any) => {
        setComparisonLoading(true);
        try {
            const { projectType, projectValue, squareFootage } = values;
            const results: ComparisonData[] = [];

            for (const cityId of selectedCitiesForComparison) {
                const city = cities.find(c => c.id === cityId);
                if (!city) continue;

                const cityFees = fees.filter(fee => fee.cityId === cityId);
                const breakdown = cityFees.map(fee => {
                    let calculatedAmount = 0;

                    if (fee.calculationMethod.includes('per $1000')) {
                        calculatedAmount = (projectValue / 1000) * fee.amount;
                    } else if (fee.calculationMethod.includes('per square foot')) {
                        calculatedAmount = squareFootage * fee.amount;
                    } else if (fee.calculationMethod.includes('flat rate')) {
                        calculatedAmount = fee.amount;
                    }

                    return {
                        category: fee.category,
                        amount: Math.round(calculatedAmount * 100) / 100,
                        description: fee.description
                    };
                });

                const totalFees = breakdown.reduce((sum, item) => sum + item.amount, 0);

                results.push({
                    cityName: city.name,
                    totalFees: Math.round(totalFees * 100) / 100,
                    breakdown
                });
            }

            // Sort by total fees (lowest to highest)
            results.sort((a, b) => a.totalFees - b.totalFees);
            setComparisonResults(results);
            setShowComparison(true);
        } catch (err) {
            setError('Failed to compare cities');
        } finally {
            setComparisonLoading(false);
        }
    };

    // PDF export function
    const exportToPDF = () => {
        try {
            // Create a simple HTML content for PDF
            const content = `
                <html>
                    <head>
                        <title>Construction Fee Report</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .section { margin-bottom: 20px; }
                            .fee-item { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; }
                            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f5f5f5; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Construction Fee Report</h1>
                            <p>Generated on ${new Date().toLocaleDateString()}</p>
                        </div>
                        
                        ${selectedCity ? `
                        <div class="section">
                            <h2>City: ${getSelectedCityInfo()?.name}</h2>
                            <p>County: ${getSelectedCityInfo()?.county}</p>
                            <p>Population: ${getSelectedCityInfo()?.population?.toLocaleString()}</p>
                        </div>
                        ` : ''}
                        
                        ${calculationResults.length > 0 ? `
                        <div class="section">
                            <h2>Fee Calculation Results</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Calculation Method</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${calculationResults.map(fee => `
                                        <tr>
                                            <td>${fee.category}</td>
                                            <td>${fee.description}</td>
                                            <td>${fee.calculationMethod}</td>
                                            <td>$${fee.calculatedAmount}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            <div class="total">
                                Total Estimated Fees: $${calculationResults.reduce((sum, fee) => sum + fee.calculatedAmount, 0).toFixed(2)}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${comparisonResults.length > 0 ? `
                        <div class="section">
                            <h2>City Comparison Results</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>City</th>
                                        <th>Total Fees</th>
                                        <th>Rank</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${comparisonResults.map((result, index) => `
                                        <tr>
                                            <td>${result.cityName}</td>
                                            <td>$${result.totalFees}</td>
                                            <td>${index + 1}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        ` : ''}
                    </body>
                </html>
            `;

            // Create blob and download
            const blob = new Blob([content], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `construction-fee-report-${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            message.success('Report exported successfully!');
        } catch (err) {
            message.error('Failed to export report');
        }
    };

    const getUniqueCategories = () => {
        return [...new Set(fees.map(fee => fee.category))];
    };

    const getUniqueStates = () => {
        return [...new Set(cities.map(city => city.state))].sort();
    };

    const getSelectedCityInfo = () => {
        return cities.find(city => city.id === selectedCity);
    };

    const getFilteredCities = () => {
        let filtered = cities;

        // Filter by state
        if (stateFilter) {
            filtered = filtered.filter(city => city.state === stateFilter);
        }

        // Filter by search term
        if (citySearchTerm) {
            filtered = filtered.filter(city =>
                city.name.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
                city.county.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
                city.state.toLowerCase().includes(citySearchTerm.toLowerCase())
            );
        }

        return filtered;
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
                            value={getUniqueStates().length}
                            prefix={<Building />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Fee Categories"
                            value={getUniqueCategories().length}
                            prefix={<Calculator />}
                        />
                    </Col>
                </Row>
            </Card>

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

            {/* City Selector Section */}
            <Card title="City Selection" size="small">
                <Row gutter={16}>
                    <Col span={8}>
                        <Text strong>Filter by State:</Text>
                        <Select
                            placeholder="All States"
                            value={stateFilter}
                            onChange={setStateFilter}
                            style={{ width: '100%', marginTop: 8 }}
                            allowClear
                        >
                            {getUniqueStates().map(state => (
                                <Option key={state} value={state}>
                                    {state}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={8}>
                        <Text strong>Search Cities:</Text>
                        <SearchInput
                            placeholder="Search cities, counties, or states..."
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                            style={{ marginTop: 8 }}
                        />
                    </Col>
                    <Col span={8}>
                        <Text strong>Select City:</Text>
                        <Select
                            placeholder="Choose a city"
                            value={selectedCity}
                            onChange={setSelectedCity}
                            style={{ width: '100%', marginTop: 8 }}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {getFilteredCities().map(city => (
                                <Option key={city.id} value={city.id} label={`${city.name}, ${city.county} County, ${city.state}`}>
                                    {city.name}, {city.county} County, {city.state}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>

                {selectedCity && (
                    <Card size="small" style={{ marginTop: 16 }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="City"
                                    value={getSelectedCityInfo()?.name}
                                    prefix={<MapPin />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="State"
                                    value={getSelectedCityInfo()?.state}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Population"
                                    value={getSelectedCityInfo()?.population}
                                    formatter={(value) => value?.toLocaleString()}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="County"
                                    value={getSelectedCityInfo()?.county}
                                />
                            </Col>
                        </Row>
                    </Card>
                )}
            </Card>

            {/* Fee Display Section */}
            <Card title="Fee Database" size="small">
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                        <Text strong>Filter by Category:</Text>
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
                    <Col span={8}>
                        <Text strong>Search Fees:</Text>
                        <SearchInput
                            placeholder="Search fee descriptions..."
                            value={feeSearchTerm}
                            onChange={(e) => setFeeSearchTerm(e.target.value)}
                            style={{ marginTop: 8 }}
                        />
                    </Col>
                    <Col span={8}>
                        <Text strong>Total Fees:</Text>
                        <div style={{ marginTop: 8 }}>
                            <Tag color="blue">{filteredFees.length} fees found</Tag>
                        </div>
                    </Col>
                </Row>

                <div className={styles.tableContainer}>
                    <Table
                        dataSource={filteredFees}
                        columns={[
                            {
                                title: 'Category',
                                dataIndex: 'category',
                                key: 'category',
                                width: 140,
                                render: (category) => (
                                    <Tag
                                        color="green"
                                        className={styles.categoryTag}
                                    >
                                        {category}
                                    </Tag>
                                ),
                                filters: getUniqueCategories().map(cat => ({ text: cat, value: cat })),
                                onFilter: (value, record) => record.category === value,
                            },
                            {
                                title: 'Description',
                                dataIndex: 'description',
                                key: 'description',
                                ellipsis: true,
                                render: (description) => (
                                    <Text strong style={{ fontSize: 14, lineHeight: '1.4' }}>
                                        {description}
                                    </Text>
                                ),
                            },
                            {
                                title: 'Amount',
                                dataIndex: 'amount',
                                key: 'amount',
                                width: 160,
                                render: (amount, record) => (
                                    <Text className={styles.amountText}>
                                        {record.calculationMethod.includes('per $1000') ?
                                            `$${amount} per $1000` :
                                            record.calculationMethod.includes('per square foot') ?
                                                `$${amount} per sq ft` :
                                                `$${amount} flat rate`
                                        }
                                    </Text>
                                ),
                                sorter: (a, b) => a.amount - b.amount,
                                defaultSortOrder: 'ascend',
                            },
                            {
                                title: 'Calculation Method',
                                dataIndex: 'calculationMethod',
                                key: 'calculationMethod',
                                width: 180,
                                ellipsis: true,
                                render: (method) => (
                                    <Text className={styles.methodText}>
                                        {method}
                                    </Text>
                                ),
                            },

                        ]}
                        rowKey="id"
                        size="small"
                        pagination={{
                            pageSize: 15,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} fees`,
                            size: 'small',
                        }}
                        scroll={{ x: 800 }}
                        className={styles.feeTable}
                    />
                </div>
            </Card>

            {/* Fee Calculator Section */}
            <Card title="Fee Calculator" size="small">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCalculateFees}
                    initialValues={{
                        projectType: 'residential',
                        projectValue: 100000,
                        squareFootage: 1000,
                        totalUnits: 1
                    }}
                >
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                name="projectType"
                                label="Project Type"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Option value="residential">
                                        <Home size={16} style={{ marginRight: 8 }} />
                                        Residential
                                    </Option>
                                    <Option value="commercial">
                                        <Briefcase size={16} style={{ marginRight: 8 }} />
                                        Commercial
                                    </Option>
                                    <Option value="mixed-use">
                                        <Building size={16} style={{ marginRight: 8 }} />
                                        Mixed-Use
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="projectValue"
                                label="Project Value ($)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    min={0}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="squareFootage"
                                label="Square Footage"
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    suffix={<Ruler size={16} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="totalUnits"
                                label="Total Units"
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={1}
                                    placeholder="1"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.projectType !== currentValues.projectType}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('projectType') === 'mixed-use' ? (
                                <Row gutter={16} style={{ marginBottom: 16 }}>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'residential']}
                                            label="Residential Units"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'retail']}
                                            label="Retail Units"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'office']}
                                            label="Office Units"
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'industrial']}
                                            label="Industrial Units"
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            ) : null
                        }
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item label="City">
                                <Select
                                    value={selectedCity}
                                    onChange={setSelectedCity}
                                    placeholder="Select city first"
                                    disabled={!selectedCity}
                                >
                                    <Option value={selectedCity}>
                                        {getSelectedCityInfo()?.name || 'Select city'}
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<Calculator />}
                            loading={loading}
                            disabled={!selectedCity}
                        >
                            Calculate Fees
                        </Button>
                    </Form.Item>
                </Form>

                {calculationResults.length > 0 && (
                    <div>
                        <Divider />
                        <Title level={4}>Calculation Results</Title>
                        <List
                            dataSource={calculationResults}
                            renderItem={(fee) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                <Tag color="blue">{fee.category}</Tag>
                                                <Text strong>{fee.description}</Text>
                                            </Space>
                                        }
                                        description={fee.calculationMethod}
                                    />
                                    <div>
                                        <Text strong style={{ fontSize: 16 }}>
                                            ${fee.calculatedAmount}
                                        </Text>
                                    </div>
                                </List.Item>
                            )}
                        />
                        <Divider />
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Text strong style={{ fontSize: 18 }}>
                                    Total Estimated Fees: $
                                    {calculationResults
                                        .reduce((sum, fee) => sum + fee.calculatedAmount, 0)
                                        .toFixed(2)
                                    }
                                </Text>
                            </Col>
                            <Col>
                                <Button
                                    type="default"
                                    icon={<Download />}
                                    onClick={exportToPDF}
                                >
                                    Export Report
                                </Button>
                            </Col>
                        </Row>
                    </div>
                )}
            </Card>

            {/* City Comparison Tool Section */}
            <Card title="City Fee Comparison Tool" size="small">
                <Form
                    form={comparisonForm}
                    layout="vertical"
                    onFinish={handleCompareCities}
                    initialValues={{
                        projectType: 'residential',
                        projectValue: 100000,
                        squareFootage: 1000,
                        totalUnits: 1
                    }}
                >
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                name="projectType"
                                label="Project Type"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Option value="residential">
                                        <Home size={16} style={{ marginRight: 8 }} />
                                        Residential
                                    </Option>
                                    <Option value="commercial">
                                        <Briefcase size={16} style={{ marginRight: 8 }} />
                                        Commercial
                                    </Option>
                                    <Option value="mixed-use">
                                        <Building size={16} style={{ marginRight: 8 }} />
                                        Mixed-Use
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="projectValue"
                                label="Project Value ($)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    min={0}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="squareFootage"
                                label="Square Footage"
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    suffix={<Ruler size={16} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="totalUnits"
                                label="Total Units"
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={1}
                                    placeholder="1"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.projectType !== currentValues.projectType}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('projectType') === 'mixed-use' ? (
                                <Row gutter={16} style={{ marginBottom: 16 }}>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'residential']}
                                            label="Residential Units"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'retail']}
                                            label="Retail Units"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'office']}
                                            label="Office Units"
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name={['mixedUseComponents', 'industrial']}
                                            label="Industrial Units"
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item label="Select Cities to Compare">
                        <Checkbox.Group
                            value={selectedCitiesForComparison}
                            onChange={(values) => setSelectedCitiesForComparison(values as string[])}
                        >
                            <Row gutter={[16, 8]}>
                                {getFilteredCities().map(city => (
                                    <Col span={6} key={city.id}>
                                        <Checkbox value={city.id}>
                                            {city.name}, {city.stateCode}
                                        </Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<BarChart3 />}
                            loading={comparisonLoading}
                            disabled={selectedCitiesForComparison.length < 2}
                        >
                            Compare Cities
                        </Button>
                    </Form.Item>
                </Form>

                {showComparison && comparisonResults.length > 0 && (
                    <div>
                        <Divider />
                        <Title level={4}>Comparison Results</Title>

                        {/* Summary Table */}
                        <Table
                            dataSource={comparisonResults}
                            columns={[
                                {
                                    title: 'Rank',
                                    dataIndex: 'rank',
                                    key: 'rank',
                                    render: (_, __, index) => index + 1,
                                    width: 80
                                },
                                {
                                    title: 'City',
                                    dataIndex: 'cityName',
                                    key: 'cityName',
                                    render: (text) => <Text strong>{text}</Text>
                                },
                                {
                                    title: 'Total Fees',
                                    dataIndex: 'totalFees',
                                    key: 'totalFees',
                                    render: (value) => (
                                        <Text strong style={{ color: '#52c41a' }}>
                                            ${value.toFixed(2)}
                                        </Text>
                                    ),
                                    sorter: (a, b) => a.totalFees - b.totalFees,
                                    defaultSortOrder: 'ascend'
                                },
                                {
                                    title: 'Actions',
                                    key: 'actions',
                                    render: (_, record) => (
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                // Show detailed breakdown
                                                message.info(`Detailed breakdown for ${record.cityName}`);
                                            }}
                                        >
                                            Details
                                        </Button>
                                    )
                                }
                            ]}
                            pagination={false}
                            size="small"
                        />

                        {/* Detailed Breakdown */}
                        <div style={{ marginTop: 24 }}>
                            <Title level={5}>Detailed Fee Breakdown</Title>
                            {comparisonResults.map((cityResult, cityIndex) => (
                                <Card key={cityIndex} size="small" style={{ marginBottom: 16 }}>
                                    <Title level={5} style={{ marginBottom: 16 }}>
                                        {cityResult.cityName} - Total: ${cityResult.totalFees}
                                    </Title>
                                    <Row gutter={[16, 8]}>
                                        {cityResult.breakdown.map((fee, feeIndex) => (
                                            <Col span={8} key={feeIndex}>
                                                <Card size="small" hoverable>
                                                    <Flexbox gap={8}>
                                                        <Tag color="blue">{fee.category}</Tag>
                                                        <Text strong>${fee.amount}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {fee.description}
                                                        </Text>
                                                    </Flexbox>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card>
                            ))}
                        </div>

                        <Divider />
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Text type="secondary">
                                    Best value: <Text strong>{comparisonResults[0]?.cityName}</Text>
                                    (${comparisonResults[0]?.totalFees})
                                </Text>
                            </Col>
                            <Col>
                                <Button
                                    type="default"
                                    icon={<Download />}
                                    onClick={exportToPDF}
                                >
                                    Export Comparison Report
                                </Button>
                            </Col>
                        </Row>
                    </div>
                )}
            </Card>
        </Flexbox>
    );
});

ConstructionFeePortal.displayName = 'ConstructionFeePortal';

export default ConstructionFeePortal;
