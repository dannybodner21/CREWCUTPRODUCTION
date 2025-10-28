import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function getCategories() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from('fees')
        .select('category')
        .not('category', 'is', null)
        .limit(1000);

    if (error) {
        console.error('Error:', error);
    } else {
        const uniqueCategories = [...new Set(data.map(d => d.category))].sort();
        console.log('DISTINCT category values:');
        console.log('========================');
        uniqueCategories.forEach(cat => console.log(cat));
        console.log('\nTotal unique categories:', uniqueCategories.length);
    }
}

getCategories().catch(console.error);
