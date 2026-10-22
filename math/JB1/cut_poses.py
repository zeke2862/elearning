# -*- coding: utf-8 -*-
"""黑底四姿勢（第三版）：靠「白色描邊」把角色和腳下泥土分開。
   角色內部是一大塊、泥土是另一塊，取最大塊再把白描邊加回來即可。"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

import sys
SRC = sys.argv[1]            # 用法：python3 cut_poses.py <黑底圖> <輸出資料夾>
OUT = sys.argv[2].rstrip('/') + '/'
os.makedirs(OUT, exist_ok=True)
POSE = ['idle', 'attack', 'hit', 'win']
FW, FH, BASE = 320, 380, 360

im = Image.open(SRC).convert('RGB')
rgb = np.array(im); a = rgb.astype(np.int16)
mx, mn = a.max(axis=2), a.min(axis=2)
fg = ndimage.binary_fill_holes(ndimage.binary_closing(mx > 42, np.ones((3, 3))))
white = mn > 205

lbl, n = ndimage.label(fg)
sz = ndimage.sum(fg, lbl, range(1, n + 1))
ids = [i + 1 for i, s in enumerate(sz) if s > 20000]
# 由左到右排序成 待機／揮擊／受擊／勝利
order = []
for k in ids:
    xs = np.where((lbl == k).any(axis=0))[0]
    order.append((xs.min(), k))
order.sort()
ids = [k for _, k in order]
print('找到', len(ids), '個姿勢')

sprites = []
for k in ids:
    comp = (lbl == k)
    inner = comp & ~white
    il, inn = ndimage.label(inner)
    isz = ndimage.sum(inner, il, range(1, inn + 1))
    char_inner = (il == int(np.argmax(isz)) + 1)              # 最大塊＝角色；泥土是另一塊
    char = ndimage.binary_dilation(char_inner, np.ones((3, 3)), iterations=3) & comp
    char = ndimage.binary_fill_holes(char)
    ys, xs = np.where(char)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub = char[y0:y1, x0:x1]
    crgb = rgb[y0:y1, x0:x1]
    soft = ndimage.binary_erosion(sub, np.ones((3, 3)))
    al = np.where(sub, 255, 0).astype(np.uint8); al[sub & ~soft] = 205
    sp = Image.fromarray(np.dstack([crgb, al]), 'RGBA')
    m2 = np.array(sp)[..., 3] > 128
    yy, xx = np.where(m2)
    sprites.append({'img': sp, 'bottom': yy.max(), 'cx': (xx.min() + xx.max()) / 2, 'bh': yy.max() - yy.min()})
    print('   尺寸', sp.size, '身高', sprites[-1]['bh'])

scale = (FH * 0.84) / max(s['bh'] for s in sprites)
frames = []
for i, s in enumerate(sprites[:4]):
    im2 = s['img']
    nw, nh = max(1, round(im2.width * scale)), max(1, round(im2.height * scale))
    im2 = im2.resize((nw, nh), Image.LANCZOS)
    cv = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    cv.alpha_composite(im2, (round(FW / 2 - s['cx'] * scale), round(BASE - s['bottom'] * scale)))
    cv.save(OUT + 'pose-%s.png' % POSE[i], optimize=True)
    frames.append(cv)
    print('pose-%s.png' % POSE[i], (nw, nh), os.path.getsize(OUT + 'pose-%s.png' % POSE[i]) // 1024, 'KB')

sheet = Image.new('RGBA', (FW * 4, FH), (0, 0, 0, 0))
for i, f in enumerate(frames):
    sheet.alpha_composite(f, (FW * i, 0))
sheet.save(OUT + 'hero-sheet.png', optimize=True)
chk = Image.new('RGBA', sheet.size, (26, 31, 66, 255)); chk.alpha_composite(sheet)
chk.convert('RGB').save(OUT + 'check-sheetA3.png')
print('hero-sheet.png', sheet.size, os.path.getsize(OUT + 'hero-sheet.png') // 1024, 'KB')
