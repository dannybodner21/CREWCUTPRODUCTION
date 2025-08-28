import { lewisDataPopulator } from './lewis-data-populator';

async function main() {
    console.log('🚀 Lewis Construction Fee Database Population Script');
    console.log('==================================================');

    try {
        // Populate all data
        await lewisDataPopulator.populateAllData();

        console.log('\n🎉 Database population completed successfully!');
        console.log('You can now use the Lewis Construction Fee Portal with real data.');

    } catch (error) {
        console.error('❌ Error during database population:', error);
        process.exit(1);
    }
}

// Run the script
main();
