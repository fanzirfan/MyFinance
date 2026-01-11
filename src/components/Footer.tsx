'use client';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="fixed bottom-0 left-0 right-0 py-3 px-6 bg-background border-t border-border text-center z-40">
            <p className="text-fore/40 text-xs">
                MyFinance v1.0.0 • © {currentYear} All rights reserved
            </p>
        </footer>
    );
}
