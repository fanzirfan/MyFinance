import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database
export type Wallet = {
    id: string;
    user_id: string;
    name: string;
    acronym: string;
    color: string;
    balance: number;
    created_at: string;
};

export type Category = {
    id: string;
    user_id: string | null;
    name: string;
    type: 'income' | 'expense';
    icon: string | null;
    created_at: string;
};

export type Transaction = {
    id: string;
    user_id: string;
    wallet_id: string;
    category_id: string;
    amount: number;
    date: string;
    note: string | null;
    source: 'web' | 'telegram';
    created_at: string;
    // Joined fields
    wallet?: Wallet;
    category?: Category;
};

export type TelegramSettings = {
    id: string;
    user_id: string;
    connection_token: string | null;
    telegram_user_id: number | null;
    telegram_username: string | null;
    is_connected: boolean;
    created_at: string;
    updated_at: string;
};
