'use client';

import { useState, useEffect } from 'react';
import { supabase, Transaction, Wallet, Category } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
    TrendingUp,
    TrendingDown,
    Wallet as WalletIcon
} from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import BottomNav from '@/components/BottomNav';

const EXPENSE_COLORS = ['#EF4444', '#F97316', '#EC4899', '#8B5CF6', '#E11D48', '#DC2626'];
const INCOME_COLORS = ['#10B981', '#22C55E', '#14B8A6', '#34D399', '#059669', '#047857'];

type Period = 'week' | 'month' | 'year';

export default function DashboardPage() {
    const { user, wallets } = useAuth();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('month');
    const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const displayedBalance = selectedWalletId === 'all'
        ? totalBalance
        : wallets.find(w => w.id === selectedWalletId)?.balance || 0;

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'Selamat Pagi';
        if (hour >= 11 && hour < 15) return 'Selamat Siang';
        if (hour >= 15 && hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const getUserName = () => {
        return user?.user_metadata?.full_name?.split(' ')[0] || 'User';
    };

    // Filter transactions by period and wallet
    const getFilteredTransactions = () => {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }

        let filtered = transactions.filter(t => new Date(t.date) >= startDate);

        if (selectedWalletId !== 'all') {
            filtered = filtered.filter(t => t.wallet_id === selectedWalletId);
        }

        return filtered;
    };

    const filteredTransactions = getFilteredTransactions();

    const fetchData = async () => {
        if (!user) return;

        try {
            // Fetch transactions with related data
            const { data: txData } = await supabase
                .from('transactions')
                .select(`
          *,
          wallet:wallets(*),
          category:categories(*)
        `)
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(100);

            if (txData) setTransactions(txData);

            // Fetch categories
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .or(`user_id.eq.${user.id},user_id.is.null`);

            if (catData) setCategories(catData);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Calculate expense category breakdown for chart (filtered)
    const expenseBreakdown = filteredTransactions
        .filter(t => t.category?.type === 'expense')
        .reduce((acc, t) => {
            const catName = t.category?.name || 'Lainnya';
            acc[catName] = (acc[catName] || 0) + Math.abs(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const expenseChartData = Object.entries(expenseBreakdown).map(([name, value]) => ({
        name,
        value,
    }));

    const totalExpense = expenseChartData.reduce((sum, item) => sum + item.value, 0);

    // Calculate income category breakdown for chart (filtered)
    const incomeBreakdown = filteredTransactions
        .filter(t => t.category?.type === 'income')
        .reduce((acc, t) => {
            const catName = t.category?.name || 'Lainnya';
            acc[catName] = (acc[catName] || 0) + Math.abs(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const incomeChartData = Object.entries(incomeBreakdown).map(([name, value]) => ({
        name,
        value,
    }));

    const totalIncome = incomeChartData.reduce((sum, item) => sum + item.value, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary/30"></div>
                    <div className="h-4 w-32 bg-secondary/30 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 safe-area-inset">
            {/* Header */}
            <header className="px-6 pt-12 pb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        {/* Greeting */}
                        <p className="text-secondary font-medium mb-1">
                            Hi, {getUserName()} 👋
                        </p>
                        <p className="text-fore/60 text-sm">{getGreeting()}</p>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="card p-4 mb-4">
                    <p className="text-fore/60 text-sm mb-1">{selectedWalletId === 'all' ? 'Total Saldo' : 'Saldo Wallet'}</p>
                    <h1 className="text-3xl font-bold">{formatCurrency(displayedBalance)}</h1>
                </div>

                {/* Wallet Pills */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    <button
                        onClick={() => setSelectedWalletId('all')}
                        className={`flex-shrink-0 px-4 py-3 rounded-full border transition-all min-h-[44px] ${selectedWalletId === 'all'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background-secondary border-border text-fore/60'
                            }`}
                    >
                        Semua
                    </button>
                {wallets.map((wallet) => (
                        <button
                            key={wallet.id}
                            onClick={() => setSelectedWalletId(wallet.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-full border transition-all min-h-[44px] ${selectedWalletId === wallet.id
                                ? 'bg-secondary/20 border-secondary'
                                : 'bg-background-secondary border-border'
                                }`}
                        >
                            <div
                                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: wallet.color }}
                            >
                                {wallet.acronym.slice(0, 2)}
                            </div>
                            <span className="font-medium whitespace-nowrap">
                                {formatCurrency(wallet.balance || 0)}
                            </span>
                        </button>
                    ))}
                </div>

            </header>

            {/* Summary Card - Ringkasan Periode */}
            <section className="px-6 mb-6">
                <div className="card p-4">
                    {/* Period Filter - Inline */}
                    <div className="flex gap-1 p-1 bg-background rounded-lg mb-4">
                        <button
                            onClick={() => setPeriod('week')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${period === 'week'
                                ? 'bg-primary text-white'
                                : 'text-fore/60 hover:text-fore'
                                }`}
                        >
                            Minggu
                        </button>
                        <button
                            onClick={() => setPeriod('month')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${period === 'month'
                                ? 'bg-primary text-white'
                                : 'text-fore/60 hover:text-fore'
                                }`}
                        >
                            Bulan
                        </button>
                        <button
                            onClick={() => setPeriod('year')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${period === 'year'
                                ? 'bg-primary text-white'
                                : 'text-fore/60 hover:text-fore'
                                }`}
                        >
                            Tahun
                        </button>
                    </div>

                    {/* Income vs Expense Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Income */}
                        <div className="text-center p-3 rounded-xl bg-success/10">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <TrendingUp className="w-4 h-4 text-success" />
                                <span className="text-xs text-fore/60">Pemasukan</span>
                            </div>
                            <p className="text-success font-bold text-lg">
                                +{formatCurrency(totalIncome)}
                            </p>
                        </div>

                        {/* Expense */}
                        <div className="text-center p-3 rounded-xl bg-danger/10">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <TrendingDown className="w-4 h-4 text-danger" />
                                <span className="text-xs text-fore/60">Pengeluaran</span>
                            </div>
                            <p className="text-danger font-bold text-lg">
                                -{formatCurrency(totalExpense)}
                            </p>
                        </div>
                    </div>

                    {/* Net Balance for Period */}
                    <div className="mt-4 pt-3 border-t border-border text-center">
                        <span className="text-xs text-fore/50">Selisih Periode Ini</span>
                        <p className={`font-bold text-xl ${totalIncome - totalExpense >= 0 ? 'text-success' : 'text-danger'}`}>
                            {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
                        </p>
                    </div>
                </div>
            </section>

            {/* Recent Transactions */}
            <section className="px-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold">Transaksi Terakhir</h2>
                    <button
                        onClick={() => router.push('/transactions')}
                        className="text-secondary text-sm"
                    >
                        Lihat Semua
                    </button>
                </div>

                {transactions.length === 0 ? (
                    <div className="card p-8 text-center">
                        <WalletIcon className="w-12 h-12 mx-auto mb-4 text-fore/30" />
                        <p className="text-fore/60">Belum ada transaksi</p>
                        <p className="text-fore/40 text-sm mt-1">Tekan + untuk menambah transaksi pertama</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="card p-4 flex items-center gap-4">
                                {/* Category Icon */}
                                {(() => {
                                    const CategoryIcon = getCategoryIcon(tx.category?.name || '');
                                    return (
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.category?.type === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}
                                        >
                                            <CategoryIcon className="w-5 h-5" />
                                        </div>
                                    );
                                })()}

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{tx.category?.name || 'Tanpa Kategori'}</p>
                                    <div className="flex items-center gap-2 text-fore/50 text-sm">
                                        <span
                                            className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                                            style={{ backgroundColor: tx.wallet?.color || '#8b5cf6' }}
                                        >
                                            {tx.wallet?.acronym?.slice(0, 2) || '??'}
                                        </span>
                                        <span className="truncate">{tx.note || formatDate(tx.date)}</span>
                                    </div>
                                </div>

                                {/* Amount */}
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
                        ))}
                    </div>
                )}
            </section>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
