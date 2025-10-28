import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testLA() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    // Get LA service areas
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Los Angeles')
        .eq('state_code', 'CA')
        .single();

    console.log('📍 Los Angeles Jurisdiction ID:', jurisdiction?.id, '\n');

    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id);

    console.log('Available service areas:');
    serviceAreas?.forEach(sa => console.log(`  - ${sa.name}`));

    // Find Medium-High Market Area
    const mediumHighArea = serviceAreas?.find(sa => sa.name.includes('Medium-High'));
    console.log(`\n📍 Selected: ${mediumHighArea?.name} (${mediumHighArea?.id})\n`);

    const inputs: ProjectInputs = {
        jurisdictionName: 'Los Angeles',
        stateCode: 'CA',
        selectedServiceAreaIds: mediumHighArea ? [mediumHighArea.id] : [],
        projectType: 'Multi-Family Residential',
        useSubtype: null,
        numUnits: 50,
        squareFeet: 45000,
        projectValue: 8000000,
        meterSize: '3/4"'
    };

    console.log('🧮 Testing LA Calculator for 50-unit multifamily (45,000 sqft)\n');

    const breakdown = await calculator.calculateFees(inputs);

    console.log(`Total One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}\n`);

    // Check for Affordable Housing
    const affordableHousingFees = breakdown.fees.filter(f =>
        f.feeName.toLowerCase().includes('affordable') &&
        f.feeName.toLowerCase().includes('housing')
    );

    console.log('🏠 Affordable Housing Fees Found:', affordableHousingFees.length);
    affordableHousingFees.forEach(fee => {
        console.log(`  - ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        if (fee.calculation) {
            console.log(`    Calculation: ${fee.calculation}`);
        }
    });

    if (affordableHousingFees.length === 0) {
        console.log('  ❌ NO AFFORDABLE HOUSING FEES FOUND!');
        console.log('  Expected: Affordable Housing Linkage Fee = $15.47/sq ft × 45,000 = $696,150');
    }

    console.log('\n📋 Top 5 One-Time Fees:');
    breakdown.fees
        .filter(f => f.calculatedAmount > 0 && !f.isRecurring)
        .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
        .slice(0, 5)
        .forEach((fee, index) => {
            console.log(`${index + 1}. ${fee.feeName}: $${Math.round(fee.calculatedAmount).toLocaleString()}`);
        });
}

testLA().catch(console.error);
