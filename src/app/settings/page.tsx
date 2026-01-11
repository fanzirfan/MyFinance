'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogOut, User, Trash2, Download, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { user, signOut, wallets } = useAuth();
    const router = useRouter();
    const [exporting, setExporting] = useState(false);

    const handleExportData = async () => {
        if (!user) return;

        setExporting(true);

        try {
            // Fetch all transactions with related data
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    wallet:wallets(name, acronym),
                    category:categories(name, type)
                `)
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!transactions || transactions.length === 0) {
                alert('Tidak ada data transaksi untuk diekspor');
                setExporting(false);
                return;
            }

            // Create CSV rows
            const rows: string[] = [];

            // Header
            rows.push('Tanggal,Wallet,Kategori,Tipe,Jumlah,Catatan');

            // Data rows
            transactions.forEach((tx) => {
                const date = new Date(tx.date).toLocaleDateString('id-ID');
                const wallet = (tx.wallet?.name || '-').replace(/,/g, ' ');
                const category = (tx.category?.name || '-').replace(/,/g, ' ');
                const type = tx.category?.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
                const amount = Math.abs(tx.amount);
                const note = (tx.note || '-').replace(/,/g, ' ').replace(/\n/g, ' ');

                rows.push(`${date},${wallet},${category},${type},${amount},${note}`);
            });

            // Summary
            const totalIncome = transactions
                .filter(t => t.category?.type === 'income')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const totalExpense = transactions
                .filter(t => t.category?.type === 'expense')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            rows.push('');
            rows.push('RINGKASAN');
            rows.push(`Total Pemasukan,,,Pemasukan,${totalIncome},`);
            rows.push(`Total Pengeluaran,,,Pengeluaran,${totalExpense},`);
            rows.push(`Selisih,,,,${totalIncome - totalExpense},`);

            // Wallet balances
            rows.push('');
            rows.push('SALDO WALLET');
            wallets.forEach(w => {
                rows.push(`${w.name},${w.acronym},,,${w.balance},`);
            });

            // Create CSV content with BOM for Excel
            const csvContent = '\uFEFF' + rows.join('\r\n');

            // Generate filename
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const filename = `MyFinance_Export_${dateStr}.csv`;

            // Use data URI with base64 encoding
            const base64 = btoa(unescape(encodeURIComponent(csvContent)));
            const dataUri = `data:text/csv;base64,${base64}`;

            const link = document.createElement('a');
            link.href = dataUri;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Data berhasil diekspor sebagai ' + filename);
        } catch (error) {
            console.error('Export error:', error);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <header className="px-4 pt-12 pb-6 flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold">Pengaturan</h1>
            </header>

            <div className="px-6 space-y-4">
                {/* Profile Card */}
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                            <User className="w-8 h-8 text-secondary" />
                        </div>
                        <div>
                            <p className="font-semibold">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-fore/60 text-sm">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="card overflow-hidden">
                    <button
                        onClick={handleExportData}
                        disabled={exporting}
                        className="w-full flex items-center gap-4 p-4 hover:bg-primary/30 transition-colors disabled:opacity-50"
                    >
                        {exporting ? (
                            <Loader2 className="w-5 h-5 text-fore/60 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 text-fore/60" />
                        )}
                        <span>{exporting ? 'Mengekspor...' : 'Ekspor Data'}</span>
                    </button>

                    <div className="border-t border-border" />

                    <button
                        onClick={() => {
                            if (confirm('Yakin ingin menghapus akun? Semua data akan hilang permanen.')) {
                                // Delete account functionality
                            }
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-danger/10 transition-colors text-danger"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span>Hapus Akun</span>
                    </button>
                </div>

                {/* Logout Button */}
                <button
                    onClick={signOut}
                    className="btn w-full bg-background-tertiary text-fore border border-border"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Keluar
                </button>

                {/* App Version */}
                <p className="text-center text-fore/40 text-sm mt-8">
                    MyFinance v1.0.0
                </p>
            </div>
        </div>
    );
}

