import { config } from 'dotenv';
import { resolve } from 'path';
import { createSupabaseAdminClient } from './custom-api-tool/supabase';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function clearCharlotteFees() {
    const supabase = createSupabaseAdminClient();

    console.log('🗑️  Clearing existing Charlotte city fees...\n');

    // Get Charlotte city jurisdiction ID
    const { data: jurisdiction, error: jurisdictionError } = await supabase
        .from('jurisdictions')
        .select('id, name')
        .eq('name', 'Charlotte city')
        .eq('state_fips', '37')
        .eq('iso_country', 'US')
        .single();

    if (jurisdictionError || !jurisdiction) {
        console.error('❌ Charlotte city jurisdiction not found:', jurisdictionError);
        return;
    }

    console.log(`✅ Found Charlotte city: ${jurisdiction.id}`);

    // Delete all fees for Charlotte city
    const { data: deletedFees, error: deleteError } = await supabase
        .from('fees')
        .delete()
        .eq('jurisdiction_id', jurisdiction.id)
        .select('id, name');

    if (deleteError) {
        console.error('❌ Error deleting fees:', deleteError);
        return;
    }

    console.log(`✅ Deleted ${deletedFees?.length || 0} existing fees for Charlotte city`);

    // Also clear the staging table
    const { data: deletedStaged, error: stagedError } = await supabase
        .from('fees_stage')
        .delete()
        .eq('jurisdiction_name', 'Charlotte city')
        .select('fee_name');

    if (stagedError) {
        console.error('❌ Error deleting staged fees:', stagedError);
        return;
    }

    console.log(`✅ Deleted ${deletedStaged?.length || 0} staged fees for Charlotte city`);

    console.log('\n🎉 Charlotte city fees cleared successfully!');
    console.log('✅ Ready to import fresh data from CSV');
}

clearCharlotteFees().catch(console.error);
