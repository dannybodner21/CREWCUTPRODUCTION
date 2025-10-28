import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function checkDenverServiceAreas() {
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

    // Get service areas for Denver
    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction.id)
        .order('name');

    console.log('\n📍 Denver Service Areas:');
    serviceAreas?.forEach(sa => {
        console.log(`   ${sa.id}: "${sa.name}"`);
    });

    // Now check Phoenix too
    const { data: phoenixJurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    if (phoenixJurisdiction) {
        const { data: phoenixServiceAreas } = await supabase
            .from('service_areas')
            .select('id, name')
            .eq('jurisdiction_id', phoenixJurisdiction.id)
            .order('name');

        console.log('\n📍 Phoenix Service Areas:');
        phoenixServiceAreas?.forEach(sa => {
            console.log(`   ${sa.id}: "${sa.name}"`);
        });
    }
}

checkDenverServiceAreas().catch(console.error);
