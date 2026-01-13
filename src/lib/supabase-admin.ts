import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for webhook
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables for admin client');
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    return _supabaseAdmin;
}
