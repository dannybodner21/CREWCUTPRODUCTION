import { createSupabaseClient, executeSupabaseQuery } from './supabase';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables when this module is imported
config({ path: resolve(process.cwd(), '.env.local') });

export interface LewisCity {
    id: number;
    name: string;
    county: string;
    state: string;
    population?: number;
    last_updated?: string;
    data_source_url?: string;
    created_at?: string;
}

export interface LewisFeeCategory {
    id: number;
    category_key: string;
    category_display_name: string;
    category_group: string;
    created_at?: string;
}

export interface LewisVerifiedFeeData {
    id: number;
    city_id: number;
    location_name: string;
    fee_category: string;
    fee_description?: string;
    verified_amounts?: string;
    calculation_methods?: string;
    source_text?: string;
    data_quality_score?: number;
    has_real_amounts?: boolean;
    has_calculations?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface LewisDetailedFeeBreakdown {
    id: number;
    verified_fee_id: number;
    fee_amount: number;
    fee_unit: string;
    development_type: string;
    project_size_tier?: string;
    meter_size?: string;
    special_conditions?: string;
    effective_date?: string;
    verification_status: string;
    created_at?: string;
}

export class LewisDataService {
    // Remove the private supabase property that was initialized at class instantiation
    // Instead, we'll create it when needed (lazy loading)

    /**
     * Get the Supabase client when needed (lazy loading)
     */
    private getSupabaseClient() {
        return createSupabaseClient();
    }

    // Get all cities
    async getCities(): Promise<{ success: boolean; data?: LewisCity[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .order('name');

            return { data, error };
        });
    }

    // Get cities by state
    async getCitiesByState(state: string): Promise<{ success: boolean; data?: LewisCity[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .eq('state', state)
                .order('name');

            return { data, error };
        });
    }

    // Get all fee categories
    async getFeeCategories(): Promise<{ success: boolean; data?: LewisFeeCategory[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('webhound_fee_categories')
                .select('*')
                .order('category_display_name');

            return { data, error };
        });
    }

    // Get all fees
    async getFees(): Promise<{ success: boolean; data?: LewisVerifiedFeeData[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('webhound_verified_fees')
                .select('*')
                .order('fee_category');

            return { data, error };
        });
    }

    // Get fees by city
    async getFeesByCity(cityId: number): Promise<{ success: boolean; data?: LewisVerifiedFeeData[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            // Since there's no foreign key relationship, we'll get the fees directly
            const { data, error } = await supabase
                .from('verified_fee_data')
                .select('*')
                .eq('city_id', cityId);

            return { data, error };
        });
    }

    // Get detailed fee breakdown
    async getDetailedFeeBreakdown(feeId: number): Promise<{ success: boolean; data?: LewisDetailedFeeBreakdown[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('detailed_fee_breakdown')
                .select('*')
                .eq('verified_fee_id', feeId);

            return { data, error };
        });
    }

    // Calculate project fees
    async calculateProjectFees(
        cityId: number,
        projectType: string,
        projectSize: number
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('verified_fee_data')
                .select(`
                    *,
                    webhound_fee_categories (
                        category_key,
                        category_display_name,
                        category_group
                    )
                `)
                .eq('city_id', cityId)
                .ilike('fee_category', `%${projectType}%`);

            return { data, error };
        });
    }

    // Search cities by name
    async searchCities(searchTerm: string): Promise<{ success: boolean; data?: LewisCity[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .ilike('name', `%${searchTerm}%`)
                .order('name')
                .limit(50);

            return { data, error };
        });
    }

    // Get unique states
    async getUniqueStates(): Promise<{ success: boolean; data?: string[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            // Get all cities with pagination to handle Supabase's 1000 row limit
            let allStates: string[] = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('cities')
                    .select('state')
                    .order('state')
                    .range(from, from + pageSize - 1);

                if (error) return { data: null, error };

                if (data && data.length > 0) {
                    allStates.push(...data.map(city => city.state).filter(Boolean));
                    from += pageSize;
                    hasMore = data.length === pageSize; // If we got less than pageSize, we've reached the end
                } else {
                    hasMore = false;
                }
            }

            // Extract unique states
            const uniqueStates = [...new Set(allStates)];
            return { data: uniqueStates, error: null };
        });
    }

    // Get states count
    async getStatesCount(): Promise<{ success: boolean; data?: number; error?: string }> {
        try {
            const statesResult = await this.getUniqueStates();

            if (!statesResult.success) {
                return { success: false, error: statesResult.error || 'Unknown error' };
            }

            const count = statesResult.data?.length || 0;
            return { success: true, data: count, error: undefined };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get states count'
            };
        }
    }

    // Get counties by state
    async getCountiesByState(state: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            const { data, error } = await supabase
                .from('cities')
                .select('county')
                .eq('state', state)
                .order('county');

            if (error) return { data: null, error };

            // Extract unique counties
            const uniqueCounties = [...new Set(data?.map(city => city.county).filter(Boolean))];
            return { data: uniqueCounties, error: null };
        });
    }

    // Get jurisdictions by state FIPS code
    async getJurisdictions(stateFips?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();
            let query = supabase
                .from('jurisdictions')
                .select('id, name, type, kind, state_fips, population')
                .eq('is_active', true)
                .order('name');

            if (stateFips) {
                query = query.eq('state_fips', stateFips);
            }

            const { data, error } = await query;
            return { data, error };
        });
    }

    // Get jurisdictions that have fees (for portal dropdown)
    async getJurisdictionsWithFees(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            // First, get all unique jurisdiction IDs that have active fees with pagination
            let allFees: any[] = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data: fees, error: feesError } = await supabase
                    .from('fees')
                    .select('jurisdiction_id')
                    .eq('active', true)
                    .range(from, from + pageSize - 1);

                if (feesError) {
                    return { data: null, error: feesError.message };
                }

                if (fees && fees.length > 0) {
                    allFees.push(...fees);
                    from += pageSize;
                    hasMore = fees.length === pageSize; // If we got less than pageSize, we've reached the end
                } else {
                    hasMore = false;
                }
            }

            if (allFees.length === 0) {
                return { data: [], error: null };
            }

            // Get unique jurisdiction IDs
            const uniqueJurisdictionIds = [...new Set(allFees.map(f => f.jurisdiction_id))];

            // Now get the jurisdiction details for those IDs
            // Filter to only include local jurisdictions (counties and municipalities) for construction fee analysis
            const { data, error } = await supabase
                .from('jurisdictions')
                .select(`
                    id, 
                    name, 
                    type, 
                    kind, 
                    state_fips, 
                    population
                `)
                .eq('is_active', true)
                .in('id', uniqueJurisdictionIds)
                .in('type', ['county', 'municipality'])
                .order('name');

            return { data, error };
        });
    }

    // Get fees for a specific jurisdiction with fee_versions data
    async getJurisdictionFees(jurisdictionId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            // First try to get fees with fee_versions data
            const { data: feesWithVersions, error: versionsError } = await supabase
                .from('fees')
                .select(`
                    id, name, category, rate, unit_label, description, applies_to, use_subtype, formula,
                    fee_versions!inner(
                        calc_method, base_rate, min_fee, max_fee, unit_id, formula_json, 
                        status, effective_start, effective_end
                    )
                `)
                .eq('jurisdiction_id', jurisdictionId)
                .eq('active', true)
                .eq('fee_versions.status', 'verified')
                .lte('fee_versions.effective_start', new Date().toISOString())
                .or('fee_versions.effective_end.is.null,fee_versions.effective_end.gte.' + new Date().toISOString())
                .order('name');

            if (versionsError || !feesWithVersions || feesWithVersions.length === 0) {
                console.log('🔧 No fee_versions data found, falling back to legacy fees table');

                // Fallback to legacy fees table
                const { data: legacyFees, error: legacyError } = await supabase
                    .from('fees')
                    .select('id, name, category, rate, unit_label, description, applies_to, use_subtype, formula')
                    .eq('jurisdiction_id', jurisdictionId)
                    .eq('active', true)
                    .order('name');

                if (legacyError) {
                    return { data: null, error: legacyError };
                }

                // Transform legacy data to match new interface
                const transformedLegacyFees = legacyFees?.map(fee => ({
                    ...fee,
                    calc_method: 'flat', // Default to flat for legacy
                    base_rate: fee.rate ? parseFloat(fee.rate) : 0,
                    min_fee: null,
                    max_fee: null,
                    unit_id: 'FLAT',
                    formula_json: null,
                    status: 'legacy',
                    effective_start: new Date().toISOString(),
                    effective_end: null
                })) || [];

                return { data: transformedLegacyFees, error: null };
            }

            // Transform the joined data to flatten the fee_versions
            const transformedFees = feesWithVersions.map(fee => ({
                id: fee.id,
                name: fee.name,
                category: fee.category,
                rate: fee.rate,
                unit_label: fee.unit_label,
                description: fee.description,
                applies_to: fee.applies_to,
                use_subtype: fee.use_subtype,
                formula: fee.formula,
                calc_method: fee.fee_versions[0]?.calc_method || 'flat',
                base_rate: fee.fee_versions[0]?.base_rate || 0,
                min_fee: fee.fee_versions[0]?.min_fee,
                max_fee: fee.fee_versions[0]?.max_fee,
                unit_id: fee.fee_versions[0]?.unit_id || 'FLAT',
                formula_json: fee.fee_versions[0]?.formula_json,
                status: fee.fee_versions[0]?.status || 'verified',
                effective_start: fee.fee_versions[0]?.effective_start,
                effective_end: fee.fee_versions[0]?.effective_end
            }));

            return { data: transformedFees, error: null };
        });
    }

    // Get demo jurisdictions from ui_demo_fees table
    async getDemoJurisdictions(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            // First, let's see what columns actually exist by selecting all
            const { data, error } = await supabase
                .from('ui_demo_fees')
                .select('*')
                .limit(5);

            if (error) {
                console.log('Error querying ui_demo_fees:', error);
                return { data: null, error: error.message };
            }

            console.log('Sample ui_demo_fees data:', data);

            // For now, let's create some demo data since the table structure is unclear
            const demoJurisdictions = [
                {
                    id: 'demo-ny-1',
                    name: 'New York City',
                    state: 'New York',
                    type: 'demo',
                    kind: 'city'
                },
                {
                    id: 'demo-ca-1',
                    name: 'Los Angeles',
                    state: 'California',
                    type: 'demo',
                    kind: 'city'
                }
            ];

            return { data: demoJurisdictions, error: null };
        });
    }

    // Get demo fees for a specific jurisdiction
    async getDemoJurisdictionFees(jurisdictionId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            // For now, return sample demo fees based on jurisdiction
            let demoFees: any[] = [];

            if (jurisdictionId === 'demo-ny-1') {
                // New York City demo fees
                demoFees = [
                    {
                        id: 'ny-fee-1',
                        name: 'Building Permit Fee',
                        category: 'flat',
                        rate: 2500,
                        unit_label: '$',
                        description: 'Base building permit fee',
                        applies_to: 'All construction',
                        use_subtype: null,
                        formula: null
                    },
                    {
                        id: 'ny-fee-2',
                        name: 'Plan Review Fee',
                        category: 'per_sqft',
                        rate: 0.50,
                        unit_label: '$/sqft',
                        description: 'Plan review fee per square foot',
                        applies_to: 'All construction',
                        use_subtype: null,
                        formula: null
                    },
                    {
                        id: 'ny-fee-3',
                        name: 'Impact Fee',
                        category: 'per_unit',
                        rate: 15000,
                        unit_label: '$/unit',
                        description: 'Development impact fee',
                        applies_to: 'Multi-family residential',
                        use_subtype: null,
                        formula: null
                    }
                ];
            } else if (jurisdictionId === 'demo-ca-1') {
                // Los Angeles demo fees
                demoFees = [
                    {
                        id: 'ca-fee-1',
                        name: 'Building Permit Fee',
                        category: 'flat',
                        rate: 1800,
                        unit_label: '$',
                        description: 'Base building permit fee',
                        applies_to: 'All construction',
                        use_subtype: null,
                        formula: null
                    },
                    {
                        id: 'ca-fee-2',
                        name: 'Plan Review Fee',
                        category: 'per_sqft',
                        rate: 0.35,
                        unit_label: '$/sqft',
                        description: 'Plan review fee per square foot',
                        applies_to: 'All construction',
                        use_subtype: null,
                        formula: null
                    },
                    {
                        id: 'ca-fee-3',
                        name: 'Traffic Impact Fee',
                        category: 'per_unit',
                        rate: 12000,
                        unit_label: '$/unit',
                        description: 'Traffic impact mitigation fee',
                        applies_to: 'Multi-family residential',
                        use_subtype: null,
                        formula: null
                    },
                    {
                        id: 'ca-fee-4',
                        name: 'Parking Fee',
                        category: 'per_unit',
                        rate: 8000,
                        unit_label: '$/unit',
                        description: 'Parking space requirement fee',
                        applies_to: 'Multi-family residential',
                        use_subtype: null,
                        formula: null
                    }
                ];
            }

            return { data: demoFees, error: null };
        });
    }

    // Calculate project fees using the new FeeCalculator
    async calculateProjectFeesWithSQL(params: {
        city: string;
        use: string;
        useSubtype?: string;
        dwellings: number;
        resSqft: number;
        trips?: number;
        valuation?: number;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        return await executeSupabaseQuery(async () => {
            try {
                // Import the new fee calculator
                const { createFeeCalculator } = await import('@/lib/fee-calculator');
                const calculator = createFeeCalculator();

                // Map the old parameters to the new ProjectInputs format
                const projectInputs = {
                    jurisdictionName: params.city,
                    stateCode: this.getStateCodeFromCity(params.city),
                    serviceArea: 'Citywide',
                    projectType: this.mapUseToProjectType(params.use || 'Residential'),
                    useSubtype: params.useSubtype,
                    numUnits: params.dwellings,
                    squareFeet: params.resSqft,
                    projectValue: params.valuation
                };

                console.log('🔧 Calculating project fees with new FeeCalculator:', projectInputs);

                // Use the new fee calculator
                const breakdown = await calculator.calculateFees(projectInputs);

                console.log('✅ FeeCalculator result:', breakdown);

                // Return in the expected format for backward compatibility
                return {
                    data: {
                        jurisdiction: params.city,
                        items: breakdown.fees.map(fee => ({
                            fee: fee.feeName,
                            method: fee.calcType,
                            base_rate: fee.calculatedAmount / (params.dwellings || 1), // Approximate base rate
                            qty: params.dwellings || 1,
                            amount: fee.calculatedAmount
                        })),
                        per_sqft_total: breakdown.byCategory['per_sqft']?.toFixed(2) || '0.00',
                        per_unit_total: breakdown.byCategory['per_unit']?.toFixed(2) || '0.00',
                        flat_total: breakdown.byCategory['flat']?.toFixed(2) || '0.00',
                        grand_total: breakdown.totalFees.toFixed(2)
                    },
                    error: null
                };
            } catch (error) {
                console.error('❌ Error with new FeeCalculator:', error);
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
    }

    private getStateCodeFromCity(city: string): string {
        // Simple mapping - you might want to make this more comprehensive
        const cityStateMap: Record<string, string> = {
            'Phoenix city': 'AZ',
            'Los Angeles city': 'CA',
            'Chicago city': 'IL',
            'Houston city': 'TX',
            'Philadelphia city': 'PA'
        };
        return cityStateMap[city] || 'CA'; // Default to CA
    }

    private mapUseToProjectType(use: string): 'Residential' | 'Commercial' | 'Industrial' | 'Mixed-use' | 'Public' {
        const useMap: Record<string, 'Residential' | 'Commercial' | 'Industrial' | 'Mixed-use' | 'Public'> = {
            'residential': 'Residential',
            'commercial': 'Commercial',
            'industrial': 'Industrial',
            'mixed-use': 'Mixed-use',
            'public': 'Public'
        };
        return useMap[use.toLowerCase()] || 'Residential';
    }

    // Fallback client-side calculation when SQL function is not available
    private async calculateProjectFeesClientSide(params: {
        city: string;
        use: string;
        useSubtype?: string;
        dwellings: number;
        resSqft: number;
        trips?: number;
        valuation?: number;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const supabase = this.getSupabaseClient();

            // Get jurisdiction
            const { data: jurisdictionData } = await supabase
                .from('jurisdictions')
                .select('id, name')
                .ilike('name', params.city)
                .limit(1);

            if (!jurisdictionData?.[0]) {
                return { success: false, error: `Jurisdiction '${params.city}' not found` };
            }

            const jurisdiction = jurisdictionData[0];

            // Get fees for this jurisdiction with agency information
            const { data: feesData } = await supabase
                .from('fees')
                .select(`
                    id, name, category, rate, unit_label, description, applies_to, use_subtype, agency_id,
                    agencies(id, name)
                `)
                .eq('jurisdiction_id', jurisdiction.id)
                .eq('active', true);

            if (!feesData) {
                return { success: false, error: 'No fees found for this jurisdiction' };
            }

            // Get fee_versions for these fees
            const feeIds = feesData.map(f => f.id);
            const { data: feeVersionsData } = await supabase
                .from('fee_versions')
                .select('fee_id, calc_method, base_rate, min_fee, max_fee, unit_id, formula_json, status, effective_start, effective_end')
                .in('fee_id', feeIds)
                .eq('status', 'published')
                .lte('effective_start', new Date().toISOString())
                .or('effective_end.is.null,effective_end.gte.' + new Date().toISOString());

            // Create a map of fee_id to fee_version for quick lookup
            const feeVersionsMap = new Map();
            if (feeVersionsData) {
                feeVersionsData.forEach(fv => {
                    if (!feeVersionsMap.has(fv.fee_id) || new Date(fv.effective_start) > new Date(feeVersionsMap.get(fv.fee_id).effective_start)) {
                        feeVersionsMap.set(fv.fee_id, fv);
                    }
                });
            }

            // Merge fee data with fee_versions
            const mergedFeesData = feesData.map(fee => ({
                ...fee,
                fee_versions: feeVersionsMap.has(fee.id) ? [feeVersionsMap.get(fee.id)] : []
            }));

            if (!feesData) {
                return { success: false, error: 'No fees found for this jurisdiction' };
            }

            console.log('🔧 Client-side: Found', mergedFeesData.length, 'fees for jurisdiction');

            // Filter fees based on project type
            const relevantFees = mergedFeesData.filter(fee => {
                if (fee.applies_to && fee.applies_to !== params.use) return false;
                if (fee.use_subtype && fee.use_subtype !== params.useSubtype) return false;
                return true;
            });

            console.log('🔧 Client-side: Filtered to', relevantFees.length, 'relevant fees');

            // Calculate fees
            const lineItems: any[] = [];
            const agencyTotals: { [key: string]: number } = {};

            for (const fee of relevantFees) {
                let amount = 0;
                let qty = 1;

                // Use base_rate from fee_versions, fallback to rate from fees table, then 0
                const rate = fee.fee_versions?.[0]?.base_rate || fee.rate || 0;

                console.log('🔧 Client-side: Processing fee', fee.name, 'rate:', rate, 'category:', fee.category, 'base_rate:', fee.fee_versions?.[0]?.base_rate);

                switch (fee.category) {
                    case 'flat':
                        amount = rate;
                        break;
                    case 'per_sqft':
                        amount = rate * params.resSqft;
                        qty = params.resSqft;
                        break;
                    case 'per_unit':
                        amount = rate * params.dwellings;
                        qty = params.dwellings;
                        break;
                    case 'per_trip':
                        amount = rate * (params.trips || 0);
                        qty = params.trips || 0;
                        break;
                    case 'formula':
                        // Skip formula fees for now
                        continue;
                    default:
                        continue;
                }

                if (amount > 0) {
                    const agencyName = fee.agencies?.name || 'Unknown Agency';

                    lineItems.push({
                        agency: agencyName,
                        fee: fee.name,
                        method: fee.category,
                        rate: fee.rate || 0,
                        unit: fee.unit_label || '',
                        qty,
                        amount
                    });

                    agencyTotals[agencyName] = (agencyTotals[agencyName] || 0) + amount;
                }
            }

            const byAgency = Object.entries(agencyTotals).map(([agency, subtotal]) => ({
                agency,
                subtotal
            }));

            const grandTotal = Object.values(agencyTotals).reduce((sum, total) => sum + total, 0);

            const result = {
                jurisdiction: params.city,
                fee_count: feesData.length,
                published_versions: feesData.length,
                grand_total: grandTotal,
                by_agency: byAgency,
                line_items: lineItems,
                needs_rules: [] // No formula fees for now
            };

            return { success: true, data: result };
        } catch (error) {
            console.error('❌ Client-side calculation error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Calculation failed' };
        }
    }

    // Get comprehensive fee data for all jurisdictions
    async getAllJurisdictionsWithFees(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            const { data, error } = await supabase
                .from('jurisdictions')
                .select(`
                    id, name, type, kind, state_fips, population,
                    fees!inner(
                        id, name, category, rate, unit_label, description, applies_to, use_subtype, active,
                        agencies(id, name)
                    )
                `)
                .eq('fees.active', true)
                .order('name');

            return { data, error };
        });
    }

    // Search jurisdictions by name, state, or other criteria
    async searchJurisdictions(searchTerm: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            const { data, error } = await supabase
                .from('jurisdictions')
                .select(`
                    id, name, type, kind, state_fips, population,
                    fees!inner(
                        id, name, category, rate, unit_label, description, applies_to, use_subtype, active,
                        agencies(id, name)
                    )
                `)
                .or(`name.ilike.%${searchTerm}%,state_fips.ilike.%${searchTerm}%`)
                .eq('fees.active', true)
                .order('name')
                .limit(20);

            return { data, error };
        });
    }

    // Get fee statistics across all jurisdictions
    async getFeeStatistics(): Promise<{ success: boolean; data?: any; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            // Get jurisdiction count
            const { count: jurisdictionCount } = await supabase
                .from('jurisdictions')
                .select('*', { count: 'exact', head: true });

            // Get total fee count
            const { count: feeCount } = await supabase
                .from('fees')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            // Get agency count
            const { count: agencyCount } = await supabase
                .from('agencies')
                .select('*', { count: 'exact', head: true });

            // Get fee categories
            const { data: categories } = await supabase
                .from('fees')
                .select('category')
                .eq('active', true);

            const uniqueCategories = [...new Set(categories?.map(f => f.category) || [])];

            // Get states covered
            const { data: states } = await supabase
                .from('jurisdictions')
                .select('state_fips')
                .not('state_fips', 'is', null);

            const uniqueStates = [...new Set(states?.map(s => s.state_fips) || [])];

            return {
                data: {
                    totalJurisdictions: jurisdictionCount || 0,
                    totalFees: feeCount || 0,
                    totalAgencies: agencyCount || 0,
                    feeCategories: uniqueCategories,
                    statesCovered: uniqueStates.length,
                    lastUpdated: new Date().toISOString()
                },
                error: null
            };
        });
    }

    // Get fees by category across all jurisdictions
    async getFeesByCategory(category: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            const { data, error } = await supabase
                .from('fees')
                .select(`
                    id, name, category, rate, unit_label, description, applies_to, use_subtype,
                    jurisdictions(id, name, type, kind, state_fips, population),
                    agencies(id, name)
                `)
                .eq('active', true)
                .eq('category', category)
                .order('rate', { ascending: false });

            return { data, error };
        });
    }

    // Compare fees between two jurisdictions
    async compareJurisdictions(jurisdiction1: string, jurisdiction2: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            // Get fees for both jurisdictions
            const { data: fees1 } = await supabase
                .from('fees')
                .select(`
                    id, name, category, rate, unit_label, description, applies_to, use_subtype,
                    agencies(id, name)
                `)
                .eq('jurisdiction_id', jurisdiction1)
                .eq('active', true);

            const { data: fees2 } = await supabase
                .from('fees')
                .select(`
                    id, name, category, rate, unit_label, description, applies_to, use_subtype,
                    agencies(id, name)
                `)
                .eq('jurisdiction_id', jurisdiction2)
                .eq('active', true);

            // Get jurisdiction info
            const { data: jur1 } = await supabase
                .from('jurisdictions')
                .select('id, name, type, kind, state_fips, population')
                .eq('id', jurisdiction1)
                .single();

            const { data: jur2 } = await supabase
                .from('jurisdictions')
                .select('id, name, type, kind, state_fips, population')
                .eq('id', jurisdiction2)
                .single();

            return {
                data: {
                    jurisdiction1: { ...jur1, fees: fees1 || [] },
                    jurisdiction2: { ...jur2, fees: fees2 || [] },
                    comparison: {
                        totalFees1: fees1?.length || 0,
                        totalFees2: fees2?.length || 0,
                        averageRate1: fees1?.reduce((sum, f) => sum + (f.rate || 0), 0) / (fees1?.length || 1),
                        averageRate2: fees2?.reduce((sum, f) => sum + (f.rate || 0), 0) / (fees2?.length || 1)
                    }
                },
                error: null
            };
        });
    }

    // Get fee trends and patterns
    async getFeeTrends(): Promise<{ success: boolean; data?: any; error?: string }> {
        return await executeSupabaseQuery(async () => {
            const supabase = this.getSupabaseClient();

            // Get fee distribution by category
            const { data: categoryDistribution } = await supabase
                .from('fees')
                .select('category')
                .eq('active', true);

            const categoryCounts = categoryDistribution?.reduce((acc: any, fee) => {
                acc[fee.category] = (acc[fee.category] || 0) + 1;
                return acc;
            }, {}) || {};

            // Get fee distribution by jurisdiction
            const { data: jurisdictionDistribution } = await supabase
                .from('fees')
                .select('jurisdiction_id, jurisdictions(name)')
                .eq('active', true);

            const jurisdictionCounts = jurisdictionDistribution?.reduce((acc: any, fee) => {
                const jurName = fee.jurisdictions?.name || 'Unknown';
                acc[jurName] = (acc[jurName] || 0) + 1;
                return acc;
            }, {}) || {};

            // Get rate statistics
            const { data: rateStats } = await supabase
                .from('fees')
                .select('rate')
                .eq('active', true)
                .not('rate', 'is', null);

            const rates = rateStats?.map(f => f.rate).filter(r => r > 0) || [];
            const rateStats_calculated = {
                min: Math.min(...rates),
                max: Math.max(...rates),
                average: rates.reduce((sum, r) => sum + r, 0) / rates.length,
                median: rates.sort((a, b) => a - b)[Math.floor(rates.length / 2)]
            };

            return {
                data: {
                    categoryDistribution: categoryCounts,
                    jurisdictionDistribution: jurisdictionCounts,
                    rateStatistics: rateStats_calculated,
                    totalFees: rates.length
                },
                error: null
            };
        });
    }
}

// Export a singleton instance
export const lewisDataService = new LewisDataService();
