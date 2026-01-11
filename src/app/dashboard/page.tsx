'use client';

import { useState, useEffect } from 'react';
import { supabase, Transaction, Wallet, Category } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Wallet as WalletIcon,
    Settings,
    LogOut,
    RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getCategoryIcon } from '@/lib/categoryIcons';

const EXPENSE_COLORS = ['#EF4444', '#F97316', '#EC4899', '#8B5CF6', '#E11D48', '#DC2626'];
const INCOME_COLORS = ['#10B981', '#22C55E', '#14B8A6', '#34D399', '#059669', '#047857'];

type Period = 'week' | 'month' | 'year';

export default function DashboardPage() {
    const { user, wallets, signOut } = useAuth();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

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
                    <div className="flex gap-2">
                        <button
                            onClick={handleRefresh}
                            className="w-10 h-10 rounded-full bg-background-secondary border border-border flex items-center justify-center"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => router.push('/settings')}
                            className="w-10 h-10 rounded-full bg-background-secondary border border-border flex items-center justify-center"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
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
                        className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${selectedWalletId === 'all'
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
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${selectedWalletId === wallet.id
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
                    <button
                        onClick={() => router.push('/wallets/new')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-border text-fore/60"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="whitespace-nowrap">Tambah</span>
                    </button>
                </div>
            </header>

            {/* Period Filter */}
            <section className="px-6 mb-4">
                <div className="flex gap-2 p-1 bg-background-secondary rounded-xl">
                    <button
                        onClick={() => setPeriod('week')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${period === 'week'
                            ? 'bg-primary text-white'
                            : 'text-fore/60 hover:text-fore'
                            }`}
                    >
                        Minggu
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${period === 'month'
                            ? 'bg-primary text-white'
                            : 'text-fore/60 hover:text-fore'
                            }`}
                    >
                        Bulan
                    </button>
                    <button
                        onClick={() => setPeriod('year')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${period === 'year'
                            ? 'bg-primary text-white'
                            : 'text-fore/60 hover:text-fore'
                            }`}
                    >
                        Tahun
                    </button>
                </div>
            </section>

            {/* Chart Section */}
            <section className="px-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expense Chart */}
                    {expenseChartData.length > 0 && (
                        <div className="card p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingDown className="w-5 h-5 text-danger" />
                                <h2 className="font-semibold">Pengeluaran</h2>
                            </div>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {expenseChartData.map((_, index) => (
                                                <Cell key={`expense-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: '#1c1c1f',
                                                border: '1px solid #3f3f46',
                                                borderRadius: '8px',
                                                color: '#f5f5f7'
                                            }}
                                            itemStyle={{ color: '#f5f5f7' }}
                                            labelStyle={{ color: '#a1a1aa' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-danger font-bold text-lg mb-2">
                                {formatCurrency(totalExpense)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {expenseChartData.slice(0, 4).map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-1 text-xs">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                                        />
                                        <span className="text-fore/70">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Income Chart */}
                    {incomeChartData.length > 0 && (
                        <div className="card p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-success" />
                                <h2 className="font-semibold">Pemasukan</h2>
                            </div>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {incomeChartData.map((_, index) => (
                                                <Cell key={`income-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: '#1c1c1f',
                                                border: '1px solid #3f3f46',
                                                borderRadius: '8px',
                                                color: '#f5f5f7'
                                            }}
                                            itemStyle={{ color: '#f5f5f7' }}
                                            labelStyle={{ color: '#a1a1aa' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-success font-bold text-lg mb-2">
                                {formatCurrency(totalIncome)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {incomeChartData.slice(0, 4).map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-1 text-xs">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                                        />
                                        <span className="text-fore/70">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state if no charts */}
                    {expenseChartData.length === 0 && incomeChartData.length === 0 && (
                        <div className="card p-6 text-center col-span-full">
                            <p className="text-fore/60">Belum ada data transaksi untuk chart</p>
                        </div>
                    )}
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

            {/* Floating Action Button */}
            <button
                onClick={() => router.push('/transactions/new')}
                className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-all hover:scale-105 active:scale-95"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
    );
}
