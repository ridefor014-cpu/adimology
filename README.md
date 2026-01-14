# Adimology - Kalkulator Target Saham 📈

> [!CAUTION]
> **PERINGATAN KEAMANAN**: Jangan pernah membagikan URL aplikasi Netlify Anda secara publik. Aplikasi ini melakukan sinkronisasi token sesi Stockbit Anda ke database. Jika URL bocor, orang lain dapat menyalahgunakan akses tersebut. Gunakan aplikasi ini hanya untuk penggunaan pribadi. 

Adimology adalah aplikasi web yang dirancang untuk membantu investor saham dalam menganalisis target harga saham berdasarkan data transaksi broker (bandarmologi) dari Stockbit.

Aplikasi ini tidak hanya menghitung target harga, tetapi juga melacak performa analisis secara otomatis dan menyediakan data tentang akumulasi broker.

![Adimology Preview 1](public/adimology01.PNG)
![Adimology Preview 2](public/adimology02.PNG)

---
💡 **Credit Rumus**: Algoritma dan rumus analisis dalam aplikasi ini didasarkan pada metodologi dari **[Adi Sucipto](https://www.instagram.com/adisuciipto/)**.

## 🌟 Fitur Utama

- **Analisis Target Cerdas**: Menghitung target harga "Realistis (R1)" dan "Maksimal" berdasarkan rata-rata harga pembelian broker (Avg Bandar).
- **History & Watchlist**: Menyimpan riwayat analisis untuk dipantau di kemudian hari.
- **Tracking Real Harga (H+1)**: Secara otomatis memperbarui harga riil di hari bursa berikutnya untuk memverifikasi apakah target analisis tercapai.
- **Data Terintegrasi Stockbit**: Mengambil data transaksi broker real-time untuk akurasi tinggi.
- **Ringkasan Broker (Top 1, 3, 5)**: Visualisasi kekuatan akumulasi vs distribusi broker.
- **Export to PDF**: Unduh laporan riwayat analisis dalam format PDF yang rapi.
- **Automatic Background Analysis**: Fitur otomatisasi yang melakukan analisis watchlist secara terjadwal setiap hari.
- **AI Story Analysis**: Analisis berita dan sentimen pasar menggunakan AI (Gemini) untuk merangkum story, SWOT, dan katalis emiten secara instan.
- **Multi-Version Analysis Tracking**: Menyimpan dan menampilkan riwayat analisis AI sebelumnya sehingga Anda bisa melacak perubahan narasi pasar dari waktu ke waktu.

## �️ Tech Stack

- **Frontend**: [Next.js 15 (App Router)](https://nextjs.org/), React 19, Tailwind CSS 4.
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL).
- **Deployment**: [Netlify](https://www.netlify.com/) (dengan Netlify Functions & Scheduled Functions).
- **AI Engine**: [Google Gemini Pro](https://ai.google.dev/) dengan Google Search Grounding untuk data berita terkini.
- **Tools**: `jspdf` & `html2canvas` untuk ekspor PDF, `lucide-react` untuk ikon.

## ⚙️ Instalasi Lokal

Ikuti langkah-langkah berikut untuk menjalankan Adimology di mesin lokal Anda:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/username/adimology.git
   cd adimology
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Salin `.env.local.example` menjadi `.env.local` dan isi nilainya:
   ```bash
   cp .env.local.example .env.local
   ```
   Isi variabel berikut:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase Anda.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key dari Supabase.
   - `STOCKBIT_JWT_TOKEN`: Token JWT Stockbit (bisa didapat manual atau via ekstensi).
   - `CRON_SECRET`: Secret key untuk mengamankan endpoint cron/scheduled functions.
   - `GEMINI_API_KEY`: API Key dari Google AI Studio untuk fitur AI Story Analysis.
   - `NETLIFY_FUNCTION_URL`: URL base Netlify (wajib untuk trigger background function di prod).

4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🗄️ Setup Database Supabase

Aplikasi ini membutuhkan beberapa tabel di Supabase. Jalankan script SQL yang ada di folder `supabase/` melalui SQL Editor di dashboard Supabase Anda dengan urutan berikut:

1. `session_table.sql`: Menyimpan token sesi Stockbit.
2. `stock_queries_table.sql`: Tabel utama riwayat analisis.
3. `stock_queries_migration.sql`: Migrasi untuk penyesuaian struktur data.
4. `add_sector_column.sql`: Menambahkan informasi sektor emiten.
5. `add_real_harga_column.sql`: Menambahkan fitur tracking harga H+1.
6. `agent_story_table.sql`: Membuat tabel untuk menyimpan hasil analisis AI.

## 🌐 Deploy ke Netlify

1. Hubungkan repository GitHub Anda ke Netlify.
2. Tambahkan **Environment Variables** (sama dengan langkah instalasi lokal) di dashboard Netlify.
3. Gunakan `netlify.toml` yang sudah tersedia untuk konfigurasi build otomatis.
4. Fitur **Scheduled Functions** akan otomatis berjalan berdasarkan jadwal yang ditentukan (default: setiap hari bursa jam 11:00 UTC).

## 🔌 Ekstensi Chrome (Stockbit Token Syncer)

Agar aplikasi dapat mengambil data terbaru dari Stockbit tanpa input token manual terus-menerus, gunakan ekstensi yang tersedia di folder `stockbit-token-extension/`:

1.  **Siapkan File Konfigurasi**:
    Salin file `.example` menjadi file asli di dalam folder `stockbit-token-extension/`:
    ```bash
    cp stockbit-token-extension/manifest.json.example stockbit-token-extension/manifest.json
    cp stockbit-token-extension/background.js.example stockbit-token-extension/background.js
    ```
2.  **Konfigurasi Domain**:
    - Buka `manifest.json` dan ganti `YOUR_APP_DOMAIN` dengan domain Netlify Anda.
    - Buka `background.js` dan ganti `YOUR_APP_DOMAIN` pada bagian `endpoint` dengan domain Netlify Anda.
3.  **Install Ekstensi**:
    - Buka `chrome://extensions/` di Chrome.
    - Aktifkan **Developer mode** di pojok kanan atas.
    - Klik **Load unpacked** dan pilih folder `stockbit-token-extension`.
4.  **Selesai**: Ekstensi akan otomatis menangkap token saat Anda membuka Stockbit dan mengirimkannya ke database Supabase Anda.

## 📄 Lisensi

Proyek ini dibuat untuk tujuan edukasi dan penggunaan pribadi. Pastikan untuk mematuhi ketentuan penggunaan layanan pihak ketiga yang digunakan.