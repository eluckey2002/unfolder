import type { Vec3 } from "./mesh.js";

export interface VertexInterner {
  intern: (x: number, y: number, z: number) => number;
  readonly vertices: Vec3[];
}

export function makeVertexInterner(): VertexInterner {
  const vertices: Vec3[] = [];
  const index = new Map<string, number>();
  const intern = (x: number, y: number, z: number): number => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      throw new Error(
        `intern-vertex: non-finite coordinate (${x}, ${y}, ${z}).`,
      );
    }
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
    const existing = index.get(key);
    if (existing !== undefined) return existing;
    const idx = vertices.length;
    index.set(key, idx);
    vertices.push([x, y, z]);
    return idx;
  };
  return { intern, vertices };
}
