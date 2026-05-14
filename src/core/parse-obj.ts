import type { Mesh3D, Triangle, Vec3 } from "./mesh.js";

/**
 * Parse the contents of a Wavefront OBJ file into a Mesh3D.
 *
 * Pure function. Geometry-only: vertex (`v`) and face (`f`) lines
 * are read; normals, texture coordinates, groups, objects,
 * materials, and smoothing are parsed-and-ignored. Vertices are
 * deduplicated by a 6-decimal string key, the same way `parseStl`
 * does it, keeping the `Mesh3D` contract uniform across both
 * parsers. Polygonal faces (quads and n-gons) are fan-triangulated.
 *
 * Throws on non-finite vertex coordinates, unparseable / zero /
 * out-of-range face vertex references, faces with fewer than three
 * vertices, and files that yield no faces.
 */
export function parseObj(contents: string): Mesh3D {
  const vertices: Vec3[] = [];
  const faces: Triangle[] = [];
  const vertexIndex = new Map<string, number>();
  const ordinalToCanonical: number[] = [];

  const internVertex = (x: number, y: number, z: number): number => {
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
    const existing = vertexIndex.get(key);
    if (existing !== undefined) return existing;
    const idx = vertices.length;
    vertexIndex.set(key, idx);
    vertices.push([x, y, z]);
    return idx;
  };

  const resolveFaceRef = (ref: string, line: string): number => {
    const slash = ref.indexOf("/");
    const vertexToken = slash >= 0 ? ref.slice(0, slash) : ref;
    const i = Number(vertexToken);
    if (!Number.isInteger(i) || i === 0) {
      throw new Error(
        `parseObj: unparseable or zero face vertex index in line: ${line}`,
      );
    }
    const ordinal = i > 0 ? i - 1 : ordinalToCanonical.length + i;
    if (ordinal < 0 || ordinal >= ordinalToCanonical.length) {
      throw new Error(
        `parseObj: face vertex index out of range in line: ${line}`,
      );
    }
    return ordinalToCanonical[ordinal];
  };

  for (const rawLine of contents.split("\n")) {
    const hashAt = rawLine.indexOf("#");
    const stripped = hashAt >= 0 ? rawLine.slice(0, hashAt) : rawLine;
    const line = stripped.trim();
    if (line.length === 0) continue;

    const parts = line.split(/\s+/);
    const head = parts[0];

    if (head === "v") {
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new Error(
          `parseObj: non-finite vertex coordinate in line: ${line}`,
        );
      }
      ordinalToCanonical.push(internVertex(x, y, z));
      continue;
    }

    if (head === "f") {
      const refs = parts.slice(1);
      if (refs.length < 3) {
        throw new Error(
          `parseObj: face with fewer than three vertices in line: ${line}`,
        );
      }
      const resolved = refs.map((ref) => resolveFaceRef(ref, line));
      for (let i = 1; i < resolved.length - 1; i++) {
        faces.push([resolved[0], resolved[i], resolved[i + 1]]);
      }
    }
    // Everything else (vn, vt, vp, g, o, usemtl, mtllib, s, ...) ignored.
  }

  if (faces.length === 0) {
    throw new Error("parseObj: no faces (no 'f' lines) found in file.");
  }

  return { vertices, faces };
}
