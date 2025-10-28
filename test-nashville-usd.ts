import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';

async function testNashvilleUSD() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING NASHVILLE WITH URBAN SERVICES DISTRICT SELECTED');
    console.log('='.repeat(80));

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Urban Services District service area ID from database check
    const urbanServicesDistrictId = 'dd9fe2d7-6553-4b76-842c-fabefbf3fc53';

    const result = await calculator.calculateFees({
        jurisdictionName: 'Nashville',
        stateCode: 'TN',
        selectedServiceAreaIds: [urbanServicesDistrictId],
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

testNashvilleUSD().catch(console.error);
