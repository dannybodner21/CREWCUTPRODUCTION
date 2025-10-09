import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  // Get Salt Lake City jurisdiction
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

  // Get fee IDs
  const { data: feeIds, error: feeIdsError } = await supabase
    .from('fees')
    .select('id, service_area_id')
    .eq('jurisdiction_id', jurisdictionResult.data.id)
    .eq('is_active', true)
    .is('service_area_id', null)
    .limit(5);

  if (feeIdsError) {
    console.error('❌ Error getting fee IDs:', feeIdsError);
    return;
  }

  console.log(`\n✅ Found ${feeIds?.length} fee IDs:`, feeIds?.map(f => f.id));

  // Now try the complex query that's failing
  console.log('\n🔍 Testing complex query with relationships...');

  const { data: allFees, error } = await supabase
    .from('fees')
    .select(`
      id,
      name,
      category,
      applies_to,
      use_subtypes,
      agencies(name),
      service_areas(name),
      fee_calculations(
        id,
        calc_type,
        rate,
        unit_label,
        min_fee,
        max_fee,
        tiers,
        formula_type,
        formula_config,
        formula_display,
        applies_to_meter_sizes
      )
    `)
    .in('id', feeIds?.map(f => f.id) || []);

  if (error) {
    console.error('❌ Complex query failed:', error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    return;
  }

  console.log('\n✅ Complex query succeeded!');
  console.log(`   Found ${allFees?.length} fees with full data`);

  if (allFees && allFees.length > 0) {
    const fee = allFees[0];
    console.log('\n   Sample fee:');
    console.log('   - Name:', (fee as any).name);
    console.log('   - Category:', (fee as any).category);
    console.log('   - Agency:', (fee as any).agencies);
    console.log('   - Service Area:', (fee as any).service_areas);
    console.log('   - Fee Calculations:', (fee as any).fee_calculations?.length || 0);
    if ((fee as any).fee_calculations && (fee as any).fee_calculations.length > 0) {
      console.log('     First calculation:');
      console.log('       - calc_type:', (fee as any).fee_calculations[0].calc_type);
      console.log('       - rate:', (fee as any).fee_calculations[0].rate);
      console.log('       - unit_label:', (fee as any).fee_calculations[0].unit_label);
    }
  }
}

test();
