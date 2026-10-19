from __future__ import annotations

import io
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file
from PIL import Image, ImageOps, UnidentifiedImageError

from services.burik import PRESETS, apply_burik_degradation
from services.remover import AVAILABLE_MODELS, remove_background_image
from services.scaler import enhance_and_scale_image

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25 MB per image
app.config["TEMPLATES_AUTO_RELOAD"] = True

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}
MAX_IMAGE_PIXELS = 80_000_000
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/remove")
def remove_background():
    uploaded = request.files.get("image")
    if uploaded is None or not uploaded.filename:
        return jsonify(error="Pilih gambar terlebih dahulu."), 400

    suffix = Path(uploaded.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return jsonify(error="Format yang didukung: PNG, JPG, WEBP, BMP, dan TIFF."), 415

    source_bytes = uploaded.read()
    if not source_bytes:
        return jsonify(error="File gambar kosong."), 400

    try:
        with Image.open(io.BytesIO(source_bytes)) as source:
            source.load()
            oriented = ImageOps.exif_transpose(source).convert("RGBA")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        return jsonify(error="File tidak dapat dibaca sebagai gambar yang valid."), 400

    model_name = request.form.get("model", "u2net").strip().lower()
    alpha_matting = request.form.get("alpha_matting", "false").lower() == "true"

    try:
        result_img, original_size = remove_background_image(
            oriented,
            model_name=model_name,
            alpha_matting=alpha_matting,
        )

        png_buffer = io.BytesIO()
        result_img.save(png_buffer, format="PNG", optimize=True)
        png_buffer.seek(0)
    except Exception as exc:
        app.logger.exception("Background removal failed")
        return jsonify(error=f"Gagal memproses gambar: {exc}"), 500

    safe_name = Path(uploaded.filename).stem[:80] or "gambar"
    response = send_file(
        png_buffer,
        mimetype="image/png",
        as_attachment=True,
        download_name=f"{safe_name}-tanpa-background.png",
        max_age=0,
    )
    response.headers["X-Image-Width"] = str(original_size[0])
    response.headers["X-Image-Height"] = str(original_size[1])
    response.headers["Access-Control-Expose-Headers"] = "X-Image-Width, X-Image-Height"
    return response


@app.post("/api/scale")
def scale_image():
    uploaded = request.files.get("image")
    if uploaded is None or not uploaded.filename:
        return jsonify(error="Pilih gambar terlebih dahulu."), 400

    suffix = Path(uploaded.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return jsonify(error="Format yang didukung: PNG, JPG, WEBP, BMP, dan TIFF."), 415

    source_bytes = uploaded.read()
    if not source_bytes:
        return jsonify(error="File gambar kosong."), 400

    try:
        with Image.open(io.BytesIO(source_bytes)) as source:
            source.load()
            oriented = ImageOps.exif_transpose(source)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        return jsonify(error="File tidak dapat dibaca sebagai gambar yang valid."), 400

    scale = 2
    try:
        scale = int(request.form.get("scale", "2"))
    except ValueError:
        scale = 2

    mode = request.form.get("mode", "photo").strip().lower()
    if mode not in ("photo", "art", "ultra"):
        mode = "photo"

    denoise = request.form.get("denoise", "true").lower() == "true"
    enhance_contrast = request.form.get("enhance_contrast", "true").lower() == "true"

    try:
        sharpen = float(request.form.get("sharpen", "40")) / 100.0
    except ValueError:
        sharpen = 0.4

    try:
        scaled_img, orig_dims, new_dims = enhance_and_scale_image(
            oriented,
            scale=scale,
            mode=mode,
            denoise=denoise,
            sharpen=sharpen,
            enhance_contrast=enhance_contrast,
        )

        out_buffer = io.BytesIO()
        scaled_img.save(out_buffer, format="PNG", optimize=True)
        out_buffer.seek(0)
    except Exception as exc:
        app.logger.exception("Image scaling failed")
        return jsonify(error=f"Gagal meningkatkan kualitas gambar: {exc}"), 500

    safe_name = Path(uploaded.filename).stem[:80] or "gambar"
    response = send_file(
        out_buffer,
        mimetype="image/png",
        as_attachment=True,
        download_name=f"{safe_name}-hd-{scale}x.png",
        max_age=0,
    )
    response.headers["X-Original-Width"] = str(orig_dims[0])
    response.headers["X-Original-Height"] = str(orig_dims[1])
    response.headers["X-Scaled-Width"] = str(new_dims[0])
    response.headers["X-Scaled-Height"] = str(new_dims[1])
    response.headers["Access-Control-Expose-Headers"] = (
        "X-Original-Width, X-Original-Height, X-Scaled-Width, X-Scaled-Height"
    )
    return response


@app.post("/api/burik")
def burik_image():
    uploaded = request.files.get("image")
    if uploaded is None or not uploaded.filename:
        return jsonify(error="Pilih gambar terlebih dahulu."), 400

    suffix = Path(uploaded.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return jsonify(error="Format yang didukung: PNG, JPG, WEBP, BMP, dan TIFF."), 415

    source_bytes = uploaded.read()
    if not source_bytes:
        return jsonify(error="File gambar kosong."), 400

    try:
        with Image.open(io.BytesIO(source_bytes)) as source:
            source.load()
            oriented = ImageOps.exif_transpose(source)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        return jsonify(error="File tidak dapat dibaca sebagai gambar yang valid."), 400

    preset = request.form.get("preset", "kentang").strip().lower()
    if preset not in PRESETS and preset != "custom":
        preset = "kentang"

    try:
        burik_level = int(request.form.get("burik_level", "5"))
    except ValueError:
        burik_level = 5

    try:
        jpeg_quality = int(request.form.get("jpeg_quality", "6"))
    except ValueError:
        jpeg_quality = 6

    try:
        fry_factor = float(request.form.get("fry_factor", "1.0"))
    except ValueError:
        fry_factor = 1.0

    try:
        noise_amount = float(request.form.get("noise_amount", "0.0"))
    except ValueError:
        noise_amount = 0.0

    pixel_mode = request.form.get("pixel_mode", "nearest").strip().lower()
    if pixel_mode not in ("nearest", "bilinear"):
        pixel_mode = "nearest"

    try:
        multi_pass = int(request.form.get("multi_pass", "3"))
    except ValueError:
        multi_pass = 3

    try:
        burik_img, orig_dims, degraded_dims = apply_burik_degradation(
            oriented,
            preset=preset,
            burik_level=burik_level,
            jpeg_quality=jpeg_quality,
            fry_factor=fry_factor,
            noise_amount=noise_amount,
            pixel_mode=pixel_mode,
            multi_pass=multi_pass,
        )

        out_buffer = io.BytesIO()
        burik_img.save(out_buffer, format="JPEG", quality=max(1, min(95, jpeg_quality)))
        out_buffer.seek(0)
    except Exception as exc:
        app.logger.exception("Burik image generation failed")
        return jsonify(error=f"Gagal memburikan gambar: {exc}"), 500

    safe_name = Path(uploaded.filename).stem[:80] or "meme"
    response = send_file(
        out_buffer,
        mimetype="image/jpeg",
        as_attachment=True,
        download_name=f"{safe_name}-burik-{preset}.jpg",
        max_age=0,
    )
    response.headers["X-Original-Width"] = str(orig_dims[0])
    response.headers["X-Original-Height"] = str(orig_dims[1])
    response.headers["X-Degraded-Width"] = str(degraded_dims[0])
    response.headers["X-Degraded-Height"] = str(degraded_dims[1])
    response.headers["X-Preset"] = preset
    response.headers["Access-Control-Expose-Headers"] = (
        "X-Original-Width, X-Original-Height, X-Degraded-Width, X-Degraded-Height, X-Preset"
    )
    return response


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify(error="Ukuran gambar melebihi batas 25 MB."), 413


@app.errorhandler(500)
def internal_server_error(_error):
    return jsonify(error="Terjadi kesalahan server saat memproses gambar."), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
