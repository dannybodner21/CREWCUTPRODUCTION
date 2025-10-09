/**
 * Test multi-select service area functionality
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testMultiSelect() {
    console.log('🧪 Testing Multi-Select Service Area Functionality\n');
    console.log('═'.repeat(70) + '\n');

    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const baseInputs: Omit<ProjectInputs, 'selectedServiceAreaIds'> = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 100,
        squareFeet: 10000,
        projectValue: 100000,
        meterSize: '6"'
    };

    // Get available service areas
    const { data: jurisdictions } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdictions!.id)
        .order('name');

    console.log(`📍 Found ${serviceAreas?.length || 0} service areas for Phoenix:\n`);
    serviceAreas?.forEach(sa => console.log(`  - ${sa.name} (ID: ${sa.id})`));
    console.log('\n' + '─'.repeat(70) + '\n');

    // Test 1: Empty selection (citywide only)
    console.log('TEST 1: Empty Selection (Citywide Only)\n');
    const test1 = await calculator.calculateFees({
        ...baseInputs,
        selectedServiceAreaIds: []
    });
    console.log(`✓ Total fees: ${test1.fees.length}`);
    console.log(`✓ One-time: $${test1.oneTimeFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    console.log(`✓ Monthly: $${test1.monthlyFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    console.log(`✓ First Year Total: $${test1.firstYearTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    console.log('\n' + '─'.repeat(70) + '\n');

    if (serviceAreas && serviceAreas.length > 0) {
        // Test 2: Single service area
        console.log(`TEST 2: Single Service Area (${serviceAreas[0].name})\n`);
        const test2 = await calculator.calculateFees({
            ...baseInputs,
            selectedServiceAreaIds: [serviceAreas[0].id]
        });
        console.log(`✓ Total fees: ${test2.fees.length} (+${test2.fees.length - test1.fees.length} from citywide)`);
        console.log(`✓ One-time: $${test2.oneTimeFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        console.log(`✓ Monthly: $${test2.monthlyFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        console.log(`✓ First Year Total: $${test2.firstYearTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        console.log('\n' + '─'.repeat(70) + '\n');

        if (serviceAreas.length > 1) {
            // Test 3: Multiple service areas
            console.log(`TEST 3: Multiple Service Areas (${serviceAreas[0].name} + ${serviceAreas[1].name})\n`);
            const test3 = await calculator.calculateFees({
                ...baseInputs,
                selectedServiceAreaIds: [serviceAreas[0].id, serviceAreas[1].id]
            });
            console.log(`✓ Total fees: ${test3.fees.length} (+${test3.fees.length - test1.fees.length} from citywide)`);
            console.log(`✓ One-time: $${test3.oneTimeFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
            console.log(`✓ Monthly: $${test3.monthlyFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
            console.log(`✓ First Year Total: $${test3.firstYearTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
            console.log('\n' + '─'.repeat(70) + '\n');
        }

        // Show fee breakdown by service area for Test 2
        console.log('📊 FEE BREAKDOWN BY SERVICE AREA (Test 2):\n');
        const citywideCount = test2.fees.filter(f => f.serviceArea === 'Citywide').length;
        const areaSpecificCount = test2.fees.filter(f => f.serviceArea !== 'Citywide').length;
        console.log(`  Citywide fees: ${citywideCount}`);
        console.log(`  ${serviceAreas[0].name} fees: ${areaSpecificCount}`);
    }

    console.log('\n✅ Multi-Select Tests Complete!\n');
    console.log('═'.repeat(70));
}

testMultiSelect().catch(console.error);
