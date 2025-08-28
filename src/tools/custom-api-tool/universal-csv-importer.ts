import { createSupabaseAdminClient } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

interface UniversalFeeData {
    location_name: string;
    [key: string]: string; // Dynamic fee categories
}

interface ImportResult {
    success: boolean;
    message: string;
    citiesCreated: number;
    feeCategoriesCreated: number;
    feeRecordsCreated: number;
    errors: string[];
}

class UniversalCSVImporter {
    // Remove the private adminClient property that was initialized at class instantiation
    // Instead, we'll create it when needed

    /**
     * Get the admin client when needed (lazy loading)
     */
    private getAdminClient() {
        return createSupabaseAdminClient();
    }

    /**
     * Clear all existing Lewis construction fee data
     */
    async clearAllLewisData(): Promise<void> {
        console.log('🗑️  Clearing all existing Lewis construction fee data...');

        try {
            const adminClient = this.getAdminClient();

            // Delete in reverse order to respect foreign key constraints
            const { error: breakdownError } = await adminClient
                .from('detailed_fee_breakdown')
                .delete()
                .neq('id', 0);
            if (breakdownError) console.log('⚠️  Error clearing detailed_fee_breakdown:', breakdownError.message);

            const { error: feeError } = await adminClient
                .from('verified_fee_data')
                .delete()
                .neq('id', 0);
            if (feeError) console.log('⚠️  Error clearing verified_fee_data:', feeError.message);

            const { error: cityError } = await adminClient
                .from('cities')
                .delete()
                .neq('id', 0);
            if (cityError) console.log('⚠️  Error clearing cities:', cityError.message);

            const { error: categoryError } = await adminClient
                .from('webhound_fee_categories')
                .delete()
                .neq('id', 0);
            if (categoryError) console.log('⚠️  Error clearing webhound_fee_categories:', categoryError.message);

            console.log('✅ All Lewis data cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            throw error;
        }
    }

    /**
     * Import data from a single state CSV file
     */
    async importStateData(csvFilePath: string, stateName: string): Promise<ImportResult> {
        console.log(`\n🌍 Importing data for ${stateName} from ${path.basename(csvFilePath)}...`);

        const result: ImportResult = {
            success: false,
            message: '',
            citiesCreated: 0,
            feeCategoriesCreated: 0,
            feeRecordsCreated: 0,
            errors: []
        };

        try {
            // Read and parse CSV
            const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
            const lines = csvContent.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                throw new Error('CSV file must have at least a header row and one data row');
            }

            const headers = this.parseCSVLine(lines[0]);
            const dataLines = lines.slice(1);

            console.log(`📊 Found ${dataLines.length} locations with ${headers.length - 1} fee categories`);

            // Extract fee categories from headers (skip first column which is location_name)
            const feeCategories = headers.slice(1);

            // Create fee categories in database
            const categoryResult = await this.populateFeeCategories(feeCategories);
            result.feeCategoriesCreated = categoryResult.created;

            // Process each location
            for (const line of dataLines) {
                if (!line.trim()) continue;

                try {
                    const values = this.parseCSVLine(line);
                    if (values.length < 2) continue;

                    const locationName = values[0].trim();
                    if (!locationName) continue;

                    // Create city record
                    const cityResult = await this.createCity(locationName, stateName);
                    if (cityResult.success && cityResult.cityId) {
                        result.citiesCreated++;

                        // Insert fee data for this city
                        const feeResult = await this.insertCityFees(
                            cityResult.cityId,
                            values.slice(1),
                            feeCategories,
                            stateName
                        );
                        result.feeRecordsCreated += feeResult.created;
                    }
                } catch (error) {
                    const errorMsg = `Error processing location: ${error}`;
                    result.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }

            result.success = true;
            result.message = `Successfully imported ${stateName} data: ${result.citiesCreated} cities, ${result.feeRecordsCreated} fee records`;

        } catch (error) {
            result.success = false;
            result.message = `Failed to import ${stateName} data: ${error}`;
            result.errors.push(error.toString());
        }

        return result;
    }

    /**
     * Import all state CSV files from the fee_data directory
     */
    async importAllStates(): Promise<ImportResult[]> {
        console.log('🚀 Starting universal CSV import for all states...\n');

        const feeDataDir = './fee_data';
        const results: ImportResult[] = [];

        try {
            // Clear existing data first
            await this.clearAllLewisData();

            // Get all CSV files
            const files = fs.readdirSync(feeDataDir)
                .filter(file => file.endsWith('.csv'))
                .sort();

            console.log(`📁 Found ${files.length} CSV files to process`);

            // Process each state file
            for (const file of files) {
                const filePath = path.join(feeDataDir, file);
                const stateName = path.basename(file, '.csv').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                try {
                    const result = await this.importStateData(filePath, stateName);
                    results.push(result);

                    if (result.success) {
                        console.log(`✅ ${stateName}: ${result.message}`);
                    } else {
                        console.log(`❌ ${stateName}: ${result.message}`);
                    }
                } catch (error) {
                    console.error(`💥 Error processing ${stateName}:`, error);
                    results.push({
                        success: false,
                        message: `Error processing ${stateName}: ${error}`,
                        citiesCreated: 0,
                        feeCategoriesCreated: 0,
                        feeRecordsCreated: 0,
                        errors: [error.toString()]
                    });
                }
            }

            // Print summary
            this.printImportSummary(results);

        } catch (error) {
            console.error('💥 Fatal error during import:', error);
        }

        return results;
    }

    /**
     * Create fee categories in the database
     */
    private async populateFeeCategories(feeCategories: string[]): Promise<{ created: number }> {
        let created = 0;
        const adminClient = this.getAdminClient();

        for (const category of feeCategories) {
            try {
                const categoryKey = this.generateCategoryKey(category);
                const categoryGroup = this.categorizeFee(category);

                const { error } = await adminClient
                    .from('webhound_fee_categories')
                    .upsert({
                        category_key: categoryKey,
                        category_display_name: category,
                        category_group: categoryGroup
                    }, { onConflict: 'category_key' });

                if (!error) {
                    created++;
                }
            } catch (error) {
                console.error(`Error creating fee category ${category}:`, error);
            }
        }

        return { created };
    }

    /**
     * Create a city record
     */
    private async createCity(name: string, state: string): Promise<{ success: boolean; cityId?: number }> {
        try {
            const adminClient = this.getAdminClient();

            // Try to find existing city first
            const { data: existing } = await adminClient
                .from('cities')
                .select('id')
                .eq('name', name)
                .eq('state', state)
                .single();

            if (existing) {
                return { success: true, cityId: existing.id };
            }

            // Create new city
            const { data, error } = await adminClient
                .from('cities')
                .insert({
                    name: name,
                    state: state,
                    county: 'Unknown', // Will be updated later if we have county data
                    last_updated: new Date().toISOString().split('T')[0]
                })
                .select('id')
                .single();

            if (error) {
                throw error;
            }

            return { success: true, cityId: data.id };
        } catch (error) {
            console.error(`Error creating city ${name}:`, error);
            return { success: false };
        }
    }

    /**
     * Insert fee data for a city
     */
    private async insertCityFees(
        cityId: number,
        values: string[],
        feeCategories: string[],
        stateName: string
    ): Promise<{ created: number }> {
        let created = 0;
        const adminClient = this.getAdminClient();

        for (let i = 0; i < feeCategories.length && i < values.length; i++) {
            const feeValue = values[i]?.trim();
            if (!feeValue || feeValue === 'N/A' || feeValue === '') continue;

            try {
                const categoryKey = this.generateCategoryKey(feeCategories[i]);

                // Parse fee information
                const feeInfo = this.parseFeeValue(feeValue);

                const { error } = await adminClient
                    .from('verified_fee_data')
                    .insert({
                        city_id: cityId,
                        location_name: `Unknown`, // Will be updated with actual city name
                        fee_category: categoryKey,
                        fee_description: feeValue,
                        verified_amounts: feeInfo.amounts,
                        calculation_methods: feeInfo.methods,
                        source_text: feeValue,
                        data_quality_score: feeInfo.qualityScore,
                        has_real_amounts: feeInfo.hasRealAmounts,
                        has_calculations: feeInfo.hasCalculations
                    });

                if (!error) {
                    created++;
                }
            } catch (error) {
                console.error(`Error inserting fee data for ${feeCategories[i]}:`, error);
            }
        }

        return { created };
    }

    /**
     * Parse CSV line (handles quoted values with commas)
     */
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

    /**
     * Generate a consistent category key from display name
     */
    private generateCategoryKey(displayName: string): string {
        return displayName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .trim();
    }

    /**
     * Categorize fees into logical groups
     */
    private categorizeFee(categoryName: string): string {
        const name = categoryName.toLowerCase();

        if (name.includes('plan') || name.includes('review')) return 'planning_review';
        if (name.includes('permit')) return 'permits';
        if (name.includes('inspection')) return 'inspections';
        if (name.includes('water') || name.includes('sewer')) return 'utilities';
        if (name.includes('transportation') || name.includes('traffic')) return 'transportation';
        if (name.includes('fire') || name.includes('safety')) return 'public_safety';
        if (name.includes('park') || name.includes('recreation')) return 'parks_recreation';
        if (name.includes('school') || name.includes('education')) return 'education';
        if (name.includes('environmental') || name.includes('tree') || name.includes('wetland')) return 'environmental';
        if (name.includes('zoning') || name.includes('variance') || name.includes('rezoning')) return 'zoning';
        if (name.includes('subdivision') || name.includes('plat')) return 'subdivision';
        if (name.includes('electrical') || name.includes('plumbing') || name.includes('mechanical')) return 'building_systems';

        return 'other';
    }

    /**
     * Parse fee value to extract amounts and methods
     */
    private parseFeeValue(feeText: string): {
        amounts: string;
        methods: string;
        qualityScore: number;
        hasRealAmounts: boolean;
        hasCalculations: boolean;
    } {
        const text = feeText.toLowerCase();
        let amounts = '';
        let methods = '';
        let qualityScore = 0;
        let hasRealAmounts = false;
        let hasCalculations = false;

        // Look for dollar amounts
        const dollarMatches = feeText.match(/\$[\d,]+(?:\.\d{2})?/g);
        if (dollarMatches) {
            amounts = dollarMatches.join(', ');
            hasRealAmounts = true;
            qualityScore += 3;
        }

        // Look for percentages
        const percentMatches = feeText.match(/\d+(?:\.\d+)?%/g);
        if (percentMatches) {
            if (amounts) amounts += '; ';
            amounts += percentMatches.join(', ');
            hasCalculations = true;
            qualityScore += 2;
        }

        // Look for per-unit calculations
        if (text.includes('per sq ft') || text.includes('per square foot')) {
            methods = 'Per square foot calculation';
            hasCalculations = true;
            qualityScore += 2;
        } else if (text.includes('per acre')) {
            methods = 'Per acre calculation';
            hasCalculations = true;
            qualityScore += 2;
        } else if (text.includes('per unit') || text.includes('per dwelling')) {
            methods = 'Per unit calculation';
            hasCalculations = true;
            qualityScore += 2;
        }

        // Look for tiered pricing
        if (text.includes('tier') || text.includes('based on')) {
            methods = 'Tiered pricing structure';
            hasCalculations = true;
            qualityScore += 1;
        }

        // Look for flat fees
        if (text.includes('flat fee') || text.includes('base fee')) {
            methods = 'Flat fee structure';
            qualityScore += 1;
        }

        // If no amounts found, try to extract any numeric information
        if (!amounts) {
            const numericMatches = feeText.match(/\d+(?:\.\d+)?/g);
            if (numericMatches) {
                amounts = `Numeric values: ${numericMatches.join(', ')}`;
                qualityScore += 1;
            }
        }

        return {
            amounts: amounts || 'No specific amounts found',
            methods: methods || 'Standard fee structure',
            qualityScore: Math.min(qualityScore, 5), // Cap at 5
            hasRealAmounts,
            hasCalculations
        };
    }

    /**
     * Print import summary
     */
    private printImportSummary(results: ImportResult[]): void {
        console.log('\n📊 IMPORT SUMMARY');
        console.log('==================');

        let totalCities = 0;
        let totalFeeRecords = 0;
        let totalFeeCategories = 0;
        let successfulStates = 0;
        let failedStates = 0;

        results.forEach(result => {
            if (result.success) {
                successfulStates++;
                totalCities += result.citiesCreated;
                totalFeeRecords += result.feeRecordsCreated;
                totalFeeCategories = Math.max(totalFeeCategories, result.feeCategoriesCreated);
            } else {
                failedStates++;
            }
        });

        console.log(`✅ Successful imports: ${successfulStates}`);
        console.log(`❌ Failed imports: ${failedStates}`);
        console.log(`🏙️  Total cities created: ${totalCities}`);
        console.log(`💰 Total fee records created: ${totalFeeRecords}`);
        console.log(`📋 Fee categories available: ${totalFeeCategories}`);

        if (failedStates > 0) {
            console.log('\n⚠️  Failed imports:');
            results.filter(r => !r.success).forEach(result => {
                console.log(`   - ${result.message}`);
            });
        }
    }
}

export const universalCSVImporter = new UniversalCSVImporter();
