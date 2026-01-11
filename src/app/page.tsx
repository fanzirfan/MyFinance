'use client';

import Link from 'next/link';
import { Wallet, ArrowRight, PieChart, Shield, Smartphone } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="animate-slideUp">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 relative">
              <Image
                src="/logo.png"
                alt="MyFinance Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-fore to-secondary bg-clip-text text-transparent">
            MyFinance
          </h1>

          <p className="text-fore/70 text-lg mb-12 max-w-sm mx-auto">
            Kelola keuanganmu dengan mudah. Lacak pemasukan, pengeluaran, dan visualisasikan kebiasaan finansialmu.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <Link href="/register" className="btn btn-primary w-full">
              Mulai Sekarang
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link href="/login" className="btn bg-primary/50 text-fore w-full">
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 pb-16">
        <div className="grid gap-4">
          <div className="card p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <PieChart className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Visualisasi Data</h3>
              <p className="text-fore/60 text-sm">
                Lihat breakdown pengeluaranmu per kategori dengan chart yang cantik
              </p>
            </div>
          </div>

          <div className="card p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Multi Wallet</h3>
              <p className="text-fore/60 text-sm">
                Kelola berbagai sumber dana - bank, e-wallet, cash dalam satu tempat
              </p>
            </div>
          </div>

          <div className="card p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-fore" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Mobile First</h3>
              <p className="text-fore/60 text-sm">
                Didesain untuk ponsel, nyaman digunakan kapan saja
              </p>
            </div>
          </div>

          <div className="card p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-danger" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Data Aman</h3>
              <p className="text-fore/60 text-sm">
                Datamu tersimpan dengan aman dan hanya bisa diakses olehmu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-fore/40 text-sm border-t border-muted">
        <p>© 2026 MyFinance. All rights reserved.</p>
      </footer>
    </div>
  );
}
