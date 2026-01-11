'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Loader2
} from 'lucide-react';

const PRESET_COLORS = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
];

export default function WalletsPage() {
    const { wallets, refreshWallets } = useAuth();
    const router = useRouter();
    const [showNewWallet, setShowNewWallet] = useState(false);
    const [name, setName] = useState('');
    const [acronym, setAcronym] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [balance, setBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { user } = useAuth();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (!acronym || acronym === name.slice(0, 4).toUpperCase()) {
            setAcronym(value.slice(0, 4).toUpperCase());
        }
    };

    // Format number with thousand separator (dots)
    const formatNumber = (value: string) => {
        const num = value.replace(/\D/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Parse formatted number back to plain number
    const parseFormattedNumber = (value: string) => {
        return value.replace(/\./g, '');
    };

    const handleBalanceChange = (value: string) => {
        const plainNumber = parseFormattedNumber(value);
        setBalance(formatNumber(plainNumber));
    };

    const handleCreate = async () => {
        if (!user || !name.trim() || !acronym.trim()) return;

        setLoading(true);
        const { error } = await supabase.from('wallets').insert({
            user_id: user.id,
            name: name.trim(),
            acronym: acronym.toUpperCase().trim(),
            color,
            balance: parseFloat(parseFormattedNumber(balance)) || 0,
        });

        if (!error) {
            await refreshWallets();
            setShowNewWallet(false);
            setName('');
            setAcronym('');
            setBalance('');
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (wallets.length <= 1) {
            alert('Minimal harus ada 1 wallet');
            return;
        }

        if (!confirm('Hapus wallet ini? Semua transaksi terkait akan ikut terhapus.')) return;

        setDeletingId(id);
        await supabase.from('transactions').delete().eq('wallet_id', id);
        await supabase.from('wallets').delete().eq('id', id);
        await refreshWallets();
        setDeletingId(null);
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <header className="px-4 pt-12 pb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Wallet Saya</h1>
                </div>
                <button
                    onClick={() => setShowNewWallet(true)}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            {/* Wallet List */}
            <div className="px-6 space-y-4">
                {wallets.map((wallet) => (
                    <div key={wallet.id} className="card p-4 flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: wallet.color }}
                        >
                            {wallet.acronym.slice(0, 2)}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{wallet.name}</p>
                            <p className="text-fore/60 text-sm">{wallet.acronym}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">{formatCurrency(wallet.balance || 0)}</p>
                            <button
                                onClick={() => handleDelete(wallet.id)}
                                disabled={deletingId === wallet.id}
                                className="text-danger text-sm mt-1 flex items-center gap-1 ml-auto"
                            >
                                {deletingId === wallet.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Wallet Modal */}
            {showNewWallet && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                    <div className="bg-background w-full max-w-lg rounded-t-3xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-6">Wallet Baru</h3>

                        {/* Preview */}
                        <div className="flex justify-center mb-6">
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                                style={{ backgroundColor: color }}
                            >
                                {acronym || '???'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Nama wallet"
                                className="input"
                            />

                            <input
                                type="text"
                                value={acronym}
                                onChange={(e) => setAcronym(e.target.value.slice(0, 4).toUpperCase())}
                                placeholder="Singkatan (max 4)"
                                maxLength={4}
                                className="input text-center font-bold"
                            />

                            <div className="flex flex-wrap gap-3 justify-center">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-10 h-10 rounded-xl ${color === c ? 'ring-4 ring-fore/30 scale-110' : ''
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>

                            <div className="input-wrapper">
                                <span className="input-icon text-base font-medium">Rp</span>
                                <input
                                    type="text"
                                    value={balance}
                                    onChange={(e) => handleBalanceChange(e.target.value)}
                                    placeholder="Saldo awal (opsional)"
                                    className="input-field"
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowNewWallet(false)}
                                className="flex-1 btn bg-primary/50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !name.trim() || !acronym.trim()}
                                className="flex-1 btn btn-primary"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
