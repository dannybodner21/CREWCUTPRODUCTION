import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function checkNashvilleServiceAreas() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: nashville } = await supabase
        .from('jurisdictions')
        .select('id, jurisdiction_name')
        .eq('jurisdiction_name', 'Nashville')
        .eq('state_code', 'TN')
        .single();

    console.log('Nashville jurisdiction:', nashville);

    // Get all service areas
    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', nashville!.id);

    console.log('\nService Areas:');
    serviceAreas?.forEach(sa => {
        console.log(`  - ${sa.name} (${sa.id})`);
    });

    // Get all Nashville fees and their service areas
    const { data: fees } = await supabase
        .from('fees')
        .select('id, name, service_area_id, service_areas(name)')
        .eq('jurisdiction_id', nashville!.id)
        .eq('is_active', true);

    console.log(`\nTotal Nashville fees: ${fees?.length}`);

    const citywideFees = fees?.filter(f => !f.service_area_id);
    const serviceAreaFees = fees?.filter(f => f.service_area_id);

    console.log(`\nCitywide fees (service_area_id = null): ${citywideFees?.length}`);
    citywideFees?.forEach(f => {
        console.log(`  - ${f.name}`);
    });

    console.log(`\nService area fees: ${serviceAreaFees?.length}`);
    const grouped = serviceAreaFees?.reduce((acc: any, f: any) => {
        const areaName = f.service_areas?.name || 'Unknown';
        if (!acc[areaName]) acc[areaName] = [];
        acc[areaName].push(f.name);
        return acc;
    }, {});

    Object.entries(grouped || {}).forEach(([area, feeList]: [string, any]) => {
        console.log(`\n  ${area}:`);
        feeList.forEach((name: string) => console.log(`    - ${name}`));
    });
}

checkNashvilleServiceAreas().catch(console.error);
