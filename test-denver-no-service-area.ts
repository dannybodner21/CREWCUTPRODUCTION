import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';

async function testDenverNoServiceArea() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING DENVER WITH NO SERVICE AREA SELECTED');
    console.log('='.repeat(80));

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('\n📊 TEST: Denver Multi-Family with NO service areas selected');
    console.log('-'.repeat(80));

    try {
        const result = await calculator.calculateFees({
            jurisdictionName: 'Denver',
            stateCode: 'CO',
            selectedServiceAreaIds: [], // NO service areas selected
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Denver Result (NO service areas):`);
        console.log(`   Applicable Fees: ${result.fees.length}`);
        console.log(`   One-Time Total: $${result.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Total: $${result.monthlyFees.toLocaleString()}`);

        if (result.fees.length > 0) {
            console.log(`\n   Fee List:`);
            result.fees.forEach((fee, i) => {
                console.log(`   ${i + 1}. ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
            });
        } else {
            console.log('\n❌ NO FEES RETURNED - THIS IS THE BUG THE USER IS REPORTING!');
        }
    } catch (error) {
        console.error('❌ Denver test failed:', error);
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✨ Test Complete');
    console.log('='.repeat(80));
}

testDenverNoServiceArea().catch(console.error);
