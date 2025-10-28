import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testLA() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    console.log('🧮 Testing Los Angeles...\n');

    // Get service areas first
    const { data: jurisdiction } = await calculator['supabase']
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Los Angeles')
        .single();

    const { data: serviceAreas } = await calculator['supabase']
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id);

    // Select "High Market Area" service area for testing
    const highMarketArea = serviceAreas?.find(sa => sa.name === 'High Market Area');

    // Also get the "ALL OTHER ZONES" service area for Park fees (Quimby)
    const allOtherZones = serviceAreas?.find(sa => sa.name === 'ALL OTHER ZONES');

    const laInputs: ProjectInputs = {
        jurisdictionName: 'Los Angeles',
        stateCode: 'CA',
        selectedServiceAreaIds: [
            ...(highMarketArea ? [highMarketArea.id] : []),
            ...(allOtherZones ? [allOtherZones.id] : [])
        ],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 1,
        squareFeet: 2000,
        projectValue: 400000,
        meterSize: '1"'  // LA has "1 inch Regular" and "1 inch Intermediate"
    };

    try {
        const laBreakdown = await calculator.calculateFees(laInputs);

        console.log('✅ Los Angeles Results:');
        console.log(`   One-Time Fees: $${laBreakdown.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Fees: $${laBreakdown.monthlyFees.toLocaleString()}`);
        console.log(`   First Year Total: $${laBreakdown.firstYearTotal.toLocaleString()}`);
        console.log(`   Total Fees Found: ${laBreakdown.fees.length}`);
        console.log(`   Fees with amounts > 0: ${laBreakdown.fees.filter(f => f.calculatedAmount > 0).length}`);

        if (laBreakdown.fees.length > 0) {
            console.log('\n   All fees:');
            laBreakdown.fees
                .filter(f => f.calculatedAmount > 0)
                .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
                .forEach(fee => {
                    console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
                });
        }
    } catch (error) {
        console.error('❌ Los Angeles Error:', error);
    }
}

testLA().catch(console.error);
