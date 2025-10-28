import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testPortlandUserScenario() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    console.log('🧮 Testing Portland Calculator with USER SCENARIO:');
    console.log('   - 2,500 sq ft Single Family home');
    console.log('   - $400,000 project value');
    console.log('   - 1 unit');
    console.log('   - NO service area selected (should default to Non-Central City)\n');

    // User scenario: NO service area selected initially
    const inputs: ProjectInputs = {
        jurisdictionName: 'Portland',
        stateCode: 'OR',
        selectedServiceAreaIds: [], // User didn't select service area
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 1,
        squareFeet: 2500,
        projectValue: 400000, // User's actual project value
        meterSize: '3/4"'
    };

    const breakdown = await calculator.calculateFees(inputs);

    console.log(`Total One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}\n`);

    console.log('All fees calculated:');
    breakdown.fees
        .filter(f => f.calculatedAmount > 0)
        .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
        .forEach(fee => {
            const type = fee.isRecurring ? 'MONTHLY' : 'ONE-TIME';
            console.log(`  [${type}] ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        });

    console.log('\n🔍 Expected fees:\n');
    console.log('  Parks SDC (2,200+ SF, Non-Central City): $17,952');
    console.log('  Water SDC (3/4"): $7,545');
    console.log('  Transportation SDC (Single-Family, ≥1,200 SF): $6,591');
    console.log('  Affordable Housing Tax (1% of $400k): $4,000');
    console.log('  Stormwater SDC: $1,330');
    console.log('  Building/Dev Fees: ~$800');
    console.log('  Expected total: ~$38,000\n');

    // Check specific issues
    const parksFee = breakdown.fees.find(f => f.feeName?.includes('Parks System Development Charge'));
    console.log(`\n❓ Issue #1 - Parks SDC showing? ${parksFee ? '✅ YES' : '❌ NO'}`);
    if (parksFee) {
        console.log(`   Found: ${parksFee.feeName} = $${parksFee.calculatedAmount.toLocaleString()}`);
    } else {
        console.log('   Parks SDC is MISSING from results!');
    }

    const housingTax = breakdown.fees.find(f => f.feeName?.includes('Affordable Housing'));
    console.log(`\n❓ Issue #2 - Affordable Housing Tax calculating correctly?`);
    if (housingTax) {
        console.log(`   Calculated: $${housingTax.calculatedAmount.toLocaleString()}`);
        console.log(`   Expected: $4,000 (1% of $400,000)`);
        console.log(`   ${housingTax.calculatedAmount === 4000 ? '✅ CORRECT' : '❌ WRONG'}`);
    }
}

testPortlandUserScenario().catch(console.error);
