import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testPhoenixDisplay() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING PHOENIX FEE DISPLAY');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get Phoenix "Inside City" service area
    const { data: phoenix } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    const { data: serviceArea } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', phoenix!.id)
        .eq('name', 'Inside City')
        .single();

    console.log('\n✅ Phoenix "Inside City" service area ID:', serviceArea?.id);

    // Test calculation
    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('\n\n📊 TESTING: Phoenix Multi-Family (50 units, 45,000 sq ft)');
    console.log('-'.repeat(80));

    try {
        const result = await calculator.calculateFees({
            jurisdictionName: 'Phoenix city',
            stateCode: 'AZ',
            selectedServiceAreaIds: [serviceArea!.id],
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Phoenix Result:`);
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

testPhoenixDisplay().catch(console.error);
