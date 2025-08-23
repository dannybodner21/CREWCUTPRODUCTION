import { createSupabaseClient, createSupabaseAdminClient, executeSupabaseQuery } from './supabase';

// Common Supabase operations for the custom API tool
export class SupabaseOperations {
    private client: any = null;
    private adminClient: any = null;

    private getClient() {
        if (!this.client) {
            this.client = createSupabaseClient();
        }
        return this.client;
    }

    private getAdminClient() {
        if (!this.adminClient) {
            this.adminClient = createSupabaseAdminClient();
        }
        return this.adminClient;
    }

    // Get all records from a table
    async getAllRecords(table: string, select = '*', limit = 100) {
        return await executeSupabaseQuery(async () => {
            return await this.getClient()
                .from(table)
                .select(select)
                .limit(limit);
        });
    }

    // Get records with filters
    async getRecordsWithFilters(
        table: string,
        filters: Record<string, any>,
        select = '*',
        limit = 100
    ) {
        return await executeSupabaseQuery(async () => {
            let query = this.getClient().from(table).select(select).limit(limit);

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'string' && value.includes('%')) {
                        query = query.ilike(key, value);
                    } else {
                        query = query.eq(key, value);
                    }
                }
            });

            return await query;
        });
    }

    // Search records with text search
    async searchRecords(
        table: string,
        searchColumn: string,
        searchTerm: string,
        select = '*',
        limit = 100
    ) {
        return await executeSupabaseQuery(async () => {
            return await this.getClient()
                .from(table)
                .select(select)
                .ilike(searchColumn, `%${searchTerm}%`)
                .limit(limit);
        });
    }

    // Get record by ID
    async getRecordById(table: string, id: string | number, select = '*') {
        return await executeSupabaseQuery(async () => {
            return await this.getClient()
                .from(table)
                .select(select)
                .eq('id', id)
                .single();
        });
    }

    // Count records in a table
    async countRecords(table: string, filters?: Record<string, any>) {
        return await executeSupabaseQuery(async () => {
            let query = this.getClient().from(table).select('*', { count: 'exact', head: true });

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        query = query.eq(key, value);
                    }
                });
            }

            return await query;
        });
    }

    // This method is disabled to prevent raw SQL usage
    // Use the specific methods like getAllRecords, searchRecords instead
    async executeCustomSQL(sqlQuery: string) {
        return {
            success: false,
            error: 'Raw SQL queries are disabled. Use performDatabaseOperation with specific operations like "getAll", "search", "tables" instead.',
            suggestion: 'Use performDatabaseOperation({ operation: "tables", table: "dummy" }) to see available tables, then use structured queries.'
        };
    }

    // Get table schema information (hardcoded since information_schema isn't accessible)
    async getTableSchema(table: string) {
        const schemas = {
            'webhound_fee_categories': {
                success: true,
                data: [
                    { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
                    { column_name: 'category_key', data_type: 'text', is_nullable: 'NO', column_default: null },
                    { column_name: 'category_display_name', data_type: 'text', is_nullable: 'NO', column_default: null },
                    { column_name: 'category_group', data_type: 'text', is_nullable: 'NO', column_default: null },
                    { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: 'now()' }
                ]
            },
            'verified_fee_data': {
                success: true,
                data: [
                    { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
                    { column_name: 'city_id', data_type: 'integer', is_nullable: 'YES', column_default: null },
                    { column_name: 'location_name', data_type: 'text', is_nullable: 'NO', column_default: null },
                    { column_name: 'fee_category', data_type: 'text', is_nullable: 'NO', column_default: null },
                    { column_name: 'fee_description', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'verified_amounts', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'calculation_methods', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'source_text', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'data_quality_score', data_type: 'integer', is_nullable: 'YES', column_default: '0' },
                    { column_name: 'has_real_amounts', data_type: 'boolean', is_nullable: 'YES', column_default: 'false' },
                    { column_name: 'has_calculations', data_type: 'boolean', is_nullable: 'YES', column_default: 'false' },
                    { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: 'now()' },
                    { column_name: 'updated_at', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: 'now()' }
                ]
            },
            'cities': {
                success: true,
                data: [
                    { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
                    { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null },
                    { column_name: 'county', data_type: 'text', is_nullable: 'NO', column_default: null },
                    { column_name: 'state', data_type: 'text', is_nullable: 'YES', column_default: 'Arizona' },
                    { column_name: 'population', data_type: 'integer', is_nullable: 'YES', column_default: null },
                    { column_name: 'last_updated', data_type: 'date', is_nullable: 'YES', column_default: null },
                    { column_name: 'data_source_url', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: 'now()' }
                ]
            },
            'detailed_fee_breakdown': {
                success: true,
                data: [
                    { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
                    { column_name: 'verified_fee_id', data_type: 'integer', is_nullable: 'YES', column_default: null },
                    { column_name: 'fee_amount', data_type: 'numeric', is_nullable: 'YES', column_default: null },
                    { column_name: 'fee_unit', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'development_type', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'project_size_tier', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'meter_size', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'special_conditions', data_type: 'text', is_nullable: 'YES', column_default: null },
                    { column_name: 'effective_date', data_type: 'date', is_nullable: 'YES', column_default: null },
                    { column_name: 'verification_status', data_type: 'text', is_nullable: 'YES', column_default: 'verified' },
                    { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: 'now()' }
                ]
            }
        };

        return (schemas as any)[table] || {
            success: false,
            error: `Table '${table}' not found. Available tables: ${Object.keys(schemas).join(', ')}`
        };
    }

    // Get list of all tables (hardcoded since information_schema isn't accessible)
    async getAllTables() {
        // Return the actual tables available in the database
        return {
            success: true,
            data: [
                { table_name: 'webhound_fee_categories' },
                { table_name: 'verified_fee_data' },
                { table_name: 'cities' },
                { table_name: 'detailed_fee_breakdown' }
            ]
        };
    }

    // Get recent records (assuming you have a timestamp column)
    async getRecentRecords(
        table: string,
        timestampColumn: string,
        hours: number = 24,
        select = '*',
        limit = 100
    ) {
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - hours);

        return await executeSupabaseQuery(async () => {
            return await this.getClient()
                .from(table)
                .select(select)
                .gte(timestampColumn, hoursAgo.toISOString())
                .order(timestampColumn, { ascending: false })
                .limit(limit);
        });
    }

    // Get records with pagination
    async getRecordsWithPagination(
        table: string,
        page: number = 1,
        pageSize: number = 20,
        select = '*',
        orderBy: string = 'id',
        ascending: boolean = true
    ) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        return await executeSupabaseQuery(async () => {
            return await this.getClient()
                .from(table)
                .select(select)
                .range(from, to)
                .order(orderBy, { ascending });
        });
    }
}

// Export a singleton instance
export const supabaseOperations = new SupabaseOperations();
