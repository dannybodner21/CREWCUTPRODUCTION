import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';

async function testNashvilleFees() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING NASHVILLE FEE CALCULATION');
    console.log('='.repeat(80));

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const result = await calculator.calculateFees({
        jurisdictionName: 'Nashville',
        stateCode: 'TN',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Multifamily',
        numUnits: 50,
        squareFeet: 50000,
        projectValue: undefined,
        meterSize: '2"'
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Fees: ${result.fees.length}`);
    console.log(`One-time Total: $${result.oneTimeFees.toLocaleString()}`);
    console.log(`Monthly Total: $${result.monthlyFees.toLocaleString()}`);

    console.log(`\n✅ All Fees:`);
    result.fees.forEach(f => {
        console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()} (${f.isRecurring ? 'monthly' : 'one-time'})`);
    });

    console.log('\n' + '='.repeat(80));
}

testNashvilleFees().catch(console.error);
