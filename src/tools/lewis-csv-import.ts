#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { createSupabaseAdminClient } from './custom-api-tool/supabase';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// CSV Row interface
interface CSVRow {
    state_name: string;
    jurisdiction_name: string;
    agency_name: string;
    fee_name: string;
    category: string;
    description: string;
    unit_label: string;
    calc_method: string;
    rate: string;
    min_fee: string;
    max_fee: string;
    formula: string;
    tier_text: string;
    applies_to: string;
    use_subtype: string;
    service_area_name: string;
    source_title: string;
    source_url: string;
    source_doc_date: string;
    source_page: string;
    source_section: string;
    legal_citation: string;
    effective_date: string;
    notes: string;
}

// Database entities
interface Jurisdiction {
    id: string;
    name: string;
    type: string;
    kind: string;
    parent_id?: string;
    iso_country: string;
    state_fips?: string;
    county_fips?: string;
    place_fips?: string;
    geoid?: string;
    website_url?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    kind_text?: string;
    postal?: string;
    population?: number;
    population_year?: number;
}

interface Agency {
    id: string;
    jurisdiction_id: string;
    name: string;
    short_name?: string;
    type: string;
    description?: string;
    website_url?: string;
    phone?: string;
    email?: string;
    external_ref?: string;
    created_at: string;
    updated_at: string;
}

interface FeeCategory {
    id: number;
    name: string;
    description: string;
    category_group: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Source {
    id: string;
    title: string;
    url: string;
    citation: string;
    doc_date: string;
    retrieved_at: string;
}

interface Fee {
    id: string;
    jurisdiction_id: string;
    agency_id: string;
    service_area_id?: string;
    name: string;
    category: string;
    description?: string;
    applies_to?: string;
    use_subtype?: string;
    unit_label?: string;
    display_order?: number;
    active: boolean;
    created_at: string;
    updated_at: string;
    rate?: number;
    formula?: string;
    normalized_category?: string;
    source_url?: string;
    legal_citation?: string;
    scraped_at?: string;
    verified_at?: string;
    effective_date?: string;
    expiry_date?: string;
    category_id?: number;
}

class LewisCSVImporter {
    private supabase: any;
    private jurisdictions: Map<string, Jurisdiction> = new Map();
    private agencies: Map<string, Agency> = new Map();
    private feeCategories: Map<string, FeeCategory> = new Map();
    private sources: Map<string, Source> = new Map();

    constructor() {
        this.supabase = createSupabaseAdminClient();
    }

    private parseCSV(csvContent: string): CSVRow[] {
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        const rows: CSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row: any = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                rows.push(row as CSVRow);
            }
        }

        return rows;
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

    async importCSV(csvFilePath: string): Promise<void> {
        console.log(`🚀 Starting import of ${csvFilePath}...\n`);

        try {
            // Read and parse CSV
            const csvContent = readFileSync(csvFilePath, 'utf-8');
            const rows: CSVRow[] = this.parseCSV(csvContent);

            console.log(`📊 Found ${rows.length} fee records in CSV`);

            // Process each row
            for (const [index, row] of rows.entries()) {
                if (index % 50 === 0) {
                    console.log(`   Processing row ${index + 1}/${rows.length}...`);
                }

                await this.processRow(row);
            }

            console.log(`\n✅ Successfully imported ${rows.length} fee records from ${csvFilePath}`);
            this.printSummary();

        } catch (error) {
            console.error(`❌ Error importing ${csvFilePath}:`, error);
            throw error;
        }
    }

    private async processRow(row: CSVRow): Promise<void> {
        // 1. Verify jurisdiction exists (don't create)
        const jurisdiction = await this.getOrCreateJurisdiction(row);

        // 2. Get or create agency (for reference, but not used in staging)
        const agency = await this.getOrCreateAgency(row, jurisdiction.id);

        // 3. Get or create fee category (for reference, but not used in staging)
        const feeCategory = await this.getOrCreateFeeCategory(row);

        // 4. Get or create source (for reference, but not used in staging)
        const source = await this.getOrCreateSource(row);

        // 5. Create staged fee record (raw CSV data)
        await this.createFeeRecord(row, jurisdiction.id, agency.id, feeCategory.id, source.id);
    }

    private async getOrCreateJurisdiction(row: CSVRow): Promise<Jurisdiction> {
        const key = `${row.state_name}|${row.jurisdiction_name}`;

        if (this.jurisdictions.has(key)) {
            return this.jurisdictions.get(key)!;
        }

        // Look up existing jurisdiction (don't create new ones)
        const { data: existingJurisdiction, error: searchError } = await this.supabase
            .from('jurisdictions')
            .select('*')
            .eq('name', row.jurisdiction_name)
            .eq('iso_country', 'US')
            .eq('state_fips', this.getStateFIPS(row.state_name))
            .single();

        if (existingJurisdiction && !searchError) {
            this.jurisdictions.set(key, existingJurisdiction);
            console.log(`   📍 Found existing jurisdiction: ${row.jurisdiction_name}, ${row.state_name}`);
            return existingJurisdiction;
        }

        // If jurisdiction doesn't exist, throw an error (don't create new ones)
        console.error(`   ❌ Jurisdiction not found: ${row.jurisdiction_name}, ${row.state_name}`);
        console.error(`   💡 Please ensure all jurisdictions are pre-populated in the database`);
        throw new Error(`Jurisdiction not found: ${row.jurisdiction_name}, ${row.state_name}`);
    }

    private async getOrCreateAgency(row: CSVRow, jurisdictionId: string): Promise<Agency> {
        const key = `${jurisdictionId}|${row.agency_name}`;

        if (this.agencies.has(key)) {
            return this.agencies.get(key)!;
        }

        // Check if agency exists in database
        const { data: existingAgency, error: searchError } = await this.supabase
            .from('agencies')
            .select('*')
            .eq('jurisdiction_id', jurisdictionId)
            .eq('name', row.agency_name)
            .single();

        if (existingAgency && !searchError) {
            this.agencies.set(key, existingAgency);
            console.log(`   🏛️  Found existing agency: ${row.agency_name}`);
            return existingAgency;
        }

        // Create new agency
        const agencyData = {
            jurisdiction_id: jurisdictionId,
            name: row.agency_name,
            type: this.determineAgencyType(row.agency_name),
        };

        const { data: newAgency, error: insertError } = await this.supabase
            .from('agencies')
            .insert(agencyData)
            .select()
            .single();

        if (insertError) {
            console.error(`   ❌ Error creating agency: ${insertError.message}`);
            throw insertError;
        }

        this.agencies.set(key, newAgency);
        console.log(`   🏛️  Created agency: ${row.agency_name}`);

        return newAgency;
    }

    private async getOrCreateFeeCategory(row: CSVRow): Promise<FeeCategory> {
        const key = row.category;

        if (this.feeCategories.has(key)) {
            return this.feeCategories.get(key)!;
        }

        // Map CSV categories to existing fee categories
        const categoryMapping: Record<string, { name: string; group: string }> = {
            'Appeal': { name: 'Appeal', group: 'Planning' },
            'Zoning Administration': { name: 'Zoning Review', group: 'Planning' },
            'Alternative Compliance': { name: 'Zoning Review', group: 'Planning' },
            'Subdivision': { name: 'Subdivision', group: 'Planning' },
            'Plan Review': { name: 'Plan Review', group: 'Building' },
            'Stormwater': { name: 'Stormwater', group: 'Infrastructure' },
            'Traffic Impact': { name: 'Traffic Impact', group: 'Infrastructure' },
            'Tree / Urban Forestry': { name: 'Tree / Urban Forestry', group: 'Environmental' },
            'Demolition / Sign': { name: 'Demolition / Sign', group: 'Building' },
            'Zoning Review': { name: 'Zoning Review', group: 'Planning' },
        };

        const mapped = categoryMapping[row.category] || { name: row.category, group: 'Other' };

        // Check if fee category exists in database
        const { data: existingCategory, error: searchError } = await this.supabase
            .from('fee_categories')
            .select('*')
            .eq('name', mapped.name)
            .single();

        if (existingCategory && !searchError) {
            this.feeCategories.set(key, existingCategory);
            console.log(`   📋 Found existing fee category: ${mapped.name} (${mapped.group})`);
            return existingCategory;
        }

        // Create new fee category
        const categoryData = {
            name: mapped.name,
            description: row.description || `${mapped.name} fees`,
            category_group: mapped.group,
            is_active: true,
        };

        const { data: newCategory, error: insertError } = await this.supabase
            .from('fee_categories')
            .insert(categoryData)
            .select()
            .single();

        if (insertError) {
            console.error(`   ❌ Error creating fee category: ${insertError.message}`);
            throw insertError;
        }

        this.feeCategories.set(key, newCategory);
        console.log(`   📋 Created fee category: ${mapped.name} (${mapped.group})`);

        return newCategory;
    }

    private async getOrCreateSource(row: CSVRow): Promise<Source> {
        const key = row.source_url || row.source_title;

        if (this.sources.has(key)) {
            return this.sources.get(key)!;
        }

        // Check if source exists in database
        const { data: existingSource, error: searchError } = await this.supabase
            .from('sources')
            .select('*')
            .eq('url', row.source_url || '')
            .single();

        if (existingSource && !searchError) {
            this.sources.set(key, existingSource);
            console.log(`   📄 Found existing source: ${row.source_title}`);
            return existingSource;
        }

        // Create new source
        const sourceData = {
            title: row.source_title || 'Unknown Source',
            url: row.source_url || '',
            citation: row.legal_citation || '',
            doc_date: this.parseDate(row.source_doc_date),
            retrieved_at: new Date().toISOString(),
        };

        const { data: newSource, error: insertError } = await this.supabase
            .from('sources')
            .insert(sourceData)
            .select()
            .single();

        if (insertError) {
            console.error(`   ❌ Error creating source: ${insertError.message}`);
            throw insertError;
        }

        this.sources.set(key, newSource);
        console.log(`   📄 Created source: ${row.source_title}`);

        return newSource;
    }

    private async createFeeRecord(
        row: CSVRow,
        jurisdictionId: string,
        agencyId: string,
        categoryId: number,
        sourceId: string
    ): Promise<void> {
        const feeData = {
            state_name: row.state_name,
            jurisdiction_name: row.jurisdiction_name,
            agency_name: row.agency_name,
            fee_name: row.fee_name,
            category: row.category,
            description: row.description || null,
            unit_label: row.unit_label || null,
            rate: this.parseRate(row.rate),
            formula: row.formula || null,
            applies_to: row.applies_to || null,
            use_subtype: row.use_subtype || null,
            service_area_name: row.service_area_name || null,
            source_url: row.source_url || null,
            legal_citation: row.legal_citation || null,
            effective_date: this.parseDate(row.effective_date),
            fee_category: row.category, // Map category to fee_category field
        };

        // Insert into fees_stage table (staging)
        const { data: newFee, error: insertError } = await this.supabase
            .from('fees_stage')
            .insert(feeData)
            .select()
            .single();

        if (insertError) {
            console.error(`   ❌ Error creating staged fee: ${insertError.message}`);
            throw insertError;
        }

        console.log(`   💰 Staged fee: ${row.fee_name} - $${feeData.rate || 'N/A'}`);
    }

    private determineAgencyType(agencyName: string): string {
        const name = agencyName.toLowerCase();

        if (name.includes('planning') || name.includes('zoning')) return 'planning';
        if (name.includes('water')) return 'water';
        if (name.includes('sewer') || name.includes('wastewater')) return 'sewer';
        if (name.includes('storm') || name.includes('drainage')) return 'stormwater';
        if (name.includes('transportation') || name.includes('traffic')) return 'transportation';
        if (name.includes('fire')) return 'fire';
        if (name.includes('police') || name.includes('safety')) return 'police';
        if (name.includes('parks') || name.includes('recreation')) return 'parks';
        if (name.includes('school')) return 'schools';
        if (name.includes('building') || name.includes('construction')) return 'building';
        if (name.includes('housing')) return 'housing';
        if (name.includes('utility') || name.includes('electric') || name.includes('gas')) return 'utility';
        if (name.includes('tree') || name.includes('forestry')) return 'parks'; // Map environmental to parks
        if (name.includes('code') || name.includes('enforcement')) return 'other';

        return 'other';
    }

    private getStateFIPS(stateName: string): string {
        const stateFIPS: Record<string, string> = {
            'North Carolina': '37',
            'California': '06',
            'Texas': '48',
            'Florida': '12',
            'New York': '36',
            // Add more states as needed
        };

        return stateFIPS[stateName] || '';
    }

    private parseRate(rateStr: string): number | undefined {
        if (!rateStr || rateStr.trim() === '') return undefined;

        // Remove common currency symbols and parse
        const cleaned = rateStr.replace(/[$,\s]/g, '');
        const parsed = parseFloat(cleaned);

        return isNaN(parsed) ? undefined : parsed;
    }

    private parseDate(dateStr: string): string | null {
        if (!dateStr || dateStr.trim() === '') return null;

        // Handle year-only dates like "2025"
        if (/^\d{4}$/.test(dateStr.trim())) {
            return `${dateStr.trim()}-01-01`; // Convert to January 1st of that year
        }

        // Try to parse as a full date
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
            return null; // Invalid date
        }

        return parsed.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }


    private printSummary(): void {
        console.log('\n📊 Import Summary:');
        console.log(`   Jurisdictions: ${this.jurisdictions.size}`);
        console.log(`   Agencies: ${this.agencies.size}`);
        console.log(`   Fee Categories: ${this.feeCategories.size}`);
        console.log(`   Sources: ${this.sources.size}`);
        console.log('\n📥 Data imported to fees_stage table');
        console.log('💡 Next step: Review staged data, then process to fees table');
    }
}

// Main execution
async function main() {
    const csvFile = process.argv[2];

    if (!csvFile) {
        console.error('❌ Please provide a CSV file path');
        console.log('Usage: tsx lewis-csv-import.ts <csv-file-path>');
        process.exit(1);
    }

    const importer = new LewisCSVImporter();

    try {
        await importer.importCSV(csvFile);
        console.log('\n🎉 Import completed successfully!');
    } catch (error) {
        console.error('\n💥 Import failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { LewisCSVImporter };
