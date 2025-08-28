import { config } from 'dotenv';
import { resolve } from 'path';
import { universalCSVImporter } from './universal-csv-importer';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('🚀 Universal Construction Fee CSV Import Script');
    console.log('===============================================\n');

    // Verify environment variables are loaded
    console.log('🔧 Environment Check:');
    console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Supabase Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Supabase Service Role: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}\n`);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing required environment variables. Please check your .env.local file.');
        process.exit(1);
    }

    try {
        console.log('📋 This script will:');
        console.log('   1. Clear all existing Lewis construction fee data');
        console.log('   2. Import data from all 21 state CSV files');
        console.log('   3. Create fee categories, cities, and fee records');
        console.log('   4. Provide a detailed summary of the import process\n');

        // Confirm with user
        console.log('⚠️  WARNING: This will DELETE ALL existing Lewis data and replace it with CSV data.');
        console.log('   Make sure you have backed up any important data.\n');

        // Start the import process
        const results = await universalCSVImporter.importAllStates();

        console.log('\n🎉 Universal import process completed!');

        // Check if any imports failed
        const failedImports = results.filter(r => !r.success);
        if (failedImports.length > 0) {
            console.log(`\n⚠️  ${failedImports.length} state imports failed. Check the errors above.`);
            process.exit(1);
        } else {
            console.log('\n✅ All state imports completed successfully!');
        }

    } catch (error) {
        console.error('\n💥 Fatal error during universal import:', error);
        process.exit(1);
    }
}

// Run the import
main();
