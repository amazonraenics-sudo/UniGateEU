#!/usr/bin/env python3
"""Build a grayscale mask from simple shapes, in original-image pixel coordinates.

Shapes are filled ellipses inscribed in boxes, or circles. --exclude shapes are
cut out after all includes. White = affected.

Examples:
  # face region minus eyes/brows and lips
  python3 make_mask.py in.jpg --ellipse 930,950,950,1020 \
      --exclude 985,1050,347,250 --exclude 1459,1040,347,250 --exclude 1277,1760,328,174 \
      --feather 12 -o output/face_region.png
  # irises
  python3 make_mask.py in.jpg --circle 1182,1233,51 --circle 1642,1207,51 --feather 2 -o output/iris.png

Tip: if you located features on a downscaled preview, multiply by (original width / preview width).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).parent))
from _common import output_path  # noqa: E402


def ints(s: str, n: int) -> list[int]:
    v = [int(round(float(t))) for t in s.split(",")]
    if len(v) != n:
        raise argparse.ArgumentTypeError(f"expected {n} comma-separated numbers, got {s!r}")
    return v


def draw(m: np.ndarray, shape: str, v: list[int], val: int) -> None:
    if shape == "ellipse":
        x, y, w, h = v
        cv2.ellipse(m, (x + w // 2, y + h // 2), (w // 2, h // 2), 0, 0, 360, val, -1)
    elif shape == "rect":
        x, y, w, h = v
        cv2.rectangle(m, (x, y), (x + w, y + h), val, -1)
    else:
        x, y, r = v
        cv2.circle(m, (x, y), r, val, -1)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image", help="reference image (for size only)")
    ap.add_argument("-o", "--out")
    ap.add_argument("--ellipse", action="append", default=[], help="x,y,w,h bounding box")
    ap.add_argument("--rect", action="append", default=[], help="x,y,w,h")
    ap.add_argument("--circle", action="append", default=[], help="cx,cy,r")
    ap.add_argument("--exclude", action="append", default=[], help="x,y,w,h ellipse to cut out")
    ap.add_argument("--dilate", type=int, default=0, help="grow mask by N px (object removal: 8-16)")
    ap.add_argument("--feather", type=float, default=0.0, help="Gaussian sigma px")
    ap.add_argument("--preview", action="store_true", help="also write a red overlay preview JPEG")
    a = ap.parse_args()

    img = ImageOps.exif_transpose(Image.open(a.image))
    w, h = img.size
    m = np.zeros((h, w), np.uint8)
    for s in a.ellipse:
        draw(m, "ellipse", ints(s, 4), 255)
    for s in a.rect:
        draw(m, "rect", ints(s, 4), 255)
    for s in a.circle:
        draw(m, "circle", ints(s, 3), 255)
    if a.dilate:
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * a.dilate + 1,) * 2))
    for s in a.exclude:
        draw(m, "ellipse", ints(s, 4), 0)
    if a.feather:
        m = cv2.GaussianBlur(m, (0, 0), a.feather)

    dst = output_path(a.image, a.out, "_mask").with_suffix(".png")
    cv2.imwrite(str(dst), m)
    print(f"Wrote {dst}  ({w}x{h}, {(m > 127).mean() * 100:.1f}% selected)")
    if a.preview:
        rgb = np.asarray(img.convert("RGB"), dtype=np.float32)
        alpha = (m.astype(np.float32) / 255 * 0.5)[..., None]
        ov = rgb * (1 - alpha) + np.array([255, 0, 0], np.float32) * alpha
        pv = dst.with_name(dst.stem + "_preview.jpg")
        scale = min(1.0, 1200 / max(w, h))
        Image.fromarray(ov.astype(np.uint8)).resize((int(w * scale), int(h * scale))).save(pv, quality=85)
        print(f"Wrote {pv}")


if __name__ == "__main__":
    main()
