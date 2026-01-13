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

        // Get user's categories
        const { data: categories } = await supabaseAdmin
            .from('categories')
            .select('id, name, type')
            .or(`user_id.eq.${settings.user_id},user_id.is.null`);

        const typedCategories = (categories || []) as { id: string; name: string; type: string }[];
        const categoryNames = typedCategories.map(c => c.name);

        // --- 1. BYPASS AI: CHECK BALANCE (Regex) ---
        // Match: "cek saldo", "saldo bca", "sisa uang jago", "cek bca"
        const balanceRegex = /\b(cek|saldo|sisa|uang)\b\s*(\w+)?/i;
        const balanceMatch = text.match(balanceRegex);

        // Ensure it's not a transaction (e.g. "uang masuk 50rb" or "beli saldo")
        const isTransactionKeywords = /\b(beli|bayar|transfer|masuk|keluar|habis)\b/i.test(text);
        const hasNumber = /\d+/.test(text);

        // If specific keywords found AND NO transaction keywords AND NO huge numbers (likely amount)
        // OR explicit command /ceksaldo
        if (
            text.startsWith('/') ||
            ((balanceMatch && !isTransactionKeywords && !hasNumber) || text.toLowerCase().includes('cek saldo'))
        ) {
            const lowerText = text.toLowerCase();
            let targetWalletName = '';

            // Extract wallet name from text
            if (lowerText.startsWith('/ceksaldo') || lowerText.startsWith('/saldo')) {
                targetWalletName = text.split(' ').slice(1).join(' ').trim().toLowerCase();
            } else {
                // Try to find a wallet name in the text
                targetWalletName = walletNames.find(w => lowerText.includes(w.toLowerCase())) || '';
            }

            // Re-fetch wallets for real-time data
            const { data: realTimeWallets } = await supabaseAdmin.from('wallets').select('*').eq('user_id', settings.user_id);

            if (!targetWalletName || targetWalletName === 'all' || targetWalletName === 'semua') {
                // All Wallets
                let msg = '💰 <b>Saldo Semua Wallet</b>\n\n';
                let total = 0;
                realTimeWallets?.forEach(w => {
                    msg += `🔹 ${w.name}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(w.balance || 0)}\n`;
                    total += w.balance || 0;
                });
                msg += `\n<b>Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total)}</b>`;
                await sendMessage(chatId, msg);
            } else {
                // Specific Wallet
                const w = realTimeWallets?.find(w => w.name.toLowerCase() === targetWalletName.toLowerCase());
                if (w) {
                    await sendMessage(chatId, `💰 <b>Saldo ${w.name}</b>\n${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(w.balance || 0)}`);
                } else {
                    // If purely regex match but wallet not found, fallback to AI might be dangerous if rate limit, 
                    // but better to just show available wallets
                    const token = text.split(' ').pop()?.toLowerCase();
                    const closeMatch = realTimeWallets?.find(w => w.name.toLowerCase().includes(token || 'xyz'));

                    if (closeMatch) {
                        await sendMessage(chatId, `💰 <b>Saldo ${closeMatch.name}</b>\n${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(closeMatch.balance || 0)}`);
                    } else {
                        await sendMessage(chatId, `❌ Wallet tidak ditemukan.\nAvailable: ${walletNames.join(', ')}`);
                    }
                }
            }
            return NextResponse.json({ ok: true });
        }

        // --- 2. GEMINI AI PARSING (Transactions) ---
        const result = await parseTransaction(text, walletNames, categoryNames);

        if (!result.success || !result.data) {
            await sendMessage(chatId, `❌ ${result.error || 'Gagal memahami pesan'}`);
            return NextResponse.json({ ok: true });
        }

        const { amount, wallet: walletName, to_wallet: toWalletName, category, type, note } = result.data;

        // --- HANDLE CHECK BALANCE (Intent from Gemini) ---
        if (type === 'check_balance') {
            if (!walletName || walletName.toLowerCase() === 'all' || walletName === '') {
                // Show all wallets
                let msg = '💰 <b>Saldo Semua Wallet</b>\n\n';
                let total = 0;

                // Re-fetch wallets to get latest balance
                const { data: latestWallets } = await supabaseAdmin.from('wallets').select('*').eq('user_id', settings.user_id);

                latestWallets?.forEach(w => {
                    msg += `🔹 ${w.name}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(w.balance || 0)}\n`;
                    total += w.balance || 0;
                });
                msg += `\n<b>Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total)}</b>`;

                await sendMessage(chatId, msg);
                return NextResponse.json({ ok: true });
            } else {
                // Specific wallet
                const w = typedWallets.find(w => w.name.toLowerCase() === walletName.toLowerCase());
                if (!w) {
                    await sendMessage(chatId, `❌ Wallet "${walletName}" tidak ditemukan. Available: ${walletNames.join(', ')}`);
                    return NextResponse.json({ ok: true });
                }

                // Re-fetch specific wallet
                const { data: currentW } = await supabaseAdmin.from('wallets').select('balance').eq('id', w.id).single();

                await sendMessage(chatId, `💰 <b>Saldo ${w.name}</b>\n${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentW?.balance || 0)}`);
                return NextResponse.json({ ok: true });
            }
        }

        // --- HANDLE TRANSFER (NEW LOGIC) ---
        if (type === 'transfer') {
            if (!toWalletName) {
                await sendMessage(chatId, '❌ Transfer harus menyebutkan wallet TUJUAN.');
                return NextResponse.json({ ok: true });
            }

            // Find valid wallets
            const sourceWallet = typedWallets.find(w => w.name.toLowerCase() === walletName.toLowerCase());
            const targetWallet = typedWallets.find(w => w.name.toLowerCase() === toWalletName.toLowerCase());

            if (!sourceWallet) {
                await sendMessage(chatId, `❌ Wallet asal "${walletName}" tidak ditemukan. Available: ${walletNames.join(', ')}`);
                return NextResponse.json({ ok: true });
            }
            if (!targetWallet) {
                await sendMessage(chatId, `❌ Wallet tujuan "${toWalletName}" tidak ditemukan. Available: ${walletNames.join(', ')}`);
                return NextResponse.json({ ok: true });
            }
            if (sourceWallet.id === targetWallet.id) {
                await sendMessage(chatId, '❌ Wallet asal dan tujuan tidak boleh sama.');
                return NextResponse.json({ ok: true });
            }

            // --- 1. Expense (Transfer Keluar) ---
            // Find category "Transfer Keluar" (prioritize default)
            let expenseCatId;
            const { data: expCat } = await supabaseAdmin
                .from('categories')
                .select('id')
                .or(`user_id.eq.${settings.user_id},user_id.is.null`)
                .eq('type', 'expense')
                .ilike('name', 'Transfer Keluar')
                .order('user_id', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (expCat) expenseCatId = expCat.id;
            else {
                // Fallback create
                const { data: newExp } = await supabaseAdmin.from('categories').insert({ user_id: settings.user_id, name: 'Transfer Keluar', type: 'expense', icon: 'ArrowUpRight' }).select('id').single();
                if (newExp) expenseCatId = newExp.id;
            }

            if (!expenseCatId) {
                await sendMessage(chatId, '❌ Gagal menemukan kategori Transfer Keluar.');
                return NextResponse.json({ ok: true });
            }

            // Create Expense Transaction
            await supabaseAdmin.from('transactions').insert({
                user_id: settings.user_id,
                wallet_id: sourceWallet.id,
                category_id: expenseCatId,
                amount: Math.abs(amount), // Positive in DB but type expense
                date: new Date().toISOString(),
                note: `Transfer ke ${targetWallet.name}: ${note || ''}`,
                source: 'telegram'
            });

            // Update Source Balance (Decrease)
            const { data: currentSource } = await supabaseAdmin.from('wallets').select('balance').eq('id', sourceWallet.id).single();
            await supabaseAdmin.from('wallets').update({ balance: (currentSource?.balance || 0) - Math.abs(amount) }).eq('id', sourceWallet.id);


            // --- 2. Income (Transfer Masuk) ---
            // Find category "Transfer Masuk" (prioritize default)
            let incomeCatId;
            const { data: incCat } = await supabaseAdmin
                .from('categories')
                .select('id')
                .or(`user_id.eq.${settings.user_id},user_id.is.null`)
                .eq('type', 'income')
                .ilike('name', 'Transfer Masuk')
                .order('user_id', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (incCat) incomeCatId = incCat.id;
            else {
                const { data: newInc } = await supabaseAdmin.from('categories').insert({ user_id: settings.user_id, name: 'Transfer Masuk', type: 'income', icon: 'ArrowDownLeft' }).select('id').single();
                if (newInc) incomeCatId = newInc.id;
            }

            if (!incomeCatId) {
                await sendMessage(chatId, '❌ Gagal menemukan kategori Transfer Masuk.');
                return NextResponse.json({ ok: true });
            }

            // Create Income Transaction
            await supabaseAdmin.from('transactions').insert({
                user_id: settings.user_id,
                wallet_id: targetWallet.id,
                category_id: incomeCatId,
                amount: Math.abs(amount),
                date: new Date().toISOString(),
                note: `Transfer dari ${sourceWallet.name}: ${note || ''}`,
                source: 'telegram'
            });

            // Update Target Balance (Increase)
            const { data: currentTarget } = await supabaseAdmin.from('wallets').select('balance').eq('id', targetWallet.id).single();
            await supabaseAdmin.from('wallets').update({ balance: (currentTarget?.balance || 0) + Math.abs(amount) }).eq('id', targetWallet.id);

            // Success Message
            await sendMessage(chatId,
                `✅ <b>Transfer Berhasil!</b>\n\n` +
                `💸 <b>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)}</b>\n` +
                `📤 ${sourceWallet.name} → 📥 ${targetWallet.name}\n` +
                `📝 ${note || '-'}`
            );

            return NextResponse.json({ ok: true });
        }


        // --- HANDLE SINGLE TRANSACTION (INCOME / EXPENSE) ---

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

        // 1. Try to find EXACT match first (prioritize default categories)
        let { data: existingCategory } = await supabaseAdmin
            .from('categories')
            .select('id')
            .or(`user_id.eq.${settings.user_id},user_id.is.null`)
            .eq('type', type)
            .ilike('name', category) // Case insensitive match
            .order('user_id', { ascending: true }) // Prioritize NULL (default) over user_id
            .limit(1)
            .maybeSingle();

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
