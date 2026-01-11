'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Wallet, Palette, Tag, ArrowRight, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
];

export default function EditWalletPage() {
    const params = useParams();
    const router = useRouter();
    const { user, refreshWallets } = useAuth();

    // State
    const [name, setName] = useState('');
    const [acronym, setAcronym] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [balance, setBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const walletId = params.id as string;

    // Fetch Wallet Data
    useEffect(() => {
        const fetchWallet = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('id', walletId)
                .single();

            if (error) {
                setError('Gagal memuat data wallet');
                setFetching(false);
                return;
            }

            if (data) {
                setName(data.name);
                setAcronym(data.acronym);
                setColor(data.color);
                // For edit, we might want to allow balance edit or not due to sync with transactions.
                // Usually direct balance edit is discouraged if it breaks transaction history.
                // But user asked for "edit wallet", often implies fixing mistakes.
                // Let's allow it but maybe warn? Or just allow it.
                setBalance(formatNumber(data.balance.toString()));
            }
            setFetching(false);
        };

        fetchWallet();
    }, [user, walletId]);

    // Helpers
    const formatNumber = (value: string) => {
        const num = value.replace(/\D/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const parseFormattedNumber = (value: string) => {
        return value.replace(/\./g, '');
    };

    const handleBalanceChange = (value: string) => {
        const plainNumber = parseFormattedNumber(value);
        setBalance(formatNumber(plainNumber));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('wallets')
                .update({
                    name: name.trim(),
                    acronym: acronym.toUpperCase().trim(),
                    color,
                    balance: parseFloat(parseFormattedNumber(balance)) || 0,
                })
                .eq('id', walletId);

            if (error) {
                setError(error.message);
            } else {
                await refreshWallets();
                router.push('/wallets');
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col px-6 py-6 pb-24 bg-background">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center hover:bg-primary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Edit Wallet</h1>
            </div>

            <div className="animate-slideUp flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm animate-fadeIn">
                            {error}
                        </div>
                    )}

                    {/* Preview */}
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-all"
                            style={{ backgroundColor: color }}
                        >
                            {acronym || '???'}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-fore/80">
                            Nama Wallet
                        </label>
                        <div className="input-wrapper">
                            <Tag className="input-icon" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nama Wallet"
                                required
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Acronym */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-fore/80">
                            Singkatan (max 4 huruf)
                        </label>
                        <input
                            type="text"
                            value={acronym}
                            onChange={(e) => setAcronym(e.target.value.slice(0, 4).toUpperCase())}
                            placeholder="WLT"
                            maxLength={4}
                            required
                            className="input text-center font-bold text-xl tracking-wider"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium mb-3 text-fore/80">
                            <Palette className="inline w-4 h-4 mr-1" />
                            Warna
                        </label>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-12 h-12 rounded-xl transition-all ${color === c ? 'ring-4 ring-fore/30 scale-110' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Balance */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-fore/80">
                            Saldo Saat Ini
                        </label>
                        <p className="text-xs text-fore/40 mb-2">Mengubah saldo secara manual akan mengubah kalkulasi total tanpa mencatat transaksi.</p>
                        <div className="input-wrapper">
                            <span className="input-icon text-base font-medium">Rp</span>
                            <input
                                type="text"
                                value={balance}
                                onChange={(e) => handleBalanceChange(e.target.value)}
                                placeholder="0"
                                className="input-field font-semibold"
                                inputMode="numeric"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full mt-8"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Simpan Perubahan
                                <Save className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
