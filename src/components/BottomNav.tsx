'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, Wallet, Settings } from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Beranda' },
    { href: '/transactions', icon: Receipt, label: 'Transaksi' },
    { href: '/wallets', icon: Wallet, label: 'Wallet' },
    { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-muted safe-area-inset">
            <div className="max-w-lg mx-auto flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${isActive ? 'text-secondary' : 'text-fore/50'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
