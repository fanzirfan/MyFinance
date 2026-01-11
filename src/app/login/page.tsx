'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Recaptcha from '@/components/Recaptcha';
import { APP_CONFIG } from '@/lib/config';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!captchaVerified) {
            setError('Silakan selesaikan verifikasi terlebih dahulu');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 py-12">
            <div className="animate-slideUp">
                {/* Logo/Brand */}
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
                    <h1 className="text-4xl font-bold mb-2">MyFinance</h1>
                    <p className="text-fore/60">Kelola keuanganmu dengan mudah</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="p-4 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm animate-fadeIn">
                            {error}
                        </div>
                    )}

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
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="input-field"
                            autoComplete="current-password"
                        />
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
                                Masuk
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </form>

                {/* Register Link */}
                <p className="text-center mt-8 text-fore/60">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-secondary font-semibold hover:underline">
                        Daftar sekarang
                    </Link>
                </p>

                {/* Footer */}
                <p className="text-center mt-8 text-fore/40 text-xs">
                    {APP_CONFIG.name} v{APP_CONFIG.version} • © {APP_CONFIG.year}
                </p>
            </div>
        </div>
    );
}

