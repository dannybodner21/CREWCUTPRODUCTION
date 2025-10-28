import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const j = await supabase.from('jurisdictions').select('id').eq('jurisdiction_name', 'Los Angeles').single();
  const jurisdictionId = j.data!.id;

  console.log('🔍 Checking fee names for Los Angeles...\n');

  const { data: fees } = await supabase
    .from('fees')
    .select('id, name, applies_to, category')
    .eq('jurisdiction_id', jurisdictionId)
    .eq('is_active', true)
    .is('service_area_id', null);

  console.log(`Found ${fees?.length} citywide fees\n`);

  // Show fees with "residential" applies_to
  console.log('📋 Fees with applies_to containing "residential":');
  fees?.filter(f => JSON.stringify(f.applies_to).toLowerCase().includes('residential')).forEach(fee => {
    console.log(`  - ${fee.name}`);
    console.log(`    applies_to: ${JSON.stringify(fee.applies_to)}`);
    console.log(`    category: ${fee.category}`);
  });

  console.log('\n📋 Fees with applies_to = ["all"]:');
  fees?.filter(f => JSON.stringify(f.applies_to) === '["all"]').forEach(fee => {
    console.log(`  - ${fee.name}`);
    console.log(`    category: ${fee.category}`);
  });
}

test();
