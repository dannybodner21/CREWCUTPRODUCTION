import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';

async function testPhoenixDallas() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING PHOENIX vs DALLAS COMPARISON');
    console.log('='.repeat(80));

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test Phoenix
    console.log('\n📍 TESTING PHOENIX');
    try {
        const phoenixResult = await calculator.calculateFees({
            jurisdictionName: 'Phoenix',
            stateCode: 'AZ',
            selectedServiceAreaIds: [],
            projectType: 'Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: '3/4"'
        });

        console.log('✅ Phoenix Results:');
        console.log(`   Total Fees: ${phoenixResult.fees.length}`);
        console.log(`   One-time: $${phoenixResult.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly: $${phoenixResult.monthlyFees.toLocaleString()}`);
        console.log('\n   Top 3 fees:');
        phoenixResult.fees
            .filter(f => !f.isRecurring && f.calculatedAmount > 0)
            .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
            .slice(0, 3)
            .forEach(f => {
                console.log(`     - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`);
            });
    } catch (error) {
        console.error('❌ Phoenix Error:', error instanceof Error ? error.message : error);
    }

    // Test Dallas
    console.log('\n📍 TESTING DALLAS');
    try {
        const dallasResult = await calculator.calculateFees({
            jurisdictionName: 'Dallas',
            stateCode: 'TX',
            selectedServiceAreaIds: [],
            projectType: 'Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: '3/4"'
        });

        console.log('✅ Dallas Results:');
        console.log(`   Total Fees: ${dallasResult.fees.length}`);
        console.log(`   One-time: $${dallasResult.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly: $${dallasResult.monthlyFees.toLocaleString()}`);
        console.log('\n   Top 3 fees:');
        dallasResult.fees
            .filter(f => !f.isRecurring && f.calculatedAmount > 0)
            .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
            .slice(0, 3)
            .forEach(f => {
                console.log(`     - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`);
            });
    } catch (error) {
        console.error('❌ Dallas Error:', error instanceof Error ? error.message : error);
    }

    console.log('\n' + '='.repeat(80));
}

testPhoenixDallas().catch(console.error);
