import { config } from 'dotenv';
import { resolve } from 'path';
import { createSupabaseClient } from './supabase';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function checkTableStructure() {
    console.log('🔍 Checking actual table structure in database...\n');

    try {
        const supabase = createSupabaseClient();

        // Check webhound_fee_categories table
        console.log('1️⃣ Checking webhound_fee_categories table...');
        const { data: categories, error: categoriesError } = await supabase
            .from('webhound_fee_categories')
            .select('*')
            .limit(3);

        if (categoriesError) {
            console.log(`   ❌ Error: ${categoriesError.message}`);
        } else {
            console.log(`   ✅ Found ${categories?.length || 0} categories`);
            if (categories && categories.length > 0) {
                console.log(`   📋 Sample category:`, categories[0]);
            }
        }

        // Check verified_fee_data table
        console.log('\n2️⃣ Checking verified_fee_data table...');
        const { data: fees, error: feesError } = await supabase
            .from('verified_fee_data')
            .select('*')
            .limit(3);

        if (feesError) {
            console.log(`   ❌ Error: ${feesError.message}`);
        } else {
            console.log(`   ✅ Found ${fees?.length || 0} fee records`);
            if (fees && fees.length > 0) {
                console.log(`   💰 Sample fee:`, fees[0]);
            }
        }

        // Check cities table
        console.log('\n3️⃣ Checking cities table...');
        const { data: cities, error: citiesError } = await supabase
            .from('cities')
            .select('*')
            .limit(3);

        if (citiesError) {
            console.log(`   ❌ Error: ${citiesError.message}`);
        } else {
            console.log(`   ✅ Found ${cities?.length || 0} cities`);
            if (cities && cities.length > 0) {
                console.log(`   🏙️  Sample city:`, cities[0]);
            }
        }

        // Check detailed_fee_breakdown table
        console.log('\n4️⃣ Checking detailed_fee_breakdown table...');
        const { data: breakdown, error: breakdownError } = await supabase
            .from('detailed_fee_breakdown')
            .select('*')
            .limit(3);

        if (breakdownError) {
            console.log(`   ❌ Error: ${breakdownError.message}`);
        } else {
            console.log(`   ✅ Found ${breakdown?.length || 0} breakdown records`);
            if (breakdown && breakdown.length > 0) {
                console.log(`   📊 Sample breakdown:`, breakdown[0]);
            }
        }

    } catch (error) {
        console.error('💥 Check failed:', error);
    }
}

checkTableStructure();
