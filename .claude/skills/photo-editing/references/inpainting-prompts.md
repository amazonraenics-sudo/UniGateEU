# AI Inpainting & Generative Prompt Playbook

Every inpainting / generative-fill prompt uses the **4-part architecture**, in this order:

| # | Part | Content |
|---|------|---------|
| 1 | **Action Verb** | One of `Replace` · `Reconstruct` · `Grade` · `Isolate` · `Recover` |
| 2 | **Target Region & Coordinate** | Exact location: quadrant, depth plane, anatomical/structural landmark, or pixel box `x,y,w,h` |
| 3 | **Target Aesthetic & Technical Lighting** | Focal length, aperture/DoF, Kelvin, light direction + falloff, film stock / sensor look, grain |
| 4 | **Lock Clause** | Everything that must stay identical (identity, texture, framing, shadows, perspective) |

Template:

```
[ACTION] the [REGION / COORDINATE] with [REPLACEMENT CONTENT],
shot on [FOCAL LENGTH] at [APERTURE], [DoF DESCRIPTION], [KELVIN]K [LIGHT TYPE] from [DIRECTION]
with [FALLOFF], [FILM STOCK / GRAIN].
Preserve [LOCK LIST] exactly; match existing [PERSPECTIVE / VANISHING POINTS / NOISE PATTERN].
```

## Mask rules (apply before prompting)

- Mask = white on the region to regenerate, black everywhere else. Save as 8-bit PNG same size as source.
- **Dilate** the mask 8–16 px beyond the object edge, and include its **cast shadow and contact shadow**.
- **Feather** 2–6 px so the model blends grain and tone at the seam.
- Keep the mask tight around faces/hands — never let it touch eyes, lips or fingers you did not ask to change.
- Generate the mask with OpenCV when the object is a clean colour/shape, e.g.:
  ```bash
  python3 - <<'PY'
  import cv2, numpy as np
  img = cv2.imread("in.jpg"); h, w = img.shape[:2]
  m = np.zeros((h, w), np.uint8)
  cv2.rectangle(m, (x, y), (x + bw, y + bh), 255, -1)          # or cv2.fillPoly for polygons
  m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
  m = cv2.GaussianBlur(m, (0, 0), 3)
  import os; os.makedirs("output", exist_ok=True); cv2.imwrite("output/in_mask.png", m)
  PY
  ```
- Quick non-AI fallback for small blemishes / dust / wires: `cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)`.

## Model notes

| Model | Strength | Tips |
|-------|----------|------|
| FLUX Fill / Kontext | Best structural coherence, follows long prompts | Full sentences; put Lock Clause last; denoise/strength 0.85–1.0 for removal |
| Stable Diffusion (SDXL inpaint) | Fine control, ControlNet | Add negative prompt: `blurry seam, duplicated limbs, plastic skin, halo, text, watermark`; strength 0.6–0.8 for retouch, 0.95+ for removal |
| Recraft | Clean vector-ish commercial fills, product BGs | Specify surface material and colour hex |
| Midjourney (Vary Region / Editor) | Aesthetic restyling | Short, comma-dense; use `--style raw` to reduce stylisation; no true lock — verify with `compare.py` |
| Higgsfield (connected MCP) | Background removal, upscale, outpaint, relight | Use `remove_background`, `upscale_image`, `outpaint_image`; still write the prompt with the 4-part formula |

## Ready-made prompts

### Cleanplate — object removal
```
Reconstruct the lower-left quadrant where the parked bicycle stood, rebuilding the weathered red brick
wall with consistent horizontal mortar lines matching the left neighbouring courses, and continuing the
grey concrete pavement joints toward the vanishing point.
Shot on 35mm at f/5.6, deep depth of field, overcast 6500K diffuse daylight from upper left, soft falloff.
Remove the bicycle's cast shadow and the warm bounce it left on the wall; reconcile ambient occlusion
at the wall base to match the untouched right side.
Preserve the pedestrian, the window frames, camera angle, perspective lines, and existing film grain exactly.
```

### Background replacement — portrait
```
Replace the midground and background behind the subject (everything outside the hair/shoulder silhouette)
with a softly defocused minimalist studio sweep in warm grey #8A8580.
Shot on 85mm at f/1.8, shallow depth of field with creamy circular bokeh, 5200K key from camera left at
45°, gentle rim light from rear right matching the existing hair highlight.
Preserve the subject's face, natural skin texture, flyaway hair contour, wardrobe, camera angle,
and existing ambient shadow directions exactly; no edge halo.
```

### Grade — region-limited
```
Grade the sky region in the upper third above the treeline to a late golden-hour palette,
3800K warm amber near the horizon falling off to cool 9000K blue at the top edge.
Shot on 24mm at f/8, deep focus, low sun from frame right, natural Rayleigh gradient, Kodak Portra 400 grain.
Preserve the treeline silhouette, building edges, foreground exposure, and all cloud shapes exactly.
```

### Isolate — product cut-out
```
Isolate the perfume bottle in the centre of frame onto a pure transparent background,
keeping the glass refraction, cap specular highlights, and liquid tint.
Shot on 100mm macro at f/11, edge-to-edge sharp, 5600K softbox from top right.
Preserve the bottle silhouette, label typography, and internal reflections exactly; no fringing.
```

### Recover — damaged / clipped detail
```
Recover the blown highlight on the subject's forehead (upper-centre, above the brow line),
restoring natural skin tone and pore texture consistent with the surrounding cheek.
Shot on 85mm at f/2.8, 5000K beauty dish from front-above, soft specular falloff.
Preserve facial structure, brow hairs, existing makeup, and the remaining specular sheen direction exactly.
```

### Wardrobe / collar fix
```
Reconstruct the subject collar line on the left side of the shirt, flattening the folded-under point so it
mirrors the right collar's shape and stitch line.
Shot on 50mm at f/4, 5500K window light from camera right, soft directional falloff.
Preserve the neck, jaw, skin texture, fabric weave, button placement, and shadow direction exactly.
```

## Negative / failure checklist (verify after generation)

- Seam visible at mask edge? → enlarge feather, raise mask dilation, re-run.
- Grain mismatch? → add matched grain: `magick out.png \( +clone -attenuate 0.6 +noise Gaussian -colorspace gray \) -compose softlight -composite out_grain.png`
- Shadow direction contradicts scene? → restate light direction in part 3, reduce strength.
- Identity drift on faces? → mask was too wide; tighten and lock "facial structure, eye shape, lip contour".
- Always run `scripts/compare.py` against the source to confirm nothing outside the mask moved.
