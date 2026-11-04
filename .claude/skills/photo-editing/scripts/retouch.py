#!/usr/bin/env python3
"""Editorial retouching operations (OpenCV + NumPy).

Subcommands:
  skin      Frequency-separation skin smoothing: evens low-frequency colour/tone
            blotches while keeping the high-frequency layer (pores, fine hair) 100% intact.
  whiten    Teeth / sclera: desaturate yellow+magenta casts (default 15%) and lift
            exposure (default +0.2 EV, hard-capped at +0.3 EV). Requires --mask.
  eyes      Iris micro-contrast + catchlight boost inside --mask (local clarity, no halos).
  sharpen   Output sharpening on luminance only (unsharp mask or high-pass), with threshold.
  denoise   Edge-preserving chroma/luma denoise (non-local means), run before sharpening.
  fsep      Export the low/high frequency layers as separate files for manual work.

Examples:
  python3 retouch.py skin portrait.jpg --strength 0.6
  python3 retouch.py skin portrait.jpg --mask masks/skin.png --radius 12
  python3 retouch.py whiten portrait.jpg --mask masks/teeth.png --desat 0.15 --ev 0.2
  python3 retouch.py eyes portrait.jpg --mask masks/iris.png --amount 0.35
  python3 retouch.py sharpen final.jpg --amount 0.8 --radius 1.0 --threshold 3
  python3 retouch.py fsep portrait.jpg --radius 8

Masks: grayscale, white = affected, any size (resized to image). Output goes to
./output/<name>_<op>.<ext> unless -o is given. The source file is never modified.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from _common import linear_to_srgb, load_mask, load_rgb, luminance, output_path, save_rgb, srgb_to_linear  # noqa: E402

MAX_EV_LIFT = 0.3


def auto_skin_mask(rgb: np.ndarray, feather: float) -> np.ndarray:
    """Heuristic YCrCb skin mask. Good starting point; prefer a hand/AI-painted mask for final work."""
    ycc = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2YCrCb)
    m = cv2.inRange(ycc, (40, 135, 85), (250, 180, 135))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k, iterations=2)
    m = m.astype(np.float32) / 255.0
    return cv2.GaussianBlur(m, (0, 0), max(feather, 1.0))


def split_frequencies(rgb: np.ndarray, radius: float) -> tuple[np.ndarray, np.ndarray]:
    low = cv2.GaussianBlur(rgb, (0, 0), radius)
    return low, rgb - low


def cmd_skin(a, rgb):
    mask = load_mask(a.mask, rgb.shape[:2], a.feather) if a.mask else auto_skin_mask(rgb, a.feather or 4)
    low, high = split_frequencies(rgb, a.radius)
    # Smooth only the low-frequency layer, edge-aware so jaw/nose/lip contours don't bleed.
    low8 = np.clip(low * 255, 0, 255).astype(np.uint8)
    smooth = cv2.bilateralFilter(low8, d=0, sigmaColor=a.tone_sigma, sigmaSpace=a.radius * 2).astype(np.float32) / 255
    smooth = cv2.GaussianBlur(smooth, (0, 0), a.radius * 0.5)
    new_low = low + (smooth - low) * a.strength
    out = new_low + high * a.texture  # texture=1.0 keeps pores exactly
    return rgb + (out - rgb) * mask[..., None], mask


def cmd_whiten(a, rgb):
    if not a.mask:
        sys.exit("whiten requires --mask (teeth or sclera only). Never apply globally.")
    ev = min(a.ev, MAX_EV_LIFT)
    if a.ev > MAX_EV_LIFT:
        print(f"Capping exposure lift at +{MAX_EV_LIFT} EV to avoid unnatural brightness.")
    mask = load_mask(a.mask, rgb.shape[:2], a.feather or 1.5)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)  # float32: L 0-100, a/b ~ -127..127
    # Reduce yellow (+b) and magenta (+a) only — leave neutral/cool values alone.
    lab[..., 2] = np.where(lab[..., 2] > 0, lab[..., 2] * (1 - a.desat), lab[..., 2])
    lab[..., 1] = np.where(lab[..., 1] > 0, lab[..., 1] * (1 - a.desat), lab[..., 1])
    out = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    out = linear_to_srgb(srgb_to_linear(np.clip(out, 0, 1)) * 2**ev)
    return rgb + (out - rgb) * mask[..., None], mask


def cmd_eyes(a, rgb):
    if not a.mask:
        sys.exit("eyes requires --mask covering the irises.")
    mask = load_mask(a.mask, rgb.shape[:2], a.feather or 1.0)
    y = luminance(rgb)
    detail = y - cv2.GaussianBlur(y, (0, 0), a.radius)
    # Clarity on luminance; extra boost on bright specular points (catchlights) without clipping.
    spec = np.clip((y - 0.75) / 0.25, 0, 1)
    gain = 1 + a.amount * detail / np.maximum(y, 1e-3) + a.catchlight * spec * 0.15
    out = rgb * gain[..., None]
    return rgb + (np.clip(out, 0, 1) - rgb) * mask[..., None], mask


def cmd_sharpen(a, rgb):
    mask = load_mask(a.mask, rgb.shape[:2], a.feather)
    y = luminance(rgb)
    if a.method == "highpass":
        hp = y - cv2.GaussianBlur(y, (0, 0), a.radius)
        delta = hp * a.amount
    else:
        delta = (y - cv2.GaussianBlur(y, (0, 0), a.radius)) * a.amount
    delta = np.where(np.abs(delta) * 255 < a.threshold, 0, delta)  # protect smooth areas / noise
    ratio = (np.clip(y + delta, 0, 1) / np.maximum(y, 1e-4))[..., None]
    out = np.where(y[..., None] > 1e-4, rgb * ratio, rgb)
    return rgb + (np.clip(out, 0, 1) - rgb) * mask[..., None], mask


def cmd_denoise(a, rgb):
    mask = load_mask(a.mask, rgb.shape[:2], a.feather)
    bgr = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    out = cv2.fastNlMeansDenoisingColored(bgr, None, h=a.luma, hColor=a.chroma, templateWindowSize=7, searchWindowSize=21)
    out = cv2.cvtColor(out, cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    return rgb + (out - rgb) * mask[..., None], mask


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(p):
        p.add_argument("image")
        p.add_argument("-o", "--out")
        p.add_argument("--mask")
        p.add_argument("--feather", type=float, default=0.0)
        p.add_argument("--save-mask", action="store_true", help="also write the mask used")
        p.add_argument("--quality", type=int, default=95)

    p = sub.add_parser("skin"); common(p)
    p.add_argument("--radius", type=float, default=8.0, help="frequency split sigma (≈ blemish size px)")
    p.add_argument("--strength", type=float, default=0.6, help="0..1 low-freq evening")
    p.add_argument("--tone-sigma", type=float, default=25.0, help="bilateral colour sigma")
    p.add_argument("--texture", type=float, default=1.0, help="high-freq multiplier (1.0 = untouched)")

    p = sub.add_parser("whiten"); common(p)
    p.add_argument("--desat", type=float, default=0.15, help="yellow/magenta reduction 0.10–0.20")
    p.add_argument("--ev", type=float, default=0.2, help=f"exposure lift, max +{MAX_EV_LIFT}")

    p = sub.add_parser("eyes"); common(p)
    p.add_argument("--amount", type=float, default=0.35)
    p.add_argument("--radius", type=float, default=3.0)
    p.add_argument("--catchlight", type=float, default=0.5)

    p = sub.add_parser("sharpen"); common(p)
    p.add_argument("--method", choices=["unsharp", "highpass"], default="unsharp")
    p.add_argument("--amount", type=float, default=0.7)
    p.add_argument("--radius", type=float, default=1.0)
    p.add_argument("--threshold", type=float, default=2.0, help="min change (0-255) to apply")

    p = sub.add_parser("denoise"); common(p)
    p.add_argument("--luma", type=float, default=5.0)
    p.add_argument("--chroma", type=float, default=8.0)

    p = sub.add_parser("fsep"); common(p)
    p.add_argument("--radius", type=float, default=8.0)

    a = ap.parse_args()
    rgb, original = load_rgb(a.image)

    if a.cmd == "fsep":
        low, high = split_frequencies(rgb, a.radius)
        lo = save_rgb(low, original, output_path(a.image, None, "_low").with_suffix(".png"))
        hi = save_rgb(high + 0.5, original, output_path(a.image, None, "_high").with_suffix(".png"))
        print(f"Wrote {lo}\nWrote {hi}  (high layer is offset +0.5; recombine with low + high - 0.5, i.e. Linear Light)")
        return

    out, mask = {"skin": cmd_skin, "whiten": cmd_whiten, "eyes": cmd_eyes,
                 "sharpen": cmd_sharpen, "denoise": cmd_denoise}[a.cmd](a, rgb)
    dst = save_rgb(out, original, output_path(a.image, a.out, f"_{a.cmd}"), a.quality)
    print(f"Wrote {dst}")
    if a.save_mask:
        mp = dst.with_name(dst.stem + "_mask.png")
        cv2.imwrite(str(mp), (np.clip(mask, 0, 1) * 255).astype(np.uint8))
        print(f"Wrote {mp}")


if __name__ == "__main__":
    main()
