# Changelog

All notable changes to this project will be documented in this file.

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
