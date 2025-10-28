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

  console.log('🔍 Checking specific fees in detail...\n');

  // Check Building Permit Fee
  const { data: buildingFee } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Building Permit%')
    .single();

  console.log('🏗️  Building Permit Fee:');
  console.log(`   Name: ${buildingFee?.name}`);
  console.log(`   applies_to: ${JSON.stringify(buildingFee?.applies_to)}`);
  console.log(`   use_subtypes: ${JSON.stringify(buildingFee?.use_subtypes)}`);
  console.log(`   service_area_id: ${buildingFee?.service_area_id}`);
  console.log(`   calculations: ${buildingFee?.fee_calculations?.length}`);
  if (buildingFee?.fee_calculations?.[0]) {
    const calc = buildingFee.fee_calculations[0];
    console.log(`   calc_type: ${calc.calc_type}`);
    console.log(`   rate: ${calc.rate}`);
    console.log(`   formula_type: ${calc.formula_type}`);
    console.log(`   formula_config: ${JSON.stringify(calc.formula_config)}`);
    console.log(`   formula_display: ${calc.formula_display}`);
  }

  // Check Water Connection Fees (not meter installation)
  const { data: waterFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .or('name.ilike.%water%connection%,name.ilike.%water%service%');

  console.log('\n💧 Water Connection/Service Fees:');
  waterFees?.slice(0, 3).forEach(f => {
    console.log(`   - ${f.name}`);
    console.log(`     applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`     use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    console.log(`     service_area_id: ${f.service_area_id}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`     calc_type: ${calc.calc_type}, rate: ${calc.rate}`);
    }
  });

  // Check Park Fees
  const { data: parkFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*), service_areas(name)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%park fee%');

  console.log('\n🌳 Park Fees (Quimby):');
  parkFees?.forEach(f => {
    console.log(`   - ${f.name}`);
    console.log(`     applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`     use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    console.log(`     service_area: ${(f.service_areas as any)?.name || 'Citywide'}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`     calc_type: ${calc.calc_type}, rate: ${calc.rate}`);
    }
  });

  // Check for monthly utility fees
  const { data: monthlyFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .or('name.ilike.%monthly%,name.ilike.%base charge%,unit_label.ilike.%month%');

  console.log('\n📅 Monthly/Recurring Fees:');
  console.log(`Found ${monthlyFees?.length || 0} potential monthly fees`);
  monthlyFees?.forEach(f => {
    console.log(`   - ${f.name}`);
    console.log(`     applies_to: ${JSON.stringify(f.applies_to)}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`     calc_type: ${calc.calc_type}, unit_label: ${calc.unit_label}`);
    }
  });
}

test();
