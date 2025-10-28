import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSewerFees() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Denver')
    .eq('state_code', 'CO')
    .single();

  const { data: sewerFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Sewer Permit%');

  console.log('🔍 Sewer Permit Fees:\n');
  sewerFees?.forEach(f => {
    console.log(`📋 ${f.name}`);
    console.log(`   applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`   use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    console.log(`   is_active: ${f.is_active}`);
    console.log();
  });
}

checkSewerFees();
