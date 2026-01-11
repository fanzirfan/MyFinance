'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Pencil, Trash2, Wallet as WalletIcon, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function ManageWalletsPage() {
    const { wallets, refreshWallets } = useAuth();
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus wallet "${name}"? Semua transaksi terkait mungkin juga akan terhapus.`)) return;

        setDeletingId(id);
        try {
            // Check transactions first? Assuming CASCADE or logic handled.
            // Let's try direct delete. If constraint error, we notify.
            const { error } = await supabase.from('wallets').delete().eq('id', id);

            if (error) throw error;

            await refreshWallets();
        } catch (err: any) {
            alert('Gagal menghapus wallet: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-background">
            <header className="px-4 py-4 flex items-center justify-between border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-secondary transition-all active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Kelola Wallet</h1>
                </div>
                <Link href="/wallets/new" className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all active:scale-95">
                    <Plus className="w-6 h-6" />
                </Link>
            </header>

            <main className="p-4 max-w-lg mx-auto space-y-4">
                {wallets.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <WalletIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>Belum ada wallet</p>
                    </div>
                ) : (
                    wallets.map(w => (
                        <div key={w.id} className="card p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg" style={{ backgroundColor: w.color }}>
                                    {w.acronym}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{w.name}</h3>
                                    <p className="text-fore/60 text-sm">
                                        Saldo: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(w.balance || 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/wallets/${w.id}/edit`}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-fore/60 hover:text-primary hover:bg-primary/10 transition-all active:scale-95"
                                >
                                    <Pencil className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(w.id, w.name)}
                                    disabled={deletingId === w.id}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-fore/60 hover:text-danger hover:bg-danger/10 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {deletingId === w.id ? (
                                        <div className="w-5 h-5 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
