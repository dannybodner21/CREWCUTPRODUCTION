import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testSanDiego() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    const inputs: ProjectInputs = {
        jurisdictionName: 'San Diego',
        stateCode: 'CA',
        selectedServiceAreaIds: [], // Citywide - no specific community
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 1,
        squareFeet: 2500,
        projectValue: 500000,
        meterSize: '3/4"' // Changed from 5/8" to 3/4" per user spec
    };

    console.log('🧮 Testing San Diego Calculator with single-family 2,500 sqft home\n');

    const breakdown = await calculator.calculateFees(inputs);

    console.log(`Total One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}\n`);

    console.log('Top fees:');
    breakdown.fees
        .filter(f => f.calculatedAmount > 1000)
        .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
        .forEach(fee => {
            const type = fee.isRecurring ? 'MONTHLY' : 'ONE-TIME';
            console.log(`  [${type}] ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        });

    console.log('\n🔍 Checking for specific issues:\n');

    // Issue 0: Senior Housing fees (should not show for Single-Family)
    const seniorHousingFees = breakdown.fees.filter(f => f.feeName?.toLowerCase().includes('senior housing'));
    console.log(`0️⃣ Senior Housing fees found: ${seniorHousingFees.length} (should be 0 for Single-Family)`);
    seniorHousingFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 1: Multiple inclusionary fees
    const inclusionaryFees = breakdown.fees.filter(f => f.feeName?.toLowerCase().includes('inclusionary'));
    console.log(`1️⃣ Inclusionary Fees found: ${inclusionaryFees.length} (should be 1)`);
    inclusionaryFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 2: Sewer Capacity categorization
    const sewerCapacity = breakdown.fees.find(f => f.feeName?.toLowerCase().includes('sewer capacity'));
    if (sewerCapacity) {
        console.log(`\n2️⃣ Sewer Capacity Charge: $${sewerCapacity.calculatedAmount.toLocaleString()}`);
        console.log(`   Type: ${sewerCapacity.isRecurring ? 'MONTHLY (WRONG!)' : 'ONE-TIME (correct)'}`);
    }

    // Issue 3: Multiple future utility rates
    const futureRates = breakdown.fees.filter(f => {
        const name = f.feeName?.toLowerCase() || '';
        return name.match(/202[6-9]/) || name.match(/\(20[234]\d\)/);
    });
    console.log(`\n3️⃣ Future-dated utility rates found: ${futureRates.length} (should be 0)`);
    futureRates.forEach(f => console.log(`   - ${f.feeName}`));

    // Issue 4: Missing citywide DIFs
    const parkDIF = breakdown.fees.find(f => f.feeName?.includes('Park DIF') && f.feeName?.includes('2501'));
    const mobilityDIF = breakdown.fees.find(f => f.feeName?.includes('Mobility DIF') && f.feeName?.includes('2501'));
    const libraryDIF = breakdown.fees.find(f => f.feeName?.includes('Library DIF') && f.feeName?.includes('2501'));
    const fireDIF = breakdown.fees.find(f => f.feeName?.includes('Fire DIF') && f.feeName?.includes('2501'));

    console.log(`\n4️⃣ Citywide Development Impact Fees (2501+ SF tier):`);
    console.log(`   Park DIF: ${parkDIF ? `$${parkDIF.calculatedAmount.toLocaleString()}` : 'MISSING'}`);
    console.log(`   Mobility DIF: ${mobilityDIF ? `$${mobilityDIF.calculatedAmount.toLocaleString()}` : 'MISSING'}`);
    console.log(`   Library DIF: ${libraryDIF ? `$${libraryDIF.calculatedAmount.toLocaleString()}` : 'MISSING'}`);
    console.log(`   Fire DIF: ${fireDIF ? `$${fireDIF.calculatedAmount.toLocaleString()}` : 'MISSING'}`);

    // Issue 5: Multiple water meter sizes
    const waterMeterFees = breakdown.fees.filter(f => {
        const name = f.feeName?.toLowerCase() || '';
        return name.includes('water') && name.includes('meter') && name.match(/\d+\/\d+/);
    });
    console.log(`\n5️⃣ Water meter size fees found: ${waterMeterFees.length} (should show only 5/8" meter)`);
    waterMeterFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    // Issue 6: Community-specific fees
    const communityFees = breakdown.fees.filter(f => {
        const name = f.feeName?.toLowerCase() || '';
        return name.includes('community') && !name.includes('citywide');
    });
    console.log(`\n6️⃣ Community-specific fees found: ${communityFees.length} (should be 0 without area selection)`);
    communityFees.forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));
}

testSanDiego().catch(console.error);
