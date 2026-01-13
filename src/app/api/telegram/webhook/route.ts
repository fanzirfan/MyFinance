import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendMessage, TelegramUpdate } from '@/lib/telegram';
import { parseTransaction } from '@/lib/gemini';

interface WalletRecord {
    id: string;
    name: string;
    balance?: number;
}

export async function POST(request: NextRequest) {
    // Verify webhook secret
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    try {
        const update: TelegramUpdate = await request.json();
        const message = update.message;

        if (!message?.text || !message.from) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const telegramUserId = message.from.id;
        const telegramUsername = message.from.username || null;
        const text = message.text.trim();

        // Handle /start command with connection token
        if (text.startsWith('/start')) {
            const parts = text.split(' ');
            if (parts.length < 2) {
                await sendMessage(chatId,
                    '👋 <b>Selamat datang di MyFinance Bot!</b>\n\n' +
                    'Untuk menghubungkan akun:\n' +
                    '1. Buka aplikasi MyFinance\n' +
                    '2. Pergi ke Pengaturan\n' +
                    '3. Copy Secret Key\n' +
                    '4. Ketik: <code>/start [secret_key]</code>\n\n' +
                    'Contoh: <code>/start abc123xyz</code>'
                );
                return NextResponse.json({ ok: true });
            }

            const connectionToken = parts[1];

            // Find user by connection token
            const { data: settings, error: findError } = await supabaseAdmin
                .from('telegram_settings')
                .select('*')
                .eq('connection_token', connectionToken)
                .single();

            if (findError || !settings) {
                await sendMessage(chatId, '❌ Secret key tidak valid. Pastikan Anda menyalin dengan benar dari Pengaturan MyFinance.');
                return NextResponse.json({ ok: true });
            }

            // Update telegram settings
            const { error: updateError } = await supabaseAdmin
                .from('telegram_settings')
                .update({
                    telegram_user_id: telegramUserId,
                    telegram_username: telegramUsername,
                    is_connected: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', settings.id);

            if (updateError) {
                console.error('Failed to connect:', updateError);
                await sendMessage(chatId, '❌ Gagal menghubungkan. Silakan coba lagi.');
                return NextResponse.json({ ok: true });
            }

            await sendMessage(chatId,
                '✅ <b>Berhasil terhubung!</b>\n\n' +
                'Sekarang Anda bisa mencatat transaksi langsung dari sini.\n\n' +
                '<b>Contoh:</b>\n' +
                '• <code>50rb BCA makan siang</code>\n' +
                '• <code>Gaji 5jt Mandiri</code>\n' +
                '• <code>Transport 15k GoPay</code>\n\n' +
                'Ketik /help untuk bantuan.'
            );
            return NextResponse.json({ ok: true });
        }

        // Handle /help command
        if (text === '/help') {
            await sendMessage(chatId,
                '📖 <b>Cara Penggunaan</b>\n\n' +
                'Ketik transaksi dengan format:\n' +
                '<code>[jumlah] [wallet] [keterangan]</code>\n\n' +
                '<b>Contoh Pengeluaran:</b>\n' +
                '• <code>50rb BCA makan</code>\n' +
                '• <code>100k GoPay belanja</code>\n' +
                '• <code>25.000 OVO transport</code>\n\n' +
                '<b>Contoh Pemasukan:</b>\n' +
                '• <code>Gaji 5jt Mandiri</code>\n' +
                '• <code>Terima transfer 500k BCA</code>\n\n' +
                '<b>Perintah:</b>\n' +
                '/help - Tampilkan bantuan\n' +
                '/disconnect - Putuskan koneksi'
            );
            return NextResponse.json({ ok: true });
        }

        // Handle /disconnect command
        if (text === '/disconnect') {
            const { error } = await supabaseAdmin
                .from('telegram_settings')
                .update({
                    telegram_user_id: null,
                    telegram_username: null,
                    is_connected: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('telegram_user_id', telegramUserId);

            if (error) {
                await sendMessage(chatId, '❌ Gagal memutuskan koneksi.');
            } else {
                await sendMessage(chatId, '👋 Koneksi diputus. Untuk menghubungkan kembali, gunakan /start [secret_key]');
            }
            return NextResponse.json({ ok: true });
        }

        // Find connected user
        const { data: settings, error: userError } = await supabaseAdmin
            .from('telegram_settings')
            .select('user_id')
            .eq('telegram_user_id', telegramUserId)
            .eq('is_connected', true)
            .single();

        if (userError || !settings) {
            await sendMessage(chatId,
                '⚠️ Akun belum terhubung.\n\n' +
                'Gunakan /start [secret_key] untuk menghubungkan akun MyFinance.'
            );
            return NextResponse.json({ ok: true });
        }

        // Get user's wallets
        const { data: wallets } = await supabaseAdmin
            .from('wallets')
            .select('id, name')
            .eq('user_id', settings.user_id);

        const typedWallets = (wallets || []) as WalletRecord[];
        const walletNames = typedWallets.map(w => w.name);

        // Parse transaction with Gemini AI
        const result = await parseTransaction(text, walletNames);

        if (!result.success || !result.data) {
            await sendMessage(chatId, `❌ ${result.error || 'Gagal memahami pesan'}`);
            return NextResponse.json({ ok: true });
        }

        const { amount, wallet: walletName, category, type, note } = result.data;

        // Find matching wallet (case insensitive)
        const matchedWallet = typedWallets.find(w =>
            w.name.toLowerCase() === walletName.toLowerCase()
        );

        if (!matchedWallet) {
            const availableWallets = walletNames.join(', ') || 'Belum ada wallet';
            await sendMessage(chatId,
                `❌ Wallet "${walletName}" tidak ditemukan.\n\n` +
                `<b>Wallet tersedia:</b> ${availableWallets}`
            );
            return NextResponse.json({ ok: true });
        }

        // Find or create category
        let categoryId: string;
        const { data: existingCategory } = await supabaseAdmin
            .from('categories')
            .select('id')
            .or(`user_id.eq.${settings.user_id},user_id.is.null`)
            .eq('type', type)
            .ilike('name', category)
            .single();

        if (existingCategory) {
            categoryId = existingCategory.id;
        } else {
            // Create new category for user
            const { data: newCategory, error: catError } = await supabaseAdmin
                .from('categories')
                .insert({
                    user_id: settings.user_id,
                    name: category,
                    type: type,
                })
                .select('id')
                .single();

            if (catError || !newCategory) {
                await sendMessage(chatId, '❌ Gagal membuat kategori baru.');
                return NextResponse.json({ ok: true });
            }
            categoryId = newCategory.id;
        }

        // Create transaction
        const transactionAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: settings.user_id,
                wallet_id: matchedWallet.id,
                category_id: categoryId,
                amount: transactionAmount,
                date: new Date().toISOString(),
                note: note,
                source: 'telegram',
            });

        if (txError) {
            console.error('Failed to create transaction:', txError);
            await sendMessage(chatId, '❌ Gagal menyimpan transaksi.');
            return NextResponse.json({ ok: true });
        }

        // Update wallet balance
        const { data: currentWallet } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('id', matchedWallet.id)
            .single();

        if (currentWallet) {
            await supabaseAdmin
                .from('wallets')
                .update({ balance: currentWallet.balance + transactionAmount })
                .eq('id', matchedWallet.id);
        }

        // Format amount for display
        const formattedAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Math.abs(amount));

        const emoji = type === 'expense' ? '💸' : '💰';
        const sign = type === 'expense' ? '-' : '+';

        await sendMessage(chatId,
            `${emoji} <b>Transaksi Tersimpan!</b>\n\n` +
            `${sign}${formattedAmount}\n` +
            `📁 ${category}\n` +
            `💳 ${matchedWallet.name}\n` +
            (note ? `📝 ${note}` : '')
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Telegram sends GET to verify webhook
export async function GET() {
    return NextResponse.json({ status: 'Webhook is active' });
}
