# TodoApp

Website to-do list multi-user dengan fitur lengkap. Dibangun dengan React + Vite dan Supabase sebagai backend.

## Fitur

- ✅ Register & Login (email/password)
- ✅ Tambah, edit, hapus tugas
- ✅ Centang tugas yang sudah selesai
- ✅ Prioritas (Rendah, Sedang, Tinggi)
- ✅ Kategori (Pekerjaan, Pribadi, Belajar, dll)
- ✅ Deadline / tanggal jatuh tempo
- ✅ Notifikasi tugas terlambat
- ✅ Filter berdasarkan status, kategori, prioritas
- ✅ Pencarian tugas
- ✅ Urutkan (terbaru, deadline, prioritas)
- ✅ Statistik ringkas (total, aktif, selesai, terlambat)
- ✅ Responsive mobile

---

## Setup Supabase

### 1. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Catat **Project URL** dan **anon/public key** dari menu **Settings → API**

### 2. Buat Tabel Database
1. Buka **SQL Editor** di dashboard Supabase
2. Copy seluruh isi file `supabase-schema.sql`
3. Paste dan klik **Run**

### 3. Aktifkan Email Auth
1. Buka **Authentication → Providers**
2. Pastikan **Email** sudah enabled
3. (Opsional) Di **Authentication → Email Templates**, sesuaikan template email

---

## Menjalankan Lokal

```bash
# 1. Copy file environment
cp .env.example .env.local

# 2. Isi .env.local dengan kredensial Supabase kamu
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 3. Install dependencies
npm install

# 4. Jalankan dev server
npm run dev
```

---

## Deploy ke Vercel

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/todo-app.git
git push -u origin main
```

### 2. Deploy di Vercel
1. Buka [vercel.com](https://vercel.com) → **New Project**
2. Import repository GitHub kamu
3. Di bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` → URL project Supabase
   - `VITE_SUPABASE_ANON_KEY` → Anon key Supabase
4. Klik **Deploy**

### 3. Set Redirect URL di Supabase
Setelah dapat URL dari Vercel (misal `https://todo-app.vercel.app`):
1. Buka Supabase → **Authentication → URL Configuration**
2. Tambahkan URL Vercel ke **Redirect URLs**

---

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Date**: date-fns
- **Deploy**: Vercel
