import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkWaterMeters() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'San Diego')
    .single();

  const { data: meterFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Water Meter Installation%');

  console.log('🔍 Water Meter Installation Fees:\n');
  meterFees?.forEach(f => {
    console.log(`📋 ${f.name}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`   calc_type: ${calc.calc_type}`);
      console.log(`   rate: ${calc.rate}`);
      console.log(`   unit_label: ${calc.unit_label}`);
    }
    console.log();
  });
}

checkWaterMeters();
