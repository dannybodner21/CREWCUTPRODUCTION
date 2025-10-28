# COMPLETE FEE CALCULATION FLOW

## FILE 1: UI Component - `/src/components/CustomLewisPortal.tsx` (2004 lines)

### Key State Variables (lines 63-72):
```typescript
const [calculatedFees, setCalculatedFees] = useState<FeeBreakdown | null>(null);
const [calculatedFees2, setCalculatedFees2] = useState<FeeBreakdown | null>(null);
const [isCalculating, setIsCalculating] = useState(false);
const [jurisdictionFees, setJurisdictionFees] = useState<any[]>([]);
const [jurisdictionFees2, setJurisdictionFees2] = useState<any[]>([]);
```

### Calculation Trigger (lines 799-804):
```typescript
// Recalculate fees when project parameters change
useEffect(() => {
    console.log('🔧 calculateTotalFees useEffect triggered');
    if (selectedJurisdiction) {
        calculateTotalFees();
    }
}, [selectedJurisdiction, projectType, projectUnits, squareFootage, projectValue, projectAcreage, meterSize, selectedServiceAreaIds]);
```

### Main Calculation Function (lines 735-796):
```typescript
const calculateTotalFees = async (): Promise<void> => {
    console.log('🔧 calculateTotalFees called');
    if (!selectedJurisdiction) {
        setCalculatedFees(null);
        return;
    }

    setIsCalculating(true);
    try {
        const mapped = mapProjectTypeToDatabase(projectType, useSubtype);
        const params = {
            jurisdictionName: selectedJurisdiction.jurisdiction_name,
            stateCode: selectedJurisdiction.state_code,
            selectedServiceAreaIds: selectedServiceAreaIds,
            projectType: mapped?.projectType || projectType,
            useSubtype: mapped?.useSubtype,
            numUnits: parseInt(projectUnits) || 0,
            squareFeet: parseInt(squareFootage) || 0,
            projectValue: parseInt(projectValue) || 0,
            meterSize: meterSize
        };

        const response = await fetch('/api/lewis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'calculateProjectFees',
                params: params
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ calculateProjectFees result:', result);
            if (result.success && result.data) {
                setCalculatedFees(result.data);  // <-- SETS STATE HERE
                setJurisdictionFees([{
                    totalFees: result.data.totalFeesFetched || 0,
                    applicableFees: result.data.applicableFeesCount || 0
                }]);
            } else {
                setCalculatedFees(null);
            }
        } else {
            setCalculatedFees(null);
        }
    } catch (error) {
        console.error('Error calculating fees:', error);
        setCalculatedFees(null);
    } finally {
        setIsCalculating(false);
    }
};
```

### Display Logic (lines 1396-1407):
```typescript
if (!calculatedFees) {
    return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text>Select a jurisdiction and enter project details to calculate fees</Text>
        </div>
    );
}

const applicableFees = calculatedFees?.fees?.filter(fee => fee.calculatedAmount > 0) || [];

if (applicableFees.length === 0) {
    // Show "no fees" message
}
```

### Fee Display (lines 1744-1878):
```typescript
// Single location view - separate one-time vs recurring
const oneTimeFees = applicableFees.filter(f => !f.isRecurring);
const recurringFees = applicableFees.filter(f => f.isRecurring);

return (
    <>
        {/* Summary Cards showing counts */}
        <Text>Applicable Fees: {applicableFees.length}</Text>
        <Text>One-time: {oneTimeFees.length}, Recurring: {recurringFees.length}</Text>

        {/* One-Time Development Fees */}
        {oneTimeFees.length > 0 && (
            <div>
                {oneTimeFees.map(fee => (
                    <div key={fee.feeId}>
                        <Text>{fee.feeName}</Text>
                        <Text>${fee.calculatedAmount.toLocaleString()}</Text>
                    </div>
                ))}
            </div>
        )}

        {/* Monthly Operating Fees */}
        {recurringFees.length > 0 && (
            <div>
                {recurringFees.map(fee => (
                    <div key={fee.feeId}>
                        <Text>{fee.feeName}</Text>
                        <Text>${fee.calculatedAmount.toLocaleString()}/mo</Text>
                    </div>
                ))}
            </div>
        )}
    </>
);
```

---

## FILE 2: API Route - `/src/app/api/lewis/route.ts` (1141 lines)

### Action Handler (lines 162-238):
```typescript
case 'calculateProjectFees': {
    console.log('🔧 Calculating project fees:', params);
    console.log('   📍 Jurisdiction:', params.jurisdictionName);
    console.log('   📍 Service Area IDs:', params.selectedServiceAreaIds);

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        const projectInputs = {
            jurisdictionName: params.jurisdictionName,
            stateCode: params.stateCode,
            selectedServiceAreaIds: params.selectedServiceAreaIds || [],
            projectType: params.projectType as any,
            useSubtype: params.useSubtype,
            numUnits: params.numUnits,
            squareFeet: params.squareFeet,
            projectValue: params.projectValue,
            meterSize: params.meterSize
        };

        console.log('🚀 Calling calculator.calculateFees...');
        const breakdown = await calculator.calculateFees(projectInputs);

        console.log('✅ Calculator returned:');
        console.log('   💰 One-time fees: $' + breakdown.oneTimeFees.toLocaleString());
        console.log('   💰 Monthly fees: $' + breakdown.monthlyFees.toLocaleString());
        console.log('   📋 Total fee items: ' + breakdown.fees?.length);
        console.log('   📋 One-time fee items: ' + breakdown.fees?.filter(f => !f.isRecurring).length);
        console.log('   📋 Recurring fee items: ' + breakdown.fees?.filter(f => f.isRecurring).length);

        // Format response
        const response = {
            totalFees: breakdown.firstYearTotal,
            oneTimeFees: breakdown.oneTimeFees,
            monthlyFees: breakdown.monthlyFees,
            annualOperatingCosts: breakdown.annualOperatingCosts,
            firstYearTotal: breakdown.firstYearTotal,
            fees: breakdown.fees.map(fee => ({  // <-- MAPS FEES HERE
                feeId: fee.feeId,
                feeName: fee.feeName,
                agencyName: fee.agencyName,
                serviceArea: fee.serviceArea,
                category: fee.category,
                calculatedAmount: fee.calculatedAmount,
                calculation: fee.calculation,
                isRecurring: fee.isRecurring,
                recurringPeriod: fee.recurringPeriod
            })),
            byCategory: breakdown.byCategory,
            byAgency: breakdown.byAgency,
            project: breakdown.project,
            perUnitCosts: projectInputs.numUnits ? {
                developmentCost: breakdown.oneTimeFees / projectInputs.numUnits,
                monthlyCost: breakdown.monthlyFees / projectInputs.numUnits,
                firstYearCost: breakdown.firstYearTotal / projectInputs.numUnits
            } : null,
            totalFeesFetched: breakdown.totalFeesFetched,
            applicableFeesCount: breakdown.applicableFeesCount
        };

        console.log('✅ Calculated fees - One-time:', response.oneTimeFees, 'Monthly:', response.monthlyFees);
        result = { success: true, data: response };
    } catch (calcError) {
        console.error('❌ Calculation error:', calcError);
        result = { success: false, error: calcError.message };
    }
    break;
}
```

---

## FILE 3: Fee Calculator - `/src/lib/fee-calculator/index.ts` (2083 lines)

### Main Calculate Function (lines 70-146):
```typescript
async calculateFees(inputs: ProjectInputs): Promise<FeeBreakdown> {
    const result = await this.getApplicableFees(inputs);
    const applicableFees = result.fees;
    const totalFeesFetched = result.totalFeesFetched;
    const calculatedFees: CalculatedFee[] = [];

    console.log(`💰 Calculating amounts for ${applicableFees.length} fees...`);
    console.log(`📊 Total fees fetched from DB: ${totalFeesFetched}`);

    // Calculate each fee
    for (const fee of applicableFees) {
        try {
            const result = this.calculateSingleFee(fee, inputs);
            if (result) {
                calculatedFees.push(result);
            } else {
                console.warn(`⚠️  Fee ${fee.feeName} returned null`);
            }
        } catch (error) {
            console.error(`❌ Error calculating fee ${fee.feeName}:`, error);
        }
    }

    console.log(`✅ Successfully calculated ${calculatedFees.length} fees`);

    // Filter out sum_fees formulas
    const displayableFees = calculatedFees.filter(fee => fee.formulaType !== 'sum_fees');
    console.log(`🧹 Filtered out sum formulas: ${calculatedFees.length} -> ${displayableFees.length} fees`);

    // Separate one-time vs recurring fees
    const oneTimeFees = displayableFees
        .filter(f => !f.isRecurring)
        .reduce((sum, fee) => sum + fee.calculatedAmount, 0);

    const monthlyFees = displayableFees
        .filter(f => f.isRecurring && f.recurringPeriod === 'month')
        .reduce((sum, fee) => sum + fee.calculatedAmount, 0);

    const annualOperatingCosts = monthlyFees * 12;
    const firstYearTotal = oneTimeFees + annualOperatingCosts;

    // Group by category and agency
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
        fees: displayableFees,  // <-- RETURNS FEES ARRAY HERE
        byCategory,
        byAgency,
        project: inputs,
        totalFeesFetched,
        applicableFeesCount: displayableFees.length
    };
}
```

### Get Applicable Fees (lines 276-1273):
```typescript
private async getApplicableFees(inputs: ProjectInputs): Promise<{fees: any[], totalFeesFetched: number}> {
    // Get jurisdiction
    const { data: jurisdiction, error: jurisdictionError } = await this.supabase
        .from('jurisdictions')
        .select('id, jurisdiction_name, state_code')
        .eq('jurisdiction_name', inputs.jurisdictionName)
        .eq('state_code', inputs.stateCode)
        .single();

    if (jurisdictionError || !jurisdiction) {
        throw new Error(`Jurisdiction not found: ${inputs.jurisdictionName}, ${inputs.stateCode}`);
    }

    // Get fee IDs for selected service areas
    let feeIdsQuery = this.supabase
        .from('fees')
        .select('id, service_area_id')
        .eq('jurisdiction_id', jurisdiction.id)
        .eq('is_active', true);

    let selectedServiceAreaIds = inputs.selectedServiceAreaIds || [];

    // Check if service_areas table exists
    const { data: serviceAreasCheck } = await this.supabase
        .from('service_areas')
        .select('id')
        .eq('jurisdiction_id', jurisdiction.id)
        .limit(1);

    if (!serviceAreasCheck || serviceAreasCheck.length === 0) {
        console.log('📍 Query: ALL fees (no service_areas table found)');
    } else if (selectedServiceAreaIds.length === 0) {
        console.log('📍 Query: ALL fees (no service areas selected - including all citywide and service-area-specific fees)');
    } else {
        // Show citywide + selected service area fees
        const serviceAreaList = selectedServiceAreaIds.join(',');
        const orCondition = `service_area_id.is.null,service_area_id.in.(${serviceAreaList})`;
        console.log('📍 Query: Citywide + selected areas:', orCondition);
        feeIdsQuery = feeIdsQuery.or(orCondition);
    }

    const { data: feeIds, error: feeIdsError } = await feeIdsQuery;

    if (feeIdsError) {
        throw new Error(`Error fetching fees: ${feeIdsError.message}`);
    }

    if (!feeIds || feeIds.length === 0) {
        console.log('❌ No fees found for jurisdiction');
        return { fees: [], totalFeesFetched: 0 };
    }

    console.log(`📦 Found ${feeIds.length} fees (citywide + service area specific)`);

    // Fetch full fee data with calculations
    const allFees: any[] = [];
    const batchSize = 100;
    const totalBatches = Math.ceil(feeIds.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, feeIds.length);
        const batchIds = feeIds.slice(batchStart, batchEnd).map(f => f.id);

        console.log(`📦 Fetching batch ${i + 1}/${totalBatches} (${batchIds.length} fees)`);

        const { data: batchFees, error: batchError } = await this.supabase
            .from('fees')
            .select(`
                id,
                name,
                jurisdiction_id,
                agency_id,
                service_area_id,
                category,
                applies_to,
                use_subtypes,
                agencies (id, name, short_name),
                service_areas (id, name),
                fee_calculations (
                    id,
                    rate,
                    unit_label,
                    calc_type,
                    tiers,
                    formula_type,
                    formula_config,
                    applies_to_meter_sizes,
                    applies_to_project_types,
                    applies_to_use_subtypes,
                    effective_start,
                    effective_end,
                    min_fee,
                    max_fee
                )
            `)
            .in('id', batchIds);

        if (batchError) {
            console.error(`❌ Error fetching batch ${i + 1}:`, batchError);
            continue;
        }

        if (batchFees) {
            allFees.push(...batchFees);
        }
    }

    console.log(`📊 Total: ${allFees.length} fees`);

    // FILTER BY PROJECT TYPE AND SUBTYPE
    console.log('\n' + '='.repeat(80));
    console.log('📊 STARTING FEE FILTERING - Total fees fetched:', allFees.length);
    console.log('='.repeat(80));

    const filteredFees = allFees.filter(fee => {
        const appliesTo = fee.applies_to || [];
        const useSubtypes = fee.use_subtypes || [];
        const feeName = fee.name || '';

        // Call feeAppliesToProject with BOTH arrays
        const typeMatches = this.feeAppliesToProject(
            appliesTo,
            useSubtypes,
            inputs.projectType,
            inputs.useSubtype,
            feeName
        );

        return typeMatches;
    });

    console.log(`✅ After filtering: ${filteredFees.length} applicable fees`);

    // Deduplicate fees
    const uniqueFees = this.deduplicateFees(filteredFees);
    console.log(`🔄 After deduplication: ${uniqueFees.length} unique fees`);

    // Map to standard format
    const mappedFees = uniqueFees.map(fee => {
        const agency = Array.isArray(fee.agencies) ? fee.agencies[0] : fee.agencies;
        const serviceArea = Array.isArray(fee.service_areas) ? fee.service_areas[0] : fee.service_areas;

        return {
            feeId: fee.id,
            feeName: fee.name,
            jurisdictionId: fee.jurisdiction_id,
            agencyId: fee.agency_id,
            agencyName: agency?.name || agency?.short_name || 'Unknown Agency',
            serviceAreaId: fee.service_area_id,
            serviceArea: serviceArea?.name || 'CITYWIDE',
            category: fee.category || 'Other',
            appliesTo: fee.applies_to || [],
            useSubtypes: fee.use_subtypes || [],
            feeCalculations: fee.fee_calculations || []
        };
    });

    return {
        fees: mappedFees,
        totalFeesFetched: allFees.length
    };
}
```

### Fee Matching Logic (lines 1288-1413):
```typescript
private feeAppliesToProject(
    appliesTo: string[],
    useSubtypes: string[],
    projectType: string,
    useSubtype: string | undefined,
    feeName: string = ''
): boolean {
    const feeNameLower = feeName.toLowerCase();
    const selectedType = projectType.toLowerCase();

    console.log(`\n🔍 ${feeName}`);
    console.log(`   applies_to: ${JSON.stringify(appliesTo)}`);
    console.log(`   use_subtypes: ${JSON.stringify(useSubtypes)}`);

    // EXCLUDE voluntary/optional
    if (feeNameLower.includes('voluntary') || feeNameLower.includes('optional')) {
        console.log(`   ❌ Voluntary/Optional`);
        return false;
    }

    // Empty applies_to = universal (utility fees)
    if (!appliesTo || appliesTo.length === 0) {
        console.log(`   ✅ Universal fee`);
        return true;
    }

    // Check category
    const isMultiFamily = selectedType.includes('multi');
    const isSingleFamily = selectedType.includes('single') && !isMultiFamily;

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
                if (sub.includes('multi')) {
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
```

---

## SUMMARY OF FLOW:

1. **User enters data** → Auto-triggers `useEffect` (line 799 in CustomLewisPortal.tsx)
2. **useEffect calls** → `calculateTotalFees()` (line 735)
3. **calculateTotalFees makes API call** → `POST /api/lewis` with action `calculateProjectFees` (line 758)
4. **API route receives request** → Calls `FeeCalculator.calculateFees()` (line 193 in route.ts)
5. **Calculator.calculateFees()** → Calls `getApplicableFees()` (line 71 in index.ts)
6. **getApplicableFees()** →
   - Fetches fees from database
   - Filters using `feeAppliesToProject()` (line 1288)
   - Returns `{fees: [...], totalFeesFetched: X}`
7. **Calculator.calculateFees()** →
   - Calculates amounts for each fee
   - Returns `FeeBreakdown` with `fees` array (line 120)
8. **API route returns** → `{success: true, data: {..., fees: [...], applicableFeesCount: X}}`
9. **UI receives response** → Sets `calculatedFees` state (line 772 in CustomLewisPortal.tsx)
10. **UI renders** →
    - Checks if `calculatedFees` exists (line 1396)
    - Filters `calculatedFees.fees` for `calculatedAmount > 0` (line 1406)
    - Separates into `oneTimeFees` and `recurringFees` (line 1745-1746)
    - Displays both lists (lines 1797-1877)

## POTENTIAL BREAK POINTS:

1. **Line 772**: `setCalculatedFees(result.data)` - Is `result.data` actually set?
2. **Line 1406**: `calculatedFees?.fees?.filter(fee => fee.calculatedAmount > 0)` - Are fees missing `calculatedAmount`?
3. **Line 208 in route.ts**: Mapping fees - Is something lost in the mapping?
4. **Multiple useEffects**: Lines 432-477 ALSO calls API and sets state - CONFLICT?
