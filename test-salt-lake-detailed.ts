/**
 * Test Salt Lake City fee calculation with detailed output
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testSaltLake() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    console.log('🧮 Testing fee calculation for 10-unit single-family project...\n');

    const projectInputs: ProjectInputs = {
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
        const breakdown = await calculator.calculateFees(projectInputs);

        console.log('\n✅ Fee Calculation Results:');
        console.log(`   One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}`);
        console.log(`   First Year Total: $${breakdown.firstYearTotal.toLocaleString()}`);
        console.log(`   Total Fees Found: ${breakdown.fees.length}`);
        console.log(`   Fees with amounts > 0: ${breakdown.fees.filter(f => f.calculatedAmount > 0).length}`);

        // Group by category
        console.log('\n📊 Fees by Category:');
        const byCategory = breakdown.fees.reduce((acc, fee) => {
            if (!acc[fee.category]) acc[fee.category] = [];
            acc[fee.category].push(fee);
            return acc;
        }, {} as Record<string, any[]>);

        for (const [category, fees] of Object.entries(byCategory)) {
            const total = fees.reduce((sum, f) => sum + f.calculatedAmount, 0);
            console.log(`\n   ${category}: $${total.toLocaleString()}`);
            fees.forEach(fee => {
                if (fee.calculatedAmount > 0) {
                    console.log(`      - ${fee.feeName}: $${fee.calculatedAmount.toFixed(2)}`);
                    console.log(`        ${fee.calculation}`);
                }
            });
        }

        // Check for specific important fees
        console.log('\n🔍 Looking for key fees:');
        const keyFeeNames = [
            'Water Connection',
            'Sewer Connection',
            'Building Permit',
            'Impact Fee',
            'Storm Water'
        ];

        for (const keyName of keyFeeNames) {
            const found = breakdown.fees.filter(f => f.feeName.toLowerCase().includes(keyName.toLowerCase()));
            if (found.length > 0) {
                console.log(`   ✅ Found ${found.length} "${keyName}" fee(s)`);
                found.forEach(f => console.log(`      - ${f.feeName}: $${f.calculatedAmount}`));
            } else {
                console.log(`   ❌ No "${keyName}" fees found`);
            }
        }
    } catch (error) {
        console.error('❌ Error calculating fees:', error);
    }
}

testSaltLake().catch(console.error);
