'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase, TelegramSettings } from '@/lib/supabase';
import { ArrowLeft, LogOut, User, Trash2, Download, Loader2, Key, Mail, Lock, AlertTriangle, Eye, EyeOff, Monitor, Smartphone, Bot, Copy, Check, RefreshCw, Unlink, ExternalLink, Tag, X } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import BottomNav from '@/components/BottomNav';

function MonitorOrMobile({ ua }: { ua: string }) {
    if (ua.indexOf("Mobi") > -1) return <Smartphone className="w-5 h-5 text-primary" />;
    return <Monitor className="w-5 h-5 text-primary" />;
}


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

    // Telegram Bot State
    const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
    const [loadingTelegram, setLoadingTelegram] = useState(true);
    const [generatingToken, setGeneratingToken] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [copied, setCopied] = useState(false);
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'MyFinanceBot';

    // Category Management State
    interface Category { id: string; name: string; type: string; user_id: string | null; }
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
    const [showCategories, setShowCategories] = useState(false);

    // Fetch Telegram settings
    useEffect(() => {
        const fetchTelegramSettings = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('telegram_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();
            setTelegramSettings(data);
            setLoadingTelegram(false);
        };
        fetchTelegramSettings();
        fetchCategories();
    }, [user]);

    const fetchCategories = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id);
        setCategories(data || []);
        setLoadingCategories(false);
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string, categoryType: string) => {
        if (!confirm(`Hapus kategori "${categoryName}"? Transaksi dengan kategori ini akan dipindahkan ke "Lainnya".`)) return;
        setDeletingCategoryId(categoryId);
        try {
            // 1. Cari kategori default "Lainnya" dengan tipe yang sama
            let { data: fallback } = await supabase
                .from('categories')
                .select('id')
                .eq('name', 'Lainnya')
                .eq('type', categoryType)
                .is('user_id', null)
                .maybeSingle();

            // Jika tidak ada "Lainnya", cari kategori default apa saja yang setipe
            if (!fallback) {
                const { data: anyDefault } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('type', categoryType)
                    .is('user_id', null)
                    .limit(1)
                    .maybeSingle();
                fallback = anyDefault;
            }

            if (fallback) {
                // 2. Pindahkan transaksi ke kategori default
                const { error: moveError } = await supabase
                    .from('transactions')
                    .update({ category_id: fallback.id })
                    .eq('category_id', categoryId);

                if (moveError) throw moveError;
            }

            // 3. Hapus kategori
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId)
                .eq('user_id', user?.id);

            if (error) throw error;

            setCategories(prev => prev.filter(c => c.id !== categoryId));
            setMessage({ type: 'success', text: 'Kategori berhasil dihapus dan transaksi dipindahkan.' });
        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Gagal menghapus kategori: ' + err.message });
        } finally {
            setDeletingCategoryId(null);
        }
    };

    const handleGenerateToken = async () => {
        if (!user) return;
        setGeneratingToken(true);
        try {
            const res = await fetch('/api/telegram/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (data.settings) {
                setTelegramSettings(data.settings);
                setMessage({ type: 'success', text: 'Secret key berhasil dibuat!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal membuat secret key' });
        } finally {
            setGeneratingToken(false);
        }
    };

    const handleDisconnectTelegram = async () => {
        if (!user || !confirm('Putuskan koneksi Telegram?')) return;
        setDisconnecting(true);
        try {
            const res = await fetch('/api/telegram/token', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            if (res.ok) {
                setTelegramSettings(prev => prev ? { ...prev, is_connected: false, telegram_user_id: null, telegram_username: null } : null);
                setMessage({ type: 'success', text: 'Telegram berhasil diputus' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal memutus koneksi' });
        } finally {
            setDisconnecting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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

    // Device detection
    const [deviceInfo, setDeviceInfo] = useState<string>('');

    useEffect(() => {
        const ua = window.navigator.userAgent;
        let browser = "Unknown Browser";
        let os = "Unknown OS";

        if (ua.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
        else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
        else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
        else if (ua.indexOf("Trident") > -1) browser = "Microsoft Internet Explorer";
        else if (ua.indexOf("Edge") > -1) browser = "Microsoft Edge";
        else if (ua.indexOf("Chrome") > -1) browser = "Google Chrome";
        else if (ua.indexOf("Safari") > -1) browser = "Apple Safari";

        if (ua.indexOf("Win") > -1) os = "Windows";
        else if (ua.indexOf("Mac") > -1) os = "MacOS";
        else if (ua.indexOf("Linux") > -1) os = "Linux";
        else if (ua.indexOf("Android") > -1) os = "Android";
        else if (ua.indexOf("like Mac") > -1) os = "iOS";

        setDeviceInfo(`${os} • ${browser}`);
    }, []);

    return (
        <div className="min-h-screen pb-24">
            <header className="px-4 pt-8 pb-6">
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
                                <p className="text-xs text-fore/40">Sesi Aktif Saat Ini</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background/50 p-4 rounded-xl space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <MonitorOrMobile ua={typeof window !== 'undefined' ? window.navigator.userAgent : ''} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{deviceInfo}</p>
                                <p className="text-xs text-fore/40">Terakhir aktif: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : 'Baru saja'}</p>
                                <p className="text-xs text-success mt-1">✓ Perangkat Ini</p>
                            </div>
                        </div>
                        <div className="border-t border-border/50 pt-2 text-xs text-fore/40">
                            Masuk via {user?.app_metadata?.provider || 'Email'}
                        </div>
                    </div>

                    <button
                        onClick={handleLogoutAll}
                        disabled={loadingLogoutAll}
                        className="w-full py-2 px-4 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors flex items-center justify-center gap-2"
                    >
                        {loadingLogoutAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        Logout dari Semua Perangkat
                    </button>
                    <p className="text-[10px] text-center text-fore/40">
                        Ini akan mengeluarkan akun Anda dari semua perangkat lain yang sedang login.
                    </p>
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
                                    <div className="input-wrapper relative">
                                        <Mail className="w-5 h-5 text-fore/40 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            placeholder="Email Baru"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            required
                                            className="input-field pl-12"
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
                                        <Lock className="w-5 h-5 text-fore/40 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="Password Baru"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            className="input-field pl-12 pr-10"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-fore/40 hover:text-fore"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="input-wrapper relative">
                                        <Lock className="w-5 h-5 text-fore/40 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="password"
                                            placeholder="Konfirmasi Password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                            className="input-field pl-12"
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

                {/* Telegram Bot Integration */}
                <div className="card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0088cc]/20 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-[#0088cc]" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Telegram Bot</h3>
                            <p className="text-xs text-fore/50">Catat transaksi via chat</p>
                        </div>
                    </div>

                    {loadingTelegram ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-fore/40" />
                        </div>
                    ) : telegramSettings?.is_connected ? (
                        /* Connected State */
                        <div className="space-y-4">
                            <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-success mb-2">
                                    <Check className="w-4 h-4" />
                                    <span className="font-medium text-sm">Terhubung</span>
                                </div>
                                <p className="text-sm text-fore/70">
                                    @{telegramSettings.telegram_username || telegramSettings.telegram_user_id}
                                </p>
                            </div>

                            <button
                                onClick={handleDisconnectTelegram}
                                disabled={disconnecting}
                                className="w-full py-2 px-4 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors flex items-center justify-center gap-2"
                            >
                                {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                Putuskan Koneksi
                            </button>
                        </div>
                    ) : (
                        /* Not Connected State */
                        <div className="space-y-4">
                            {telegramSettings?.connection_token ? (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-fore/70">Secret Key</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-background/50 border border-border rounded-lg px-4 py-3 font-mono text-sm truncate">
                                            {telegramSettings.connection_token}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(telegramSettings.connection_token!)}
                                            className="px-3 rounded-lg bg-primary/50 hover:bg-primary/70 transition-colors"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="bg-background/50 rounded-xl p-4 text-sm space-y-2">
                                        <p className="font-medium">Cara menghubungkan:</p>
                                        <ol className="list-decimal list-inside text-fore/60 space-y-1">
                                            <li>Buka bot <a href={`https://t.me/${botUsername}`} target="_blank" className="text-[#0088cc] hover:underline">@{botUsername}</a></li>
                                            <li>Ketik: <code className="bg-primary/30 px-1 rounded">/start {telegramSettings.connection_token}</code></li>
                                        </ol>
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            href={`https://t.me/${botUsername}?start=${telegramSettings.connection_token}`}
                                            target="_blank"
                                            className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Buka Bot
                                        </a>
                                        <button
                                            onClick={handleGenerateToken}
                                            disabled={generatingToken}
                                            className="px-4 rounded-xl bg-background-secondary border border-border hover:bg-primary/20 transition-colors"
                                            title="Generate ulang secret key"
                                        >
                                            {generatingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateToken}
                                    disabled={generatingToken}
                                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {generatingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                    Generate Secret Key
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Category Management */}
                <div className="card p-6 space-y-4">
                    <button
                        onClick={() => setShowCategories(!showCategories)}
                        className="w-full flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
                                <Tag className="w-5 h-5 text-secondary" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold">Kelola Kategori</h3>
                                <p className="text-xs text-fore/50">{categories.length} kategori custom</p>
                            </div>
                        </div>
                        <span className="text-xs text-fore/40">{showCategories ? 'Tutup' : 'Lihat'}</span>
                    </button>

                    {showCategories && (
                        <div className="space-y-3 pt-4 border-t border-border/50">
                            {loadingCategories ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-fore/40" />
                                </div>
                            ) : categories.length === 0 ? (
                                <p className="text-center text-fore/50 py-4 text-sm">
                                    Tidak ada kategori custom.
                                    <br />
                                    <span className="text-xs">Kategori default tidak bisa dihapus.</span>
                                </p>
                            ) : (
                                <>
                                    <p className="text-xs text-fore/50">Klik tombol hapus untuk menghapus kategori custom:</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {categories.map(cat => (
                                            <div
                                                key={cat.id}
                                                className={`flex items-center justify-between p-3 rounded-xl ${cat.type === 'income' ? 'bg-success/10' : 'bg-danger/10'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${cat.type === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                                        {cat.type === 'income' ? 'Masuk' : 'Keluar'}
                                                    </span>
                                                    <span className="font-medium">{cat.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id, cat.name, cat.type)}
                                                    disabled={deletingCategoryId === cat.id}
                                                    className="w-8 h-8 rounded-full bg-danger/20 text-danger flex items-center justify-center hover:bg-danger/30 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingCategoryId === cat.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <X className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
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

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
