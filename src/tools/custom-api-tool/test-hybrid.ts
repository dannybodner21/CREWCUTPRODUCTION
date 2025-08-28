import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testHybridService() {
  console.log('🧪 Testing Hybrid Lewis Service...\n');

  // Test client-side mode
  console.log('📱 Testing CLIENT-SIDE mode...');
  process.env.USE_CLIENT_SIDE = 'true';
  
  try {
    const { hybridLewisService } = await import('./hybrid-lewis-service');
    const result = await hybridLewisService.getUniqueStates();
    
    if (result.success && result.data) {
      console.log(`✅ Client-side: Found ${result.data.length} states`);
      console.log(`📍 States: ${result.data.join(', ')}`);
    } else {
      console.log('❌ Client-side failed:', result.error);
    }
  } catch (error) {
    console.error('💥 Client-side error:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test server-side mode
  console.log('🖥️  Testing SERVER-SIDE mode...');
  process.env.USE_CLIENT_SIDE = 'false';
  
  try {
    const { hybridLewisService } = await import('./hybrid-lewis-service');
    const result = await hybridLewisService.getUniqueStates();
    
    if (result.success && result.data) {
      console.log(`✅ Server-side: Found ${result.data.length} states`);
      console.log(`📍 States: ${result.data.join(', ')}`);
    } else {
      console.log('❌ Server-side failed:', result.error);
    }
  } catch (error) {
    console.error('💥 Server-side error:', error);
  }

  console.log('\n✅ Hybrid service test completed!');
}

testHybridService();
