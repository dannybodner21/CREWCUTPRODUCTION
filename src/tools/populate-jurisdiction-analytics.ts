#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { createSupabaseAdminClient } from './custom-api-tool/supabase';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

class JurisdictionAnalyticsPopulator {
    private supabase: any;

    constructor() {
        this.supabase = createSupabaseAdminClient();
    }

    async populateAnalytics(): Promise<void> {
        console.log('📊 Populating jurisdiction analytics...\n');

        try {
            // Get all unique jurisdictions from fees table (final processed data)
            // Use pagination to get all active fees
            let allFees: any[] = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data: fees, error: feesError } = await this.supabase
                    .from('fees')
                    .select('jurisdiction_id')
                    .eq('active', true)
                    .range(from, from + pageSize - 1);

                if (feesError) {
                    console.error('❌ Error fetching fees:', feesError.message);
                    return;
                }

                if (fees && fees.length > 0) {
                    allFees.push(...fees);
                    from += pageSize;
                    hasMore = fees.length === pageSize; // If we got less than pageSize, we've reached the end
                } else {
                    hasMore = false;
                }
            }

            console.log(`🔍 Found ${allFees.length} total active fees`);

            // Get unique jurisdiction IDs
            const uniqueJurisdictionIds = [...new Set(allFees.map(f => f.jurisdiction_id))];
            console.log(`🔍 Found ${uniqueJurisdictionIds.length} unique jurisdiction IDs`);

            // Now get the jurisdiction details
            const { data: jurisdictions, error: fetchError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .in('id', uniqueJurisdictionIds)
                .eq('is_active', true);

            if (fetchError) {
                console.error('❌ Error fetching jurisdictions:', fetchError.message);
                return;
            }

            if (!jurisdictions || jurisdictions.length === 0) {
                console.log('📭 No jurisdictions found in fees table');
                return;
            }

            console.log(`📈 Found ${jurisdictions.length} unique jurisdictions to analyze\n`);

            for (const jurisdiction of jurisdictions) {
                await this.analyzeJurisdiction(jurisdiction.id, jurisdiction.name, jurisdiction.state_fips);
            }

            console.log('\n✅ Jurisdiction analytics populated successfully!');

        } catch (error) {
            console.error('💥 Error populating analytics:', error);
        }
    }

    private async analyzeJurisdiction(jurisdictionId: string, jurisdictionName: string, stateFips: string): Promise<void> {
        try {
            console.log(`🔍 Analyzing ${jurisdictionName}...`);

            // Get all fees for this jurisdiction from the final fees table
            const { data: fees, error: fetchError } = await this.supabase
                .from('fees')
                .select(`
                    *,
                    agencies!inner(name),
                    fee_categories!inner(name)
                `)
                .eq('jurisdiction_id', jurisdictionId)
                .eq('active', true);

            if (fetchError) {
                console.error(`   ❌ Error fetching fees: ${fetchError.message}`);
                return;
            }

            if (!fees || fees.length === 0) {
                console.log(`   📭 No fees found for ${jurisdictionName}`);
                return;
            }

            // Calculate metrics
            const totalFees = fees.length;
            const uniqueAgencies = [...new Set(fees.map(f => f.agencies.name).filter(Boolean))].length;
            const uniqueCategories = [...new Set(fees.map(f => f.fee_categories.name).filter(Boolean))].length;

            const recordsWithRates = fees.filter(f => f.rate && f.rate > 0).length;
            const recordsWithDescriptions = fees.filter(f => f.description && f.description.trim()).length;
            const recordsWithEffectiveDates = fees.filter(f => f.effective_date).length;
            const recordsWithSources = fees.filter(f => f.source_url && f.source_url.trim()).length;

            // Calculate quality and completeness scores (removed formulas)
            const qualityScore = Math.round(
                (recordsWithRates / totalFees) * 50 + // 50% weight for rates
                (recordsWithDescriptions / totalFees) * 30 + // 30% weight for descriptions
                (recordsWithEffectiveDates / totalFees) * 20 // 20% weight for effective dates
            );

            const completenessScore = Math.round(
                (recordsWithRates / totalFees) * 40 + // 40% weight for rates
                (recordsWithDescriptions / totalFees) * 30 + // 30% weight for descriptions
                (recordsWithEffectiveDates / totalFees) * 15 + // 15% weight for effective dates
                (recordsWithSources / totalFees) * 15 // 15% weight for sources
            );

            // Get state name from FIPS code
            const stateName = this.getStateNameFromFips(stateFips);

            // Insert or update analytics record
            const analyticsData = {
                jurisdiction_name: jurisdictionName,
                state_name: stateName,
                total_fee_records: totalFees,
                agency_count: uniqueAgencies,
                fee_category_count: uniqueCategories,
                quality_score: qualityScore,
                completeness_score: completenessScore,
                records_with_rates: recordsWithRates,
                records_with_descriptions: recordsWithDescriptions,
                records_with_effective_dates: recordsWithEffectiveDates,
                records_with_sources: recordsWithSources,
                last_analyzed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error: upsertError } = await this.supabase
                .from('jurisdiction_analytics')
                .upsert(analyticsData, {
                    onConflict: 'jurisdiction_name,state_name'
                });

            if (upsertError) {
                console.error(`   ❌ Error upserting analytics: ${upsertError.message}`);
                return;
            }

            console.log(`   ✅ ${jurisdictionName}, ${stateName}: ${totalFees} fees, ${uniqueAgencies} agencies, ${uniqueCategories} categories`);
            console.log(`      Quality: ${qualityScore}/100, Completeness: ${completenessScore}/100`);

        } catch (error) {
            console.error(`   💥 Error analyzing ${jurisdictionName}:`, error);
        }
    }

    private getStateNameFromFips(stateFips: string): string {
        const fipsToState: { [key: string]: string } = {
            '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
            '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
            '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
            '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
            '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
            '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
            '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
            '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
            '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
            '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
            '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
        };
        return fipsToState[stateFips] || `State FIPS ${stateFips}`;
    }

    async getAnalyticsSummary(): Promise<void> {
        console.log('📊 Jurisdiction Analytics Summary\n');

        try {
            const { data: analytics, error } = await this.supabase
                .from('jurisdiction_analytics')
                .select('*')
                .order('quality_score', { ascending: false });

            if (error) {
                console.error('❌ Error fetching analytics:', error.message);
                return;
            }

            if (!analytics || analytics.length === 0) {
                console.log('📭 No analytics data found');
                return;
            }

            console.log(`📈 Total Jurisdictions: ${analytics.length}\n`);

            // Overall stats
            const totalFees = analytics.reduce((sum, a) => sum + a.total_fee_records, 0);
            const avgQuality = Math.round(analytics.reduce((sum, a) => sum + a.quality_score, 0) / analytics.length);
            const avgCompleteness = Math.round(analytics.reduce((sum, a) => sum + a.completeness_score, 0) / analytics.length);

            console.log(`📊 Overall Statistics:`);
            console.log(`   Total Fee Records: ${totalFees.toLocaleString()}`);
            console.log(`   Average Quality Score: ${avgQuality}/100`);
            console.log(`   Average Completeness Score: ${avgCompleteness}/100\n`);

            // Top performers
            console.log(`🏆 Top 5 by Quality Score:`);
            analytics.slice(0, 5).forEach((a, i) => {
                console.log(`   ${i + 1}. ${a.jurisdiction_name}, ${a.state_name} - ${a.quality_score}/100 (${a.total_fee_records} fees)`);
            });

            console.log(`\n📈 Top 5 by Completeness Score:`);
            analytics.slice(0, 5).forEach((a, i) => {
                console.log(`   ${i + 1}. ${a.jurisdiction_name}, ${a.state_name} - ${a.completeness_score}/100 (${a.total_fee_records} fees)`);
            });

            // Quality distribution
            const excellent = analytics.filter(a => a.quality_score >= 90).length;
            const good = analytics.filter(a => a.quality_score >= 70 && a.quality_score < 90).length;
            const fair = analytics.filter(a => a.quality_score >= 50 && a.quality_score < 70).length;
            const poor = analytics.filter(a => a.quality_score < 50).length;

            console.log(`\n📊 Quality Distribution:`);
            console.log(`   🟢 Excellent (90+): ${excellent} jurisdictions`);
            console.log(`   🟡 Good (70-89): ${good} jurisdictions`);
            console.log(`   🟠 Fair (50-69): ${fair} jurisdictions`);
            console.log(`   🔴 Poor (<50): ${poor} jurisdictions`);

        } catch (error) {
            console.error('💥 Error getting summary:', error);
        }
    }
}

// Main execution
async function main() {
    const command = process.argv[2];
    const populator = new JurisdictionAnalyticsPopulator();

    try {
        if (command === 'populate') {
            await populator.populateAnalytics();
        } else if (command === 'summary') {
            await populator.getAnalyticsSummary();
        } else {
            console.log('Usage:');
            console.log('  tsx populate-jurisdiction-analytics.ts populate  - Populate analytics for all jurisdictions');
            console.log('  tsx populate-jurisdiction-analytics.ts summary  - Show analytics summary');
        }
    } catch (error) {
        console.error('💥 Command failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { JurisdictionAnalyticsPopulator };
