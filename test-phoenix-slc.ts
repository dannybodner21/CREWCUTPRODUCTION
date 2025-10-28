import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testBoth() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    console.log('🧮 Testing Phoenix...\n');

    const phoenixInputs: ProjectInputs = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 20000,
        projectValue: 2500000,
        meterSize: '3/4"'
    };

    try {
        const phoenixBreakdown = await calculator.calculateFees(phoenixInputs);

        console.log('✅ Phoenix Results:');
        console.log(`   One-Time Fees: $${phoenixBreakdown.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Fees: $${phoenixBreakdown.monthlyFees.toLocaleString()}`);
        console.log(`   First Year Total: $${phoenixBreakdown.firstYearTotal.toLocaleString()}`);
        console.log(`   Total Fees Found: ${phoenixBreakdown.fees.length}`);
        console.log(`   Fees with amounts > 0: ${phoenixBreakdown.fees.filter(f => f.calculatedAmount > 0).length}`);

        if (phoenixBreakdown.fees.length > 0) {
            console.log('\n   Top 5 fees:');
            phoenixBreakdown.fees
                .filter(f => f.calculatedAmount > 0)
                .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
                .slice(0, 5)
                .forEach(fee => {
                    console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
                });
        }
    } catch (error) {
        console.error('❌ Phoenix Error:', error);
    }

    console.log('\n\n🧮 Testing Salt Lake City...\n');

    const slcInputs: ProjectInputs = {
        jurisdictionName: 'Salt Lake City',
        stateCode: 'UT',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 20000,
        projectValue: 2500000,
        meterSize: '3/4"'
    };

    try {
        const slcBreakdown = await calculator.calculateFees(slcInputs);

        console.log('✅ Salt Lake City Results:');
        console.log(`   One-Time Fees: $${slcBreakdown.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Fees: $${slcBreakdown.monthlyFees.toLocaleString()}`);
        console.log(`   First Year Total: $${slcBreakdown.firstYearTotal.toLocaleString()}`);
        console.log(`   Total Fees Found: ${slcBreakdown.fees.length}`);
        console.log(`   Fees with amounts > 0: ${slcBreakdown.fees.filter(f => f.calculatedAmount > 0).length}`);

        if (slcBreakdown.fees.length > 0) {
            console.log('\n   Top 5 fees:');
            slcBreakdown.fees
                .filter(f => f.calculatedAmount > 0)
                .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
                .slice(0, 5)
                .forEach(fee => {
                    console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
                });
        }
    } catch (error) {
        console.error('❌ Salt Lake City Error:', error);
    }
}

testBoth().catch(console.error);
