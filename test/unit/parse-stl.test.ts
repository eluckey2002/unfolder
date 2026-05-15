import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseStl } from "../../src/core/parse-stl.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const loadCorpus = (name: string): string =>
  readFileSync(join(corpusDir, `${name}.stl`), "utf-8");

describe("parseStl — platonic solids", () => {
  it("tetrahedron: 4 vertices, 4 faces", () => {
    const mesh = parseStl(loadCorpus("tetrahedron"));
    expect(mesh.vertices.length).toBe(4);
    expect(mesh.faces.length).toBe(4);
  });

  it("cube: 8 vertices, 12 faces (quads triangulated)", () => {
    const mesh = parseStl(loadCorpus("cube"));
    expect(mesh.vertices.length).toBe(8);
    expect(mesh.faces.length).toBe(12);
  });

  it("octahedron: 6 vertices, 8 faces", () => {
    const mesh = parseStl(loadCorpus("octahedron"));
    expect(mesh.vertices.length).toBe(6);
    expect(mesh.faces.length).toBe(8);
  });

  it("rejects non-STL input", () => {
    expect(() => parseStl("this is not an STL file")).toThrow();
  });

  it("rejects a non-finite vertex coordinate", () => {
    const stl = [
      "solid bad",
      "facet normal 0 0 1",
      "  outer loop",
      "    vertex NaN 0 0",
      "    vertex 1 0 0",
      "    vertex 0 1 0",
      "  endloop",
      "endfacet",
      "endsolid bad",
    ].join("\n");
    expect(() => parseStl(stl)).toThrow(/non-finite/);
  });

  it("rejects a file that ends mid-triangle", () => {
    const stl = [
      "solid truncated",
      "facet normal 0 0 1",
      "  outer loop",
      "    vertex 0 0 0",
      "    vertex 1 0 0",
    ].join("\n");
    expect(() => parseStl(stl)).toThrow(/mid-triangle/);
  });
});
