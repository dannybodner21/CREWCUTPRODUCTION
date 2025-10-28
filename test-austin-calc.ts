import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testAustin() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    // Get Inner Loop service area ID
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Austin')
        .single();

    const { data: innerLoop } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id)
        .ilike('name', 'Inner Loop%')
        .single();

    console.log(`📍 Selected service area: ${innerLoop?.name} (${innerLoop?.id})\n`);

    const inputs: ProjectInputs = {
        jurisdictionName: 'Austin',
        stateCode: 'TX',
        selectedServiceAreaIds: innerLoop ? [innerLoop.id] : [],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 25000, // 2,500 sqft per unit
        projectValue: 2500000,
        meterSize: '1"'
    };

    console.log('🧮 Testing Austin Calculator with 10-unit single-family project in Inner Loop\n');

    const breakdown = await calculator.calculateFees(inputs);

    console.log(`Total One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}\n`);

    console.log('All fees calculated:');
    breakdown.fees
        .filter(f => f.calculatedAmount > 0)
        .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
        .forEach(fee => {
            console.log(`  ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        });

    console.log('\n🔍 Checking for specific issues:\n');

    // Issue 1: Street Impact Fee
    const streetFees = breakdown.fees.filter(f => f.feeName?.toLowerCase().includes('street impact'));
    console.log(`1️⃣ Street Impact Fees found: ${streetFees.length}`);
    streetFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 2: Water/Wastewater
    const waterFees = breakdown.fees.filter(f =>
        f.feeName?.toLowerCase().includes('water impact') ||
        f.feeName?.toLowerCase().includes('wastewater impact')
    );
    console.log(`\n2️⃣ Water/Wastewater Impact Fees:`);
    waterFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()} (should be $${f.calculatedAmount === 4800 ? '48,000' : f.calculatedAmount === 2900 ? '29,000' : 'unknown'})`));

    // Issue 3: Transportation User Fees
    const transFees = breakdown.fees.filter(f => f.feeName?.toLowerCase().includes('transportation user fee'));
    console.log(`\n3️⃣ Transportation User Fees found: ${transFees.length} (should be 1)`);
    transFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 4: Questionable fees
    const questionable = breakdown.fees.filter(f =>
        f.feeName?.toLowerCase().includes('project consent') ||
        f.feeName?.toLowerCase().includes('volume builder')
    );
    console.log(`\n4️⃣ Questionable fees showing: ${questionable.length}`);
    questionable.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));
}

testAustin().catch(console.error);
