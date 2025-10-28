import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';

async function testAustinUnitMatching() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING AUSTIN TRANSPORTATION FEE UNIT MATCHING');
    console.log('='.repeat(80));

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test 1: 10-unit Multi-Family - should NOT match duplex/triplex/fourplex
    console.log('\n\n📍 TEST 1: 10-unit Multi-Family Project');
    console.log('-'.repeat(80));

    const test1 = await calculator.calculateFees({
        jurisdictionName: 'Austin',
        stateCode: 'TX',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Multifamily',
        numUnits: 10,
        squareFeet: 10000,
        projectValue: undefined,
        meterSize: undefined
    });

    console.log('\n✅ Result:');
    console.log(`   Total Fees: ${test1.fees.length}`);
    console.log(`   One-time: $${test1.oneTimeFees.toLocaleString()}`);
    console.log(`   Monthly: $${test1.monthlyFees.toLocaleString()}`);

    const transportFees = test1.fees.filter(f => f.feeName.includes('Transportation User Fee'));
    console.log(`\n   Transportation User Fees: ${transportFees.length}`);
    transportFees.forEach(f => {
        console.log(`      - ${f.feeName}: $${f.calculatedAmount}`);
    });

    console.log('\n   ❌ Should NOT see:');
    console.log('      - Duplex (requires 2 units)');
    console.log('      - Triplex (requires 3 units)');
    console.log('      - Fourplex (requires 4 units)');
    console.log('      - Garage Apartment (single-family)');
    console.log('      - Mobile Home (single-family)');

    // Test 2: 2-unit Duplex
    console.log('\n\n📍 TEST 2: 2-unit Duplex Project');
    console.log('-'.repeat(80));

    const test2 = await calculator.calculateFees({
        jurisdictionName: 'Austin',
        stateCode: 'TX',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Multifamily',
        numUnits: 2,
        squareFeet: 2000,
        projectValue: undefined,
        meterSize: undefined
    });

    const transportFees2 = test2.fees.filter(f => f.feeName.includes('Transportation User Fee'));
    console.log(`\n   Transportation User Fees: ${transportFees2.length}`);
    transportFees2.forEach(f => {
        console.log(`      - ${f.feeName}: $${f.calculatedAmount}`);
    });

    console.log('\n   ✅ Should see: Duplex');
    console.log('   ❌ Should NOT see: Triplex, Fourplex, Townhouse/Condo');

    // Test 3: 3-unit Triplex
    console.log('\n\n📍 TEST 3: 3-unit Triplex Project');
    console.log('-'.repeat(80));

    const test3 = await calculator.calculateFees({
        jurisdictionName: 'Austin',
        stateCode: 'TX',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Multifamily',
        numUnits: 3,
        squareFeet: 3000,
        projectValue: undefined,
        meterSize: undefined
    });

    const transportFees3 = test3.fees.filter(f => f.feeName.includes('Transportation User Fee'));
    console.log(`\n   Transportation User Fees: ${transportFees3.length}`);
    transportFees3.forEach(f => {
        console.log(`      - ${f.feeName}: $${f.calculatedAmount}`);
    });

    console.log('\n   ✅ Should see: Triplex');
    console.log('   ❌ Should NOT see: Duplex, Fourplex, Townhouse/Condo');

    console.log('\n\n' + '='.repeat(80));
    console.log('✨ Test Complete');
    console.log('='.repeat(80));
}

testAustinUnitMatching().catch(console.error);
