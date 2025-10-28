import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const jurisdictionResult = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Salt Lake City')
    .single();

  if (!jurisdictionResult.data) {
    console.log('❌ Salt Lake City not found');
    return;
  }

  console.log('✅ Found jurisdiction:', jurisdictionResult.data.id);

  console.log('\n🔍 Searching for impact fees...');
  const { data: impactFees, error } = await supabase
    .from('fees')
    .select('id, name, category, applies_to, use_subtypes, fee_calculations(calc_type, rate, unit_label)')
    .eq('jurisdiction_id', jurisdictionResult.data.id)
    .ilike('name', '%impact%');

  console.log(`\n📊 Found ${impactFees?.length || 0} fees with "impact" in name:`);
  impactFees?.forEach((fee: any) => {
    console.log(`\n   - ${fee.name}`);
    console.log(`     Category: ${fee.category}`);
    console.log(`     Applies to: ${JSON.stringify(fee.applies_to)}`);
    console.log(`     Calculations: ${fee.fee_calculations?.length || 0}`);
    if (fee.fee_calculations && fee.fee_calculations.length > 0) {
      fee.fee_calculations.forEach((calc: any) => {
        console.log(`       - ${calc.calc_type}: $${calc.rate} ${calc.unit_label || ''}`);
      });
    }
  });
}

test();
