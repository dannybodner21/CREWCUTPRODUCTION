import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function fixAustinSubtypes() {
    console.log('='.repeat(80));
    console.log('🔧 FIXING AUSTIN TRANSPORTATION USER FEE SUBTYPES');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get Austin jurisdiction ID
    const { data: austin } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Austin')
        .eq('state_code', 'TX')
        .single();

    if (!austin) {
        console.log('❌ Austin jurisdiction not found');
        return;
    }

    console.log('✅ Austin jurisdiction ID:', austin.id);

    // Single-Family only fees
    console.log('\n📍 Setting Single-Family subtypes...');
    const singleFamilyFees = [
        'Transportation User Fee - Garage Apartment',
        'Transportation User Fee - Mobile Home'
    ];

    for (const feeName of singleFamilyFees) {
        const { error } = await supabase
            .from('fees')
            .update({ use_subtypes: ['single-family'] })
            .eq('jurisdiction_id', austin.id)
            .eq('name', feeName);

        if (error) {
            console.error(`❌ Error updating ${feeName}:`, error);
        } else {
            console.log(`✅ Updated: ${feeName}`);
        }
    }

    // Small Multi-Family only (2-4 units)
    console.log('\n📍 Setting Small Multi-Family subtypes...');
    const smallMultiFamilyUpdates = [
        { name: 'Transportation User Fee - Duplex', subtype: 'duplex' },
        { name: 'Transportation User Fee - Triplex', subtype: 'triplex' },
        { name: 'Transportation User Fee - Fourplex', subtype: 'fourplex' }
    ];

    for (const update of smallMultiFamilyUpdates) {
        const { error } = await supabase
            .from('fees')
            .update({ use_subtypes: [update.subtype] })
            .eq('jurisdiction_id', austin.id)
            .eq('name', update.name);

        if (error) {
            console.error(`❌ Error updating ${update.name}:`, error);
        } else {
            console.log(`✅ Updated: ${update.name} → [${update.subtype}]`);
        }
    }

    // Regular Multi-Family (5+ units)
    console.log('\n📍 Setting Multi-Family subtypes...');
    const multiFamilyFees = [
        'Transportation User Fee - Townhouse/Condominium'
    ];

    for (const feeName of multiFamilyFees) {
        const { error } = await supabase
            .from('fees')
            .update({ use_subtypes: ['multifamily'] })
            .eq('jurisdiction_id', austin.id)
            .eq('name', feeName);

        if (error) {
            console.error(`❌ Error updating ${feeName}:`, error);
        } else {
            console.log(`✅ Updated: ${feeName}`);
        }
    }

    // Verify changes
    console.log('\n\n📊 VERIFYING CHANGES:');
    console.log('='.repeat(80));

    const { data: transportFees } = await supabase
        .from('fees')
        .select('name, use_subtypes')
        .eq('jurisdiction_id', austin.id)
        .ilike('name', '%Transportation User Fee%')
        .order('name');

    transportFees?.forEach(fee => {
        console.log(`${fee.name}`);
        console.log(`   use_subtypes: ${JSON.stringify(fee.use_subtypes)}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✨ Austin Transportation User Fee subtypes updated');
    console.log('='.repeat(80));
}

fixAustinSubtypes().catch(console.error);
