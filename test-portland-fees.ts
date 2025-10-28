import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkPortlandFees() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Portland')
    .eq('state_code', 'OR')
    .single();

  if (!jurisdiction) {
    console.log('❌ Portland jurisdiction not found');
    return;
  }

  console.log(`✅ Portland jurisdiction found (id: ${jurisdiction.id})\n`);

  // Check all fees
  const { data: allFees } = await supabase
    .from('fees')
    .select('id, name, category, is_active')
    .eq('jurisdiction_id', jurisdiction.id)
    .eq('is_active', true)
    .order('name');

  console.log(`📊 Total active fees: ${allFees?.length || 0}\n`);

  // Group by category
  const byCategory = (allFees || []).reduce((acc: any, fee) => {
    const cat = fee.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(fee);
    return acc;
  }, {});

  console.log('📋 Fees by category:\n');
  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`${cat} (${byCategory[cat].length}):`);
    byCategory[cat].forEach((f: any) => console.log(`  - ${f.name}`));
    console.log();
  });

  // Check for specific fee types
  console.log('🔍 Checking for specific fee types:\n');

  const checkFeeType = async (keyword: string, description: string) => {
    const { data } = await supabase
      .from('fees')
      .select('name')
      .eq('jurisdiction_id', jurisdiction.id)
      .ilike('name', `%${keyword}%`)
      .eq('is_active', true);

    console.log(`${description}: ${data?.length || 0} fees`);
    data?.forEach(f => console.log(`  - ${f.name}`));
    console.log();
  };

  await checkFeeType('Water SDC', 'Water SDC');
  await checkFeeType('Sewer SDC', 'Sewer SDC');
  await checkFeeType('Transportation SDC', 'Transportation SDC');
  await checkFeeType('Parks SDC', 'Parks SDC');
  await checkFeeType('School', 'School fees');
  await checkFeeType('Affordable Housing', 'Affordable Housing fees');
}

checkPortlandFees();
