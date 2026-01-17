'use client';

import { useState, useEffect } from 'react';
import { supabase, Transaction } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Filter,
    Calendar
} from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import BottomNav from '@/components/BottomNav';

export default function TransactionsPage() {
    const { user, wallets } = useAuth();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    const fetchTransactions = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('transactions')
            .select(`
        *,
        wallet:wallets(*),
        category:categories(*)
      `)
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (data) setTransactions(data);
        setLoading(false);
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
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter = filter === 'all' || tx.category?.type === filter;
        const matchesWallet = selectedWalletId === 'all' || tx.wallet_id === selectedWalletId;
        return matchesFilter && matchesWallet;
    });

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
        const dateKey = tx.date.split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary/30"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <header className="px-4 pt-8 pb-6">
                <h1 className="text-xl font-bold mb-4">Semua Transaksi</h1>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {(['all', 'income', 'expense'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f
                                ? f === 'income'
                                    ? 'bg-success text-white'
                                    : f === 'expense'
                                        ? 'bg-danger text-white'
                                        : 'bg-secondary text-white'
                                : 'bg-primary/50 text-fore/60'
                                }`}
                        >
                            {f === 'all' ? 'Semua' : f === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </button>
                    ))}
                </div>

                {/* Wallet Filter */}
                <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
                    <button
                        onClick={() => setSelectedWalletId('all')}
                        className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm transition-all ${selectedWalletId === 'all'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background-secondary border-border text-fore/60'
                            }`}
                    >
                        Semua Wallet
                    </button>
                    {wallets.map((w) => (
                        <button
                            key={w.id}
                            onClick={() => setSelectedWalletId(w.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${selectedWalletId === w.id
                                ? 'bg-secondary/20 border-secondary'
                                : 'bg-background-secondary border-border'
                                }`}
                        >
                            <div
                                className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ backgroundColor: w.color }}
                            >
                                {w.acronym.slice(0, 2)}
                            </div>
                            <span className="whitespace-nowrap">{w.name}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Transaction List */}
            < div className="px-6" >
                {
                    Object.keys(groupedTransactions).length === 0 ? (
                        <div className="text-center py-12 text-fore/50">
                            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Tidak ada transaksi</p>
                        </div>
                    ) : (
                        Object.entries(groupedTransactions).map(([date, txs]) => (
                            <div key={date} className="mb-6">
                                <div className="flex items-center gap-2 mb-3 text-fore/60">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-medium">{formatDate(date)}</span>
                                </div>
                                <div className="space-y-3">
                                    {txs.map((tx) => {
                                        const CategoryIcon = getCategoryIcon(tx.category?.name || '');
                                        return (
                                            <div
                                                key={tx.id}
                                                onClick={() => router.push(`/transactions/${tx.id}`)}
                                                className="card p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                                            >
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.category?.type === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}
                                                >
                                                    <CategoryIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{tx.category?.name}</p>
                                                    <div className="flex items-center gap-2 text-fore/50 text-sm">
                                                        <span
                                                            className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                                                            style={{ backgroundColor: tx.wallet?.color || '#8b5cf6' }}
                                                        >
                                                            {tx.wallet?.acronym?.slice(0, 2) || '??'}
                                                        </span>
                                                        <span className="truncate">{tx.note || tx.wallet?.name}</span>
                                                    </div>
                                                </div>
                                                <div className={`text-right ${tx.category?.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                                    <div className="flex items-center gap-1">
                                                        {tx.category?.type === 'income' ? (
                                                            <TrendingUp className="w-4 h-4" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4" />
                                                        )}
                                                        <span className="font-semibold">
                                                            {tx.category?.type === 'income' ? '+' : '-'}
                                                            {formatCurrency(Math.abs(tx.amount))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )
                }
            </div >

            {/* Bottom Navigation */}
            <BottomNav />
        </div >
    );
}
