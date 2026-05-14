#!/usr/bin/env python3
"""Record of how the v2 test corpus was prepared.

This script produced the seven v2 corpus models in `test/corpus/`:

  sourced (Kenney Food Kit, CC0):  egg.obj, ginger-bread.obj,
                                   croissant.obj, meat-sausage.obj
  sourced (low-poly deer):         deer.obj
  procedurally generated:          cylinder.obj, uv-sphere.obj

It is committed as the reproducible record of method. It expects the
raw downloads to be present and is NOT runnable from a clean checkout:
the raw inputs — the Kenney Food Kit OBJ pack under
`test/corpus/OBJ format/` and the original `test/corpus/Deer.obj` —
are not vendored in the repo.

What it does:
  1. CLEAN — the four Kenney models list every face twice (an export
     quirk); dedup the face lines (by resolved vertex set), preserving
     all other lines verbatim.
  2. SINGLE-COMPONENT — if a cleaned model has >1 connected component,
     keep the largest (the deer arrived as a body + two antler shells).
  3. GENERATE — two procedurally-known-clean convex baselines.
  4. VERIFY — closed manifold, single component, genus 0, consistent
     winding, for all seven.
"""

import math
import os
from collections import defaultdict

CORPUS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "test", "corpus")

SOURCED = [
    (f"{CORPUS}/Deer.obj", "deer.obj"),
    (f"{CORPUS}/OBJ format/egg.obj", "egg.obj"),
    (f"{CORPUS}/OBJ format/ginger-bread.obj", "ginger-bread.obj"),
    (f"{CORPUS}/OBJ format/croissant.obj", "croissant.obj"),
    (f"{CORPUS}/OBJ format/meat-sausage.obj", "meat-sausage.obj"),
]


def _read_obj(path):
    """Return (verts, faces) where faces are lists of 0-based raw ordinals."""
    verts, faces = [], []
    with open(path, "r", errors="replace") as fh:
        for raw in fh:
            s = raw.split("#", 1)[0].strip()
            t = s.split()
            if not t:
                continue
            if t[0] == "v":
                verts.append((float(t[1]), float(t[2]), float(t[3])))
            elif t[0] == "f":
                idx = []
                for ref in t[1:]:
                    n = int(ref.split("/")[0])
                    idx.append(n - 1 if n > 0 else len(verts) + n)
                faces.append(idx)
    return verts, faces


def _dedup_verts(verts):
    k2c, canon, r2c = {}, [], []
    for (x, y, z) in verts:
        key = (round(x, 6), round(y, 6), round(z, 6))
        if key not in k2c:
            k2c[key] = len(canon)
            canon.append((x, y, z))
        r2c.append(k2c[key])
    return canon, r2c


# ---------------------------------------------------------------- clean

def clean_file(src, dst):
    """Copy src->dst, dropping duplicate face lines (by resolved vertex set)."""
    out, vcount, seen, orig, kept = [], 0, set(), 0, 0
    with open(src, "r", errors="replace") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            t = line.split("#", 1)[0].strip().split()
            if t and t[0] == "v":
                vcount += 1
                out.append(line)
            elif t and t[0] == "f":
                orig += 1
                ordinals = []
                for ref in t[1:]:
                    n = int(ref.split("/")[0])
                    ordinals.append(n - 1 if n > 0 else vcount + n)
                key = tuple(sorted(ordinals))
                if key in seen:
                    continue
                seen.add(key)
                kept += 1
                out.append(line)
            else:
                out.append(line)
    with open(dst, "w") as fh:
        fh.write("\n".join(out) + "\n")
    return orig, kept


# -------------------------------------------------------- single component

def make_single_component(path):
    """If the mesh has >1 connected component, rewrite path keeping only the
    largest (geometry-only). Returns the sorted list of component face counts."""
    verts, faces = _read_obj(path)
    canon, r2c = _dedup_verts(verts)
    parent = list(range(len(canon)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    cfaces = []
    for f in faces:
        cf = [r2c[i] for i in f]
        cfaces.append(cf)
        for i in range(1, len(cf)):
            ra, rb = find(cf[0]), find(cf[i])
            if ra != rb:
                parent[ra] = rb

    comp_faces = defaultdict(list)
    for ci, cf in enumerate(cfaces):
        comp_faces[find(cf[0])].append(ci)
    sizes = sorted((len(v) for v in comp_faces.values()), reverse=True)
    if len(comp_faces) <= 1:
        return sizes

    biggest = max(comp_faces.values(), key=len)
    keep = [cfaces[ci] for ci in biggest]
    used = sorted({v for cf in keep for v in cf})
    remap = {old: i for i, old in enumerate(used)}
    with open(path, "w") as fh:
        fh.write("# largest connected component extracted "
                 "(original mesh had multiple disconnected shells)\n")
        for old in used:
            x, y, z = canon[old]
            fh.write(f"v {x:.6f} {y:.6f} {z:.6f}\n")
        for cf in keep:
            fh.write("f " + " ".join(str(remap[v] + 1) for v in cf) + "\n")
    return sizes


# -------------------------------------------------------------- generate

def write_obj(path, header, verts, faces):
    with open(path, "w") as fh:
        fh.write(f"# {header}\n")
        for (x, y, z) in verts:
            fh.write(f"v {x:.6f} {y:.6f} {z:.6f}\n")
        for f in faces:
            fh.write("f " + " ".join(str(i) for i in f) + "\n")


def gen_cylinder(path, n=8, r=0.5, h=1.0):
    verts, top, bot = [], [], []
    for j in range(n):
        a = 2 * math.pi * j / n
        verts.append((r * math.cos(a), r * math.sin(a), h / 2))
        top.append(len(verts))
    for j in range(n):
        a = 2 * math.pi * j / n
        verts.append((r * math.cos(a), r * math.sin(a), -h / 2))
        bot.append(len(verts))
    faces = [list(top), list(reversed(bot))]   # caps: CCW-outward
    for j in range(n):
        k = (j + 1) % n
        # side quad wound to oppose the cap edges it shares
        faces.append([bot[j], bot[k], top[k], top[j]])
    write_obj(path, "Octagonal cylinder - procedurally generated convex baseline.",
              verts, faces)


def gen_uv_sphere(path, n_lon=8, n_lat=4, r=0.5):
    verts = []
    verts.append((0.0, 0.0, r))
    north = len(verts)
    rings = []
    for k in range(1, n_lat):
        phi = math.pi * k / n_lat
        ring = []
        for j in range(n_lon):
            th = 2 * math.pi * j / n_lon
            verts.append((r * math.sin(phi) * math.cos(th),
                          r * math.sin(phi) * math.sin(th),
                          r * math.cos(phi)))
            ring.append(len(verts))
        rings.append(ring)
    verts.append((0.0, 0.0, -r))
    south = len(verts)
    faces = []
    r0 = rings[0]
    for j in range(n_lon):
        k = (j + 1) % n_lon
        faces.append([north, r0[j], r0[k]])
    for b in range(len(rings) - 1):
        ra, rb = rings[b], rings[b + 1]
        for j in range(n_lon):
            k = (j + 1) % n_lon
            faces.append([ra[j], rb[j], rb[k], ra[k]])
    rl = rings[-1]
    for j in range(n_lon):
        k = (j + 1) % n_lon
        faces.append([south, rl[k], rl[j]])
    write_obj(path, "Low-poly UV sphere - procedurally generated convex baseline.",
              verts, faces)


# ---------------------------------------------------------------- verify

def verify(path):
    verts, raw_faces = _read_obj(path)
    canon, r2c = _dedup_verts(verts)
    tri = []
    for f in raw_faces:
        cf = [r2c[i] for i in f]
        for k in range(1, len(cf) - 1):
            a, b, c = cf[0], cf[k], cf[k + 1]
            if a != b and b != c and a != c:
                tri.append((a, b, c))
    V, F = len(canon), len(tri)
    undirected, directed = defaultdict(int), defaultdict(int)
    for (a, b, c) in tri:
        for (u, v) in ((a, b), (b, c), (c, a)):
            directed[(u, v)] += 1
            undirected[(u, v) if u < v else (v, u)] += 1
    E = len(undirected)
    boundary = sum(1 for x in undirected.values() if x == 1)
    nonman = sum(1 for x in undirected.values() if x > 2)
    closed = boundary == 0 and nonman == 0
    bad_wind = sum(1 for x in directed.values() if x > 1)
    parent = list(range(V))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    used = set()
    for (a, b, c) in tri:
        for (u, v) in ((a, b), (b, c)):
            ru, rv = find(u), find(v)
            if ru != rv:
                parent[ru] = rv
        used.update((a, b, c))
    comps = len({find(x) for x in used})
    genus = (2 - (V - E + F)) // 2 if (closed and comps == 1) else None
    return dict(V=V, F=F, closed=closed, boundary=boundary, nonman=nonman,
                comps=comps, genus=genus, bad_wind=bad_wind)


# ------------------------------------------------------------------ main

if __name__ == "__main__":
    print("--- CLEAN (dedup doubled faces) + SINGLE-COMPONENT ---")
    outputs = []
    for src, name in SOURCED:
        if not os.path.exists(src):
            print(f"  MISSING SOURCE: {src}")
            continue
        o, k = clean_file(src, f"{CORPUS}/{name}")
        sizes = make_single_component(f"{CORPUS}/{name}")
        outputs.append(name)
        note = f"faces {o}->{k}"
        if len(sizes) > 1:
            note += f"; components {sizes} -> kept largest ({sizes[0]})"
        print(f"  {name:20s}  {note}")

    print("\n--- GENERATE (procedural baselines) ---")
    gen_cylinder(f"{CORPUS}/cylinder.obj")
    gen_uv_sphere(f"{CORPUS}/uv-sphere.obj")
    outputs += ["cylinder.obj", "uv-sphere.obj"]
    print("  cylinder.obj, uv-sphere.obj written")

    print("\n--- VERIFY (all seven corpus files) ---")
    print(f"  {'file':22s} {'V':>5s} {'F':>5s}  closed  comps  genus  winding")
    all_ok = True
    for name in outputs:
        a = verify(f"{CORPUS}/{name}")
        ok = a["closed"] and a["comps"] == 1 and a["genus"] == 0 and a["bad_wind"] == 0
        all_ok &= ok
        cm = "yes" if a["closed"] else f"NO(b{a['boundary']},n{a['nonman']})"
        wd = "ok" if a["bad_wind"] == 0 else f"BAD({a['bad_wind']})"
        flag = "" if ok else "   <-- ISSUE"
        print(f"  {name:22s} {a['V']:5d} {a['F']:5d}  {cm:7s} {a['comps']:5d}  "
              f"{str(a['genus']):>5s}  {wd}{flag}")
    print(f"\n{'ALL SEVEN CLEAN' if all_ok else 'SOME FILES STILL HAVE ISSUES'}")
