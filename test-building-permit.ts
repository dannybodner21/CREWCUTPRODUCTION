import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Los Angeles')
    .single();

  const { data: fee } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Building Permit%')
    .single();

  console.log('🏗️  Building Permit Fee:\n');
  console.log('Name:', fee?.name);
  console.log('\nDescription:', fee?.description);
  console.log('\nCalculation:');
  if (fee?.fee_calculations?.[0]) {
    const calc = fee.fee_calculations[0];
    console.log('  calc_type:', calc.calc_type);
    console.log('  rate:', calc.rate);
    console.log('  formula_type:', calc.formula_type);
    console.log('  formula_config:', calc.formula_config);
    console.log('  formula_display:', calc.formula_display);
    console.log('  unit_label:', calc.unit_label);
  }
}

test();
