import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const j = await supabase.from('jurisdictions').select('id').eq('jurisdiction_name', 'Salt Lake City').single();
  const jurisdictionId = j.data!.id;

  console.log('🔍 Checking Salt Lake City Demolition fees...\n');

  const { data: fees, error } = await supabase
    .from('fees')
    .select(`
      id,
      name,
      fee_calculations (*)
    `)
    .eq('jurisdiction_id', jurisdictionId)
    .ilike('name', '%Demolition Permit Application%')
    .order('name')
    .limit(10);

  if (error) {
    console.error('Query error:', error);
  }

  console.log(`Found ${fees?.length} Demolition fees\n`);

  fees?.forEach(fee => {
    console.log(`📋 ${fee.name}`);
    console.log(`   Calculations (${fee.fee_calculations?.length || 0}):`);
    fee.fee_calculations?.forEach((calc: any, idx: number) => {
      console.log(`   [${idx}]`, calc);
    });
    console.log();
  });
}

test();
