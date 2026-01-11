'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRightLeft, Loader2 } from 'lucide-react';

export default function TransferPage() {
    const { user, wallets } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [sourceWalletId, setSourceWalletId] = useState('');
    const [targetWalletId, setTargetWalletId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (wallets.length > 0) {
            setSourceWalletId(wallets[0].id);
            if (wallets.length > 1) {
                setTargetWalletId(wallets[1].id);
            }
        }
    }, [wallets]);

    // Helpers for currency formatting
    const formatNumber = (value: string) => {
        const num = value.replace(/\D/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const parseFormattedNumber = (value: string) => {
        return value.replace(/\./g, '');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const plain = parseFormattedNumber(val);
        setAmount(formatNumber(plain));
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!user || !sourceWalletId || !targetWalletId || !amount) {
            setError('Mohon lengkapi semua data');
            setLoading(false);
            return;
        }

        if (sourceWalletId === targetWalletId) {
            setError('Wallet asal dan tujuan tidak boleh sama');
            setLoading(false);
            return;
        }

        const numericAmount = parseFloat(parseFormattedNumber(amount));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Jumlah transfer tidak valid');
            setLoading(false);
            return;
        }

        const sourceWallet = wallets.find(w => w.id === sourceWalletId);
        if (sourceWallet && (sourceWallet.balance || 0) < numericAmount) {
            setError('Saldo wallet asal tidak mencukupi');
            setLoading(false);
            return;
        }

        try {
            // 1. Get or Create Categories
            // Expense Category (Transfer Keluar)
            let expenseCatId;
            const { data: expCat } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .ilike('name', 'Transfer Keluar')
                .maybeSingle();

            if (expCat) {
                expenseCatId = expCat.id;
            } else {
                const { data: newExp, error: newExpErr } = await supabase
                    .from('categories')
                    .insert({ user_id: user.id, name: 'Transfer Keluar', type: 'expense', icon: 'ArrowRightLeft' })
                    .select()
                    .single();
                if (!newExpErr && newExp) expenseCatId = newExp.id;
            }

            // Income Category (Transfer Masuk)
            let incomeCatId;
            const { data: incCat } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', 'income')
                .ilike('name', 'Transfer Masuk')
                .maybeSingle();

            if (incCat) {
                incomeCatId = incCat.id;
            } else {
                const { data: newInc, error: newIncErr } = await supabase
                    .from('categories')
                    .insert({ user_id: user.id, name: 'Transfer Masuk', type: 'income', icon: 'ArrowRightLeft' })
                    .select()
                    .single();
                if (!newIncErr && newInc) incomeCatId = newInc.id;
            }

            // 2. Transaction Out (Source - Expense)
            const { error: txOutError } = await supabase.from('transactions').insert({
                user_id: user.id,
                wallet_id: sourceWalletId,
                category_id: expenseCatId,
                amount: numericAmount,
                note: `Transfer ke ${wallets.find(w => w.id === targetWalletId)?.name}: ${note}`,
                date: new Date().toISOString(),
            });

            if (txOutError) throw txOutError;

            // 3. Transaction In (Target - Income)
            const { error: txInError } = await supabase.from('transactions').insert({
                user_id: user.id,
                wallet_id: targetWalletId,
                category_id: incomeCatId,
                amount: numericAmount,
                note: `Transfer dari ${wallets.find(w => w.id === sourceWalletId)?.name}: ${note}`,
                date: new Date().toISOString(),
            });

            if (txInError) throw txInError;

            // 4. Update Balances (Manual update to be safe)
            const { error: updateSourceError } = await supabase
                .from('wallets')
                .update({ balance: (sourceWallet!.balance || 0) - numericAmount })
                .eq('id', sourceWalletId);
            if (updateSourceError) throw updateSourceError;

            const targetWallet = wallets.find(w => w.id === targetWalletId);
            const { error: updateTargetError } = await supabase
                .from('wallets')
                .update({ balance: (targetWallet!.balance || 0) + numericAmount })
                .eq('id', targetWalletId);
            if (updateTargetError) throw updateTargetError;

            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Terjadi kesalahan saat transfer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-background">
            <header className="px-4 py-4 flex items-center gap-4 border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-secondary transition-all active:scale-95">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Transfer Saldo</h1>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                <form onSubmit={handleTransfer} className="space-y-6">
                    {/* Source Wallet */}
                    <div className="space-y-2">
                        <label className="text-sm text-fore/60">Dari Wallet</label>
                        <div className="grid gap-2">
                            {wallets.map(w => (
                                <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => setSourceWalletId(w.id)}
                                    disabled={w.id === targetWalletId}
                                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${sourceWalletId === w.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-background-secondary opacity-80 hover:opacity-100'
                                        } ${w.id === targetWalletId ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: w.color }}>
                                            {w.acronym}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">{w.name}</div>
                                            <div className="text-xs text-fore/60">Saldo: {new Intl.NumberFormat('id-ID').format(w.balance || 0)}</div>
                                        </div>
                                    </div>
                                    {sourceWalletId === w.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center -my-2 relative z-10">
                        <div className="bg-background border border-border p-2 rounded-full">
                            <ArrowRightLeft className="w-5 h-5 text-fore/60" />
                        </div>
                    </div>

                    {/* Target Wallet */}
                    <div className="space-y-2">
                        <label className="text-sm text-fore/60">Ke Wallet</label>
                        <div className="grid gap-2">
                            {wallets.map(w => (
                                <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => setTargetWalletId(w.id)}
                                    disabled={w.id === sourceWalletId}
                                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${targetWalletId === w.id
                                        ? 'border-success bg-success/10'
                                        : 'border-border bg-background-secondary opacity-80 hover:opacity-100'
                                        } ${w.id === sourceWalletId ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: w.color }}>
                                            {w.acronym}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">{w.name}</div>
                                            <div className="text-xs text-fore/60">Saldo: {new Intl.NumberFormat('id-ID').format(w.balance || 0)}</div>
                                        </div>
                                    </div>
                                    {targetWalletId === w.id && <div className="w-3 h-3 rounded-full bg-success" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-sm text-fore/60">Jumlah Transfer</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fore/40 font-bold">Rp</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full bg-background-secondary border border-border rounded-xl py-3 pl-12 pr-4 text-xl font-bold focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <label className="text-sm text-fore/60">Catatan (Opsional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Contoh: Bayar utang makan siang"
                            className="w-full bg-background-secondary border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-colors resize-none h-24"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-danger/20 border border-danger/40 text-danger rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Transfer Sekarang'}
                    </button>
                </form>
            </main>
        </div>
    );
}
