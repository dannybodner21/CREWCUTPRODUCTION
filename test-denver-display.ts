import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testDenverDisplay() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING DENVER FEE DISPLAY');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get Denver "Inside Denver" service area
    const { data: denver } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    const { data: serviceArea } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', denver!.id)
        .eq('name', 'Inside Denver')
        .single();

    console.log('\n✅ Denver "Inside Denver" service area ID:', serviceArea?.id);

    // Test calculation
    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('\n\n📊 TESTING: Denver Multi-Family (50 units, 45,000 sq ft)');
    console.log('-'.repeat(80));

    try {
        const result = await calculator.calculateFees({
            jurisdictionName: 'Denver',
            stateCode: 'CO',
            selectedServiceAreaIds: [serviceArea!.id],
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Denver Result:`);
        console.log(`   Total Fees Returned: ${result.fees.length}`);
        console.log(`   One-Time Total: $${result.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Total: $${result.monthlyFees.toLocaleString()}`);

        console.log(`\n📋 All Fees in Result:`);
        result.fees.forEach((fee, i) => {
            const type = fee.isRecurring ? '[MONTHLY]' : '[ONE-TIME]';
            console.log(`   ${i + 1}. ${type} ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ Test Complete');
    console.log('='.repeat(80));
}

testDenverDisplay().catch(console.error);
