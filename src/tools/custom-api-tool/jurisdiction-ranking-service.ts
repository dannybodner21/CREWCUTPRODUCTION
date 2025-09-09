import { createSupabaseClient } from './supabase';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables when this module is imported
config({ path: resolve(process.cwd(), '.env.local') });

export interface ProjectDetails {
    projectType: string;
    projectUnits?: number;
    squareFootage?: number;
    projectValue?: number;
    projectAcreage?: number;
    meterSize?: string;
}

export interface JurisdictionRanking {
    jurisdiction: {
        id: string;
        name: string;
        type: string;
        kind: string;
        state_fips: string;
        population: number;
    };
    totalFees: number;
    feePerUnit: number;
    feePerSqFt: number;
    feePerDollar: number;
    population: number | null;
    marketSize: 'Small' | 'Medium' | 'Large' | 'Major';
    developmentFriendly: number; // 0-100 score
    economicViability: number; // 0-100 score
    overallScore: number; // 0-100 score
    ranking: number;
    strengths: string[];
    considerations: string[];
    feeBreakdown: {
        category: string;
        amount: number;
        percentage: number;
    }[];
}

export class JurisdictionRankingService {
    private static instance: JurisdictionRankingService;

    public static getInstance(): JurisdictionRankingService {
        if (!JurisdictionRankingService.instance) {
            JurisdictionRankingService.instance = new JurisdictionRankingService();
        }
        return JurisdictionRankingService.instance;
    }

    private getSupabaseClient() {
        return createSupabaseClient();
    }

    /**
     * Calculate fees for a specific project in a jurisdiction
     */
    private async calculateProjectFees(jurisdictionId: string, project: ProjectDetails): Promise<{
        totalFees: number;
        feeBreakdown: { category: string; amount: number; percentage: number }[];
    }> {
        const supabase = this.getSupabaseClient();

        // Get all fees for this jurisdiction
        const { data: fees, error } = await supabase
            .from('fees')
            .select('*')
            .eq('jurisdiction_id', jurisdictionId)
            .eq('active', true);

        if (error || !fees) {
            return { totalFees: 0, feeBreakdown: [] };
        }

        let totalFees = 0;
        const feeBreakdown: { category: string; amount: number; percentage: number }[] = [];
        const categoryTotals: { [key: string]: number } = {};

        // Calculate fees based on project details
        for (const fee of fees) {
            let calculatedAmount = 0;

            // Parse the rate to get a numeric value
            const rate = this.parseFeeRate(fee.rate);
            if (rate === null) continue;

            // Calculate based on fee basis
            switch (fee.fee_basis) {
                case 'flat':
                    calculatedAmount = rate;
                    break;
                case 'per_unit':
                    if (project.projectUnits) {
                        calculatedAmount = rate * project.projectUnits;
                    }
                    break;
                case 'per_sqft':
                    if (project.squareFootage) {
                        calculatedAmount = rate * project.squareFootage;
                    }
                    break;
                case 'percentage':
                    if (project.projectValue) {
                        calculatedAmount = (rate / 100) * project.projectValue;
                    }
                    break;
                case 'per_linear_foot':
                    // Estimate linear feet as square root of square footage
                    if (project.squareFootage) {
                        const estimatedLinearFeet = Math.sqrt(project.squareFootage);
                        calculatedAmount = rate * estimatedLinearFeet;
                    }
                    break;
                case 'per_cubic_yard':
                    // Estimate cubic yards for excavation (rough estimate)
                    if (project.squareFootage) {
                        const estimatedCubicYards = project.squareFootage * 0.5; // Rough estimate
                        calculatedAmount = rate * estimatedCubicYards;
                    }
                    break;
                case 'per_amp':
                    // Estimate electrical load based on square footage
                    if (project.squareFootage) {
                        const estimatedAmps = Math.max(100, project.squareFootage / 100); // 1 amp per 100 sq ft minimum
                        calculatedAmount = rate * estimatedAmps;
                    }
                    break;
                case 'per_meter_size':
                    // Use provided meter size or default
                    const meterSize = project.meterSize || '1';
                    const meterMultiplier = this.getMeterSizeMultiplier(meterSize);
                    calculatedAmount = rate * meterMultiplier;
                    break;
                case 'per_month':
                    // Annual fee
                    calculatedAmount = rate * 12;
                    break;
                case 'per_hour':
                    // Estimate inspection hours
                    const estimatedHours = Math.max(1, project.squareFootage ? project.squareFootage / 1000 : 1);
                    calculatedAmount = rate * estimatedHours;
                    break;
                case 'per_circuit':
                    // Estimate circuits based on square footage
                    if (project.squareFootage) {
                        const estimatedCircuits = Math.max(10, project.squareFootage / 200); // 1 circuit per 200 sq ft
                        calculatedAmount = rate * estimatedCircuits;
                    }
                    break;
                case 'per_section':
                    // For manufactured homes
                    if (project.projectUnits) {
                        calculatedAmount = rate * project.projectUnits;
                    }
                    break;
                case 'per_alteration':
                    // Estimate alterations
                    calculatedAmount = rate * (project.projectUnits || 1);
                    break;
                case 'per_cost':
                    // Percentage of project value
                    if (project.projectValue) {
                        calculatedAmount = (rate / 100) * project.projectValue;
                    }
                    break;
                case 'per_square':
                    // Roofing - estimate squares
                    if (project.squareFootage) {
                        const estimatedSquares = project.squareFootage / 100; // 1 square = 100 sq ft
                        calculatedAmount = rate * estimatedSquares;
                    }
                    break;
                case 'per_million_btus':
                    // HVAC - estimate BTUs
                    if (project.squareFootage) {
                        const estimatedBTUs = project.squareFootage * 50; // 50 BTUs per sq ft
                        const millionsOfBTUs = estimatedBTUs / 1000000;
                        calculatedAmount = rate * millionsOfBTUs;
                    }
                    break;
                case 'tiered':
                    // Use flat rate for tiered fees
                    calculatedAmount = rate;
                    break;
                case 'formula':
                    // Use flat rate for formula-based fees
                    calculatedAmount = rate;
                    break;
                default:
                    // Default to flat rate
                    calculatedAmount = rate;
                    break;
            }

            if (calculatedAmount > 0) {
                totalFees += calculatedAmount;

                // Group by category
                const category = fee.fee_category || 'Other';
                if (!categoryTotals[category]) {
                    categoryTotals[category] = 0;
                }
                categoryTotals[category] += calculatedAmount;
            }
        }

        // Create fee breakdown
        for (const [category, amount] of Object.entries(categoryTotals)) {
            feeBreakdown.push({
                category,
                amount,
                percentage: totalFees > 0 ? (amount / totalFees) * 100 : 0
            });
        }

        return { totalFees, feeBreakdown };
    }

    /**
     * Parse fee rate from string to number
     */
    private parseFeeRate(rate: string | number): number | null {
        if (typeof rate === 'number') return rate;
        if (typeof rate !== 'string') return null;

        // Remove currency symbols and commas
        const cleanRate = rate.replace(/[$,\s]/g, '');

        // Handle "N/A" or empty strings
        if (cleanRate === 'N/A' || cleanRate === '' || cleanRate.toLowerCase() === 'na') {
            return null;
        }

        const parsed = parseFloat(cleanRate);
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Get meter size multiplier
     */
    private getMeterSizeMultiplier(meterSize: string): number {
        const sizeMap: { [key: string]: number } = {
            '5/8" x 3/4"': 1,
            '3/4"': 1.2,
            '1"': 1.5,
            '1.5"': 2,
            '2"': 3,
            '3"': 5,
            '4"': 8,
            '6"': 15,
            '8"': 25,
            '10"': 40,
            '12"': 60
        };
        return sizeMap[meterSize] || 1;
    }

    /**
     * Determine market size based on population
     */
    private getMarketSize(population: number | null): 'Small' | 'Medium' | 'Large' | 'Major' {
        if (!population) return 'Small';
        if (population >= 1000000) return 'Major';
        if (population >= 500000) return 'Large';
        if (population >= 100000) return 'Medium';
        return 'Small';
    }

    /**
     * Calculate development-friendly score
     */
    private calculateDevelopmentFriendlyScore(
        totalFees: number,
        projectValue: number,
        feeBreakdown: { category: string; amount: number; percentage: number }[]
    ): number {
        let score = 100;

        // Penalize high fees relative to project value
        if (projectValue > 0) {
            const feePercentage = (totalFees / projectValue) * 100;
            if (feePercentage > 5) score -= 30;
            else if (feePercentage > 3) score -= 20;
            else if (feePercentage > 2) score -= 10;
        }

        // Penalize excessive administrative fees
        const adminFees = feeBreakdown.find(f =>
            f.category.toLowerCase().includes('administrative') ||
            f.category.toLowerCase().includes('processing') ||
            f.category.toLowerCase().includes('filing')
        );
        if (adminFees && adminFees.percentage > 20) {
            score -= 15;
        }

        // Reward jurisdictions with streamlined fee structures
        if (feeBreakdown.length <= 5) score += 10;
        else if (feeBreakdown.length > 15) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate economic viability score
     */
    private calculateEconomicViabilityScore(
        population: number | null,
        marketSize: 'Small' | 'Medium' | 'Large' | 'Major',
        totalFees: number,
        projectValue: number
    ): number {
        let score = 50; // Base score

        // Population factor
        if (population) {
            if (population >= 1000000) score += 25;
            else if (population >= 500000) score += 20;
            else if (population >= 100000) score += 15;
            else if (population >= 50000) score += 10;
        }

        // Market size factor
        switch (marketSize) {
            case 'Major': score += 20; break;
            case 'Large': score += 15; break;
            case 'Medium': score += 10; break;
            case 'Small': score += 5; break;
        }

        // Fee efficiency factor
        if (projectValue > 0) {
            const feePercentage = (totalFees / projectValue) * 100;
            if (feePercentage < 1) score += 15;
            else if (feePercentage < 2) score += 10;
            else if (feePercentage < 3) score += 5;
            else if (feePercentage > 5) score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate strengths and considerations for a jurisdiction
     */
    private generateInsights(
        jurisdiction: any,
        totalFees: number,
        projectValue: number,
        feeBreakdown: { category: string; amount: number; percentage: number }[],
        marketSize: 'Small' | 'Medium' | 'Large' | 'Major'
    ): { strengths: string[]; considerations: string[] } {
        const strengths: string[] = [];
        const considerations: string[] = [];

        // Fee-related insights
        if (projectValue > 0) {
            const feePercentage = (totalFees / projectValue) * 100;
            if (feePercentage < 1) {
                strengths.push('Exceptionally low fees relative to project value');
            } else if (feePercentage < 2) {
                strengths.push('Very competitive fee structure');
            } else if (feePercentage > 5) {
                considerations.push('Higher than average fees relative to project value');
            }
        }

        // Market size insights
        if (marketSize === 'Major') {
            strengths.push('Major metropolitan market with high demand potential');
        } else if (marketSize === 'Large') {
            strengths.push('Large market with strong development opportunities');
        } else if (marketSize === 'Small') {
            considerations.push('Smaller market may have limited demand');
        }

        // Population insights
        if (jurisdiction.population) {
            if (jurisdiction.population >= 1000000) {
                strengths.push('Large population base for rental demand');
            } else if (jurisdiction.population < 50000) {
                considerations.push('Smaller population may limit rental market');
            }
        }

        // Fee structure insights
        if (feeBreakdown.length <= 5) {
            strengths.push('Streamlined fee structure with minimal complexity');
        } else if (feeBreakdown.length > 15) {
            considerations.push('Complex fee structure may require additional planning');
        }

        // Category-specific insights
        const highPercentageCategories = feeBreakdown.filter(f => f.percentage > 20);
        if (highPercentageCategories.length > 0) {
            considerations.push(`High concentration of fees in: ${highPercentageCategories.map(c => c.category).join(', ')}`);
        }

        return { strengths, considerations };
    }

    /**
     * Rank jurisdictions for a specific project
     */
    public async rankJurisdictions(project: ProjectDetails): Promise<{
        success: boolean;
        data?: JurisdictionRanking[];
        error?: string;
    }> {
        try {
            const supabase = this.getSupabaseClient();

            // Get all jurisdictions with fees
            const { data: jurisdictions, error: jurisdictionsError } = await supabase
                .from('jurisdictions')
                .select('id, name, type, kind, state_fips, population')
                .eq('is_active', true)
                .order('population', { ascending: false });

            if (jurisdictionsError || !jurisdictions) {
                return { success: false, error: 'Failed to fetch jurisdictions' };
            }

            const rankings: JurisdictionRanking[] = [];

            // Calculate rankings for each jurisdiction
            for (const jurisdiction of jurisdictions) {
                const { totalFees, feeBreakdown } = await this.calculateProjectFees(jurisdiction.id, project);

                if (totalFees === 0) continue; // Skip jurisdictions with no applicable fees

                const marketSize = this.getMarketSize(jurisdiction.population);
                const developmentFriendly = this.calculateDevelopmentFriendlyScore(totalFees, project.projectValue || 0, feeBreakdown);
                const economicViability = this.calculateEconomicViabilityScore(jurisdiction.population, marketSize, totalFees, project.projectValue || 0);

                // Calculate overall score (weighted average)
                const overallScore = (developmentFriendly * 0.4) + (economicViability * 0.6);

                const { strengths, considerations } = this.generateInsights(
                    jurisdiction, totalFees, project.projectValue || 0, feeBreakdown, marketSize
                );

                rankings.push({
                    jurisdiction,
                    totalFees,
                    feePerUnit: project.projectUnits ? totalFees / project.projectUnits : 0,
                    feePerSqFt: project.squareFootage ? totalFees / project.squareFootage : 0,
                    feePerDollar: project.projectValue ? totalFees / project.projectValue : 0,
                    population: jurisdiction.population,
                    marketSize,
                    developmentFriendly,
                    economicViability,
                    overallScore,
                    ranking: 0, // Will be set after sorting
                    strengths,
                    considerations,
                    feeBreakdown
                });
            }

            // Sort by overall score (descending) and set rankings
            rankings.sort((a, b) => b.overallScore - a.overallScore);
            rankings.forEach((ranking, index) => {
                ranking.ranking = index + 1;
            });

            return { success: true, data: rankings };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Get top N jurisdictions for a project
     */
    public async getTopJurisdictions(
        project: ProjectDetails,
        limit: number = 10
    ): Promise<{
        success: boolean;
        data?: JurisdictionRanking[];
        error?: string;
    }> {
        const result = await this.rankJurisdictions(project);
        if (!result.success || !result.data) {
            return result;
        }

        return {
            success: true,
            data: result.data.slice(0, limit)
        };
    }
}

// Export singleton instance
export const jurisdictionRankingService = JurisdictionRankingService.getInstance();
