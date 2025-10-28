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

  const { data: affordableFees} = await supabase
    .from('fees')
    .select('*, fee_calculations(*), service_areas(name)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Affordable Housing%');

  const mediumHighFees = affordableFees?.filter(f =>
    (f.service_areas as any)?.name === 'Medium-High Market Area'
  );

  console.log('🏠 Affordable Housing Fees (Medium-High Market Area):');
  console.log(`   Found: ${mediumHighFees?.length}\n`);

  mediumHighFees?.forEach((fee: any) => {
    console.log(`📋 ${fee.name}`);
    console.log(`   Calculations: ${fee.fee_calculations?.length}`);

    fee.fee_calculations?.forEach((calc: any, i: number) => {
      console.log(`   Calculation ${i + 1}:`);
      console.log(`     calc_type: ${calc.calc_type}`);
      console.log(`     rate: ${calc.rate}`);
      console.log(`     unit_label: ${calc.unit_label}`);
      console.log(`     applies_to_meter_sizes: ${JSON.stringify(calc.applies_to_meter_sizes)}`);
      console.log(`     formula_type: ${calc.formula_type}`);
    });
    console.log();
  });
}

test();
