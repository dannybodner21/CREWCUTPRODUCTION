import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function getUnitLabels() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from('fee_calculations')
        .select('unit_label')
        .not('unit_label', 'is', null);

    if (error) {
        console.error('Error:', error);
    } else {
        const uniqueLabels = [...new Set(data.map(d => d.unit_label))].sort();
        console.log('DISTINCT unit_label values:');
        console.log('===========================');
        uniqueLabels.forEach(label => console.log(label));
        console.log('\nTotal unique labels:', uniqueLabels.length);
    }
}

getUnitLabels().catch(console.error);
