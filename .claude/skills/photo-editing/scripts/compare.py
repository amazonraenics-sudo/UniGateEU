#!/usr/bin/env python3
"""Before/after QA: side-by-side preview plus a difference heat-map and stats.

Usage:  python3 compare.py original.jpg output/original_graded.jpg [-o output/compare.jpg] [--max 1600]

Use this to verify the Lock Clause: the diff map should be dark everywhere you
did not intend to change.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from _common import load_rgb, output_path  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("before")
    ap.add_argument("after")
    ap.add_argument("-o", "--out")
    ap.add_argument("--max", type=int, default=1600, help="max width of each panel")
    a = ap.parse_args()

    b, _ = load_rgb(a.before)
    f, _ = load_rgb(a.after)
    if b.shape != f.shape:
        f = cv2.resize(f, (b.shape[1], b.shape[0]), interpolation=cv2.INTER_AREA)
    diff = np.abs(f - b).max(axis=2)
    print(f"mean |Δ| = {diff.mean() * 255:.2f}/255   max |Δ| = {diff.max() * 255:.0f}/255   "
          f"pixels changed >2/255: {(diff > 2 / 255).mean() * 100:.1f}%")

    heat = cv2.applyColorMap((np.clip(diff * 4, 0, 1) * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
    heat = cv2.cvtColor(heat, cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    panel = np.concatenate([b, f, heat], axis=1)
    scale = min(1.0, a.max * 3 / panel.shape[1])
    if scale < 1:
        panel = cv2.resize(panel, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    dst = output_path(a.after, a.out, "_compare").with_suffix(".jpg")
    cv2.imwrite(str(dst), cv2.cvtColor((panel * 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"Wrote {dst}  (before | after | diff×4)")


if __name__ == "__main__":
    main()
