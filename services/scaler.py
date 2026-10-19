from __future__ import annotations

import os
import threading
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
import requests
from PIL import Image

MAX_SCALER_PIXELS = 80_000_000

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_URLS = {
    "general": {
        "filename": "realesr-general-x4v3.onnx",
        "url": "https://huggingface.co/Heliosoph/realesrgan-onnx/resolve/main/realesr-general-x4v3.onnx",
    },
    "anime": {
        "filename": "realesrgan-x4plus-anime.onnx",
        "url": "https://huggingface.co/deepghs/imgutils-models/resolve/main/real_esrgan/RealESRGAN_x4plus_anime_6B.onnx",
    },
}

_scaler_sessions: dict[str, ort.InferenceSession] = {}
_scaler_lock = threading.Lock()


def get_scaler_session(model_key: str = "general") -> ort.InferenceSession:
    """
    Memuat dan menyimpan model session Real-ESRGAN Super Resolution.
    Jika file model belum tersedia di folder models/, file akan diunduh secara otomatis.
    """
    if model_key not in MODEL_URLS:
        model_key = "general"

    global _scaler_sessions
    with _scaler_lock:
        if model_key not in _scaler_sessions:
            cfg = MODEL_URLS[model_key]
            model_path = MODELS_DIR / cfg["filename"]

            if not model_path.exists():
                response = requests.get(cfg["url"], timeout=60)
                response.raise_for_status()
                with open(model_path, "wb") as f:
                    f.write(response.content)

            session = ort.InferenceSession(
                str(model_path),
                providers=["CPUExecutionProvider"],
            )
            _scaler_sessions[model_key] = session

        return _scaler_sessions[model_key]


def run_super_resolution_tiles(
    session: ort.InferenceSession,
    rgb_img: np.ndarray,
    tile_size: int = 512,
    tile_pad: int = 24,
) -> np.ndarray:
    """
    Menjalankan inferensi model Real-ESRGAN dengan seamless tiling
    agar hemat memori dan stabil pada gambar resolusi tinggi.
    """
    input_name = session.get_inputs()[0].name
    h, w, c = rgb_img.shape

    # Gambar kecil (< 600px di kedua sisi) diproses langsung satu pass
    if h <= 600 and w <= 600:
        tensor = np.transpose(rgb_img.astype(np.float32) / 255.0, (2, 0, 1))[np.newaxis, ...]
        out = session.run(None, {input_name: tensor})[0][0]
        return np.clip(np.transpose(out, (1, 2, 0)) * 255.0, 0, 255).astype(np.uint8)

    scale = 4
    out_h, out_w = h * scale, w * scale
    output_image = np.zeros((out_h, out_w, c), dtype=np.uint8)

    y = 0
    while y < h:
        x = 0
        tile_h = min(tile_size, h - y)
        while x < w:
            tile_w = min(tile_size, w - x)

            y_start = max(0, y - tile_pad)
            y_end = min(h, y + tile_h + tile_pad)
            x_start = max(0, x - tile_pad)
            x_end = min(w, x + tile_w + tile_pad)

            tile_in = rgb_img[y_start:y_end, x_start:x_end]
            tensor = np.transpose(tile_in.astype(np.float32) / 255.0, (2, 0, 1))[np.newaxis, ...]
            tile_out = session.run(None, {input_name: tensor})[0][0]
            tile_out = np.clip(np.transpose(tile_out, (1, 2, 0)) * 255.0, 0, 255).astype(np.uint8)

            crop_top = (y - y_start) * scale
            crop_bottom = crop_top + (tile_h * scale)
            crop_left = (x - x_start) * scale
            crop_right = crop_left + (tile_w * scale)

            output_image[
                y * scale : (y + tile_h) * scale,
                x * scale : (x + tile_w) * scale,
            ] = tile_out[crop_top:crop_bottom, crop_left:crop_right]

            x += tile_size
        y += tile_size

    return output_image


def enhance_and_scale_image(
    source_img: Image.Image,
    scale: int = 2,
    mode: str = "photo",
    denoise: bool = True,
    sharpen: float = 0.4,
    enhance_contrast: bool = True,
) -> tuple[Image.Image, tuple[int, int], tuple[int, int]]:
    """
    Tingkatkan kualitas dan perbesar resolusi gambar menjadi HD menggunakan
    model AI Real-ESRGAN Super-Resolution yang sebenarnya (rekonstruksi detail fotorealistik
    dan penghapusan artefak kompresi).
    """
    scale = max(1, min(4, int(scale)))
    orig_w, orig_h = source_img.size
    new_w = orig_w * scale
    new_h = orig_h * scale

    if (new_w * new_h) > MAX_SCALER_PIXELS:
        raise ValueError("Resolusi hasil melebihi batas maksimum 80 megapixel.")

    has_alpha = source_img.mode in ("RGBA", "LA") or ("transparency" in source_img.info)
    img_rgba = source_img.convert("RGBA")
    np_arr = np.array(img_rgba)

    rgb = np_arr[:, :, :3]
    alpha = np_arr[:, :, 3]

    # Pilih model AI berdasarkan profil gambar
    # "art" untuk anime, kartun, logo, dan ilustrasi vektor
    # "photo" dan "ultra" untuk foto potret, produk, dan pemandangan nyata
    model_key = "anime" if mode == "art" else "general"
    session = get_scaler_session(model_key)

    # 1. Jalankan Real AI Super-Resolution (4x native upscale)
    upscaled_rgb = run_super_resolution_tiles(session, rgb)

    # 2. Penyesuaian Kontras Cerdas Cerdas (hanya jika diaktifkan user, secara halus tanpa merusak warna)
    if enhance_contrast:
        bgr = cv2.cvtColor(upscaled_rgb, cv2.COLOR_RGB2BGR)
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge((l, a, b))
        bgr = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        upscaled_rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    # 3. Penajaman Halus Adaptif (jika user mengatur slider ketajaman di atas 0)
    if sharpen > 0.05:
        # Gunakan koefisien unsharp mask kecil agar tidak timbul halo atau artefak kasar
        amount = float(min(0.5, sharpen * 0.5))
        bgr = cv2.cvtColor(upscaled_rgb, cv2.COLOR_RGB2BGR)
        blur = cv2.GaussianBlur(bgr, (0, 0), sigmaX=0.8)
        sharpened = cv2.addWeighted(bgr, 1.0 + amount, blur, -amount, 0)
        sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)
        upscaled_rgb = cv2.cvtColor(sharpened, cv2.COLOR_BGR2RGB)

    # Konversi ke PIL Image
    if has_alpha:
        # Skala kanal transparansi ke resolusi 4x dengan Lanczos
        alpha_img = Image.fromarray(alpha)
        alpha_4x = alpha_img.resize(
            (orig_w * 4, orig_h * 4),
            resample=Image.Resampling.LANCZOS,
        )
        alpha_up_arr = np.array(alpha_4x)
        rgba_result = np.dstack((upscaled_rgb, alpha_up_arr))
        result_img = Image.fromarray(rgba_result)
    else:
        result_img = Image.fromarray(upscaled_rgb)

    # 4. Jika user memilih skala 2x HD, lakukan downsample 50% dari hasil 4x AI
    # Menggunakan Lanczos resampling menghasilkan 2x supersampled HD yang sangat tajam dan bersih
    if scale == 2:
        result_img = result_img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)
    elif scale != 4:
        result_img = result_img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)

    return result_img, (orig_w, orig_h), (new_w, new_h)
