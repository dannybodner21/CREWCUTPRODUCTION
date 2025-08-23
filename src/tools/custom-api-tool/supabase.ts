import { createClient } from '@supabase/supabase-js';

// Separate Supabase configuration for the custom API tool
// This keeps it isolated from your main database configuration

interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey?: string; // Optional: for admin operations
}

// Get Supabase credentials from environment variables
// These should be separate from your main DATABASE_URL
const getSupabaseConfig = (): SupabaseConfig => {
    // Use NEXT_PUBLIC_ prefixed variables for client-side access
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Environment variables loaded successfully

    if (!url || !anonKey) {
        console.warn('Supabase configuration not found. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.');
        // Return dummy config to prevent build errors
        return {
            url: 'https://placeholder.supabase.co',
            anonKey: 'placeholder-key',
            serviceRoleKey,
        };
    }

    return {
        url,
        anonKey,
        serviceRoleKey,
    };
};

// Create Supabase client with anonymous key (for read operations)
export const createSupabaseClient = () => {
    try {
        const config = getSupabaseConfig();
        const client = createClient(config.url, config.anonKey);
        return client;
    } catch (error) {
        console.error('Failed to create Supabase client:', error);
        throw error;
    }
};

// Create Supabase client with service role key (for admin operations)
export const createSupabaseAdminClient = () => {
    try {
        const config = getSupabaseConfig();

        if (!config.serviceRoleKey) {
            throw new Error(
                'Service role key not configured. Set SUPABASE_SERVICE_ROLE_KEY for admin operations.',
            );
        }

        return createClient(config.url, config.serviceRoleKey);
    } catch (error) {
        console.error('Failed to create Supabase admin client:', error);
        throw error;
    }
};

// Helper function to safely execute Supabase queries
export const executeSupabaseQuery = async <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
        const { data, error } = await queryFn();

        if (error) {
            return {
                success: false,
                error: error.message || 'Supabase query failed',
            };
        }
        return {
            success: true,
            data: data || undefined,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
