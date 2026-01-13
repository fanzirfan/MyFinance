# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-01-14

### Added
- **Telegram Bot Integration**:
  - **Natural Language Processing (NLP)**: Mencatat transaksi dengan bahasa alami (contoh: "Beli kopi 25rb pakai Jago").
  - **Smart Category Detection**: Otomatis mendeteksi kategori dan tipe (Income/Expense/Transfer) dari teks.
  - **Auto Transfer**: Mendeteksi perintah transfer antar wallet (contoh: "Transfer 50rb Jago ke SPAY") dan membuat dua transaksi (Pengeluaran & Pemasukan) secara otomatis.
  - **Cek Saldo**: Fitur cek saldo instan via perintah `/ceksaldo` atau NLP "Cek saldo [wallet]" (Bypass AI Rate Limit).
- **Transaction Details**: Halaman detail transaksi untuk melihat info lengkap dan **menghapus transaksi** (saldo wallet otomatis dikembalikan).
- **Manage Categories**: Fitur untuk menghapus kategori custom. Transaksi yang terkait akan otomatis dipindahkan ke kategori "Lainnya" untuk menjaga integritas data.

### Improved
- **Gemini AI**: Prompt engineering yang lebih canggih untuk akurasi tinggi dan penanganan JSON yang robust.
- **Transfer Logic**: Sistem transfer kini memprioritaskan penggunaan kategori default ("Transfer Masuk" / "Transfer Keluar") daripada membuat duplikat kategori custom.
- **Performance**: Optimalisasi webhook Telegram dengan regex pattern matching untuk respon cepat pada perintah umum.

## [1.2.1] - 2026-01-11

### Improved
- **Settings**: Menambahkan informasi deteksi perangkat (Browser & OS) pada info sesi.
- **UI**: Memperbaiki alignment ikon pada form ganti email/password agar rapi di tengah.

## [1.2.0] - 2026-01-11

### Added
- **PWA Support**: Aplikasi sekarang mendukung Progressive Web App (Installable & Offline Mode).
- **Settings**: Menambahkan fitur Ganti Email, Ganti Password, dan Info Sesi Aktif.
- **Security**: Menambahkan fitur "Keluar dari Semua Perangkat" (Global Logout).

### Fixed
- **Authentication**: Memperbaiki masalah sesi logout sendiri dengan implementasi Middleware berbasis Cookie (`@supabase/ssr`).
- **Login**: Memperbaiki isu login loop dengan menyinkronkan autentikasi client-side dan server-side.

## [1.1.2] - 2026-01-11

### Fixed
- **Transfer**: Memperbaiki format input saldo (ribuan) dan error insert database (menghapus kolom invalid `type`, handling kategori otomatis).
- **UI**: Standarisasi styling tombol kembali.

## [1.1.1] - 2026-01-11

### Fixed
- **UI Icons**: Memperbaiki alignment icon pada input form dan action buttons.
- **Plus Button**: Memperbaiki ukuran dan centering tombol tambah di halaman Manage Wallets.
- **Input Password**: Menambahkan fitur toggle show/hide password pada halaman Login dan Register.
- **Config**: Sinkronisasi versi aplikasi di halaman Settings dan Footer.

## [1.1.0] - 2026-01-11

### Added
- **Feature Transfer**: Memungkinkan pengguna mentransfer saldo antar wallet dengan pencatatan transaksi otomatis (Expense/Income).
- **Manage Wallets**: Halaman khusus untuk melihat daftar wallet dengan opsi edit dan delete.
- **Edit Wallet**: Fitur untuk mengubah nama, akronim, warna, dan saldo wallet yang sudah ada.
- **Quick Actions**: Tombol akses cepat (Transfer & Kelola Wallet) di Dashboard.
- **Footer Info**: Menampilkan versi aplikasi dan copyright di halaman Dashboard, Login, dan Register.
- **App Config**: Sentralisasi konfigurasi versi dan metadata aplikasi di `src/lib/config.ts`.

### Changed
- **Auth Redirect**: Memperbaiki redirect link konfirmasi email agar menggunakan domain production secara dinamis.
- **UI Improvements**: Menambahkan shortcut menu di dashboard untuk aksesibilitas yang lebih baik.

### Fixed
- **Build Error**: Memperbaiki tipe formatter chart yang menyebabkan kegagalan build di Vercel.

## [1.0.0] - 2026-01-10

### Added
- Initial release of MyFinance.
- Dashboard with expense/income charts.
- Wallet management (create).
- Transaction recording (income/expense).
- Authentication via Supabase (Email/Password).
- Google reCAPTCHA v2 implementation.
