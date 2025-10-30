import { BuiltinToolAction } from '@/store/tool/slices/builtin/action';
import { createSupabaseClient, executeSupabaseQuery } from './supabase';
import { supabaseOperations } from './supabase-operations';
import { hybridLewisService } from './hybrid-lewis-service';
import { lewisPortalIntegration } from './lewis-portal-integration';
import { lewisDataService } from './lewis-data-service';

/**
 * Normalize jurisdiction names to handle variations from OpenAI
 * Examples:
 *   "Austin, TX" -> "Austin"
 *   "Los Angeles, CA" -> "Los Angeles"
 *   "Denver,CO" -> "Denver"
 *   "Portland  " -> "Portland"
 */
function normalizeJurisdictionName(cityName: string): string {
    if (!cityName) return '';

    // Remove state codes (two-letter abbreviations after comma)
    // Common states: TX, CA, CO, AZ, UT, OR, WA, NV, ID, MT, WY, NM, OK, KS, NE, SD, ND, etc.
    const normalized = cityName
        .replace(/,\s*[A-Z]{2}\s*$/i, '') // Remove ", TX" or ",CA" etc.
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        .trim();

    console.log(`🔧 City normalization: "${cityName}" -> "${normalized}"`);
    return normalized;
}

// Types for your tool parameters
interface CallExternalAPIParams {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

interface QueryDatabaseParams {
    table: string;
    select?: string;
    filters?: Record<string, any>;
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
}

interface DatabaseOperationParams {
    operation: 'getAll' | 'getById' | 'search' | 'count' | 'schema' | 'tables' | 'recent' | 'paginated';
    table: string;
    id?: string | number;
    searchColumn?: string;
    searchTerm?: string;
    timestampColumn?: string;
    hours?: number;
    page?: number;
    pageSize?: number;
    select?: string;
    filters?: Record<string, any>;
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
}

// Construction Fee Portal specific parameters
interface GetCitiesParams {
    state?: string;
    county?: string;
    searchTerm?: string;
}

interface GetFeesParams {
    cityId?: string;
    category?: string;
    searchTerm?: string;
}

interface CalculateFeesParams {
    cityId: string;
    projectType: 'residential' | 'commercial';
    projectValue: number;
    squareFootage: number;
}

// Portal integration parameters
interface PopulatePortalParams {
    jurisdictionId?: string;
    jurisdictionName?: string;
    projectType?: string;
    projectUnits?: number;
    projectAcreage?: number;
    meterSize?: string;
    squareFootage?: number;
    projectValue?: number;
}

interface GetPortalDataParams {
    // No specific parameters needed
}

// Grant Trading Tool specific parameters
interface GetStockQuoteParams {
    ticker: string;
}

interface GetStockHistoryParams {
    ticker: string;
    from?: string;
    to?: string;
    timespan?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
    multiplier?: number;
}

interface GetMarketIndicatorsParams {
    ticker: string;
    indicators?: string[];
}

interface GetTradingAdviceParams {
    ticker: string;
    timeframe?: 'day' | 'swing' | 'position';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

interface GetMarketNewsParams {
    ticker: string;
    limit?: number;
}

// Custom API Tool Action interface
export interface CustomApiToolAction {
    callExternalAPI: (params: CallExternalAPIParams) => Promise<any>;
    queryDatabase: (params: QueryDatabaseParams) => Promise<any>;
    performDatabaseOperation: (params: DatabaseOperationParams) => Promise<any>;
    // Construction Fee Portal actions (legacy)
    getCities: (params: GetCitiesParams) => Promise<any>;
    getFees: (params: GetFeesParams) => Promise<any>;
    // New strategic LEWIS tools
    calculateFees: (params: any) => Promise<any>;
    compareCities: (params: any) => Promise<any>;
    explainFees: (params: any) => Promise<any>;
    optimizeProject: (params: any) => Promise<any>;
    analyzeLocation: (params: any) => Promise<any>;
    optimizeFees: (params: any) => Promise<any>;
    getAvailableJurisdictions: (params: any) => Promise<any>;
    getStatesCount: () => Promise<any>;
    getUniqueStates: () => Promise<any>;
    // Portal integration actions
    populatePortal: (params: PopulatePortalParams) => Promise<any>;
    getPortalData: (params: GetPortalDataParams) => Promise<any>;
    // Jurisdiction ranking actions
    rankJurisdictions: (params: any) => Promise<any>;
    getTopJurisdictions: (params: any) => Promise<any>;
    // Enhanced data access actions
    getAllJurisdictionsWithFees: () => Promise<any>;
    searchJurisdictions: (params: { searchTerm: string }) => Promise<any>;
    getFeeStatistics: () => Promise<any>;
    getFeesByCategory: (params: { category: string }) => Promise<any>;
    compareJurisdictions: (params: { jurisdiction1: string; jurisdiction2: string }) => Promise<any>;
    getFeeTrends: () => Promise<any>;
    // Demo data actions for testing
    getDemoJurisdictions: () => Promise<any>;
    getDemoJurisdictionFees: (params: { jurisdictionId: string }) => Promise<any>;
    // Grant Trading Tool actions
    getStockQuote: (params: GetStockQuoteParams) => Promise<any>;
    getStockHistory: (params: GetStockHistoryParams) => Promise<any>;
    getMarketIndicators: (params: GetMarketIndicatorsParams) => Promise<any>;
    getTradingAdvice: (params: GetTradingAdviceParams) => Promise<any>;
    getMarketNews: (params: GetMarketNewsParams) => Promise<any>;

    // Course Builder Tool actions
    createCourseOutline: (params: CreateCourseOutlineParams) => Promise<any>;
    generateLessonContent: (params: GenerateLessonContentParams) => Promise<any>;
    createAssessment: (params: CreateAssessmentParams) => Promise<any>;
    generateMarketingContent: (params: GenerateMarketingContentParams) => Promise<any>;
    pricingStrategy: (params: PricingStrategyParams) => Promise<any>;
}

// Implementation of your tool actions
export const createCustomApiToolActions = (): CustomApiToolAction => ({
    callExternalAPI: async (params: CallExternalAPIParams) => {
        const { url, method = 'GET', headers = {}, body, timeout = 30000 } = params;

        // Making external API call

        try {
            // Validate URL
            if (!url || !url.startsWith('http')) {
                throw new Error('Invalid URL provided');
            }

            // Create fetch options
            const fetchOptions: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                signal: AbortSignal.timeout(timeout),
            };

            // Add body for POST/PUT requests
            if (body && (method === 'POST' || method === 'PUT')) {
                fetchOptions.body = JSON.stringify(body);
            }

            // Make the API call
            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Try to parse JSON response
            try {
                const data = await response.json();
                // API call successful
                return {
                    success: true,
                    status: response.status,
                    data,
                    headers: Object.fromEntries(response.headers.entries()),
                };
            } catch {
                // If not JSON, return text
                const text = await response.text();
                // API call successful (text response)
                return {
                    success: true,
                    status: response.status,
                    data: text,
                    headers: Object.fromEntries(response.headers.entries()),
                };
            }
        } catch (error) {
            // Error handling
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                url,
                method,
            };
        }
    },

    queryDatabase: async (params: QueryDatabaseParams) => {
        const { table, select, filters, limit, orderBy } = params;

        // Executing database query

        try {
            const supabase = createSupabaseClient();
            // Supabase client created

            let queryBuilder: any = supabase.from(table);

            // Apply select
            if (select) {
                queryBuilder = queryBuilder.select(select);
            }

            // Apply filters
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        if (typeof value === 'string' && value.includes('%')) {
                            // Handle LIKE queries
                            queryBuilder = queryBuilder.ilike(key, value);
                        } else {
                            queryBuilder = queryBuilder.eq(key, value);
                        }
                    }
                });
            }

            // Apply limit
            if (limit) {
                queryBuilder = queryBuilder.limit(limit);
            }

            // Apply ordering
            if (orderBy) {
                queryBuilder = queryBuilder.order(orderBy.column, {
                    ascending: orderBy.ascending !== false,
                });
            }

            const result = await executeSupabaseQuery(async () => {
                return await queryBuilder;
            });

            return {
                success: result.success,
                table,
                filters,
                limit,
                orderBy,
                result: result.data,
                error: result.error,
            };
        } catch (error) {
            // Database query error
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown database error',
                params,
            };
        }
    },

    performDatabaseOperation: async (params: DatabaseOperationParams) => {
        const { operation, table, ...operationParams } = params;

        // Performing database operation

        try {
            let result;

            switch (operation) {
                case 'getAll':
                    result = await supabaseOperations.getAllRecords(
                        table,
                        operationParams.select,
                        operationParams.limit
                    );
                    break;

                case 'getById':
                    if (!operationParams.id) {
                        throw new Error('ID is required for getById operation');
                    }
                    result = await supabaseOperations.getRecordById(
                        table,
                        operationParams.id,
                        operationParams.select
                    );
                    break;

                case 'search':
                    if (!operationParams.searchColumn || !operationParams.searchTerm) {
                        throw new Error('searchColumn and searchTerm are required for search operation');
                    }
                    result = await supabaseOperations.searchRecords(
                        table,
                        operationParams.searchColumn,
                        operationParams.searchTerm,
                        operationParams.select,
                        operationParams.limit
                    );
                    break;

                case 'count':
                    result = await supabaseOperations.countRecords(table, operationParams.filters);
                    break;

                case 'schema':
                    result = await supabaseOperations.getTableSchema(table);
                    break;

                case 'tables':
                    result = await supabaseOperations.getAllTables();
                    break;

                case 'recent':
                    if (!operationParams.timestampColumn) {
                        throw new Error('timestampColumn is required for recent operation');
                    }
                    result = await supabaseOperations.getRecentRecords(
                        table,
                        operationParams.timestampColumn,
                        operationParams.hours,
                        operationParams.select,
                        operationParams.limit
                    );
                    break;

                case 'paginated':
                    result = await supabaseOperations.getRecordsWithPagination(
                        table,
                        operationParams.page,
                        operationParams.pageSize,
                        operationParams.select,
                        operationParams.orderBy?.column || 'id',
                        operationParams.orderBy?.ascending !== false
                    );
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            return result;

        } catch (error) {
            // Database operation error
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Database operation failed',
                operation,
                table,
            };
        }
    },

    // Construction Fee Portal specific actions
    getCities: async (params: GetCitiesParams) => {
        try {
            // This would typically query your database
            // For now, return mock data for Arizona cities
            const mockCities = [
                { id: '1', name: 'Phoenix', population: 1608139, county: 'Maricopa', state: 'AZ', description: 'Capital and largest city of Arizona, major metropolitan area' },
                { id: '2', name: 'Tucson', population: 542629, county: 'Pima', state: 'AZ', description: 'Second largest city, known for University of Arizona and desert landscape' },
                { id: '3', name: 'Mesa', population: 504258, county: 'Maricopa', state: 'AZ', description: 'Third largest city, part of Phoenix metropolitan area' },
                { id: '4', name: 'Chandler', population: 275987, county: 'Maricopa', state: 'AZ', description: 'Fast-growing city with strong tech sector' },
                { id: '5', name: 'Scottsdale', population: 241361, county: 'Maricopa', state: 'AZ', description: 'Upscale city known for luxury resorts and golf courses' },
                { id: '6', name: 'Gilbert', population: 267918, county: 'Maricopa', state: 'AZ', description: 'Family-friendly city with excellent schools and parks' },
                { id: '7', name: 'Glendale', population: 248325, county: 'Maricopa', state: 'AZ', description: 'Sports and entertainment hub with State Farm Stadium' },
                { id: '8', name: 'Tempe', population: 180587, county: 'Maricopa', state: 'AZ', description: 'College town home to Arizona State University' },
                { id: '9', name: 'Peoria', population: 190985, county: 'Maricopa', state: 'AZ', description: 'Growing city with Lake Pleasant recreation area' },
                { id: '10', name: 'Surprise', population: 141664, county: 'Maricopa', state: 'AZ', description: 'Rapidly expanding city with affordable housing' }
            ];

            let filteredCities = mockCities;

            // Apply filters
            if (params.state) {
                filteredCities = filteredCities.filter(city => city.state === params.state);
            }
            if (params.county) {
                filteredCities = filteredCities.filter(city => city.county === params.county);
            }
            if (params.searchTerm) {
                filteredCities = filteredCities.filter(city =>
                    city.name.toLowerCase().includes(params.searchTerm!.toLowerCase()) ||
                    city.county.toLowerCase().includes(params.searchTerm!.toLowerCase())
                );
            }

            // Create conversational response
            let responseMessage = `I found ${filteredCities.length} cities in Arizona with construction fee data available. Here are the main options:\n\n`;

            filteredCities.slice(0, 10).forEach((city, index) => {
                responseMessage += `• **${city.name}** - ${city.county} County (Population: ${city.population.toLocaleString()})\n`;
            });

            if (filteredCities.length > 10) {
                responseMessage += `\n...and ${filteredCities.length - 10} more cities available.\n`;
            }

            const largestCity = filteredCities.reduce((max, city) => city.population > max.population ? city : max, filteredCities[0]);
            const totalPopulation = filteredCities.reduce((sum, city) => sum + city.population, 0);

            responseMessage += `\n**Key Insights:**\n`;
            responseMessage += `• Largest city: **${largestCity.name}** with ${largestCity.population.toLocaleString()} residents\n`;
            responseMessage += `• Total population covered: ${totalPopulation.toLocaleString()}\n`;
            responseMessage += `• Each city has different fee structures and requirements\n\n`;
            responseMessage += `Would you like me to help you calculate fees for a specific city, or would you like more details about any particular location?`;

            return responseMessage;
        } catch (error) {
            return `I'm sorry, I encountered an error while trying to get the cities: ${error instanceof Error ? error.message : 'Failed to get cities'}. Please try again or let me know if you need help with something else.`;
        }
    },

    getFees: async (params: GetFeesParams) => {
        try {
            // This would typically query your database
            // For now, return mock data for construction fees
            const mockFees = [
                { id: '1', category: 'Building Permit', description: 'Residential building permit fee', amount: 0.5, calculationMethod: 'per $1000 of project value', cityId: '1', cityName: 'Phoenix' },
                { id: '2', category: 'Building Permit', description: 'Commercial building permit fee', amount: 0.75, calculationMethod: 'per $1000 of project value', cityId: '1', cityName: 'Phoenix' },
                { id: '3', category: 'Plan Review', description: 'Plan review fee', amount: 0.25, calculationMethod: 'per $1000 of project value', cityId: '1', cityName: 'Phoenix' },
                { id: '4', category: 'Inspection', description: 'Building inspection fee', amount: 150, calculationMethod: 'flat rate per inspection', cityId: '1', cityName: 'Phoenix' },
                { id: '5', category: 'Impact Fee', description: 'Development impact fee', amount: 2.5, calculationMethod: 'per square foot', cityId: '1', cityName: 'Phoenix' },
                { id: '6', category: 'Building Permit', description: 'Residential building permit fee', amount: 0.6, calculationMethod: 'per $1000 of project value', cityId: '2', cityName: 'Tucson' },
                { id: '7', category: 'Building Permit', description: 'Commercial building permit fee', amount: 0.85, calculationMethod: 'per $1000 of project value', cityId: '2', cityName: 'Tucson' },
                { id: '8', category: 'Plan Review', description: 'Plan review fee', amount: 0.3, calculationMethod: 'per $1000 of project value', cityId: '2', cityName: 'Tucson' }
            ];

            let filteredFees = mockFees;

            // Apply filters
            if (params.cityId) {
                filteredFees = filteredFees.filter(fee => fee.cityId === params.cityId);
            }
            if (params.category) {
                filteredFees = filteredFees.filter(fee => fee.category === params.category);
            }
            if (params.searchTerm) {
                filteredFees = filteredFees.filter(fee =>
                    fee.description.toLowerCase().includes(params.searchTerm!.toLowerCase()) ||
                    fee.category.toLowerCase().includes(params.searchTerm!.toLowerCase())
                );
            }

            return {
                success: true,
                data: filteredFees,
                total: filteredFees.length,
                filters: params,
                message: `Found ${filteredFees.length} fee categories matching your criteria.`,
                summary: `Fee categories: ${filteredFees.map(f => f.category).join(', ')}`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get fees',
                filters: params
            };
        }
    },

    calculateFees: async (params: any) => {
        try {
            console.log('🔧 LEWIS TOOL: calculateFees called with:', params);

            // CRITICAL: Normalize jurisdiction name to handle "Austin, TX" -> "Austin"
            const originalJurisdiction = params.jurisdiction;
            const normalizedJurisdiction = normalizeJurisdictionName(params.jurisdiction);
            console.log('🔧 LEWIS TOOL: Original jurisdiction:', originalJurisdiction);
            console.log('🔧 LEWIS TOOL: Normalized jurisdiction:', normalizedJurisdiction);

            // Use API endpoint to ensure server-side execution with FeeCalculator
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'calculateFees',
                    params: {
                        jurisdictionName: normalizedJurisdiction,
                        projectType: params.projectType,
                        numUnits: params.units,
                        squareFeet: params.sqft,
                        serviceArea: params.serviceArea || null,
                        meterSize: params.meterSize || null,
                        projectValue: params.projectValue || null
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🔧 LEWIS TOOL: calculateFees result:', result);

            if (result.success && result.data) {
                const data = result.data;
                const perUnit = data.oneTimeFees / params.units;

                // Helper function to format currency with explicit dollar sign
                // Wrap in backticks to render as inline code and prevent markdown parsing issues
                const formatCurrency = (amount: number): string => {
                    const formatted = Math.round(amount).toLocaleString('en-US');
                    return '`$' + formatted + '`';
                };

                const oneTimeFormatted = formatCurrency(data.oneTimeFees);
                const perUnitFormatted = formatCurrency(perUnit);
                const monthlyFormatted = formatCurrency(data.monthlyFees);

                let responseMessage = `**${params.jurisdiction}**\n`;
                responseMessage += `- Total One-Time: ${oneTimeFormatted} (${perUnitFormatted}/unit)\n`;
                responseMessage += `- Monthly: ${monthlyFormatted}/month\n`;

                // Show top 3 fees
                const topFees = data.fees
                    .filter((f: any) => f.calculatedAmount > 0)
                    .sort((a: any, b: any) => b.calculatedAmount - a.calculatedAmount)
                    .slice(0, 3);

                if (topFees.length > 0) {
                    const topFeeFormatted = formatCurrency(topFees[0].calculatedAmount);
                    responseMessage += `- Top Fee: ${topFees[0].feeName} ${topFeeFormatted}\n`;
                }

                responseMessage += `\n✓ Calculator updated with these inputs. You can adjust parameters on the right to see how fees change.\n\n`;
                responseMessage += `Want me to compare this to other cities or explain the fee breakdown?`;

                return responseMessage;
            } else {
                throw new Error(result.error || 'Failed to calculate fees');
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: calculateFees error:', error);
            return `I don't have fee data for ${params.jurisdiction} yet or encountered an error calculating fees: ${error instanceof Error ? error.message : 'Unknown error'}. Want me to show you available cities?`;
        }
    },

    compareCities: async (params: any) => {
        try {
            console.log('🔧 LEWIS TOOL: compareCities called with:', params);
            console.log('🔧 LEWIS TOOL: params type:', typeof params);
            console.log('🔧 LEWIS TOOL: params keys:', params ? Object.keys(params) : 'null');
            console.log('🔧 LEWIS TOOL: Full params object:', JSON.stringify(params, null, 2));

            // CRITICAL: Handle case where params might be null/undefined
            if (!params) {
                console.error('❌ LEWIS TOOL: params is null or undefined');
                return `Error: No parameters provided. Please specify cities to compare. Example: "Compare Austin vs Los Angeles vs Denver for 50 units"`;
            }

            // CRITICAL: Check for alternative parameter names (cities, jurisdictions, etc.)
            let cities = params.cities || params.jurisdictions || params.cityNames || params.locations;

            if (!cities) {
                console.error('❌ LEWIS TOOL: No cities array found in params');
                console.error('Available params keys:', Object.keys(params));
                return `Error: No cities provided. I received these parameters: ${Object.keys(params).join(', ')}. Please specify which cities to compare.`;
            }

            // Convert single string to array if needed
            if (typeof cities === 'string') {
                console.log('🔧 LEWIS TOOL: Converting single city string to array');
                cities = [cities];
            }

            if (!Array.isArray(cities)) {
                console.error('❌ LEWIS TOOL: cities is not an array, type:', typeof cities);
                return `Error: Cities parameter is not an array. Received: ${JSON.stringify(cities)}`;
            }

            if (cities.length === 0) {
                console.error('❌ LEWIS TOOL: cities array is empty');
                return `Error: No cities provided in the array. Please specify at least one city to compare.`;
            }

            console.log(`✅ LEWIS TOOL: Validated ${cities.length} cities:`, cities);

            // CRITICAL: Normalize city names to handle variations like "Austin, TX" -> "Austin"
            const normalizedCities = cities.map(normalizeJurisdictionName);
            console.log('🔧 LEWIS TOOL: Original cities:', cities);
            console.log('🔧 LEWIS TOOL: Normalized cities:', normalizedCities);

            // Use normalized cities for database queries
            params.cities = normalizedCities;

            // Log parameters being sent
            console.log('🔍 compareCities called with full params:', {
                projectType: params.projectType,
                units: params.units,
                sqft: params.sqft,
                cities: normalizedCities,
                serviceArea: params.serviceArea || null,
                meterSize: params.meterSize || '3/4"',
                projectValue: params.projectValue || null
            });

            // Calculate fees for each city in parallel
            const results = await Promise.all(
                normalizedCities.map(async (city: string, index: number) => {
                    const originalCity = cities[index];

                    const requestPayload = {
                        action: 'calculateFees',
                        params: {
                            jurisdictionName: city,
                            projectType: params.projectType,
                            numUnits: params.units,
                            squareFeet: params.sqft,
                            projectValue: params.projectValue || null,
                            serviceArea: params.serviceArea || null, // Let FeeCalculator handle service area selection automatically
                            meterSize: params.meterSize || '3/4"' // Default to 3/4" meter
                        }
                    };

                    console.log(`🔍 Calculating ${city}:`, requestPayload.params);

                    const response = await fetch('/api/lewis', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestPayload)
                    });

                    if (!response.ok) {
                        console.error(`❌ HTTP error for ${city}:`, response.status);
                        return { city, error: `HTTP ${response.status}` };
                    }

                    const result = await response.json();
                    console.log(`🔍 ${city} result:`, {
                        success: result.success,
                        oneTimeFees: result.data?.oneTimeFees,
                        monthlyFees: result.data?.monthlyFees,
                        feeCount: result.data?.fees?.length,
                        error: result.error
                    });
                    if (result.success && result.data) {
                        return {
                            city,
                            oneTimeFees: result.data.oneTimeFees,
                            monthlyFees: result.data.monthlyFees,
                            perUnit: result.data.oneTimeFees / params.units,
                            topFees: result.data.fees
                                .filter((f: any) => {
                                    // Exclude monthly/recurring fees
                                    if (f.isRecurring) return false;
                                    // Exclude volume rates (per gallon, per CCF) - these are rates, not actual fees
                                    const feeNameLower = (f.feeName || '').toLowerCase();
                                    if (feeNameLower.includes('volume rate') ||
                                        feeNameLower.includes('per gallon') ||
                                        feeNameLower.includes('per ccf') ||
                                        feeNameLower.includes('per 1,000 gallons')) {
                                        return false;
                                    }
                                    // Only include fees with meaningful amounts (> $10)
                                    return f.calculatedAmount > 10;
                                })
                                .sort((a: any, b: any) => b.calculatedAmount - a.calculatedAmount)
                                .slice(0, 3)
                        };
                    } else {
                        return { city, error: result.error || 'Failed to calculate' };
                    }
                })
            );

            // Separate valid results from errors
            const validResults = results.filter(r => !r.error);
            const failedResults = results.filter(r => r.error);

            if (validResults.length === 0) {
                return `I couldn't calculate fees for any of the requested cities. Please check the city names and try again.`;
            }

            validResults.sort((a, b) => a.oneTimeFees - b.oneTimeFees);

            // Calculate savings vs highest
            const highest = validResults[validResults.length - 1].oneTimeFees;

            // Helper function to format currency with explicit dollar sign
            // CRITICAL: Use string concatenation, not template literals, to avoid parsing issues
            const formatCurrency = (amount: number): string => {
                const formatted = Math.round(amount).toLocaleString('en-US');
                // Wrap in backticks to render as inline code and prevent markdown parsing breaking the format
                return '`$' + formatted + '`';
            };

            let responseMessage = `I'll compare ${params.projectType} fees for ${params.units} units across these cities:\n\n`;

            validResults.forEach((r, index) => {
                const savings = highest - r.oneTimeFees;
                const percentCheaper = ((savings / highest) * 100).toFixed(1);

                // Show cheapest marker in city name
                const cityLabel = index === 0 && validResults.length > 1 ? `**${r.city}** (Cheapest ✓)` : `**${r.city}**`;

                // Pre-format all currency amounts with explicit dollar signs
                const oneTimeFormatted = formatCurrency(r.oneTimeFees);
                const perUnitFormatted = formatCurrency(r.perUnit);
                const monthlyFormatted = formatCurrency(r.monthlyFees);

                console.log(`🔍 Formatting for ${r.city}:`, {
                    oneTimeRaw: r.oneTimeFees,
                    oneTimeFormatted,
                    perUnitRaw: r.perUnit,
                    perUnitFormatted,
                    monthlyRaw: r.monthlyFees,
                    monthlyFormatted
                });

                responseMessage += `${cityLabel}\n`;
                responseMessage += `• One-Time Fees: ${oneTimeFormatted} (${perUnitFormatted}/unit)\n`;
                responseMessage += `• Monthly Fees: ${monthlyFormatted}/month\n`;

                // Show top 3 fees
                if (r.topFees && r.topFees.length > 0) {
                    responseMessage += `• Top 3 Fees:\n`;
                    r.topFees.slice(0, 3).forEach((fee: any) => {
                        if (fee && fee.feeName && fee.calculatedAmount) {
                            const feeAmountFormatted = formatCurrency(fee.calculatedAmount);
                            responseMessage += `  • ${fee.feeName}: ${feeAmountFormatted}\n`;
                        }
                    });
                }

                // Show savings comparison for non-cheapest cities
                if (index > 0 && savings > 0) {
                    const savingsFormatted = formatCurrency(savings);
                    responseMessage += `• Costs ${savingsFormatted} more than cheapest (${percentCheaper}% higher)\n`;
                }
                responseMessage += `\n`;
            });

            // Bottom line recommendation
            if (validResults.length > 1) {
                const cheapest = validResults[0];
                const savings = highest - cheapest.oneTimeFees;
                const percentSavings = ((savings / highest) * 100).toFixed(1);
                const savingsFormatted = formatCurrency(savings);
                responseMessage += `**Bottom Line:** ${cheapest.city} saves you ${savingsFormatted} vs ${validResults[validResults.length - 1].city} (${percentSavings}% lower).\n\n`;
            }

            // Report any failed cities
            if (failedResults.length > 0) {
                responseMessage += `⚠️ **Note:** Couldn't calculate fees for ${failedResults.map(r => r.city).join(', ')}. `;
                if (failedResults.length === 1 && failedResults[0].error) {
                    responseMessage += `Error: ${failedResults[0].error}.\n\n`;
                } else {
                    responseMessage += `These cities may not be in our database yet.\n\n`;
                }
            }

            responseMessage += `\nWant me to break down any city's fees or analyze a different project size?`;

            // CRITICAL: Return as plain text to prevent markdown parsing issues
            // OpenAI was breaking currency formatting when parsing markdown
            console.log('🔍 Final responseMessage length:', responseMessage.length);
            console.log('🔍 First 200 chars:', responseMessage.substring(0, 200));

            return responseMessage;
        } catch (error) {
            console.error('💥 LEWIS TOOL: compareCities error:', error);
            return `I encountered an error comparing cities: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
        }
    },

    explainFees: async (params: any) => {
        try {
            console.log('🔧 LEWIS TOOL: explainFees called with:', params);

            // CRITICAL: Normalize jurisdiction name to handle "Austin, TX" -> "Austin"
            const normalizedJurisdiction = normalizeJurisdictionName(params.jurisdiction);
            console.log('🔧 LEWIS TOOL: Normalized jurisdiction for explainFees:', normalizedJurisdiction);

            // First calculate fees
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'calculateFees',
                    params: {
                        jurisdictionName: normalizedJurisdiction,
                        projectType: params.projectType,
                        numUnits: params.units,
                        squareFeet: params.sqft,
                        serviceArea: params.serviceArea || null
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data;
                const sortedFees = data.fees
                    .filter((f: any) => f.calculatedAmount > 0)
                    .sort((a: any, b: any) => b.calculatedAmount - a.calculatedAmount);

                // Helper function to format currency with explicit dollar sign
                // Wrap in backticks to render as inline code and prevent markdown parsing issues
                const formatCurrency = (amount: number): string => {
                    const formatted = Math.round(amount).toLocaleString('en-US');
                    return '`$' + formatted + '`';
                };

                const total = data.oneTimeFees;
                const totalFormatted = formatCurrency(total);
                const top3 = sortedFees.slice(0, 3);
                const top3Total = top3.reduce((sum: number, f: any) => sum + f.calculatedAmount, 0);
                const top3Percent = ((top3Total / total) * 100).toFixed(1);

                let responseMessage = `Here's why ${params.jurisdiction} fees are ${totalFormatted} for your ${params.units}-unit project:\n\n`;
                responseMessage += `**Top 3 Fee Drivers (${top3Percent}% of total):**\n\n`;

                top3.forEach((fee: any, index: number) => {
                    const percent = ((fee.calculatedAmount / total) * 100).toFixed(1);
                    const feeAmountFormatted = formatCurrency(fee.calculatedAmount);
                    responseMessage += `${index + 1}. **${fee.feeName}**: ${feeAmountFormatted} (${percent}%)\n`;

                    // Add optimization tips
                    if (fee.feeName.includes('Affordable Housing') && fee.feeName.includes('Market Area')) {
                        responseMessage += `   💡 Tip: Consider different market area zones - may have 10-30% lower rates\n`;
                    } else if (fee.feeName.includes('Park Fee') && fee.calculatedAmount > 5000) {
                        responseMessage += `   💡 Tip: Check if fee waivers available for affordable housing (50-100% savings)\n`;
                    } else if (fee.feeName.toLowerCase().includes('water') && fee.feeName.toLowerCase().includes('meter')) {
                        responseMessage += `   💡 Tip: Right-size water meters - oversizing increases costs 20-40%\n`;
                    }
                    responseMessage += `\n`;
                });

                responseMessage += `**All Fees (${sortedFees.length} total):**\n`;
                sortedFees.forEach((fee: any) => {
                    const feeAmountFormatted = formatCurrency(fee.calculatedAmount);
                    responseMessage += `- ${fee.feeName}: ${feeAmountFormatted}\n`;
                });

                responseMessage += `\nWant me to compare ${params.jurisdiction} to other cities or suggest ways to reduce these costs?`;

                return responseMessage;
            } else {
                throw new Error(result.error || 'Failed to explain fees');
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: explainFees error:', error);
            return `I encountered an error explaining fees: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
        }
    },

    optimizeProject: async (params: any) => {
        try {
            console.log('🔧 LEWIS TOOL: optimizeProject called with:', params);
            console.log('🔧 LEWIS TOOL: Fetching from /api/lewis with action=optimizeProject');

            // Call API endpoint
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'optimizeProject',
                    params: {
                        jurisdiction: params.jurisdiction,
                        lotSize: params.lotSize,
                        projectType: params.projectType,
                        budget: params.budget
                    }
                })
            });

            console.log('🔧 LEWIS TOOL: Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ LEWIS TOOL: API error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('🔧 LEWIS TOOL: optimizeProject API result:', JSON.stringify(result, null, 2));

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to optimize project');
            }

            const { jurisdiction, lotSize, projectType, buildableAcres, scenarios } = result.data;
            const budget = params.budget;

            // Helper function to format currency
            const formatCurrency = (amount: number): string => {
                const formatted = Math.round(amount).toLocaleString('en-US');
                return '`$' + formatted + '`';
            };

            // Build response message
            let responseMessage = `I'll analyze your ${lotSize} acre site in ${jurisdiction} for optimal ${projectType} development.\n\n`;
            responseMessage += `Based on your lot size (${buildableAcres.toFixed(1)} acres buildable) and local fees, here are 3 development scenarios:\n\n`;

            // Create table header
            responseMessage += `| Scenario | Units | Total SF | Dev Fees | Est. Construction | Total Cost | Cost/Unit |\n`;
            responseMessage += `|----------|-------|----------|----------|-------------------|------------|-----------||\n`;

            // Add scenarios to table
            scenarios.forEach((s: any) => {
                const devFees = formatCurrency(s.developmentFees);
                const estConst = formatCurrency(s.constructionCost);
                const totalCost = formatCurrency(s.totalDevCost);
                const costPerUnit = formatCurrency(s.costPerUnit);

                responseMessage += `| ${s.name} | ${s.units} | ${s.squareFeet.toLocaleString()} | ${devFees} | ${estConst} | ${totalCost} | ${costPerUnit} |\n`;
            });

            // Add recommendation (Moderate scenario - index 1)
            const recommended = scenarios[1] || scenarios[0];
            const recommendedCostPerUnit = formatCurrency(recommended.costPerUnit);

            responseMessage += `\n**Recommendation:** The ${recommended.name} approach with ${recommended.units} units offers the best balance of development costs and density. This results in approximately ${recommendedCostPerUnit}/unit in total development costs.\n\n`;

            // Key considerations
            const devFeePercent = ((recommended.developmentFees / recommended.totalDevCost) * 100).toFixed(1);
            const monthlyFormatted = formatCurrency(recommended.monthlyFees);
            const devFeesFormatted = formatCurrency(recommended.developmentFees);

            responseMessage += `**Key Considerations:**\n`;
            responseMessage += `- Development fees: ${devFeesFormatted} (${devFeePercent}% of total cost)\n`;
            responseMessage += `- Monthly operating: ${monthlyFormatted}/month\n`;
            responseMessage += `- Estimated timeline: 18-24 months from permit to occupancy\n\n`;

            if (budget) {
                const budgetFormatted = formatCurrency(budget);
                const withinBudget = scenarios.filter((s: any) => s.totalDevCost <= budget);
                if (withinBudget.length > 0) {
                    responseMessage += `**Budget Analysis:** With your ${budgetFormatted} budget, ${withinBudget.length} scenario(s) are feasible.\n\n`;
                } else {
                    responseMessage += `**Budget Analysis:** Your ${budgetFormatted} budget may be tight for this site. Consider reducing unit count or smaller units.\n\n`;
                }
            }

            responseMessage += `Would you like me to generate a detailed pro forma or compare this to other ${jurisdiction} locations?`;

            return responseMessage;

        } catch (error) {
            console.error('💥 LEWIS TOOL: optimizeProject error:', error);
            return `I encountered an error optimizing your project: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
        }
    },

    analyzeLocation: async (params: any) => {
        try {
            console.log('📍 LEWIS TOOL: analyzeLocation called with:', params);

            // Call API endpoint
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyzeLocation',
                    params: {
                        address: params.address,
                        jurisdiction: params.jurisdiction,
                        radius: params.radius || 1
                    }
                })
            });

            console.log('📍 LEWIS TOOL: Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ LEWIS TOOL: API error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Read response as text first so we can see what we got
            const responseText = await response.text();
            console.log('📍 LEWIS TOOL: Raw response (first 500 chars):', responseText.substring(0, 500));

            let result;
            try {
                result = JSON.parse(responseText);
                console.log('📍 LEWIS TOOL: analyzeLocation API result:', JSON.stringify(result, null, 2));
            } catch (jsonError) {
                console.error('❌ LEWIS TOOL: Failed to parse JSON response');
                console.error('❌ LEWIS TOOL: Response starts with:', responseText.substring(0, 200));
                throw new Error(`API returned invalid JSON (likely a server error). Response: ${responseText.substring(0, 500)}`);
            }

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to analyze location');
            }

            const data = result.data;

            // Build response message
            let responseMessage = `I'll analyze the location at **${data.address}**.\n\n`;
            responseMessage += `**Nearby Amenities (within ${data.searchRadius}):**\n\n`;

            // Format amenities by category
            if (data.amenities && Object.keys(data.amenities).length > 0) {
                for (const [category, places] of Object.entries(data.amenities)) {
                    responseMessage += `**${category}:**\n`;
                    (places as any[]).forEach(place => {
                        responseMessage += `- ${place.name} - ${place.distanceFormatted} away\n`;
                    });
                    responseMessage += `\n`;
                }
            } else {
                responseMessage += `No major amenities found within ${data.searchRadius}.\n\n`;
            }

            // Walkability score
            responseMessage += `**Walkability Score:** ${data.walkabilityScore}/100\n\n`;

            // Location insights
            if (data.insights && data.insights.length > 0) {
                responseMessage += `**Location Insights:**\n`;
                data.insights.forEach((insight: string) => {
                    responseMessage += `- ${insight}\n`;
                });
                responseMessage += `\n`;
            }

            // Overall assessment
            const assessmentEmoji = data.assessment === 'excellent' ? '🌟' :
                                   data.assessment === 'good' ? '✅' : '⚠️';
            responseMessage += `**Overall:** ${assessmentEmoji} This location is **${data.assessment}** for residential development.\n\n`;

            responseMessage += `Would you like me to optimize a project for this site or calculate development fees?`;

            return responseMessage;

        } catch (error) {
            console.error('💥 LEWIS TOOL: analyzeLocation error:', error);
            return `I encountered an error analyzing the location: ${error instanceof Error ? error.message : 'Unknown error'}. Please provide a valid address (e.g., "123 Main St, Phoenix, AZ").`;
        }
    },

    optimizeFees: async (params: any) => {
        try {
            console.log('💰 LEWIS TOOL: optimizeFees called with:', params);

            // Call API endpoint
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'optimizeFees',
                    params: {
                        jurisdiction: params.jurisdiction,
                        projectType: params.projectType,
                        units: params.units,
                        squareFeet: params.squareFeet,
                        currentServiceArea: params.currentServiceArea
                    }
                })
            });

            console.log('💰 LEWIS TOOL: Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ LEWIS TOOL: API error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const responseText = await response.text();
            console.log('💰 LEWIS TOOL: Raw response (first 500 chars):', responseText.substring(0, 500));

            let result;
            try {
                result = JSON.parse(responseText);
                console.log('💰 LEWIS TOOL: optimizeFees API result:', JSON.stringify(result, null, 2));
            } catch (jsonError) {
                console.error('❌ LEWIS TOOL: Failed to parse JSON response');
                throw new Error(`API returned invalid JSON. Response: ${responseText.substring(0, 500)}`);
            }

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to optimize fees');
            }

            const data = result.data;

            // Helper function to format currency
            const formatCurrency = (amount: number): string => {
                const formatted = Math.round(amount).toLocaleString('en-US');
                return '`$' + formatted + '`';
            };

            // Build response message
            let responseMessage = `I'll analyze fee optimization strategies for your ${data.projectSpecs.units}-unit ${data.projectSpecs.type} project in ${data.jurisdiction}.\n\n`;

            const baselineFormatted = formatCurrency(data.baselineFees);
            responseMessage += `**Current Development Fees:** ${baselineFormatted}\n`;
            if (data.projectSpecs.avgSqFtPerUnit) {
                responseMessage += `**Project Size:** ${data.projectSpecs.squareFeet.toLocaleString('en-US')} sq ft total (${data.projectSpecs.avgSqFtPerUnit} sq ft/unit)\n`;
            }
            responseMessage += `\n`;

            // Show strategies
            if (data.strategies && data.strategies.length > 0) {
                responseMessage += `**Fee Reduction Strategies:**\n\n`;

                data.strategies.forEach((strategy: any, index: number) => {
                    responseMessage += `**${index + 1}. ${strategy.strategy}**\n`;

                    if (typeof strategy.savings === 'number') {
                        const savingsFormatted = formatCurrency(strategy.savings);
                        const newTotalFormatted = formatCurrency(strategy.newTotal);
                        const percentSavings = ((strategy.savings / data.baselineFees) * 100).toFixed(1);

                        responseMessage += `   • Potential Savings: ${savingsFormatted} (${percentSavings}% reduction)\n`;
                        responseMessage += `   • New Total: ${newTotalFormatted}\n`;
                    } else {
                        responseMessage += `   • Benefit: ${strategy.savingsFormatted}\n`;
                    }

                    responseMessage += `   • Feasibility: ${strategy.feasibility}\n`;
                    responseMessage += `   • Trade-off: ${strategy.tradeoff}\n\n`;
                });

                // Total potential savings
                if (data.totalPotentialSavings > 0) {
                    const totalSavingsFormatted = formatCurrency(data.totalPotentialSavings);
                    const totalPercent = ((data.totalPotentialSavings / data.baselineFees) * 100).toFixed(1);
                    responseMessage += `**Total Potential Savings:** ${totalSavingsFormatted} (${totalPercent}% reduction)\n\n`;
                }
            } else {
                responseMessage += `**No specific optimization strategies found** for this project configuration.\n\n`;
            }

            // Additional recommendations
            if (data.recommendations && data.recommendations.length > 0) {
                responseMessage += `**Additional Recommendations:**\n`;
                data.recommendations.forEach((rec: string) => {
                    responseMessage += `- ${rec}\n`;
                });
                responseMessage += `\n`;
            }

            responseMessage += `Would you like me to recalculate fees with any of these optimizations applied?`;

            return responseMessage;

        } catch (error) {
            console.error('💥 LEWIS TOOL: optimizeFees error:', error);
            return `I encountered an error optimizing fees: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with valid project parameters.`;
        }
    },

    getAvailableJurisdictions: async (params: any) => {
        try {
            console.log('🔧 LEWIS TOOL: getAvailableJurisdictions called with:', params);

            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getJurisdictions',
                    params: params || {}
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                const jurisdictions = result.data;

                // If state filter was applied, provide contextual response
                if (params && params.state) {
                    if (jurisdictions.length === 0) {
                        return `No ${params.state} cities in database. Available: Phoenix (AZ), Salt Lake City (UT), Los Angeles (CA).`;
                    }

                    const cityNames = jurisdictions.map((j: any) => j.jurisdiction_name);

                    // Return just the city names - LEWIS will use these to proactively compare
                    return `Available in ${params.state}: ${cityNames.join(', ')}`;
                }

                // No filter - show all jurisdictions grouped by state
                const byState: { [key: string]: any[] } = {};
                jurisdictions.forEach((j: any) => {
                    if (!byState[j.state_name]) {
                        byState[j.state_name] = [];
                    }
                    byState[j.state_name].push(j);
                });

                let responseMessage = `I have fee data for ${jurisdictions.length} jurisdictions across ${Object.keys(byState).length} states:\n\n`;

                // Show up to 10 states with their cities
                const states = Object.keys(byState).sort().slice(0, 10);
                states.forEach(state => {
                    const cities = byState[state].map((j: any) => j.jurisdiction_name).join(', ');
                    responseMessage += `**${state}**: ${cities}\n\n`;
                });

                if (Object.keys(byState).length > 10) {
                    responseMessage += `...and ${Object.keys(byState).length - 10} more states\n\n`;
                }

                responseMessage += `Want me to calculate fees for any of these jurisdictions or compare specific cities?`;

                return responseMessage;
            } else {
                throw new Error(result.error || 'Failed to get jurisdictions');
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: getAvailableJurisdictions error:', error);
            return `I encountered an error getting jurisdiction list: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
        }
    },

    getStatesCount: async () => {
        try {
            // Use the Lewis data service to get unique states
            const statesResult = await hybridLewisService.getUniqueStates();

            if (!statesResult.success) {
                throw new Error(statesResult.error || 'Failed to get states count');
            }

            const states = statesResult.data || [];
            const uniqueStates = [...new Set(states)];

            const responseMessage = `I have construction fee data available for **${uniqueStates.length} states**: ${uniqueStates.join(', ')}.\n\nThis comprehensive database covers a wide range of jurisdictions across the United States, giving you access to fee information for construction projects in multiple states. Each state has different fee structures, requirements, and calculation methods.\n\nWould you like me to help you find specific cities or calculate fees for a particular state?`;

            return responseMessage;
        } catch (error) {
            return `I'm sorry, I encountered an error while trying to get the states count: ${error instanceof Error ? error.message : 'Failed to get states count'}. Please try again or let me know if you need help with something else.`;
        }
    },

    getUniqueStates: async () => {
        try {
            // Use the Lewis data service to get unique states
            const statesResult = await hybridLewisService.getUniqueStates();

            if (!statesResult.success) {
                throw new Error(statesResult.error || 'Failed to get unique states');
            }

            const uniqueStates = statesResult.data || [];

            return `I found ${uniqueStates.length} unique states with construction fee data available: ${uniqueStates.join(', ')}.`;
        } catch (error) {
            return `I'm sorry, I encountered an error while trying to get the unique states: ${error instanceof Error ? error.message : 'Failed to get unique states'}. Please try again or let me know if you need help with something else.`;
        }
    },

    // Jurisdiction ranking actions
    rankJurisdictions: async (params: any) => {
        try {
            console.log('🔧 LEWIS TOOL: rankJurisdictions called with:', params);

            // Use API endpoint to ensure server-side execution
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'rankJurisdictions',
                    params: params
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🔧 LEWIS TOOL: rankJurisdictions result:', result);

            // Process the JSON result and return conversational response
            if (result.success && result.data && result.data.length > 0) {
                const rankings = result.data;
                const projectType = params.projectType || 'construction project';
                const projectValue = params.projectValue || 0;
                const projectUnits = params.projectUnits || 0;
                const squareFootage = params.squareFootage || 0;

                let responseMessage = `I've analyzed all jurisdictions in our database to find the best locations for your ${projectType}. `;

                if (projectValue > 0) {
                    responseMessage += `For your $${projectValue.toLocaleString()} project`;
                }
                if (projectUnits > 0) {
                    responseMessage += ` with ${projectUnits} units`;
                }
                if (squareFootage > 0) {
                    responseMessage += ` (${squareFootage.toLocaleString()} sq ft)`;
                }
                responseMessage += `, here are the top-ranked locations:\n\n`;

                // Show top 10 results
                const topResults = rankings.slice(0, 10);
                topResults.forEach((ranking: any, index: number) => {
                    const jurisdiction = ranking.jurisdiction;
                    const totalFees = ranking.totalFees;
                    const overallScore = ranking.overallScore;
                    const marketSize = ranking.marketSize;
                    const strengths = ranking.strengths || [];
                    const considerations = ranking.considerations || [];

                    responseMessage += `**#${index + 1} ${jurisdiction.name}** - Total fees: $${totalFees.toLocaleString()}`;
                    if (projectValue > 0) {
                        const feePercentage = ((totalFees / projectValue) * 100).toFixed(2);
                        responseMessage += ` (${feePercentage}% of project value)`;
                    }
                    responseMessage += `\n`;
                    responseMessage += `• Overall Score: ${overallScore}/100\n`;
                    responseMessage += `• Market Size: ${marketSize}\n`;

                    if (strengths.length > 0) {
                        responseMessage += `• Key Strengths: ${strengths.join(', ')}\n`;
                    }
                    if (considerations.length > 0) {
                        responseMessage += `• Considerations: ${considerations.join(', ')}\n`;
                    }
                    responseMessage += `\n`;
                });

                // Add summary insights
                const bestOption = topResults[0];
                const averageFees = topResults.reduce((sum: number, r: any) => sum + r.totalFees, 0) / topResults.length;

                responseMessage += `**My Recommendation:** ${bestOption.jurisdiction.name} offers the best combination of low fees and strong market fundamentals. `;
                if (projectValue > 0) {
                    const bestFeePercentage = ((bestOption.totalFees / projectValue) * 100).toFixed(2);
                    responseMessage += `At ${bestFeePercentage}% of project value, the fee structure is exceptional - most jurisdictions charge 1-3% of project value. `;
                }
                responseMessage += `The market has strong fundamentals and development-friendly policies.\n\n`;

                responseMessage += `**Next Steps:** I can provide detailed fee breakdowns for any of these locations or help you compare specific jurisdictions side-by-side. The Construction Fee Portal on the right can show you the complete fee structure for any jurisdiction you're interested in. What would you like to explore further?`;

                return responseMessage;
            } else {
                return `I'm sorry, I couldn't find any jurisdiction data to analyze. This might be due to a temporary issue with our database. Please try again or let me know if you need help with something else.`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: rankJurisdictions error:', error);
            return `I'm sorry, I encountered an error while analyzing jurisdictions: ${error instanceof Error ? error.message : 'Failed to rank jurisdictions'}. Please try again or let me know if you need help with something else.`;
        }
    },

    getTopJurisdictions: async (params: any) => {
        try {
            console.log('🔧 LEWIS TOOL: getTopJurisdictions called with:', params);

            // Use API endpoint to ensure server-side execution
            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getTopJurisdictions',
                    params: params
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🔧 LEWIS TOOL: getTopJurisdictions result:', result);

            // Process the JSON result and return conversational response
            if (result.success && result.data && result.data.length > 0) {
                const rankings = result.data;
                const projectType = params.projectType || 'construction project';
                const projectValue = params.projectValue || 0;
                const projectUnits = params.projectUnits || 0;
                const squareFootage = params.squareFootage || 0;
                const limit = params.limit || 10;

                let responseMessage = `I've analyzed all jurisdictions in our database to find the best locations for your ${projectType}. `;

                if (projectValue > 0) {
                    responseMessage += `For your $${projectValue.toLocaleString()} project`;
                }
                if (projectUnits > 0) {
                    responseMessage += ` with ${projectUnits} units`;
                }
                if (squareFootage > 0) {
                    responseMessage += ` (${squareFootage.toLocaleString()} sq ft)`;
                }
                responseMessage += `, here are the top ${Math.min(limit, rankings.length)} locations:\n\n`;

                // Show results up to the limit
                const topResults = rankings.slice(0, limit);
                topResults.forEach((ranking: any, index: number) => {
                    const jurisdiction = ranking.jurisdiction;
                    const totalFees = ranking.totalFees;
                    const overallScore = ranking.overallScore;
                    const marketSize = ranking.marketSize;
                    const strengths = ranking.strengths || [];
                    const considerations = ranking.considerations || [];

                    responseMessage += `**#${index + 1} ${jurisdiction.name}** - Total fees: $${totalFees.toLocaleString()}`;
                    if (projectValue > 0) {
                        const feePercentage = ((totalFees / projectValue) * 100).toFixed(2);
                        responseMessage += ` (${feePercentage}% of project value)`;
                    }
                    responseMessage += `\n`;
                    responseMessage += `• Overall Score: ${overallScore}/100\n`;
                    responseMessage += `• Market Size: ${marketSize}\n`;

                    if (strengths.length > 0) {
                        responseMessage += `• Key Strengths: ${strengths.join(', ')}\n`;
                    }
                    if (considerations.length > 0) {
                        responseMessage += `• Considerations: ${considerations.join(', ')}\n`;
                    }
                    responseMessage += `\n`;
                });

                // Add summary insights
                const bestOption = topResults[0];
                const averageFees = topResults.reduce((sum: number, r: any) => sum + r.totalFees, 0) / topResults.length;

                responseMessage += `**My Recommendation:** ${bestOption.jurisdiction.name} offers the best combination of low fees and strong market fundamentals. `;
                if (projectValue > 0) {
                    const bestFeePercentage = ((bestOption.totalFees / projectValue) * 100).toFixed(2);
                    responseMessage += `At ${bestFeePercentage}% of project value, the fee structure is exceptional - most jurisdictions charge 1-3% of project value. `;
                }
                responseMessage += `The market has strong fundamentals and development-friendly policies.\n\n`;

                responseMessage += `**Next Steps:** I can provide detailed fee breakdowns for any of these locations or help you compare specific jurisdictions side-by-side. The Construction Fee Portal on the right can show you the complete fee structure for any jurisdiction you're interested in. What would you like to explore further?`;

                return responseMessage;
            } else {
                return `I'm sorry, I couldn't find any jurisdiction data to analyze. This might be due to a temporary issue with our database. Please try again or let me know if you need help with something else.`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: getTopJurisdictions error:', error);
            return `I'm sorry, I encountered an error while analyzing jurisdictions: ${error instanceof Error ? error.message : 'Failed to get top jurisdictions'}. Please try again or let me know if you need help with something else.`;
        }
    },

    // Portal integration actions
    populatePortal: async (params: PopulatePortalParams) => {
        try {
            console.log('🔧 LEWIS TOOL: populatePortal called with:', params);

            // Calculate fee totals for the response
            let feeSummary = '';
            if (params.jurisdictionName) {
                try {
                    console.log('🔧 LEWIS TOOL: Starting fee calculation for:', params.jurisdictionName);

                    // Get real jurisdictions to find the matching one
                    const jurisdictionsResult = await lewisDataService.getJurisdictions();
                    console.log('🔧 LEWIS TOOL: Jurisdictions result:', jurisdictionsResult);

                    if (jurisdictionsResult.success && jurisdictionsResult.data && jurisdictionsResult.data.length > 0) {
                        console.log('🔧 LEWIS TOOL: Total jurisdictions found:', jurisdictionsResult.data.length);
                        console.log('🔧 LEWIS TOOL: First few jurisdictions:', jurisdictionsResult.data.slice(0, 3));

                        const matchingJurisdiction = jurisdictionsResult.data.find((j: any) =>
                            j.name.toLowerCase().includes(params.jurisdictionName!.toLowerCase()) ||
                            params.jurisdictionName!.toLowerCase().includes(j.name.toLowerCase())
                        );

                        console.log('🔧 LEWIS TOOL: Matching jurisdiction:', matchingJurisdiction);

                        if (matchingJurisdiction) {
                            // Get real fees for this jurisdiction
                            const feesResult = await lewisDataService.getJurisdictionFees(matchingJurisdiction.id);
                            console.log('🔧 LEWIS TOOL: Fees result:', feesResult);

                            if (feesResult.success && feesResult.data) {
                                const fees = feesResult.data;

                                // Calculate totals
                                const totalFees = fees.length;
                                const applicableFees = fees.filter((fee: any) => {
                                    // Simple filtering based on project type
                                    const feeName = fee.name.toLowerCase();
                                    const projectType = params.projectType?.toLowerCase() || '';

                                    if (projectType.includes('residential')) {
                                        return feeName.includes('residential') || feeName.includes('single family') ||
                                            feeName.includes('multi-family') || feeName.includes('apartment') ||
                                            !feeName.includes('commercial') && !feeName.includes('industrial');
                                    } else if (projectType.includes('commercial')) {
                                        return feeName.includes('commercial') || feeName.includes('business') ||
                                            !feeName.includes('residential') && !feeName.includes('single family');
                                    }
                                    return true; // Include all fees if no specific type
                                });

                                // Calculate estimated total cost (simplified)
                                let estimatedTotal = 0;
                                applicableFees.forEach((fee: any) => {
                                    if (fee.rate) {
                                        const rate = parseFloat(fee.rate);
                                        if (fee.category === 'flat') {
                                            estimatedTotal += rate;
                                        } else if (fee.category === 'per_unit' && params.projectUnits) {
                                            estimatedTotal += rate * params.projectUnits;
                                        } else if (fee.category === 'per_sqft' && params.squareFootage) {
                                            estimatedTotal += rate * params.squareFootage;
                                        } else if (fee.category === 'per_acre' && params.projectAcreage) {
                                            estimatedTotal += rate * params.projectAcreage;
                                        }
                                    }
                                });

                                feeSummary = `\n\n**Fee Summary for ${params.jurisdictionName}:**\n`;
                                feeSummary += `• Total Fee Records: ${totalFees}\n`;
                                feeSummary += `• Applicable Fees: ${applicableFees.length}\n`;
                                feeSummary += `• Estimated Total Cost: $${estimatedTotal.toLocaleString()}`;

                                console.log('🔧 LEWIS TOOL: Fee summary calculated:', feeSummary);
                            } else {
                                console.log('🔧 LEWIS TOOL: No fees found for jurisdiction');
                                feeSummary = `\n\n*No fee data available for ${params.jurisdictionName} - check the portal for more details.*`;
                            }
                        } else {
                            console.log('🔧 LEWIS TOOL: No matching jurisdiction found');
                            feeSummary = `\n\n*Jurisdiction "${params.jurisdictionName}" not found in database - check the portal for available locations.*`;
                        }
                    } else {
                        console.log('🔧 LEWIS TOOL: No jurisdictions data available');
                        feeSummary = `\n\n*No jurisdiction data available in database - check the portal for available locations.*`;
                    }
                } catch (feeError) {
                    console.log('🔧 LEWIS TOOL: Error calculating fees:', feeError);
                    feeSummary = `\n\n*Fee calculation in progress - check the portal for detailed breakdown.*`;
                }
            }

            // Build response
            let response = `Great! I've updated the Construction Fee Portal with your project details.`;

            if (params.jurisdictionName) {
                response += ` I've set the location to ${params.jurisdictionName}.`;
            }
            if (params.projectUnits) {
                response += ` The project is set for ${params.projectUnits} units.`;
            }
            if (params.squareFootage) {
                response += ` The size is ${params.squareFootage.toLocaleString()} square feet.`;
            }
            if (params.projectAcreage) {
                response += ` The acreage is ${params.projectAcreage} acres.`;
            }

            response += ` Check the portal on the right to see the fee calculations.`;
            response += feeSummary;

            return response;
        } catch (error) {
            return `Sorry, I had trouble updating the portal. Please try again.`;
        }
    },

    getPortalData: async (params: GetPortalDataParams) => {
        try {
            console.log('🔧 LEWIS TOOL: getPortalData called');

            // Get current project data from the portal
            const portalData = lewisPortalIntegration.getCurrentProjectData();

            if (portalData) {
                let responseMessage = `I can see your current project setup in the portal:\n\n`;

                if (portalData.jurisdictionName) {
                    responseMessage += `📍 **Location**: ${portalData.jurisdictionName}\n`;
                }
                if (portalData.projectType) {
                    responseMessage += `🏗️ **Project Type**: ${portalData.projectType}\n`;
                }
                if (portalData.projectUnits) {
                    responseMessage += `🏠 **Units**: ${portalData.projectUnits}\n`;
                }
                if (portalData.projectAcreage) {
                    responseMessage += `📏 **Acreage**: ${portalData.projectAcreage} acres\n`;
                }
                if (portalData.squareFootage) {
                    responseMessage += `📐 **Square Footage**: ${portalData.squareFootage.toLocaleString()} sq ft\n`;
                }
                if (portalData.projectValue) {
                    responseMessage += `💰 **Project Value**: $${portalData.projectValue.toLocaleString()}\n`;
                }
                if (portalData.meterSize) {
                    responseMessage += `🔧 **Meter Size**: ${portalData.meterSize}\n`;
                }

                responseMessage += `\nI can help you with fee calculations, comparisons, or answer questions about this project. What would you like to know?`;

                return responseMessage;
            } else {
                return `I don't see any project data in the portal yet. To get started, you can either:\n\n• Fill in the portal manually with your project details\n• Tell me about your project (like "I want to build a 50-unit apartment complex in Phoenix") and I'll populate the portal for you\n\nWhat would you like to do?`;
            }
        } catch (error) {
            return `I'm sorry, I encountered an error while trying to get the portal data: ${error instanceof Error ? error.message : 'Failed to get portal data'}. Please try again or let me know if you need help with something else.`;
        }
    },

    // Demo data actions for testing
    getDemoJurisdictions: async () => {
        try {
            console.log('🔧 LEWIS TOOL: getDemoJurisdictions called');
            const result = await lewisDataService.getDemoJurisdictions();
            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get demo jurisdictions'
            };
        }
    },

    getDemoJurisdictionFees: async (params: { jurisdictionId: string }) => {
        try {
            console.log('🔧 LEWIS TOOL: getDemoJurisdictionFees called with:', params);
            const result = await lewisDataService.getDemoJurisdictionFees(params.jurisdictionId);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get demo jurisdiction fees'
            };
        }
    },

    // Enhanced LEWIS data access actions
    ...enhancedLewisActions,

    // Grant Trading Tool implementations
    getStockQuote: async (params: GetStockQuoteParams) => {
        try {
            const apiKey = process.env.POLYGON_API_KEY;
            if (!apiKey) {
                throw new Error('Polygon.io API key not configured');
            }

            const response = await fetch(
                `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${params.ticker.toUpperCase()}?apikey=${apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.results || !data.results[params.ticker.toUpperCase()]) {
                throw new Error(`No data found for ticker ${params.ticker.toUpperCase()}`);
            }

            const stockData = data.results[params.ticker.toUpperCase()];
            const quote = {
                ticker: params.ticker.toUpperCase(),
                price: stockData.lastQuote?.P || stockData.lastTrade?.P || 0,
                change: (stockData.lastQuote?.P || stockData.lastTrade?.P || 0) - (stockData.prevDay?.c || 0),
                changePercent: stockData.prevDay?.c ?
                    (((stockData.lastQuote?.P || stockData.lastTrade?.P || 0) - stockData.prevDay.c) / stockData.prevDay.c) * 100 : 0,
                volume: stockData.lastTrade?.s || 0,
                marketCap: stockData.market?.marketCap || 0,
                high: stockData.prevDay?.h || 0,
                low: stockData.prevDay?.l || 0,
                open: stockData.prevDay?.o || 0,
                previousClose: stockData.prevDay?.c || 0,
                timestamp: new Date().toISOString()
            };

            return {
                success: true,
                data: quote,
                message: `Stock quote retrieved for ${params.ticker.toUpperCase()}`,
                source: 'Polygon.io API'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get stock quote',
                params
            };
        }
    },

    getStockHistory: async (params: GetStockHistoryParams) => {
        try {
            const apiKey = process.env.POLYGON_API_KEY;
            if (!apiKey) {
                throw new Error('Polygon.io API key not configured');
            }

            const from = params.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const to = params.to || new Date().toISOString().split('T')[0];
            const timespan = params.timespan || 'day';
            const multiplier = params.multiplier || 1;

            const response = await fetch(
                `https://api.polygon.io/v2/aggs/ticker/${params.ticker.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apikey=${apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.results) {
                throw new Error(`No historical data found for ticker ${params.ticker.toUpperCase()}`);
            }

            const history = data.results.map((bar: any) => ({
                date: new Date(bar.t).toISOString().split('T')[0],
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                volume: bar.v
            }));

            return {
                success: true,
                data: history,
                total: history.length,
                ticker: params.ticker.toUpperCase(),
                timeframe: timespan,
                message: `Historical data retrieved for ${params.ticker.toUpperCase()}`,
                source: 'Polygon.io API'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get stock history',
                params
            };
        }
    },

    getMarketIndicators: async (params: GetMarketIndicatorsParams) => {
        try {
            const apiKey = process.env.POLYGON_API_KEY;
            if (!apiKey) {
                throw new Error('Polygon.io API key not configured');
            }

            // Get historical data to calculate indicators
            const historyResult = await createCustomApiToolActions().getStockHistory({
                ticker: params.ticker,
                from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days
                to: new Date().toISOString().split('T')[0],
                timespan: 'day'
            });

            if (!historyResult.success || !historyResult.data) {
                throw new Error('Failed to get historical data for indicator calculation');
            }

            const history = historyResult.data;
            const closes = history.map((bar: any) => bar.close);
            const volumes = history.map((bar: any) => bar.volume);

            // Calculate RSI
            const rsi = calculateRSI(closes, 14);

            // Calculate Moving Averages
            const sma20 = calculateSMA(closes, 20);
            const sma50 = calculateSMA(closes, 50);

            // Calculate MACD
            const macd = calculateMACD(closes);

            // Calculate Bollinger Bands
            const bollinger = calculateBollingerBands(closes, 20);

            const indicators = [
                {
                    name: 'RSI',
                    value: rsi,
                    signal: rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral',
                    description: 'Relative Strength Index (14-period)'
                },
                {
                    name: 'MACD',
                    value: macd.macd,
                    signal: macd.macd > macd.signal ? 'bullish' : 'bearish',
                    description: 'Moving Average Convergence Divergence'
                },
                {
                    name: 'SMA 20',
                    value: sma20,
                    signal: closes[closes.length - 1] > sma20 ? 'bullish' : 'bearish',
                    description: '20-day Simple Moving Average'
                },
                {
                    name: 'SMA 50',
                    value: sma50,
                    signal: closes[closes.length - 1] > sma50 ? 'bullish' : 'bearish',
                    description: '50-day Simple Moving Average'
                },
                {
                    name: 'Volume',
                    value: volumes[volumes.length - 1],
                    signal: 'neutral',
                    description: 'Current Trading Volume'
                }
            ];

            return {
                success: true,
                data: indicators,
                ticker: params.ticker.toUpperCase(),
                message: `Technical indicators calculated for ${params.ticker.toUpperCase()}`,
                source: 'Polygon.io API + Technical Analysis'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get market indicators',
                params
            };
        }
    },

    getTradingAdvice: async (params: GetTradingAdviceParams) => {
        try {
            const apiKey = process.env.POLYGON_API_KEY;
            if (!apiKey) {
                throw new Error('Polygon.io API key not configured');
            }

            // Get current quote and indicators
            const [quoteResult, indicatorsResult] = await Promise.all([
                createCustomApiToolActions().getStockQuote({ ticker: params.ticker }),
                createCustomApiToolActions().getMarketIndicators({ ticker: params.ticker })
            ]);

            if (!quoteResult.success || !indicatorsResult.success) {
                throw new Error('Failed to get market data for trading advice');
            }

            const quote = quoteResult.data;
            const indicators = indicatorsResult.data;

            // Analyze indicators to generate advice
            const analysis = analyzeTradingSignals(indicators, quote, params.timeframe, params.riskTolerance);

            return {
                success: true,
                data: analysis,
                ticker: params.ticker.toUpperCase(),
                message: `Trading advice generated for ${params.ticker.toUpperCase()}`,
                source: 'Grant Trading Analysis + Polygon.io Data'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get trading advice',
                params
            };
        }
    },

    getMarketNews: async (params: GetMarketNewsParams) => {
        try {
            const apiKey = process.env.POLYGON_API_KEY;
            if (!apiKey) {
                throw new Error('Polygon.io API key not configured');
            }

            // Get news from Polygon.io
            const response = await fetch(
                `https://api.polygon.io/v2/reference/news?ticker=${params.ticker.toUpperCase()}&limit=${params.limit || 10}&apikey=${apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.results) {
                throw new Error(`No news found for ticker ${params.ticker.toUpperCase()}`);
            }

            const news = data.results.map((article: any) => ({
                title: article.title,
                summary: article.description || 'No description available',
                sentiment: analyzeSentiment(article.title + ' ' + (article.description || '')),
                publishedAt: article.published_utc,
                url: article.article_url,
                source: article.author || 'Unknown'
            }));

            return {
                success: true,
                data: news,
                total: news.length,
                ticker: params.ticker.toUpperCase(),
                message: `Market news retrieved for ${params.ticker.toUpperCase()}`,
                source: 'Polygon.io News API'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get market news',
                params
            };
        }
    },

    // Course Builder Tool implementations
    createCourseOutline: async (params: CreateCourseOutlineParams) => {
        console.log('🔧 COURSE BUILDER DEBUG: createCourseOutline called with params:', params);
        console.log('🔧 COURSE BUILDER DEBUG: params type:', typeof params);
        console.log('🔧 COURSE BUILDER DEBUG: params keys:', Object.keys(params));

        try {
            // Implementation for creating course outlines
            const { subject, level = 'beginner', duration = '4 weeks', learningGoals = [], targetAudience, format = 'mixed' } = params;

            console.log('🔧 COURSE BUILDER DEBUG: destructured params:', { subject, level, duration, learningGoals, targetAudience, format });

            // Generate course structure based on subject and level
            const modules = generateCourseModules(subject, level);
            console.log('🔧 COURSE BUILDER DEBUG: generated modules:', modules);

            const result = {
                success: true,
                courseOutline: {
                    title: `${subject} Course`,
                    subject,
                    level,
                    duration,
                    targetAudience: targetAudience || 'General learners',
                    format,
                    modules,
                    learningObjectives: learningGoals.length > 0 ? learningGoals : generateDefaultLearningGoals(subject, level),
                    prerequisites: generatePrerequisites(level),
                    estimatedHours: calculateEstimatedHours(duration),
                    certification: level === 'advanced' ? 'Advanced Certificate' : 'Completion Certificate'
                }
            };

            console.log('🔧 COURSE BUILDER DEBUG: returning result:', result);
            return result;
        } catch (error) {
            console.error('🔧 COURSE BUILDER ERROR: createCourseOutline failed:', error);
            throw error;
        }
    },

    generateLessonContent: async (params: GenerateLessonContentParams) => {
        console.log('🔧 COURSE BUILDER DEBUG: generateLessonContent called with params:', params);

        try {
            // Implementation for generating lesson content
            const { lessonTitle, lessonType = 'lecture', duration = '45 minutes', learningObjectives = [], prerequisites = [], includeActivities = true, includeResources = true } = params;

            console.log('🔧 COURSE BUILDER DEBUG: destructured lesson params:', { lessonTitle, lessonType, duration, includeActivities, includeResources });

            const result = {
                success: true,
                lessonContent: {
                    lessonTitle,
                    lessonType,
                    duration,
                    learningObjectives: learningObjectives.length > 0 ? learningObjectives : generateDefaultLessonObjectives(lessonTitle),
                    prerequisites,
                    content: generateLessonContent(lessonTitle, lessonType),
                    activities: includeActivities ? generateLessonActivities(lessonTitle, lessonType) : [],
                    resources: includeResources ? generateLessonResources(lessonTitle, lessonType) : [],
                    assessment: generateLessonAssessment(lessonTitle, lessonType),
                    estimatedCompletionTime: duration
                }
            };

            console.log('🔧 COURSE BUILDER DEBUG: returning lesson result:', result);
            return result;
        } catch (error) {
            console.error('🔧 COURSE BUILDER ERROR: generateLessonContent failed:', error);
            throw error;
        }
    },

    createAssessment: async (params: CreateAssessmentParams) => {
        console.log('🔧 COURSE BUILDER DEBUG: createAssessment called with params:', params);

        try {
            const { assessmentType, subject, difficulty = 'medium', questionCount = 10, includeAnswers = true, rubric = false } = params;

            console.log('🔧 COURSE BUILDER DEBUG: destructured assessment params:', { assessmentType, subject, difficulty, questionCount, includeAnswers, rubric });

            const assessment = generateAssessment(assessmentType, subject, difficulty, questionCount);
            console.log('🔧 COURSE BUILDER DEBUG: generated assessment:', assessment);

            const result = {
                success: true,
                assessment: {
                    ...assessment,
                    includeAnswers,
                    rubric: rubric && assessmentType !== 'quiz' ? generateAssessmentRubric(assessmentType, difficulty) : undefined
                }
            };

            console.log('🔧 COURSE BUILDER DEBUG: returning assessment result:', result);
            return result;
        } catch (error) {
            console.error('🔧 COURSE BUILDER ERROR: createAssessment failed:', error);
            throw error;
        }
    },

    generateMarketingContent: async (params: GenerateMarketingContentParams) => {
        console.log('🔧 COURSE BUILDER DEBUG: generateMarketingContent called with params:', params);

        try {
            const { courseTitle, targetAudience, contentType = 'course-description', tone = 'professional', keyBenefits = [], callToAction } = params;

            console.log('🔧 COURSE BUILDER DEBUG: destructured marketing params:', { courseTitle, targetAudience, contentType, tone, keyBenefits, callToAction });

            const marketingContent = generateMarketingContent(contentType, courseTitle, targetAudience || 'Learners', tone, keyBenefits, callToAction || 'Enroll now!');
            console.log('🔧 COURSE BUILDER DEBUG: generated marketing content:', marketingContent);

            const result = {
                success: true,
                marketingContent
            };

            console.log('🔧 COURSE BUILDER DEBUG: returning marketing result:', result);
            return result;
        } catch (error) {
            console.error('🔧 COURSE BUILDER ERROR: generateMarketingContent failed:', error);
            throw error;
        }
    },

    pricingStrategy: async (params: PricingStrategyParams) => {
        console.log('🔧 COURSE BUILDER DEBUG: pricingStrategy called with params:', params);

        try {
            const { courseType, marketSegment = 'mid-market', competition, valueProposition, includeBonuses = true, paymentOptions = ['one-time'] } = params;

            console.log('🔧 COURSE BUILDER DEBUG: destructured pricing params:', { courseType, marketSegment, competition, valueProposition, includeBonuses, paymentOptions });

            const pricing = generatePricingStrategy(courseType, marketSegment, competition || 'Standard market', valueProposition || 'Quality education', includeBonuses, paymentOptions);
            console.log('🔧 COURSE BUILDER DEBUG: generated pricing strategy:', pricing);

            const result = {
                success: true,
                pricingStrategy: pricing
            };

            console.log('🔧 COURSE BUILDER DEBUG: returning pricing result:', result);
            return result;
        } catch (error) {
            console.error('🔧 COURSE BUILDER ERROR: pricingStrategy failed:', error);
            throw error;
        }
    }
});

// Technical Analysis Helper Functions
function calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = prices[prices.length - i] - prices[prices.length - i - 1];
        if (change > 0) {
            gains += change;
        } else {
            losses -= change;
        }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
}

function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number; signal: number; histogram: number } {
    if (prices.length < slowPeriod) {
        return { macd: 0, signal: 0, histogram: 0 };
    }

    const ema12 = calculateEMA(prices, fastPeriod);
    const ema26 = calculateEMA(prices, slowPeriod);
    const macd = ema12 - ema26;

    // Calculate signal line (EMA of MACD)
    const macdValues = prices.map((_, i) => {
        if (i < slowPeriod - 1) return 0;
        const fastEMA = calculateEMA(prices.slice(0, i + 1), fastPeriod);
        const slowEMA = calculateEMA(prices.slice(0, i + 1), slowPeriod);
        return fastEMA - slowEMA;
    }).filter(val => val !== 0);

    const signal = calculateEMA(macdValues, signalPeriod);
    const histogram = macd - signal;

    return { macd, signal, histogram };
}

function calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
    if (prices.length < period) {
        const price = prices[prices.length - 1] || 0;
        return { upper: price, middle: price, lower: price };
    }

    const sma = calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);

    const variance = recentPrices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
        upper: sma + (standardDeviation * stdDev),
        middle: sma,
        lower: sma - (standardDeviation * stdDev)
    };
}

function analyzeTradingSignals(indicators: any[], quote: any, timeframe: string = 'day', riskTolerance: string = 'moderate'): any {
    let bullishSignals = 0;
    let bearishSignals = 0;
    let totalSignals = 0;

    // Count signals
    indicators.forEach(indicator => {
        if (indicator.signal === 'bullish') bullishSignals++;
        else if (indicator.signal === 'bearish') bearishSignals++;
        totalSignals++;
    });

    // Determine action based on signal strength
    let action: 'buy' | 'sell' | 'hold';
    let confidence = 0;

    if (bullishSignals > bearishSignals && bullishSignals / totalSignals > 0.6) {
        action = 'buy';
        confidence = Math.min(90, 60 + (bullishSignals / totalSignals) * 30);
    } else if (bearishSignals > bullishSignals && bearishSignals / totalSignals > 0.6) {
        action = 'sell';
        confidence = Math.min(90, 60 + (bearishSignals / totalSignals) * 30);
    } else {
        action = 'hold';
        confidence = 50;
    }

    // Calculate entry, stop loss, and take profit
    const currentPrice = quote.price;
    const volatility = Math.abs(quote.changePercent) / 100;

    let stopLoss = 0;
    let takeProfit = 0;

    if (action === 'buy') {
        stopLoss = currentPrice * (1 - (volatility * 2));
        takeProfit = currentPrice * (1 + (volatility * 3));
    } else if (action === 'sell') {
        stopLoss = currentPrice * (1 + (volatility * 2));
        takeProfit = currentPrice * (1 - (volatility * 3));
    }

    // Determine risk level based on volatility and timeframe
    let riskLevel: 'low' | 'medium' | 'high';
    if (volatility < 0.02) riskLevel = 'low';
    else if (volatility < 0.05) riskLevel = 'medium';
    else riskLevel = 'high';

    // Generate reasoning
    const reasoning = [];
    if (action === 'buy') {
        reasoning.push('Technical indicators showing bullish momentum');
        reasoning.push('Price action supporting upward movement');
        reasoning.push('Volume confirming trend strength');
    } else if (action === 'sell') {
        reasoning.push('Technical indicators showing bearish momentum');
        reasoning.push('Price action supporting downward movement');
        reasoning.push('Volume confirming trend weakness');
    } else {
        reasoning.push('Mixed technical signals');
        reasoning.push('Market in consolidation phase');
        reasoning.push('Wait for clearer direction');
    }

    return {
        action,
        confidence: Math.round(confidence),
        entryPrice: currentPrice,
        stopLoss: Math.round(stopLoss * 100) / 100,
        takeProfit: Math.round(takeProfit * 100) / 100,
        reasoning,
        riskLevel,
        timeframe,
        riskTolerance
    };
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bullish', 'positive', 'growth', 'gain', 'rise', 'up', 'strong', 'beat', 'exceed', 'surge', 'rally', 'optimistic', 'favorable'];
    const negativeWords = ['bearish', 'negative', 'decline', 'loss', 'fall', 'down', 'weak', 'miss', 'below', 'drop', 'crash', 'pessimistic', 'unfavorable'];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
}

// Course Builder Helper Functions
function generateCourseModules(subject: string, level: string): any[] {
    const baseModules = [
        {
            title: 'Introduction to ' + subject,
            description: 'Get started with the fundamentals',
            lessons: ['Overview', 'Key Concepts', 'Getting Started'],
            duration: '1 week'
        },
        {
            title: 'Core Concepts',
            description: 'Master the essential principles',
            lessons: ['Theory', 'Practice', 'Examples'],
            duration: '2 weeks'
        },
        {
            title: 'Advanced Applications',
            description: 'Apply your knowledge to real scenarios',
            lessons: ['Case Studies', 'Projects', 'Best Practices'],
            duration: '1 week'
        }
    ];

    if (level === 'intermediate') {
        baseModules.push({
            title: 'Intermediate Techniques',
            description: 'Build on your foundation',
            lessons: ['Advanced Methods', 'Optimization', 'Troubleshooting'],
            duration: '2 weeks'
        });
    }

    if (level === 'advanced') {
        baseModules.push(
            {
                title: 'Advanced Strategies',
                description: 'Master complex scenarios',
                lessons: ['Expert Techniques', 'Industry Insights', 'Innovation'],
                duration: '2 weeks'
            },
            {
                title: 'Capstone Project',
                description: 'Apply everything you\'ve learned',
                lessons: ['Project Planning', 'Implementation', 'Presentation'],
                duration: '2 weeks'
            }
        );
    }

    return baseModules;
}

function generateDefaultLearningGoals(subject: string, level: string): string[] {
    const baseGoals = [
        `Understand the fundamental concepts of ${subject}`,
        `Apply basic principles in practical scenarios`,
        `Develop confidence in using ${subject} tools and techniques`
    ];

    if (level === 'intermediate') {
        baseGoals.push(
            `Master intermediate-level ${subject} techniques`,
            `Solve complex problems using ${subject} methodologies`,
            `Optimize workflows and processes`
        );
    }

    if (level === 'advanced') {
        baseGoals.push(
            `Achieve expert-level proficiency in ${subject}`,
            `Innovate and create new approaches`,
            `Mentor others in ${subject} best practices`
        );
    }

    return baseGoals;
}

function generatePrerequisites(level: string): string[] {
    if (level === 'beginner') {
        return ['No prior experience required', 'Basic computer literacy', 'Willingness to learn'];
    } else if (level === 'intermediate') {
        return ['Basic understanding of the subject', 'Some practical experience', 'Familiarity with related tools'];
    } else {
        return ['Intermediate to advanced knowledge', 'Significant practical experience', 'Understanding of industry standards'];
    }
}

function calculateEstimatedHours(duration: string): number {
    if (duration.includes('week')) {
        const weeks = parseInt(duration.match(/\d+/)?.[0] || '4');
        return weeks * 5; // 5 hours per week
    } else if (duration.includes('hour')) {
        return parseInt(duration.match(/\d+/)?.[0] || '20');
    } else if (duration.includes('module')) {
        const modules = parseInt(duration.match(/\d+/)?.[0] || '8');
        return modules * 2; // 2 hours per module
    }
    return 20; // Default
}

function generateDefaultLessonObjectives(lessonTitle: string): string[] {
    return [
        `Understand the key concepts of ${lessonTitle}`,
        `Apply the knowledge in practical exercises`,
        `Complete the lesson activities successfully`
    ];
}

function generateLessonContent(lessonTitle: string, lessonType: string): string {
    const contentTemplates = {
        lecture: `This lecture covers the essential concepts of ${lessonTitle}. You'll learn the theoretical foundations and practical applications that will help you master this topic.`,
        workshop: `In this hands-on workshop, you'll actively practice ${lessonTitle} through guided exercises and real-world scenarios.`,
        'case-study': `This case study examines real-world applications of ${lessonTitle}, providing insights into how these concepts work in practice.`,
        project: `This project-based lesson will challenge you to apply your knowledge of ${lessonTitle} to create something meaningful.`,
        quiz: `Test your understanding of ${lessonTitle} with this comprehensive assessment that covers all the key concepts.`
    };

    return contentTemplates[lessonType as keyof typeof contentTemplates] || contentTemplates.lecture;
}

function generateLessonActivities(lessonTitle: string, lessonType: string): any[] {
    const activities = [
        {
            title: 'Knowledge Check',
            description: 'Quick quiz to test understanding',
            duration: '10 minutes',
            type: 'assessment'
        }
    ];

    if (lessonType === 'workshop' || lessonType === 'project') {
        activities.push(
            {
                title: 'Hands-on Exercise',
                description: 'Practical application of concepts',
                duration: '30 minutes',
                type: 'practice'
            },
            {
                title: 'Group Discussion',
                description: 'Share insights and learn from peers',
                duration: '15 minutes',
                type: 'collaboration'
            }
        );
    }

    if (lessonType === 'case-study') {
        activities.push({
            title: 'Case Analysis',
            description: 'Analyze real-world scenarios',
            duration: '25 minutes',
            type: 'analysis'
        });
    }

    return activities;
}

function generateLessonResources(lessonTitle: string, lessonType: string): any[] {
    return [
        {
            title: 'Reading Materials',
            type: 'document',
            description: 'Comprehensive guide to ' + lessonTitle
        },
        {
            title: 'Video Tutorial',
            type: 'video',
            description: 'Step-by-step demonstration'
        },
        {
            title: 'Practice Exercises',
            type: 'exercise',
            description: 'Additional practice problems'
        },
        {
            title: 'Reference Links',
            type: 'external',
            description: 'Further reading and resources'
        }
    ];
}

function generateLessonAssessment(lessonTitle: string, lessonType: string): any {
    if (lessonType === 'quiz') {
        return {
            type: 'quiz',
            questions: 5,
            format: 'multiple-choice',
            passingScore: 80
        };
    }

    return {
        type: 'assignment',
        description: `Complete the ${lessonTitle} activities and submit your work`,
        criteria: ['Understanding', 'Application', 'Creativity'],
        dueDate: 'End of lesson'
    };
}

// Course Builder Tool specific parameters
interface CreateCourseOutlineParams {
    subject: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    duration?: string;
    learningGoals?: string[];
    targetAudience?: string;
    format?: 'video' | 'text' | 'interactive' | 'mixed';
}

interface GenerateLessonContentParams {
    lessonTitle: string;
    lessonType?: 'lecture' | 'workshop' | 'case-study' | 'project' | 'quiz';
    duration?: string;
    learningObjectives?: string[];
    prerequisites?: string[];
    includeActivities?: boolean;
    includeResources?: boolean;
}

interface CreateAssessmentParams {
    assessmentType: 'quiz' | 'test' | 'project' | 'presentation' | 'portfolio';
    subject: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
    includeAnswers?: boolean;
    rubric?: boolean;
}

interface GenerateMarketingContentParams {
    courseTitle: string;
    targetAudience?: string;
    contentType?: 'course-description' | 'email-sequence' | 'social-media' | 'landing-page' | 'video-script';
    tone?: 'professional' | 'casual' | 'enthusiastic' | 'authoritative' | 'friendly';
    keyBenefits?: string[];
    callToAction?: string;
}

interface PricingStrategyParams {
    courseType: 'self-paced' | 'live-cohort' | 'hybrid' | 'certification';
    marketSegment?: 'budget' | 'mid-market' | 'premium' | 'enterprise';
    competition?: string;
    valueProposition?: string;
    includeBonuses?: boolean;
    paymentOptions?: string[];
}

function generateAssessment(assessmentType: string, subject: string, difficulty: string, questionCount: number): any {
    const baseAssessment = {
        assessmentType,
        title: `${subject} Assessment`,
        subject,
        difficulty,
        instructions: `Complete this ${assessmentType} to test your knowledge of ${subject}`,
        timeLimit: calculateTimeLimit(assessmentType, questionCount),
        totalPoints: calculateTotalPoints(assessmentType, questionCount)
    };

    if (assessmentType === 'quiz' || assessmentType === 'test') {
        return {
            ...baseAssessment,
            questions: generateQuestions(subject, difficulty, questionCount),
            format: 'multiple-choice',
            passingScore: difficulty === 'easy' ? 70 : difficulty === 'medium' ? 80 : 85
        };
    } else if (assessmentType === 'project') {
        return {
            ...baseAssessment,
            projectDescription: generateProjectDescription(subject, difficulty),
            deliverables: generateProjectDeliverables(subject),
            criteria: generateProjectCriteria(difficulty)
        };
    } else if (assessmentType === 'presentation') {
        return {
            ...baseAssessment,
            presentationTopic: generatePresentationTopic(subject),
            requirements: generatePresentationRequirements(difficulty),
            evaluationCriteria: generatePresentationCriteria()
        };
    } else {
        return {
            ...baseAssessment,
            portfolioRequirements: generatePortfolioRequirements(subject, difficulty),
            submissionGuidelines: generateSubmissionGuidelines()
        };
    }
}

function generateAssessmentRubric(assessmentType: string, difficulty: string): any {
    const rubric: any = {
        criteria: [],
        scoring: {
            excellent: { range: '90-100%', description: 'Outstanding performance' },
            good: { range: '80-89%', description: 'Above average performance' },
            satisfactory: { range: '70-79%', description: 'Meets expectations' },
            needsImprovement: { range: '60-69%', description: 'Below expectations' },
            unsatisfactory: { range: '0-59%', description: 'Does not meet expectations' }
        }
    };

    if (assessmentType === 'project') {
        rubric.criteria = [
            { name: 'Understanding', weight: 25, description: 'Demonstrates clear understanding of concepts' },
            { name: 'Application', weight: 30, description: 'Effectively applies knowledge to solve problems' },
            { name: 'Creativity', weight: 20, description: 'Shows innovative thinking and originality' },
            { name: 'Presentation', weight: 15, description: 'Clear and professional presentation of work' },
            { name: 'Technical Quality', weight: 10, description: 'Meets technical requirements and standards' }
        ];
    } else if (assessmentType === 'presentation') {
        rubric.criteria = [
            { name: 'Content', weight: 30, description: 'Relevant and accurate information' },
            { name: 'Organization', weight: 20, description: 'Logical structure and flow' },
            { name: 'Delivery', weight: 25, description: 'Clear communication and engagement' },
            { name: 'Visual Aids', weight: 15, description: 'Effective use of supporting materials' },
            { name: 'Time Management', weight: 10, description: 'Appropriate pacing and timing' }
        ];
    } else {
        rubric.criteria = [
            { name: 'Content Quality', weight: 40, description: 'Depth and breadth of work' },
            { name: 'Technical Skills', weight: 30, description: 'Demonstrated technical proficiency' },
            { name: 'Presentation', weight: 20, description: 'Professional appearance and organization' },
            { name: 'Reflection', weight: 10, description: 'Self-assessment and learning insights' }
        ];
    }

    return rubric;
}

function generateQuestions(subject: string, difficulty: string, questionCount: number): any[] {
    const questions = [];
    for (let i = 1; i <= questionCount; i++) {
        questions.push({
            id: i,
            question: `Question ${i}: What is a key concept related to ${subject}?`,
            options: [
                'Option A: Basic concept',
                'Option B: Intermediate concept',
                'Option C: Advanced concept',
                'Option D: None of the above'
            ],
            correctAnswer: difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2,
            explanation: `This question tests your understanding of fundamental ${subject} concepts.`,
            points: 1
        });
    }
    return questions;
}

function generateProjectDescription(subject: string, difficulty: string): string {
    const descriptions = {
        easy: `Create a simple project that demonstrates basic understanding of ${subject}. This should be a beginner-friendly project that covers fundamental concepts.`,
        medium: `Develop a comprehensive project that showcases intermediate-level skills in ${subject}. Include multiple components and demonstrate practical application.`,
        hard: `Design and implement an advanced project that pushes the boundaries of ${subject}. This should be a portfolio-worthy piece that demonstrates expertise.`
    };
    return descriptions[difficulty as keyof typeof descriptions] || descriptions.medium;
}

function generateProjectDeliverables(subject: string): string[] {
    return [
        'Project proposal and plan',
        'Working implementation or prototype',
        'Documentation and user guide',
        'Presentation or demonstration',
        'Reflection and lessons learned'
    ];
}

function generateProjectCriteria(difficulty: string): string[] {
    const baseCriteria = ['Meets requirements', 'Code quality', 'Documentation'];
    if (difficulty === 'medium') baseCriteria.push('User experience', 'Performance');
    if (difficulty === 'hard') baseCriteria.push('Innovation', 'Scalability', 'Testing coverage');
    return baseCriteria;
}

function generatePresentationTopic(subject: string): string {
    return `Present your findings and insights on a key aspect of ${subject}. Choose a topic that interests you and prepare a compelling presentation.`;
}

function generatePresentationRequirements(difficulty: string): string[] {
    const requirements = ['Clear structure', 'Engaging content', 'Professional delivery'];
    if (difficulty === 'medium') requirements.push('Visual aids', 'Audience interaction');
    if (difficulty === 'hard') requirements.push('Research depth', 'Critical analysis', 'Q&A handling');
    return requirements;
}

function generatePresentationCriteria(): string[] {
    return ['Content relevance', 'Organization', 'Delivery', 'Visual aids', 'Time management'];
}

function generatePortfolioRequirements(subject: string, difficulty: string): string[] {
    const requirements = [
        'Sample of your best work in ' + subject,
        'Project descriptions and outcomes',
        'Skills and competencies demonstrated'
    ];

    if (difficulty === 'medium') requirements.push('Process documentation', 'Learning reflections');
    if (difficulty === 'hard') requirements.push('Innovation examples', 'Leadership experiences', 'Mentoring contributions');

    return requirements;
}

function generateSubmissionGuidelines(): string[] {
    return [
        'Professional formatting and presentation',
        'Clear organization and structure',
        'Evidence of learning and growth',
        'Reflection on achievements and goals'
    ];
}

function calculateTimeLimit(assessmentType: string, questionCount: number): string {
    if (assessmentType === 'quiz') {
        return `${Math.max(15, questionCount * 2)} minutes`;
    } else if (assessmentType === 'test') {
        return `${Math.max(30, questionCount * 3)} minutes`;
    } else {
        return 'Varies by project scope';
    }
}

function calculateTotalPoints(assessmentType: string, questionCount: number): number {
    if (assessmentType === 'quiz' || assessmentType === 'test') {
        return questionCount;
    } else {
        return 100;
    }
}

function generateMarketingContent(contentType: string, courseTitle: string, targetAudience: string, tone: string, keyBenefits: string[], callToAction: string): any {
    const baseContent = {
        courseTitle,
        targetAudience: targetAudience || 'Learners interested in this subject',
        tone,
        keyBenefits: keyBenefits.length > 0 ? keyBenefits : generateDefaultBenefits(courseTitle),
        callToAction: callToAction || 'Enroll now and start your learning journey!'
    };

    switch (contentType) {
        case 'course-description':
            return {
                ...baseContent,
                description: generateCourseDescription(courseTitle, targetAudience),
                highlights: generateCourseHighlights(courseTitle),
                testimonials: generateSampleTestimonials()
            };
        case 'email-sequence':
            return {
                ...baseContent,
                emails: generateEmailSequence(courseTitle, targetAudience)
            };
        case 'social-media':
            return {
                ...baseContent,
                posts: generateSocialMediaPosts(courseTitle, targetAudience)
            };
        case 'landing-page':
            return {
                ...baseContent,
                headline: generateLandingPageHeadline(courseTitle),
                sections: generateLandingPageSections(courseTitle)
            };
        case 'video-script':
            return {
                ...baseContent,
                script: generateVideoScript(courseTitle, targetAudience)
            };
        default:
            return baseContent;
    }
}

function generateDefaultBenefits(courseTitle: string): string[] {
    return [
        `Master essential ${courseTitle} concepts and skills`,
        'Learn from industry experts and practitioners',
        'Get hands-on experience with real-world projects',
        'Earn a certificate upon completion',
        'Join a community of learners and professionals'
    ];
}

function generateCourseDescription(courseTitle: string, targetAudience: string): string {
    return `Transform your career with our comprehensive ${courseTitle} course. Designed for ${targetAudience}, this course provides you with the knowledge, skills, and practical experience needed to excel in your field. Whether you're a beginner or looking to advance your expertise, our structured learning approach will guide you every step of the way.`;
}

function generateCourseHighlights(courseTitle: string): string[] {
    return [
        'Comprehensive curriculum covering all essential topics',
        'Interactive learning with hands-on projects',
        'Expert instruction and personalized feedback',
        'Flexible learning schedule to fit your lifestyle',
        'Lifetime access to course materials and updates'
    ];
}

function generateSampleTestimonials(): any[] {
    return [
        {
            name: 'Sarah M.',
            role: 'Marketing Professional',
            quote: 'This course completely transformed my approach to digital marketing. The practical exercises were invaluable.',
            rating: 5
        },
        {
            name: 'Michael R.',
            role: 'Software Developer',
            quote: 'Excellent content and clear explanations. I learned more in this course than in months of self-study.',
            rating: 5
        }
    ];
}

function generateEmailSequence(courseTitle: string, targetAudience: string): any[] {
    return [
        {
            subject: `Transform Your Career with ${courseTitle}`,
            preview: 'Discover how this course can change your professional trajectory',
            content: `Hi there! Are you ready to take your ${courseTitle} skills to the next level? Our comprehensive course is designed specifically for ${targetAudience} like you.`
        },
        {
            subject: 'What You\'ll Learn in This Course',
            preview: 'A detailed look at the skills and knowledge you\'ll gain',
            content: 'In our previous email, we introduced you to our course. Now, let\'s dive deeper into what you\'ll actually learn and how it will benefit your career.'
        },
        {
            subject: 'Success Stories from Our Students',
            preview: 'Real results from real people who took this course',
            content: 'Don\'t just take our word for it. Here are some inspiring success stories from students who completed our course and transformed their careers.'
        }
    ];
}

function generateSocialMediaPosts(courseTitle: string, targetAudience: string): any[] {
    return [
        {
            platform: 'LinkedIn',
            content: `🚀 Ready to advance your career? Our ${courseTitle} course is designed for ${targetAudience} who want to excel. Learn more at [link] #ProfessionalDevelopment #CareerGrowth`
        },
        {
            platform: 'Twitter',
            content: `📚 New course alert! Master ${courseTitle} with our comprehensive program. Perfect for ${targetAudience}. Start your journey today! #Learning #Skills`
        },
        {
            platform: 'Facebook',
            content: `🎯 Transform your future with our ${courseTitle} course! Designed for ${targetAudience}, this program will give you the skills you need to succeed.`
        }
    ];
}

function generateLandingPageHeadline(courseTitle: string): string {
    return `Master ${courseTitle} and Transform Your Career in Just Weeks`;
}

function generateLandingPageSections(courseTitle: string): any[] {
    return [
        {
            title: 'Why Choose This Course?',
            content: 'Comprehensive curriculum, expert instruction, and practical projects that prepare you for real-world success.'
        },
        {
            title: 'What You\'ll Learn',
            content: 'From fundamentals to advanced techniques, you\'ll gain the complete skill set needed to excel in your field.'
        },
        {
            title: 'Course Features',
            content: 'Interactive lessons, hands-on projects, expert feedback, and lifetime access to all materials.'
        }
    ];
}

function generateVideoScript(courseTitle: string, targetAudience: string): string {
    return `[Opening] Are you ready to master ${courseTitle} and take your career to new heights? 

[Problem] Many ${targetAudience} struggle with [specific challenges] and feel stuck in their professional development.

[Solution] Our comprehensive ${courseTitle} course provides the solution you've been looking for.

[Benefits] You'll learn [key benefits], gain practical experience, and earn a valuable certification.

[Social Proof] Join thousands of successful students who have transformed their careers with our proven approach.

[Call to Action] Don't wait to invest in your future. Enroll in our ${courseTitle} course today and start your transformation!`;
}

function generatePricingStrategy(courseType: string, marketSegment: string, competition: string, valueProposition: string, includeBonuses: boolean, paymentOptions: string[]): any {
    const basePricing = {
        courseType,
        marketSegment,
        valueProposition: valueProposition || 'Comprehensive learning experience with expert instruction',
        includeBonuses,
        paymentOptions
    };

    const pricingTiers = generatePricingTiers(courseType, marketSegment);
    const competitiveAnalysis = competition ? generateCompetitiveAnalysis(competition) : undefined;
    const revenueProjections = generateRevenueProjections(courseType, marketSegment);

    return {
        ...basePricing,
        pricingTiers,
        competitiveAnalysis,
        revenueProjections,
        pricingStrategy: generatePricingStrategyRecommendations(courseType, marketSegment)
    };
}

function generatePricingTiers(courseType: string, marketSegment: string): any[] {
    const tiers = [];

    if (courseType === 'self-paced') {
        tiers.push(
            {
                name: 'Basic',
                price: marketSegment === 'budget' ? 49 : marketSegment === 'premium' ? 199 : 99,
                features: ['Course access', 'Basic materials', 'Email support']
            },
            {
                name: 'Standard',
                price: marketSegment === 'budget' ? 99 : marketSegment === 'premium' ? 399 : 199,
                features: ['Course access', 'All materials', 'Priority support', 'Certificate']
            },
            {
                name: 'Premium',
                price: marketSegment === 'budget' ? 199 : marketSegment === 'premium' ? 799 : 399,
                features: ['Course access', 'All materials', 'Priority support', 'Certificate', '1-on-1 consultation']
            }
        );
    } else if (courseType === 'live-cohort') {
        tiers.push(
            {
                name: 'Early Bird',
                price: marketSegment === 'budget' ? 199 : marketSegment === 'premium' ? 799 : 399,
                features: ['Live sessions', 'Group interaction', 'Materials', 'Certificate']
            },
            {
                name: 'Regular',
                price: marketSegment === 'budget' ? 299 : marketSegment === 'premium' ? 999 : 599,
                features: ['Live sessions', 'Group interaction', 'Materials', 'Certificate', 'Office hours']
            }
        );
    } else {
        tiers.push({
            name: 'Complete Package',
            price: marketSegment === 'budget' ? 149 : marketSegment === 'premium' ? 599 : 299,
            features: ['Full course access', 'Live sessions', 'Materials', 'Certificate', 'Support']
        });
    }

    return tiers;
}

function generateCompetitiveAnalysis(competition: string): any {
    return {
        marketPosition: 'Competitive pricing with superior value',
        differentiation: 'Focus on practical skills and real-world application',
        recommendations: [
            'Emphasize unique features and benefits',
            'Offer flexible payment options',
            'Provide exceptional customer support',
            'Create a strong community aspect'
        ]
    };
}

function generateRevenueProjections(courseType: string, marketSegment: string): any {
    const basePrice = marketSegment === 'budget' ? 100 : marketSegment === 'premium' ? 500 : 250;
    const estimatedStudents = courseType === 'live-cohort' ? 20 : 100;

    return {
        estimatedRevenue: basePrice * estimatedStudents,
        breakEvenPoint: '3-6 months',
        profitMargin: '60-80%',
        growthPotential: 'High - scalable model with minimal additional costs'
    };
}

function generatePricingStrategyRecommendations(courseType: string, marketSegment: string): string[] {
    const recommendations = [
        'Start with competitive pricing to build initial customer base',
        'Offer early bird discounts for live courses',
        'Create multiple pricing tiers to capture different market segments',
        'Include value-added bonuses to justify premium pricing'
    ];

    if (courseType === 'live-cohort') {
        recommendations.push('Consider payment plans for higher-priced courses');
    }

    if (marketSegment === 'premium') {
        recommendations.push('Focus on quality and exclusivity over price competition');
    }

    return recommendations;
}

// Enhanced LEWIS data access actions
const enhancedLewisActions = {
    getAllJurisdictionsWithFees: async () => {
        try {
            console.log('🔧 LEWIS TOOL: getAllJurisdictionsWithFees called');
            
            const result = await lewisDataService.getAllJurisdictionsWithFees();
            
            if (result.success && result.data) {
                const jurisdictions = result.data;
                const responseMessage = `I have comprehensive fee data for ${jurisdictions.length} jurisdictions across the US. Here's what's available:

**JURISDICTIONS COVERED:**
${jurisdictions.slice(0, 10).map(j => `- ${j.name} (${j.type}, ${j.state_fips}) - ${j.fees?.length || 0} fees`).join('\n')}
${jurisdictions.length > 10 ? `... and ${jurisdictions.length - 10} more jurisdictions` : ''}

**FEE CATEGORIES AVAILABLE:**
- per_sqft: Square footage based fees
- per_unit: Per dwelling unit fees  
- flat: Fixed amount fees
- formula: Complex calculation-based fees

**GEOGRAPHIC COVERAGE:**
- Major metropolitan areas across all US states
- Both city and county level jurisdictions
- Population data for market analysis

I can provide detailed fee breakdowns, comparisons, rankings, and analysis for any of these jurisdictions. What specific information would you like to explore?`;

                return responseMessage;
            } else {
                return `I'm sorry, I couldn't retrieve the jurisdiction data at the moment. Please try again or let me know if you need help with something else.`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: getAllJurisdictionsWithFees error:', error);
            return `I'm sorry, I encountered an error while retrieving jurisdiction data: ${error instanceof Error ? error.message : 'Failed to get jurisdictions'}. Please try again or let me know if you need help with something else.`;
        }
    },

    searchJurisdictions: async (params: { searchTerm: string }) => {
        try {
            console.log('🔧 LEWIS TOOL: searchJurisdictions called with:', params);
            
            const result = await lewisDataService.searchJurisdictions(params.searchTerm);
            
            if (result.success && result.data && result.data.length > 0) {
                const jurisdictions = result.data;
                const responseMessage = `I found ${jurisdictions.length} jurisdictions matching "${params.searchTerm}":

${jurisdictions.map(j => `**${j.name}** (${j.type}, ${j.state_fips})
- Population: ${j.population?.toLocaleString() || 'N/A'}
- Total Fees: ${j.fees?.length || 0}
- Fee Categories: ${[...new Set(j.fees?.map(f => f.category) || [])].join(', ')}
- Agencies: ${[...new Set(j.fees?.map(f => f.agencies?.name).filter(Boolean) || [])].join(', ')}`).join('\n\n')}

I can provide detailed fee breakdowns, calculations, or comparisons for any of these jurisdictions. What would you like to explore further?`;

                return responseMessage;
            } else {
                return `I couldn't find any jurisdictions matching "${params.searchTerm}". Try searching for a city name, state, or region. I have data for 75+ major US jurisdictions.`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: searchJurisdictions error:', error);
            return `I'm sorry, I encountered an error while searching jurisdictions: ${error instanceof Error ? error.message : 'Search failed'}. Please try again or let me know if you need help with something else.`;
        }
    },

    getFeeStatistics: async () => {
        try {
            console.log('🔧 LEWIS TOOL: getFeeStatistics called');
            
            const result = await lewisDataService.getFeeStatistics();
            
            if (result.success && result.data) {
                const stats = result.data;
                const responseMessage = `Here's a comprehensive overview of the fee database:

**DATABASE STATISTICS:**
- **Total Jurisdictions**: ${stats.totalJurisdictions}
- **Total Fees**: ${stats.totalFees.toLocaleString()}
- **Total Agencies**: ${stats.totalAgencies}
- **States Covered**: ${stats.statesCovered}
- **Last Updated**: ${new Date(stats.lastUpdated).toLocaleString()}

**FEE CATEGORIES AVAILABLE:**
${stats.feeCategories.map(cat => `- ${cat}`).join('\n')}

**COVERAGE INSIGHTS:**
- This represents the most comprehensive construction fee database available
- Covers major metropolitan areas across all US states
- Includes both city and county level jurisdictions
- Data includes exact rates, calculation methods, and agency information

I can provide detailed analysis, comparisons, rankings, or specific fee information for any jurisdiction or project type. What would you like to explore?`;

                return responseMessage;
            } else {
                return `I'm sorry, I couldn't retrieve the fee statistics at the moment. Please try again or let me know if you need help with something else.`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: getFeeStatistics error:', error);
            return `I'm sorry, I encountered an error while retrieving fee statistics: ${error instanceof Error ? error.message : 'Failed to get statistics'}. Please try again or let me know if you need help with something else.`;
        }
    },

    getFeesByCategory: async (params: { category: string }) => {
        try {
            console.log('🔧 LEWIS TOOL: getFeesByCategory called with:', params);
            
            const result = await lewisDataService.getFeesByCategory(params.category);
            
            if (result.success && result.data && result.data.length > 0) {
                const fees = result.data;
                const responseMessage = `I found ${fees.length} ${params.category} fees across all jurisdictions:

${fees.slice(0, 10).map(f => `**${f.name}** - ${f.jurisdictions?.name || 'Unknown Jurisdiction'}
- Rate: $${f.rate?.toLocaleString() || 'Variable'} ${f.unit_label || ''}
- Agency: ${f.agencies?.name || 'Unknown'}
- Applies to: ${f.applies_to || 'All project types'}
- Description: ${f.description || 'No description available'}`).join('\n\n')}

${fees.length > 10 ? `... and ${fees.length - 10} more ${params.category} fees` : ''}

**ANALYSIS:**
- **Highest Rate**: $${Math.max(...fees.map(f => f.rate || 0)).toLocaleString()}
- **Lowest Rate**: $${Math.min(...fees.map(f => f.rate || 0)).toLocaleString()}
- **Average Rate**: $${(fees.reduce((sum, f) => sum + (f.rate || 0), 0) / fees.length).toFixed(2)}
- **Jurisdictions with this fee type**: ${[...new Set(fees.map(f => f.jurisdictions?.name))].length}

I can provide more detailed analysis, comparisons, or help you find the best jurisdictions for this fee type. What would you like to explore further?`;

                return responseMessage;
            } else {
                return `I couldn't find any ${params.category} fees in the database. Available categories include: per_sqft, per_unit, flat, formula. What category would you like to explore?`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: getFeesByCategory error:', error);
            return `I'm sorry, I encountered an error while retrieving ${params.category} fees: ${error instanceof Error ? error.message : 'Failed to get fees'}. Please try again or let me know if you need help with something else.`;
        }
    },

    compareJurisdictions: async (params: { jurisdiction1: string; jurisdiction2: string }) => {
        try {
            console.log('🔧 LEWIS TOOL: compareJurisdictions called with:', params);
            
            const result = await lewisDataService.compareJurisdictions(params.jurisdiction1, params.jurisdiction2);
            
            if (result.success && result.data) {
                const { jurisdiction1, jurisdiction2, comparison } = result.data;
                const responseMessage = `Here's a detailed comparison between ${jurisdiction1.name} and ${jurisdiction2.name}:

**${jurisdiction1.name.toUpperCase()}**
- Type: ${jurisdiction1.type} (${jurisdiction1.kind})
- Population: ${jurisdiction1.population?.toLocaleString() || 'N/A'}
- Total Fees: ${comparison.totalFees1}
- Average Rate: $${comparison.averageRate1.toFixed(2)}

**${jurisdiction2.name.toUpperCase()}**
- Type: ${jurisdiction2.type} (${jurisdiction2.kind})
- Population: ${jurisdiction2.population?.toLocaleString() || 'N/A'}
- Total Fees: ${comparison.totalFees2}
- Average Rate: $${comparison.averageRate2.toFixed(2)}

**COMPARISON ANALYSIS:**
- **Fee Count Difference**: ${Math.abs(comparison.totalFees1 - comparison.totalFees2)} more fees in ${comparison.totalFees1 > comparison.totalFees2 ? jurisdiction1.name : jurisdiction2.name}
- **Rate Difference**: ${jurisdiction1.name} has ${comparison.averageRate1 > comparison.averageRate2 ? 'higher' : 'lower'} average rates by $${Math.abs(comparison.averageRate1 - comparison.averageRate2).toFixed(2)}
- **Fee Efficiency**: ${comparison.averageRate1 < comparison.averageRate2 ? jurisdiction1.name : jurisdiction2.name} offers better fee efficiency

**KEY INSIGHTS:**
${comparison.totalFees1 > comparison.totalFees2 ? 
    `${jurisdiction1.name} has more comprehensive fee structure with ${comparison.totalFees1 - comparison.totalFees2} additional fees` :
    `${jurisdiction2.name} has more comprehensive fee structure with ${comparison.totalFees2 - comparison.totalFees1} additional fees`}

I can provide detailed fee breakdowns for either jurisdiction or help you calculate specific project costs. What would you like to explore further?`;

                return responseMessage;
            } else {
                return `I'm sorry, I couldn't compare those jurisdictions. Please check the jurisdiction names and try again. I can help you find the correct jurisdiction names if needed.`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: compareJurisdictions error:', error);
            return `I'm sorry, I encountered an error while comparing jurisdictions: ${error instanceof Error ? error.message : 'Comparison failed'}. Please try again or let me know if you need help with something else.`;
        }
    },

    getFeeTrends: async () => {
        try {
            console.log('🔧 LEWIS TOOL: getFeeTrends called');
            
            const result = await lewisDataService.getFeeTrends();
            
            if (result.success && result.data) {
                const trends = result.data;
                const responseMessage = `Here's a comprehensive analysis of fee trends and patterns across all jurisdictions:

**FEE DISTRIBUTION BY CATEGORY:**
${Object.entries(trends.categoryDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([category, count]) => `- **${category}**: ${count} fees (${((count / trends.totalFees) * 100).toFixed(1)}%)`)
    .join('\n')}

**TOP JURISDICTIONS BY FEE COUNT:**
${Object.entries(trends.jurisdictionDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([jurisdiction, count]) => `- **${jurisdiction}**: ${count} fees`)
    .join('\n')}

**RATE STATISTICS:**
- **Lowest Rate**: $${trends.rateStatistics.min.toFixed(2)}
- **Highest Rate**: $${trends.rateStatistics.max.toFixed(2)}
- **Average Rate**: $${trends.rateStatistics.average.toFixed(2)}
- **Median Rate**: $${trends.rateStatistics.median.toFixed(2)}

**KEY INSIGHTS:**
- **Most Common Fee Type**: ${Object.entries(trends.categoryDistribution).sort(([,a], [,b]) => b - a)[0]?.[0]} (${Object.entries(trends.categoryDistribution).sort(([,a], [,b]) => b - a)[0]?.[1]} fees)
- **Most Comprehensive Jurisdiction**: ${Object.entries(trends.jurisdictionDistribution).sort(([,a], [,b]) => b - a)[0]?.[0]} (${Object.entries(trends.jurisdictionDistribution).sort(([,a], [,b]) => b - a)[0]?.[1]} fees)
- **Rate Range**: ${trends.rateStatistics.max / trends.rateStatistics.min}x difference between highest and lowest rates
- **Total Fees Analyzed**: ${trends.totalFees.toLocaleString()}

This data shows significant regional variation in fee structures and rates. I can provide more detailed analysis for specific categories, jurisdictions, or project types. What would you like to explore further?`;

                return responseMessage;
            } else {
                return `I'm sorry, I couldn't retrieve the fee trends at the moment. Please try again or let me know if you need help with something else.`;
            }
        } catch (error) {
            console.error('💥 LEWIS TOOL: getFeeTrends error:', error);
            return `I'm sorry, I encountered an error while retrieving fee trends: ${error instanceof Error ? error.message : 'Failed to get trends'}. Please try again or let me know if you need help with something else.`;
        }
    }
};

// Export the actions object
export const customApiActions = createCustomApiToolActions();
