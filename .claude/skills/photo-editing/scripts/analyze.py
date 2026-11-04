#!/usr/bin/env python3
"""Diagnose an image: exposure, dynamic range, clipping, colour cast, sharpness, noise.

Usage:  python3 analyze.py photo.jpg [--json]

Read-only: never writes anything.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from _common import load_rgb, luminance, srgb_to_linear  # noqa: E402


def estimate_cct(rgb: np.ndarray) -> float | None:
    """Rough correlated colour temperature (Kelvin) of the mid-tones via McCamy."""
    y = luminance(rgb)
    sel = (y > 0.15) & (y < 0.85)
    if sel.sum() < 100:
        return None
    lin = srgb_to_linear(rgb[sel]).mean(axis=0)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    X, Y, Z = m @ lin
    s = X + Y + Z
    if s <= 0:
        return None
    x, yy = X / s, Y / s
    n = (x - 0.3320) / (0.1858 - yy)
    return float(449 * n**3 + 3525 * n**2 + 6823.3 * n + 5520.33)


def analyze(path: str) -> dict:
    import cv2

    rgb, img = load_rgb(path)
    h, w = rgb.shape[:2]
    y = luminance(rgb)
    y8 = (y * 255).astype(np.uint8)

    p = np.percentile(y8, [0.5, 5, 25, 50, 75, 95, 99.5])
    clip_hi = float((rgb.max(axis=2) >= 0.995).mean() * 100)
    clip_lo = float((rgb.max(axis=2) <= 0.005).mean() * 100)
    mean_l = float(y.mean())
    ev_offset = float(np.log2(max(np.median(y), 1e-4) / 0.46))  # vs. ~18% grey in sRGB

    # Colour cast: gray-world on mid-tones, in Lab a*/b*.
    lab = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    mids = (y > 0.15) & (y < 0.85)
    a = float(lab[..., 1][mids].mean() - 128) if mids.any() else 0.0
    b = float(lab[..., 2][mids].mean() - 128) if mids.any() else 0.0
    cast = []
    if b > 4:
        cast.append("warm/yellow")
    elif b < -4:
        cast.append("cool/blue")
    if a > 4:
        cast.append("magenta")
    elif a < -4:
        cast.append("green")

    gray = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    sharp = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    # Noise: MAD of high-pass residual on flat areas.
    resid = gray.astype(np.float32) - cv2.GaussianBlur(gray, (0, 0), 1.5).astype(np.float32)
    noise = float(np.median(np.abs(resid)) * 1.4826)
    sat = float(cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2HSV)[..., 1].mean() / 255)

    # Composition: centre of visual mass (luma-weighted) vs. rule-of-thirds.
    ys, xs = np.mgrid[0:h, 0:w]
    wgt = np.abs(resid) + 1e-6
    cx, cy = float((xs * wgt).sum() / wgt.sum() / w), float((ys * wgt).sum() / wgt.sum() / h)

    notes = []
    if ev_offset < -0.7:
        notes.append(f"Underexposed (~{ev_offset:+.1f} EV vs mid-grey).")
    elif ev_offset > 0.7:
        notes.append(f"Overexposed (~{ev_offset:+.1f} EV vs mid-grey).")
    if clip_hi > 1:
        notes.append(f"{clip_hi:.1f}% highlights clipped — recovery limited.")
    if clip_lo > 2:
        notes.append(f"{clip_lo:.1f}% crushed blacks.")
    if p[-1] - p[0] < 150:
        notes.append("Low dynamic range / flat — candidate for S-curve or levels stretch.")
    if cast:
        notes.append(f"Colour cast: {', '.join(cast)} (a*={a:+.1f}, b*={b:+.1f}).")
    if sharp < 100:
        notes.append("Soft / possibly out of focus (Laplacian variance < 100).")
    if noise > 4:
        notes.append(f"Visible noise (sigma≈{noise:.1f}/255) — denoise before sharpening.")

    exif = img.getexif()
    return {
        "file": str(path),
        "size": [w, h],
        "mode": img.mode,
        "icc_profile": bool(img.info.get("icc_profile")),
        "exif_tags": len(exif),
        "luma_percentiles_0_255": dict(zip(["p0.5", "p5", "p25", "p50", "p75", "p95", "p99.5"], [round(float(v), 1) for v in p])),
        "mean_luma": round(mean_l, 3),
        "ev_offset_vs_midgrey": round(ev_offset, 2),
        "clipped_highlights_pct": round(clip_hi, 2),
        "crushed_shadows_pct": round(clip_lo, 2),
        "lab_cast": {"a": round(a, 2), "b": round(b, 2)},
        "est_cct_kelvin": round(c) if (c := estimate_cct(rgb)) else None,
        "mean_saturation": round(sat, 3),
        "sharpness_laplacian_var": round(sharp, 1),
        "noise_sigma_0_255": round(noise, 2),
        "visual_mass_center": [round(cx, 3), round(cy, 3)],
        "notes": notes or ["No major technical faults detected."],
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()
    r = analyze(args.image)
    if args.json:
        print(json.dumps(r, indent=2))
        return
    for k, v in r.items():
        if k != "notes":
            print(f"{k:28s} {v}")
    print("\nDiagnosis:")
    for n in r["notes"]:
        print(f"  - {n}")


if __name__ == "__main__":
    main()
