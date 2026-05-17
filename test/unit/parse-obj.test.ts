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

  it("captures mtllib paths in source order, deduped", () => {
    const obj = [
      "mtllib first.mtl",
      "mtllib second.mtl shared.mtl",
      "mtllib first.mtl",
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "f 1 2 3",
    ].join("\n");
    expect(parseObj(obj).mtllibs).toEqual([
      "first.mtl",
      "second.mtl",
      "shared.mtl",
    ]);
  });

  it("records faceMaterials parallel to faces, undefined before first usemtl", () => {
    const obj = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "v 1 1 0",
      "f 1 2 3",
      "usemtl red",
      "f 2 3 4",
    ].join("\n");
    expect(parseObj(obj).faceMaterials).toEqual([undefined, "red"]);
  });

  it("ignores vn, vt, vp, g, o, s, and comments", () => {
    const withNoise = [
      "# leading whole-line comment",
      "o thing",
      "g group",
      "v 0 0 0",
      "vn 1 0 0",
      "v 1 0 0  # trailing comment on a v line",
      "vt 0 0",
      "v 0 1 0",
      "vp 0 0",
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

  it("captures usemtl/mtllib without affecting geometry", () => {
    const withMaterials = [
      "mtllib something.mtl",
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "usemtl material",
      "f 1 2 3",
    ].join("\n");
    const without = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "f 1 2 3",
    ].join("\n");
    const a = parseObj(withMaterials);
    const b = parseObj(without);
    expect(a.vertices).toEqual(b.vertices);
    expect(a.faces).toEqual(b.faces);
  });

  it("propagates current material across fan-triangulation", () => {
    const obj = [
      "v 0 0 0",
      "v 1 0 0",
      "v 2 0 0",
      "v 2 1 0",
      "v 0 1 0",
      "usemtl alpha",
      "f 1 2 3 4 5",
    ].join("\n");
    const mesh = parseObj(obj);
    expect(mesh.faces.length).toBe(3);
    expect(mesh.faceMaterials).toEqual(["alpha", "alpha", "alpha"]);
  });

  it("clears current material on bare 'usemtl' and on 'usemtl off'", () => {
    const obj = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "v 1 1 0",
      "v 2 0 0",
      "v 2 1 0",
      "usemtl red",
      "f 1 2 3",
      "usemtl",
      "f 2 3 4",
      "usemtl green",
      "f 3 4 5",
      "usemtl off",
      "f 4 5 6",
    ].join("\n");
    expect(parseObj(obj).faceMaterials).toEqual([
      "red",
      undefined,
      "green",
      undefined,
    ]);
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
