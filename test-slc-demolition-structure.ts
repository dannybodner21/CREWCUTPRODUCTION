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
    .eq('jurisdiction_name', 'Salt Lake City')
    .single();

  console.log('🔍 Checking Salt Lake City Demolition fee structure...\n');

  const { data: fees } = await supabase
    .from('fees')
    .select(`
      id,
      name,
      applies_to,
      use_subtypes,
      category,
      fee_calculations (
        id,
        calc_type,
        rate,
        unit_label,
        min_sqft,
        max_sqft,
        min_units,
        max_units,
        min_valuation,
        max_valuation
      )
    `)
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Demolition%')
    .limit(10);

  console.log(`Found ${fees?.length} Demolition fees\n`);

  fees?.forEach((fee, idx) => {
    console.log(`[${idx + 1}] ${fee.name}`);
    console.log(`    applies_to: ${JSON.stringify(fee.applies_to)}`);
    console.log(`    use_subtypes: ${JSON.stringify(fee.use_subtypes)}`);
    console.log(`    category: ${fee.category}`);
    console.log(`    calculations: ${fee.fee_calculations?.length || 0}`);
    if (fee.fee_calculations && fee.fee_calculations.length > 0) {
      const calc = fee.fee_calculations[0];
      console.log(`      calc_type: ${calc.calc_type}`);
      console.log(`      rate: ${calc.rate}`);
      console.log(`      unit_label: ${calc.unit_label}`);
      console.log(`      min_sqft: ${calc.min_sqft}, max_sqft: ${calc.max_sqft}`);
      console.log(`      min_units: ${calc.min_units}, max_units: ${calc.max_units}`);
      console.log(`      min_valuation: ${calc.min_valuation}, max_valuation: ${calc.max_valuation}`);
    }
    console.log();
  });
}

test();
