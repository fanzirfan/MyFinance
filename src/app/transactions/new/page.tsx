'use client';

import { useState, useEffect } from 'react';
import { supabase, Category, Wallet } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Calendar,
    MessageSquare,
    Loader2,
    Plus,
    X,
    Check
} from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

export default function NewTransactionPage() {
    const { user, wallets, refreshWallets } = useAuth();
    const router = useRouter();
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New category modal
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);

    useEffect(() => {
        if (wallets.length > 0 && !selectedWallet) {
            setSelectedWallet(wallets[0]);
        }
    }, [wallets]);

    useEffect(() => {
        fetchCategories();
    }, [user, type]);

    const fetchCategories = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${user.id},user_id.is.null`)
            .eq('type', type)
            .order('name');

        if (data) {
            setCategories(data);
            setSelectedCategory(null);
        }
    };

    const handleCreateCategory = async () => {
        if (!user || !newCategoryName.trim()) return;

        setSavingCategory(true);
        setCategoryError(null);

        // Check for duplicate (case insensitive)
        const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .or(`user_id.eq.${user.id},user_id.is.null`)
            .eq('type', type)
            .ilike('name', newCategoryName.trim());

        if (existing && existing.length > 0) {
            setCategoryError('Kategori sudah ada');
            setSavingCategory(false);
            return;
        }

        const { data, error } = await supabase
            .from('categories')
            .insert({
                user_id: user.id,
                name: newCategoryName.trim(),
                type,
            })
            .select()
            .single();

        if (error) {
            setCategoryError(error.message);
        } else if (data) {
            setCategories([...categories, data]);
            setSelectedCategory(data);
            setShowNewCategory(false);
            setNewCategoryName('');
        }
        setSavingCategory(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedWallet || !selectedCategory) return;

        setLoading(true);
        setError(null);

        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setError('Masukkan jumlah yang valid');
            setLoading(false);
            return;
        }

        try {
            // Create transaction
            const { error: txError } = await supabase.from('transactions').insert({
                user_id: user.id,
                wallet_id: selectedWallet.id,
                category_id: selectedCategory.id,
                amount: type === 'expense' ? -amountValue : amountValue,
                date: new Date(date).toISOString(),
                note: note.trim() || null,
            });

            if (txError) throw txError;

            // Update wallet balance
            const newBalance = selectedWallet.balance + (type === 'expense' ? -amountValue : amountValue);
            await supabase
                .from('wallets')
                .update({ balance: newBalance })
                .eq('id', selectedWallet.id);

            await refreshWallets();
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (value: string) => {
        const num = value.replace(/\D/g, '');
        return num ? parseInt(num).toLocaleString('id-ID') : '';
    };

    return (
        <div className="min-h-screen pb-8">
            {/* Header */}
            <header className="px-4 pt-12 pb-6 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold">Transaksi Baru</h1>
            </header>

            <form onSubmit={handleSubmit} className="px-6 space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm animate-fadeIn">
                        {error}
                    </div>
                )}

                {/* Type Toggle */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${type === 'expense'
                            ? 'bg-danger text-white'
                            : 'bg-primary/50 text-fore/60'
                            }`}
                    >
                        <TrendingDown className="w-5 h-5" />
                        Pengeluaran
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${type === 'income'
                            ? 'bg-success text-white'
                            : 'bg-primary/50 text-fore/60'
                            }`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        Pemasukan
                    </button>
                </div>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-fore/80">Jumlah</label>
                    <div className="input-wrapper">
                        <span className="input-icon text-lg font-medium">Rp</span>
                        <input
                            type="text"
                            value={formatAmount(amount)}
                            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                            placeholder="0"
                            className="input-field text-2xl font-bold"
                            inputMode="numeric"
                            required
                        />
                    </div>
                </div>

                {/* Wallet Selector */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-fore/80">Dari Wallet</label>
                    <div className="grid grid-cols-3 gap-3">
                        {wallets.map((wallet) => (
                            <button
                                key={wallet.id}
                                type="button"
                                onClick={() => setSelectedWallet(wallet)}
                                className={`p-3 rounded-xl border-2 transition-all ${selectedWallet?.id === wallet.id
                                    ? 'border-secondary bg-secondary/20'
                                    : 'border-transparent bg-primary/50'
                                    }`}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs"
                                    style={{ backgroundColor: wallet.color }}
                                >
                                    {wallet.acronym.slice(0, 2)}
                                </div>
                                <p className="text-xs text-center truncate">{wallet.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category Selector */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-fore/80">Kategori</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                            const CategoryIcon = getCategoryIcon(cat.name);
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${selectedCategory?.id === cat.id
                                        ? 'bg-secondary text-white'
                                        : 'bg-background-secondary border border-border text-fore/70 hover:border-secondary'
                                        }`}
                                >
                                    <CategoryIcon className="w-4 h-4" />
                                    {cat.name}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setShowNewCategory(true)}
                            className="px-4 py-2 rounded-full border border-dashed border-border text-fore/60 flex items-center gap-1 hover:border-secondary"
                        >
                            <Plus className="w-4 h-4" />
                            Baru
                        </button>
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-fore/80">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Tanggal
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input"
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-fore/80">
                        <MessageSquare className="inline w-4 h-4 mr-1" />
                        Catatan (opsional)
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Tambahkan catatan..."
                        className="input"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading || !selectedWallet || !selectedCategory || !amount}
                    className="btn btn-primary w-full"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        'Simpan Transaksi'
                    )}
                </button>
            </form>

            {/* New Category Modal */}
            {showNewCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                    <div className="bg-background w-full max-w-lg rounded-t-3xl p-6 animate-slideUp">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Kategori Baru</h3>
                            <button
                                onClick={() => {
                                    setShowNewCategory(false);
                                    setNewCategoryName('');
                                    setCategoryError(null);
                                }}
                                className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {categoryError && (
                            <div className="p-3 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm mb-4">
                                {categoryError}
                            </div>
                        )}

                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Nama kategori"
                            className="input mb-4"
                            autoFocus
                        />

                        <button
                            onClick={handleCreateCategory}
                            disabled={savingCategory || !newCategoryName.trim()}
                            className="btn btn-primary w-full"
                        >
                            {savingCategory ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    Simpan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
