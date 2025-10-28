import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function checkFeeCalculations() {
    console.log('='.repeat(80));
    console.log('🔍 CHECKING FEE_CALCULATIONS TABLE');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get a sample fee_calculation
    const { data: sampleCalc } = await supabase
        .from('fee_calculations')
        .select('*')
        .limit(1)
        .single();

    console.log('\n📋 Fee_Calculations Table Columns:');
    if (sampleCalc) {
        Object.keys(sampleCalc).sort().forEach(col => {
            console.log(`   - ${col}: ${typeof sampleCalc[col]}`);
        });
    }

    // Get Phoenix jurisdiction
    const { data: phoenix } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    // Get Police Impact Fee calculations
    console.log('\n\n🚔 Police Impact Fee Calculations:');
    console.log('-'.repeat(80));

    const { data: policeFees } = await supabase
        .from('fees')
        .select(`
            id,
            name,
            fee_calculations (
                id,
                frequency,
                rate,
                unit_label,
                calculation_type
            )
        `)
        .eq('jurisdiction_id', phoenix!.id)
        .ilike('name', '%Police Impact%')
        .limit(3);

    policeFees?.forEach(fee => {
        console.log(`\n${fee.name}:`);
        console.log(`   Fee ID: ${fee.id}`);
        console.log(`   Calculations: ${(fee as any).fee_calculations?.length || 0}`);
        (fee as any).fee_calculations?.forEach((calc: any, i: number) => {
            console.log(`   [${i + 1}]`);
            console.log(`      frequency: "${calc.frequency}"`);
            console.log(`      rate: ${calc.rate}`);
            console.log(`      unit_label: "${calc.unit_label}"`);
            console.log(`      calculation_type: "${calc.calculation_type}"`);
        });
    });

    // Get Wastewater fees
    console.log('\n\n💧 Wastewater Treatment Fee Calculations:');
    console.log('-'.repeat(80));

    const { data: wastewaterFees } = await supabase
        .from('fees')
        .select(`
            id,
            name,
            fee_calculations (
                id,
                frequency,
                rate,
                unit_label,
                calculation_type
            )
        `)
        .eq('jurisdiction_id', phoenix!.id)
        .ilike('name', '%Wastewater Treatment%')
        .limit(3);

    wastewaterFees?.forEach(fee => {
        console.log(`\n${fee.name}:`);
        console.log(`   Fee ID: ${fee.id}`);
        console.log(`   Calculations: ${(fee as any).fee_calculations?.length || 0}`);
        (fee as any).fee_calculations?.forEach((calc: any, i: number) => {
            console.log(`   [${i + 1}]`);
            console.log(`      frequency: "${calc.frequency}"`);
            console.log(`      rate: ${calc.rate}`);
            console.log(`      unit_label: "${calc.unit_label}"`);
            console.log(`      calculation_type: "${calc.calculation_type}"`);
        });
    });

    // Check all unique frequency values
    const { data: allCalcs } = await supabase
        .from('fee_calculations')
        .select('frequency');

    const uniqueFrequencies = [...new Set(allCalcs?.map(c => c.frequency || 'NULL'))];
    console.log('\n\n📊 All Unique Frequency Values in fee_calculations:');
    uniqueFrequencies.forEach(freq => {
        const count = allCalcs?.filter(c => (c.frequency || 'NULL') === freq).length;
        console.log(`   "${freq}": ${count} calculations`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✨ Schema Check Complete');
    console.log('='.repeat(80));
}

checkFeeCalculations().catch(console.error);
