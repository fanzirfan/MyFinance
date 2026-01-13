# MyFinance 💰

MyFinance adalah aplikasi web manajemen keuangan pribadi yang modern, aman, dan mudah digunakan. Aplikasi ini membantu Anda melacak pemasukan, pengeluaran, dan saldo di berbagai dompet (wallet) Anda dalam satu dashboard yang intuitif.

![MyFinance Dashboard Preview](https://via.placeholder.com/800x400?text=MyFinance+Dashboard+Preview)

## ✨ Fitur Utama

- **📊 Dashboard Interaktif**
  - Ringkasan total saldo & chart pengeluaran/pemasukan.
  - Filter data berdasarkan periode (Minggu, Bulan, Tahun).
  - Filter data berdasarkan Wallet tertentu.
  - Greeting message yang dinamis sesuai waktu.

- **👛 Manajemen Multi-Wallet**
  - Buat dan kelola banyak dompet (Bank, E-Wallet, Tunai).
  - Kustomisasi warna dan akronim untuk setiap wallet.

- **💸 Pencatatan Transaksi**
  - Catat Pemasukan dan Pengeluaran dengan mudah.
  - Kategori transaksi dengan **Ikon Intuitif** (Makan, Transport, Gaji, dll).
  - Filter transaksi berdasarkan Tipe (Income/Expense) dan Wallet.

- **📂 Export Data**
  - Unduh riwayat transaksi Anda ke format **CSV** untuk analisis lebih lanjut di Excel/Spreadsheet.

- **🛡️ Keamanan & UI/UX**
  - **Simple Math Captcha** pada Login & Register untuk mencegah bot.
  - **Dark Mode** modern dengan aksen warna yang nyaman di mata.
  - Desain **Mobile-First** yang responsif.
  - **📱 PWA Support**: Install aplikasi ke homescreen HP Anda dan akses secara offline.

- **🤖 Integrasi Telegram Bot (AI Powered)**
  - Catat transaksi semudah chatting! (contoh: *"Beli nasi goreng 15rb pakai GoPay"*).
  - **Auto Categorization**: AI otomatis menentukan kategori dan tipe transaksi.
  - **Cek Saldo Instan**: Tanya saldo kapan saja (contoh: *"Cek saldo BCA"*).
  - **Transfer via Chat**: Pindahkan saldo antar wallet dengan perintah natural (contoh: *"Transfer 50rb Jago ke SPAY"*).

## 🚀 Teknologi yang Digunakan

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 🛠️ Cara Instalasi & Menjalankan

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lokal:

### 1. Clone Repository
```bash
git clone https://github.com/fanzirfan/myfinance.git
cd myfinance
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file contoh `.env` dan sesuaikan dengan kredensial Supabase Anda.

```bash
cp .env.local.example .env.local
```

Isi `.env.local` dengan:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google reCAPTCHA (Optional - for advanced security)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### 4. Setup Database (Supabase)
Pastikan Anda telah membuat tabel berikut di Supabase:
- `wallets` (id, user_id, name, acronym, balance, color, type)
- `categories` (id, user_id, name, type)
- `transactions` (id, user_id, wallet_id, category_id, amount, date, note, type)

*Catatan: Pastikan Row Level Security (RLS) diaktifkan untuk keamanan data per user.*

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📝 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---
*Dibuat dengan ❤️ oleh [FanzIrfan]*
