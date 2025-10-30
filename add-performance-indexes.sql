-- Performance Indexes for LEWIS API
-- Run this in Supabase SQL editor to improve query performance and reduce 504 timeouts

-- Index for filtering active fees by jurisdiction
CREATE INDEX IF NOT EXISTS idx_fees_jurisdiction_active
ON fees(jurisdiction_id, is_active)
WHERE is_active = true;

-- Index for service area filtering
CREATE INDEX IF NOT EXISTS idx_fees_service_area
ON fees(service_area_id);

-- Index for fee calculations lookup
CREATE INDEX IF NOT EXISTS idx_fee_calcs_fee_id
ON fee_calculations(fee_id);

-- Index for jurisdiction lookups by name and state
CREATE INDEX IF NOT EXISTS idx_jurisdictions_name_state
ON jurisdictions(jurisdiction_name, state_code);

-- Index for service areas by jurisdiction
CREATE INDEX IF NOT EXISTS idx_service_areas_jurisdiction
ON service_areas(jurisdiction_id);

-- Analyze tables to update query planner statistics
ANALYZE fees;
ANALYZE fee_calculations;
ANALYZE jurisdictions;
ANALYZE service_areas;

-- Verify indexes were created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('fees', 'fee_calculations', 'jurisdictions', 'service_areas')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
