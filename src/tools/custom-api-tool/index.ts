import { BuiltinToolManifest } from '@/types/tool';

export const CustomApiToolManifest: BuiltinToolManifest = {
    identifier: 'lewis',
    type: 'builtin',
    meta: {
        title: 'LEWIS',
        description: 'Connect to external APIs and databases, including Construction Fee Portal',
        avatar: '🧭', // Compass emoji for LEWIS
    },
    api: [
        {
            name: 'callExternalAPI',
            description: 'Make HTTP requests to external APIs',
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'The API endpoint URL to call',
                    },
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'PUT', 'DELETE'],
                        description: 'HTTP method to use',
                        default: 'GET',
                    },
                    headers: {
                        type: 'object',
                        description: 'HTTP headers to include in the request',
                    },
                    body: {
                        type: 'object',
                        description: 'Request body for POST/PUT requests',
                    },
                    timeout: {
                        type: 'number',
                        description: 'Request timeout in milliseconds',
                        default: 30000,
                    },
                },
                required: ['url'],
            },
        },
        {
            name: 'queryDatabase',
            description: 'Query database tables with filters and sorting',
            parameters: {
                type: 'object',
                properties: {
                    table: {
                        type: 'string',
                        description: 'The table name to query',
                    },
                    select: {
                        type: 'string',
                        description: 'Columns to select (comma-separated)',
                    },
                    filters: {
                        type: 'object',
                        description: 'Filter conditions for the query',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of records to return',
                    },
                    orderBy: {
                        type: 'object',
                        properties: {
                            column: { type: 'string' },
                            ascending: { type: 'boolean', default: true },
                        },
                        description: 'Ordering configuration',
                    },
                },
                required: ['table'],
            },
        },
        {
            name: 'performDatabaseOperation',
            description: 'Perform various database operations like getting all records, searching, counting, etc.',
            parameters: {
                type: 'object',
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['getAll', 'getById', 'search', 'count', 'schema', 'tables', 'recent', 'paginated'],
                        description: 'The type of database operation to perform',
                    },
                    table: {
                        type: 'string',
                        description: 'The table name for the operation',
                    },
                    id: {
                        type: 'string',
                        description: 'Record ID for getById operation',
                    },
                    searchColumn: {
                        type: 'string',
                        description: 'Column to search in for search operation',
                    },
                    searchTerm: {
                        type: 'string',
                        description: 'Search term for search operation',
                    },
                    timestampColumn: {
                        type: 'string',
                        description: 'Timestamp column for recent operation',
                    },
                    hours: {
                        type: 'number',
                        description: 'Number of hours to look back for recent operation',
                    },
                    page: {
                        type: 'number',
                        description: 'Page number for paginated operation',
                    },
                    pageSize: {
                        type: 'number',
                        description: 'Number of records per page for paginated operation',
                    },
                    select: {
                        type: 'string',
                        description: 'Columns to select (comma-separated)',
                    },
                    filters: {
                        type: 'object',
                        description: 'Filter conditions for the operation',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of records to return',
                    },
                    orderBy: {
                        type: 'object',
                        properties: {
                            column: { type: 'string' },
                            ascending: { type: 'boolean', default: true },
                        },
                        description: 'Ordering configuration',
                    },
                },
                required: ['operation', 'table'],
            },
        },
        // Construction Fee Portal specific APIs
        {
            name: 'getCities',
            description: 'Get list of cities with filtering options for the Construction Fee Portal. Returns city information including name, population, county, and state. Use this to find available cities for fee calculations.',
            parameters: {
                type: 'object',
                properties: {
                    state: {
                        type: 'string',
                        description: 'State code to filter cities (e.g., "AZ" for Arizona)',
                    },
                    county: {
                        type: 'string',
                        description: 'County name to filter cities',
                    },
                    searchTerm: {
                        type: 'string',
                        description: 'Search term to filter cities by name or county',
                    },
                },
            },
        },
        {
            name: 'getFees',
            description: 'Get construction fees for a specific city with filtering options. Returns detailed fee information including category, description, amount, and calculation method. Use this to understand fee structures before calculating total project costs.',
            parameters: {
                type: 'object',
                properties: {
                    cityId: {
                        type: 'string',
                        description: 'City ID to get fees for (obtain this from getCities first)',
                    },
                    category: {
                        type: 'string',
                        description: 'Fee category to filter by (e.g., "Building Permit", "Plan Review", "Inspection", "Impact Fee")',
                    },
                    searchTerm: {
                        type: 'string',
                        description: 'Search term to filter fees by description or category',
                    },
                },
            },
        },
        {
            name: 'calculateFees',
            description: 'Calculate construction fees for a specific project in a city. This function will automatically fetch applicable fees and calculate total costs based on project value and square footage. Returns detailed breakdown of all fees and total project cost.',
            parameters: {
                type: 'object',
                properties: {
                    cityId: {
                        type: 'string',
                        description: 'City ID to calculate fees for (obtain this from getCities first)',
                    },
                    projectType: {
                        type: 'string',
                        enum: ['residential', 'commercial'],
                        description: 'Type of construction project (residential or commercial)',
                    },
                    projectValue: {
                        type: 'number',
                        description: 'Total project value in dollars (e.g., 500000 for $500k project)',
                    },
                    squareFootage: {
                        type: 'number',
                        description: 'Project square footage (e.g., 2500 for 2,500 sq ft)',
                    },
                },
                required: ['cityId', 'projectType', 'projectValue', 'squareFootage'],
            },
        },
    ],
    systemRole: `You are LEWIS, a powerful API Tool that can connect to external APIs and databases. You can also access the Construction Fee Portal, which provides information about construction fees for cities in Arizona.

Available capabilities:
1. **External API Calls**: Make HTTP requests to external APIs
2. **Database Operations**: Query and manipulate database tables
3. **Construction Fee Portal**: Access construction fee data and calculations

For Construction Fee Portal operations:
- Use getCities to find cities and their information
- Use getFees to retrieve fee structures for specific cities
- Use calculateFees to compute total fees for construction projects

**IMPORTANT: After calling any tool function, you MUST:**
1. **Process the tool result** - Parse the JSON response and understand what data was returned
2. **Provide an intelligent answer** - Use the tool results to answer the user's question in a helpful, informative way
3. **Explain the findings** - Don't just show raw data; interpret it and provide insights
4. **Format the response** - Present the information in a clear, organized manner

**Example workflow:**
- User asks: "What cities are available in Arizona?"
- You call: getCities({ state: "AZ" })
- You receive: JSON data with city information
- You respond: "Based on the Construction Fee Portal data, here are the available cities in Arizona: [list cities with population, county info, and insights]"

Always provide clear, helpful responses and explain what data you're retrieving or calculating. Never just call a tool without processing and presenting the results intelligently.`,
};
