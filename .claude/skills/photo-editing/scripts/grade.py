#!/usr/bin/env python3
"""Deterministic colour grading: exposure, white balance, levels, curves,
split-toning, saturation, 3D LUTs, and look presets.

Examples:
  python3 grade.py in.jpg --preset cinematic
  python3 grade.py in.jpg --preset commercial -o output/hero.jpg
  python3 grade.py in.jpg --wb auto --exposure 0.3 --contrast 0.25
  python3 grade.py in.jpg --lut looks/kodak.cube --lut-strength 0.7
  python3 grade.py in.jpg --split-shadow 210 --split-highlight 45 --split-amount 0.12

Order of operations (fixed, scene-referred first, display-referred last):
  white balance -> exposure (linear) -> levels/black lift -> S-curve
  -> split-tone -> saturation/vibrance -> LUT -> output
Writes to ./output/<name>_graded.<ext> unless -o is given. Never overwrites the source.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from _common import (  # noqa: E402
    hue_to_rgb, linear_to_srgb, load_mask, load_rgb, luminance, output_path, save_rgb, srgb_to_linear,
)

PRESETS: dict[str, dict] = {
    # Lifted blacks (+6/255), crushed mid-shadows, teal shadows ~210°, amber highlights ~45°.
    "cinematic": dict(black_out=6, contrast=0.18, shadow_crush=0.10, split_shadow=210, split_highlight=45,
                      split_amount=0.10, saturation=-0.08),
    # Neutral D65, punchy S-curve, whites clipped at 250, true blacks at 5.
    "commercial": dict(wb="auto", black_in=5, white_in=250, contrast=0.22, vibrance=0.12),
    # Soft, airy: lifted shadows, gentle contrast, slight warmth.
    "airy": dict(black_out=12, contrast=-0.05, exposure=0.2, temp=0.04, saturation=-0.12),
    # Desaturated, high-contrast editorial monochrome.
    "mono": dict(contrast=0.25, saturation=-1.0, black_in=4, white_in=251),
}


def white_balance(rgb: np.ndarray, mode: str) -> np.ndarray:
    """Gray-world (on mid-tones) or white-patch white balance in linear light."""
    lin = srgb_to_linear(rgb)
    y = luminance(rgb)
    if mode == "auto":
        sel = (y > 0.1) & (y < 0.9)
        ref = lin[sel].mean(axis=0) if sel.sum() > 100 else lin.reshape(-1, 3).mean(axis=0)
    elif mode == "whitepatch":
        thr = np.percentile(y, 99)
        sel = (y >= thr) & (rgb.max(axis=2) < 0.995)
        ref = lin[sel].mean(axis=0) if sel.any() else np.ones(3)
    else:
        return rgb
    gain = ref.mean() / np.maximum(ref, 1e-6)
    return linear_to_srgb(lin * gain)


def temperature_tint(rgb: np.ndarray, temp: float, tint: float) -> np.ndarray:
    """temp>0 warms, temp<0 cools; tint>0 magenta, tint<0 green. ~0.1 = strong."""
    if not temp and not tint:
        return rgb
    lin = srgb_to_linear(rgb)
    gain = np.array([1 + temp, 1 - tint * 0.5, 1 - temp], dtype=np.float32)
    gain[[0, 2]] *= 1 + tint * 0.25
    return linear_to_srgb(lin * gain)


def exposure(rgb: np.ndarray, ev: float) -> np.ndarray:
    return rgb if not ev else linear_to_srgb(srgb_to_linear(rgb) * (2.0**ev))


def levels(rgb: np.ndarray, black_in=0, white_in=255, black_out=0, white_out=255, gamma=1.0) -> np.ndarray:
    bi, wi, bo, wo = black_in / 255, white_in / 255, black_out / 255, white_out / 255
    x = np.clip((rgb - bi) / max(wi - bi, 1e-6), 0, 1) ** (1 / gamma)
    return bo + x * (wo - bo)


def s_curve(rgb: np.ndarray, amount: float, pivot: float = 0.5, shadow_crush: float = 0.0) -> np.ndarray:
    """Luma-preserving-hue S-curve. amount in [-1, 1]; shadow_crush darkens 0.1–0.35 band."""
    if not amount and not shadow_crush:
        return rgb
    y = np.clip(luminance(rgb), 0, 1)
    # Smoothstep pivoted at `pivot`: endpoints fixed, mids steepened (amount>0) or flattened (<0).
    t = np.where(y < pivot, y / pivot * 0.5, 0.5 + (y - pivot) / (1 - pivot) * 0.5)
    s = t * t * (3 - 2 * t)
    s = np.where(s < 0.5, s * 2 * pivot, pivot + (s - 0.5) * 2 * (1 - pivot))
    y2 = np.clip(y + (s - y) * float(np.clip(amount, -1, 1)) * 2, 0, 1)
    if shadow_crush:
        band = np.exp(-((y - 0.22) ** 2) / (2 * 0.08**2))
        y2 = y2 - shadow_crush * 0.25 * band * y2
    ratio = np.where(y > 1e-4, y2 / np.maximum(y, 1e-4), 1.0)[..., None]
    return rgb * ratio


def split_tone(rgb: np.ndarray, shadow_hue, highlight_hue, amount: float, balance: float = 0.0) -> np.ndarray:
    if not amount or (shadow_hue is None and highlight_hue is None):
        return rgb
    y = luminance(rgb)[..., None]
    pivot = 0.5 + balance * 0.3
    sw = np.clip((pivot - y) / pivot, 0, 1) ** 1.5
    hw = np.clip((y - pivot) / (1 - pivot), 0, 1) ** 1.5
    out = rgb.copy()
    for hue, wgt in ((shadow_hue, sw), (highlight_hue, hw)):
        if hue is None:
            continue
        tint = hue_to_rgb(hue)
        tint = tint - luminance(tint)  # zero-luma offset: shifts hue, not brightness
        out = out + tint * wgt * amount
    return out


def saturation(rgb: np.ndarray, sat: float, vib: float) -> np.ndarray:
    if not sat and not vib:
        return rgb
    y = luminance(rgb)[..., None]
    chroma = rgb - y
    if vib:
        cur = (rgb.max(axis=2) - rgb.min(axis=2))[..., None]
        chroma = chroma * (1 + vib * (1 - np.clip(cur * 1.5, 0, 1)))  # boost muted colours most
    return y + chroma * (1 + sat)


def read_cube(path: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    size, rows, dmin, dmax = None, [], np.zeros(3), np.ones(3)
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("TITLE"):
            continue
        if line.startswith("LUT_3D_SIZE"):
            size = int(line.split()[1])
        elif line.startswith("DOMAIN_MIN"):
            dmin = np.array(line.split()[1:4], dtype=np.float32)
        elif line.startswith("DOMAIN_MAX"):
            dmax = np.array(line.split()[1:4], dtype=np.float32)
        elif line[0].isdigit() or line[0] in "-.":
            rows.append([float(v) for v in line.split()[:3]])
    if not size:
        sys.exit("Only 3D .cube LUTs are supported (LUT_3D_SIZE missing).")
    lut = np.array(rows, dtype=np.float32).reshape(size, size, size, 3)  # [b][g][r]
    return lut, dmin, dmax


def apply_lut(rgb: np.ndarray, path: str, strength: float) -> np.ndarray:
    """Trilinear 3D-LUT lookup (.cube, red-fastest ordering)."""
    lut, dmin, dmax = read_cube(path)
    n = lut.shape[0]
    x = np.clip((rgb - dmin) / (dmax - dmin), 0, 1) * (n - 1)
    i0 = np.floor(x).astype(np.int32)
    i1 = np.minimum(i0 + 1, n - 1)
    f = x - i0
    r0, g0, b0 = i0[..., 0], i0[..., 1], i0[..., 2]
    r1, g1, b1 = i1[..., 0], i1[..., 1], i1[..., 2]
    fr, fg, fb = f[..., 0:1], f[..., 1:2], f[..., 2:3]
    c = lambda b, g, r: lut[b, g, r]  # noqa: E731
    out = (
        c(b0, g0, r0) * (1 - fr) * (1 - fg) * (1 - fb) + c(b0, g0, r1) * fr * (1 - fg) * (1 - fb)
        + c(b0, g1, r0) * (1 - fr) * fg * (1 - fb) + c(b0, g1, r1) * fr * fg * (1 - fb)
        + c(b1, g0, r0) * (1 - fr) * (1 - fg) * fb + c(b1, g0, r1) * fr * (1 - fg) * fb
        + c(b1, g1, r0) * (1 - fr) * fg * fb + c(b1, g1, r1) * fr * fg * fb
    )
    return rgb + (out - rgb) * strength


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("-o", "--out")
    ap.add_argument("--preset", choices=sorted(PRESETS))
    ap.add_argument("--wb", choices=["none", "auto", "whitepatch"])
    ap.add_argument("--temp", type=float, help="warm(+)/cool(-), ~±0.1 strong")
    ap.add_argument("--tint", type=float, help="magenta(+)/green(-)")
    ap.add_argument("--exposure", type=float, help="EV stops, linear light")
    ap.add_argument("--black-in", type=float, help="input black point 0-255")
    ap.add_argument("--white-in", type=float, help="input white point 0-255")
    ap.add_argument("--black-out", type=float, help="output black lift 0-255 (matte)")
    ap.add_argument("--white-out", type=float, help="output white ceiling 0-255")
    ap.add_argument("--gamma", type=float, help="midtone gamma (>1 brightens)")
    ap.add_argument("--contrast", type=float, help="S-curve amount -1..1")
    ap.add_argument("--shadow-crush", type=float, help="darken mid-shadow band 0..1")
    ap.add_argument("--split-shadow", type=float, help="shadow hue degrees (210 = teal)")
    ap.add_argument("--split-highlight", type=float, help="highlight hue degrees (45 = amber)")
    ap.add_argument("--split-amount", type=float, help="split-tone strength 0..0.3")
    ap.add_argument("--split-balance", type=float, help="-1 favours shadows, +1 highlights")
    ap.add_argument("--saturation", type=float, help="-1..1")
    ap.add_argument("--vibrance", type=float, help="-1..1 (protects saturated colours)")
    ap.add_argument("--lut", help="3D .cube LUT path")
    ap.add_argument("--lut-strength", type=float, default=1.0)
    ap.add_argument("--mask", help="grayscale mask; grade applies only where white")
    ap.add_argument("--feather", type=float, default=0.0, help="mask feather sigma px")
    ap.add_argument("--quality", type=int, default=95)
    a = ap.parse_args()

    p = dict(PRESETS.get(a.preset, {}))
    for k, v in vars(a).items():
        if v is not None and k not in ("image", "out", "preset", "mask", "feather", "quality", "lut", "lut_strength"):
            p[k] = v

    src, original = load_rgb(a.image)
    x = src
    x = white_balance(x, p.get("wb", "none"))
    x = temperature_tint(x, p.get("temp", 0.0), p.get("tint", 0.0))
    x = exposure(x, p.get("exposure", 0.0))
    x = levels(x, p.get("black_in", 0), p.get("white_in", 255), p.get("black_out", 0),
               p.get("white_out", 255), p.get("gamma", 1.0))
    x = s_curve(x, p.get("contrast", 0.0), shadow_crush=p.get("shadow_crush", 0.0))
    x = split_tone(x, p.get("split_shadow"), p.get("split_highlight"), p.get("split_amount", 0.0),
                   p.get("split_balance", 0.0))
    x = saturation(x, p.get("saturation", 0.0), p.get("vibrance", 0.0))
    if a.lut:
        x = apply_lut(np.clip(x, 0, 1), a.lut, a.lut_strength)

    m = load_mask(a.mask, src.shape[:2], a.feather)[..., None]
    x = src + (np.clip(x, 0, 1) - src) * m

    dst = save_rgb(x, original, output_path(a.image, a.out, "_graded"), a.quality)
    print(f"Wrote {dst}  (params: {p}{', lut=' + a.lut if a.lut else ''})")


if __name__ == "__main__":
    main()
