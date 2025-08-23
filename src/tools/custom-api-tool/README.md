# Supabase Database Tool

This tool allows you to connect to a Supabase database and perform various database operations. It's completely separate from your main application database and won't interfere with your existing setup.

## Setup

1. **Install Supabase package** (already added to package.json):
   ```bash
   pnpm install
   ```

2. **Set environment variables** in your `.env.local` file:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # Optional
   ```

## Usage Examples

### Basic Database Operations

The tool provides several ways to interact with your Supabase database:

#### 1. Simple Table Queries
```typescript
// Get all users
await queryDatabase({
  table: 'users',
  select: 'id, name, email',
  limit: 50
});

// Get users with filters
await queryDatabase({
  table: 'users',
  select: 'id, name, email',
  filters: { status: 'active', role: 'admin' },
  limit: 20
});
```

#### 2. Advanced Database Operations
```typescript
// Get all records from a table
await performDatabaseOperation({
  operation: 'getAll',
  table: 'users',
  select: 'id, name, email',
  limit: 100
});

// Search for records
await performDatabaseOperation({
  operation: 'search',
  table: 'users',
  searchColumn: 'name',
  searchTerm: 'john',
  limit: 20
});

// Get record by ID
await performDatabaseOperation({
  operation: 'getById',
  table: 'users',
  id: 123,
  select: 'id, name, email, created_at'
});

// Count records
await performDatabaseOperation({
  operation: 'count',
  table: 'users',
  filters: { status: 'active' }
});

// Get table schema
await performDatabaseOperation({
  operation: 'schema',
  table: 'users'
});

// Get all tables
await performDatabaseOperation({
  operation: 'tables'
});

// Get recent records
await performDatabaseOperation({
  operation: 'recent',
  table: 'users',
  timestampColumn: 'created_at',
  hours: 24,
  limit: 50
});

// Get paginated records
await performDatabaseOperation({
  operation: 'paginated',
  table: 'users',
  page: 1,
  pageSize: 20,
  orderBy: { column: 'created_at', ascending: false }
});
```

#### 3. Custom SQL Queries
```typescript
// Execute custom SQL (requires service role key)
await queryDatabase({
  query: 'SELECT COUNT(*) as total_users FROM users WHERE created_at > NOW() - INTERVAL \'7 days\''
});
```

## Security Features

- **Anonymous Key**: Used for read operations and basic queries
- **Service Role Key**: Required for admin operations like custom SQL execution
- **Environment Isolation**: Completely separate from your main database configuration
- **Error Handling**: Safe error handling that doesn't expose sensitive information

## Supported Operations

| Operation | Description | Required Parameters |
|-----------|-------------|-------------------|
| `getAll` | Get all records from a table | `table` |
| `getById` | Get a specific record by ID | `table`, `id` |
| `search` | Search records with text matching | `table`, `searchColumn`, `searchTerm` |
| `count` | Count records in a table | `table` |
| `schema` | Get table schema information | `table` |
| `tables` | Get list of all tables | None |
| `recent` | Get recent records by timestamp | `table`, `timestampColumn` |
| `paginated` | Get records with pagination | `table` |

## Error Handling

The tool provides consistent error handling:
- All operations return a `success` boolean
- Errors include descriptive messages
- No sensitive database information is exposed in error messages
- Graceful fallbacks for missing configuration

## Best Practices

1. **Use appropriate keys**: Use anon key for read operations, service role key only when needed
2. **Limit results**: Always use `limit` to prevent large data transfers
3. **Select specific columns**: Use `select` to only fetch needed data
4. **Handle errors**: Check the `success` field before processing results
5. **Use filters**: Apply filters to reduce data transfer and improve performance

## Troubleshooting

### Common Issues

1. **"Supabase configuration missing"**: Check your `.env.local` file has the required variables
2. **"Service role key not configured"**: Set `SUPABASE_SERVICE_ROLE_KEY` for admin operations
3. **Connection errors**: Verify your Supabase URL and keys are correct
4. **Permission errors**: Check your Supabase RLS (Row Level Security) policies

### Debug Mode

Set `DEBUG=supabase:*` in your environment to see detailed connection logs.

## Integration with AI

This tool is designed to work with AI agents that can:
- Understand natural language database queries
- Convert user questions into appropriate database operations
- Handle complex queries by combining multiple operations
- Provide natural language responses based on database results

Example AI interaction:
```
User: "How many active users do we have?"
AI: Let me check the users table for active users.
[Uses performDatabaseOperation with operation: 'count' and filters: { status: 'active' }]
AI: You have 1,247 active users in your system.
```
