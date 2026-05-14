import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseObj } from "../../src/core/parse-obj.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const loadCorpus = (name: string): string =>
  readFileSync(join(corpusDir, `${name}.obj`), "utf-8");

describe("parseObj", () => {
  it("cube.obj: 8 vertices, 12 faces (quads triangulated)", () => {
    const mesh = parseObj(loadCorpus("cube"));
    expect(mesh.vertices.length).toBe(8);
    expect(mesh.faces.length).toBe(12);
  });

  it("fan-triangulates an n-gon face", () => {
    const obj = [
      "v 0 0 0",
      "v 2 0 0",
      "v 3 1 0",
      "v 1 2 0",
      "v -1 1 0",
      "f 1 2 3 4 5",
    ].join("\n");
    const mesh = parseObj(obj);
    expect(mesh.faces.length).toBe(3);
  });

  it("resolves negative (relative) vertex indices", () => {
    const positive = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "f 1 2 3",
    ].join("\n");
    const negative = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "f -3 -2 -1",
    ].join("\n");
    expect(parseObj(negative).faces).toEqual(parseObj(positive).faces);
  });

  it("parses all four face-reference forms", () => {
    const obj = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "vt 0 0",
      "vt 1 0",
      "vt 0 1",
      "vn 0 0 1",
      "f 1 2 3",
      "f 1/1 2/2 3/3",
      "f 1//1 2//1 3//1",
      "f 1/1/1 2/2/1 3/3/1",
    ].join("\n");
    const mesh = parseObj(obj);
    expect(mesh.faces.length).toBe(4);
    const first = mesh.faces[0];
    for (const face of mesh.faces) {
      expect(face).toEqual(first);
    }
  });

  it("ignores vn, vt, vp, g, o, usemtl, mtllib, s, and comments", () => {
    const withNoise = [
      "# leading whole-line comment",
      "mtllib something.mtl",
      "o thing",
      "g group",
      "v 0 0 0",
      "vn 1 0 0",
      "v 1 0 0  # trailing comment on a v line",
      "vt 0 0",
      "v 0 1 0",
      "vp 0 0",
      "usemtl material",
      "s 1",
      "f 1 2 3",
      "# trailing comment line",
    ].join("\n");
    const without = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "f 1 2 3",
    ].join("\n");
    expect(parseObj(withNoise)).toEqual(parseObj(without));
  });

  it("deduplicates coincident vertices", () => {
    const obj = [
      "v 0 0 0",
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "f 1 3 4",
      "f 2 3 4",
    ].join("\n");
    const mesh = parseObj(obj);
    expect(mesh.vertices.length).toBe(3);
    expect(mesh.faces[0]).toEqual(mesh.faces[1]);
  });

  it("rejects a file with no faces", () => {
    expect(() => parseObj("v 0 0 0")).toThrow();
  });

  it("rejects an out-of-range face index", () => {
    const obj = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "f 1 2 99",
    ].join("\n");
    expect(() => parseObj(obj)).toThrow();
  });
});
