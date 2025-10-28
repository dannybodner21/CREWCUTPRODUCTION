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

  const { data: affordableFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*), service_areas(name)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Affordable Housing%');

  console.log(`🏠 Affordable Housing Fees in LA: ${affordableFees?.length || 0}\n`);

  affordableFees?.forEach(f => {
    console.log(`📋 ${f.name}`);
    console.log(`   service_area: ${(f.service_areas as any)?.name || 'Citywide'}`);
    console.log(`   service_area_id: ${f.service_area_id || 'NULL'}`);
    console.log(`   applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`   use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    console.log(`   is_active: ${f.is_active}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`   calc_type: ${calc.calc_type}`);
      console.log(`   rate: ${calc.rate}`);
      console.log(`   unit_label: ${calc.unit_label}`);
    }
    console.log();
  });
}

test();
