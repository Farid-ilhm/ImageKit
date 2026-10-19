from __future__ import annotations

import io
import os
import threading
from pathlib import Path

# PyMatting bytecode cache configuration for Windows
_default_numba_cache = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local")) / "StudioLokal" / "numba-cache"
os.environ["NUMBA_CACHE_DIR"] = str(_default_numba_cache)
_default_numba_cache.mkdir(parents=True, exist_ok=True)

import numpy as np
from PIL import Image, ImageOps

AVAILABLE_MODELS = {
    "u2net": "u2net",
    "isnet-general-use": "isnet-general-use",
}
_sessions: dict[str, object] = {}
_model_lock = threading.Lock()


def get_session(model_name: str = "u2net"):
    """Load and cache the specified AI model session."""
    if model_name not in AVAILABLE_MODELS:
        model_name = "u2net"
    global _sessions
    if model_name not in _sessions:
        from rembg import new_session

        _sessions[model_name] = new_session(model_name)
    return _sessions[model_name]


def apply_smart_padding(image: Image.Image, pad: int = 48) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """
    Menambahkan bantalan (padding) kontekstual agar tepi objek tipis (seperti garis logo)
    yang menempel di pinggir kanvas tidak terpotong oleh model AI.
    """
    w, h = image.size
    arr = np.array(image.convert("RGBA"))
    perimeter = np.concatenate([arr[0, :], arr[-1, :], arr[:, 0], arr[:, -1]], axis=0)

    if np.median(perimeter[:, 3]) < 128:
        fill_color = (0, 0, 0, 0)
    else:
        median_rgb = np.median(perimeter[:, :3], axis=0).astype(int)
        fill_color = (int(median_rgb[0]), int(median_rgb[1]), int(median_rgb[2]), 255)

    padded = ImageOps.expand(image.convert("RGBA"), border=pad, fill=fill_color)
    return padded, (pad, pad, w, h)


def remove_background_image(
    source_img: Image.Image,
    model_name: str = "u2net",
    alpha_matting: bool = False,
    pad_size: int = 48,
) -> tuple[Image.Image, tuple[int, int]]:
    """
    Memotong latar belakang foto menggunakan model AI rembg dengan smart padding.
    """
    if model_name not in AVAILABLE_MODELS:
        model_name = "u2net"

    original_size = source_img.size
    padded_img, crop_box = apply_smart_padding(source_img, pad=pad_size)
    padded_buffer = io.BytesIO()
    padded_img.save(padded_buffer, format="PNG")

    from rembg import remove

    # Eksekusi serial dengan lock untuk menjaga alokasi memori mesin lokal
    with _model_lock:
        result = remove(
            padded_buffer.getvalue(),
            session=get_session(model_name),
            alpha_matting=alpha_matting,
            output_type="png",
            force_return_bytes=True,
        )

    with Image.open(io.BytesIO(result)) as output:
        output.load()
        crop_x, crop_y, orig_w, orig_h = crop_box
        cropped = output.crop((crop_x, crop_y, crop_x + orig_w, crop_y + orig_h))
        if cropped.size != original_size:
            raise ValueError("Ukuran gambar hasil model tidak sesuai dengan resolusi asli.")

        result_image = cropped.convert("RGBA")

    return result_image, original_size
