import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Portland')
    .eq('state_code', 'OR')
    .single();

  const { data: parksFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*), service_areas(name)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Parks System Development%')
    .order('name');

  console.log('🌳 Parks SDC Fees:\n');
  parksFees?.forEach(f => {
    console.log(f.name);
    console.log(`  service_area: ${(f.service_areas as any)?.name || 'CITYWIDE'}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`  calc_type: ${calc.calc_type}, rate: ${calc.rate}, unit_label: ${calc.unit_label}`);
    }
    console.log();
  });
}

check();
