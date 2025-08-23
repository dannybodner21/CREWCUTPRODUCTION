import { BuiltinToolAction } from '@/store/tool/slices/builtin/action';
import { createSupabaseClient, executeSupabaseQuery } from './supabase';
import { supabaseOperations } from './supabase-operations';

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

// Custom API Tool Action interface
export interface CustomApiToolAction {
    callExternalAPI: (params: CallExternalAPIParams) => Promise<any>;
    queryDatabase: (params: QueryDatabaseParams) => Promise<any>;
    performDatabaseOperation: (params: DatabaseOperationParams) => Promise<any>;
    // Construction Fee Portal actions
    getCities: (params: GetCitiesParams) => Promise<any>;
    getFees: (params: GetFeesParams) => Promise<any>;
    calculateFees: (params: CalculateFeesParams) => Promise<any>;
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

            return {
                success: true,
                data: filteredCities,
                total: filteredCities.length,
                filters: params,
                message: `Found ${filteredCities.length} cities matching your criteria.`,
                summary: `Cities available: ${filteredCities.map(c => c.name).join(', ')}`,
                insights: {
                    largestCity: filteredCities.reduce((max, city) => city.population > max.population ? city : max, filteredCities[0]),
                    countyBreakdown: filteredCities.reduce((acc, city) => {
                        acc[city.county] = (acc[city.county] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>),
                    totalPopulation: filteredCities.reduce((sum, city) => sum + city.population, 0)
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get cities',
                filters: params
            };
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

    calculateFees: async (params: CalculateFeesParams) => {
        try {
            // Get applicable fees for the city
            const feesResult = await createCustomApiToolActions().getFees({ cityId: params.cityId });

            if (!feesResult.success) {
                throw new Error('Failed to get fees for calculation');
            }

            const fees = feesResult.data;
            const results = fees.map((fee: any) => {
                let calculatedAmount = 0;

                if (fee.calculationMethod.includes('per $1000')) {
                    calculatedAmount = (params.projectValue / 1000) * fee.amount;
                } else if (fee.calculationMethod.includes('per square foot')) {
                    calculatedAmount = params.squareFootage * fee.amount;
                } else if (fee.calculationMethod.includes('flat rate')) {
                    calculatedAmount = fee.amount;
                }

                return {
                    ...fee,
                    calculatedAmount: Math.round(calculatedAmount * 100) / 100,
                    projectDetails: {
                        type: params.projectType,
                        value: params.projectValue,
                        squareFootage: params.squareFootage
                    }
                };
            });

            const totalFees = results.reduce((sum: number, fee: any) => sum + fee.calculatedAmount, 0);

            return {
                success: true,
                data: results,
                summary: {
                    totalFees: Math.round(totalFees * 100) / 100,
                    feeCount: results.length,
                    projectType: params.projectType,
                    projectValue: params.projectValue,
                    squareFootage: params.squareFootage
                },
                message: `Fee calculation completed successfully. Total fees: $${Math.round(totalFees * 100) / 100}`,
                breakdown: `Project: ${params.projectType} construction, Value: $${params.projectValue.toLocaleString()}, Area: ${params.squareFootage} sq ft`,
                insights: {
                    feeBreakdown: results.map(fee => ({
                        category: fee.category,
                        amount: fee.calculatedAmount,
                        percentage: Math.round((fee.calculatedAmount / totalFees) * 100)
                    })),
                    costPerSqFt: Math.round((totalFees / params.squareFootage) * 100) / 100,
                    costPercentage: Math.round((totalFees / params.projectValue) * 10000) / 100
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to calculate fees',
                params
            };
        }
    },
});
