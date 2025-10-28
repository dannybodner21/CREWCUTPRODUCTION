import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testPortland() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    // Get Non-Central City service area (Portland default)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Portland')
        .eq('state_code', 'OR')
        .single();

    const { data: nonCentralCity } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id)
        .eq('name', 'Non-Central City')
        .single();

    console.log(`📍 Selected service area: ${nonCentralCity?.name || 'None'} (${nonCentralCity?.id || 'N/A'})\n`);

    const inputs: ProjectInputs = {
        jurisdictionName: 'Portland',
        stateCode: 'OR',
        selectedServiceAreaIds: nonCentralCity ? [nonCentralCity.id] : [],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 1,
        squareFeet: 2500,
        projectValue: 500000,
        meterSize: '3/4"'
    };

    console.log('🧮 Testing Portland Calculator with single-family 2,500 sqft home\n');

    const breakdown = await calculator.calculateFees(inputs);

    console.log(`Total One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}\n`);

    console.log('All fees calculated:');
    breakdown.fees
        .filter(f => f.calculatedAmount > 0)
        .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
        .forEach(fee => {
            const type = fee.isRecurring ? 'MONTHLY' : 'ONE-TIME';
            console.log(`  [${type}] ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        });

    console.log('\n🔍 Checking for specific issues:\n');

    // Issue 1: Multiple water meter sizes
    const waterSDCFees = breakdown.fees.filter(f =>
        f.feeName?.toLowerCase().includes('water') &&
        f.feeName?.toLowerCase().includes('sdc')
    );
    console.log(`1️⃣ Water SDC fees found: ${waterSDCFees.length} (should be 1 for 3/4" meter)`);
    waterSDCFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 2: Multiple transportation tiers
    const transportationFees = breakdown.fees.filter(f =>
        f.feeName?.toLowerCase().includes('transportation') &&
        f.feeName?.toLowerCase().includes('sdc')
    );
    console.log(`\n2️⃣ Transportation SDC fees found: ${transportationFees.length} (should be 1 - ≥1,200 SF tier)`);
    transportationFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Check all SDC types
    const sdcFees = breakdown.fees.filter(f => f.feeName?.toLowerCase().includes('sdc'));
    console.log(`\n3️⃣ All SDC fees (${sdcFees.length}):`);
    const sdcTypes = [...new Set(sdcFees.map(f => {
        const name = f.feeName || '';
        return name.split(' SDC')[0];
    }))];
    sdcTypes.forEach(type => console.log(`   - ${type}`));
}

testPortland().catch(console.error);
