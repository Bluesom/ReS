# ReS — Reservation Synchronization

ReS adalah aplikasi reservasi hotel yang membantu tamu melihat informasi kamar
dan penawaran, membuat permintaan pemesanan, serta mengelola profil. Aplikasi
ini juga menyediakan dashboard administrator untuk mengelola kamar, tipe kamar,
booking, tamu, dan penawaran.

Versi Laravel berada di folder `temp-laravel/`. Aplikasi memakai Laravel 10,
PHP 8.1 atau lebih baru, MySQL sebagai database default, serta Vite untuk
membangun aset CSS dan JavaScript. Data awal hasil migrasi berada di
`temp-laravel/database/seeders/data/db.json`.

## Fitur

- Halaman beranda, login, registrasi, profil, pemesanan, dan dashboard admin.
- Registrasi/login tamu dan login admin melalui API Laravel.
- Autentikasi API menggunakan Laravel Sanctum dengan masa berlaku token dua jam.
- Pembuatan permintaan booking oleh tamu.
- Pengelolaan booking, kamar, tipe kamar, tamu, penawaran, dan gambar oleh admin.
- Impor data dan akun lama dari JSON ke database Laravel.

## Persyaratan

- PHP 8.1 atau lebih baru dengan ekstensi yang dibutuhkan Laravel, termasuk PDO
  untuk database yang dipilih, `mbstring`, `openssl`, `fileinfo`, dan `intl`.
- Composer.
- MySQL/MariaDB yang berjalan (konfigurasi default), atau database lain yang
  didukung Laravel setelah konfigurasi `.env` disesuaikan.
- Node.js dan npm untuk memasang serta membangun aset frontend.

## Menjalankan aplikasi di Windows

Buka PowerShell pada root repository, lalu pindah ke folder Laravel:

```powershell
cd .\temp-laravel
```

### 1. Pasang dependency PHP dan JavaScript

```powershell
composer install
npm install
```

### 2. Siapkan konfigurasi aplikasi

Jika file `.env` belum ada:

```powershell
Copy-Item .env.example .env
```

Buat application key:

```powershell
php artisan key:generate
```

### 3. Siapkan database

Secara default Laravel menggunakan MySQL di `127.0.0.1:3306`, dengan nama
database `laravel`, user `root`, dan password kosong. Pastikan server MySQL
berjalan dan buat database `laravel` terlebih dahulu, atau ubah nilai
`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` di `.env`
agar sesuai dengan komputer Anda.

Kemudian buat tabel dan impor data awal:

```powershell
php artisan migrate
php artisan db:seed
```

Seeder pada environment `local` atau `testing` mengimpor akun, profil tamu,
admin, kamar, tipe kamar, booking, dan penawaran dari
`database/seeders/data/db.json`. Importer dirancang agar dapat dijalankan ulang
tanpa menghapus atau menimpa data dengan source ID yang sudah ada. Perintah
impor juga dapat dijalankan secara langsung:

```powershell
php artisan app:import-legacy-json
```

Untuk memakai file JSON lain, berikan path sebagai argumen:

```powershell
php artisan app:import-legacy-json "C:\path\ke\db.json"
```

### 4. Bangun aset frontend

Untuk penggunaan biasa:

```powershell
npm run build
```

Saat mengembangkan frontend, jalankan Vite dalam terminal terpisah:

```powershell
npm run dev
```

### 5. Jalankan server Laravel

```powershell
php artisan serve
```

Buka alamat yang ditampilkan Artisan, biasanya <http://127.0.0.1:8000>.
Untuk menghentikan server, tekan `Ctrl+C` di terminalnya.

## Akun demo

Data akun diimpor dari `temp-laravel/database/seeders/data/db.json` ke tabel
database Laravel; akun tidak disimpan sebagai kode aplikasi.

- Admin: `admin@example.com` / `Admin123!`
- Tamu: `jackmahardi@gmail.com` / gunakan password yang ditetapkan saat akun
  tersebut dibuat. Password asli tidak tersedia di JSON karena hanya hash
  password yang disimpan.

Jangan gunakan akun atau password demo pada lingkungan produksi. Jika login
gagal, pastikan MySQL berjalan, database pada `.env` benar, lalu jalankan
migrasi dan seeder dari folder `temp-laravel`.

## Lokasi data

- `users`: nama, email, role, dan hash password.
- `guest_profiles`: nomor tamu, negara, nomor telepon, serta status tamu.
- Data lain seperti rooms, room types, bookings, dan offers disimpan pada tabel
  dengan nama yang sama di database.

Password tidak disimpan dalam bentuk teks biasa. Pada login pertama akun yang
diimpor dari JSON, hash legacy diverifikasi lalu diubah ke format hash Laravel.

## Pengujian

Jalankan dari `temp-laravel`:

```powershell
php artisan test
```

Tes yang menggunakan database membutuhkan koneksi ke database yang berfungsi.

## Struktur repository

- `temp-laravel/`: aplikasi Laravel yang dijalankan.
- `ProjectPW/`: folder aplikasi MVC lama; Laravel tidak lagi membutuhkan folder
  ini untuk menjalankan aplikasi karena JSON sumber sudah disalin ke dalam
  proyek Laravel.
- `.github/modernize/rearchitecture/`: artefak kerja proses analisis dan
  modernisasi, seperti spesifikasi, catatan arsitektur, log tim, dan learning.
  Folder ini bukan kode runtime Laravel dan tidak diperlukan ketika menjalankan
  aplikasi.
