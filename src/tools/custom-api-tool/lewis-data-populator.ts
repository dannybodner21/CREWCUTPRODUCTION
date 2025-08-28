import { createSupabaseAdminClient, executeSupabaseQuery } from './supabase';

// Arizona construction fee data
const arizonaCities = [
    { name: 'Phoenix', county: 'Maricopa', state: 'Arizona', population: 1608139, data_source_url: 'https://www.phoenix.gov/pdd' },
    { name: 'Tucson', county: 'Pima', state: 'Arizona', population: 542629, data_source_url: 'https://www.tucsonaz.gov/planning' },
    { name: 'Mesa', county: 'Maricopa', state: 'Arizona', population: 504258, data_source_url: 'https://www.mesaaz.gov/business/permits' },
    { name: 'Chandler', county: 'Maricopa', state: 'Arizona', population: 275987, data_source_url: 'https://www.chandleraz.gov/business/permits' },
    { name: 'Scottsdale', county: 'Maricopa', state: 'Arizona', population: 241361, data_source_url: 'https://www.scottsdaleaz.gov/planning' },
    { name: 'Gilbert', county: 'Maricopa', state: 'Arizona', population: 267918, data_source_url: 'https://www.gilbertaz.gov/business/permits' },
    { name: 'Glendale', county: 'Maricopa', state: 'Arizona', population: 248325, data_source_url: 'https://www.glendaleaz.com/planning' },
    { name: 'Tempe', county: 'Maricopa', state: 'Arizona', population: 180587, data_source_url: 'https://www.tempe.gov/business/permits' },
    { name: 'Peoria', county: 'Maricopa', state: 'Arizona', population: 190985, data_source_url: 'https://www.peoriaaz.gov/business/permits' },
    { name: 'Surprise', county: 'Maricopa', state: 'Arizona', population: 141664, data_source_url: 'https://www.surpriseaz.gov/business/permits' },
    { name: 'Avondale', county: 'Maricopa', state: 'Arizona', population: 89934, data_source_url: 'https://www.avondaleaz.gov/business/permits' },
    { name: 'Goodyear', county: 'Maricopa', state: 'Arizona', population: 101733, data_source_url: 'https://www.goodyearaz.gov/business/permits' },
    { name: 'Buckeye', county: 'Maricopa', state: 'Arizona', population: 101502, data_source_url: 'https://www.buckeyeaz.gov/business/permits' },
    { name: 'Casa Grande', county: 'Pinal', state: 'Arizona', population: 55653, data_source_url: 'https://www.casagrandeaz.gov/business/permits' },
    { name: 'Maricopa', county: 'Pinal', state: 'Arizona', population: 76408, data_source_url: 'https://www.maricopa-az.gov/business/permits' }
];

const feeCategories = [
    { category_name: 'Building Permit', description: 'Building permit fee for construction projects', fee_type: 'permit', calculation_method: 'per $1000 of project value' },
    { category_name: 'Plan Review', description: 'Plan review and examination fee', fee_type: 'review', calculation_method: 'per $1000 of project value' },
    { category_name: 'Inspection', description: 'Building inspection fee', fee_type: 'inspection', calculation_method: 'flat rate per inspection' },
    { category_name: 'Impact Fee', description: 'Development impact fee for infrastructure', fee_type: 'impact', calculation_method: 'per square foot' },
    { category_name: 'Plan Check', description: 'Plan checking and verification fee', fee_type: 'review', calculation_method: 'per $1000 of project value' },
    { category_name: 'Certificate of Occupancy', description: 'Certificate of occupancy fee', fee_type: 'permit', calculation_method: 'flat rate' },
    { category_name: 'Demolition Permit', description: 'Demolition permit fee', fee_type: 'permit', calculation_method: 'flat rate' },
    { category_name: 'Electrical Permit', description: 'Electrical work permit fee', fee_type: 'permit', calculation_method: 'per $1000 of project value' },
    { category_name: 'Plumbing Permit', description: 'Plumbing work permit fee', fee_type: 'permit', calculation_method: 'per $1000 of project value' },
    { category_name: 'Mechanical Permit', description: 'Mechanical work permit fee', fee_type: 'permit', calculation_method: 'per $1000 of project value' }
];

// Sample fee data for Phoenix (city_id: 1)
const phoenixFees = [
    { city_id: 1, fee_category_id: 1, fee_amount: 0.50, fee_unit: 'per $1000', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 1, fee_category_id: 1, fee_amount: 0.75, fee_unit: 'per $1000', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 1, fee_category_id: 2, fee_amount: 0.25, fee_unit: 'per $1000', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 1, fee_category_id: 2, fee_amount: 0.35, fee_unit: 'per $1000', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 1, fee_category_id: 3, fee_amount: 150, fee_unit: 'flat rate', development_type: 'all', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 1, fee_category_id: 4, fee_amount: 2.50, fee_unit: 'per sq ft', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 1, fee_category_id: 4, fee_amount: 3.00, fee_unit: 'per sq ft', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' }
];

// Sample fee data for Tucson (city_id: 2)
const tucsonFees = [
    { city_id: 2, fee_category_id: 1, fee_amount: 0.45, fee_unit: 'per $1000', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 2, fee_category_id: 1, fee_amount: 0.65, fee_unit: 'per $1000', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 2, fee_category_id: 2, fee_amount: 0.20, fee_unit: 'per $1000', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 2, fee_category_id: 2, fee_amount: 0.30, fee_unit: 'per $1000', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 2, fee_category_id: 3, fee_amount: 125, fee_unit: 'flat rate', development_type: 'all', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 2, fee_category_id: 4, fee_amount: 2.00, fee_unit: 'per sq ft', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 2, fee_category_id: 4, fee_amount: 2.50, fee_unit: 'per sq ft', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' }
];

// Sample fee data for Mesa (city_id: 3)
const mesaFees = [
    { city_id: 3, fee_category_id: 1, fee_amount: 0.55, fee_unit: 'per $1000', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 3, fee_category_id: 1, fee_amount: 0.80, fee_unit: 'per $1000', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 3, fee_category_id: 2, fee_amount: 0.30, fee_unit: 'per $1000', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 3, fee_category_id: 2, fee_amount: 0.40, fee_unit: 'per $1000', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 3, fee_category_id: 3, fee_amount: 175, fee_unit: 'flat rate', development_type: 'all', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 3, fee_category_id: 4, fee_amount: 3.00, fee_unit: 'per sq ft', development_type: 'residential', project_size_tier: 'all', verification_status: 'verified' },
    { city_id: 3, fee_category_id: 4, fee_amount: 3.50, fee_unit: 'per sq ft', development_type: 'commercial', project_size_tier: 'all', verification_status: 'verified' }
];

export class LewisDataPopulator {
    private adminClient = createSupabaseAdminClient();

    async populateCities() {
        console.log('🌆 Populating cities table...');

        for (const city of arizonaCities) {
            try {
                const { data, error } = await this.adminClient
                    .from('cities')
                    .insert({
                        name: city.name,
                        county: city.county,
                        state: city.state,
                        population: city.population,
                        data_source_url: city.data_source_url,
                        last_updated: new Date().toISOString().split('T')[0]
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`❌ Error inserting city ${city.name}:`, error);
                } else {
                    console.log(`✅ Inserted city: ${city.name} (ID: ${data.id})`);
                }
            } catch (err) {
                console.error(`❌ Exception inserting city ${city.name}:`, err);
            }
        }
    }

    async populateFeeCategories() {
        console.log('🏷️ Populating fee categories table...');

        for (const category of feeCategories) {
            try {
                const { data, error } = await this.adminClient
                    .from('webhound_fee_categories')
                    .insert({
                        category_name: category.category_name,
                        description: category.description,
                        fee_type: category.fee_type,
                        calculation_method: category.calculation_method,
                        effective_date: new Date().toISOString().split('T')[0]
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`❌ Error inserting category ${category.category_name}:`, error);
                } else {
                    console.log(`✅ Inserted category: ${category.category_name} (ID: ${data.id})`);
                }
            } catch (err) {
                console.error(`❌ Exception inserting category ${category.category_name}:`, err);
            }
        }
    }

    async populateFees() {
        console.log('💰 Populating fees table...');

        const allFees = [...phoenixFees, ...tucsonFees, ...mesaFees];

        for (const fee of allFees) {
            try {
                const { data, error } = await this.adminClient
                    .from('verified_fee_data')
                    .insert({
                        city_id: fee.city_id,
                        fee_category_id: fee.fee_category_id,
                        fee_amount: fee.fee_amount,
                        fee_unit: fee.fee_unit,
                        development_type: fee.development_type,
                        project_size_tier: fee.project_size_tier,
                        verification_status: fee.verification_status,
                        effective_date: new Date().toISOString().split('T')[0]
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`❌ Error inserting fee for city ${fee.city_id}, category ${fee.fee_category_id}:`, error);
                } else {
                    console.log(`✅ Inserted fee: City ${fee.city_id}, Category ${fee.fee_category_id} (ID: ${data.id})`);
                }
            } catch (err) {
                console.error(`❌ Exception inserting fee for city ${fee.city_id}, category ${fee.fee_category_id}:`, err);
            }
        }
    }

    async populateAllData() {
        console.log('🚀 Starting Lewis data population...');

        try {
            await this.populateCities();
            await this.populateFeeCategories();
            await this.populateFees();

            console.log('✅ Lewis data population completed successfully!');
        } catch (err) {
            console.error('❌ Error during data population:', err);
        }
    }

    async clearAllData() {
        console.log('🧹 Clearing all Lewis data...');

        try {
            // Clear in reverse order due to foreign key constraints
            await this.adminClient.from('detailed_fee_breakdown').delete().neq('id', 0);
            await this.adminClient.from('verified_fee_data').delete().neq('id', 0);
            await this.adminClient.from('webhound_fee_categories').delete().neq('id', 0);
            await this.adminClient.from('cities').delete().neq('id', 0);

            console.log('✅ All Lewis data cleared successfully!');
        } catch (err) {
            console.error('❌ Error clearing data:', err);
        }
    }
}

// Export singleton instance
export const lewisDataPopulator = new LewisDataPopulator();
