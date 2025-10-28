import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testDenver() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    // Get "Inside City of Denver" service area ID
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    // First, let's see all service areas
    const { data: allAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id)
        .order('name');

    console.log('🗺️  All Denver service areas:');
    allAreas?.forEach(a => console.log(`   - ${a.name} (${a.id})`));
    console.log();

    const { data: insideCity } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id)
        .ilike('name', '%Inside Denver%')
        .single();

    console.log(`📍 Selected service area: ${insideCity?.name} (${insideCity?.id})\n`);

    const inputs: ProjectInputs = {
        jurisdictionName: 'Denver',
        stateCode: 'CO',
        selectedServiceAreaIds: insideCity ? [insideCity.id] : [],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 1,
        squareFeet: 2500,
        projectValue: 500000,
        meterSize: '3/4"'
    };

    console.log('🧮 Testing Denver Calculator with single-family 2,500 sqft home\n');

    const breakdown = await calculator.calculateFees(inputs);

    console.log(`Total One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}\n`);

    console.log('Top fees:');
    breakdown.fees
        .filter(f => f.calculatedAmount > 100)
        .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
        .forEach(fee => {
            const type = fee.isRecurring ? 'MONTHLY' : 'ONE-TIME';
            console.log(`  [${type}] ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        });

    console.log('\n🔍 Checking for specific issues:\n');

    // Issue 1: Commercial sewer fees showing for residential
    const commercialSewerFees = breakdown.fees.filter(f =>
        f.feeName?.toLowerCase().includes('sewer') &&
        f.feeName?.toLowerCase().includes('commercial')
    );
    console.log(`1️⃣ Commercial sewer fees found: ${commercialSewerFees.length} (should be 0)`);
    commercialSewerFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 2: System Development Charge
    const systemDevCharge = breakdown.fees.find(f =>
        f.feeName?.toLowerCase().includes('system development charge')
    );
    console.log(`\n2️⃣ System Development Charge: ${systemDevCharge ? `$${systemDevCharge.calculatedAmount.toLocaleString()}` : 'MISSING'}`);
    if (systemDevCharge) {
        console.log(`   Expected: ~$5,905`);
    }

    // Issue 3: Multiple water volume rates
    const waterVolumeFees = breakdown.fees.filter(f =>
        f.feeName?.toLowerCase().includes('water') &&
        (f.feeName?.toLowerCase().includes('volume') || f.feeName?.toLowerCase().includes('rate'))
    );
    console.log(`\n3️⃣ Water volume rates found: ${waterVolumeFees.length} (should be 1 for Inside City)`);
    waterVolumeFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 4: Multiple affordable housing tiers
    const affordableHousingFees = breakdown.fees.filter(f =>
        f.feeName?.toLowerCase().includes('affordable') &&
        f.feeName?.toLowerCase().includes('housing')
    );
    console.log(`\n4️⃣ Affordable housing fees found: ${affordableHousingFees.length} (should be 1 - Large Units tier)`);
    affordableHousingFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 5: Affordable housing calculation
    const largeUnitFee = breakdown.fees.find(f =>
        f.feeName?.toLowerCase().includes('affordable') &&
        f.feeName?.toLowerCase().includes('large')
    );
    if (largeUnitFee) {
        console.log(`\n5️⃣ Large Units affordable housing calculation:`);
        console.log(`   Rate: $8/sq ft`);
        console.log(`   Square feet: 2,500`);
        console.log(`   Expected: $20,000`);
        console.log(`   Actual: $${largeUnitFee.calculatedAmount.toLocaleString()}`);
    }
}

testDenver().catch(console.error);
