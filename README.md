<div align="center">

  <img src="Logo%20ImageKit.jpg" alt="ImageKit Logo" width="140" style="border-radius: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />

  # ImageKit

  **AI Background Remover · HD Super Resolution Scaler · Meme Burik Studio**

  [![Python](https://img.shields.io/badge/Python-3.10%20--%203.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
  [![Flask](https://img.shields.io/badge/Backend-Flask%203.1-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
  [![ONNX Runtime](https://img.shields.io/badge/Inference-ONNX%20Runtime-005CED?style=flat-square)](https://onnxruntime.ai/)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-informational?style=flat-square)](https://github.com/)
  [![Privacy](https://img.shields.io/badge/Privasi-100%25%20Lokal%20Offline-success?style=flat-square)](#keamanan--privasi)

  <p align="center">
    Aplikasi web lokal serba bisa untuk manipulasi gambar: hapus latar belakang dengan AI, perbesar foto hingga resolusi tinggi (Super Resolution), retouch kuas manual, dan eksperimen meme beresolusi rendah — seluruhnya diproses langsung di komputer Anda tanpa mengunggah file ke cloud.
  </p>

</div>

---

## 🌟 Fitur Utama

ImageKit menyediakan tiga studio pemrosesan gambar yang terintegrasi dalam satu antarmuka:

| Fitur | Deskripsi | Teknologi / Model |
| :--- | :--- | :--- |
| **Hapus Background** | Ekstraksi subjek instan dengan isolasi objek otomatis dan ekspor PNG transparan lossless. | U2Net & IS-Net (Salient Object Detection) |
| **Alpha Matting & Brush** | Retouch kuas interaktif (hapus/kembalikan mask) serta penanganan helai rambut dan serat bulu halus. | PyMatting + Canvas Eraser/Restore Brush |
| **HD Image Scaler** | Perbesar gambar 2× atau 4× dengan restorasi ketajaman dan detail tekstur. | Real-ESRGAN (`realesr-general-x4v3` & Anime) via ONNX |
| **Meme Burik Studio** | Penurunan kualitas gambar ekstrem, kompresi JPEG bertingkat, dan efek *deep-fried*. | Custom Degradation Engine + Presets |
| **Studio Bridge** | Hubungkan alur kerja: kirim gambar hasil Scaler ke Burik atau sebaliknya tanpa upload ulang. | Client-side In-Memory Bridge |

---

## 📸 Tiga Studio Pemrosesan

### 1. Studio Hapus Background
- **Dukungan Format Luas:** Memproses file format `PNG`, `JPG/JPEG`, `WEBP`, `BMP`, dan `TIFF`.
- **Antrean Pemrosesan:** Unggah hingga 10 foto sekaligus untuk pemrosesan berurutan.
- **Pilihan Model AI:**
  - `U2Net`: Model andal serbaguna untuk potret orang, hewan, dan produk.
  - `IS-Net`: Model berakurasi tinggi untuk batas tepi kompleks.
- **Editor Kuas (Retouch):** Perbaiki hasil mask secara manual dengan kuas *Erase* atau *Restore* langsung di browser.

### 2. Studio HD Image Scaler
- **Super Resolution 2× & 4×:** Memperbesar ukuran piksel sekaligus memulihkan ketajaman detail.
- **Dua Model Real-ESRGAN:**
  - `General Model`: Optimal untuk foto nyata, produk, pemandangan, dan potret.
  - `Anime Model`: Dikhususkan untuk ilustrasi 2D, kartun, manga, dan grafis digital.
- **Inspeksi Interaktif:** Fitur slider geser *Before/After* dan mode perbandingan berdampingan (*Side-by-Side*).

### 3. Meme Burik Studio
- **Preset Ikonik:** Pilihan instan preset *HP Kentang*, *Deep Fry*, *Nokia 3310*, dan *Nuklir*.
- **Kendali Kustom:** Slider pixelation (16p–180p), penguat saturasi, noise artefak, dan kompresi JPEG berulang.

---

## 🔒 Keamanan & Privasi

- **100% Pemrosesan Lokal:** Server hanya berjalan di mesin lokal (`127.0.0.1`). File foto Anda tidak pernah dikirim atau disimpan di server eksternal.
- **Model Mandiri:** Model AI diunduh otomatis saat pertama kali fitur digunakan dan disimpan di direktori lokal untuk pemakaian berikutnya secara offline.
- **Lossless Export:** Hasil potongan latar belakang disimpan dengan format PNG 32-bit (RGBA) tanpa kompresi lossy.

---

## 📋 Persyaratan Sistem

- **Sistem Operasi:** Windows 10/11 (64-bit), macOS, atau Linux
- **Python:** Versi `3.10` hingga `3.13` (64-bit)
- **Koneksi Internet:** Hanya dibutuhkan pada instalasi awal dependensi dan saat pengunduhan model AI pertama kali.
- **Ruang Disk Bebas:** Disarankan minimal 2–3 GB untuk file dependensi dan bobot model AI.

---

## 🚀 Cara Menjalankan

### 1. Buka Terminal / PowerShell
Arahkan ke folder project `ImageKit`:
```powershell
cd "c:\Users\Jonathan Saputra\Documents\SistemRemoveBG"
```

### 2. Siapkan Virtual Environment (Disarankan)
```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Pasang Dependensi
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Jalankan Aplikasi
```powershell
python app.py
```

Buka peramban (browser) dan akses:
```
http://127.0.0.1:5000
```

> [!TIP]
> Pada pemrosesan pertama kali untuk setiap fitur AI, sistem akan mengunduh model secara otomatis dari repositori resmi. Tunggu proses unduhan selesai hingga hasil gambar tampil di layar.

---

## 🛠️ Struktur Direktori Proyek

```text
ImageKit/
├── Logo ImageKit.jpg         # Asset logo resmi ImageKit
├── app.py                    # Server utama Flask & rute REST API
├── requirements.txt          # Daftar dependensi Python
├── models/                   # Folder penyimpanan model ONNX lokal
├── services/
│   ├── remover.py            # Logika AI penghapus latar belakang & alpha matting
│   ├── scaler.py             # Pipeline AI Real-ESRGAN super-resolution
│   └── burik.py              # Generator degradasi resolusi & efek meme
├── static/
│   ├── app.js                # Shell utama & navigasi tab studio
│   ├── remover.js            # Controller antrean upload, dropzone & brush editor
│   ├── scaler.js             # Controller slider perbandingan HD scaler
│   ├── burik.js              # Controller preset & interaksi meme studio
│   ├── styles.css            # Desain UI neobrutalist comic-pop
│   └── favicon.png           # Favicon browser resolusi optimal
└── templates/
    ├── index.html            # Template utama workbench
    └── partials/             # Komponen studio (remover, scaler, burik, brush_editor)
```

## 👤 Pengembang & Kontak

Dikembangkan oleh **Ahmad Farid Ilham Fauzi**:
- **GitHub:** [@Farid-ilhm](https://github.com/Farid-ilhm)
- **Instagram:** [@fridilhmm](https://www.instagram.com/fridilhmm/)
- **LinkedIn:** [Ahmad Farid Ilham Fauzi](https://www.linkedin.com/in/ahmad-farid-ilham-fauzi-889865437/?isSelfProfile=true)

---

## 📄 Lisensi & Hak Cipta

Dibuat untuk kebutuhan pemrosesan gambar lokal yang cepat, aman, dan tanpa batasan langganan berbayar. Model AI yang digunakan (`U2Net`, `IS-Net`, `Real-ESRGAN`) tunduk pada lisensi open-source masing-masing pembuat model.
