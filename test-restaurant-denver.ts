/**
 * Test Denver with "Restaurant/Food Service" project type
 * To see if matching logic works
 */

import { FeeCalculator } from './src/lib/fee-calculator';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testRestaurant() {
  console.log('🧪 TESTING: Denver + Restaurant/Food Service\n');
  console.log('User Selection:');
  console.log('  Jurisdiction: Denver');
  console.log('  Project Type: Restaurant/Food Service');
  console.log('  Units: 10');
  console.log('  Square Feet: 5,000');
  console.log('');

  const calculator = new FeeCalculator(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const result = await calculator.calculateFees({
      jurisdictionName: 'Denver',
      stateCode: 'CO',
      selectedServiceAreaIds: [],
      projectType: 'Restaurant/Food Service',  // Exactly as user selects from dropdown
      useSubtype: null,
      numUnits: 10,
      squareFeet: 5000,
      projectValue: null,
      meterSize: '3/4"'
    });

    console.log('═'.repeat(80));
    console.log('RESULT:');
    console.log('═'.repeat(80));
    console.log(`Total One-Time Fees: $${result.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${result.monthlyFees.toLocaleString()}`);
    console.log(`Number of fees found: ${result.fees.length}`);

    if (result.fees.length > 0) {
      console.log('\nFees breakdown:');
      result.fees.forEach(fee => {
        const cost = fee.cost || fee.calculatedAmount || 0;
        console.log(`  • ${fee.feeName}: $${cost.toLocaleString()}`);
        console.log(`    applies_to: ${JSON.stringify(fee.rawFeeData?.applies_to || fee.appliesTo || [])}`);
      });
    } else {
      console.log('\n⚠️  NO FEES FOUND');
      console.log('\nThis means:');
      console.log('  1. Denver has no fees in the database, OR');
      console.log('  2. No fees have applies_to that matches "Restaurant/Food Service"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRestaurant();
