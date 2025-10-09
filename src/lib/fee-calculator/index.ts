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
    serviceArea?: string; // Deprecated - use selectedServiceAreaIds
    selectedServiceAreaIds?: string[]; // Array of service area IDs to include

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
    formulaType?: string; // e.g., 'sum_fees' for formulas that sum other fees
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

        console.log(`💰 Calculating amounts for ${applicableFees.length} fees...`);

        for (const fee of applicableFees) {
            try {
                const result = this.calculateSingleFee(fee, inputs);
                if (result) {
                    calculatedFees.push(result);
                } else {
                    console.warn(`⚠️  Fee ${fee.feeName} returned null from calculateSingleFee (calcType: ${fee.calcType}, rate: ${fee.rate}, unitLabel: ${fee.unitLabel})`);
                }
            } catch (error) {
                console.error(`❌ Error calculating fee ${fee.feeName}:`, error);
            }
        }

        console.log(`✅ Successfully calculated ${calculatedFees.length} fees`);

        // Filter out sum_fees formulas to avoid double-counting
        const displayableFees = calculatedFees.filter(fee => fee.formulaType !== 'sum_fees');
        console.log(`🧹 Filtered out sum formulas: ${calculatedFees.length} -> ${displayableFees.length} fees (removed ${calculatedFees.length - displayableFees.length} sum formulas)`);

        // Separate one-time vs recurring fees
        const oneTimeFees = displayableFees
            .filter(f => !f.isRecurring)
            .reduce((sum, fee) => sum + fee.calculatedAmount, 0);

        const monthlyFees = displayableFees
            .filter(f => f.isRecurring && f.recurringPeriod === 'month')
            .reduce((sum, fee) => sum + fee.calculatedAmount, 0);

        const annualOperatingCosts = monthlyFees * 12;
        const firstYearTotal = oneTimeFees + annualOperatingCosts;

        const byCategory = displayableFees.reduce((acc, fee) => {
            acc[fee.category] = (acc[fee.category] || 0) + fee.calculatedAmount;
            return acc;
        }, {} as Record<string, number>);

        const byAgency = displayableFees.reduce((acc, fee) => {
            acc[fee.agencyName] = (acc[fee.agencyName] || 0) + fee.calculatedAmount;
            return acc;
        }, {} as Record<string, number>);

        return {
            oneTimeFees,
            monthlyFees,
            annualOperatingCosts,
            firstYearTotal,
            fees: displayableFees,
            byCategory,
            byAgency,
            project: inputs
        };
    }

    /**
     * Combine seasonal water volume charges into annual average
     */
    private combineSeasonalWaterCharges(fees: any[]): any[] {
        // Group fees by service area
        const feesByServiceArea = fees.reduce((acc, fee) => {
            const serviceAreaKey = fee.service_areas?.name || 'CITYWIDE';
            if (!acc[serviceAreaKey]) acc[serviceAreaKey] = [];
            acc[serviceAreaKey].push(fee);
            return acc;
        }, {} as Record<string, any[]>);

        const result: any[] = [];

        // Process each service area
        for (const [serviceAreaName, serviceAreaFees] of Object.entries(feesByServiceArea)) {
            // Find seasonal water volume charges
            const waterVolumeCharges = serviceAreaFees.filter((fee: any) =>
                fee.name && fee.name.includes('Water Volume Charge')
            );

            // If we have seasonal charges, combine them
            if (waterVolumeCharges.length === 3) {
                const lowSeason = waterVolumeCharges.find((f: any) => f.name.includes('Low Season'));
                const mediumSeason = waterVolumeCharges.find((f: any) => f.name.includes('Medium Season'));
                const highSeason = waterVolumeCharges.find((f: any) => f.name.includes('High Season'));

                if (lowSeason && mediumSeason && highSeason) {
                    // Create combined fee with seasonal breakdown
                    const combinedFee = {
                        ...lowSeason, // Use low season as base
                        name: 'Water Volume Charge (Annual Average)',
                        seasonalBreakdown: {
                            low: lowSeason.selectedCalculation.rate,
                            medium: mediumSeason.selectedCalculation.rate,
                            high: highSeason.selectedCalculation.rate
                        }
                    };

                    // Add the combined fee
                    result.push(combinedFee);

                    // Add all other fees except the seasonal water charges
                    result.push(...serviceAreaFees.filter((fee: any) =>
                        !waterVolumeCharges.includes(fee)
                    ));

                    continue;
                }
            }

            // If not 3 seasonal charges, keep all fees as-is
            result.push(...serviceAreaFees);
        }

        return result;
    }

    /**
     * Select the best calculation from multiple fee_calculations based on project inputs
     */
    private selectBestCalculation(feeCalculations: any[], inputs: ProjectInputs): any | null {
        if (!feeCalculations || feeCalculations.length === 0) return null;
        if (feeCalculations.length === 1) {
            // Still need to check if this single calc is a sum_fees
            if (feeCalculations[0].formula_type === 'sum_fees') {
                return null;
            }
            return feeCalculations[0];
        }

        // Filter calculations that match the project inputs
        const matchingCalcs = feeCalculations.filter(calc => {
            // Skip formula sum fees (avoid double-counting)
            if (calc.formula_type === 'sum_fees') {
                return false;
            }

            // Check meter size applicability
            if (calc.applies_to_meter_sizes && calc.applies_to_meter_sizes.length > 0) {
                // Use applies_to_meter_sizes if available
                if (!inputs.meterSize || !calc.applies_to_meter_sizes.includes(inputs.meterSize)) {
                    return false;
                }
            } else if (calc.calc_type === 'per_meter_size' && inputs.meterSize) {
                // Fallback: For per_meter_size calcs without applies_to_meter_sizes,
                // check if the unit_label contains the meter size
                if (calc.unit_label && !calc.unit_label.includes(inputs.meterSize)) {
                    return false;
                }
            }

            return true;
        });

        if (matchingCalcs.length > 0) {
            return matchingCalcs[0];
        }

        // Fallback: Use calculations with no filters (apply to all)
        const universalCalcs = feeCalculations.filter(calc =>
            calc.formula_type !== 'sum_fees' &&
            (!calc.applies_to_meter_sizes || calc.applies_to_meter_sizes.length === 0)
        );

        if (universalCalcs.length > 0) {
            return universalCalcs[0];
        }

        return null;
    }

    private async getApplicableFees(inputs: ProjectInputs): Promise<any[]> {
        // Step 1: Get jurisdiction ID
        const { data: jurisdiction, error: jurError } = await this.supabase
            .from('jurisdictions')
            .select('id')
            .eq('jurisdiction_name', inputs.jurisdictionName)
            .eq('state_code', inputs.stateCode)
            .single();

        if (jurError || !jurisdiction) {
            throw new Error(`Jurisdiction not found: ${inputs.jurisdictionName}, ${inputs.stateCode}`);
        }

        // Step 2: Get fee IDs that match our service area criteria from fees table
        let feeIdsQuery = this.supabase
            .from('fees')
            .select('id, service_area_id')
            .eq('jurisdiction_id', jurisdiction.id)
            .eq('is_active', true);

        // Step 3: Filter by service area IDs
        const selectedServiceAreaIds = inputs.selectedServiceAreaIds || [];
        console.log('🔍 Selected service area IDs:', selectedServiceAreaIds);

        if (selectedServiceAreaIds.length === 0) {
            // No service areas selected - show only citywide fees (service_area_id IS NULL)
            feeIdsQuery = feeIdsQuery.is('service_area_id', null);
            console.log('📍 Query: Citywide only (service_area_id IS NULL)');
        } else {
            // Show citywide + selected service area fees
            // Build OR condition: service_area_id.is.null,service_area_id.in.(id1,id2,id3)
            const serviceAreaList = selectedServiceAreaIds.join(',');
            const orCondition = `service_area_id.is.null,service_area_id.in.(${serviceAreaList})`;
            console.log('📍 Query: Citywide + selected areas:', orCondition);
            feeIdsQuery = feeIdsQuery.or(orCondition);
        }

        const { data: feeIds, error: feeIdsError } = await feeIdsQuery;

        if (feeIdsError) throw new Error(`Database error: ${feeIdsError.message}`);
        if (!feeIds || feeIds.length === 0) {
            throw new Error(`No fees found for ${inputs.jurisdictionName}, ${inputs.stateCode}`);
        }

        // Step 4: Get full fee data with fee_calculations for these IDs
        const { data: allFees, error } = await this.supabase
            .from('fees')
            .select(`
                id,
                name,
                category,
                applies_to,
                use_subtypes,
                agencies(name),
                service_areas(name),
                fee_calculations(
                    id,
                    calc_type,
                    rate,
                    unit_label,
                    min_fee,
                    max_fee,
                    tiers,
                    formula_type,
                    formula_config,
                    formula_display,
                    applies_to_meter_sizes
                )
            `)
            .in('id', feeIds.map(f => f.id));

        if (error) throw new Error(`Database error: ${error.message}`);
        if (!allFees || allFees.length === 0) {
            throw new Error(`No fee data found`);
        }

        // Group for logging
        const feeIdSet = new Set(feeIds.filter(f => f.service_area_id === null).map(f => f.id));
        const citywideFees = allFees.filter(f => feeIdSet.has(f.id));
        const serviceAreaFees = allFees.filter(f => !feeIdSet.has(f.id));

        console.log(`📊 Total: ${allFees.length} fees`);
        console.log(`   - ${citywideFees.length} citywide fees`);
        console.log(`   - ${serviceAreaFees.length} service area specific fees (from ${selectedServiceAreaIds.length} selected areas)`);

        // Log unique service areas in results
        const uniqueServiceAreas = [...new Set(allFees.map((f: any) => f.service_areas?.name || 'CITYWIDE'))];
        console.log('🗺️  Service areas in results:', uniqueServiceAreas);

        // Debug: Log all Inside City fees
        const insideCityFees = allFees.filter((f: any) => f.service_areas?.name === 'Inside City');
        console.log(`\n🏙️  Inside City fees found: ${insideCityFees.length}`);
        insideCityFees.forEach((fee: any) => {
            console.log(`  - ${fee.name}: category="${fee.category}", calculations: ${fee.fee_calculations?.length || 0}`);
        });
        console.log();

        console.log(`🔍 Filtering for projectType: "${inputs.projectType}", useSubtype: "${inputs.useSubtype || '(none)'}", meterSize: "${inputs.meterSize || '(none)'}"`);

        // Step 5: Select best calculation for each fee and filter by project type/subtype
        const feesWithSelectedCalc = allFees.map((fee: any) => {
            const appliesTo = fee.applies_to || [];
            const useSubtypes = fee.use_subtypes || [];

            // Check if fee applies to project type
            const typeMatches = appliesTo.length === 0 ||
                               appliesTo.includes('All Users') ||
                               appliesTo.includes('All Usage') ||
                               appliesTo.includes(inputs.projectType);

            // Check if fee applies to use subtype
            const subtypeMatches = !inputs.useSubtype ||
                                  useSubtypes.length === 0 ||
                                  useSubtypes.includes('All Users') ||
                                  useSubtypes.includes(inputs.useSubtype);

            if (!typeMatches || !subtypeMatches) {
                const isInsideCity = fee.service_areas?.name === 'Inside City';
                if (isInsideCity) {
                    console.warn(`⚠️  [INSIDE CITY] Fee filtered out by type/subtype: ${fee.name} (typeMatches: ${typeMatches}, subtypeMatches: ${subtypeMatches})`);
                    console.warn(`   applies_to:`, appliesTo);
                    console.warn(`   use_subtypes:`, useSubtypes);
                }
                return null;
            }

            // Select the best calculation for this fee
            const selectedCalc = this.selectBestCalculation(fee.fee_calculations, inputs);

            if (!selectedCalc) {
                const isInsideCity = fee.service_areas?.name === 'Inside City';
                if (isInsideCity) {
                    console.warn(`⚠️  [INSIDE CITY] No valid calculation found for fee: ${fee.name} (${fee.fee_calculations?.length || 0} calculations available, looking for meter: "${inputs.meterSize}")`);
                    if (fee.fee_calculations && fee.fee_calculations.length > 0) {
                        console.warn(`   Calculations:`, fee.fee_calculations.map((c: any) => ({
                            calc_type: c.calc_type,
                            applies_to_meter_sizes: c.applies_to_meter_sizes,
                            unit_label: c.unit_label,
                            formula_type: c.formula_type
                        })));
                    }
                } else {
                    console.warn(`⚠️  No valid calculation found for fee: ${fee.name} (${fee.fee_calculations?.length || 0} calculations available, looking for meter: "${inputs.meterSize}")`);
                    if (fee.fee_calculations && fee.fee_calculations.length > 0) {
                        console.warn(`   Calculations:`, fee.fee_calculations.map((c: any) => ({
                            calc_type: c.calc_type,
                            applies_to_meter_sizes: c.applies_to_meter_sizes,
                            unit_label: c.unit_label,
                            formula_type: c.formula_type
                        })));
                    }
                }
                return null;
            }

            return {
                ...fee,
                selectedCalculation: selectedCalc
            };
        }).filter(fee => fee !== null);

        const filtered = feesWithSelectedCalc;

        console.log(`✅ After filtering: ${filtered.length} applicable fees`);

        // Step 6: Deduplicate by fee name + service area
        const uniqueFees = filtered.reduce((acc, fee) => {
            const serviceAreaName = fee.service_areas?.name || 'Citywide';
            const key = `${fee.name}-${serviceAreaName}`;
            if (!acc.has(key)) {
                acc.set(key, fee);
            }
            return acc;
        }, new Map());

        const deduplicatedFees = Array.from(uniqueFees.values());
        console.log(`🔄 After deduplication: ${deduplicatedFees.length} unique fees (removed ${filtered.length - deduplicatedFees.length} duplicates)`);

        // Step 7: Remove duplicate impact fees (keep service-area-specific only)
        const withoutDuplicateImpactFees = deduplicatedFees.filter((fee: any, index: number, array: any[]) => {
            // If this is an impact fee
            if (fee.category === 'Impact Fees') {
                const isCitywide = !fee.service_areas?.name || fee.service_areas.name === 'CITYWIDE';

                // Check if there's a service-area version of the same fee
                const hasServiceAreaVersion = array.some((otherFee: any) =>
                    otherFee.name === fee.name &&
                    otherFee.service_areas?.name &&
                    otherFee.service_areas.name !== 'CITYWIDE' &&
                    otherFee.id !== fee.id
                );

                // If service area version exists and this is citywide, exclude it
                if (hasServiceAreaVersion && isCitywide) {
                    console.log(`🚫 Excluding duplicate citywide impact fee: ${fee.name} (service area version exists)`);
                    return false; // Exclude citywide impact fee
                }
            }

            return true; // Keep all other fees
        });

        console.log(`🎯 After removing duplicate impact fees: ${withoutDuplicateImpactFees.length} fees (removed ${deduplicatedFees.length - withoutDuplicateImpactFees.length} duplicate impact fees)`);

        // Step 8: Combine seasonal water volume charges into annual average
        const combinedSeasonalFees = this.combineSeasonalWaterCharges(withoutDuplicateImpactFees);
        console.log(`💧 After combining seasonal water charges: ${combinedSeasonalFees.length} fees`);

        // Map to the expected format using selectedCalculation
        return combinedSeasonalFees.map((fee: any) => {
            const calc = fee.selectedCalculation;
            const mapped: any = {
                feeId: fee.id,
                feeName: fee.name,
                agencyName: fee.agencies?.name || 'Unknown',
                serviceArea: fee.service_areas?.name || 'Citywide',
                category: fee.category,
                calcType: calc.calc_type,
                rate: calc.rate,
                unitLabel: calc.unit_label,
                minFee: calc.min_fee,
                maxFee: calc.max_fee,
                formulaDisplay: calc.formula_display,
                formulaConfig: calc.formula_config,
                formulaType: calc.formula_type,
                tiers: calc.tiers
            };

            // Preserve seasonal breakdown if present
            if (fee.seasonalBreakdown) {
                mapped.seasonalBreakdown = fee.seasonalBreakdown;
            }

            return mapped;
        });
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

        // Handle seasonal water volume charges
        if (fee.seasonalBreakdown) {
            if (!inputs.numUnits) return null;

            const winterMonths = 4; // Dec-Mar
            const springFallMonths = 4; // Apr-May, Oct-Nov
            const summerMonths = 4; // Jun-Sep

            const avgSeasonalWaterCharge = (
                (winterMonths * fee.seasonalBreakdown.low * inputs.numUnits) +
                (springFallMonths * fee.seasonalBreakdown.medium * inputs.numUnits) +
                (summerMonths * fee.seasonalBreakdown.high * inputs.numUnits)
            ) / 12;

            amount = avgSeasonalWaterCharge;
            calculation = `Annual average: $${amount.toFixed(2)}/month (Low: $${(fee.seasonalBreakdown.low * inputs.numUnits).toFixed(2)}, Medium: $${(fee.seasonalBreakdown.medium * inputs.numUnits).toFixed(2)}, High: $${(fee.seasonalBreakdown.high * inputs.numUnits).toFixed(2)})`;
            isRecurring = true;
            recurringPeriod = 'month';

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
                recurringPeriod,
                formulaType: fee.formulaType
            };
        }

        // Determine if this is a recurring fee
        const unitLabelLower = fee.unitLabel?.toLowerCase() || '';
        const categoryLower = fee.category?.toLowerCase() || '';
        const feeNameLower = fee.feeName?.toLowerCase() || '';

        if (unitLabelLower.includes('month') ||
            unitLabelLower.includes('per unit') ||
            categoryLower === 'monthly services' ||
            feeNameLower.includes('monthly') ||
            feeNameLower.includes('volume charge')) {
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

                // Note: Meter size filtering is now handled by selectBestCalculation
                // using applies_to_meter_sizes, so we don't need to check unitLabel here

                amount = (fee.rate || 0) * inputs.numUnits;
                calculation = `$${fee.rate} × ${inputs.numUnits} units = $${amount.toFixed(2)}`;

                // Add meter size to calculation if applicable
                if (fee.unitLabel && fee.unitLabel.includes('"')) {
                    calculation = `${fee.unitLabel}: ` + calculation;
                }
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
            recurringPeriod,
            formulaType: fee.formulaType
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
        report += 'IMPORTANT NOTES\n';
        report += '═'.repeat(70) + '\n';
        report += '- Fees shown are current as of October 2025\n';
        report += '- Impact fees are due at building permit issuance\n';
        report += '- Monthly operating costs begin at occupancy\n';
        report += '- Water volume charges vary seasonally (shown as annual average)\n';
        report += '- Sewer fees may be reviewed annually based on winter water usage\n';
        report += '- All fees subject to change - verify with jurisdiction before finalizing budgets\n';
        report += '- Does not include: building permit fees, plan review fees, or inspection fees\n';
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