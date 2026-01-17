'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Receipt, Wallet, Settings, Plus } from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Beranda' },
    { href: '/transactions', icon: Receipt, label: 'Transaksi' },
    // FAB placeholder - handled separately
    { href: '/wallets', icon: Wallet, label: 'Wallet' },
    { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    // Split nav items: 2 left, FAB center, 2 right
    const leftItems = navItems.slice(0, 2);
    const rightItems = navItems.slice(2);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
            {/* Background bar */}
            <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-muted" />
            
            <div className="relative max-w-lg mx-auto flex justify-around items-center h-16 px-2 safe-area-inset">
                {/* Left nav items */}
                {leftItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-all ${
                                isActive 
                                    ? 'text-secondary' 
                                    : 'text-fore/50 hover:text-fore/70'
                            }`}
                        >
                            <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Center FAB - Elevated */}
                <div className="relative flex flex-col items-center justify-center">
                    <button
                        onClick={() => router.push('/transactions/new')}
                        className="relative flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-secondary to-primary shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-primary/40"
                        aria-label="Tambah Transaksi"
                    >
                        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </button>
                    {/* Label below FAB */}
                    <span className="text-[10px] font-medium text-fore/50 mt-1">Catat</span>
                </div>

                {/* Right nav items */}
                {rightItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-all ${
                                isActive 
                                    ? 'text-secondary' 
                                    : 'text-fore/50 hover:text-fore/70'
                            }`}
                        >
                            <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
