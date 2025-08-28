import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔧 Environment Variables Debug:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   USE_CLIENT_SIDE:', process.env.USE_CLIENT_SIDE);
console.log('   LEWIS_SUPABASE_URL:', process.env.LEWIS_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   LEWIS_SUPABASE_ANON_KEY:', process.env.LEWIS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Test the hybrid service config
const isDevelopment = process.env.NODE_ENV === 'development';
const useClientSide = isDevelopment && process.env.USE_CLIENT_SIDE === 'true';

console.log('\n🔧 Calculated Config:');
console.log('   isDevelopment:', isDevelopment);
console.log('   useClientSide:', useClientSide);
console.log('   Will use:', useClientSide ? 'CLIENT-SIDE (direct DB)' : 'SERVER-SIDE (API routes)');
