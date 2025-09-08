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
            // Get all unique jurisdictions from fees_stage
            const { data: jurisdictions, error: fetchError } = await this.supabase
                .from('fees_stage')
                .select('jurisdiction_name, state_name')
                .order('state_name, jurisdiction_name');

            if (fetchError) {
                console.error('❌ Error fetching jurisdictions:', fetchError.message);
                return;
            }

            if (!jurisdictions || jurisdictions.length === 0) {
                console.log('📭 No jurisdictions found in fees_stage');
                return;
            }

            // Get unique jurisdictions
            const uniqueJurisdictions = [...new Map(
                jurisdictions.map(j => [`${j.jurisdiction_name}|${j.state_name}`, j])
            ).values()];

            console.log(`📈 Found ${uniqueJurisdictions.length} unique jurisdictions to analyze\n`);

            for (const jurisdiction of uniqueJurisdictions) {
                await this.analyzeJurisdiction(jurisdiction.jurisdiction_name, jurisdiction.state_name);
            }

            console.log('\n✅ Jurisdiction analytics populated successfully!');

        } catch (error) {
            console.error('💥 Error populating analytics:', error);
        }
    }

    private async analyzeJurisdiction(jurisdictionName: string, stateName: string): Promise<void> {
        try {
            console.log(`🔍 Analyzing ${jurisdictionName}, ${stateName}...`);

            // Get all fees for this jurisdiction
            const { data: fees, error: fetchError } = await this.supabase
                .from('fees_stage')
                .select('*')
                .eq('jurisdiction_name', jurisdictionName)
                .eq('state_name', stateName);

            if (fetchError) {
                console.error(`   ❌ Error fetching fees: ${fetchError.message}`);
                return;
            }

            if (!fees || fees.length === 0) {
                console.log(`   📭 No fees found for ${jurisdictionName}, ${stateName}`);
                return;
            }

            // Calculate metrics
            const totalFees = fees.length;
            const uniqueAgencies = [...new Set(fees.map(f => f.agency_name).filter(Boolean))].length;
            const uniqueCategories = [...new Set(fees.map(f => f.category).filter(Boolean))].length;

            const recordsWithRates = fees.filter(f => f.rate && f.rate > 0).length;
            const recordsWithDescriptions = fees.filter(f => f.description && f.description.trim()).length;
            const recordsWithFormulas = fees.filter(f => f.formula && f.formula.trim()).length;
            const recordsWithEffectiveDates = fees.filter(f => f.effective_date).length;
            const recordsWithSources = fees.filter(f => f.source_url && f.source_url.trim()).length;

            // Calculate quality and completeness scores
            const qualityScore = Math.round(
                (recordsWithRates / totalFees) * 40 + // 40% weight for rates
                (recordsWithDescriptions / totalFees) * 30 + // 30% weight for descriptions
                (recordsWithFormulas / totalFees) * 20 + // 20% weight for formulas
                (recordsWithEffectiveDates / totalFees) * 10 // 10% weight for effective dates
            );

            const completenessScore = Math.round(
                (recordsWithRates / totalFees) * 25 + // 25% weight for rates
                (recordsWithDescriptions / totalFees) * 25 + // 25% weight for descriptions
                (recordsWithFormulas / totalFees) * 15 + // 15% weight for formulas
                (recordsWithEffectiveDates / totalFees) * 15 + // 15% weight for effective dates
                (recordsWithSources / totalFees) * 20 // 20% weight for sources
            );

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
                records_with_formulas: recordsWithFormulas,
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
            console.error(`   💥 Error analyzing ${jurisdictionName}, ${stateName}:`, error);
        }
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
