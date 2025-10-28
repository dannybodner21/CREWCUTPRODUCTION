import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function debugAustin() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Austin')
    .single();

  console.log('🔍 AUSTIN DEBUG\n');

  // Check if Austin has service areas
  const { data: serviceAreas } = await supabase
    .from('service_areas')
    .select('*')
    .eq('jurisdiction_id', jurisdiction!.id);

  console.log('🗺️  SERVICE AREAS:');
  console.log(`   Total: ${serviceAreas?.length || 0}`);
  serviceAreas?.forEach(sa => console.log(`   - ${sa.name} (id: ${sa.id})`));
  console.log();

  // 1. Check Street Impact Fees
  console.log('1️⃣ STREET IMPACT FEES:');
  const { data: streetFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Street Impact%');

  streetFees?.forEach(f => {
    console.log(`   📋 ${f.name}`);
    console.log(`      applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`      use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    console.log(`      is_active: ${f.is_active}`);
    console.log(`      service_area_id: ${f.service_area_id || 'NULL (citywide)'}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`      calc_type: ${calc.calc_type}, rate: ${calc.rate}, unit_label: ${JSON.stringify(calc.unit_label)}`);
    }
  });

  // Check Parkland Dedication Fee
  console.log('\n5️⃣ PARKLAND DEDICATION FEE:');
  const { data: parkFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Parkland Dedication%');

  console.log(`   Total Parkland fees: ${parkFees?.length || 0}`);
  parkFees?.forEach(f => {
    console.log(`   📋 ${f.name}`);
    console.log(`      applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`      use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    console.log(`      service_area_id: ${f.service_area_id || 'NULL (citywide)'}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`      calc_type: ${calc.calc_type}, rate: ${calc.rate}, unit_label: ${JSON.stringify(calc.unit_label)}`);
    }
  });

  // 2. Check Water/Wastewater Impact Fees
  console.log('\n2️⃣ WATER/WASTEWATER IMPACT FEES:');
  const { data: waterFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .or('name.ilike.%Water Impact%,name.ilike.%Wastewater Impact%');

  waterFees?.forEach(f => {
    console.log(`   📋 ${f.name}`);
    console.log(`      applies_to: ${JSON.stringify(f.applies_to)}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`      calc_type: ${calc.calc_type}, rate: ${calc.rate}, unit_label: ${calc.unit_label}`);
    }
  });

  // 3. Check Transportation User Fees
  console.log('\n3️⃣ TRANSPORTATION USER FEES:');
  const { data: transFees } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%Transportation User Fee%');

  console.log(`   Total Transportation User Fees: ${transFees?.length}`);
  transFees?.forEach(f => {
    console.log(`   📋 ${f.name}`);
    console.log(`      applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`      use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`      calc_type: ${calc.calc_type}, rate: ${calc.rate}`);
    }
  });

  // 4. Check questionable fees
  console.log('\n4️⃣ QUESTIONABLE FEES:');
  const { data: questionable } = await supabase
    .from('fees')
    .select('*, fee_calculations(*)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .or('name.ilike.%Project Consent%,name.ilike.%Volume Builder%');

  questionable?.forEach(f => {
    console.log(`   📋 ${f.name}`);
    console.log(`      applies_to: ${JSON.stringify(f.applies_to)}`);
    console.log(`      description: ${f.description?.substring(0, 100)}...`);
    if (f.fee_calculations?.[0]) {
      const calc = f.fee_calculations[0];
      console.log(`      calc_type: ${calc.calc_type}, rate: ${calc.rate}`);
    }
  });
}

debugAustin();
