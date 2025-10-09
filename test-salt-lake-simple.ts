import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const result = await supabase
    .from('jurisdictions')
    .select('id, jurisdiction_name')
    .eq('jurisdiction_name', 'Salt Lake City')
    .single();

  if (!result.data) {
    console.log('❌ Salt Lake City not found');
    return;
  }

  const countResult = await supabase
    .from('fees')
    .select('*', { count: 'exact', head: true })
    .eq('jurisdiction_id', result.data.id);

  console.log(`✅ ${result.data.jurisdiction_name} has ${countResult.count} fees in the database`);
}

test();
