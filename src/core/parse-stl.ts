import { makeVertexInterner } from "./intern-vertex.js";
import type { Mesh3D, Triangle } from "./mesh.js";

/**
 * Parse the contents of an ASCII STL file into a Mesh3D.
 *
 * Pure function. Vertices are deduplicated by a 6-decimal string key
 * so the indexed-face-list output recovers canonical topology even
 * though STL spells out three vertices per face with no sharing.
 *
 * Throws if the file does not begin with `solid`, if any coordinate
 * is non-finite, or if the file ends mid-triangle.
 *
 * Binary STL is not supported in v1.
 */
export function parseStl(contents: string): Mesh3D {
  if (!contents.trimStart().startsWith("solid")) {
    throw new Error("parseStl: expected ASCII STL file (must begin with 'solid').");
  }

  const v = makeVertexInterner();
  const faces: Triangle[] = [];

  const pending: number[] = [];

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("vertex")) continue;

    const parts = line.split(/\s+/);
    const x = Number(parts[1]);
    const y = Number(parts[2]);
    const z = Number(parts[3]);

    pending.push(v.intern(x, y, z));
    if (pending.length === 3) {
      faces.push([pending[0], pending[1], pending[2]]);
      pending.length = 0;
    }
  }

  if (pending.length !== 0) {
    throw new Error(
      `parseStl: file ended mid-triangle with ${pending.length} unconsumed vertex line(s).`,
    );
  }

  return { vertices: v.vertices, faces };
}
