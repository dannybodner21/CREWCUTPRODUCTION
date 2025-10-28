/**
 * Test STRICT fee matching logic
 *
 * Expected results:
 * - Multi-Family should NOT match Single-Family fees
 * - Should see ~7-10 fees for each jurisdiction, NOT 30
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';

async function testStrictMatching() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING STRICT FEE MATCHING');
    console.log('='.repeat(80));

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test 1: Phoenix Multi-Family
    console.log('\n\n📍 TEST 1: Phoenix Multi-Family (50 units, 45,000 sq ft)');
    console.log('-'.repeat(80));
    try {
        const phoenixResult = await calculator.calculateFees({
            jurisdictionName: 'Phoenix city',
            stateCode: 'AZ',
            selectedServiceAreaIds: [], // Will default to citywide
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Phoenix Result:`);
        console.log(`   Applicable Fees: ${phoenixResult.fees.length}`);
        console.log(`   One-Time Total: $${phoenixResult.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Total: $${phoenixResult.monthlyFees.toLocaleString()}`);
        console.log(`\n   Fee List:`);
        phoenixResult.fees.forEach((fee, i) => {
            console.log(`   ${i + 1}. ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
        });
    } catch (error) {
        console.error('❌ Phoenix test failed:', error);
    }

    // Test 2: Austin Multi-Family
    console.log('\n\n📍 TEST 2: Austin Multi-Family (50 units, 45,000 sq ft)');
    console.log('-'.repeat(80));
    try {
        const austinResult = await calculator.calculateFees({
            jurisdictionName: 'Austin',
            stateCode: 'TX',
            selectedServiceAreaIds: [], // Will default to citywide
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Austin Result:`);
        console.log(`   Applicable Fees: ${austinResult.fees.length}`);
        console.log(`   One-Time Total: $${austinResult.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Total: $${austinResult.monthlyFees.toLocaleString()}`);
        console.log(`\n   Fee List:`);
        austinResult.fees.forEach((fee, i) => {
            console.log(`   ${i + 1}. ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
        });
    } catch (error) {
        console.error('❌ Austin test failed:', error);
    }

    // Test 3: Denver Multi-Family
    console.log('\n\n📍 TEST 3: Denver Multi-Family (50 units, 45,000 sq ft)');
    console.log('-'.repeat(80));
    try {
        const denverResult = await calculator.calculateFees({
            jurisdictionName: 'Denver',
            stateCode: 'CO',
            selectedServiceAreaIds: [], // Will default to citywide
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Denver Result:`);
        console.log(`   Applicable Fees: ${denverResult.fees.length}`);
        console.log(`   One-Time Total: $${denverResult.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Total: $${denverResult.monthlyFees.toLocaleString()}`);
        console.log(`\n   Fee List:`);
        denverResult.fees.forEach((fee, i) => {
            console.log(`   ${i + 1}. ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
        });
    } catch (error) {
        console.error('❌ Denver test failed:', error);
    }

    console.log('\n\n='.repeat(80));
    console.log('✨ Test Complete');
    console.log('='.repeat(80));
    console.log('\n📊 Expected Results:');
    console.log('   - Each jurisdiction should show 7-15 fees (NOT 30+)');
    console.log('   - NO Single-Family fees should appear');
    console.log('   - Check console logs above for ✅ INCLUDED and ❌ EXCLUDED messages');
}

// Run tests
testStrictMatching().catch(console.error);
