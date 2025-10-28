import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function fixDenverServiceAreas() {
    console.log('='.repeat(80));
    console.log('🔧 CONSOLIDATING DENVER SERVICE AREAS');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get Denver jurisdiction ID
    const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    if (!jurisdiction) {
        console.log('❌ Denver jurisdiction not found');
        return;
    }

    console.log('✅ Denver jurisdiction ID:', jurisdiction.id);

    // Get both service area IDs
    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction.id)
        .in('name', ['Inside Denver', 'Inside City of Denver']);

    const insideDenver = serviceAreas?.find(sa => sa.name === 'Inside Denver');
    const insideCityOfDenver = serviceAreas?.find(sa => sa.name === 'Inside City of Denver');

    if (!insideDenver || !insideCityOfDenver) {
        console.log('❌ Required service areas not found');
        console.log('   Inside Denver:', insideDenver?.id);
        console.log('   Inside City of Denver:', insideCityOfDenver?.id);
        return;
    }

    console.log('\n📍 Service Areas:');
    console.log(`   Inside Denver: ${insideDenver.id}`);
    console.log(`   Inside City of Denver: ${insideCityOfDenver.id}`);

    // Count fees in each area BEFORE
    const { count: beforeInsideDenver } = await supabase
        .from('fees')
        .select('*', { count: 'exact', head: true })
        .eq('service_area_id', insideDenver.id);

    const { count: beforeInsideCityOfDenver } = await supabase
        .from('fees')
        .select('*', { count: 'exact', head: true })
        .eq('service_area_id', insideCityOfDenver.id);

    console.log('\n📊 Fees BEFORE consolidation:');
    console.log(`   Inside Denver: ${beforeInsideDenver} fees`);
    console.log(`   Inside City of Denver: ${beforeInsideCityOfDenver} fees`);

    // Step 1: Move all fees from "Inside City of Denver" to "Inside Denver"
    console.log('\n🔄 Moving fees from "Inside City of Denver" to "Inside Denver"...');
    const { error: updateError } = await supabase
        .from('fees')
        .update({ service_area_id: insideDenver.id })
        .eq('service_area_id', insideCityOfDenver.id);

    if (updateError) {
        console.error('❌ Error moving fees:', updateError);
        return;
    }

    console.log('✅ Fees moved successfully');

    // Count fees AFTER
    const { count: afterInsideDenver } = await supabase
        .from('fees')
        .select('*', { count: 'exact', head: true })
        .eq('service_area_id', insideDenver.id);

    const { count: afterInsideCityOfDenver } = await supabase
        .from('fees')
        .select('*', { count: 'exact', head: true })
        .eq('service_area_id', insideCityOfDenver.id);

    console.log('\n📊 Fees AFTER moving:');
    console.log(`   Inside Denver: ${afterInsideDenver} fees`);
    console.log(`   Inside City of Denver: ${afterInsideCityOfDenver} fees`);

    // Step 2: Delete "Inside City of Denver" service area
    console.log('\n🗑️  Deleting "Inside City of Denver" service area...');
    const { error: deleteError } = await supabase
        .from('service_areas')
        .delete()
        .eq('id', insideCityOfDenver.id);

    if (deleteError) {
        console.error('❌ Error deleting service area:', deleteError);
        return;
    }

    console.log('✅ Service area deleted successfully');

    // Verify final state
    const { data: finalServiceAreas } = await supabase
        .from('service_areas')
        .select('name')
        .eq('jurisdiction_id', jurisdiction.id)
        .order('name');

    console.log('\n📍 Remaining Denver Service Areas:');
    finalServiceAreas?.forEach(sa => {
        console.log(`   - ${sa.name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✨ Denver service areas consolidated successfully');
    console.log('='.repeat(80));
}

fixDenverServiceAreas().catch(console.error);
