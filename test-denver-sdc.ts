import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSDC() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Denver')
    .eq('state_code', 'CO')
    .single();

  const { data: sdcFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*), service_areas(name)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%System Development Charge%');

  console.log('🔍 System Development Charge Fees:\n');
  sdcFees?.forEach(f => {
    console.log(`📋 ${f.name}`);
    console.log(`   service_area_id: ${f.service_area_id || 'NULL (citywide)'}`);
    console.log(`   service_area_name: ${(f.service_areas as any)?.name || 'N/A'}`);
    console.log(`   applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`   use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    console.log(`   is_active: ${f.is_active}`);
    console.log(`   description: ${f.description?.substring(0, 200) || 'N/A'}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`   calc_type: ${calc.calc_type}`);
      console.log(`   rate: ${calc.rate}`);
      console.log(`   unit_label: ${calc.unit_label}`);
      console.log(`   effective_start: ${calc.effective_start}`);
      console.log(`   formula_type: ${calc.formula_type}`);
      console.log(`   formula_config: ${JSON.stringify(calc.formula_config)}`);
    }
    console.log();
  });
}

checkSDC();
