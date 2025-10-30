import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function checkPhoenixJurisdictions() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check for Phoenix
    const { data: phoenix } = await supabase
        .from('jurisdictions')
        .select('id, jurisdiction_name, state_code')
        .ilike('jurisdiction_name', '%phoenix%');

    console.log('Jurisdictions matching "Phoenix":');
    if (phoenix && phoenix.length > 0) {
        phoenix.forEach(j => {
            console.log(`  - ${j.jurisdiction_name} (${j.state_code})`);
        });
    } else {
        console.log('  None found');
    }

    // Check all Arizona jurisdictions
    const { data: arizona } = await supabase
        .from('jurisdictions')
        .select('id, jurisdiction_name, state_code')
        .eq('state_code', 'AZ')
        .order('jurisdiction_name');

    console.log('\nAll Arizona jurisdictions:');
    if (arizona && arizona.length > 0) {
        arizona.forEach(j => {
            console.log(`  - ${j.jurisdiction_name}`);
        });
    } else {
        console.log('  None found');
    }
}

checkPhoenixJurisdictions().catch(console.error);
