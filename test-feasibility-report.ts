/**
 * Test feasibility report generation
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testFeasibilityReport() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: jurisdictions } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdictions!.id)
        .in('name', ['Inside City', 'Northwest Deer Valley'])
        .order('name');

    const insideCityId = serviceAreas?.find(sa => sa.name === 'Inside City')?.id;
    const northwestDeerValleyId = serviceAreas?.find(sa => sa.name === 'Northwest Deer Valley')?.id;

    const projectInputs: ProjectInputs = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        selectedServiceAreaIds: [insideCityId!, northwestDeerValleyId!],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 25000,
        projectValue: 5000000,
        meterSize: '3/4"'
    };

    const breakdown = await calculator.calculateFees(projectInputs);
    const report = calculator.formatFeasibilityReport(breakdown);

    console.log(report);
}

testFeasibilityReport().catch(console.error);
