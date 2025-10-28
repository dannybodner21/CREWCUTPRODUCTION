import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function fixDenverSDC() {
    console.log('='.repeat(80));
    console.log('🔧 FIXING DENVER SYSTEM DEVELOPMENT CHARGE');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const feeId = '76da51d1-c83f-459f-a081-c8288981f104';

    // Get current state
    console.log('\n📊 BEFORE UPDATE:');
    const { data: before } = await supabase
        .from('fee_calculations')
        .select('*')
        .eq('fee_id', feeId)
        .single();

    if (before) {
        console.log(`   calc_type: ${before.calc_type}`);
        console.log(`   rate: ${before.rate}`);
        console.log(`   formula_type: ${before.formula_type}`);
        console.log(`   formula_config: ${JSON.stringify(before.formula_config)}`);
        console.log(`   tiers: ${JSON.stringify(before.tiers)}`);
    }

    // Update to simple per_unit calculation
    console.log('\n🔄 UPDATING...');
    const { error } = await supabase
        .from('fee_calculations')
        .update({
            calc_type: 'per_unit',
            rate: 10040.00,
            formula_type: null,
            formula_config: null
        })
        .eq('fee_id', feeId);

    if (error) {
        console.error('❌ Error updating fee_calculation:', error);
        return;
    }

    console.log('✅ Update successful');

    // Verify update
    console.log('\n📊 AFTER UPDATE:');
    const { data: after } = await supabase
        .from('fee_calculations')
        .select('*')
        .eq('fee_id', feeId)
        .single();

    if (after) {
        console.log(`   calc_type: ${after.calc_type}`);
        console.log(`   rate: ${after.rate}`);
        console.log(`   formula_type: ${after.formula_type}`);
        console.log(`   formula_config: ${JSON.stringify(after.formula_config)}`);
        console.log(`   unit_label: ${after.unit_label}`);
    }

    // Get fee name
    const { data: fee } = await supabase
        .from('fees')
        .select('name')
        .eq('id', feeId)
        .single();

    console.log('\n✅ Fee: ' + fee?.name);
    console.log('✅ Calculation: $10,040 per unit');
    console.log('✅ Example: 50 units × $10,040 = $502,000');

    console.log('\n' + '='.repeat(80));
    console.log('✨ Denver System Development Charge fixed');
    console.log('='.repeat(80));
}

fixDenverSDC().catch(console.error);
