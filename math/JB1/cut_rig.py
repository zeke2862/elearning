# -*- coding: utf-8 -*-
"""B 案第二版：身體（真的沒有持劍手臂）＋ 手臂＋劍，同一張圖、同一個比例。
   輸出 body.png / arm.png（支點在左側正中），以及揮劍連拍與 GIF。"""
import os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

import sys
SRC = sys.argv[1]            # 用法：python3 cut_rig.py <黑底圖> <輸出資料夾>
OUT = sys.argv[2].rstrip('/') + '/'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.array(im); a = rgb.astype(np.int16)
mx, mn = a.max(axis=2), a.min(axis=2)
fg = ndimage.binary_fill_holes(ndimage.binary_closing(mx > 42, np.ones((3, 3))))
white = mn > 205
lbl, n = ndimage.label(fg)
sz = ndimage.sum(fg, lbl, range(1, n + 1))
order = np.argsort(-sz)


def extract(comp, pick=0):
    """comp 裡面可能同時有角色和背景地面，取第 pick 大的『內部塊』再把白描邊加回來"""
    inner = comp & ~white
    il, inn = ndimage.label(inner)
    isz = ndimage.sum(inner, il, range(1, inn + 1))
    which = np.argsort(-isz)[pick]
    core = (il == int(which) + 1)
    out = ndimage.binary_dilation(core, np.ones((3, 3)), iterations=3) & comp
    out = ndimage.binary_fill_holes(out)
    ys, xs = np.where(out)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub = out[y0:y1, x0:x1]
    soft = ndimage.binary_erosion(sub, np.ones((3, 3)))
    al = np.where(sub, 255, 0).astype(np.uint8); al[sub & ~soft] = 205
    return Image.fromarray(np.dstack([rgb[y0:y1, x0:x1], al]), 'RGBA')


body = extract(lbl == int(order[0]) + 1, 0)       # 第一大塊裡的最大內部塊 = 身體
arm = extract(lbl == int(order[1]) + 1, 0)        # 第二塊 = 手臂＋劍
print('身體', body.size, '手臂', arm.size)
body.save(OUT + 'body.png', optimize=True)

# ── 手臂支點：最左端（肩／肘那一頭）的中心 ──
am = np.array(arm)[..., 3] > 128
xs = np.where(am.any(axis=0))[0]
band = am[:, xs.min():xs.min() + max(8, int(arm.width * 0.12))]
ys = np.where(band.any(axis=1))[0]
piv = (xs.min() + max(4, int(arm.width * 0.06)), int((ys.min() + ys.max()) / 2))
PW = arm.width + 2 * piv[0]
PH = max(arm.height, 2 * piv[1], 2 * (arm.height - piv[1])) + 4
armc = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
armc.alpha_composite(arm, (piv[0], PH // 2 - piv[1]))
armc.save(OUT + 'arm.png', optimize=True)
PR = (piv[0] / PW, 0.5)
print('手臂畫布', armc.size, '轉軸初值 %.3f, %.3f（僅供參考，實際用「校準面板」對位）' % PR)

# ── 身體的肩膀：右側（面朝方向）肩線高度 ──
bm = np.array(body)[..., 3] > 128
h, w = bm.shape
row = int(h * 0.335)
cols = np.where(bm[row])[0]
SH = ((cols.min() + (cols.max() - cols.min()) * 0.62) / w, row / h)
print('身體肩膀初值 %.3f, %.3f（僅供參考，實際用「校準面板」對位）' % SH)


def compose(angle, bg=(22, 26, 56, 255), pad=300, arm_scale=1.0):
    cv = Image.new('RGBA', (body.width + pad * 2, body.height + 160), bg)
    bx, by = pad, 80
    a2 = armc if arm_scale == 1 else armc.resize((round(armc.width * arm_scale), round(armc.height * arm_scale)), Image.LANCZOS)
    ar = a2.rotate(angle, resample=Image.BICUBIC, expand=True)
    cx, cy = a2.width * PR[0], a2.height * PR[1]
    r = np.radians(angle)
    ncx = (cx - a2.width / 2) * np.cos(r) + (cy - a2.height / 2) * np.sin(r) + ar.width / 2
    ncy = -(cx - a2.width / 2) * np.sin(r) + (cy - a2.height / 2) * np.cos(r) + ar.height / 2
    cv.alpha_composite(body, (bx, by))
    cv.alpha_composite(ar, (int(bx + body.width * SH[0] - ncx), int(by + body.height * SH[1] - ncy)))
    return cv


ANG = [10, 48, 72, 88, 58, 6, -34, -56, -28, 0]   # 舉劍 → 下劈 → 收招
frames = [compose(x).convert('RGB') for x in ANG]
tw = frames[0].width // 4
strip = Image.new('RGB', (tw * 5, (frames[0].height // 4) * 2), (22, 26, 56))
for i, f in enumerate(frames):
    s = f.resize((tw, f.height // 4))
    strip.paste(s, ((i % 5) * tw, (i // 5) * (f.height // 4)))
strip.save(OUT + 'check-rigB2.png')

g = [f.resize((f.width // 4, f.height // 4)) for f in frames]
g = [g[0]] * 2 + g + [g[0]] * 3
g[0].save(OUT + 'swing.gif', save_all=True, append_images=g[1:], duration=65, loop=0, optimize=True)
print('swing.gif', os.path.getsize(OUT + 'swing.gif') // 1024, 'KB')
