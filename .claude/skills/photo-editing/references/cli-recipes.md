# CLI Recipes — ImageMagick & FFmpeg

Use `magick` (ImageMagick 7). If only ImageMagick 6 is installed, replace `magick` with `convert`
(and `magick mogrify` with `mogrify`, `magick identify` with `identify`). Check with:

```bash
command -v magick >/dev/null && IM=magick || IM=convert; $IM -version | head -1
```

All recipes write to `./output/` — never use `mogrify` in place on originals.

```bash
mkdir -p output
```

## Inspection
```bash
magick identify -verbose in.jpg | grep -Ei 'geometry|colorspace|quality|profile|exposure|iso|fnumber|focal'
exiftool -a -G1 in.jpg                     # full metadata, if installed
magick in.jpg -colorspace gray -format "%[fx:mean*255] mean, %[fx:standard_deviation*255] sd\n" info:
```

## Geometry
```bash
magick in.jpg -auto-orient -resize 2048x2048\> output/in_2048.jpg                 # long edge ≤ 2048, never upscale
magick in.jpg -auto-orient -gravity center -crop 4:5 +repage output/in_4x5.jpg     # IM7 aspect crop
magick in.jpg -auto-orient -resize 1080x1350^ -gravity center -extent 1080x1350 output/in_ig.jpg
magick in.jpg -distort Perspective 'x1,y1 X1,Y1  x2,y2 X2,Y2  x3,y3 X3,Y3  x4,y4 X4,Y4' output/in_keystone.jpg
magick in.jpg -rotate 1.5 -gravity center -crop 96%x96%+0+0 +repage output/in_level.jpg  # straighten horizon
```

## Tone & colour
```bash
magick in.jpg -level 5,250 output/in_levels.jpg                                   # black 5 / white 250 (0-255)
magick in.jpg +level 3%,100% output/in_matte.jpg                                  # lift black point (~+8)
magick in.jpg -sigmoidal-contrast 4,50% output/in_scurve.jpg                      # S-curve
magick in.jpg -evaluate multiply 1.231 output/in_+0.3ev.jpg                       # ≈ +0.3 EV (gamma-space approx.)
magick in.jpg -modulate 100,90,100 output/in_desat10.jpg                          # -10% saturation
magick in.jpg -channel B -evaluate multiply 0.97 +channel output/in_warmer.jpg    # quick warm shift
magick in.jpg -auto-level -auto-gamma output/in_auto.jpg                          # quick auto (check results)
magick in.jpg \( -clone 0 -fill '#1f6f8b' -colorize 100 \) \( -clone 0 -colorspace gray -negate \) \
      -compose blend -define compose:args=12 -composite output/in_teal_shadows.jpg  # rough shadow tint
```

### Hald CLUT (LUT) grading
```bash
magick hald:12 output/identity_hald.png        # export identity, grade it in any editor, then:
magick in.jpg graded_hald.png -hald-clut output/in_lut.jpg
```
For `.cube` LUTs use `scripts/grade.py --lut file.cube` (trilinear, strength control), or FFmpeg below.

## Sharpening, noise, grain
```bash
magick in.jpg -unsharp 0x1.0+0.8+0.01 output/in_sharp.jpg                         # radius 0, sigma 1, amount .8, thr 1%
magick in.jpg -colorspace Lab -channel R -unsharp 0x1+1+0.02 +channel -colorspace sRGB output/in_lsharp.jpg  # L-only
magick in.jpg -enhance output/in_dn.jpg                                           # light denoise
magick in.jpg \( +clone -attenuate 0.5 +noise Gaussian -colorspace gray \) -compose softlight -composite output/in_grain.jpg
magick in.jpg \( +clone -blur 0x25 \) -compose screen -define compose:args=20 -composite output/in_bloom.jpg  # soft bloom
```

## Vignette & haze
```bash
magick in.jpg \( +clone -fill white -colorize 100 -background black -vignette 0x40%+0+0 \) \
      -compose multiply -composite output/in_vignette.jpg
magick in.jpg \( +clone -fill '#d8dde3' -colorize 100 \) -compose blend -define compose:args=8 -composite output/in_haze.jpg
```

## Alpha / masks / compositing
```bash
magick in.png -alpha extract output/in_alpha.png
magick fg.png mask.png -alpha off -compose CopyOpacity -composite output/fg_cut.png
magick bg.jpg fg_cut.png -gravity center -compose over -composite output/composite.jpg
```

## Batch (non-destructive)
```bash
magick mogrify -path output -auto-orient -resize 2048x2048\> -quality 90 -strip *.jpg   # -path ⇒ never in-place
for f in raw/*.jpg; do python3 .claude/skills/photo-editing/scripts/grade.py "$f" --preset commercial; done
```

## Metadata & delivery
```bash
magick in.jpg -strip output/in_noexif.jpg                         # strip ALL metadata (incl. GPS) for web
exiftool -gps:all= -o output/in_nogps.jpg in.jpg                   # remove only location
magick in.tif -profile sRGB.icc -quality 92 -sampling-factor 4:4:4 output/in_web.jpg
magick in.jpg -quality 82 -define webp:method=6 output/in.webp
magick in.jpg -quality 60 output/in.avif
```

## FFmpeg (stills & sequences)
```bash
ffmpeg -i in.jpg -vf "lut3d=look.cube" -q:v 2 output/in_lut.jpg
ffmpeg -i in.jpg -vf "eq=contrast=1.1:brightness=0.02:saturation=0.9,curves=preset=medium_contrast" output/in_eq.jpg
ffmpeg -i in.jpg -vf "colortemperature=temperature=5500" output/in_5500k.jpg
ffmpeg -framerate 24 -i frames/%04d.png -vf "lut3d=look.cube" output/frames_%04d.png       # batch sequence
ffmpeg -i clip.mp4 -vf "select=eq(n\,0)" -vframes 1 output/first_frame.png                 # grab a still
```
