import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function checkFeesSchema() {
    console.log('='.repeat(80));
    console.log('🔍 CHECKING FEES TABLE SCHEMA');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get Phoenix jurisdiction
    const { data: phoenix } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    console.log('\n✅ Phoenix jurisdiction ID:', phoenix?.id);

    // Get a sample fee with all columns
    const { data: sampleFee } = await supabase
        .from('fees')
        .select('*')
        .eq('jurisdiction_id', phoenix!.id)
        .limit(1)
        .single();

    console.log('\n📋 Fees Table Columns:');
    if (sampleFee) {
        Object.keys(sampleFee).sort().forEach(col => {
            console.log(`   - ${col}: ${typeof sampleFee[col]}`);
        });
    }

    // Check Phoenix fees for frequency values
    console.log('\n\n📊 Phoenix Fees - Frequency Check:');
    console.log('-'.repeat(80));

    const { data: phoenixFees } = await supabase
        .from('fees')
        .select('name, frequency, applies_to, category')
        .eq('jurisdiction_id', phoenix!.id)
        .ilike('name', '%Police%');

    console.log('\n🚔 Police Fees:');
    phoenixFees?.forEach(fee => {
        console.log(`   ${fee.name}`);
        console.log(`      frequency: "${fee.frequency}"`);
        console.log(`      applies_to: ${JSON.stringify(fee.applies_to)}`);
        console.log(`      category: "${fee.category}"`);
    });

    const { data: wastewaterFees } = await supabase
        .from('fees')
        .select('name, frequency, applies_to, category')
        .eq('jurisdiction_id', phoenix!.id)
        .ilike('name', '%Wastewater%');

    console.log('\n💧 Wastewater Fees:');
    wastewaterFees?.forEach(fee => {
        console.log(`   ${fee.name}`);
        console.log(`      frequency: "${fee.frequency}"`);
        console.log(`      applies_to: ${JSON.stringify(fee.applies_to)}`);
        console.log(`      category: "${fee.category}"`);
    });

    const { data: waterResourceFees } = await supabase
        .from('fees')
        .select('name, frequency, applies_to, category')
        .eq('jurisdiction_id', phoenix!.id)
        .ilike('name', '%Water Resource%');

    console.log('\n🌊 Water Resource Fees:');
    waterResourceFees?.forEach(fee => {
        console.log(`   ${fee.name}`);
        console.log(`      frequency: "${fee.frequency}"`);
        console.log(`      applies_to: ${JSON.stringify(fee.applies_to)}`);
        console.log(`      category: "${fee.category}"`);
    });

    // Check all unique frequency values
    const { data: allFees } = await supabase
        .from('fees')
        .select('frequency')
        .eq('jurisdiction_id', phoenix!.id);

    const uniqueFrequencies = [...new Set(allFees?.map(f => f.frequency || 'NULL'))];
    console.log('\n\n📊 All Unique Frequency Values in Phoenix:');
    uniqueFrequencies.forEach(freq => {
        const count = allFees?.filter(f => (f.frequency || 'NULL') === freq).length;
        console.log(`   "${freq}": ${count} fees`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✨ Schema Check Complete');
    console.log('='.repeat(80));
}

checkFeesSchema().catch(console.error);
