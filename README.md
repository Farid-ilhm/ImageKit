# ImageKit : Hapus Background & Image Studio

Aplikasi web lokal untuk menghapus latar belakang gambar dengan model AI, memperbesar gambar (HD Scaler), dan Meme Studio. File diproses di komputer sendiri, bukan dikirim ke layanan web. Hasilnya PNG transparan dengan resolusi piksel yang sama dan encoding lossless.

## Fitur

- Hapus background dari PNG, JPG/JPEG, WEBP, BMP, dan TIFF.
- Antrean pemrosesan hingga 10 gambar sekaligus.
- Opsi alpha matting untuk membantu mempertahankan detail tipis seperti rambut (lebih lambat; hasil dapat berbeda tergantung gambar).
- Hasil PNG transparan tanpa mengubah dimensi gambar. PNG menggunakan kompresi lossless, jadi piksel gambar tidak mengalami kompresi lossy.
- Gambar tidak diunggah ke internet. Model U2Net diunduh sekali saat penggunaan pertama dan pemrosesan berlangsung lokal.

> Pemisahan objek dibuat oleh AI sehingga kerapian tepi tetap bergantung pada kontras, pencahayaan, dan kompleksitas gambar. PNG mempertahankan resolusi dan data hasil tanpa kompresi lossy, tetapi penghapusan background sendiri mengubah piksel di area tepi objek.

## Persyaratan

- Windows 10/11 64-bit
- Python 3.10 sampai 3.13 64-bit
- Koneksi internet hanya untuk instalasi dependensi dan unduhan model pertama kali
- Ruang disk kosong beberapa GB disarankan untuk dependensi dan model

## Menjalankan di Windows

Buka PowerShell di folder project, lalu jalankan:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Buka <http://127.0.0.1:5000> di browser. Pada proses pertama, model AI U2Net akan diunduh otomatis; tunggu sampai gambar selesai diproses. Proses berikutnya memakai model lokal yang sudah tersimpan.

Jika PowerShell memblokir aktivasi virtual environment, jalankan perintah instalasi dan server dengan interpreter langsung, misalnya `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`, lalu `.\.venv\Scripts\python.exe app.py`.

## Catatan kualitas dan privasi

- Dimensi hasil dicocokkan dengan dimensi gambar sumber (orientasi EXIF diterapkan lebih dahulu agar foto tampil tegak).
- File hasil adalah PNG transparan. Jangan simpan kembali sebagai JPG jika transparansi ingin dipertahankan.
- Server hanya mendengarkan di `127.0.0.1` (komputer ini) dan tidak mengirim file gambar ke pihak ketiga.
- Cache kompilasi Numba untuk fitur alpha matting disimpan di `%LOCALAPPDATA%\StudioLokal\numba-cache`, bukan di folder instalasi Python.
- Batas ukuran gambar adalah 25 MB per file; antrean antarmuka membatasi 10 file.
