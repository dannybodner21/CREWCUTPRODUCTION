import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkMonthlyUtility() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'San Diego')
    .single();

  const { data: utilityFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Monthly Utility Charge%')
    .order('name');

  console.log('🔍 Monthly Utility Charge Fees:\n');
  utilityFees?.forEach(f => {
    console.log(`📋 ${f.name}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`   calc_type: ${calc.calc_type}, rate: ${calc.rate}, effective_start: ${calc.effective_start}`);
    }
    console.log();
  });
}

checkMonthlyUtility();
