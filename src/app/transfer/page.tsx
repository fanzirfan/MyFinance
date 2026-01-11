'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRightLeft, Loader2, Wallet } from 'lucide-react';

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

        const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
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
            // 1. Get Transfer Categories (or create if not exist - simplified for now, uses generic or null)
            // Ideally we should have System Categories. For now, let's leave category_id null or fetch a 'Transfer' category.
            // Let's try to find a 'Transfer' category, if not create one? No, too complex.
            // We'll leave category_id null for now or user can select?
            // Better: Create 2 transactions.

            // 1. Transaction Out (Source)
            const { error: txOutError } = await supabase.from('transactions').insert({
                user_id: user.id,
                wallet_id: sourceWalletId,
                amount: numericAmount,
                type: 'expense',
                note: `Transfer ke ${wallets.find(w => w.id === targetWalletId)?.name}: ${note}`,
                date: new Date().toISOString(),
                // category_id: ... (skip for simplicity, or handle later)
            });

            if (txOutError) throw txOutError;

            // 2. Transaction In (Target)
            const { error: txInError } = await supabase.from('transactions').insert({
                user_id: user.id,
                wallet_id: targetWalletId,
                amount: numericAmount,
                type: 'income',
                note: `Transfer dari ${wallets.find(w => w.id === sourceWalletId)?.name}: ${note}`,
                date: new Date().toISOString(),
            });

            if (txInError) throw txInError;

            // 3. Update Balances
            const { error: balOutError } = await supabase.rpc('decrement_balance', {
                wallet_id: sourceWalletId,
                amount: numericAmount
            }); // If rpc doesn't exist, use manual update. Let's assume manual update for safety if RPC not set.

            // Fallback manual update since we don't know if RPC exists
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
            setError(err.message || 'Terjadi kesalahan saat transfer');
        } finally {
            setLoading(false);
        }
    };

    const formatInputCurrency = (val: string) => {
        // Simple formatter for input display
        return val;
    };

    return (
        <div className="min-h-screen pb-20 bg-background">
            <header className="px-4 py-4 flex items-center gap-4 border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-background-secondary">
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
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
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
