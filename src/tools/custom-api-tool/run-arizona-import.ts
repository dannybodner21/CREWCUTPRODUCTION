import { arizonaCSVImporter } from './import-arizona-csv';

async function main() {
    console.log('🚀 Arizona Construction Fee CSV Import Script');
    console.log('=============================================\n');

    // Path to your Arizona CSV file
    const csvFilePath = './fee_data/arizona.csv';

    console.log('📁 CSV File Path:');
    console.log(`   Arizona Data: ${csvFilePath}`);
    console.log('');

    try {
        // Import all Arizona data (this will clear existing data first)
        await arizonaCSVImporter.importAllData(csvFilePath);

        console.log('\n🎉 Arizona import completed successfully!');
        console.log('Your Lewis Construction Fee Portal is now ready with Arizona construction fee data.');

    } catch (error) {
        console.error('\n❌ Arizona import failed:', error);
        process.exit(1);
    }
}

// Run the import
main();
