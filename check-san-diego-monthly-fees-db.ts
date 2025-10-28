import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function checkSanDiegoMonthlyFees() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('='.repeat(80));
    console.log('🔍 CHECKING SAN DIEGO MONTHLY FEES IN DATABASE');
    console.log('='.repeat(80));

    const { data: sd } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'San Diego')
        .eq('state_code', 'CA')
        .single();

    console.log(`\n✅ San Diego Jurisdiction ID: ${sd?.id}`);

    // Get fees with "monthly" in the name
    const { data: monthlyFees } = await supabase
        .from('fees')
        .select(`
            id,
            name,
            category,
            applies_to,
            use_subtypes,
            fee_calculations (
                calc_type,
                rate,
                unit_label
            )
        `)
        .eq('jurisdiction_id', sd!.id)
        .ilike('name', '%monthly%');

    console.log(`\n📊 Fees with "Monthly" in name: ${monthlyFees?.length || 0}`);
    monthlyFees?.forEach((fee: any) => {
        console.log(`\n   Fee: ${fee.name}`);
        console.log(`   ID: ${fee.id}`);
        console.log(`   Category: ${fee.category}`);
        console.log(`   applies_to: ${JSON.stringify(fee.applies_to)}`);
        console.log(`   use_subtypes: ${JSON.stringify(fee.use_subtypes)}`);
        if (fee.fee_calculations && fee.fee_calculations.length > 0) {
            fee.fee_calculations.forEach((calc: any) => {
                console.log(`   calc_type: ${calc.calc_type}`);
                console.log(`   rate: ${calc.rate}`);
                console.log(`   unit_label: ${calc.unit_label}`);
            });
        } else {
            console.log(`   ❌ NO CALCULATION DATA`);
        }
    });

    // Also check for fees with unit_label containing "month"
    const { data: allFees } = await supabase
        .from('fees')
        .select(`
            id,
            name,
            category,
            applies_to,
            use_subtypes,
            fee_calculations (
                calc_type,
                rate,
                unit_label
            )
        `)
        .eq('jurisdiction_id', sd!.id);

    const feesWithMonthlyLabel = allFees?.filter((fee: any) =>
        fee.fee_calculations?.some((calc: any) =>
            calc.unit_label?.toLowerCase().includes('month')
        )
    );

    console.log(`\n\n📊 Fees with "month" in unit_label: ${feesWithMonthlyLabel?.length || 0}`);
    feesWithMonthlyLabel?.forEach((fee: any) => {
        console.log(`\n   Fee: ${fee.name}`);
        console.log(`   ID: ${fee.id}`);
        console.log(`   Category: ${fee.category}`);
        console.log(`   applies_to: ${JSON.stringify(fee.applies_to)}`);
        console.log(`   use_subtypes: ${JSON.stringify(fee.use_subtypes)}`);
        fee.fee_calculations.forEach((calc: any) => {
            console.log(`   calc_type: ${calc.calc_type}`);
            console.log(`   rate: ${calc.rate}`);
            console.log(`   unit_label: ${calc.unit_label}`);
        });
    });

    console.log('\n' + '='.repeat(80));
}

checkSanDiegoMonthlyFees().catch(console.error);
