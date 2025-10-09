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
    .select('id, jurisdiction_name')
    .eq('jurisdiction_name', 'Salt Lake City')
    .single();

  if (!jurisdictionResult.data) {
    console.log('❌ Salt Lake City not found');
    return;
  }

  console.log('✅ Found jurisdiction:', jurisdictionResult.data);

  // Check if fees have is_active column and what values they have
  const feesResult = await supabase
    .from('fees')
    .select('id, name, is_active, fee_calculations(id, calc_type, rate)')
    .eq('jurisdiction_id', jurisdictionResult.data.id)
    .limit(10);

  console.log('\n💰 Sample fees (first 10):');
  feesResult.data?.forEach(fee => {
    console.log(`   - ${fee.name}`);
    console.log(`     is_active: ${fee.is_active}`);
    console.log(`     fee_calculations: ${(fee as any).fee_calculations?.length || 0}`);
    if ((fee as any).fee_calculations && (fee as any).fee_calculations.length > 0) {
      (fee as any).fee_calculations.forEach((calc: any) => {
        console.log(`       - ${calc.calc_type}: $${calc.rate}`);
      });
    }
  });

  // Count active vs inactive
  const allFeesResult = await supabase
    .from('fees')
    .select('is_active')
    .eq('jurisdiction_id', jurisdictionResult.data.id);

  const activeCount = allFeesResult.data?.filter(f => f.is_active === true).length || 0;
  const inactiveCount = allFeesResult.data?.filter(f => f.is_active === false).length || 0;
  const nullCount = allFeesResult.data?.filter(f => f.is_active === null).length || 0;

  console.log(`\n📊 Active status distribution:`);
  console.log(`   - Active (is_active = true): ${activeCount} fees`);
  console.log(`   - Inactive (is_active = false): ${inactiveCount} fees`);
  console.log(`   - NULL: ${nullCount} fees`);
}

test();
