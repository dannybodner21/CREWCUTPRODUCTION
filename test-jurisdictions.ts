import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  console.log('🔍 Checking what jurisdictions exist...\n');

  const { data: jurisdictions } = await supabase
    .from('jurisdictions')
    .select('id, jurisdiction_name, state_code')
    .order('jurisdiction_name');

  console.log(`Found ${jurisdictions?.length || 0} jurisdictions:\n`);

  for (const j of jurisdictions || []) {
    const { count } = await supabase
      .from('fees')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction_id', j.id);

    console.log(`  - ${j.jurisdiction_name}, ${j.state_code}: ${count || 0} fees`);
  }
}

test();
