/**
 * Test the calculateProjectFees API endpoint for Salt Lake City
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

async function testAPI() {
  console.log('🧪 Testing Salt Lake City fee calculation API...\n');

  const requestBody = {
    action: 'calculateProjectFees',
    params: {
      jurisdictionName: 'Salt Lake City',
      stateCode: 'UT',
      selectedServiceAreaIds: [],
      projectType: 'Residential',
      useSubtype: 'Single Family',
      numUnits: 1,
      squareFeet: 2000,
      projectValue: 500000,
      meterSize: '3/4"'
    }
  };

  console.log('📤 Sending request:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/lewis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('\n📥 Response status:', response.status);

    const result = await response.json();

    console.log('\n📊 Response body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`   Total fees found: ${result.data?.fees?.length || 0}`);
      console.log(`   One-time fees: $${result.data?.oneTimeFees || 0}`);
      console.log(`   Monthly fees: $${result.data?.monthlyFees || 0}`);

      if (result.data?.fees && result.data.fees.length > 0) {
        console.log('\n   Sample fees (first 5):');
        result.data.fees.slice(0, 5).forEach((fee: any) => {
          console.log(`   - ${fee.feeName}: $${fee.calculatedAmount}`);
        });
      }
    } else {
      console.log('\n❌ FAILED!');
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error);
  }
}

testAPI();
