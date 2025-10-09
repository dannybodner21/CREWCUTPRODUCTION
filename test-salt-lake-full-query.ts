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

  // Step 1: Get fee IDs (mimicking the FeeCalculator logic)
  console.log('\n🔍 Step 1: Getting fee IDs...');
  let feeIdsQuery = supabase
    .from('fees')
    .select('id, service_area_id')
    .eq('jurisdiction_id', jurisdictionResult.data.id)
    .eq('is_active', true);

  const selectedServiceAreaIds: string[] = [];

  if (selectedServiceAreaIds.length === 0) {
    feeIdsQuery = feeIdsQuery.is('service_area_id', null);
    console.log('📍 Query: Citywide only (service_area_id IS NULL)');
  }

  const { data: feeIds, error: feeIdsError } = await feeIdsQuery;

  if (feeIdsError) {
    console.error('❌ Error getting fee IDs:', feeIdsError);
    return;
  }

  console.log(`✅ Found ${feeIds?.length} fee IDs`);

  // Step 2: Get full fee data for these IDs
  console.log('\n🔍 Step 2: Getting full fee data for all IDs...');
  console.log(`   Querying for ${feeIds?.length} fees...`);

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
    console.error('❌ Full data query failed:', error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    return;
  }

  console.log(`✅ Successfully retrieved ${allFees?.length} fees with full data`);

  // Check sample fees
  const feesWithCalcs = allFees?.filter((f: any) => f.fee_calculations && f.fee_calculations.length > 0) || [];
  const feesWithoutCalcs = allFees?.filter((f: any) => !f.fee_calculations || f.fee_calculations.length === 0) || [];

  console.log(`\n📊 Breakdown:`);
  console.log(`   - Fees with calculations: ${feesWithCalcs.length}`);
  console.log(`   - Fees without calculations: ${feesWithoutCalcs.length}`);

  if (feesWithCalcs.length > 0) {
    console.log('\n   Sample fee with calculation:');
    const sample = feesWithCalcs[0] as any;
    console.log('   - Name:', sample.name);
    console.log('   - Agency:', sample.agencies?.name);
    console.log('   - Calc type:', sample.fee_calculations[0].calc_type);
    console.log('   - Rate:', sample.fee_calculations[0].rate);
  }

  if (feesWithoutCalcs.length > 0) {
    console.log('\n   Sample fee WITHOUT calculation:');
    console.log('   - Name:', feesWithoutCalcs[0].name);
    console.log('   - Agency:', (feesWithoutCalcs[0] as any).agencies?.name);
  }
}

test().catch(err => {
  console.error('\n💥 Unhandled error:', err);
});
