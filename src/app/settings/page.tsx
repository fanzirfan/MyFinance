'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogOut, User, Trash2, Download, Loader2, Key, Mail, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

export default function SettingsPage() {
    const { user, signOut, wallets } = useAuth();
    const router = useRouter();
    const [exporting, setExporting] = useState(false);

    // Change Email State
    const [showChangeEmail, setShowChangeEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [loadingEmail, setLoadingEmail] = useState(false);

    // Change Password State
    const [showChangePw, setShowChangePw] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [loadingPw, setLoadingPw] = useState(false);

    // Feedback
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleExportData = async () => {
        if (!user) return;
        setExporting(true);
        try {
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`*, wallet:wallets(name, acronym), category:categories(name, type)`)
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            if (!transactions?.length) {
                alert('Tidak ada data transaksi.');
                setExporting(false);
                return;
            }

            const rows: string[] = ['Tanggal,Wallet,Kategori,Tipe,Jumlah,Catatan'];
            transactions.forEach((tx) => {
                const date = new Date(tx.date).toLocaleDateString('id-ID');
                const wallet = (tx.wallet?.name || '-').replace(/,/g, ' ');
                const category = (tx.category?.name || '-').replace(/,/g, ' ');
                const type = tx.category?.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
                const note = (tx.note || '-').replace(/,/g, ' ');
                rows.push(`${date},${wallet},${category},${type},${tx.amount},${note}`);
            });

            // Add balances
            rows.push('', 'SALDO DOMPET');
            wallets.forEach(w => rows.push(`${w.name},${w.balance}`));

            const csvContent = '\uFEFF' + rows.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `MyFinance_Export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            console.error(error);
            alert('Gagal mengekspor data.');
        } finally {
            setExporting(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingEmail(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Email konfirmasi telah dikirim ke alamat baru. Silakan cek inbox Anda.' });
            setNewEmail('');
            setShowChangeEmail(false);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoadingEmail(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password konfirmasi tidak cocok.' });
            return;
        }
        setLoadingPw(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password berhasil diubah.' });
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePw(false);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoadingPw(false);
        }
    };

    const [loadingLogoutAll, setLoadingLogoutAll] = useState(false);

    const handleLogoutAll = async () => {
        if (!confirm('Anda akan keluar dari semua perangkat yang terhubung (HP, Laptop, dll). Anda harus login ulang di semua perangkat. Lanjutkan?')) return;
        setLoadingLogoutAll(true);
        try {
            // @ts-ignore - scope might not be typed in some versions
            const { error } = await supabase.auth.signOut({ scope: 'global' });
            if (error) throw error;
            router.push('/login');
        } catch (error: any) {
            alert('Gagal logout global: ' + error.message);
            setLoadingLogoutAll(false);
        }
    };

    return (
        <div className="min-h-screen pb-24">
            <header className="px-4 pt-12 pb-6 flex items-center gap-4">
                <button onClick={() => router.push('/dashboard')} className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold">Pengaturan</h1>
            </header>

            <div className="px-6 space-y-4">
                {message && (
                    <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Info & Session */}
                <div className="card p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                            <User className="w-8 h-8 text-secondary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-fore/60 text-sm truncate">{user?.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                                <p className="text-xs text-fore/40">Sesi Aktif</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-fore/40 bg-background/50 p-3 rounded-lg">
                        <div>
                            <p className="font-semibold text-fore/60">Last Sign In:</p>
                            <p>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : '-'}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-fore/60">Provider:</p>
                            <p>{user?.app_metadata?.provider || 'Email'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogoutAll}
                        disabled={loadingLogoutAll}
                        className="w-full py-2 px-4 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors flex items-center justify-center gap-2"
                    >
                        {loadingLogoutAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        Keluar dari Semua Perangkat
                    </button>
                </div>

                {/* Account Actions */}
                <div className="card overflow-hidden">
                    {/* Change Email */}
                    <div className="border-b border-border/50">
                        <button
                            onClick={() => setShowChangeEmail(!showChangeEmail)}
                            className="w-full flex items-center justify-between p-4 hover:bg-background-secondary transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-fore/60" />
                                <span>Ganti Email</span>
                            </div>
                            <span className="text-xs text-fore/40">{showChangeEmail ? 'Batal' : 'Edit'}</span>
                        </button>

                        {showChangeEmail && (
                            <form onSubmit={handleUpdateEmail} className="p-4 bg-background/30 animate-slideDown">
                                <div className="space-y-3">
                                    <div className="input-wrapper">
                                        <Mail className="w-4 h-4 text-fore/40 absolute left-3 top-3.5" />
                                        <input
                                            type="email"
                                            placeholder="Email Baru"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            required
                                            className="input-field pl-10"
                                        />
                                    </div>
                                    <button type="submit" disabled={loadingEmail} className="btn btn-primary w-full text-sm">
                                        {loadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Konfirmasi'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Change Password */}
                    <div className="border-b border-border/50">
                        <button
                            onClick={() => setShowChangePw(!showChangePw)}
                            className="w-full flex items-center justify-between p-4 hover:bg-background-secondary transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Key className="w-5 h-5 text-fore/60" />
                                <span>Ganti Password</span>
                            </div>
                            <span className="text-xs text-fore/40">{showChangePw ? 'Batal' : 'Edit'}</span>
                        </button>

                        {showChangePw && (
                            <form onSubmit={handleUpdatePassword} className="p-4 bg-background/30 animate-slideDown">
                                <div className="space-y-3">
                                    <div className="input-wrapper relative">
                                        <Lock className="w-4 h-4 text-fore/40 absolute left-3 top-3.5" />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="Password Baru"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            className="input-field pl-10 pr-10"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-3 text-fore/40 hover:text-fore"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="input-wrapper">
                                        <Lock className="w-4 h-4 text-fore/40 absolute left-3 top-3.5" />
                                        <input
                                            type="password"
                                            placeholder="Konfirmasi Password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                            className="input-field pl-10"
                                            minLength={6}
                                        />
                                    </div>
                                    <button type="submit" disabled={loadingPw} className="btn btn-primary w-full text-sm">
                                        {loadingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Export */}
                    <button
                        onClick={handleExportData}
                        disabled={exporting}
                        className="w-full flex items-center gap-4 p-4 hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                        {exporting ? (
                            <Loader2 className="w-5 h-5 text-fore/60 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 text-fore/60" />
                        )}
                        <span>{exporting ? 'Mengekspor...' : 'Ekspor Data CSV'}</span>
                    </button>
                </div>

                <div className="card overflow-hidden border-danger/20">
                    <button
                        onClick={() => {
                            if (confirm('Fitur ini belum tersedia untuk alasan keamanan. Hubungi admin untuk menghapus akun.')) {
                                // Delete logic unimplemented
                            }
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-danger/10 transition-colors text-danger"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span>Hapus Permanen Akun</span>
                    </button>
                </div>

                <button
                    onClick={signOut}
                    className="btn w-full bg-background-tertiary text-fore border border-border mt-8"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Keluar Sesi
                </button>

                <p className="text-center text-fore/40 text-sm mt-8">
                    {APP_CONFIG.name} v{APP_CONFIG.version}
                </p>
            </div>
        </div>
    );
}
