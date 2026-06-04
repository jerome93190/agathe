#!/usr/bin/env python3
"""
Génère les icônes PNG de l'application (à partir d'un rendu vectoriel maison),
sans aucune dépendance externe : encodeur PNG en pur Python (zlib + crc32).

Usage : python3 tools/generate-icons.py
Sortie : icons/icon-192.png, icon-512.png, *-maskable.png, apple-touch-icon.png, favicon-32.png
"""
import os
import zlib
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "icons")
os.makedirs(OUT, exist_ok=True)

# Couleurs (R, G, B, A)
YELLOW = (255, 214, 10, 255)
YELLOW_EDGE = (224, 174, 0, 255)
WHITE = (255, 255, 255, 255)
TITLE = (58, 58, 60, 255)
BODY = (199, 199, 204, 255)

M = 1024  # résolution maîtresse (on dessine à 2× puis on réduit -> anti-aliasing)
SC = M / 512.0


def canvas(w, h):
    return bytearray(w * h * 4)  # tout à 0 = transparent


def blit_rect(buf, w, h, x0, y0, x1, y1, col):
    x0 = max(0, int(x0)); y0 = max(0, int(y0))
    x1 = min(w, int(x1)); y1 = min(h, int(y1))
    r, g, b, a = col
    for y in range(y0, y1):
        i = (y * w + x0) * 4
        for x in range(x0, x1):
            buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a
            i += 4


def rounded(buf, w, h, x0, y0, x1, y1, rad, col, clip_top=None):
    """Remplit un rectangle à coins arrondis. clip_top limite au besoin en y."""
    r, g, b, a = col
    yy0 = max(0, int(y0)); yy1 = min(h, int(y1))
    if clip_top is not None:
        yy1 = min(yy1, int(clip_top))
    xx0 = max(0, int(x0)); xx1 = min(w, int(x1))
    rad2 = rad * rad
    for y in range(yy0, yy1):
        # centre vertical de l'arrondi le plus proche
        if y < y0 + rad:
            cy = y0 + rad
        elif y > y1 - rad:
            cy = y1 - rad
        else:
            cy = None
        base = (y * w) * 4
        for x in range(xx0, xx1):
            if cy is not None:
                if x < x0 + rad:
                    cx = x0 + rad
                elif x > x1 - rad:
                    cx = x1 - rad
                else:
                    cx = None
                if cx is not None:
                    dx = x - cx; dy = y - cy
                    if dx * dx + dy * dy > rad2:
                        continue
            i = base + x * 4
            buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a


def circle(buf, w, h, cx, cy, rad, col):
    r, g, b, a = col
    rad2 = rad * rad
    for y in range(max(0, int(cy - rad)), min(h, int(cy + rad + 1))):
        base = (y * w) * 4
        for x in range(max(0, int(cx - rad)), min(w, int(cx + rad + 1))):
            dx = x - cx; dy = y - cy
            if dx * dx + dy * dy <= rad2:
                i = base + x * 4
                buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a


def s(v):
    return v * SC


def draw_lines(buf, x_left=116, x_right=396):
    # ligne de titre (foncée) + lignes de corps (grises)
    rounded(buf, M, M, s(x_left), s(214), s(x_right), s(236), s(11), TITLE)
    rounded(buf, M, M, s(x_left), s(266), s(x_right), s(284), s(9), BODY)
    rounded(buf, M, M, s(x_left), s(312), s(x_right), s(330), s(9), BODY)
    rounded(buf, M, M, s(x_left), s(358), s(x_left + 190), s(376), s(9), BODY)


def render_card(square=False):
    """Bloc-notes : carte blanche, bandeau jaune, reliure (3 trous), lignes de texte."""
    buf = canvas(M, M)
    corner = 0 if square else 115
    # carte blanche
    rounded(buf, M, M, 0, 0, M, M, s(corner), WHITE)
    # bandeau jaune (en respectant l'arrondi du haut)
    for y in range(0, int(s(150))):
        # réutilise la logique d'arrondi : on peint en jaune là où la carte est blanche
        if y < s(corner):
            cy = s(corner)
        else:
            cy = None
        base = (y * M) * 4
        for x in range(0, M):
            if buf[base + x * 4 + 3] == 0:
                continue
            if cy is not None:
                if x < s(corner):
                    cx = s(corner)
                elif x > M - s(corner):
                    cx = M - s(corner)
                else:
                    cx = None
                if cx is not None:
                    dx = x - cx; dy = y - cy
                    if dx * dx + dy * dy > s(corner) * s(corner):
                        continue
            i = base + x * 4
            buf[i] = YELLOW[0]; buf[i + 1] = YELLOW[1]; buf[i + 2] = YELLOW[2]; buf[i + 3] = 255
    # reliure : 3 anneaux
    for cx in (150, 256, 362):
        circle(buf, M, M, s(cx), s(150), s(21), YELLOW_EDGE)
        circle(buf, M, M, s(cx), s(150), s(14), WHITE)
    draw_lines(buf)
    return buf


def render_maskable():
    """Fond jaune plein (sûr sous masque) + carte blanche centrée avec lignes."""
    buf = canvas(M, M)
    blit_rect(buf, M, M, 0, 0, M, M, YELLOW)
    rounded(buf, M, M, s(96), s(96), s(416), s(416), s(56), WHITE)
    # petit bandeau d'accent en haut de la carte
    rounded(buf, M, M, s(96), s(96), s(416), s(150), s(56), YELLOW, clip_top=s(150))
    blit_rect(buf, M, M, s(96), s(140), s(416), s(150), YELLOW)
    for cx in (170, 256, 342):
        circle(buf, M, M, s(cx), s(150), s(16), YELLOW_EDGE)
        circle(buf, M, M, s(cx), s(150), s(11), WHITE)
    rounded(buf, M, M, s(140), s(206), s(372), s(226), s(10), TITLE)
    rounded(buf, M, M, s(140), s(252), s(372), s(270), s(9), BODY)
    rounded(buf, M, M, s(140), s(296), s(372), s(314), s(9), BODY)
    rounded(buf, M, M, s(140), s(340), s(300), s(358), s(9), BODY)
    return buf


def downscale(src, sw, sh, dw, dh):
    dst = bytearray(dw * dh * 4)
    fx = sw / dw; fy = sh / dh
    for dy in range(dh):
        y0 = int(dy * fy); y1 = int((dy + 1) * fy)
        if y1 <= y0:
            y1 = y0 + 1
        for dx in range(dw):
            x0 = int(dx * fx); x1 = int((dx + 1) * fx)
            if x1 <= x0:
                x1 = x0 + 1
            r = g = b = a = 0; n = 0
            for yy in range(y0, y1):
                rb = (yy * sw) * 4
                for xx in range(x0, x1):
                    i = rb + xx * 4
                    al = src[i + 3]
                    r += src[i] * al; g += src[i + 1] * al; b += src[i + 2] * al
                    a += al; n += 1
            di = (dy * dw + dx) * 4
            if a > 0:
                dst[di] = min(255, r // a)
                dst[di + 1] = min(255, g // a)
                dst[di + 2] = min(255, b // a)
                dst[di + 3] = a // n
    return dst


def write_png(path, buf, w, h):
    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data +
                struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)
        raw += buf[y * stride:(y + 1) * stride]
    comp = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)))
        f.write(chunk(b"IDAT", comp))
        f.write(chunk(b"IEND", b""))
    print("écrit", os.path.relpath(path), f"{w}x{h}")


def main():
    rounded_master = render_card(square=False)
    square_master = render_card(square=True)
    maskable_master = render_maskable()

    targets = [
        (rounded_master, "icon-512.png", 512),
        (rounded_master, "icon-192.png", 192),
        (rounded_master, "favicon-32.png", 32),
        (square_master, "apple-touch-icon.png", 180),
        (maskable_master, "icon-512-maskable.png", 512),
        (maskable_master, "icon-192-maskable.png", 192),
    ]
    for master, name, size in targets:
        out = downscale(master, M, M, size, size)
        write_png(os.path.join(OUT, name), out, size, size)


if __name__ == "__main__":
    main()
