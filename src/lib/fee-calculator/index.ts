/**
 * Lewis Construction Fee Calculator - Production Version
 * Calculates all construction and operational fees for feasibility reports
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface ProjectInputs {
    // Location
    jurisdictionName: string;
    stateCode: string;
    serviceArea?: string;

    // Project details
    projectType: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed-use' | 'Public';
    useSubtype?: string;

    // Quantities
    numUnits?: number;
    squareFeet?: number;
    projectValue?: number;
    acreage?: number;
    meterSize?: string;
}

export interface CalculatedFee {
    feeId: string;
    feeName: string;
    agencyName: string;
    serviceArea: string;
    category: string;
    calcType: string;
    calculatedAmount: number;
    calculation: string;
    isRecurring: boolean; // true for monthly/annual fees
    recurringPeriod?: 'month' | 'year';
}

export interface FeeBreakdown {
    oneTimeFees: number;
    monthlyFees: number;
    annualOperatingCosts: number;
    firstYearTotal: number;
    fees: CalculatedFee[];
    byCategory: Record<string, number>;
    byAgency: Record<string, number>;
    project: ProjectInputs;
}

// ============================================
// Fee Calculator Class
// ============================================

export class FeeCalculator {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Calculate all applicable fees for a project
     */
    async calculateFees(inputs: ProjectInputs): Promise<FeeBreakdown> {
        const applicableFees = await this.getApplicableFees(inputs);
        const calculatedFees: CalculatedFee[] = [];

        for (const fee of applicableFees) {
            try {
                const result = this.calculateSingleFee(fee, inputs);
                if (result) {
                    calculatedFees.push(result);
                }
            } catch (error) {
                console.error(`Error calculating fee ${fee.feeName}:`, error);
            }
        }

        // Separate one-time vs recurring fees
        const oneTimeFees = calculatedFees
            .filter(f => !f.isRecurring)
            .reduce((sum, fee) => sum + fee.calculatedAmount, 0);

        const monthlyFees = calculatedFees
            .filter(f => f.isRecurring && f.recurringPeriod === 'month')
            .reduce((sum, fee) => sum + fee.calculatedAmount, 0);

        const annualOperatingCosts = monthlyFees * 12;
        const firstYearTotal = oneTimeFees + annualOperatingCosts;

        const byCategory = calculatedFees.reduce((acc, fee) => {
            acc[fee.category] = (acc[fee.category] || 0) + fee.calculatedAmount;
            return acc;
        }, {} as Record<string, number>);

        const byAgency = calculatedFees.reduce((acc, fee) => {
            acc[fee.agencyName] = (acc[fee.agencyName] || 0) + fee.calculatedAmount;
            return acc;
        }, {} as Record<string, number>);

        return {
            oneTimeFees,
            monthlyFees,
            annualOperatingCosts,
            firstYearTotal,
            fees: calculatedFees,
            byCategory,
            byAgency,
            project: inputs
        };
    }

    private async getApplicableFees(inputs: ProjectInputs): Promise<any[]> {
        const serviceArea = inputs.serviceArea || 'Citywide';

        const { data, error } = await this.supabase
            .from('v_active_fees')
            .select('*')
            .eq('jurisdiction_name', inputs.jurisdictionName)
            .eq('state_code', inputs.stateCode)
            .in('service_area', [serviceArea, 'Citywide']);

        if (error) throw new Error(`Database error: ${error.message}`);
        if (!data || data.length === 0) {
            throw new Error(`No fees found for ${inputs.jurisdictionName}, ${inputs.stateCode}`);
        }

        const filtered = data.filter((fee: any) => {
            const appliesTo = fee.applies_to || [];
            const useSubtypes = fee.use_subtypes || [];
            const typeMatches = appliesTo.includes('All Users') || appliesTo.includes(inputs.projectType);
            const subtypeMatches = !inputs.useSubtype ||
                useSubtypes.includes('All Users') ||
                useSubtypes.includes(inputs.useSubtype);
            return typeMatches && subtypeMatches;
        });

        return this.deduplicateServiceAreas(filtered, serviceArea).map((fee: any) => ({
            feeId: fee.fee_id,
            feeName: fee.fee_name,
            agencyName: fee.agency_name,
            serviceArea: fee.service_area,
            category: fee.category,
            calcType: fee.calc_type,
            rate: fee.rate,
            unitLabel: fee.unit_label,
            minFee: fee.min_fee,
            maxFee: fee.max_fee,
            formulaDisplay: fee.formula_display,
            formulaConfig: fee.formula_config
        }));
    }

    private deduplicateServiceAreas(fees: any[], requestedServiceArea: string): any[] {
        const feeMap = new Map<string, any>();

        for (const fee of fees) {
            const key = `${fee.fee_name}|${fee.agency_name}|${fee.unit_label || 'none'}`;
            const existing = feeMap.get(key);

            if (!existing) {
                feeMap.set(key, fee);
            } else {
                if (fee.service_area === requestedServiceArea && existing.service_area === 'Citywide') {
                    feeMap.set(key, fee);
                } else if (fee.service_area === 'Citywide' && existing.service_area === requestedServiceArea) {
                    continue;
                }
            }
        }

        return Array.from(feeMap.values());
    }

    private calculateSingleFee(fee: any, inputs: ProjectInputs): CalculatedFee | null {
        let amount = 0;
        let calculation = '';
        let isRecurring = false;
        let recurringPeriod: 'month' | 'year' | undefined;

        // Determine if this is a recurring fee
        if (fee.unitLabel?.toLowerCase().includes('per month')) {
            isRecurring = true;
            recurringPeriod = 'month';
        }

        switch (fee.calcType) {
            case 'flat':
                amount = fee.rate || 0;
                if (isRecurring) {
                    calculation = `$${amount.toFixed(2)} per month`;
                } else {
                    calculation = `Flat fee: $${amount.toFixed(2)}`;
                }
                break;

            case 'per_unit':
                if (!inputs.numUnits) return null;

                // Handle meter-size specific fees
                if (fee.unitLabel && (fee.unitLabel.includes('"') || fee.unitLabel.includes('"') || fee.unitLabel.includes('"'))) {
                    const meterSizeMatch = fee.unitLabel.match(/(\d+(?:\.\d+)?(?:\/\d+)?(?:-\d+\/\d+)?)[""\"]/);

                    if (meterSizeMatch) {
                        const requiredSize = meterSizeMatch[1];
                        if (!inputs.meterSize) return null;

                        if (fee.unitLabel.toLowerCase().includes('up to')) {
                            const maxSize = this.convertMeterSize(requiredSize);
                            const actualSize = this.convertMeterSize(inputs.meterSize);
                            if (actualSize > maxSize) return null;
                        } else {
                            if (!this.meterSizesMatch(inputs.meterSize, requiredSize)) return null;
                        }
                    }
                }

                amount = (fee.rate || 0) * inputs.numUnits;
                calculation = `$${fee.rate} × ${inputs.numUnits} units = $${amount.toFixed(2)}`;
                break;

            case 'per_sqft':
                if (!inputs.squareFeet) return null;
                const divisor = fee.unitLabel?.includes('1000') ? 1000 : 1;
                const sqftUnits = inputs.squareFeet / divisor;
                amount = (fee.rate || 0) * sqftUnits;

                if (divisor === 1000) {
                    calculation = `$${fee.rate} × ${(inputs.squareFeet / 1000).toFixed(2)} (1000 sq ft units) = $${amount.toFixed(2)}`;
                } else {
                    calculation = `$${fee.rate} × ${inputs.squareFeet} sq ft = $${amount.toFixed(2)}`;
                }
                break;

            case 'per_meter_size':
                if (!inputs.meterSize) return null;
                if (fee.unitLabel?.includes(inputs.meterSize)) {
                    amount = fee.rate || 0;
                    calculation = `${inputs.meterSize} meter: $${amount.toFixed(2)}`;
                    if (fee.unitLabel?.toLowerCase().includes('per month')) {
                        isRecurring = true;
                        recurringPeriod = 'month';
                        calculation += ' per month';
                    }
                } else {
                    return null;
                }
                break;

            case 'percentage':
                if (!inputs.projectValue) return null;
                amount = (inputs.projectValue * (fee.rate || 0)) / 100;
                calculation = `${fee.rate}% of $${inputs.projectValue.toLocaleString()} = $${amount.toFixed(2)}`;
                break;

            case 'formula':
                // For simple addition formulas, use the pre-calculated result
                if (fee.formulaDisplay && fee.formulaDisplay.includes('=')) {
                    const resultMatch = fee.formulaDisplay.match(/=\s*\$?([\d,]+\.?\d*)/);
                    if (resultMatch) {
                        const resultValue = parseFloat(resultMatch[1].replace(/,/g, ''));
                        if (inputs.numUnits) {
                            amount = resultValue * inputs.numUnits;
                            calculation = `Formula result: $${resultValue.toFixed(4)} × ${inputs.numUnits} units = $${amount.toFixed(2)}`;
                        } else {
                            amount = resultValue;
                            calculation = `Formula result: $${amount.toFixed(2)}`;
                        }
                    }
                }
                if (amount === 0) return null; // Skip if we couldn't calculate
                break;

            default:
                return null;
        }

        // Apply min/max constraints
        if (fee.minFee && amount < fee.minFee) {
            calculation += ` (minimum: $${fee.minFee.toFixed(2)})`;
            amount = fee.minFee;
        }
        if (fee.maxFee && amount > fee.maxFee) {
            calculation += ` (maximum: $${fee.maxFee.toFixed(2)})`;
            amount = fee.maxFee;
        }

        return {
            feeId: fee.feeId,
            feeName: fee.feeName,
            agencyName: fee.agencyName,
            serviceArea: fee.serviceArea,
            category: fee.category || 'Other',
            calcType: fee.calcType,
            calculatedAmount: amount,
            calculation,
            isRecurring,
            recurringPeriod
        };
    }

    /**
     * Format a comprehensive feasibility report
     */
    formatFeasibilityReport(breakdown: FeeBreakdown): string {
        let report = '═'.repeat(70) + '\n';
        report += '  CONSTRUCTION FEASIBILITY REPORT\n';
        report += '═'.repeat(70) + '\n\n';

        report += `Project: ${breakdown.project.projectType}`;
        if (breakdown.project.useSubtype) report += ` - ${breakdown.project.useSubtype}`;
        report += '\n';
        report += `Location: ${breakdown.project.jurisdictionName}, ${breakdown.project.stateCode}\n`;
        report += `Service Area: ${breakdown.project.serviceArea || 'Citywide'}\n\n`;

        report += 'Project Details:\n';
        if (breakdown.project.numUnits) report += `  Units: ${breakdown.project.numUnits}\n`;
        if (breakdown.project.squareFeet) report += `  Square Feet: ${breakdown.project.squareFeet.toLocaleString()}\n`;
        if (breakdown.project.projectValue) report += `  Project Value: $${breakdown.project.projectValue.toLocaleString()}\n`;
        if (breakdown.project.meterSize) report += `  Meter Size: ${breakdown.project.meterSize}\n`;

        report += '\n' + '─'.repeat(70) + '\n';
        report += 'FINANCIAL SUMMARY\n';
        report += '─'.repeat(70) + '\n';
        report += `One-Time Development Fees:        $${breakdown.oneTimeFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += `Monthly Operating Costs:           $${breakdown.monthlyFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += `Annual Operating Costs (Year 1):   $${breakdown.annualOperatingCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += '─'.repeat(70) + '\n';
        report += `TOTAL FIRST YEAR COST:             $${breakdown.firstYearTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += '─'.repeat(70) + '\n\n';

        // One-time fees
        const oneTimeFees = breakdown.fees.filter(f => !f.isRecurring);
        if (oneTimeFees.length > 0) {
            report += '─'.repeat(70) + '\n';
            report += 'ONE-TIME DEVELOPMENT FEES\n';
            report += '─'.repeat(70) + '\n\n';

            for (const fee of oneTimeFees) {
                report += `${fee.feeName}\n`;
                report += `  Agency: ${fee.agencyName}\n`;
                report += `  Service Area: ${fee.serviceArea}\n`;
                report += `  Calculation: ${fee.calculation}\n`;
                report += `  Amount: $${fee.calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
            }
        }

        // Monthly fees
        const monthlyFees = breakdown.fees.filter(f => f.isRecurring);
        if (monthlyFees.length > 0) {
            report += '─'.repeat(70) + '\n';
            report += 'MONTHLY OPERATING COSTS\n';
            report += '─'.repeat(70) + '\n\n';

            for (const fee of monthlyFees) {
                report += `${fee.feeName}\n`;
                report += `  Agency: ${fee.agencyName}\n`;
                report += `  Calculation: ${fee.calculation}\n`;
                report += `  Monthly: $${fee.calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
                report += `  Annual: $${(fee.calculatedAmount * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
            }
        }

        report += '═'.repeat(70) + '\n';
        report += 'END OF REPORT\n';
        report += '═'.repeat(70) + '\n';

        return report;
    }

    // Helper methods for meter size conversion
    private convertMeterSize(size: string): number {
        size = size.replace(/"/g, '').trim();
        if (size.includes('-')) {
            const parts = size.split('-');
            const whole = parseFloat(parts[0]);
            const fraction = this.parseFraction(parts[1]);
            return whole + fraction;
        } else if (size.includes('/')) {
            return this.parseFraction(size);
        } else {
            return parseFloat(size);
        }
    }

    private parseFraction(fraction: string): number {
        const parts = fraction.split('/');
        if (parts.length === 2) {
            return parseFloat(parts[0]) / parseFloat(parts[1]);
        }
        return parseFloat(fraction);
    }

    private meterSizesMatch(size1: string, size2: string): boolean {
        const normalized1 = this.convertMeterSize(size1);
        const normalized2 = this.convertMeterSize(size2);
        return Math.abs(normalized1 - normalized2) < 0.01;
    }
}