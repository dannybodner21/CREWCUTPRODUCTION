/**
 * Test Los Angeles API response
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testLA() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    console.log('🧮 Testing Los Angeles fee calculation...\n');

    const projectInputs: ProjectInputs = {
        jurisdictionName: 'Los Angeles',
        stateCode: 'CA',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 20000,
        projectValue: 2500000,
        meterSize: '3/4"'
    };

    try {
        const breakdown = await calculator.calculateFees(projectInputs);

        console.log('\n✅ Fee Calculation Results:');
        console.log(`   One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}`);
        console.log(`   First Year Total: $${breakdown.firstYearTotal.toLocaleString()}`);
        console.log(`   Total Fees Found: ${breakdown.fees.length}`);
        console.log(`   Fees with amounts > 0: ${breakdown.fees.filter(f => f.calculatedAmount > 0).length}`);

        if (breakdown.fees.length > 0) {
            console.log('\n   Sample fees (first 10):');
            breakdown.fees.slice(0, 10).forEach(fee => {
                console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toFixed(2)}`);
            });
        }
    } catch (error) {
        console.error('❌ Error calculating fees:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
        }
    }
}

testLA().catch(console.error);
