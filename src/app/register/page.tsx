'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import Recaptcha from '@/components/Recaptcha';
import { APP_CONFIG } from '@/lib/config';

export default function RegisterPage() {
    // ...

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!captchaVerified) {
            setError('Silakan selesaikan verifikasi terlebih dahulu');
            return;
        }

        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Password tidak cocok');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Auto redirect after 2 seconds
                setTimeout(() => router.push('/login'), 2000);
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="animate-slideUp">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Pendaftaran Berhasil!</h2>
                    <p className="text-fore/60">Silakan cek email untuk verifikasi akun</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 py-12">
            <div className="animate-slideUp">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 relative">
                            <Image
                                src="/logo.png"
                                alt="MyFinance Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Buat Akun</h1>
                    <p className="text-fore/60">Mulai perjalanan finansialmu</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-5">
                    {error && (
                        <div className="p-4 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm animate-fadeIn">
                            {error}
                        </div>
                    )}

                    <div className="input-wrapper">
                        <div className="input-icon">
                            <User className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nama lengkap"
                            required
                            className="input-field"
                            autoComplete="name"
                        />
                    </div>

                    <div className="input-wrapper">
                        <div className="input-icon">
                            <Mail className="w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="input-field"
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-wrapper">
                        <div className="input-icon">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="input-field pr-12"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="input-icon-right"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="input-wrapper">
                        <div className="input-icon">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Konfirmasi password"
                            required
                            className="input-field pr-12"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="input-icon-right"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Captcha */}
                    <Recaptcha onChange={(token) => setCaptchaVerified(!!token)} />

                    <button
                        type="submit"
                        disabled={loading || !captchaVerified}
                        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Daftar
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center mt-8 text-fore/60">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-secondary font-semibold hover:underline">
                        Masuk
                    </Link>
                </p>

                <p className="text-center mt-8 text-fore/40 text-xs">
                    {APP_CONFIG.name} v{APP_CONFIG.version} • © {APP_CONFIG.year}
                </p>
            </div>
        </div>
    );
}
