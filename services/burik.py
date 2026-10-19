from __future__ import annotations

import io
from typing import Tuple
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


PRESETS = {
    "kentang": {
        "name": "Meme Kentang 144p",
        "burik_level": 5,
        "jpeg_quality": 8,
        "fry_factor": 1.2,
        "noise_amount": 0.15,
        "pixel_mode": "bilinear",
        "multi_pass": 3,
        "description": "Resolusi 144p klasik, buram dan bintik khas meme Facebook era 2012.",
    },
    "deepfry": {
        "name": "Deep Fried Gorengan",
        "burik_level": 4,
        "jpeg_quality": 6,
        "fry_factor": 2.8,
        "noise_amount": 0.25,
        "pixel_mode": "nearest",
        "multi_pass": 4,
        "description": "Warna meledak pedas, kontras pecah, dan ketajaman berlebih sampai silau.",
    },
    "nokia": {
        "name": "CCTV 3GP / Nokia Jadul",
        "burik_level": 7,
        "jpeg_quality": 4,
        "fry_factor": 1.5,
        "noise_amount": 0.4,
        "pixel_mode": "nearest",
        "multi_pass": 5,
        "description": "Kualitas kamera HP jadul, artefak kotak-kotak piksel kasar.",
    },
    "nuklir": {
        "name": "Kutukan Nuklir (Seburik-buriknya)",
        "burik_level": 9,
        "jpeg_quality": 2,
        "fry_factor": 3.4,
        "noise_amount": 0.55,
        "pixel_mode": "nearest",
        "multi_pass": 6,
        "description": "Teks hancur lebur tidak terbaca, artefak JPEG legendaris tak terselamatkan.",
    },
}


def apply_burik_degradation(
    source_img: Image.Image,
    preset: str = "kentang",
    burik_level: int = 5,
    jpeg_quality: int = 6,
    fry_factor: float = 1.0,
    noise_amount: float = 0.0,
    pixel_mode: str = "nearest",
    multi_pass: int = 3,
) -> Tuple[Image.Image, Tuple[int, int], Tuple[int, int]]:
    """Memburikan gambar dengan multi-pass JPEG degradation, downscale pixelation,

    deep-fry saturation/contrast, dan unsharp mask haloing.
    """
    orig_w, orig_h = source_img.size

    # Convert to RGB (flatten transparency if RGBA onto white/meme background)
    if source_img.mode in ("RGBA", "LA") or (
        source_img.mode == "P" and "transparency" in source_img.info
    ):
        base_canvas = Image.new("RGB", (orig_w, orig_h), (255, 255, 255))
        converted = source_img.convert("RGBA")
        base_canvas.paste(converted, mask=converted.split()[3])
        work_img = base_canvas
    else:
        work_img = source_img.convert("RGB")

    # Apply preset overrides if user selected a known preset and did not customize
    if preset in PRESETS and preset != "custom":
        cfg = PRESETS[preset]
        burik_level = cfg["burik_level"]
        jpeg_quality = cfg["jpeg_quality"]
        fry_factor = cfg["fry_factor"]
        noise_amount = cfg["noise_amount"]
        pixel_mode = cfg["pixel_mode"]
        multi_pass = cfg["multi_pass"]

    # Clamp parameters safely
    burik_level = max(1, min(10, burik_level))
    jpeg_quality = max(1, min(95, jpeg_quality))
    fry_factor = max(1.0, min(5.0, fry_factor))
    noise_amount = max(0.0, min(1.0, noise_amount))
    multi_pass = max(1, min(8, multi_pass))

    # Step 1: Calculate target downscale resolution
    # level 1: ~400px min dimension, level 10: ~32px min dimension (extreme unreadable text)
    min_dim = min(orig_w, orig_h)
    target_min_dim = int(min_dim * (1.0 / (burik_level * 1.6 + 0.8)))
    target_min_dim = max(24, min(min_dim, target_min_dim))

    if min_dim == orig_w:
        small_w = target_min_dim
        small_h = max(24, int(orig_h * (target_min_dim / orig_w)))
    else:
        small_h = target_min_dim
        small_w = max(24, int(orig_w * (target_min_dim / orig_h)))

    # Step 2: Downscale
    downscaled = work_img.resize((small_w, small_h), resample=Image.Resampling.BILINEAR)

    # Step 3: Deep Fry (Color Saturation & Contrast)
    if fry_factor > 1.0:
        # Boost saturation
        sat_boost = 1.0 + (fry_factor - 1.0) * 1.35
        downscaled = ImageEnhance.Color(downscaled).enhance(sat_boost)

        # Boost contrast
        contrast_boost = 1.0 + (fry_factor - 1.0) * 1.25
        downscaled = ImageEnhance.Contrast(downscaled).enhance(contrast_boost)

        # Intense Unsharp Mask for crunch halos around edges & text
        unsharp_percent = int(100 + fry_factor * 80)
        downscaled = downscaled.filter(
            ImageFilter.UnsharpMask(radius=1.8, percent=unsharp_percent, threshold=2)
        )

    # Step 4: Noise & Grain Injection
    if noise_amount > 0.02:
        img_arr = np.array(downscaled, dtype=np.float32)
        noise = np.random.normal(0, noise_amount * 42.0, img_arr.shape)
        noisy_arr = np.clip(img_arr + noise, 0, 255).astype(np.uint8)
        downscaled = Image.fromarray(noisy_arr)

    # Step 5: Upscale back to original framing for 1:1 comparison
    resample_filter = (
        Image.Resampling.NEAREST if pixel_mode == "nearest" else Image.Resampling.BILINEAR
    )
    upscaled = downscaled.resize((orig_w, orig_h), resample=resample_filter)

    # Step 6: Multi-pass JPEG degradation loop
    current_quality = jpeg_quality
    result_img = upscaled
    for pass_idx in range(multi_pass):
        buf = io.BytesIO()
        # Chroma subsampling 0 (4:2:0) creates signature meme color bleed around red/cyan text
        result_img.save(
            buf,
            format="JPEG",
            quality=current_quality,
            subsampling=0,
            optimize=False,
        )
        buf.seek(0)
        result_img = Image.open(buf)
        result_img.load()

        # Slight over-sharpening between passes for authentic crust
        if pass_idx < multi_pass - 1 and fry_factor >= 1.5:
            result_img = result_img.filter(
                ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=1)
            )

        # Each subsequent pass gets slightly more crusty
        current_quality = max(1, current_quality - 1)

    # Final nuclear edge crunch if high fry or nuclear preset
    if preset == "nuklir" or (fry_factor >= 3.0 and burik_level >= 8):
        result_img = result_img.filter(
            ImageFilter.UnsharpMask(radius=2.0, percent=220, threshold=1)
        )
        final_buf = io.BytesIO()
        result_img.save(final_buf, format="JPEG", quality=2, subsampling=0)
        final_buf.seek(0)
        result_img = Image.open(final_buf)
        result_img.load()

    degraded_resolution = (small_w, small_h)
    return result_img, (orig_w, orig_h), degraded_resolution
