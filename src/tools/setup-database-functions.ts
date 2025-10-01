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
  WHERE f.active = true
    AND (f.applies_to IS NULL OR f.applies_to::text = p_use)
    AND (f.use_subtype IS NULL OR f.use_subtype = p_use_subtype OR p_use_subtype IS NULL)
),
-- Calculate amounts for each eligible fee
calculated AS (
  SELECT
    fee_id,
    agency,
    fee,
    category,
    rate,
    unit_label,
    applies_to,
    use_subtype,
    CASE
      WHEN category = 'flat' THEN COALESCE(rate, 0)
      WHEN category = 'per_sqft' THEN COALESCE(rate, 0) * p_res_sqft
      WHEN category = 'per_unit' THEN COALESCE(rate, 0) * p_dwellings
      WHEN category = 'per_trip' THEN COALESCE(rate, 0) * p_trips
      WHEN category = 'formula' THEN 0  -- Defer to rules
      ELSE 0
    END AS amount
  FROM eligible
),
-- Group by agency for subtotals
agency_totals AS (
  SELECT
    agency,
    SUM(amount) AS subtotal
  FROM calculated
  WHERE amount > 0
  GROUP BY agency
),
-- Line items for detailed breakdown
line_items AS (
  SELECT
    agency,
    fee,
    category,
    rate,
    unit_label,
    CASE
      WHEN category = 'per_sqft' THEN p_res_sqft
      WHEN category = 'per_unit' THEN p_dwellings
      WHEN category = 'per_trip' THEN p_trips
      ELSE 1
    END AS qty,
    amount
  FROM calculated
  WHERE amount > 0
),
-- Fees that need rules (formula-based or complex)
needs_rules AS (
  SELECT
    agency,
    fee,
    category,
    rate,
    unit_label
  FROM eligible
  WHERE category = 'formula' OR rate IS NULL
)
SELECT json_build_object(
  'grand_total', COALESCE((SELECT SUM(subtotal) FROM agency_totals), 0),
  'by_agency', COALESCE(
    (SELECT json_agg(json_build_object('agency', agency, 'subtotal', subtotal)) FROM agency_totals),
    '[]'::json
  ),
  'line_items', COALESCE(
    (SELECT json_agg(json_build_object(
      'agency', agency,
      'fee', fee,
      'method', category,
      'rate', rate,
      'unit', unit_label,
      'qty', qty,
      'amount', amount
    )) FROM line_items),
    '[]'::json
  ),
  'needs_rules', COALESCE(
    (SELECT json_agg(json_build_object(
      'agency', agency,
      'fee', fee,
      'method', category,
      'rate', rate,
      'unit', unit_label
    )) FROM needs_rules),
    '[]'::json
  )
);
$$;
`;

const EXECUTE_SQL_FUNCTION = `
CREATE OR REPLACE FUNCTION execute_sql(query text, params text[] DEFAULT '{}')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Execute the query with parameters
  EXECUTE query INTO result USING params;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;
`;

async function setupDatabaseFunctions() {
    console.log('🚀 Setting up database functions...');

    const supabase = createSupabaseClient();

    try {
        // First, create the execute_sql function
        console.log('📝 Creating execute_sql function...');
        const { error: executeSqlError } = await supabase.rpc('exec', {
            sql: EXECUTE_SQL_FUNCTION
        });

        if (executeSqlError) {
            console.error('❌ Error creating execute_sql function:', executeSqlError);
            return;
        }

        console.log('✅ execute_sql function created successfully');

        // Then create the calc_project_fees function
        console.log('📝 Creating calc_project_fees function...');
        const { error: calcFeesError } = await supabase.rpc('exec', {
            sql: CALC_PROJECT_FEES_FUNCTION
        });

        if (calcFeesError) {
            console.error('❌ Error creating calc_project_fees function:', calcFeesError);
            return;
        }

        console.log('✅ calc_project_fees function created successfully');

        // Test the functions
        console.log('🧪 Testing functions...');

        // Test execute_sql function
        const { data: testData, error: testError } = await supabase.rpc('execute_sql', {
            query: 'SELECT 1 as test',
            params: []
        });

        if (testError) {
            console.error('❌ Error testing execute_sql:', testError);
        } else {
            console.log('✅ execute_sql test passed:', testData);
        }

        console.log('🎉 Database functions setup completed successfully!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. The fee calculator should now work with the new SQL functions');
        console.log('2. Test the calculator in the Lewis Construction Portal');
        console.log('3. Check the browser console for any remaining errors');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the setup
setupDatabaseFunctions().catch(console.error);
