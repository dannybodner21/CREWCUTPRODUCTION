import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testMeterBug() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    // Get Medium-High Market Area service area
    const { data: jurisdiction } = await calculator['supabase']
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Los Angeles')
        .single();

    const { data: serviceAreas } = await calculator['supabase']
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id);

    const mediumHighArea = serviceAreas?.find(sa => sa.name === 'Medium-High Market Area');
    const allOtherZones = serviceAreas?.find(sa => sa.name === 'ALL OTHER ZONES');

    console.log('🧪 Testing Meter Size Bug\n');

    // Test with 3/4" meter
    console.log('TEST 1: With 3/4" meter:');
    const inputs34: ProjectInputs = {
        jurisdictionName: 'Los Angeles',
        stateCode: 'CA',
        selectedServiceAreaIds: [
            ...(mediumHighArea ? [mediumHighArea.id] : []),
            ...(allOtherZones ? [allOtherZones.id] : [])
        ],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 1,
        squareFeet: 2500,
        projectValue: 400000,
        meterSize: '3/4"'
    };

    const result34 = await calculator.calculateFees(inputs34);
    console.log(`   Total Fees: ${result34.fees.length}`);
    console.log(`   One-Time: $${result34.oneTimeFees.toLocaleString()}`);
    console.log('   Fees:');
    result34.fees
        .filter(f => f.calculatedAmount > 0)
        .forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    const hasAffordable34 = result34.fees.some(f => f.feeName.includes('Affordable Housing'));
    const hasWater34 = result34.fees.some(f => f.feeName.includes('Water') && f.calculatedAmount > 0);
    console.log(`   ✓ Has Affordable Housing: ${hasAffordable34}`);
    console.log(`   ✓ Has Water Fee: ${hasWater34}\n`);

    // Test with 1" meter
    console.log('TEST 2: With 1" meter:');
    const inputs1: ProjectInputs = {
        ...inputs34,
        meterSize: '1"'
    };

    const result1 = await calculator.calculateFees(inputs1);
    console.log(`   Total Fees: ${result1.fees.length}`);
    console.log(`   One-Time: $${result1.oneTimeFees.toLocaleString()}`);
    console.log('   Fees:');
    result1.fees
        .filter(f => f.calculatedAmount > 0)
        .forEach(f => console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`));

    const hasAffordable1 = result1.fees.some(f => f.feeName.includes('Affordable Housing'));
    const hasWater1 = result1.fees.some(f => f.feeName.includes('Water') && f.calculatedAmount > 0);
    console.log(`   ✓ Has Affordable Housing: ${hasAffordable1}`);
    console.log(`   ✓ Has Water Fee: ${hasWater1}\n`);

    console.log('🔍 ANALYSIS:');
    console.log(`   3/4" meter: Affordable=${hasAffordable34}, Water=${hasWater34}`);
    console.log(`   1" meter: Affordable=${hasAffordable1}, Water=${hasWater1}`);
    console.log(`   BUG: ${hasAffordable34 !== hasAffordable1 ? '✗ CONFIRMED' : '✓ NOT FOUND'}`);
}

testMeterBug().catch(console.error);
