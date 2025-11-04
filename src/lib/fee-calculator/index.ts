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
     * Select ONE appropriate meter size based on project characteristics
     * Returns a single meter size to prevent showing fees for multiple meter sizes
     */
    private selectAppropriateMeterSize(projectType: string, units?: number, sqft?: number): string {
        const projectTypeLower = projectType.toLowerCase();

        // For residential projects, select based on unit count
        if (projectTypeLower.includes('single-family') || projectTypeLower.includes('single family')) {
            return '3/4"'; // Standard single-family meter
        }

        if (projectTypeLower.includes('multi-family') || projectTypeLower.includes('multifamily') || projectTypeLower.includes('multi family')) {
            if (!units) return '2"'; // Default for multi-family
            if (units <= 4) return '3/4"';
            if (units <= 10) return '1"';
            if (units <= 25) return '1.5"';
            if (units <= 50) return '2"';
            if (units <= 100) return '3"';
            return '4"';
        }

        // For commercial/industrial, use square footage
        if (!sqft) return '2"'; // Default
        if (sqft <= 5000) return '1"';
        if (sqft <= 10000) return '1.5"';
        if (sqft <= 25000) return '2"';
        if (sqft <= 50000) return '3"';
        if (sqft <= 100000) return '4"';
        return '6"';
    }

    /**
     * Calculate all applicable fees for a project
     */
    async calculateFees(inputs: ProjectInputs): Promise<FeeBreakdown> {
        const startTime = Date.now();

        // Determine the single meter size to use
        // If user specified a meter size, use that; otherwise intelligently select one
        const effectiveMeterSize = inputs.meterSize || this.selectAppropriateMeterSize(
            inputs.projectType,
            inputs.numUnits,
            inputs.squareFeet
        );
        console.log(`🔧 [FeeCalculator] Using meter size: ${effectiveMeterSize} (${inputs.meterSize ? 'user-specified' : 'auto-selected'}) for ${inputs.projectType} (${inputs.numUnits || 'N/A'} units, ${inputs.squareFeet || 'N/A'} sqft)`);

        const fetchStartTime = Date.now();
        const result = await this.getApplicableFees(inputs);
        console.log(`⏱️  [FeeCalculator] getApplicableFees: ${Date.now() - fetchStartTime}ms`);

        const applicableFees = result.fees;
        const totalFeesFetched = result.totalFeesFetched;
        const calculatedFees: CalculatedFee[] = [];

        console.log(`💰 Calculating amounts for ${applicableFees.length} fees...`);
        console.log(`📊 Total fees fetched from DB: ${totalFeesFetched}`);

        console.log('\n=== NASHVILLE DEBUG ===');
        console.log('Total applicable fees:', applicableFees.length);
        console.log('Fees with calc_type per_unit:', applicableFees.filter(f => f.calcType === 'per_unit').length);
        console.log('Fees with calc_type flat_fee:', applicableFees.filter(f => f.calcType === 'flat_fee').length);

        applicableFees.forEach(fee => {
          if (fee.feeName.includes('Tap')) {
            console.log(`\nFee: ${fee.feeName}`);
            console.log(`  calcType: ${fee.calcType}`);
            console.log(`  rate: ${fee.rate}`);
            console.log(`  calculatedAmount: ${fee.calculatedAmount}`);
            console.log(`  isRecurring: ${fee.isRecurring}`);
          }
        });

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

        const totalDuration = Date.now() - startTime;
        console.log(`⏱️  [FeeCalculator] Total calculateFees duration: ${totalDuration}ms`);

        return {
            oneTimeFees,
            monthlyFees,
            annualOperatingCosts,
            firstYearTotal,
            fees: displayableFees,
            byCategory,
            byAgency,
            project: inputs,
            totalFeesFetched, // Total fees from DB for selected service area
            applicableFeesCount: displayableFees.length // Fees that apply to this project
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

            // CRITICAL: Check square footage tier applicability
            if (inputs.squareFeet) {
                if (calc.min_sqft !== null && calc.min_sqft !== undefined && inputs.squareFeet < calc.min_sqft) {
                    return false;
                }
                if (calc.max_sqft !== null && calc.max_sqft !== undefined && inputs.squareFeet > calc.max_sqft) {
                    return false;
                }
            }

            // CRITICAL: Check unit count tier applicability
            if (inputs.numUnits) {
                if (calc.min_units !== null && calc.min_units !== undefined && inputs.numUnits < calc.min_units) {
                    return false;
                }
                if (calc.max_units !== null && calc.max_units !== undefined && inputs.numUnits > calc.max_units) {
                    return false;
                }
            }

            // CRITICAL: Check project value tier applicability
            if (inputs.projectValue) {
                if (calc.min_valuation !== null && calc.min_valuation !== undefined && inputs.projectValue < calc.min_valuation) {
                    return false;
                }
                if (calc.max_valuation !== null && calc.max_valuation !== undefined && inputs.projectValue > calc.max_valuation) {
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

    private async getApplicableFees(inputs: ProjectInputs): Promise<{fees: any[], totalFeesFetched: number}> {
        // Step 1: Get jurisdiction ID - try exact match first
        let { data: jurisdiction, error: jurError } = await this.supabase
            .from('jurisdictions')
            .select('id, jurisdiction_name')
            .eq('jurisdiction_name', inputs.jurisdictionName)
            .eq('state_code', inputs.stateCode)
            .single();

        // If exact match fails, try fuzzy match (e.g., "Phoenix" -> "Phoenix city")
        if (jurError || !jurisdiction) {
            console.log(`🔍 Exact match failed for "${inputs.jurisdictionName}", trying fuzzy match...`);
            const { data: fuzzyResults } = await this.supabase
                .from('jurisdictions')
                .select('id, jurisdiction_name')
                .ilike('jurisdiction_name', `${inputs.jurisdictionName}%`)
                .eq('state_code', inputs.stateCode);

            if (fuzzyResults && fuzzyResults.length > 0) {
                jurisdiction = fuzzyResults[0];
                console.log(`✅ Fuzzy match found: "${inputs.jurisdictionName}" -> "${jurisdiction.jurisdiction_name}"`);
            }
        }

        if (!jurisdiction) {
            throw new Error(`Jurisdiction not found: ${inputs.jurisdictionName}, ${inputs.stateCode}`);
        }

        // Step 2: Get fee IDs that match our service area criteria from fees table
        let feeIdsQuery = this.supabase
            .from('fees')
            .select('id, service_area_id')
            .eq('jurisdiction_id', jurisdiction.id)
            .eq('is_active', true);

        // Step 3: Filter by service area IDs
        let selectedServiceAreaIds = inputs.selectedServiceAreaIds || [];
        console.log('🔍 Selected service area IDs:', selectedServiceAreaIds);

        // CRITICAL: Portland-specific default service area
        // Portland has geographic service areas (Central City vs Non-Central City)
        // When no service area is selected, default to "Non-Central City" which covers most of Portland
        if (selectedServiceAreaIds.length === 0 &&
            inputs.jurisdictionName === 'Portland' &&
            inputs.stateCode === 'OR') {

            const { data: nonCentralCity } = await this.supabase
                .from('service_areas')
                .select('id')
                .eq('jurisdiction_id', jurisdiction.id)
                .eq('name', 'Non-Central City')
                .single();

            if (nonCentralCity) {
                selectedServiceAreaIds = [nonCentralCity.id];
                console.log('🔍 Portland: Auto-selected "Non-Central City" service area (default)');
            }
        }

        // Check if this jurisdiction actually has service areas in the service_areas table
        const { data: serviceAreasCheck } = await this.supabase
            .from('service_areas')
            .select('id')
            .eq('jurisdiction_id', jurisdiction.id)
            .limit(1);

        const hasServiceAreasTable = serviceAreasCheck && serviceAreasCheck.length > 0;
        console.log('🔍 Service areas table check:', hasServiceAreasTable ? 'HAS service areas' : 'NO service areas table');

        // Check for "Citywide" service area - some jurisdictions (like Nashville) have a named
        // "Citywide" service area instead of using service_area_id = null
        if (selectedServiceAreaIds.length > 0 && hasServiceAreasTable) {
            const { data: citywideArea } = await this.supabase
                .from('service_areas')
                .select('id')
                .eq('jurisdiction_id', jurisdiction.id)
                .eq('name', 'Citywide')
                .single();

            if (citywideArea && !selectedServiceAreaIds.includes(citywideArea.id)) {
                selectedServiceAreaIds.push(citywideArea.id);
                console.log('🔍 Found "Citywide" service area - including in query:', citywideArea.id);
            }
        }

        if (selectedServiceAreaIds.length === 0) {
            if (hasServiceAreasTable) {
                // CRITICAL FIX: When no service areas selected, include ALL fees
                // This prevents important fees (like Austin Street Impact Fees) from being hidden
                // NOTE: This may show duplicate fees for different service areas - deduplication happens later
                console.log('📍 Query: ALL fees (no service areas selected - including all citywide and service-area-specific fees)');
            } else {
                // No service areas table exists - include ALL fees (data integrity issue)
                console.log('📍 Query: ALL fees (no service_areas table found - including orphaned service_area_ids)');
            }
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
        // Batch the query to avoid URL length limits with large fee lists
        const BATCH_SIZE = 100;
        const allFees: any[] = [];

        for (let i = 0; i < feeIds.length; i += BATCH_SIZE) {
            const batch = feeIds.slice(i, i + BATCH_SIZE);
            console.log(`📦 Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(feeIds.length / BATCH_SIZE)} (${batch.length} fees)`);

            const { data: batchFees, error } = await this.supabase
                .from('fees')
                .select(`
                    id,
                    name,
                    description,
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
                .in('id', batch.map(f => f.id));

            if (error) throw new Error(`Database error: ${error.message}`);
            if (batchFees) {
                allFees.push(...batchFees);
            }
        }

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

        // Debug: Check if park fees are in the fetched results
        const parkFeesInFetch = allFees.filter((f: any) => (f.name || '').toLowerCase().includes('park fee'));
        console.log(`🌳 Park fees in fetch: ${parkFeesInFetch.length}`);

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
        console.log('='.repeat(80));
        console.log(`📊 STARTING FEE FILTERING - Total fees fetched: ${allFees.length}`);
        console.log('='.repeat(80));

        // Step 5: Select best calculation for each fee and filter by project type/subtype
        const feesWithSelectedCalc = allFees.map((fee: any) => {
            const appliesTo = fee.applies_to || [];
            const useSubtypes = fee.use_subtypes || [];
            const feeName = fee.name || '';
            const feeNameLower = feeName.toLowerCase();
            const categoryLower = (fee.category || '').toLowerCase();


            // CRITICAL: LA-SPECIFIC Filter by name patterns for residential and commercial projects
            // Only apply this aggressive filtering for Los Angeles
            if (inputs.jurisdictionName === 'Los Angeles' &&
                ((inputs.projectType === 'Residential' && inputs.useSubtype === 'Single Family') ||
                inputs.projectType === 'Commercial')) {
                // Exclude fees that are clearly not for single-family residential
                const residentialExclusions = [
                    'High Rise', 'High-Rise',
                    'Place of Assembly',
                    'Amusement Building',
                    'Explosive', 'Blasting',
                    'Mobile Home Park', 'Trailer Park',
                    'Multi-Family', 'Multifamily', 'Multi-family',
                    'Townhouse', 'Apartment', 'Duplex', 'Triplex', 'Fourplex',
                    'Commercial Kitchen',
                    'Industrial',
                    'Wireless Facility',
                    'Distributed Antenna System',
                    'Solar Panel Permit', // These need specific project type
                    'Temporary Membrane', 'Tent', 'Canopy',
                    'Pretreatment Program', // Commercial/industrial sewer
                    'Unauthorized Manhole', // Not applicable to new construction
                    'Hourly Plan Review', // Not a standard fee
                    'Expedited', // Optional service
                    'Condominium', // Different from single family
                    'Identical Plan', // Not standard
                    'Renewing expired',
                    'Re-inspection', // Optional/penalty fee
                    'Reinspection',
                    'Recreation park', // Not residential
                    'Special industrial', 'commercial uses',
                    'Temporary sewer',
                    // New construction exclusions
                    'Boarding', 'Boarded',
                    'Vacant', 'Vacancy',
                    'Abatement',
                    'Violation',
                    'Code Enforcement',
                    // Temporary construction permits (not ongoing fees)
                    'Public Way Obstruction',
                    'Bike Lane closure',
                    'Sidewalk closure',
                    'Travel Lane closure',
                    // In-Lieu fees (not for new construction)
                    'In-Lieu Fee',
                    'In-Lieu'
                    // NOTE: Park fees removed from exclusions - they should show for residential projects
                ];

                const shouldExclude = residentialExclusions.some(ex => feeName.includes(ex));
                if (shouldExclude) {
                    return null;
                }

                // For residential, only include fees with these relevant keywords OR utility/impact fees
                const residentialKeywords = [
                    'Residential', 'Single Family', 'Dwelling Unit', 'Dwelling',
                    'Building Permit', 'Building Plan', 'Building Fee',
                    'Water Connection', 'Sewer Connection', 'Water Service', 'Meter Installation',
                    'Sewer Charge', 'Sewer Service Charge', 'Monthly Service Fee', 'Monthly Water', 'Base Charge', // Monthly operating fees
                    'Storm Water', 'Storm Drain',
                    'Impact', // Include all impact fees
                    'Capacity Charge',
                    'Plumbing Permit', 'Electrical Permit', 'Mechanical Permit',
                    'Inspection Fee', 'Plan Review Fee',
                    'ERU', // Equivalent Residential Unit
                    'All Other Users', // Catch-all category for residential
                    // Los Angeles specific fees
                    'Affordable Housing', 'Housing Linkage', 'Linkage Fee',
                    'Grading', 'Demolition',
                    'Certificate of Occupancy',
                    'Testing Fee', 'Inspection',
                    'Street Damage', 'SDRF',
                    'Ministerial Review', 'SB 9',
                    'Planning Application', 'lot split',
                    'Quimby Fee', 'Park Fee',
                    'Infrastructure Charges', 'Sewer +',
                    'CDP Fee', 'Hillside', 'JEDI Zone'
                ];

                const isUtilityOrImpactFee = fee.category === 'Water/Sewer Connection' ||
                                            fee.category === 'Water Services' ||
                                            fee.category === 'Sewer Services' ||
                                            fee.category === 'Impact Fees' ||
                                            categoryLower.includes('impact');

                const hasRelevantKeyword = residentialKeywords.some(keyword =>
                    feeName.toLowerCase().includes(keyword.toLowerCase())
                );

                // Debug: Log ALL park fees to see if they reach keyword check
                if (feeName.toLowerCase().includes('park fee')) {
                    console.log(`🔍 Keyword check for: "${feeName}"`);
                    console.log(`   hasRelevantKeyword: ${hasRelevantKeyword}, isUtilityOrImpactFee: ${isUtilityOrImpactFee}`);
                    if (!hasRelevantKeyword && !isUtilityOrImpactFee) {
                        console.log(`   ❌ FILTERED OUT by keyword check`);
                    } else {
                        console.log(`   ✅ PASSED keyword check`);
                    }
                }

                // Only include if it has relevant keywords OR is a utility/impact fee
                if (!hasRelevantKeyword && !isUtilityOrImpactFee) {
                    return null;
                }
            }

            // Check if fee applies to project type AND subtype (STRICT matching on BOTH)
            const typeMatches = this.feeAppliesToProject(appliesTo, useSubtypes, inputs.projectType, inputs.useSubtype, feeName, inputs.numUnits);
            const subtypeMatches = true; // Now handled inside feeAppliesToProject

            // CRITICAL: Exclude Commercial/Multi-Residential fees for Single-Family projects (Denver pattern)
            // Fee names like "Sewer Permit Fee - Commercial/Multi-Residential" should not match Single Family
            if (inputs.useSubtype === 'Single Family' &&
                (feeNameLower.includes('commercial') || feeNameLower.includes('multi-residential'))) {
                // This fee is for commercial or multi-family, not single-family
                return null;
            }

            // CRITICAL: Exclude specialty overlay district fees when user hasn't selected service areas
            // These are fees that only apply in specific overlay zones (North Burnet, University Neighborhood, etc.)
            if (selectedServiceAreaIds.length === 0) {
                const isOverlayDistrictFee = feeNameLower.includes('north burnet') ||
                    feeNameLower.includes('university neighborhood overlay') ||
                    feeNameLower.includes('planned unit development') ||
                    feeNameLower.includes('pud') ||
                    feeNameLower.includes('rainey street') ||
                    feeNameLower.includes('density bonus - fee in lieu');

                if (isOverlayDistrictFee) {
                    return null;
                }

                // CRITICAL: Exclude community-specific development impact fees (San Diego pattern)
                // When user hasn't selected a service area, only show citywide fees
                const serviceAreaName = fee.service_areas?.name?.toLowerCase() || '';
                const isCommunitySpecificFee = feeNameLower.includes('community development impact fee') ||
                    (serviceAreaName && serviceAreaName !== 'citywide' && serviceAreaName !== 'inside city');

                // Only exclude if this is truly a community-specific fee (not citywide)
                if (isCommunitySpecificFee && serviceAreaName && serviceAreaName !== 'citywide') {
                    return null;
                }
            }

            // CRITICAL: Exclude conditional/optional fees that don't apply to standard projects
            // These fees only apply in specific circumstances or are voluntary programs
            const isConditionalFee = feeNameLower.includes('project consent agreement') ||
                feeNameLower.includes('volume builder') ||
                feeNameLower.includes('expedited') ||
                feeNameLower.includes('after hours') ||
                feeNameLower.includes('reinspection') ||
                feeNameLower.includes('re-inspection');

            if (isConditionalFee) {
                return null;
            }


            // CRITICAL: Name-based filtering for fees with housing types in name but null use_subtypes
            // (Austin/San Diego pattern: fee name contains housing type specification)
            if (inputs.useSubtype === 'Single Family' && useSubtypes.length === 0) {
                // Check if fee name contains a housing type specification
                const hasHousingTypeInName = feeNameLower.includes('single family') ||
                    feeNameLower.includes('single-family') ||
                    feeNameLower.includes('senior housing') ||  // San Diego: exclude senior housing from single-family
                    feeNameLower.includes('duplex') ||
                    feeNameLower.includes('triplex') ||
                    feeNameLower.includes('fourplex') ||
                    feeNameLower.includes('townhouse') ||
                    feeNameLower.includes('condominium') ||
                    feeNameLower.includes('multifamily') ||
                    feeNameLower.includes('multi-family') ||
                    feeNameLower.includes('multiple family') ||  // Portland: "Multiple Family"
                    feeNameLower.includes('high-rise') ||
                    feeNameLower.includes('mobile home') ||
                    feeNameLower.includes('garage apartment') ||
                    feeNameLower.includes('adu');

                if (hasHousingTypeInName) {
                    // Only include if name contains "single family", "single-family", or "single-family home"
                    if (!feeNameLower.includes('single family') &&
                        !feeNameLower.includes('single-family home') &&
                        !feeNameLower.includes('single-family')) {
                        return null;
                    }
                }
            }

            // CRITICAL: Name-based exclusions for specific unit count fees
            // If user selects "Single Family", exclude fees that explicitly target multi-unit
            if (inputs.useSubtype === 'Single Family') {
                if (feeName.includes('2-5 units') ||
                    feeName.includes('6 or more units') ||
                    feeName.includes('6+ units') ||
                    (feeName.includes('Multifamily') && !feeName.includes('Single'))) {
                    return null;
                }
            }

            // CRITICAL: Name-based exclusions for Multi-Family projects (Denver pattern)
            // System Development Charges have specific project types in names:
            // - "System Development Charge - Multifamily Residential" ✓
            // - "System Development Charge - Single-Family Residential" ❌
            // - "System Development Charge - Accessory Dwelling Unit" ❌
            // These all have applies_to: ['Residential'] so we filter by name
            if (inputs.projectType === 'Multi-Family Residential' || inputs.useSubtype === 'Multifamily') {
                // Exclude fees specifically for single-family or ADU
                if ((feeNameLower.includes('single-family') || feeNameLower.includes('single family')) &&
                    !feeNameLower.includes('multifamily') &&
                    !feeNameLower.includes('multi-family')) {
                    return null;
                }
                if (feeNameLower.includes('accessory dwelling unit') || feeNameLower.includes('adu')) {
                    return null;
                }
            }

            // CRITICAL: Tier filtering based on fee name patterns
            // Many fees (especially demolition permits) have tiered pricing based on square footage
            // encoded in the fee name (e.g., "Demolition Permit - 10,001 - 12,000 sq. feet")
            // We need to filter out tiers that don't match the project's parameters
            if (inputs.squareFeet) {
                const feeNameLowerForTier = feeName.toLowerCase();

                // Match range patterns like "10,001 - 12,000 sq", "2451-2500 SF", "10001-12000 sq"
                const sqftRangePattern = /([\d,]+)\s*[-–]\s*([\d,]+)\s*(?:sq|SF)/i;
                const rangeMatch = feeName.match(sqftRangePattern);

                if (rangeMatch) {
                    const minSqft = parseInt(rangeMatch[1].replace(/,/g, ''));
                    const maxSqft = parseInt(rangeMatch[2].replace(/,/g, ''));

                    // Filter out this fee if project square footage is outside this tier
                    if (inputs.squareFeet < minSqft || inputs.squareFeet > maxSqft) {
                        return null;
                    }
                }

                // Match "X+" or "X+ SF" patterns (e.g., "2501+ SF", "2501+")
                const plusPattern = /([\d,]+)\+\s*(?:SF|sq)?/i;
                const plusMatch = feeName.match(plusPattern);

                if (plusMatch) {
                    const minSqft = parseInt(plusMatch[1].replace(/,/g, ''));

                    // Filter out if project is below this minimum
                    if (inputs.squareFeet < minSqft) {
                        return null;
                    }
                }

                // Match "over X", "above X", or "X or more" patterns
                const overPattern = /(?:over|above)\s+([\d,]+)|([\d,]+)\s+(?:square feet\s+)?or more/i;
                const overMatch = feeName.match(overPattern);

                if (overMatch) {
                    const minSqft = parseInt((overMatch[1] || overMatch[2]).replace(/,/g, ''));

                    // Filter out if project is below this minimum
                    // "X or more" means >= X, so filter if < X
                    if (inputs.squareFeet < minSqft) {
                        return null;
                    }
                }

                // Match "under X", "below X", "up to X", "less than X", or "X or less" patterns
                const underPattern = /(?:under|below|up to|less than)\s+([\d,]+)|([\d,]+)\s+(?:square feet\s+)?or less/i;
                const underMatch = feeName.match(underPattern);

                if (underMatch) {
                    const maxSqft = parseInt((underMatch[1] || underMatch[2]).replace(/,/g, ''));

                    // Filter out if project is above this maximum
                    // "Less than X" means < X, so filter if >= X
                    if (inputs.squareFeet >= maxSqft) {
                        return null;
                    }
                }
            }

            // CRITICAL: Water/Sewer meter size filtering
            // Water/Sewer meter fees often have the meter size in the fee name
            // Patterns:
            //   - "Water Service and Meter Installation Fee - 3/4 inch"
            //   - "Water Meter Installation - 3/4-inch meter"
            //   - "System Development Charges by Meter Size - 3/4"" (Portland)
            //   - "Sewer Service Fee - 1 inch meter"
            //   - "Monthly Water Service - 3/4""
            if ((feeNameLower.includes('water') || feeNameLower.includes('sewer')) &&
                (feeNameLower.includes('meter') || feeNameLower.includes('service') || feeNameLower.includes('by meter size') || feeNameLower.includes('meter size'))) {

                // Check if fee name contains a meter size specification
                // Pattern supports: "3/4 inch", "3/4-inch", "1 1/2 inch", "1 1/2-inch", '3/4"'
                const meterSizePattern = /(\d+(?:\s*\d+\/\d+|\s+\d+\/\d+|\/\d+)?)\s*-?\s*(?:inch|"|\')/i;
                const feeMatch = feeName.match(meterSizePattern);

                if (feeMatch) {
                    // This fee has a specific meter size in the name
                    const feeMeterSize = feeMatch[1].trim();

                    // Get the single appropriate meter size
                    const appropriateMeterSize = inputs.meterSize || this.selectAppropriateMeterSize(
                        inputs.projectType,
                        inputs.numUnits,
                        inputs.squareFeet
                    );

                    // Normalize meter sizes for comparison (remove quotes, spaces)
                    const normalizedFeeMeterSize = feeMeterSize.replace(/["'\s]/g, '');
                    const normalizedAppropriateMeterSize = appropriateMeterSize.replace(/["'\s]/g, '');

                    // Check if this fee's meter size matches the appropriate size
                    const meterMatches = normalizedFeeMeterSize === normalizedAppropriateMeterSize;

                    // Filter out fees that don't match the appropriate meter size
                    if (!meterMatches) {
                        console.log(`🚫 [MeterFilter] Filtered out "${fee.name}" - meter size ${feeMeterSize} does not match ${appropriateMeterSize}`);
                        return null;
                    } else {
                        console.log(`✅ [MeterFilter] Included "${fee.name}" - meter size ${feeMeterSize} matches ${appropriateMeterSize}`);
                    }
                }
            }

            // CRITICAL: Sewer tap size filtering (Denver pattern)
            // Fees like "Sewer Permit Fee - Commercial/Multi-Residential (3/4" Tap)"
            // These have specific tap sizes and should only show if user provides tap size
            // For general Multi-Family, show only "Residential (per unit)" fee
            if (feeNameLower.includes('sewer') && feeNameLower.includes('tap')) {
                const tapSizePattern = /\((\d+(?:\/\d+)?(?:\.\d+)?)"?\s*Tap\)/i;
                const feeMatch = feeName.match(tapSizePattern);

                if (feeMatch) {
                    // This fee has a specific tap size
                    const feeTapSize = feeMatch[1].trim();

                    // Get the single appropriate meter size
                    const appropriateMeterSize = inputs.meterSize || this.selectAppropriateMeterSize(
                        inputs.projectType,
                        inputs.numUnits,
                        inputs.squareFeet
                    );

                    // Normalize tap sizes for comparison (remove quotes, spaces)
                    const normalizedFeeTapSize = feeTapSize.replace(/["'\s]/g, '');
                    const normalizedAppropriateMeterSize = appropriateMeterSize.replace(/["'\s]/g, '');

                    // Check if this fee's tap size matches the appropriate size
                    const tapMatches = normalizedFeeTapSize === normalizedAppropriateMeterSize;

                    // Filter out fees that don't match the appropriate tap size
                    if (!tapMatches) {
                        console.log(`🚫 [TapFilter] Filtered out "${fee.name}" - tap size ${feeTapSize} does not match ${appropriateMeterSize}`);
                        return null;
                    } else {
                        console.log(`✅ [TapFilter] Included "${fee.name}" - tap size ${feeTapSize} matches ${appropriateMeterSize}`);
                    }
                }
            }

            // CRITICAL: Stormwater tier filtering for multi-family
            // For multifamily >4 units, use only "Small Residential" tier
            // Filter out all other tiers like "Single Family", "Medium Residential", "Large Residential"
            if (feeNameLower.includes('stormwater')) {
                const isMultiFamily = inputs.projectType.toLowerCase().includes('multi-family') ||
                                     inputs.projectType.toLowerCase().includes('multifamily') ||
                                     inputs.projectType.toLowerCase().includes('multi family');
                const hasMultipleUnits = inputs.numUnits && inputs.numUnits > 4;

                if (isMultiFamily && hasMultipleUnits) {
                    // For multi-family >4 units, ONLY include "Small Residential" stormwater tier
                    const isSmallResidential = feeNameLower.includes('small residential');
                    const isSingleFamily = feeNameLower.includes('single family');
                    const isMediumResidential = feeNameLower.includes('medium residential');
                    const isLargeResidential = feeNameLower.includes('large residential');

                    // Filter out all tiers except Small Residential
                    if (isSingleFamily || isMediumResidential || isLargeResidential) {
                        console.log(`🚫 [StormwaterFilter] Filtered out "${fee.name}" - wrong tier for multi-family ${inputs.numUnits} units (need Small Residential)`);
                        return null;
                    }

                    // Only keep Small Residential
                    if (!isSmallResidential && (feeNameLower.includes('tier') || feeNameLower.includes('residential'))) {
                        console.log(`🚫 [StormwaterFilter] Filtered out "${fee.name}" - not Small Residential tier`);
                        return null;
                    }
                }
            }

            // CRITICAL: Filter water volume rates by service area (Denver pattern)
            // Fees like "Treated Water Volume Rate - Residential Tier 1 (Outside City - Read & Bill)"
            // These are citywide fees with service area in the name - filter by name matching
            if (selectedServiceAreaIds.length > 0 &&
                feeNameLower.includes('water') && feeNameLower.includes('rate') &&
                (feeNameLower.includes('volume') || feeNameLower.includes('tier'))) {
                // Extract service area from fee name
                const serviceAreaPattern = /\((Inside (?:City of )?Denver|Outside (?:City|Denver)[^)]*)\)/i;
                const serviceAreaMatch = feeName.match(serviceAreaPattern);

                // If fee has service area in name, check if it matches user's selection
                if (serviceAreaMatch) {
                    const feeServiceAreaName = serviceAreaMatch[1].toLowerCase();

                    // Check against inputs.selectedServiceAreaIds
                    // We need to match "Inside Denver" or "Inside City of Denver"
                    const matchesSelection = feeServiceAreaName.includes('inside');

                    if (!matchesSelection) {
                        return null;
                    }
                }
            }

            // CRITICAL: Filter out future-dated fees
            // Patterns: "- 2027", "(Jan-Jun 2026)", "(Jul 2026 onwards)"
            const futureYearPatterns = [
                /\s+-\s+(\d{4})\s*$/,                           // "- 2027"
                /\((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*(\d{4})[^)]*\)/i,  // "(Jan-Jun 2026)"
                /\(.*?(\d{4})\s+onwards\)/i                     // "(Jul 2026 onwards)"
            ];

            for (const pattern of futureYearPatterns) {
                const match = feeName.match(pattern);
                if (match) {
                    const feeYear = parseInt(match[1]);
                    const currentYear = new Date().getFullYear();

                    // Allow monthly utility charges for next year (2026) since those are approved future rates
                    const isMonthlyUtility = feeNameLower.includes('monthly utility charge');
                    const maxAllowedYear = isMonthlyUtility ? currentYear + 1 : currentYear;

                    if (feeYear > maxAllowedYear) {
                        return null;
                    }
                }
            }

            // CRITICAL: Filter out "Irrigation Only" fees for non-irrigation projects (Denver pattern)
            if (feeNameLower.includes('irrigation only') && inputs.projectType !== 'Irrigation') {
                return null;
            }

            // CRITICAL: Affordable housing fee filtering by unit count
            // Affordable housing fees often specify unit counts in the name
            // (e.g., "single-family", "2-5 units", "6 or more units")
            if (inputs.numUnits && feeNameLower.includes('affordable') && feeNameLower.includes('housing')) {
                const isSingleFamily = inputs.useSubtype === 'Single Family' || inputs.numUnits === 1;

                if (isSingleFamily) {
                    // For single family, exclude fees that target multi-unit
                    if (feeNameLower.includes('2-5 units') ||
                        feeNameLower.includes('6 or more units') ||
                        feeNameLower.includes('multi-family') ||
                        feeNameLower.includes('multifamily')) {
                        return null;
                    }
                } else if (inputs.numUnits >= 2 && inputs.numUnits <= 5) {
                    // For 2-5 units, only show that tier
                    if (!feeNameLower.includes('2-5 units') &&
                        !feeNameLower.includes('2 to 5 units')) {
                        return null;
                    }
                } else if (inputs.numUnits >= 6) {
                    // For 6+ units, only show that tier
                    if (!feeNameLower.includes('6 or more units') &&
                        !feeNameLower.includes('6+ units') &&
                        !feeNameLower.includes('multi-family') &&
                        !feeNameLower.includes('multifamily')) {
                        return null;
                    }
                }
            }

            // CRITICAL: Park fee filtering - subdivision vs non-subdivision
            // Only one park fee type should apply
            if (feeNameLower.includes('park fee')) {
                // For now, prefer non-subdivision for standard projects
                // User can add a flag later if they want subdivision fees
                const isSubdivision = feeNameLower.includes('subdivision');
                const isNonSubdivision = feeNameLower.includes('non-subdivision');

                console.log(`🔍 Park fee: "${feeName}" - isSubdiv: ${isSubdivision}, isNonSubdiv: ${isNonSubdivision}`);

                // Exclude subdivision fees by default (most single-family projects are not subdivisions)
                if (isSubdivision && !isNonSubdivision) {
                    console.log(`   ❌ Excluding subdivision fee`);
                    return null;
                }
                console.log(`   ✅ Keeping park fee`);
            }

            // CRITICAL: Affordable Housing Linkage Fee tier filtering (Denver pattern)
            // Tiers: "Small Units (≤1,600 SF)", "Large Units (>1,600 SF)", "Other Uses"
            if (feeNameLower.includes('affordable housing linkage') && inputs.squareFeet) {
                const avgSqftPerUnit = inputs.numUnits ? inputs.squareFeet / inputs.numUnits : inputs.squareFeet;

                // Extract square footage threshold from fee name
                const smallUnitPattern = /Small Units.*?≤\s*(\d+,?\d*)\s*SF/i;
                const largeUnitPattern = /Large Units.*?>\s*(\d+,?\d*)\s*SF/i;

                const smallMatch = feeName.match(smallUnitPattern);
                const largeMatch = feeName.match(largeUnitPattern);

                if (smallMatch) {
                    const threshold = parseInt(smallMatch[1].replace(/,/g, ''));
                    // This is Small Units tier - only show if unit size is ≤ threshold
                    if (avgSqftPerUnit > threshold) {
                        return null;
                    }
                } else if (largeMatch) {
                    const threshold = parseInt(largeMatch[1].replace(/,/g, ''));
                    // This is Large Units tier - only show if unit size is > threshold
                    if (avgSqftPerUnit <= threshold) {
                        return null;
                    }
                } else if (feeNameLower.includes('other uses')) {
                    // "Other Uses" is for commercial, not residential
                    if (inputs.projectType === 'Residential') {
                        return null;
                    }
                }
            }

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

            // Debug: Log if park fee doesn't have a calculation
            if (feeName.toLowerCase().includes('park fee') && !selectedCalc) {
                console.log(`❌ Park fee "${feeName}" has no valid calculation`);
            }

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

        // Debug: Check if park fees made it through
        const parkFeesFiltered = filtered.filter((f: any) => f?.name?.toLowerCase().includes('park fee'));
        console.log(`🌳 Park fees after filtering: ${parkFeesFiltered.length}`);
        parkFeesFiltered.forEach((f: any) => console.log(`   - ${f.name}`));

        // Step 6: Deduplicate by fee name + service area, preferring more specific use_subtype matches
        // and most recent effective dates
        const uniqueFees = filtered.reduce((acc, fee) => {
            const serviceAreaName = fee.service_areas?.name || 'Citywide';

            // For fees with dates in the name (e.g., "Sewer Charge (July 2028)", "Inclusionary Fee - July 1, 2025 and after"),
            // remove the date part from the key so they're treated as duplicates
            let baseFeeName = fee.name
                // Remove dates in parentheses: "(July 2028)", "(October 2024)"
                .replace(/\s*\([^)]*\d{4}[^)]*\)\s*$/i, '')
                // Remove date ranges with hyphens: " - July 1, 2024 - June 30, 2025", " - July 1, 2025 and after", " - 2026", " - 2027"
                .replace(/\s*-\s*(January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{1,2}?,?\s*\d{4}(\s+(and after|-\s*[A-Za-z]+\s+\d{1,2},\s*\d{4}))?\s*$/i, '')
                // Remove simple year suffixes: " - 2026", " - 2027"
                .replace(/\s*-\s*\d{4}\s*$/i, '')
                // Remove "Prior to" date patterns: " - Prior to July 1, 2020"
                .replace(/\s*-\s*Prior to\s+[A-Za-z]+\s+\d{1,2},?\s*\d{4}\s*$/i, '')
                .trim();

            // CRITICAL: For fees with service area names in the fee name (Austin pattern),
            // remove service area suffixes to treat them as duplicates and prefer lower cost
            // Examples: "Street Impact Fee - Single Family - Inner Loop" -> "Street Impact Fee - Single Family"
            //           "Parkland Dedication Fee In-Lieu - Single-Family Residential Low Density" -> base name
            baseFeeName = baseFeeName
                .replace(/\s*-\s*(Inner Loop|Outer Loop|Central Business District|North Burnet Gateway.*|University Neighborhood.*|Rainey Street|Citywide.*)\s*$/i, '')
                .trim();

            // For water meter fees with variants (e.g., "Water Service - 1 inch Regular", "Water Service - 1 inch Intermediate"),
            // remove the variant suffix so they're treated as duplicates
            if (baseFeeName.toLowerCase().includes('water') &&
                (baseFeeName.toLowerCase().includes('meter') || baseFeeName.toLowerCase().includes('service'))) {
                baseFeeName = baseFeeName.replace(/\s+(Regular|Intermediate|Standard|Non-Standard|Equivalent)\s*$/i, '').trim();
            }

            // For park fees, normalize zone/project type variants to deduplicate
            // Keep only one park fee per jurisdiction (prefer specific zones over generic "All Other Zones")
            let normalizedServiceArea = serviceAreaName;
            if (baseFeeName.toLowerCase().includes('park fee')) {
                // Normalize to just "Park Fee" so all variants dedupe together
                baseFeeName = 'Park Fee';
                // Also normalize service area to "CITYWIDE" so all park fees dedupe together
                normalizedServiceArea = 'CITYWIDE';
            }

            // CRITICAL: For fees with service area in the NAME (Austin pattern),
            // normalize service area to "CITYWIDE" so they dedupe together
            // Example: "Street Impact Fee - Single Family - Inner Loop" (serviceArea="Inner Loop")
            //          and "Street Impact Fee - Single Family - Outer Loop" (serviceArea="Outer Loop")
            //          should dedupe to show only one (the lower cost)
            if (fee.name?.match(/Inner Loop|Outer Loop|Central Business District|North Burnet|University Neighborhood|Rainey Street/i)) {
                normalizedServiceArea = 'CITYWIDE';
            }

            const key = `${baseFeeName}-${normalizedServiceArea}`;

            const existing = acc.get(key);
            if (!existing) {
                acc.set(key, fee);
            } else {
                // CRITICAL: For service area variants (Austin pattern), prefer LOWER cost
                // This ensures we show conservative estimates when user doesn't specify location
                const hasServiceAreaInName = fee.name?.match(/Inner Loop|Outer Loop|Central Business District/i);
                if (hasServiceAreaInName) {
                    const existingRate = existing.selectedCalculation?.rate || 0;
                    const feeRate = fee.selectedCalculation?.rate || 0;

                    if (feeRate < existingRate) {
                        console.log(`🔄 Replacing higher-cost service area variant "${existing.name}" ($${existingRate}) with lower-cost "${fee.name}" ($${feeRate})`);
                        acc.set(key, fee);
                        return acc;
                    }
                }

                // CRITICAL: For water meter variants, prefer "Regular" over other types
                const isWaterMeter = fee.name?.toLowerCase().includes('water') &&
                                    (fee.name?.toLowerCase().includes('meter') || fee.name?.toLowerCase().includes('service'));

                if (isWaterMeter) {
                    const existingVariant = existing.name?.match(/(Regular|Intermediate|Standard|Non-Standard|Equivalent)/i)?.[1];
                    const feeVariant = fee.name?.match(/(Regular|Intermediate|Standard|Non-Standard|Equivalent)/i)?.[1];

                    // Prefer "Regular" or "Standard" variants
                    if (feeVariant?.toLowerCase() === 'regular' || feeVariant?.toLowerCase() === 'standard') {
                        if (existingVariant?.toLowerCase() !== 'regular' && existingVariant?.toLowerCase() !== 'standard') {
                            console.log(`🔄 Replacing water meter variant "${existing.name}" with preferred "${fee.name}"`);
                            acc.set(key, fee);
                            return acc;
                        }
                    }
                }

                // CRITICAL: For park fees, prefer non-subdivision over subdivision and specific zones over "All Other Zones"
                const isParkFee = fee.name?.toLowerCase().includes('park fee');
                if (isParkFee) {
                    const existingIsAllOther = existing.name?.toLowerCase().includes('all other zones');
                    const feeIsAllOther = fee.name?.toLowerCase().includes('all other zones');
                    const existingIsSubdivision = existing.name?.toLowerCase().includes('subdivision') &&
                                                 !existing.name?.toLowerCase().includes('non-subdivision');
                    const feeIsSubdivision = fee.name?.toLowerCase().includes('subdivision') &&
                                           !fee.name?.toLowerCase().includes('non-subdivision');

                    // Prefer non-subdivision over subdivision
                    if (!feeIsSubdivision && existingIsSubdivision) {
                        console.log(`🔄 Replacing subdivision park fee "${existing.name}" with non-subdivision "${fee.name}"`);
                        acc.set(key, fee);
                        return acc;
                    }

                    // Prefer specific zones over "All Other Zones"
                    if (!feeIsAllOther && existingIsAllOther && !feeIsSubdivision) {
                        console.log(`🔄 Replacing generic park fee "${existing.name}" with zone-specific "${fee.name}"`);
                        acc.set(key, fee);
                        return acc;
                    }
                }

                // CRITICAL: For duplicate fees, prefer the most recent effective date
                const existingCalc = existing.selectedCalculation || existing.fee_calculations?.[0];
                const feeCalc = fee.selectedCalculation || fee.fee_calculations?.[0];
                let existingDate = existingCalc?.effective_start;
                let feeDate = feeCalc?.effective_start;

                // If no effective_start in database, try to parse from fee name
                if (!existingDate) {
                    // Extract dates from fee names like "July 1, 2025 and after" or "July 1, 2024 - June 30, 2025"
                    const existingDateMatch = existing.name.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*(\d{4})/);
                    if (existingDateMatch) {
                        const month = existingDateMatch[1];
                        const year = existingDateMatch[2];
                        existingDate = `${year}-${String(new Date(Date.parse(month + " 1, " + year)).getMonth() + 1).padStart(2, '0')}-01`;
                    } else {
                        // Try to extract simple year suffix like " - 2027" or " - 2028"
                        const yearMatch = existing.name.match(/\s+-\s+(\d{4})\s*$/);
                        if (yearMatch) {
                            existingDate = `${yearMatch[1]}-01-01`;
                        }
                    }
                }

                if (!feeDate) {
                    const feeDateMatch = fee.name.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*(\d{4})/);
                    if (feeDateMatch) {
                        const month = feeDateMatch[1];
                        const year = feeDateMatch[2];
                        feeDate = `${year}-${String(new Date(Date.parse(month + " 1, " + year)).getMonth() + 1).padStart(2, '0')}-01`;
                    } else {
                        // Try to extract simple year suffix like " - 2027" or " - 2028"
                        const yearMatch = fee.name.match(/\s+-\s+(\d{4})\s*$/);
                        if (yearMatch) {
                            feeDate = `${yearMatch[1]}-01-01`;
                        }
                    }
                }

                if (existingDate && feeDate) {
                    const existingTime = new Date(existingDate).getTime();
                    const feeTime = new Date(feeDate).getTime();

                    // Prefer the more recent date (but not future dates - but this is tricky because we want "and after" to win)
                    const today = new Date().getTime();

                    // Special case: If fee name contains "and after", always prefer it as the current rate
                    const feeIsOpenEnded = fee.name.toLowerCase().includes('and after');
                    const existingIsOpenEnded = existing.name.toLowerCase().includes('and after');

                    if (feeIsOpenEnded && !existingIsOpenEnded && feeTime <= today) {
                        console.log(`🔄 Replacing dated fee "${existing.name}" with open-ended "${fee.name}"`);
                        acc.set(key, fee);
                        return acc;
                    } else if (existingIsOpenEnded && !feeIsOpenEnded) {
                        // Keep the open-ended one
                        return acc;
                    }

                    if (feeTime <= today && feeTime > existingTime) {
                        console.log(`🔄 Replacing older fee "${existing.name}" (${existingDate}) with newer "${fee.name}" (${feeDate})`);
                        acc.set(key, fee);
                        return acc;
                    } else if (existingTime > today && feeTime <= today) {
                        // Replace future-dated fee with current one
                        console.log(`🔄 Replacing future-dated fee "${existing.name}" (${existingDate}) with current "${fee.name}" (${feeDate})`);
                        acc.set(key, fee);
                        return acc;
                    }
                }

                // If both have same use_subtypes, keep first
                // If one has specific use_subtype match and other is empty, prefer specific
                const existingSubtypes = existing.use_subtypes || [];
                const feeSubtypes = fee.use_subtypes || [];

                // Prefer fee with non-empty use_subtypes that matches the project
                if (feeSubtypes.length > 0 && existingSubtypes.length === 0 && inputs.useSubtype) {
                    const matches = this.feeAppliesToSubtype(feeSubtypes, inputs.useSubtype);
                    if (matches) {
                        console.log(`🔄 Replacing generic fee "${fee.name}" with more specific use_subtype match`);
                        acc.set(key, fee);
                    }
                }
            }
            return acc;
        }, new Map());

        const deduplicatedFees = Array.from(uniqueFees.values());
        console.log(`🔄 After deduplication: ${deduplicatedFees.length} unique fees (removed ${filtered.length - deduplicatedFees.length} duplicates)`);

        // Step 7: Remove duplicate fees (keep service-area-specific over citywide)
        const withoutDuplicateFees = deduplicatedFees.filter((fee: any, index: number, array: any[]) => {
            const isCitywide = !fee.service_areas?.name || fee.service_areas.name === 'CITYWIDE';
            const feeName = fee.name || '';

            // Check if this is an impact fee OR Affordable Housing Linkage fee
            if (fee.category === 'Impact Fees' || feeName.includes('Affordable Housing Linkage')) {
                // For Linkage fees, check by fee TYPE (not exact name)
                let hasServiceAreaVersion = false;

                if (feeName.includes('Affordable Housing Linkage')) {
                    // Check if there's a service-area version of any Affordable Housing Linkage fee
                    // that applies to the same project type
                    hasServiceAreaVersion = array.some((otherFee: any) => {
                        const otherName = otherFee.name || '';
                        return otherName.includes('Affordable Housing Linkage') &&
                               otherFee.service_areas?.name &&
                               otherFee.service_areas.name !== 'CITYWIDE' &&
                               otherFee.id !== fee.id;
                    });
                } else {
                    // For impact fees, check by exact name
                    hasServiceAreaVersion = array.some((otherFee: any) =>
                        otherFee.name === fee.name &&
                        otherFee.service_areas?.name &&
                        otherFee.service_areas.name !== 'CITYWIDE' &&
                        otherFee.id !== fee.id
                    );
                }

                // If service area version exists and this is citywide, exclude it
                if (hasServiceAreaVersion && isCitywide) {
                    console.log(`🚫 Excluding duplicate citywide fee: ${fee.name} (service area version exists)`);
                    return false;
                }
            }

            return true; // Keep all other fees
        });

        console.log(`🎯 After removing duplicate fees: ${withoutDuplicateFees.length} fees (removed ${deduplicatedFees.length - withoutDuplicateFees.length} duplicate fees)`);

        // Step 8: Filter Quimby fees - only show "ALL OTHER ZONES" as default (user can't specify zoning)
        const withoutDuplicateQuimbyFees = withoutDuplicateFees.filter((fee: any, index: number, array: any[]) => {
            const feeName = fee.name || '';

            // Check if this is a Quimby fee
            if (feeName.includes('Quimby Fee')) {
                // Check if there are multiple Quimby fees in the array
                const quimbyFees = array.filter((f: any) => (f.name || '').includes('Quimby Fee'));

                if (quimbyFees.length > 1) {
                    // Multiple Quimby fees exist - only keep "ALL OTHER ZONES" as default
                    if (feeName.includes('ALL OTHER ZONES')) {
                        console.log(`✅ Keeping default Quimby fee: ${feeName}`);
                        return true;
                    } else {
                        console.log(`🚫 Excluding zone-specific Quimby fee: ${feeName} (use "ALL OTHER ZONES" as default)`);
                        return false;
                    }
                }
                // Only one Quimby fee exists - keep it
                return true;
            }

            return true; // Keep all non-Quimby fees
        });

        console.log(`🌳 After filtering Quimby fees: ${withoutDuplicateQuimbyFees.length} fees (removed ${withoutDuplicateFees.length - withoutDuplicateQuimbyFees.length} zone-specific Quimby fees)`);

        // Step 9: Combine seasonal water volume charges into annual average
        const combinedSeasonalFees = this.combineSeasonalWaterCharges(withoutDuplicateQuimbyFees);
        console.log(`💧 After combining seasonal water charges: ${combinedSeasonalFees.length} fees`);
        console.log('='.repeat(80));
        console.log(`✅ FINAL APPLICABLE FEES: ${combinedSeasonalFees.length}`);
        console.log('Fee names:');
        combinedSeasonalFees.forEach((f: any, i: number) => {
            console.log(`  ${i + 1}. ${f.name} [${f.service_areas?.name || 'Citywide'}]`);
        });
        console.log('='.repeat(80));

        // Map to the expected format using selectedCalculation
        const mappedFees = combinedSeasonalFees.map((fee: any) => {
            const calc = fee.selectedCalculation;
            const mapped: any = {
                feeId: fee.id,
                feeName: fee.name,
                feeDescription: fee.description,
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

        // Return both the fees and the total count fetched from DB (before filtering)
        return {
            fees: mappedFees,
            totalFeesFetched: allFees.length // This is the raw count before filtering
        };
    }

    /**
     * Flexible matching for fee applies_to field
     * Handles cases like "Single Family" in DB matching "Residential" projectType
     */
    private feeAppliesToProject(appliesTo: string[], useSubtypes: string[], projectType: string, useSubtype: string | undefined, feeName: string = '', numUnits: number = 0): boolean {
        const feeNameLower = feeName.toLowerCase();
        const selectedType = projectType.toLowerCase();

        console.log(`\n🔍 ${feeName}`);
        console.log(`   applies_to: ${JSON.stringify(appliesTo)}`);
        console.log(`   use_subtypes: ${JSON.stringify(useSubtypes)}`);
        console.log(`   numUnits: ${numUnits}`);

        // EXCLUDE voluntary/optional
        if (feeNameLower.includes('voluntary') || feeNameLower.includes('optional')) {
            console.log(`   ❌ Voluntary/Optional`);
            return false;
        }

        // CHECK UNIT COUNT for specific subtypes (Austin Transportation Fees)
        if (useSubtypes && useSubtypes.length > 0 && numUnits > 0) {
            for (const subtype of useSubtypes) {
                const sub = subtype.toLowerCase();

                // Duplex = exactly 2 units
                if (sub === 'duplex' && numUnits !== 2) {
                    console.log(`   ❌ Duplex fee requires 2 units, project has ${numUnits}`);
                    return false;
                }

                // Triplex = exactly 3 units
                if (sub === 'triplex' && numUnits !== 3) {
                    console.log(`   ❌ Triplex fee requires 3 units, project has ${numUnits}`);
                    return false;
                }

                // Fourplex = exactly 4 units
                if (sub === 'fourplex' && numUnits !== 4) {
                    console.log(`   ❌ Fourplex fee requires 4 units, project has ${numUnits}`);
                    return false;
                }

                // Single-family = 1 unit only
                if (sub === 'single-family' && numUnits > 1) {
                    console.log(`   ❌ Single-family fee requires 1 unit, project has ${numUnits}`);
                    return false;
                }

                // Multifamily = 5+ units
                if (sub === 'multifamily' && numUnits > 0 && numUnits < 5) {
                    console.log(`   ❌ Multifamily fee requires 5+ units, project has ${numUnits}`);
                    return false;
                }
            }
        }

        // Empty applies_to = universal (utility fees)
        if (!appliesTo || appliesTo.length === 0) {
            console.log(`   ✅ Universal fee`);
            return true;
        }

        // Check category - look at BOTH projectType AND useSubtype
        const useSubtypeLower = (useSubtype || '').toLowerCase();
        const isMultiFamily = selectedType.includes('multi') || useSubtypeLower.includes('multi');
        const isSingleFamily = (selectedType.includes('single') || useSubtypeLower.includes('single')) && !isMultiFamily;

        let categoryMatches = false;
        for (const category of appliesTo) {
            const cat = category.toLowerCase();

            if (cat === 'all' || cat === 'all users' || cat === 'all usage') {
                categoryMatches = true;
                break;
            }

            if ((isMultiFamily || isSingleFamily) && cat === 'residential') {
                categoryMatches = true;
                break;
            }

            if (selectedType.includes('commercial') && cat === 'commercial') {
                categoryMatches = true;
                break;
            }

            if (selectedType.includes('industrial') && cat === 'industrial') {
                categoryMatches = true;
                break;
            }
        }

        if (!categoryMatches) {
            console.log(`   ❌ Category mismatch`);
            return false;
        }

        // CRITICAL: Check use_subtypes if present
        if (useSubtypes && useSubtypes.length > 0) {
            // Check for "All Users"
            const hasAllUsers = useSubtypes.some(st => {
                const lower = st.toLowerCase();
                return lower === 'all users' || lower === 'all' || lower === 'all usage';
            });

            if (hasAllUsers) {
                console.log(`   ✅ INCLUDED (All Users in use_subtypes)`);
                return true;
            }

            let subtypeMatches = false;

            for (const subtype of useSubtypes) {
                const sub = subtype.toLowerCase();

                // STRICT matching for multi vs single family
                if (isMultiFamily) {
                    // Match multifamily, duplex, triplex, fourplex for multi-family projects
                    if (sub.includes('multi') || sub === 'duplex' || sub === 'triplex' || sub === 'fourplex') {
                        subtypeMatches = true;
                        break;
                    }
                    // EXCLUDE single-family specific
                    if (sub.includes('single') || sub.includes('adu') || sub.includes('accessory')) {
                        console.log(`   ❌ Wrong subtype: ${subtype}`);
                        return false;
                    }
                }

                if (isSingleFamily) {
                    if (sub.includes('single')) {
                        subtypeMatches = true;
                        break;
                    }
                    // EXCLUDE multi-family specific
                    if (sub.includes('multi')) {
                        console.log(`   ❌ Wrong subtype: ${subtype}`);
                        return false;
                    }
                }
            }

            if (!subtypeMatches) {
                console.log(`   ❌ No subtype match`);
                return false;
            }
        }

        // ALSO check fee name for exclusions
        if (isMultiFamily) {
            if (feeNameLower.includes('single-family') ||
                feeNameLower.includes('single family') ||
                feeNameLower.includes('accessory dwelling') ||
                feeNameLower.includes('adu')) {
                console.log(`   ❌ Single-family in name`);
                return false;
            }
        }

        if (isSingleFamily) {
            if (feeNameLower.includes('multi-family') ||
                feeNameLower.includes('multifamily')) {
                console.log(`   ❌ Multi-family in name`);
                return false;
            }
        }

        console.log(`   ✅ INCLUDED`);
        return true;
    }

    /**
     * Flexible matching for fee use_subtypes field
     */
    private feeAppliesToSubtype(useSubtypes: string[], useSubtype?: string): boolean {
        // If no subtype specified in project, match everything
        if (!useSubtype) {
            return true;
        }

        // If fee has no use_subtypes filter, it applies to everything
        if (!useSubtypes || useSubtypes.length === 0) {
            return true;
        }

        // Check for broad "all" categories
        if (useSubtypes.includes('All Users') || useSubtypes.includes('All')) {
            return true;
        }

        // Check if ANY of the use_subtypes match
        return useSubtypes.some(feeSubtype => {
            // Exact match
            if (feeSubtype === useSubtype) {
                return true;
            }

            // Normalize strings
            const normalizedFeeSubtype = feeSubtype.toLowerCase().replace(/[^a-z]/g, '');
            const normalizedUseSubtype = useSubtype.toLowerCase().replace(/[^a-z]/g, '');

            // Partial match
            if (normalizedUseSubtype.includes(normalizedFeeSubtype)) {
                return true;
            }
            if (normalizedFeeSubtype.includes(normalizedUseSubtype)) {
                return true;
            }

            return false;
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

        // CRITICAL: Connection/capacity fees are ONE-TIME, not recurring
        const isConnectionFee = feeNameLower.includes('connection fee') ||
                               feeNameLower.includes('connection charge') ||
                               feeNameLower.includes('capacity charge') ||  // San Diego: "Sewer Capacity Charge", "Water Capacity Charge"
                               feeNameLower.includes('capacity fee') ||
                               categoryLower.includes('connection') ||
                               categoryLower.includes('capacity');

        if (!isConnectionFee && (
            unitLabelLower.includes('month') ||
            unitLabelLower.includes('per month') ||
            categoryLower === 'monthly services' ||
            feeNameLower.includes('monthly') ||
            feeNameLower.includes('volume charge')
        )) {
            isRecurring = true;
            recurringPeriod = 'month';
        }

        switch (fee.calcType) {
            case 'flat':
            case 'flat_fee':
                // Flat fees are NOT multiplied by units - they're one-time charges
                amount = fee.rate || 0;
                if (isRecurring) {
                    calculation = `$${amount.toFixed(2)} per month`;
                } else {
                    calculation = `Flat fee: $${amount.toFixed(2)}`;
                }
                break;

            case 'per_unit':
                // CRITICAL: Check what the "unit" actually means in the unit_label
                const unitLabel = fee.unitLabel || '';
                const unitLabelLowerCase = unitLabel.toLowerCase();

                // Check if this is truly per dwelling unit
                // IMPORTANT: Also treat park fees and fees with null/empty unit_label as per-unit
                const isParkFee = feeNameLower.includes('park fee') || feeNameLower.includes('parkland');
                const isPerDwellingUnit = unitLabelLowerCase.includes('dwelling') ||
                    unitLabelLowerCase.includes('per unit') ||
                    unitLabelLowerCase.includes('per eru') ||
                    unitLabelLowerCase.includes('equivalent residential unit') ||
                    unitLabelLowerCase.includes('per service unit') ||  // "per service unit" = per dwelling unit
                    unitLabelLowerCase.includes('service unit') ||      // Impact fees use "service unit" to mean dwelling unit
                    unitLabelLowerCase.includes('single family unit') || // Austin pattern: "per single family unit"
                    unitLabelLowerCase.includes('multi-family unit') ||  // Austin pattern: "per multi-family unit"
                    unitLabelLowerCase.includes('multifamily unit') ||   // Austin pattern: "per multifamily unit"
                    (unitLabelLowerCase.includes('per') && unitLabelLowerCase.includes('unit')) ||  // Generic "per X unit" patterns
                    (isParkFee && !unitLabel) ||  // Park fees with null unit_label are per-unit
                    (!unitLabel && inputs.projectType === 'Residential');  // Residential fees with null unit_label default to per-unit

                // CRITICAL: Check if it's per square foot (Denver Affordable Housing pattern)
                if (unitLabelLowerCase.includes('per square foot') || unitLabelLowerCase.includes('per sq ft')) {
                    // Multiply by total square feet
                    if (!inputs.squareFeet) return null;
                    amount = (fee.rate || 0) * inputs.squareFeet;
                    calculation = `$${fee.rate} per sq ft × ${inputs.squareFeet.toLocaleString()} sq ft = $${amount.toLocaleString()}`;
                }
                else if (isPerDwellingUnit) {
                    // Multiply by number of dwelling units
                    if (!inputs.numUnits) return null;
                    amount = (fee.rate || 0) * inputs.numUnits;
                    calculation = `$${fee.rate} × ${inputs.numUnits} units = $${amount.toFixed(2)}`;

                    // Check if this is a monthly charge
                    if (unitLabelLowerCase.includes('per month') ||
                        feeNameLower.includes('monthly') ||
                        (feeNameLower.includes('sewer') && feeNameLower.includes('charge') && !isConnectionFee)) {
                        isRecurring = true;
                        recurringPeriod = 'month';
                    }
                }
                // Check if it's per connection (typically 1 per project)
                else if (unitLabelLowerCase.includes('connection') ||
                         unitLabelLowerCase.includes('per service')) {
                    // One connection per project, regardless of units
                    amount = fee.rate || 0;
                    calculation = `$${amount.toFixed(2)} (per connection)`;
                }
                // Check if it's per fixture, appliance, or "each" (don't multiply)
                else if (unitLabelLowerCase.includes('fixture') ||
                         unitLabelLowerCase.includes('appliance') ||
                         unitLabelLowerCase.includes('each') ||
                         unitLabelLowerCase.includes('per bag') ||
                         unitLabelLowerCase.includes('per bale') ||
                         unitLabelLowerCase.includes('per yard') ||
                         unitLabelLowerCase.includes('per job') ||
                         unitLabelLowerCase.includes('per hour') ||
                         unitLabelLowerCase.includes('per device') ||
                         unitLabelLowerCase.includes('per system') ||
                         unitLabelLowerCase.includes('per meter')) {
                    // Don't multiply - this is per individual item
                    amount = fee.rate || 0;
                    calculation = `$${amount.toFixed(2)} ${unitLabel}`;
                }
                // Default: don't multiply (safer assumption)
                else {
                    amount = fee.rate || 0;
                    calculation = `$${amount.toFixed(2)} ${unitLabel || 'per unit'}`;
                }

                // Add meter size to calculation if applicable
                if (unitLabel && unitLabel.includes('"')) {
                    calculation = `${unitLabel}: ` + calculation;
                }
                break;

            case 'per_sqft':
            case 'per_square_foot':
                if (!inputs.squareFeet) return null;

                // CRITICAL: Detect tiered flat fees (e.g., "Demolition Permit - 18,001 - 20,000 sq. feet")
                // These fees have square footage ranges in the name but are flat fees for that tier,
                // not per-square-foot multipliers
                const sqftRangePattern = /([\d,]+)\s*[-–]\s*([\d,]+)\s*sq/i;
                const hasSqftTier = sqftRangePattern.test(fee.feeName || '');

                if (hasSqftTier) {
                    // This is a tiered flat fee - use the rate as-is without multiplying
                    amount = fee.rate || 0;
                    calculation = `Flat fee for this square footage tier: $${amount.toFixed(2)}`;
                } else {
                    // This is a true per-square-foot fee
                    // CRITICAL: Check for "1,000" (with comma) or "1000" (without comma)
                    const unitLabelLower = (fee.unitLabel || '').toLowerCase();
                    const divisor = (unitLabelLower.includes('1,000') || unitLabelLower.includes('1000')) ? 1000 : 1;
                    const sqftUnits = inputs.squareFeet / divisor;
                    amount = (fee.rate || 0) * sqftUnits;

                    if (divisor === 1000) {
                        calculation = `$${fee.rate} per 1,000 sq ft × ${(inputs.squareFeet / 1000).toFixed(2)} (1000 sq ft units) = $${amount.toFixed(2)}`;
                    } else {
                        calculation = `$${fee.rate} × ${inputs.squareFeet} sq ft = $${amount.toFixed(2)}`;
                    }
                }
                break;

            case 'per_meter_size':
                if (!inputs.meterSize) return null;

                // Normalize meter size for flexible matching (e.g., "3/4\"" -> "3/4")
                const normalizedMeterSize = inputs.meterSize.replace(/["'\s]/g, '');
                const unitLabelForMeter = (fee.unitLabel || '').toLowerCase();

                // Check if this fee applies to the selected meter size
                // Handle ranges like "5/8 inch - 3/4 inch" matching "3/4"
                const meterSizeVariants = [
                    normalizedMeterSize,                                    // "3/4"
                    normalizedMeterSize.replace('/', ''),                   // "34"
                    normalizedMeterSize + ' inch',                          // "3/4 inch"
                    normalizedMeterSize + 'inch',                           // "3/4inch"
                    normalizedMeterSize + '"',                              // "3/4""
                ];

                // Check for any variant in the unit label
                const meterMatches = meterSizeVariants.some(variant =>
                    unitLabelForMeter.includes(variant.toLowerCase())
                );

                if (meterMatches) {
                    // For City vs County rates, prefer City (most common)
                    // Skip if this is explicitly a County rate and we want City
                    if (fee.feeName?.includes('(County)')) {
                        // Skip county rates in favor of city rates
                        return null;
                    }

                    amount = fee.rate || 0;
                    calculation = `${inputs.meterSize} meter: $${amount.toFixed(2)}`;

                    // Monthly service fees are recurring
                    if (fee.unitLabel?.toLowerCase().includes('per month') ||
                        feeNameLower.includes('monthly') ||
                        feeNameLower.includes('service fee')) {
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
                // CRITICAL: Handle valuation-based building permit fees (LA + Portland pattern)
                // Parse tiered formula from description field
                if ((fee.feeName?.toLowerCase().includes('building permit') ||
                     fee.feeName?.toLowerCase().includes('development services')) &&
                    inputs.projectValue &&
                    fee.feeDescription?.match(/\$[\d,]+.*:\s*.*\$[\d,]+/)) {

                    // Parse the tiered formula from description
                    // Format 1: "$100,000.01 - $500,000 inclusive: $395.00 plus $3.50 per $1,000" (LA pattern)
                    // Format 2: "$100,001 and up: Fee for first $100,000 is $1,043.08, plus $5.16 for each additional $1,000" (Portland pattern)
                    const tiers: Array<{min: number, max: number, base: number, rate: number, per: number}> = [];

                    // LA-style range pattern
                    const tierPattern = /\$?([\d,]+(?:\.\d+)?)\s*-\s*\$?([\d,]+(?:\.\d+)?)[^:]*:\s*\$?([\d,]+(?:\.\d+)?)\s*(?:plus\s+\$?([\d,]+(?:\.\d+)?)\s*per\s+\$?([\d,]+))?/gi;
                    let match;

                    while ((match = tierPattern.exec(fee.feeDescription || '')) !== null) {
                        const min = parseFloat(match[1].replace(/,/g, ''));
                        const max = parseFloat(match[2].replace(/,/g, ''));
                        const base = parseFloat(match[3].replace(/,/g, ''));
                        const rate = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0;
                        const per = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 1;

                        tiers.push({ min, max, base, rate, per });
                    }

                    // Portland-style tier pattern: "$2,001 - $25,000: Fee for first $2,000 is $202.35, plus $12.76 for each additional $1,000"
                    const portlandTierPattern = /\$?([\d,]+)\s*-\s*\$?([\d,]+)[^:]*:\s*Fee for first \$?([\d,]+)[^$]*\$?([\d,]+(?:\.\d+)?)[^$]*\$?([\d,]+(?:\.\d+)?)\s*for each additional \$?([\d,]+)/gi;

                    while ((match = portlandTierPattern.exec(fee.feeDescription || '')) !== null) {
                        const min = parseFloat(match[1].replace(/,/g, ''));
                        const max = parseFloat(match[2].replace(/,/g, ''));
                        const firstAmount = parseFloat(match[3].replace(/,/g, ''));
                        const base = parseFloat(match[4].replace(/,/g, ''));
                        const rate = parseFloat(match[5].replace(/,/g, ''));
                        const per = parseFloat(match[6].replace(/,/g, ''));

                        tiers.push({ min: min - 1, max, base, rate, per });
                    }

                    // Handle "Over $X" tier
                    const overPattern = /Over\s+\$?([\d,]+)[^:]*:\s*\$?([\d,]+(?:\.\d+)?)\s*plus\s+\$?([\d,]+(?:\.\d+)?)\s*per\s+\$?([\d,]+)/i;
                    const overMatch = (fee.feeDescription || '').match(overPattern);

                    if (overMatch) {
                        const min = parseFloat(overMatch[1].replace(/,/g, ''));
                        const base = parseFloat(overMatch[2].replace(/,/g, ''));
                        const rate = parseFloat(overMatch[3].replace(/,/g, ''));
                        const per = parseFloat(overMatch[4].replace(/,/g, ''));

                        tiers.push({ min, max: Infinity, base, rate, per });
                    }

                    // Handle "X and up" tier (Portland pattern)
                    // Format: "$100,001 and up: Fee for first $100,000 is $1,043.08, plus $5.16 for each additional $1,000"
                    const andUpPattern = /\$?([\d,]+)\s+and up[^:]*:\s*Fee for first \$?([\d,]+)[^$]*\$?([\d,]+(?:\.\d+)?)[^$]*\$?([\d,]+(?:\.\d+)?)\s*for each additional \$?([\d,]+)/i;
                    const andUpMatch = (fee.feeDescription || '').match(andUpPattern);

                    if (andUpMatch) {
                        const min = parseFloat(andUpMatch[1].replace(/,/g, ''));
                        const base = parseFloat(andUpMatch[3].replace(/,/g, ''));
                        const rate = parseFloat(andUpMatch[4].replace(/,/g, ''));
                        const per = parseFloat(andUpMatch[5].replace(/,/g, ''));

                        tiers.push({ min: min - 1, max: Infinity, base, rate, per });
                    }

                    // Find matching tier
                    const matchingTier = tiers.find(t =>
                        inputs.projectValue! > t.min && inputs.projectValue! <= t.max
                    );

                    if (matchingTier) {
                        const excessValue = inputs.projectValue - matchingTier.min;
                        const variableFee = (excessValue / matchingTier.per) * matchingTier.rate;
                        amount = matchingTier.base + variableFee;

                        calculation = `Base: $${matchingTier.base.toFixed(2)} + $${matchingTier.rate} per $${matchingTier.per.toLocaleString()} = $${amount.toFixed(2)}`;
                    }
                }

                // CRITICAL: Handle square-footage-based tiers (Denver SDC pattern)
                // Format: "Base charge of $3,030 plus $0.70 per sq ft for the first 22,000 sq ft, and $0.35 per sq ft thereafter."
                if (amount === 0 && inputs.squareFeet && fee.feeDescription?.includes('per sq ft')) {
                    const sqftPattern = /Base charge of \$?([\d,]+(?:\.\d+)?)\s*plus\s*\$?([\d.]+)\s*per sq ft for the first ([\d,]+) sq ft(?:,?\s*and\s*\$?([\d.]+)\s*per sq ft thereafter)?/i;
                    const sqftMatch = fee.feeDescription.match(sqftPattern);

                    if (sqftMatch) {
                        const base = parseFloat(sqftMatch[1].replace(/,/g, ''));
                        const firstTierRate = parseFloat(sqftMatch[2]);
                        const firstTierMax = parseFloat(sqftMatch[3].replace(/,/g, ''));
                        const secondTierRate = sqftMatch[4] ? parseFloat(sqftMatch[4]) : 0;

                        if (inputs.squareFeet <= firstTierMax) {
                            // Within first tier
                            amount = base + (inputs.squareFeet * firstTierRate);
                            calculation = `Base: $${base.toFixed(2)} + ($${firstTierRate} × ${inputs.squareFeet} sq ft) = $${amount.toFixed(2)}`;
                        } else if (secondTierRate > 0) {
                            // Exceeds first tier, use second tier rate
                            const firstTierFee = firstTierMax * firstTierRate;
                            const excessSqft = inputs.squareFeet - firstTierMax;
                            const secondTierFee = excessSqft * secondTierRate;
                            amount = base + firstTierFee + secondTierFee;
                            calculation = `Base: $${base.toFixed(2)} + ($${firstTierRate} × ${firstTierMax}) + ($${secondTierRate} × ${excessSqft}) = $${amount.toFixed(2)}`;
                        } else {
                            // Only one tier, sqft exceeds max but no second rate
                            amount = base + (firstTierMax * firstTierRate);
                            calculation = `Base: $${base.toFixed(2)} + ($${firstTierRate} × ${firstTierMax} sq ft max) = $${amount.toFixed(2)}`;
                        }
                    }
                }

                // Fallback: For simple addition formulas, use the pre-calculated result
                if (amount === 0 && fee.formulaDisplay && fee.formulaDisplay.includes('=')) {
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

                // Fallback: For formula fees with a simple rate and "per dwelling unit", treat as per-unit
                // (San Diego pattern: Citywide DIFs marked as 'formula' but just need rate × units)
                if (amount === 0 && fee.rate && fee.unitLabel?.toLowerCase().includes('dwelling unit')) {
                    if (inputs.numUnits) {
                        amount = fee.rate * inputs.numUnits;
                        calculation = `$${fee.rate} × ${inputs.numUnits} units = $${amount.toFixed(2)}`;
                    }
                }

                // Fallback: For formula fees with "per lot", use rate × numUnits (Denver pattern)
                if (amount === 0 && fee.rate && fee.unitLabel?.toLowerCase().includes('per lot')) {
                    if (inputs.numUnits) {
                        amount = fee.rate * inputs.numUnits;
                        calculation = `$${fee.rate} per lot × ${inputs.numUnits} units = $${amount.toFixed(2)}`;
                    } else {
                        // For single lot, just use the rate
                        amount = fee.rate;
                        calculation = `$${amount.toFixed(2)} per lot`;
                    }
                }

                // Fallback: For formula fees with "per unit" (Denver pattern for System Development Charges)
                // Example: rate: 10040, unit_label: "per unit", calc_type: "formula" but no formula defined
                if (amount === 0 && fee.rate && fee.unitLabel?.toLowerCase() === 'per unit') {
                    if (inputs.numUnits) {
                        amount = fee.rate * inputs.numUnits;
                        calculation = `$${fee.rate} per unit × ${inputs.numUnits} units = $${amount.toFixed(2)}`;
                    }
                }

                // Fallback: For formula fees with "% of valuation" or "% of permit valuation" (Portland pattern)
                if (amount === 0 && fee.rate && fee.unitLabel?.toLowerCase().includes('valuation')) {
                    if (inputs.projectValue) {
                        amount = fee.rate * inputs.projectValue;
                        const percentDisplay = (fee.rate * 100).toFixed(2);
                        calculation = `${percentDisplay}% of $${inputs.projectValue.toLocaleString()} = $${amount.toFixed(2)}`;
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

        // Project Specifications Section - always show all fields
        report += '─'.repeat(70) + '\n';
        report += 'PROJECT SPECIFICATIONS\n';
        report += '─'.repeat(70) + '\n';
        report += `  Project Type:     ${breakdown.project.projectType || 'Not specified'}\n`;
        report += `  Use Subtype:      ${breakdown.project.useSubtype || 'Not specified'}\n`;
        report += `  Jurisdiction:     ${breakdown.project.jurisdictionName}, ${breakdown.project.stateCode}\n`;
        report += `  Service Area:     ${breakdown.project.serviceArea || 'Citywide'}\n`;
        report += `  Number of Units:  ${breakdown.project.numUnits || 'N/A'}\n`;
        report += `  Square Footage:   ${breakdown.project.squareFeet ? breakdown.project.squareFeet.toLocaleString() + ' sq ft' : 'N/A'}\n`;
        report += `  Project Value:    ${breakdown.project.projectValue ? '$' + breakdown.project.projectValue.toLocaleString() : 'N/A'}\n`;
        report += `  Meter Size:       ${breakdown.project.meterSize || 'N/A'}\n`;

        report += '\n' + '─'.repeat(70) + '\n';
        report += 'FINANCIAL SUMMARY\n';
        report += '─'.repeat(70) + '\n';
        report += `One-Time Development Fees:        $${breakdown.oneTimeFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += `Monthly Operating Costs:           $${breakdown.monthlyFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += `Annual Operating Costs (Year 1):   $${breakdown.annualOperatingCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += '─'.repeat(70) + '\n';
        report += `TOTAL FIRST YEAR COST:             $${breakdown.firstYearTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += '─'.repeat(70) + '\n';

        // Per-unit breakdown (if applicable)
        if (breakdown.project.numUnits && breakdown.project.numUnits > 0) {
            report += '\n' + '─'.repeat(70) + '\n';
            report += 'PER-UNIT BREAKDOWN\n';
            report += '─'.repeat(70) + '\n';
            report += `  Development Cost per Unit:  $${(breakdown.oneTimeFees / breakdown.project.numUnits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            report += `  Monthly Cost per Unit:      $${(breakdown.monthlyFees / breakdown.project.numUnits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            report += `  Annual Cost per Unit:       $${(breakdown.annualOperatingCosts / breakdown.project.numUnits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            report += `  First Year Total per Unit:  $${(breakdown.firstYearTotal / breakdown.project.numUnits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        }
        report += '\n';

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

        // Determine what's actually excluded
        const hasPermitFees = breakdown.fees.some(f =>
            f.feeName.toLowerCase().includes('permit') ||
            f.feeName.toLowerCase().includes('plan review') ||
            f.feeName.toLowerCase().includes('inspection')
        );
        const hasImpactFees = breakdown.fees.some(f =>
            f.category?.toLowerCase().includes('impact') ||
            f.feeName.toLowerCase().includes('impact fee')
        );

        report += '═'.repeat(70) + '\n';
        report += 'IMPORTANT NOTES & ASSUMPTIONS\n';
        report += '═'.repeat(70) + '\n\n';

        report += 'Fee Timeline:\n';
        report += '  • Impact fees and connection fees: Due at building permit issuance\n';
        report += '  • Monthly operating costs: Begin at certificate of occupancy\n';
        report += '  • Annual increases: Fees typically increase 2-5% annually\n\n';

        report += 'Usage Assumptions:\n';
        report += '  • Water consumption: Based on meter size and typical usage patterns\n';
        report += '  • Sewer flows: Calculated from water usage (typically 85-95% of water)\n';
        report += '  • Monthly volume charges: Shown as annual average (varies seasonally)\n';
        report += '  • Peak demand charges: Applied where applicable based on meter size\n\n';

        report += 'Multi-Year Projections (with 3% annual inflation):\n';
        const year2Total = breakdown.annualOperatingCosts * 1.03;
        const year3Total = breakdown.annualOperatingCosts * 1.03 * 1.03;
        const year5Total = breakdown.annualOperatingCosts * Math.pow(1.03, 4);
        report += `  • Year 2 Operating Costs:  $${year2Total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += `  • Year 3 Operating Costs:  $${year3Total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        report += `  • Year 5 Operating Costs:  $${year5Total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;

        report += 'What This Report Includes:\n';
        if (hasImpactFees) report += '  ✓ Impact fees (water, sewer, transportation, parks, etc.)\n';
        if (hasPermitFees) report += '  ✓ Building permits, plan review, and inspection fees\n';
        report += '  ✓ Connection and tap fees\n';
        report += '  ✓ Monthly utility base charges and volume rates\n';
        report += '  ✓ System development charges (SDCs)\n\n';

        report += 'What This Report Does NOT Include:\n';
        report += '  ✗ Development agreement fees or negotiations\n';
        report += '  ✗ Off-site infrastructure improvements\n';
        report += '  ✗ Annexation fees (if applicable)\n';
        report += '  ✗ Environmental review or mitigation fees\n';
        report += '  ✗ HOA or special district assessments\n';
        report += '  ✗ Utility connection construction costs\n\n';

        report += 'Important Disclaimers:\n';
        report += '  • Fees shown are current as of October 2025\n';
        report += '  • All fees subject to change - verify with jurisdiction before finalizing budgets\n';
        report += '  • Some fees may vary based on actual site conditions or final design\n';
        report += '  • Additional fees may apply for expedited review or out-of-hours inspections\n';
        report += '  • This report is for planning purposes only and does not constitute official fee quotes\n\n';

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