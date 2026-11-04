"""Shared helpers for the photo-editing skill scripts.

Guarantees the non-destructive contract: every write goes to ./output (or a
caller-supplied path) and never overwrites the source file.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps


def load_rgb(path: str | Path) -> tuple[np.ndarray, Image.Image]:
    """Load an image as float32 RGB in [0, 1] plus the original PIL handle.

    EXIF orientation is applied so pixels match what viewers display.
    Alpha (if any) is kept on the PIL handle for `save_rgb` to restore.
    """
    src = Image.open(path)
    oriented = ImageOps.exif_transpose(src)
    rgb = oriented.convert("RGB")
    arr = np.asarray(rgb, dtype=np.float32) / 255.0
    oriented.info.update(src.info)
    return arr, oriented


def output_path(src: str | Path, out: str | None, suffix: str = "_edited") -> Path:
    """Resolve a safe output path. Refuses to overwrite the source."""
    src = Path(src).resolve()
    if out:
        dst = Path(out).resolve()
    else:
        dst = (Path.cwd() / "output" / f"{src.stem}{suffix}{src.suffix}").resolve()
    if dst == src:
        sys.exit(f"Refusing to overwrite source file: {src}")
    dst.parent.mkdir(parents=True, exist_ok=True)
    return dst


def save_rgb(arr: np.ndarray, original: Image.Image, dst: Path, quality: int = 95) -> Path:
    """Save float RGB [0,1] to dst, carrying over ICC profile, EXIF and alpha."""
    out = Image.fromarray((np.clip(arr, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8), "RGB")
    if original.mode in ("RGBA", "LA") or "transparency" in original.info:
        out.putalpha(original.convert("RGBA").getchannel("A"))
    kwargs: dict = {}
    if icc := original.info.get("icc_profile"):
        kwargs["icc_profile"] = icc
    exif = original.getexif()
    if exif:
        exif[0x0112] = 1  # orientation already baked into pixels
        kwargs["exif"] = exif.tobytes()
    ext = dst.suffix.lower()
    if ext in (".jpg", ".jpeg"):
        if out.mode == "RGBA":
            out = out.convert("RGB")
        kwargs.update(quality=quality, subsampling=0, optimize=True)
    elif ext == ".webp":
        kwargs.update(quality=quality, method=6)
    out.save(dst, **kwargs)
    return dst


def load_mask(path: str | None, shape: tuple[int, int], feather: float = 0.0) -> np.ndarray:
    """Load a grayscale mask (white = affected) as float [0,1], HxW.

    Returns an all-ones mask when no path is given.
    """
    h, w = shape
    if not path:
        return np.ones((h, w), dtype=np.float32)
    m = ImageOps.exif_transpose(Image.open(path)).convert("L").resize((w, h), Image.LANCZOS)
    mask = np.asarray(m, dtype=np.float32) / 255.0
    if feather > 0:
        import cv2

        mask = cv2.GaussianBlur(mask, (0, 0), feather)
    return mask


# --- colour-space helpers -------------------------------------------------

def srgb_to_linear(x: np.ndarray) -> np.ndarray:
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, 0.0, None)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def luminance(rgb: np.ndarray) -> np.ndarray:
    """Rec.709 luma on (gamma-encoded) RGB."""
    return rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def hue_to_rgb(hue_deg: float) -> np.ndarray:
    """Fully saturated RGB unit tint for a hue angle (0=red, 45=amber, 210=teal)."""
    import colorsys

    return np.array(colorsys.hsv_to_rgb((hue_deg % 360) / 360.0, 1.0, 1.0), dtype=np.float32)
