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
}

// Export a singleton instance
export const lewisDataService = new LewisDataService();
