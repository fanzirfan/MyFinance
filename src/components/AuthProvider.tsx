'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Wallet } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    wallets: Wallet[];
    loading: boolean;
    signOut: () => Promise<void>;
    refreshWallets: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/register'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const refreshWallets = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setWallets(data);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setWallets([]);
        router.push('/login');
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Fetch wallets when user changes
    useEffect(() => {
        if (user) {
            refreshWallets();
        }
    }, [user]);

    // Route protection logic
    useEffect(() => {
        if (loading) return;

        // Normalize pathname by removing trailing slash for comparison
        const normalizedPathname = pathname.endsWith('/') && pathname.length > 1
            ? pathname.slice(0, -1)
            : pathname;
        const isPublicRoute = publicRoutes.includes(normalizedPathname);

        if (!user && !isPublicRoute) {
            router.push('/login');
        } else if (user && isPublicRoute) {
            router.push('/dashboard');
        } else if (user && wallets.length === 0 && pathname !== '/setup-wallet' && !loading) {
            // Check if wallets are still loading
            const checkWallets = async () => {
                const { data } = await supabase
                    .from('wallets')
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1);

                if (!data || data.length === 0) {
                    router.push('/setup-wallet');
                }
            };
            checkWallets();
        }
    }, [user, wallets, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, session, wallets, loading, signOut, refreshWallets }}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-secondary/30"></div>
                        <div className="h-4 w-32 bg-secondary/30 rounded"></div>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
