import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testDenverSDCFix() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING DENVER SYSTEM DEVELOPMENT CHARGE FIX');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: denver } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    const { data: serviceArea } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', denver!.id)
        .eq('name', 'Inside Denver')
        .single();

    console.log('\n✅ Testing with "Inside Denver" service area');
    console.log(`   Service Area ID: ${serviceArea?.id}`);

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test 1: 50 units (user's original test case)
    console.log('\n\n📍 TEST 1: 50-unit Multi-Family Project');
    console.log('-'.repeat(80));

    const result50 = await calculator.calculateFees({
        jurisdictionName: 'Denver',
        stateCode: 'CO',
        selectedServiceAreaIds: [serviceArea!.id],
        projectType: 'Residential',
        useSubtype: 'Multifamily',
        numUnits: 50,
        squareFeet: 45000,
        projectValue: undefined,
        meterSize: undefined
    });

    console.log('\n✅ Result:');
    console.log(`   Total Fees: ${result50.fees.length}`);
    console.log(`   One-time Total: $${result50.oneTimeFees.toLocaleString()}`);
    console.log(`   Monthly Total: $${result50.monthlyFees.toLocaleString()}`);

    const sdcFee = result50.fees.find(f => f.feeName.includes('System Development Charge'));
    if (sdcFee) {
        console.log('\n✅ System Development Charge FOUND:');
        console.log(`   Amount: $${sdcFee.calculatedAmount.toLocaleString()}`);
        console.log(`   Calculation: ${sdcFee.calculation}`);
        console.log(`   Expected: 50 units × $10,040 = $502,000`);

        if (sdcFee.calculatedAmount === 502000) {
            console.log('   ✅ CORRECT!');
        } else {
            console.log(`   ❌ WRONG! Got $${sdcFee.calculatedAmount} instead of $502,000`);
        }
    } else {
        console.log('\n❌ System Development Charge NOT FOUND in results');
    }

    // Test 2: 10 units (smaller project)
    console.log('\n\n📍 TEST 2: 10-unit Multi-Family Project');
    console.log('-'.repeat(80));

    const result10 = await calculator.calculateFees({
        jurisdictionName: 'Denver',
        stateCode: 'CO',
        selectedServiceAreaIds: [serviceArea!.id],
        projectType: 'Residential',
        useSubtype: 'Multifamily',
        numUnits: 10,
        squareFeet: 10000,
        projectValue: undefined,
        meterSize: undefined
    });

    console.log('\n✅ Result:');
    console.log(`   Total Fees: ${result10.fees.length}`);
    console.log(`   One-time Total: $${result10.oneTimeFees.toLocaleString()}`);

    const sdcFee10 = result10.fees.find(f => f.feeName.includes('System Development Charge'));
    if (sdcFee10) {
        console.log('\n✅ System Development Charge FOUND:');
        console.log(`   Amount: $${sdcFee10.calculatedAmount.toLocaleString()}`);
        console.log(`   Expected: 10 units × $10,040 = $100,400`);

        if (sdcFee10.calculatedAmount === 100400) {
            console.log('   ✅ CORRECT!');
        } else {
            console.log(`   ❌ WRONG! Got $${sdcFee10.calculatedAmount} instead of $100,400`);
        }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✨ Test Complete');
    console.log('='.repeat(80));
}

testDenverSDCFix().catch(console.error);
