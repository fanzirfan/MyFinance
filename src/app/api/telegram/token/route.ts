import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function generateToken(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

// Create or get telegram settings with connection token
export async function POST(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Check if settings exist
        const { data: existing } = await supabaseAdmin
            .from('telegram_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (existing) {
            // Generate new token
            const newToken = generateToken();
            const { data, error } = await supabaseAdmin
                .from('telegram_settings')
                .update({
                    connection_token: newToken,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ settings: data });
        }

        // Create new settings
        const { data, error } = await supabaseAdmin
            .from('telegram_settings')
            .insert({
                user_id: userId,
                connection_token: generateToken(),
                is_connected: false,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ settings: data });
    } catch (error) {
        console.error('Generate token error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Disconnect telegram
export async function DELETE(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('telegram_settings')
            .update({
                telegram_user_id: null,
                telegram_username: null,
                is_connected: false,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Disconnect error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
