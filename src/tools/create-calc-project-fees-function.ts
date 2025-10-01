import { createSupabaseClient } from './custom-api-tool/supabase';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const CALC_PROJECT_FEES_FUNCTION = `
CREATE OR REPLACE FUNCTION calc_project_fees(
  p_city         text,
  p_use          text,        -- 'residential' | 'commercial'
  p_use_subtype  text,        -- e.g. 'multifamily' (or NULL)
  p_dwellings    integer,
  p_res_sqft     numeric,
  p_trips        integer DEFAULT 0,
  p_valuation    numeric DEFAULT NULL
) RETURNS json LANGUAGE sql AS
$$
WITH j AS (
  SELECT id
  FROM jurisdictions
  WHERE lower(name) = lower(p_city)
  LIMIT 1
),
-- Latest *published* version per fee in this jurisdiction
latest AS (
  SELECT DISTINCT ON (v.fee_id) v.fee_id
  FROM fee_versions v
  JOIN fees f ON f.id = v.fee_id
  JOIN j ON j.id = f.jurisdiction_id
  WHERE v.status = 'published'
  ORDER BY v.fee_id, v.effective_start DESC NULLS LAST, v.created_at DESC
),
-- Fees eligible for this project (jurisdiction + use + subtype)
eligible AS (
  SELECT
    f.id AS fee_id,
    a.name AS agency,
    f.name AS fee,
    f.category,
    f.rate,
    f.unit_label,
    f.applies_to::text AS applies_to,
    f.use_subtype
  FROM fees f
  JOIN latest l ON l.fee_id = f.id
  JOIN agencies a ON a.id = f.agency_id
  JOIN j ON j.id = f.jurisdiction_id
  WHERE (f.applies_to IS NULL OR f.applies_to::text = p_use)
    AND (f.use_subtype IS NULL OR f.use_subtype = p_use_subtype)
),
-- Calculate amounts
calculated AS (
  SELECT
    fee_id,
    agency,
    fee,
    category,
    unit_label,
    CASE
      WHEN category = 'flat' THEN rate
      WHEN category = 'per_sqft' THEN rate * p_res_sqft
      WHEN category = 'per_unit' THEN rate * p_dwellings
      WHEN category = 'per_trip' THEN rate * p_trips
      WHEN category = 'formula' THEN 0  -- Deferred to rules
      ELSE rate
    END AS amount
  FROM eligible
),
-- Group by agency
agency_totals AS (
  SELECT
    agency,
    SUM(amount) AS subtotal
  FROM calculated
  GROUP BY agency
),
-- Grand total
grand_total AS (
  SELECT SUM(amount) AS total
  FROM calculated
),
-- Fees that need rules (formula category)
needs_rules AS (
  SELECT fee_id, agency, fee, category
  FROM eligible
  WHERE category = 'formula'
)
SELECT json_build_object(
  'grand_total', (SELECT total FROM grand_total),
  'by_agency', (
    SELECT json_agg(
      json_build_object(
        'agency', agency,
        'subtotal', subtotal
      )
    )
    FROM agency_totals
  ),
  'line_items', (
    SELECT json_agg(
      json_build_object(
        'fee_id', fee_id,
        'agency', agency,
        'fee', fee,
        'category', category,
        'unit_label', unit_label,
        'amount', amount
      )
    )
    FROM calculated
    WHERE amount > 0
  ),
  'needs_rules', (
    SELECT json_agg(
      json_build_object(
        'fee_id', fee_id,
        'agency', agency,
        'fee', fee,
        'category', category
      )
    )
    FROM needs_rules
  )
);
$$;
`;

async function createCalcProjectFeesFunction() {
    console.log('🔧 Creating calc_project_fees function in database...\n');

    try {
        const supabase = createSupabaseClient();

        // Execute the function creation
        const { error } = await supabase.rpc('exec_sql', {
            sql: CALC_PROJECT_FEES_FUNCTION
        });

        if (error) {
            console.error('❌ Error creating function:', error);

            // Try alternative approach - direct SQL execution
            console.log('🔄 Trying alternative approach...');

            const { error: directError } = await supabase
                .from('_sql')
                .select('*')
                .eq('query', CALC_PROJECT_FEES_FUNCTION);

            if (directError) {
                console.error('❌ Direct SQL execution also failed:', directError);
                return false;
            }
        }

        console.log('✅ calc_project_fees function created successfully!');

        // Test the function
        console.log('🧪 Testing the function...');
        const { data: testResult, error: testError } = await supabase.rpc('calc_project_fees', {
            p_city: 'Los Angeles',
            p_use: 'residential',
            p_use_subtype: 'multifamily',
            p_dwellings: 100,
            p_res_sqft: 80000,
            p_trips: 200,
            p_valuation: 15000000
        });

        if (testError) {
            console.error('❌ Function test failed:', testError);
            return false;
        }

        console.log('✅ Function test successful!');
        console.log('📊 Test result:', JSON.stringify(testResult, null, 2));

        return true;

    } catch (error) {
        console.error('💥 Error creating function:', error);
        return false;
    }
}

// Run the function
if (require.main === module) {
    createCalcProjectFeesFunction()
        .then(success => {
            if (success) {
                console.log('\n🎉 calc_project_fees function setup complete!');
                process.exit(0);
            } else {
                console.log('\n💥 Function setup failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error);
            process.exit(1);
        });
}

export { createCalcProjectFeesFunction };
