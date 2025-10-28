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

  console.log('🔍 Checking applies_to values for Los Angeles fees...\n');

  const { data: fees } = await supabase
    .from('fees')
    .select('id, name, applies_to')
    .eq('jurisdiction_id', jurisdictionId)
    .eq('is_active', true)
    .is('service_area_id', null)
    .limit(50);

  console.log(`Found ${fees?.length} citywide fees\n`);

  // Group by applies_to values
  const appliesToCounts = new Map<string, number>();
  fees?.forEach(fee => {
    const appliesTo = JSON.stringify(fee.applies_to);
    appliesToCounts.set(appliesTo, (appliesToCounts.get(appliesTo) || 0) + 1);
  });

  console.log('📊 applies_to distribution:');
  Array.from(appliesToCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([appliesTo, count]) => {
      console.log(`  ${count} fees: ${appliesTo}`);
    });

  console.log('\n📋 Sample fees:');
  fees?.slice(0, 10).forEach(fee => {
    console.log(`  - ${fee.name}`);
    console.log(`    applies_to: ${JSON.stringify(fee.applies_to)}`);
  });
}

test();
