import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LETTER } from "../../src/core/paginate.js";
import { parseObj } from "../../src/core/parse-obj.js";
import type { RGB } from "../../src/core/parse-mtl.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { runPipeline } from "../../src/core/pipeline.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../../test/corpus");

describe("runPipeline", () => {
  it("returns every intermediate stage", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.dual).toBeDefined();
    expect(result.recut).toBeDefined();
    expect(result.renderable).toBeDefined();
    expect(result.pages).toBeDefined();
    expect(result.curvature).toBeDefined();
  });

  it("uses cut-removal (Variant C) as the default unfolder", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(typeof (result.recut as { rejected?: number }).rejected).toBe(
      "number",
    );
  });

  it("defaults to LETTER page spec", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.pages[0].widthMm).toBe(LETTER.widthMm);
    expect(result.pages[0].heightMm).toBe(LETTER.heightMm);
  });

  it("post-condition: curvature report shows zero violations on tetrahedron", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.curvature.violations).toEqual([]);
  });

  it("classifies foldability on every paginated piece post-paginate", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    const labels = new Set(["clean", "caution", "warn"]);
    let pieceCount = 0;
    for (const page of result.pages) {
      for (const placed of page.pieces) {
        expect(placed.piece.foldability).toBeDefined();
        expect(labels.has(placed.piece.foldability as string)).toBe(true);
        pieceCount++;
      }
    }
    expect(pieceCount).toBeGreaterThan(0);
  });
});

describe("runPipeline materials resolution", () => {
  // Closed tetrahedron: 4 vertices, 4 faces, every edge shared by 2 faces.
  const tetraObj = (lines: string[]): string =>
    ["v 0 0 0", "v 1 0 0", "v 0 1 0", "v 0 0 1", ...lines].join("\n");

  it("populates faceColors when materials given", () => {
    const obj = tetraObj([
      "usemtl red",
      "f 1 2 3",
      "f 1 2 4",
      "usemtl blue",
      "f 1 3 4",
      "f 2 3 4",
    ]);
    const mesh = parseObj(obj);
    const materials = new Map<string, RGB>([
      ["red", [1, 0, 0]],
      ["blue", [0, 0, 1]],
    ]);
    const { renderable } = runPipeline(mesh, undefined, materials);
    const colors = renderable.flatMap((p) => p.faceColors ?? []);
    expect(colors).toContainEqual([1, 0, 0]);
    expect(colors).toContainEqual([0, 0, 1]);
  });

  it("leaves faceColors absent when no materials passed (no-color invariant)", () => {
    const obj = tetraObj([
      "usemtl red",
      "f 1 2 3",
      "f 1 2 4",
      "f 1 3 4",
      "f 2 3 4",
    ]);
    const { renderable } = runPipeline(parseObj(obj));
    for (const piece of renderable) {
      expect(piece.faceColors).toBeUndefined();
    }
  });

  it("unresolved material names produce an absent faceColors field when all faces unresolved", () => {
    const obj = tetraObj([
      "usemtl unknown",
      "f 1 2 3",
      "f 1 2 4",
      "f 1 3 4",
      "f 2 3 4",
    ]);
    const { renderable } = runPipeline(
      parseObj(obj),
      undefined,
      new Map<string, RGB>(),
    );
    for (const piece of renderable) {
      expect(piece.faceColors).toBeUndefined();
    }
  });
});
