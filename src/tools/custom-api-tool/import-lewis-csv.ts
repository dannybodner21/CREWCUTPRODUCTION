import { createSupabaseAdminClient } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

interface CSVImportConfig {
    citiesFile: string;
    feeCategoriesFile: string;
    feesFile: string;
    breakdownsFile?: string;
}

class LewisCSVImporter {
    private adminClient = createSupabaseAdminClient();

    async clearAllLewisData() {
        console.log('🧹 Clearing all existing Lewis data...');

        try {
            // Clear in reverse order due to foreign key constraints
            await this.adminClient.from('detailed_fee_breakdown').delete().neq('id', 0);
            await this.adminClient.from('verified_fee_data').delete().neq('id', 0);
            await this.adminClient.from('webhound_fee_categories').delete().neq('id', 0);
            await this.adminClient.from('cities').delete().neq('id', 0);

            console.log('✅ All Lewis data cleared successfully!');
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            throw error;
        }
    }

    async importCities(csvFilePath: string) {
        console.log(`🏙️ Importing cities from: ${csvFilePath}`);

        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`Cities CSV file not found: ${csvFilePath}`);
        }

        const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        console.log(`   CSV headers: ${headers.join(', ')}`);

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const cityData: any = {};

            headers.forEach((header, index) => {
                cityData[header] = values[index] || null;
            });

            try {
                const { error } = await this.adminClient
                    .from('cities')
                    .insert(cityData);

                if (error) {
                    console.error(`   ❌ Error inserting city ${cityData.name}:`, error);
                } else {
                    console.log(`   ✅ Imported: ${cityData.name}, ${cityData.state}`);
                }
            } catch (err) {
                console.error(`   ❌ Error inserting city ${cityData.name}:`, err);
            }
        }
    }

    async importFeeCategories(csvFilePath: string) {
        console.log(`🏷️ Importing fee categories from: ${csvFilePath}`);

        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`Fee categories CSV file not found: ${csvFilePath}`);
        }

        const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        console.log(`   CSV headers: ${headers.join(', ')}`);

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const categoryData: any = {};

            headers.forEach((header, index) => {
                categoryData[header] = values[index] || null;
            });

            try {
                const { error } = await this.adminClient
                    .from('webhound_fee_categories')
                    .insert(categoryData);

                if (error) {
                    console.error(`   ❌ Error inserting category ${categoryData.category_name}:`, error);
                } else {
                    console.log(`   ✅ Imported: ${categoryData.category_name}`);
                }
            } catch (err) {
                console.error(`   ❌ Error inserting category ${categoryData.category_name}:`, err);
            }
        }
    }

    async importFees(csvFilePath: string) {
        console.log(`💰 Importing fees from: ${csvFilePath}`);

        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`Fees CSV file not found: ${csvFilePath}`);
        }

        const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        console.log(`   CSV headers: ${headers.join(', ')}`);

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const feeData: any = {};

            headers.forEach((header, index) => {
                feeData[header] = values[index] || null;
            });

            try {
                const { error } = await this.adminClient
                    .from('verified_fee_data')
                    .insert(feeData);

                if (error) {
                    console.error(`   ❌ Error inserting fee for city ${feeData.city_id}:`, error);
                } else {
                    console.log(`   ✅ Imported fee: $${feeData.fee_amount} for city ${feeData.city_id}`);
                }
            } catch (err) {
                console.error(`   ❌ Error inserting fee for city ${feeData.city_id}:`, err);
            }
        }
    }

    async importDetailedBreakdowns(csvFilePath: string) {
        if (!fs.existsSync(csvFilePath)) {
            console.log('   ⚠️ Detailed breakdowns CSV not provided, skipping...');
            return;
        }

        console.log(`📋 Importing detailed fee breakdowns from: ${csvFilePath}`);

        const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        console.log(`   CSV headers: ${headers.join(', ')}`);

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const breakdownData: any = {};

            headers.forEach((header, index) => {
                breakdownData[header] = values[index] || null;
            });

            try {
                const { error } = await this.adminClient
                    .from('detailed_fee_breakdown')
                    .insert(breakdownData);

                if (error) {
                    console.error(`   ❌ Error inserting breakdown:`, error);
                } else {
                    console.log(`   ✅ Imported breakdown: ${breakdownData.fee_type}`);
                }
            } catch (err) {
                console.error(`   ❌ Error inserting breakdown:`, err);
            }
        }
    }

    async importAllData(config: CSVImportConfig) {
        console.log('🚀 Starting Lewis CSV data import...\n');

        try {
            // First clear all existing data
            await this.clearAllLewisData();
            console.log('');

            // Import new data
            await this.importCities(config.citiesFile);
            console.log('');

            await this.importFeeCategories(config.feeCategoriesFile);
            console.log('');

            await this.importFees(config.feesFile);
            console.log('');

            if (config.breakdownsFile) {
                await this.importDetailedBreakdowns(config.breakdownsFile);
                console.log('');
            }

            console.log('🎉 CSV import completed successfully!');
            console.log('You can now use the Lewis Construction Fee Portal with your imported data.');

        } catch (error) {
            console.error('❌ Error during CSV import:', error);
            throw error;
        }
    }
}

// Export the importer class
export const lewisCSVImporter = new LewisCSVImporter();

// Example usage (uncomment and modify as needed):
/*
import { lewisCSVImporter } from './import-lewis-csv';

const config = {
    citiesFile: './data/cities.csv',
    feeCategoriesFile: './data/fee-categories.csv',
    feesFile: './data/fees.csv',
    breakdownsFile: './data/breakdowns.csv' // optional
};

lewisCSVImporter.importAllData(config);
*/
