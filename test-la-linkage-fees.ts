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

  console.log('🔍 Checking Affordable Housing Linkage fees...\n');

  const { data: fees } = await supabase
    .from('fees')
    .select(`
      id,
      name,
      applies_to,
      fee_calculations (
        id,
        calc_type,
        rate,
        unit_label,
        formula_display,
        formula_config
      )
    `)
    .eq('jurisdiction_id', jurisdictionId)
    .eq('is_active', true)
    .ilike('name', '%Linkage%');

  console.log(`Found ${fees?.length} Linkage fees\n`);

  fees?.forEach(fee => {
    console.log(`📋 ${fee.name}`);
    console.log(`   applies_to: ${JSON.stringify(fee.applies_to)}`);
    console.log(`   calculations (${fee.fee_calculations?.length || 0}):`);
    fee.fee_calculations?.forEach((calc: any) => {
      console.log(`     - calc_type: ${calc.calc_type}`);
      console.log(`       rate: ${calc.rate}`);
      console.log(`       unit_label: ${calc.unit_label}`);
      console.log(`       formula_display: ${calc.formula_display}`);
      console.log(`       formula_config: ${JSON.stringify(calc.formula_config)}`);
    });
    console.log();
  });
}

test();
