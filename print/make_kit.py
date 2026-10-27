"""Shoal home kit, as 3D-printable STL files.

Builds the printed parts of the looks-like prototype of the kit the app describes:
stones in three sizes, and a base for one bought glass jar, with a round end
where spare stones charge.

Plain Python, no dependencies. Run from anywhere:

    python3 print/make_kit.py

Every size is in millimetres and lives in the constants below.
"""

import math
import os
import struct

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stl")

# Jar: bought, not printed. Sized for Dollar Tree's Wide Cylindrical Vase, 8 in.
# (SKU 385415): 8 in tall, about 150 mm across, measured from its product photo,
# since the listing doesn't give a width. The jar sits on a stepped seat; the step
# just wider than its foot keeps it from sliding. Measure the real vase and put
# its bottom diameter plus about 1 mm in SEATS_D for a snug fit.
SEATS_D = [146, 150, 154, 158]      # seat diameters, small to large
SEAT_STEP = 2.2                     # rise between seats
SEAT_RIM = 3.0                      # flat rim outside the largest seat

# Stones: pebbles with a domed top and a flat bottom, big enough to hold a light.
# The small stone is the smallest that fits LIGHT inside; medium and large step up
# from it (closer together than the app's x0.74 and x1.3, so large stones still fit the vase).
STONE_M = (77.0, 69.0, 40.0)     # medium: length, width, height
STONE_SCALE = {"small": 0.87, "medium": 1.0, "large": 1.13}
LIGHT = (43.0, 27.0)  # Aluckyying mini submersible light (listed 41 x 25), with slack
LIGHT_GAP = 0.5       # room around it
# Hollow stones print as two halves that glue around a light.
STONE_WALL = 1.2      # three lines of a 0.4 mm nozzle; thin enough to glow through
LIP_H = 1.5           # the bottom half's locating lip
LIP_WALL = 1.2
LIP_FIT = 0.2         # gap between the lip and the top half

# Printed at the SJSU Engineering Makerspace, on a Bambu P1S or X1C (254 x 254 mm bed).
# PLATE_STONES is how many stones to print, spread over as many plates as it takes.
PLATE_STONES = {"small": 3, "medium": 3, "large": 3}
PLATE_BED = 244.0     # usable width on a Bambu bed, leaving a margin

# Base: one piece per vase, in a row, then a round charging pad for spare stones.
# The whole row is too long for one bed, so each vase and the pad get their own piece.
VASES = 2
BASE_H = 5.0         # kept low so it prints in under the SJSU lab's 6-hour limit
BASE_MARGIN = 4.0     # bar edge beyond the seat
PAD_R = 60.0          # the charging pad's round end, narrower than the vase pieces
DISH_R = 54.0         # its dish, about 6 to 8 stones' worth
DISH_RISE = 5.0       # dish pedestal height above the bar
DISH_DEPTH = 4.0

SEG = 128             # facets around round parts


# ---------- mesh helpers ----------

class Mesh:
    def __init__(self):
        self.v, self.f = [], []

    def add(self, other, dx=0.0, dy=0.0, dz=0.0):
        n = len(self.v)
        self.v += [(x + dx, y + dy, z + dz) for x, y, z in other.v]
        self.f += [(a + n, b + n, c + n) for a, b, c in other.f]
        return self

    def volume(self):
        s = 0.0
        for a, b, c in self.f:
            (x1, y1, z1), (x2, y2, z2), (x3, y3, z3) = self.v[a], self.v[b], self.v[c]
            s += x1 * (y2 * z3 - y3 * z2) - x2 * (y1 * z3 - y3 * z1) + x3 * (y1 * z2 - y2 * z1)
        return s / 6.0

    def outward(self):
        if self.volume() < 0:
            self.f = [(a, c, b) for a, b, c in self.f]
        return self

    def bounds(self):
        xs, ys, zs = zip(*self.v)
        return (min(xs), min(ys), min(zs)), (max(xs), max(ys), max(zs))


def revolve(profile, sx=1.0, sy=1.0, seg=SEG):
    """Revolve a closed (r, z) profile around the z axis. Points with r == 0 become poles.
    sx and sy stretch it into an oval, which is how the stones get their pebble shape.
    A point can also be (rx, ry, z), to give that ring its own oval."""
    m = Mesh()
    ids = []
    profile = [pt if len(pt) == 3 else (pt[0] * sx, pt[0] * sy, pt[1]) for pt in profile]
    for rx, ry, z in profile:
        if rx < 1e-9:
            ids.append([len(m.v)] * seg)
            m.v.append((0.0, 0.0, z))
        else:
            ring = []
            for j in range(seg):
                a = 2 * math.pi * j / seg
                ring.append(len(m.v))
                m.v.append((rx * math.cos(a), ry * math.sin(a), z))
            ids.append(ring)
    n = len(profile)
    for i in range(n):
        p, q = ids[i], ids[(i + 1) % n]
        pa, qa = profile[i][0] < 1e-9, profile[(i + 1) % n][0] < 1e-9
        if pa and qa:
            continue
        for j in range(seg):
            k = (j + 1) % seg
            if pa:
                m.f.append((p[0], q[j], q[k]))
            elif qa:
                m.f.append((p[j], q[0], p[k]))
            else:
                m.f += [(p[j], q[j], q[k]), (p[j], q[k], p[k])]
    return m.outward()


def extrude(poly, z0, z1):
    """Extrude a convex polygon (counter-clockwise, in xy) from z0 to z1."""
    m = Mesh()
    n = len(poly)
    m.v = [(x, y, z0) for x, y in poly] + [(x, y, z1) for x, y in poly]
    for i in range(1, n - 1):
        m.f += [(0, i + 1, i), (n, n + i, n + i + 1)]
    for i in range(n):
        j = (i + 1) % n
        m.f += [(i, j, n + j), (i, n + j, n + i)]
    return m.outward()


def arc(cx, cz, r, a0, a1, steps=12):
    return [(cx + r * math.cos(a0 + (a1 - a0) * t / steps), cz + r * math.sin(a0 + (a1 - a0) * t / steps)) for t in range(steps + 1)]


def circle(cx, cy, r, seg=SEG):
    return [(cx + r * math.cos(2 * math.pi * j / seg), cy + r * math.sin(2 * math.pi * j / seg)) for j in range(seg)]


def hull(pts):
    pts = sorted(set((round(x, 6), round(y, 6)) for x, y in pts))
    def half(ps):
        h = []
        for p in ps:
            while len(h) >= 2 and (h[-1][0] - h[-2][0]) * (p[1] - h[-2][1]) - (h[-1][1] - h[-2][1]) * (p[0] - h[-2][0]) <= 0:
                h.pop()
            h.append(p)
        return h
    lo, hi = half(pts), half(pts[::-1])
    return lo[:-1] + hi[:-1]


# ---------- parts ----------

PEBBLE_N, PEBBLE_FLAT = 2.6, 0.9     # squareness of the curve, and the flat floor underneath


def dome(rx, ry, ht, steps=24):
    """The upper curve of a pebble, from the top down to its widest ring at z = 0."""
    out = []
    for i in range(steps + 1):
        t = (math.pi / 2) * i / steps
        k = math.sin(t) ** (2 / PEBBLE_N)
        out.append((rx * k, ry * k, ht * math.cos(t) ** (2 / PEBBLE_N)))
    return out


def belly(rx, ry, hb, steps=24):
    """The lower curve, from the widest ring down to the flat patch and the middle."""
    out = []
    for i in range(steps + 1):
        u = (math.pi / 2) * i / steps
        k = PEBBLE_FLAT + (1 - PEBBLE_FLAT) * math.cos(u) ** (2 / PEBBLE_N)
        out.append((rx * k, ry * k, -hb * math.sin(u) ** (2 / PEBBLE_N)))
    return out + [(0.0, 0.0, -hb)]


def stone_dims(size):
    L, W, H = (d * STONE_SCALE[size] for d in STONE_M)
    return L / 2, W / 2, 0.6 * H, 0.4 * H


def stone(size):
    """A solid stone, only for the preview."""
    rx, ry, ht, hb = stone_dims(size)
    m = revolve(dome(rx, ry, ht) + belly(rx, ry, hb)[1:], seg=96)
    m.v = [(x, y, z + hb) for x, y, z in m.v]
    return m


def holds_light(rx, ry, ht, hb, ix, iy):
    """Whether LIGHT, sitting on the bottom half's floor, clears the inside everywhere:
    the bottom's floor and curve, the lip's opening, and the top's dome."""
    n, w = PEBBLE_N, STONE_WALL
    r, h = LIGHT[0] / 2 + LIGHT_GAP, LIGHT[1] + LIGHT_GAP
    floor = -(hb - w)
    for i in range(33):
        z = floor + h * i / 32
        for d in range(0, 360, 5):
            x, y = r * math.cos(math.radians(d)), r * math.sin(math.radians(d))
            if z <= LIP_H:
                q = min(1.0, -z / (hb - w)) if z < 0 else 0.0
                room = PEBBLE_FLAT + (1 - PEBBLE_FLAT) * (1 - q ** n) ** (1 / n)
                reach = math.hypot(x / ix, y / iy)
            else:
                q = z / (ht - w)
                if q >= 1:
                    return False
                room = (1 - q ** n) ** (1 / n)
                reach = math.hypot(x / (rx - w), y / (ry - w))
            if reach > room:
                return False
    return True


def stone_halves(size):
    """A hollow stone split at its widest point, to glue around a light.
    The bottom half has a lip that locates inside the top half's rim."""
    rx, ry, ht, hb = stone_dims(size)
    w = STONE_WALL
    # Top: outer dome down to the rim, then the inside dome back up. It prints rim-down, as modelled.
    top = revolve(dome(rx, ry, ht) + dome(rx - w, ry - w, ht - w)[::-1], seg=96)
    # The top's inside narrows a little as it rises, so the lip is sized where it ends.
    t = math.acos((LIP_H / (ht - w)) ** (PEBBLE_N / 2))
    k = math.sin(t) ** (2 / PEBBLE_N)
    lx, ly = (rx - w) * k - LIP_FIT, (ry - w) * k - LIP_FIT
    ix, iy = lx - LIP_WALL, ly - LIP_WALL
    p = belly(rx, ry, hb) + belly(ix, iy, hb - w)[::-1]
    p += [(ix, iy, LIP_H), (lx, ly, LIP_H), (lx, ly, 0.0)]
    bottom = revolve(p, seg=96)
    bottom.v = [(x, y, z + hb) for x, y, z in bottom.v]
    cavity = (2 * ix, 2 * iy, ht + hb - 2 * w)
    assert holds_light(rx, ry, ht, hb, ix, iy), f"the light doesn't fit inside a {size} stone"
    return top, bottom, cavity


def seat_floor(i):
    return BASE_H + 1.0 + i * SEAT_STEP


def seat():
    """A round pad with stepped floors, lowest in the middle. A jar lands on the
    smallest seat it's too wide to drop into, and that seat's step holds it in place."""
    radii = [d / 2 for d in SEATS_D]
    ro, top = radii[-1] + SEAT_RIM, seat_floor(len(radii))
    p = [(0.0, BASE_H - 0.2), (ro, BASE_H - 0.2), (ro, top - 0.8), (ro - 0.8, top)]
    for i in range(len(radii) - 1, -1, -1):
        p += [(radii[i], top if i == len(radii) - 1 else seat_floor(i + 1)), (radii[i], seat_floor(i))]
    p.append((0.0, seat_floor(0)))
    return revolve(p)


def dish():
    top = BASE_H + DISH_RISE
    p = [(0.0, BASE_H - 0.2), (DISH_R, BASE_H - 0.2), (DISH_R, top - 2)]
    p += arc(DISH_R - 2, top - 2, 2, 0, math.pi / 2)[1:]
    for i in range(1, 17):                 # shallow bowl
        r = (DISH_R - 4) * (1 - i / 16)
        p.append((r, top - DISH_DEPTH * (1 - (r / (DISH_R - 4)) ** 2)))
    return revolve(p)


def base_pieces():
    """One piece per vase, each with its seat at x = 0, then the charging pad. They butt
    together on flat faces. The first piece is rounded at its outer end; the pad tapers
    from the full depth at its joint to a smaller round end."""
    r = SEATS_D[-1] / 2 + SEAT_RIM + BASE_MARGIN    # half the bar's depth, and half a piece's width
    pieces = []
    for k in range(VASES):
        pts = circle(0, 0, r) + [(r, -r), (r, r)]
        if k > 0:
            pts += [(-r, -r), (-r, r)]
        pieces.append(extrude(hull(pts), 0, BASE_H).add(seat()))
    # The pad's joint is at x = -r, so it lines up like the vase pieces do.
    cx = PAD_R - r
    pad = extrude(hull([(-r, -r), (-r, r)] + circle(cx, 0, PAD_R)), 0, BASE_H)
    pieces.append(pad.add(dish(), dx=cx))
    return pieces, 2 * r, cx


def glass_jar(d, h):
    """A stand-in for the bought jar, only for the preview."""
    R, w = d / 2, 3.0
    p = [(0.0, 0.0)] + arc(R - 6, 6, 6, -math.pi / 2, 0) + [(R, h), (R - w, h)]
    p += arc(R - 6, 6 + w, 6 - w, 0, -math.pi / 2) + [(0.0, w)]
    return revolve(p)


# ---------- checks and output ----------

def check(name, parts):
    """Every edge of every shell must be shared by exactly two faces, in opposite directions."""
    for m in parts:
        edges = {}
        for a, b, c in m.f:
            for e in ((a, b), (b, c), (c, a)):
                edges[e] = edges.get(e, 0) + 1
        bad = [e for e, k in edges.items() if k != 1 or edges.get((e[1], e[0])) != 1]
        assert not bad, f"{name}: {len(bad)} open or doubled edges"
        assert m.volume() > 0, f"{name}: inside out"


def write_stl(name, parts):
    check(name, parts)
    tris = [(m.v[a], m.v[b], m.v[c]) for m in parts for a, b, c in m.f]
    path = os.path.join(OUT, name)
    with open(path, "wb") as fh:
        fh.write(b"Shoal kit".ljust(80, b" "))
        fh.write(struct.pack("<I", len(tris)))
        for p, q, r in tris:
            u = [q[i] - p[i] for i in range(3)]
            w = [r[i] - p[i] for i in range(3)]
            nx, ny, nz = u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]
            ln = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
            fh.write(struct.pack("<12fH", nx / ln, ny / ln, nz / ln, *p, *q, *r, 0))
    lo = [min(p[i] for t in tris for p in t) for i in range(3)]
    hi = [max(p[i] for t in tris for p in t) for i in range(3)]
    vol = sum(m.volume() for m in parts) / 1000
    print(f"{name:28s} {hi[0]-lo[0]:6.1f} x {hi[1]-lo[1]:6.1f} x {hi[2]-lo[2]:6.1f} mm   {vol:6.1f} cm3")


def stone_plates():
    """Top and bottom halves for PLATE_STONES, laid out in rows on as many beds as they need,
    so each plate is one file to hand to the shop."""
    parts = []
    for size, n in PLATE_STONES.items():
        top, bottom, _ = stone_halves(size)
        parts += [top, bottom] * n
    plates, gap = [], 6.0
    plate, x, y, row = Mesh(), 0.0, 0.0, 0.0
    for m in parts:
        (x0, y0, _), (x1, y1, _) = m.bounds()
        if x + (x1 - x0) > PLATE_BED:
            x, y, row = 0.0, y + row + gap, 0.0
        if y + (y1 - y0) > PLATE_BED:
            plates.append(plate)
            plate, x, y, row = Mesh(), 0.0, 0.0, 0.0
        plate.add(m, dx=x - x0, dy=y - y0)
        x += x1 - x0 + gap
        row = max(row, y1 - y0)
    return plates + [plate]


def main():
    os.makedirs(OUT, exist_ok=True)
    stones = {s: stone(s) for s in STONE_SCALE}
    for s, m in stones.items():
        top, bottom, cavity = stone_halves(s)
        write_stl(f"stone-{s}-top.stl", [top])
        write_stl(f"stone-{s}-bottom.stl", [bottom])
        print(f"{'':28s} room for a light: {cavity[0]:.0f} x {cavity[1]:.0f} mm through the opening, {cavity[2]:.0f} mm tall inside")
    pieces, pitch, cx = base_pieces()
    for k, m in enumerate(pieces):
        write_stl(f"base-{k + 1}{'-charging-pad' if k == VASES else ''}.stl", [m])
    for k, plate in enumerate(stone_plates()):
        write_stl(f"stones-plate-{k + 1}.stl", [plate])

    # The kit put together with the 8 in. vases, for a look before printing. Not meant to be printed.
    jar_d = 150
    i = next(k for k, d in enumerate(SEATS_D) if d / 2 >= jar_d / 2)
    z = seat_floor(i)
    scene = []
    for k, m in enumerate(pieces[:VASES]):
        x = k * pitch
        scene += [Mesh().add(m, dx=x), Mesh().add(glass_jar(jar_d, 203), dx=x, dz=z)]
        h = z + 2
        for s in ["large", "medium", "small"][k:]:
            scene.append(Mesh().add(stones[s], dz=h, dx=x))
            h += stones[s].bounds()[1][2] - 2
    ex = VASES * pitch
    scene.append(Mesh().add(pieces[-1], dx=ex))
    scene.append(Mesh().add(stones["small"], dx=ex + cx, dz=BASE_H + DISH_RISE - DISH_DEPTH + 1.5))
    write_stl("preview-assembled.stl", scene)


if __name__ == "__main__":
    main()
