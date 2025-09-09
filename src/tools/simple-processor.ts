import { config } from 'dotenv';
import { resolve } from 'path';
import { createSupabaseAdminClient } from './custom-api-tool/supabase';

config({ path: resolve(process.cwd(), '.env.local') });

interface StagedFee {
    state_name: string;
    jurisdiction_name: string;
    agency_name: string;
    fee_name: string;
    category: string;
    description?: string;
    unit_label?: string;
    rate?: number;
    formula?: string;
    applies_to?: string;
    use_subtype?: string;
    service_area_name?: string;
    source_url?: string;
    legal_citation?: string;
    effective_date?: string;
    fee_category?: string;
    source_doc_date?: string;
}

class SimpleProcessor {
    private supabase = createSupabaseAdminClient();
    private jurisdictionId: string | null = null;
    private agencyMap = new Map<string, string>();
    private categoryMap = new Map<string, number>();

    async processStagedFees(jurisdictionName?: string): Promise<void> {
        console.log('🔄 Simple processing: Remove true duplicates, import all unique fees...\n');

        try {
            // Get jurisdiction (default to Charlotte city for backward compatibility)
            await this.getJurisdiction(jurisdictionName || 'Charlotte city');

            // Load existing agencies and categories
            await this.loadMappings();

            // Get all staged fees for the jurisdiction
            let stagedFeesQuery = this.supabase
                .from('fees_stage')
                .select('*')
                .eq('jurisdiction_name', jurisdictionName || 'Charlotte city');

            // Handle flexible matching for El Paso
            if (jurisdictionName === 'El Paso city') {
                stagedFeesQuery = this.supabase
                    .from('fees_stage')
                    .select('*')
                    .eq('jurisdiction_name', 'El Paso');
            }

            // Handle flexible matching for Nashville-Davidson
            if (jurisdictionName === 'Nashville-Davidson metropolitan government (balance)') {
                stagedFeesQuery = this.supabase
                    .from('fees_stage')
                    .select('*')
                    .eq('jurisdiction_name', 'Nashville–Davidson (Metro)');
            }

            // Handle flexible matching for Washington D.C.
            if (jurisdictionName === 'Washington city') {
                stagedFeesQuery = this.supabase
                    .from('fees_stage')
                    .select('*')
                    .eq('jurisdiction_name', 'Washington, D.C.');
            }

            // Handle flexible matching for New York city
            if (jurisdictionName === 'New York city') {
                stagedFeesQuery = this.supabase
                    .from('fees_stage')
                    .select('*')
                    .eq('jurisdiction_name', 'City of New York');
            }

            // Handle flexible matching for Chesapeake city
            if (jurisdictionName === 'Chesapeake city') {
                stagedFeesQuery = this.supabase
                    .from('fees_stage')
                    .select('*')
                    .eq('jurisdiction_name', 'Chesapeake');
            }

            const { data: stagedFees, error: fetchError } = await stagedFeesQuery;

            if (fetchError) {
                console.error('❌ Error fetching staged fees:', fetchError);
                return;
            }

            if (!stagedFees || stagedFees.length === 0) {
                console.log(`❌ No staged fees found for ${jurisdictionName || 'Charlotte city'}`);
                return;
            }

            console.log(`📊 Found ${stagedFees.length} staged fees`);

            // Remove true duplicates (same name + description + effective_date)
            const uniqueFees = this.removeTrueDuplicates(stagedFees);
            console.log(`📊 After removing duplicates: ${uniqueFees.length} unique fees`);

            // Import all unique fees
            let successCount = 0;
            let errorCount = 0;

            for (const fee of uniqueFees) {
                try {
                    await this.processFee(fee);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Error processing fee "${fee.fee_name}":`, error);
                    errorCount++;
                }
            }

            console.log(`\n📊 Final Summary:`);
            console.log(`   ✅ Successfully processed: ${successCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            console.log(`   📊 Total unique fees: ${uniqueFees.length}`);

        } catch (error) {
            console.error('❌ Error in processStagedFees:', error);
        }
    }

    private removeTrueDuplicates(fees: StagedFee[]): StagedFee[] {
        const seen = new Set<string>();
        const uniqueFees: StagedFee[] = [];

        for (const fee of fees) {
            // Create key: name + description + effective_date
            const key = `${fee.fee_name}|${fee.description || ''}|${fee.effective_date || ''}`;

            if (!seen.has(key)) {
                seen.add(key);
                uniqueFees.push(fee);
            } else {
                console.log(`   ⏭️  Skipping duplicate: ${fee.fee_name} (${fee.effective_date})`);
            }
        }

        return uniqueFees;
    }

    private async getJurisdiction(jurisdictionName: string): Promise<void> {
        console.log(`🔍 Finding ${jurisdictionName} jurisdiction...`);

        // For Stockton city, we know it's in California (FIPS 06)
        let query = this.supabase
            .from('jurisdictions')
            .select('id, name, state_fips')
            .eq('name', jurisdictionName);

        // Add state filter for specific jurisdictions
        if (jurisdictionName === 'Stockton city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Charlotte city') {
            query = query.eq('state_fips', '37');
        } else if (jurisdictionName === 'Honolulu city and county') {
            query = query.eq('state_fips', '15');
        } else if (jurisdictionName === 'Henderson city') {
            query = query.eq('state_fips', '32');
        } else if (jurisdictionName === 'Bakersfield') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Aurora city') {
            query = query.eq('state_fips', '08');
        } else if (jurisdictionName === 'Tulsa city') {
            query = query.eq('state_fips', '40');
        } else if (jurisdictionName === 'Tampa city') {
            query = query.eq('state_fips', '12');
        } else if (jurisdictionName === 'Minneapolis city') {
            query = query.eq('state_fips', '27');
        } else if (jurisdictionName === 'Long Beach city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Omaha city') {
            query = query.eq('state_fips', '31');
        } else if (jurisdictionName === 'Raleigh city') {
            query = query.eq('state_fips', '37');
        } else if (jurisdictionName === 'Miami city') {
            query = query.eq('state_fips', '12');
        } else if (jurisdictionName === 'Kansas City city') {
            query = query.eq('state_fips', '29');
        } else if (jurisdictionName === 'Louisville/Jefferson County metro government (balance)') {
            query = query.eq('state_fips', '21');
        } else if (jurisdictionName === 'Albuquerque city') {
            query = query.eq('state_fips', '35');
        } else if (jurisdictionName === 'Indianapolis city (balance)') {
            query = query.eq('state_fips', '18');
        } else if (jurisdictionName === 'Las Vegas city') {
            query = query.eq('state_fips', '32');
        } else if (jurisdictionName === 'Portland city') {
            query = query.eq('state_fips', '41');
        } else if (jurisdictionName === 'Boston city') {
            query = query.eq('state_fips', '25');
        } else if (jurisdictionName === 'El Paso city') {
            query = query.eq('state_fips', '48');
        } else if (jurisdictionName === 'Oklahoma City city') {
            query = query.eq('state_fips', '40');
        } else if (jurisdictionName === 'Nashville-Davidson metropolitan government (balance)') {
            query = query.eq('state_fips', '47');
        } else if (jurisdictionName === 'Washington city') {
            query = query.eq('state_fips', '11');
        } else if (jurisdictionName === 'Jacksonville city') {
            query = query.eq('state_fips', '12');
        } else if (jurisdictionName === 'Denver city') {
            query = query.eq('state_fips', '08');
        } else if (jurisdictionName === 'Seattle city') {
            query = query.eq('state_fips', '53');
        } else if (jurisdictionName === 'San Francisco city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Columbus city') {
            query = query.eq('state_fips', '39');
        } else if (jurisdictionName === 'Fort Worth city') {
            query = query.eq('state_fips', '48');
        } else if (jurisdictionName === 'Austin city') {
            query = query.eq('state_fips', '48');
        } else if (jurisdictionName === 'San Jose city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Dallas city') {
            query = query.eq('state_fips', '48');
        } else if (jurisdictionName === 'San Diego city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'San Antonio city') {
            query = query.eq('state_fips', '48');
        } else if (jurisdictionName === 'Philadelphia city') {
            query = query.eq('state_fips', '42');
        } else if (jurisdictionName === 'Houston city') {
            query = query.eq('state_fips', '48');
        } else if (jurisdictionName === 'Los Angeles city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Chicago city') {
            query = query.eq('state_fips', '17');
        } else if (jurisdictionName === 'New York city') {
            query = query.eq('state_fips', '36');
        } else if (jurisdictionName === 'Chandler city') {
            query = query.eq('state_fips', '04');
        } else if (jurisdictionName === 'Phoenix city') {
            query = query.eq('state_fips', '04');
        } else if (jurisdictionName === 'Scottsdale city') {
            query = query.eq('state_fips', '04');
        } else if (jurisdictionName === 'Tucson city') {
            query = query.eq('state_fips', '04');
        } else if (jurisdictionName === 'Akron city') {
            query = query.eq('state_fips', '39');
        } else if (jurisdictionName === 'Arlington County') {
            query = query.eq('state_fips', '51');
        } else if (jurisdictionName === 'Louisiana state') {
            query = query.eq('state_fips', '22');
        } else if (jurisdictionName === 'Birmingham city') {
            query = query.eq('state_fips', '01');
        } else if (jurisdictionName === 'Chesapeake city') {
            query = query.eq('state_fips', '51');
        } else if (jurisdictionName === 'Chula Vista city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Buffalo city') {
            query = query.eq('state_fips', '36');
        } else if (jurisdictionName === 'Fremont city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Boise city') {
            query = query.eq('state_fips', '16');
        } else if (jurisdictionName === 'Rochester city') {
            query = query.eq('state_fips', '36');
        } else if (jurisdictionName === 'Des Moines city') {
            query = query.eq('state_fips', '19');
        } else if (jurisdictionName === 'Fort Lauderdale city') {
            query = query.eq('state_fips', '12');
        } else if (jurisdictionName === 'Garland city') {
            query = query.eq('state_fips', '48');
        } else if (jurisdictionName === 'Gilbert town') {
            query = query.eq('state_fips', '04');
        } else if (jurisdictionName === 'Glendale city') {
            query = query.eq('state_fips', '04');
        } else if (jurisdictionName === 'Grand Rapids city') {
            query = query.eq('state_fips', '26');
        } else if (jurisdictionName === 'Jersey City') {
            query = query.eq('state_fips', '34');
        } else if (jurisdictionName === 'Little Rock city') {
            query = query.eq('state_fips', '05');
        } else if (jurisdictionName === 'Modesto city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'New Orleans city') {
            query = query.eq('state_fips', '22');
        } else if (jurisdictionName === 'Norfolk') {
            query = query.eq('state_fips', '51');
        } else if (jurisdictionName === 'North Las Vegas city') {
            query = query.eq('state_fips', '32');
        } else if (jurisdictionName === 'Orlando city') {
            query = query.eq('state_fips', '12');
        } else if (jurisdictionName === 'Oxnard city') {
            query = query.eq('state_fips', '06');
        } else if (jurisdictionName === 'Providence city') {
            query = query.eq('state_fips', '44');
        } else if (jurisdictionName === 'Salt Lake City') {
            query = query.eq('state_fips', '49');
        } else if (jurisdictionName === 'Spokane city') {
            query = query.eq('state_fips', '53');
        } else if (jurisdictionName === 'St. Petersburg city') {
            query = query.eq('state_fips', '12');
        } else if (jurisdictionName === 'Toledo city') {
            query = query.eq('state_fips', '39');
        } else if (jurisdictionName === 'Yonkers city') {
            query = query.eq('state_fips', '36');
        }

        let { data: jurisdiction, error } = await query.single();

        // If no exact match, try flexible matching for known cases
        if (error && jurisdictionName === 'Honolulu city and county') {
            const { data: honoluluMatch, error: honoluluError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Honolulu County')
                .eq('state_fips', '15')
                .single();

            if (honoluluMatch && !honoluluError) {
                jurisdiction = honoluluMatch;
                error = null;
            }
        }

        // Flexible matching for Bakersfield
        if (error && jurisdictionName === 'Bakersfield') {
            const { data: bakersfieldMatch, error: bakersfieldError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Bakersfield city')
                .or('state_fips.eq.06,state_fips.eq.6')
                .single();

            if (bakersfieldMatch && !bakersfieldError) {
                jurisdiction = bakersfieldMatch;
                error = null;
            }
        }

        // Flexible matching for Aurora
        if (error && jurisdictionName === 'Aurora city') {
            const { data: auroraMatch, error: auroraError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Aurora city')
                .or('state_fips.eq.08,state_fips.eq.8')
                .single();

            if (auroraMatch && !auroraError) {
                jurisdiction = auroraMatch;
                error = null;
            }
        }

        // Flexible matching for Louisville Metro
        if (error && jurisdictionName === 'Louisville Metro') {
            const { data: louisvilleMatch, error: louisvilleError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Louisville/Jefferson County metro government (balance)')
                .eq('state_fips', '21')
                .single();

            if (louisvilleMatch && !louisvilleError) {
                jurisdiction = louisvilleMatch;
                error = null;
            }
        }

        // Flexible matching for Indianapolis city
        if (error && jurisdictionName === 'Indianapolis city') {
            const { data: indianapolisMatch, error: indianapolisError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Indianapolis city (balance)')
                .eq('state_fips', '18')
                .single();

            if (indianapolisMatch && !indianapolisError) {
                jurisdiction = indianapolisMatch;
                error = null;
            }
        }

        // Flexible matching for Louisiana state
        if (error && jurisdictionName === 'Louisiana state') {
            const { data: louisianaMatch, error: louisianaError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Louisiana')
                .eq('state_fips', '22')
                .single();

            if (louisianaMatch && !louisianaError) {
                jurisdiction = louisianaMatch;
                error = null;
            }
        }

        // Flexible matching for Chesapeake
        if (error && jurisdictionName === 'Chesapeake city') {
            const { data: chesapeakeMatch, error: chesapeakeError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Chesapeake city')
                .eq('type', 'municipality')
                .eq('state_fips', '51')
                .single();

            if (chesapeakeMatch && !chesapeakeError) {
                jurisdiction = chesapeakeMatch;
                error = null;
            }
        }

        // Flexible matching for Jersey City
        if (error && jurisdictionName === 'Jersey City') {
            const { data: jerseyCityMatch, error: jerseyCityError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Jersey City city')
                .eq('type', 'municipality')
                .eq('state_fips', '34')
                .single();

            if (jerseyCityMatch && !jerseyCityError) {
                jurisdiction = jerseyCityMatch;
                error = null;
            }
        }

        // Flexible matching for Norfolk
        if (error && jurisdictionName === 'Norfolk') {
            const { data: norfolkMatch, error: norfolkError } = await this.supabase
                .from('jurisdictions')
                .select('id, name, state_fips')
                .eq('name', 'Norfolk city')
                .eq('type', 'municipality')
                .eq('state_fips', '51')
                .single();

            if (norfolkMatch && !norfolkError) {
                jurisdiction = norfolkMatch;
                error = null;
            }
        }

        if (error || !jurisdiction) {
            console.error(`❌ ${jurisdictionName} jurisdiction not found:`, error);
            throw new Error(`${jurisdictionName} jurisdiction not found`);
        }

        this.jurisdictionId = jurisdiction.id;
        console.log(`✅ Found ${jurisdictionName}: ${jurisdiction.id}`);
    }

    private async loadMappings(): Promise<void> {
        console.log('📋 Loading existing agencies and categories...');

        if (!this.jurisdictionId) {
            throw new Error('Jurisdiction ID not set');
        }

        // Load existing agencies for Charlotte city
        const { data: agencies } = await this.supabase
            .from('agencies')
            .select('id, name')
            .eq('jurisdiction_id', this.jurisdictionId);

        agencies?.forEach(agency => {
            this.agencyMap.set(agency.name, agency.id);
        });

        // Load fee categories
        const { data: categories } = await this.supabase
            .from('fee_categories')
            .select('id, name');

        categories?.forEach(category => {
            this.categoryMap.set(category.name, category.id);
        });

        console.log(`   🏢 Existing agencies: ${this.agencyMap.size}`);
        console.log(`   📋 Existing categories: ${this.categoryMap.size}`);
    }

    private async processFee(stagedFee: StagedFee): Promise<void> {
        if (!this.jurisdictionId) {
            throw new Error('Jurisdiction ID not set');
        }

        // Get or create agency
        const agencyId = await this.getOrCreateAgency(stagedFee.agency_name);

        // Get or create fee category
        const categoryId = await this.getOrCreateFeeCategory(stagedFee.category);

        // Map category to fee_basis enum
        const feeBasis = this.mapCategoryToFeeBasis(stagedFee.category);

        // Map applies_to to project_use enum
        const projectUse = this.mapAppliesToToProjectUse(stagedFee.applies_to);

        // Create the fee record
        const feeData = {
            jurisdiction_id: this.jurisdictionId,
            agency_id: agencyId,
            name: stagedFee.fee_name,
            description: stagedFee.description || null,
            applies_to: projectUse,
            use_subtype: stagedFee.use_subtype || null,
            unit_label: stagedFee.unit_label || null,
            rate: stagedFee.rate || null,
            formula: stagedFee.formula || null,
            source_url: stagedFee.source_url || null,
            legal_citation: stagedFee.legal_citation || null,
            effective_date: stagedFee.effective_date || null,
            category: feeBasis,
            category_id: categoryId,
            active: true
        };

        const { data: newFee, error: insertError } = await this.supabase
            .from('fees')
            .insert(feeData)
            .select()
            .single();

        if (insertError) {
            console.error(`   ❌ Error creating fee: ${insertError.message}`);
            throw insertError;
        }

        console.log(`   💰 Created fee: ${stagedFee.fee_name} - $${feeData.rate || 'N/A'}`);
    }

    private async getOrCreateAgency(agencyName: string): Promise<string> {
        if (this.agencyMap.has(agencyName)) {
            return this.agencyMap.get(agencyName)!;
        }

        console.log(`   🏢 Creating agency: ${agencyName}`);

        const agencyType = this.determineAgencyType(agencyName);

        const { data: newAgency, error } = await this.supabase
            .from('agencies')
            .insert({
                jurisdiction_id: this.jurisdictionId!,
                name: agencyName,
                type: agencyType,
                description: `Agency for Charlotte city`,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error(`   ❌ Error creating agency: ${error.message}`);
            throw error;
        }

        this.agencyMap.set(agencyName, newAgency.id);
        return newAgency.id;
    }

    private async getOrCreateFeeCategory(categoryName: string): Promise<number> {
        if (this.categoryMap.has(categoryName)) {
            return this.categoryMap.get(categoryName)!;
        }

        console.log(`   📋 Creating category: ${categoryName}`);

        const { data: newCategory, error } = await this.supabase
            .from('fee_categories')
            .insert({
                name: categoryName,
                description: `Category for ${categoryName}`,
                category_group: 'Building',
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error(`   ❌ Error creating category: ${error.message}`);
            throw error;
        }

        this.categoryMap.set(categoryName, newCategory.id);
        return newCategory.id;
    }

    private determineAgencyType(agencyName: string): string {
        const name = agencyName.toLowerCase();

        if (name.includes('water') || name.includes('sewer') || name.includes('wastewater')) return 'water';
        if (name.includes('storm') || name.includes('drainage')) return 'stormwater';
        if (name.includes('transportation') || name.includes('dot') || name.includes('traffic') || name.includes('row')) return 'transportation';
        if (name.includes('park') || name.includes('forestry') || name.includes('tree')) return 'parks';
        if (name.includes('school')) return 'schools';
        if (name.includes('fire')) return 'fire';
        if (name.includes('police')) return 'police';
        if (name.includes('planning') || name.includes('zoning') || name.includes('development')) return 'planning';
        if (name.includes('building') || name.includes('construction') || name.includes('permit')) return 'building';
        if (name.includes('housing')) return 'housing';
        if (name.includes('utility')) return 'utility';
        if (name.includes('code enforcement') || name.includes('luesa')) return 'other';

        return 'other';
    }

    private mapCategoryToFeeBasis(category: string): string {
        const cat = category.toLowerCase();

        if (cat.includes('flat') || cat.includes('fixed')) return 'flat';
        if (cat.includes('per unit') || cat.includes('per_unit')) return 'per_unit';
        if (cat.includes('per sqft') || cat.includes('per_sqft') || cat.includes('square foot')) return 'per_sqft';
        if (cat.includes('per meter') || cat.includes('per_meter')) return 'per_meter_size';
        if (cat.includes('per trip') || cat.includes('per_trip')) return 'per_trip';
        if (cat.includes('tiered') || cat.includes('tier')) return 'tiered';
        if (cat.includes('formula') || cat.includes('calculation')) return 'formula';

        return 'flat';
    }

    private mapAppliesToToProjectUse(appliesTo?: string): string | undefined {
        if (!appliesTo) return undefined;

        const apply = appliesTo.toLowerCase();

        if (apply.includes('residential') || apply.includes('single family') || apply.includes('multifamily')) return 'residential';
        if (apply.includes('commercial') || apply.includes('business')) return 'commercial';
        if (apply.includes('industrial')) return 'industrial';
        if (apply.includes('mixed use') || apply.includes('mixed-use')) return 'mixed_use';

        return 'other';
    }
}

async function main() {
    const processor = new SimpleProcessor();
    const jurisdictionName = process.argv[2] || 'Charlotte city';
    await processor.processStagedFees(jurisdictionName);
}

main().catch(console.error);
