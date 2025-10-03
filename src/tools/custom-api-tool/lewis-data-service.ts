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

    // Calculate project fees using direct RPC call to calc_project_fees
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
            const supabase = this.getSupabaseClient();

            console.log('🔧 Calculating project fees with params:', params);

            // Map use types to valid enum values
            const useDomainMap: { [key: string]: string } = {
                'residential': 'residential',
                'commercial': 'commercial',
                'multifamily': 'residential', // Map multifamily to residential
                'office': 'commercial', // Map office to commercial
                'industrial': 'commercial',
                'mixed-use': 'commercial'
            };

            const mappedUse = useDomainMap[params.use] || params.use;

            // First try to call the calc_project_fees function directly
            const { data: calcData, error: calcError } = await supabase.rpc('calc_project_fees', {
                p_jur_name: params.city,
                p_use_domain: mappedUse,
                p_use_subtype: params.useSubtype || null,
                p_dwellings: params.dwellings,
                p_res_sqft: params.resSqft,
                p_trips: params.trips || 0,
                p_valuation: params.valuation || null,
                p_net_loss: 0 // Default value for net loss
            });

            if (calcError) {
                console.error('❌ Error calling calc_project_fees:', calcError);

                // If the function doesn't exist, fall back to client-side calculation
                console.log('🔄 Falling back to client-side calculation...');
                return this.calculateProjectFeesClientSide(params);
            }

            console.log('✅ calc_project_fees result:', calcData);

            // Get jurisdiction info for additional context
            const { data: jurisdictionData } = await supabase
                .from('jurisdictions')
                .select('id, name')
                .ilike('name', params.city)
                .limit(1);

            const jurisdiction = jurisdictionData?.[0];

            // Get fee counts for context
            const { data: feeCounts } = await supabase
                .from('fees')
                .select('id')
                .eq('jurisdiction_id', jurisdiction?.id)
                .eq('active', true);

            const result = {
                jurisdiction: params.city,
                fee_count: feeCounts?.length || 0,
                published_versions: feeCounts?.length || 0, // Simplified for now
                grand_total: calcData?.grand_total || 0,
                by_agency: calcData?.by_agency || [],
                line_items: calcData?.line_items || [],
                needs_rules: calcData?.needs_rules || []
            };

            return { data: result, error: null };
        });
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

            // Get fees for this jurisdiction
            const { data: feesData } = await supabase
                .from('fees')
                .select(`
                    id, name, category, rate, unit_label, description, applies_to, use_subtype,
                    agencies!inner(name)
                `)
                .eq('jurisdiction_id', jurisdiction.id)
                .eq('active', true);

            if (!feesData) {
                return { success: false, error: 'No fees found for this jurisdiction' };
            }

            // Filter fees based on project type
            const relevantFees = feesData.filter(fee => {
                if (fee.applies_to && fee.applies_to !== params.use) return false;
                if (fee.use_subtype && fee.use_subtype !== params.useSubtype) return false;
                return true;
            });

            // Calculate fees
            const lineItems: any[] = [];
            const agencyTotals: { [key: string]: number } = {};

            for (const fee of relevantFees) {
                let amount = 0;
                let qty = 1;

                // Use rate from fees table, fallback to 0 if null
                const rate = fee.rate || 0;

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
}

// Export a singleton instance
export const lewisDataService = new LewisDataService();
