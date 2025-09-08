#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// CSV Row interface (same as import script)
interface CSVRow {
    state_name: string;
    jurisdiction_name: string;
    agency_name: string;
    fee_name: string;
    category: string;
    description: string;
    unit_label: string;
    calc_method: string;
    rate: string;
    min_fee: string;
    max_fee: string;
    formula: string;
    tier_text: string;
    applies_to: string;
    use_subtype: string;
    service_area_name: string;
    source_title: string;
    source_url: string;
    source_doc_date: string;
    source_page: string;
    source_section: string;
    legal_citation: string;
    effective_date: string;
    notes: string;
}

interface DataQualityMetrics {
    totalRecords: number;
    recordsWithRates: number;
    recordsWithDescriptions: number;
    recordsWithFormulas: number;
    recordsWithEffectiveDates: number;
    recordsWithSources: number;
    uniqueCategories: number;
    uniqueAgencies: number;
    dataQualityScore: number;
    completenessScore: number;
}

interface JurisdictionAnalysis {
    jurisdictionName: string;
    stateName: string;
    totalFees: number;
    categories: string[];
    agencies: string[];
    qualityMetrics: DataQualityMetrics;
    recommendations: string[];
}

class LewisDataAnalyzer {
    private csvRows: CSVRow[] = [];

    private parseCSV(csvContent: string): CSVRow[] {
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        const rows: CSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row: any = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                rows.push(row as CSVRow);
            }
        }

        return rows;
    }

    private parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    async analyzeCSV(csvFilePath: string): Promise<JurisdictionAnalysis> {
        console.log(`🔍 Analyzing data quality for ${csvFilePath}...\n`);

        try {
            // Read and parse CSV
            const csvContent = readFileSync(csvFilePath, 'utf-8');
            this.csvRows = this.parseCSV(csvContent);

            console.log(`📊 Found ${this.csvRows.length} fee records`);

            // Analyze the data
            const analysis = this.performAnalysis();

            // Print detailed analysis
            this.printAnalysis(analysis);

            return analysis;

        } catch (error) {
            console.error(`❌ Error analyzing ${csvFilePath}:`, error);
            throw error;
        }
    }

    private performAnalysis(): JurisdictionAnalysis {
        if (this.csvRows.length === 0) {
            throw new Error('No data to analyze');
        }

        const firstRow = this.csvRows[0];
        const jurisdictionName = firstRow.jurisdiction_name;
        const stateName = firstRow.state_name;

        // Calculate quality metrics
        const qualityMetrics = this.calculateQualityMetrics();

        // Get unique categories and agencies
        const categories = [...new Set(this.csvRows.map(row => row.category))];
        const agencies = [...new Set(this.csvRows.map(row => row.agency_name))];

        // Generate recommendations
        const recommendations = this.generateRecommendations(qualityMetrics, categories, agencies);

        return {
            jurisdictionName,
            stateName,
            totalFees: this.csvRows.length,
            categories,
            agencies,
            qualityMetrics,
            recommendations,
        };
    }

    private calculateQualityMetrics(): DataQualityMetrics {
        const totalRecords = this.csvRows.length;

        // Count records with various data elements
        const recordsWithRates = this.csvRows.filter(row =>
            row.rate && row.rate.trim() !== '' && !isNaN(parseFloat(row.rate.replace(/[$,\s]/g, '')))
        ).length;

        const recordsWithDescriptions = this.csvRows.filter(row =>
            row.description && row.description.trim() !== ''
        ).length;

        const recordsWithFormulas = this.csvRows.filter(row =>
            row.formula && row.formula.trim() !== ''
        ).length;

        const recordsWithEffectiveDates = this.csvRows.filter(row =>
            row.effective_date && row.effective_date.trim() !== ''
        ).length;

        const recordsWithSources = this.csvRows.filter(row =>
            row.source_url && row.source_url.trim() !== ''
        ).length;

        const uniqueCategories = new Set(this.csvRows.map(row => row.category)).size;
        const uniqueAgencies = new Set(this.csvRows.map(row => row.agency_name)).size;

        // Calculate quality score (0-100)
        const qualityFactors = [
            recordsWithRates / totalRecords,
            recordsWithDescriptions / totalRecords,
            recordsWithEffectiveDates / totalRecords,
            recordsWithSources / totalRecords,
        ];

        const dataQualityScore = Math.round(qualityFactors.reduce((sum, factor) => sum + factor, 0) / qualityFactors.length * 100);

        // Calculate completeness score (0-100)
        const completenessFactors = [
            recordsWithRates / totalRecords,
            recordsWithDescriptions / totalRecords,
            recordsWithFormulas / totalRecords,
            recordsWithEffectiveDates / totalRecords,
            recordsWithSources / totalRecords,
        ];

        const completenessScore = Math.round(completenessFactors.reduce((sum, factor) => sum + factor, 0) / completenessFactors.length * 100);

        return {
            totalRecords,
            recordsWithRates,
            recordsWithDescriptions,
            recordsWithFormulas,
            recordsWithEffectiveDates,
            recordsWithSources,
            uniqueCategories,
            uniqueAgencies,
            dataQualityScore,
            completenessScore,
        };
    }

    private generateRecommendations(metrics: DataQualityMetrics, categories: string[], agencies: string[]): string[] {
        const recommendations: string[] = [];

        // Rate data recommendations
        if (metrics.recordsWithRates / metrics.totalRecords < 0.8) {
            recommendations.push('⚠️  Low rate data coverage - consider adding more specific fee amounts');
        }

        // Description recommendations
        if (metrics.recordsWithDescriptions / metrics.totalRecords < 0.9) {
            recommendations.push('📝 Missing descriptions - add detailed fee descriptions for better clarity');
        }

        // Formula recommendations
        if (metrics.recordsWithFormulas / metrics.totalRecords < 0.3) {
            recommendations.push('🧮 Limited formula data - consider adding calculation formulas where applicable');
        }

        // Source recommendations
        if (metrics.recordsWithSources / metrics.totalRecords < 0.9) {
            recommendations.push('🔗 Missing source URLs - ensure all fees have proper source documentation');
        }

        // Category recommendations
        if (categories.length < 10) {
            recommendations.push('📋 Limited category diversity - consider breaking down broad categories into more specific ones');
        }

        // Agency recommendations
        if (agencies.length < 3) {
            recommendations.push('🏛️  Limited agency coverage - consider including fees from additional departments');
        }

        // Overall quality recommendations
        if (metrics.dataQualityScore < 70) {
            recommendations.push('🎯 Overall data quality needs improvement - focus on adding missing rate and source data');
        }

        if (metrics.completenessScore < 60) {
            recommendations.push('📊 Data completeness is low - consider comprehensive data collection review');
        }

        // Positive feedback
        if (metrics.dataQualityScore >= 85) {
            recommendations.push('✅ Excellent data quality - this jurisdiction has comprehensive fee data');
        }

        if (categories.length >= 15) {
            recommendations.push('🌟 Great category coverage - comprehensive fee type representation');
        }

        return recommendations;
    }

    private printAnalysis(analysis: JurisdictionAnalysis): void {
        console.log('\n📊 JURISDICTION ANALYSIS REPORT');
        console.log('='.repeat(50));

        console.log(`\n📍 Jurisdiction: ${analysis.jurisdictionName}, ${analysis.stateName}`);
        console.log(`📈 Total Fee Records: ${analysis.totalFees}`);
        console.log(`📋 Unique Categories: ${analysis.uniqueCategories}`);
        console.log(`🏛️  Unique Agencies: ${analysis.uniqueAgencies}`);

        console.log('\n📊 DATA QUALITY METRICS');
        console.log('-'.repeat(30));
        const m = analysis.qualityMetrics;

        console.log(`💰 Records with Rates: ${m.recordsWithRates}/${m.totalRecords} (${Math.round(m.recordsWithRates / m.totalRecords * 100)}%)`);
        console.log(`📝 Records with Descriptions: ${m.recordsWithDescriptions}/${m.totalRecords} (${Math.round(m.recordsWithDescriptions / m.totalRecords * 100)}%)`);
        console.log(`🧮 Records with Formulas: ${m.recordsWithFormulas}/${m.totalRecords} (${Math.round(m.recordsWithFormulas / m.totalRecords * 100)}%)`);
        console.log(`📅 Records with Effective Dates: ${m.recordsWithEffectiveDates}/${m.totalRecords} (${Math.round(m.recordsWithEffectiveDates / m.totalRecords * 100)}%)`);
        console.log(`🔗 Records with Sources: ${m.recordsWithSources}/${m.totalRecords} (${Math.round(m.recordsWithSources / m.totalRecords * 100)}%)`);

        console.log('\n🎯 QUALITY SCORES');
        console.log('-'.repeat(20));
        console.log(`Data Quality Score: ${m.dataQualityScore}/100 ${this.getScoreEmoji(m.dataQualityScore)}`);
        console.log(`Completeness Score: ${m.completenessScore}/100 ${this.getScoreEmoji(m.completenessScore)}`);

        console.log('\n📋 FEE CATEGORIES');
        console.log('-'.repeat(20));
        analysis.categories.forEach((category, index) => {
            const count = this.csvRows.filter(row => row.category === category).length;
            console.log(`${index + 1}. ${category} (${count} fees)`);
        });

        console.log('\n🏛️  AGENCIES');
        console.log('-'.repeat(15));
        analysis.agencies.forEach((agency, index) => {
            const count = this.csvRows.filter(row => row.agency_name === agency).length;
            console.log(`${index + 1}. ${agency} (${count} fees)`);
        });

        console.log('\n💡 RECOMMENDATIONS');
        console.log('-'.repeat(20));
        if (analysis.recommendations.length === 0) {
            console.log('✅ No specific recommendations - data quality is excellent!');
        } else {
            analysis.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }

        console.log('\n' + '='.repeat(50));
    }

    private getScoreEmoji(score: number): string {
        if (score >= 90) return '🟢';
        if (score >= 80) return '🟡';
        if (score >= 70) return '🟠';
        return '🔴';
    }

    // Method to analyze multiple CSV files
    async analyzeMultipleCSVs(csvFiles: string[]): Promise<JurisdictionAnalysis[]> {
        console.log(`🔍 Analyzing ${csvFiles.length} CSV files...\n`);

        const analyses: JurisdictionAnalysis[] = [];

        for (const csvFile of csvFiles) {
            try {
                const analysis = await this.analyzeCSV(csvFile);
                analyses.push(analysis);
            } catch (error) {
                console.error(`❌ Failed to analyze ${csvFile}:`, error);
            }
        }

        // Print summary comparison
        this.printComparisonSummary(analyses);

        return analyses;
    }

    private printComparisonSummary(analyses: JurisdictionAnalysis[]): void {
        console.log('\n📊 COMPARATIVE ANALYSIS SUMMARY');
        console.log('='.repeat(60));

        console.log('\n📈 JURISDICTION COMPARISON');
        console.log('-'.repeat(30));

        analyses.forEach(analysis => {
            const m = analysis.qualityMetrics;
            console.log(`${analysis.jurisdictionName}, ${analysis.stateName}:`);
            console.log(`  Total Fees: ${m.totalRecords}`);
            console.log(`  Quality Score: ${m.dataQualityScore}/100 ${this.getScoreEmoji(m.dataQualityScore)}`);
            console.log(`  Completeness: ${m.completenessScore}/100 ${this.getScoreEmoji(m.completenessScore)}`);
            console.log(`  Categories: ${m.uniqueCategories}`);
            console.log(`  Agencies: ${m.uniqueAgencies}`);
            console.log('');
        });

        // Calculate averages
        const avgQuality = Math.round(analyses.reduce((sum, a) => sum + a.qualityMetrics.dataQualityScore, 0) / analyses.length);
        const avgCompleteness = Math.round(analyses.reduce((sum, a) => sum + a.qualityMetrics.completenessScore, 0) / analyses.length);
        const totalFees = analyses.reduce((sum, a) => sum + a.qualityMetrics.totalRecords, 0);

        console.log('📊 OVERALL STATISTICS');
        console.log('-'.repeat(25));
        console.log(`Total Jurisdictions: ${analyses.length}`);
        console.log(`Total Fee Records: ${totalFees}`);
        console.log(`Average Quality Score: ${avgQuality}/100 ${this.getScoreEmoji(avgQuality)}`);
        console.log(`Average Completeness: ${avgCompleteness}/100 ${this.getScoreEmoji(avgCompleteness)}`);
    }
}

// Main execution
async function main() {
    const csvFile = process.argv[2];

    if (!csvFile) {
        console.error('❌ Please provide a CSV file path');
        console.log('Usage: tsx lewis-data-analysis.ts <csv-file-path>');
        process.exit(1);
    }

    const analyzer = new LewisDataAnalyzer();

    try {
        await analyzer.analyzeCSV(csvFile);
        console.log('\n🎉 Analysis completed successfully!');
    } catch (error) {
        console.error('\n💥 Analysis failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { LewisDataAnalyzer };
