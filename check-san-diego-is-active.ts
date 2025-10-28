import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function checkSanDiegoIsActive() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('='.repeat(80));
    console.log('🔍 CHECKING SAN DIEGO MONTHLY FEES - is_active STATUS');
    console.log('='.repeat(80));

    const { data: sd } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'San Diego')
        .eq('state_code', 'CA')
        .single();

    console.log(`\n✅ San Diego Jurisdiction ID: ${sd?.id}`);

    // Get fees with "monthly" in the name and check is_active status
    const { data: monthlyFees } = await supabase
        .from('fees')
        .select('id, name, is_active, category')
        .eq('jurisdiction_id', sd!.id)
        .ilike('name', '%monthly%');

    console.log(`\n📊 Monthly Fees in Database: ${monthlyFees?.length || 0}`);

    const activeFees = monthlyFees?.filter(f => f.is_active) || [];
    const inactiveFees = monthlyFees?.filter(f => !f.is_active) || [];

    console.log(`\n✅ ACTIVE (is_active = true): ${activeFees.length}`);
    activeFees.forEach(f => {
        console.log(`   - ${f.name}`);
        console.log(`     Category: ${f.category}`);
    });

    console.log(`\n❌ INACTIVE (is_active = false): ${inactiveFees.length}`);
    inactiveFees.forEach(f => {
        console.log(`   - ${f.name}`);
        console.log(`     ID: ${f.id}`);
        console.log(`     Category: ${f.category}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('💡 SOLUTION:');
    console.log('='.repeat(80));
    if (inactiveFees.length > 0) {
        console.log('Update these fees to is_active = true:');
        console.log('\n```sql');
        console.log(`UPDATE fees`);
        console.log(`SET is_active = true`);
        console.log(`WHERE id IN (`);
        inactiveFees.forEach((f, i) => {
            console.log(`  '${f.id}'${i < inactiveFees.length - 1 ? ',' : ''}`);
        });
        console.log(`);`);
        console.log('```');
    }

    console.log('\n' + '='.repeat(80));
}

checkSanDiegoIsActive().catch(console.error);
