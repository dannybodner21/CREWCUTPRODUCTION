import { createSupabaseAdminClient } from './supabase';
import * as fs from 'fs';

interface ArizonaFeeData {
    location_name: string;
    [key: string]: string; // Dynamic fee categories
}

class ArizonaCSVImporter {
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

    async importArizonaData(csvFilePath: string) {
        console.log(`🏙️ Importing Arizona construction fee data from: ${csvFilePath}`);

        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`Arizona CSV file not found: ${csvFilePath}`);
        }

        const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        console.log(`   CSV headers: ${headers.length} fee categories found`);
        console.log(`   Sample headers: ${headers.slice(0, 5).join(', ')}...`);

        // Extract fee categories (all columns except location_name)
        const feeCategories = headers.slice(1); // Skip location_name column

        // First, populate fee categories
        await this.populateFeeCategories(feeCategories);

        // Then populate cities and fees
        await this.populateCitiesAndFees(lines.slice(1), headers, feeCategories);
    }

    private async populateFeeCategories(feeCategories: string[]) {
        console.log(`🏷️ Populating ${feeCategories.length} fee categories...`);

        for (const category of feeCategories) {
            try {
                const { error } = await this.adminClient
                    .from('webhound_fee_categories')
                    .insert({
                        category_name: category,
                        description: `Construction fee for ${category.replace(/_/g, ' ')}`,
                        fee_type: 'construction',
                        calculation_method: 'varies by city'
                    });

                if (error) {
                    console.error(`   ❌ Error inserting category ${category}:`, error);
                } else {
                    console.log(`   ✅ Imported: ${category}`);
                }
            } catch (err) {
                console.error(`   ❌ Error inserting category ${category}:`, err);
            }
        }
    }

    private async populateCitiesAndFees(lines: string[], headers: string[], feeCategories: string[]) {
        console.log(`🏙️ Processing ${lines.length} cities...`);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const values = this.parseCSVLine(line);
            const cityName = values[0]; // First column is location_name

            if (!cityName || cityName === 'location_name') continue;

            try {
                // Insert city
                const { data: cityData, error: cityError } = await this.adminClient
                    .from('cities')
                    .insert({
                        name: cityName,
                        county: 'Arizona', // Default to Arizona
                        state: 'Arizona',
                        stateCode: 'AZ',
                        data_source_url: 'https://arizona.gov'
                    })
                    .select()
                    .single();

                if (cityError) {
                    console.error(`   ❌ Error inserting city ${cityName}:`, cityError);
                    continue;
                }

                console.log(`   ✅ City: ${cityName} (ID: ${cityData.id})`);

                // Insert fees for this city
                await this.insertCityFees(cityData.id, values, headers, feeCategories);

            } catch (err) {
                console.error(`   ❌ Error processing city ${cityName}:`, err);
            }
        }
    }

    private async insertCityFees(cityId: number, values: string[], headers: string[], feeCategories: string[]) {
        // Get fee category IDs for reference
        const { data: categories } = await this.adminClient
            .from('webhound_fee_categories')
            .select('id, category_name');

        const categoryMap = new Map(categories?.map(c => [c.category_name, c.id]) || []);

        for (let i = 1; i < values.length; i++) { // Start from 1 to skip city name
            const feeValue = values[i];
            const categoryName = headers[i];

            if (!feeValue || feeValue === 'N/A - Not found in web-based sources' || feeValue.trim() === '') {
                continue; // Skip empty or N/A values
            }

            const categoryId = categoryMap.get(categoryName);
            if (!categoryId) continue;

            try {
                // Parse fee amount from the text description
                const feeAmount = this.extractFeeAmount(feeValue);

                if (feeAmount !== null) {
                    const { error } = await this.adminClient
                        .from('verified_fee_data')
                        .insert({
                            city_id: cityId,
                            fee_category_id: categoryId,
                            fee_amount: feeAmount,
                            fee_unit: 'USD',
                            development_type: 'all',
                            verification_status: 'verified'
                        });

                    if (error) {
                        console.error(`     ❌ Error inserting fee for ${categoryName}:`, error);
                    } else {
                        console.log(`     ✅ Fee: ${categoryName} - $${feeAmount}`);
                    }
                }
            } catch (err) {
                console.error(`     ❌ Error inserting fee for ${categoryName}:`, err);
            }
        }
    }

    private parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    private extractFeeAmount(feeText: string): number | null {
        // Try to extract numeric fee amounts from the text
        // Look for patterns like "$150", "$1,500", "150", etc.
        const feePatterns = [
            /\$([0-9,]+(?:\.[0-9]{2})?)/g,  // $150, $1,500.00
            /([0-9,]+(?:\.[0-9]{2})?)\s*(?:dollars?|USD)/gi,  // 150 dollars, 1,500 USD
            /([0-9,]+(?:\.[0-9]{2})?)\s*per\s*(?:thousand|1000)/gi,  // 0.5 per 1000
            /([0-9,]+(?:\.[0-9]{2})?)\s*times\s*construction\s*cost/gi,  // 0.008 times construction cost
        ];

        for (const pattern of feePatterns) {
            const matches = feeText.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const amount = parseFloat(match.replace(/[$,]/g, ''));
                    if (!isNaN(amount) && amount > 0) {
                        return amount;
                    }
                }
            }
        }

        // If no specific amount found, try to extract percentage or rate
        const percentagePattern = /([0-9.]+)\s*times\s*construction\s*cost/gi;
        const percentageMatch = feeText.match(percentagePattern);
        if (percentageMatch) {
            const rate = parseFloat(percentageMatch[0].replace(/[^\d.]/g, ''));
            if (!isNaN(rate) && rate > 0) {
                return rate; // Return as decimal (e.g., 0.008 for 0.8%)
            }
        }

        return null; // Could not extract a fee amount
    }

    async importAllData(csvFilePath: string) {
        console.log('🚀 Starting Arizona construction fee data import...\n');

        try {
            // First clear all existing data
            await this.clearAllLewisData();
            console.log('');

            // Import Arizona data
            await this.importArizonaData(csvFilePath);
            console.log('');

            console.log('🎉 Arizona CSV import completed successfully!');
            console.log('You can now use the Lewis Construction Fee Portal with Arizona construction fee data.');

        } catch (error) {
            console.error('❌ Error during Arizona CSV import:', error);
            throw error;
        }
    }
}

// Export the importer class
export const arizonaCSVImporter = new ArizonaCSVImporter();

// Example usage:
/*
import { arizonaCSVImporter } from './import-arizona-csv';

arizonaCSVImporter.importAllData('./fee_data/arizona.csv');
*/
