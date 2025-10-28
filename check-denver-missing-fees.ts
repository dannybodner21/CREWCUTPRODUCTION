import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function check() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Denver')
    .eq('state_code', 'CO')
    .single();

  console.log('Denver Jurisdiction ID:', jurisdiction?.id);

  const { data: affordableFees } = await supabase
    .from('fees')
    .select('name, category, is_active, applies_to, use_subtypes, calc_type, rate, unit_label')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%affordable%');

  console.log('\nAffordable Housing Fees:', affordableFees?.length || 0);
  affordableFees?.forEach(f => console.log('  -', f.name, '| active:', f.is_active, '| applies_to:', f.applies_to, '| use_subtypes:', f.use_subtypes, '| calc:', f.calc_type, '| rate:', f.rate, '| unit:', f.unit_label));

  const { data: parkFees } = await supabase
    .from('fees')
    .select('name, category')
    .eq('jurisdiction_id', jurisdiction!.id)
    .eq('is_active', true)
    .ilike('name', '%park%');

  console.log('\nPark Fees:', parkFees?.length || 0);
  parkFees?.forEach(f => console.log('  -', f.name, '|', f.category));

  const { data: permitFees } = await supabase
    .from('fees')
    .select('name, category, is_active, applies_to, use_subtypes, calc_type, rate, unit_label, formula')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%building permit%');

  console.log('\nBuilding Permit Fees:', permitFees?.length || 0);
  permitFees?.forEach(f => console.log('  -', f.name, '| active:', f.is_active, '| applies_to:', f.applies_to, '| calc:', f.calc_type, '| rate:', f.rate, '| unit:', f.unit_label, '| formula:', f.formula));

  // Check SDC fees
  const { data: sdcFees } = await supabase
    .from('fees')
    .select('name, applies_to, use_subtypes')
    .eq('jurisdiction_id', jurisdiction!.id)
    .eq('is_active', true)
    .ilike('name', '%system development%');

  console.log('\nSystem Development Charges:', sdcFees?.length || 0);
  sdcFees?.forEach(f => console.log('  -', f.name, '| applies_to:', f.applies_to, '| use_subtypes:', f.use_subtypes));
}

check();
