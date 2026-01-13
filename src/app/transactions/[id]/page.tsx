'use client';

import { useState, useEffect } from 'react';
import { supabase, Transaction } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Calendar,
    Wallet,
    Tag,
    MessageSquare,
    Trash2,
    Edit,
    Smartphone
} from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

export default function TransactionDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const transactionId = params.id as string;

    useEffect(() => {
        if (user && transactionId) {
            fetchTransaction();
        }
    }, [user, transactionId]);

    const fetchTransaction = async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                wallet:wallets(*),
                category:categories(*)
            `)
            .eq('id', transactionId)
            .eq('user_id', user?.id)
            .single();

        if (error || !data) {
            router.push('/transactions');
            return;
        }

        setTransaction(data);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!transaction) return;

        setDeleting(true);

        // Update wallet balance
        const balanceChange = transaction.category?.type === 'income'
            ? -transaction.amount
            : transaction.amount;

        await supabase
            .from('wallets')
            .update({ balance: (transaction.wallet?.balance || 0) + balanceChange })
            .eq('id', transaction.wallet_id);

        // Delete transaction
        await supabase
            .from('transactions')
            .delete()
            .eq('id', transaction.id);

        router.push('/transactions');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary/30"></div>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return null;
    }

    const CategoryIcon = getCategoryIcon(transaction.category?.name || '');
    const isIncome = transaction.category?.type === 'income';

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <header className="px-4 pt-12 pb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/transactions')}
                            className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold">Detail Transaksi</h1>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-10 h-10 rounded-full bg-danger/20 text-danger flex items-center justify-center"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Amount Card */}
            <div className="px-6 mb-6">
                <div className={`card p-6 text-center ${isIncome ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/30'}`}>
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isIncome ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        <CategoryIcon className="w-8 h-8" />
                    </div>
                    <p className="text-fore/60 mb-2">{transaction.category?.name}</p>
                    <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${isIncome ? 'text-success' : 'text-danger'}`}>
                        {isIncome ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="px-6 space-y-4">
                {/* Date */}
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-fore/60 text-sm">Tanggal</p>
                        <p className="font-medium">{formatDate(transaction.date)}</p>
                    </div>
                </div>

                {/* Wallet */}
                <div className="card p-4 flex items-center gap-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: transaction.wallet?.color || '#8b5cf6' }}
                    >
                        {transaction.wallet?.acronym?.slice(0, 2) || '??'}
                    </div>
                    <div className="flex-1">
                        <p className="text-fore/60 text-sm">Wallet</p>
                        <p className="font-medium">{transaction.wallet?.name}</p>
                    </div>
                </div>

                {/* Category */}
                <div className="card p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        <Tag className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-fore/60 text-sm">Kategori</p>
                        <p className="font-medium">{transaction.category?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${isIncome ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                </div>

                {/* Note */}
                {transaction.note && (
                    <div className="card p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary/30 text-fore/60 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-fore/60 text-sm">Catatan</p>
                            <p className="font-medium">{transaction.note}</p>
                        </div>
                    </div>
                )}

                {/* Source */}
                {transaction.source === 'telegram' && (
                    <div className="card p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-fore/60 text-sm">Sumber</p>
                            <p className="font-medium">Telegram Bot</p>
                        </div>
                    </div>
                )}

                {/* Created At */}
                <div className="card p-4">
                    <p className="text-fore/40 text-xs text-center">
                        Dibuat pada {formatDate(transaction.created_at)} • {formatTime(transaction.created_at)}
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
                    <div className="card p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Hapus Transaksi?</h3>
                        <p className="text-fore/60 mb-6">
                            Transaksi ini akan dihapus permanen dan saldo wallet akan dikembalikan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl bg-secondary/50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-xl bg-danger text-white disabled:opacity-50"
                            >
                                {deleting ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
