import { lewisCSVImporter } from './import-lewis-csv';

async function main() {
    console.log('🚀 Lewis Construction Fee CSV Import Script');
    console.log('===========================================\n');

    // ⚠️ MODIFY THESE PATHS TO MATCH YOUR CSV FILES ⚠️
    const config = {
        citiesFile: './data/cities.csv',           // Path to your cities CSV
        feeCategoriesFile: './data/fee-categories.csv',  // Path to your fee categories CSV
        feesFile: './data/fees.csv',               // Path to your fees CSV
        breakdownsFile: './data/breakdowns.csv'    // Path to your detailed breakdowns CSV (optional)
    };

    console.log('📁 CSV File Configuration:');
    console.log(`   Cities: ${config.citiesFile}`);
    console.log(`   Fee Categories: ${config.feeCategoriesFile}`);
    console.log(`   Fees: ${config.feesFile}`);
    console.log(`   Detailed Breakdowns: ${config.breakdownsFile || 'Not provided'}`);
    console.log('');

    try {
        // Import all data (this will clear existing data first)
        await lewisCSVImporter.importAllData(config);

        console.log('\n🎉 Import completed successfully!');
        console.log('Your Lewis Construction Fee Portal is now ready with the new data.');

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

// Run the import
main();
