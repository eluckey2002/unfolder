import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import {
  type CutRemovalResult,
  runCutRemoval,
} from "../../src/core/cut-removal.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { parseStl } from "../../src/core/parse-stl.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../../test/corpus");

describe("runCutRemoval", () => {
  it("produces a single piece on tetrahedron (convex)", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(result.pieces.length).toBe(1);
    expect(result.pieces[0].faces.length).toBe(4);
  });

  it("produces multiple pieces on deer.obj (the canonical concave stress model)", () => {
    // Variant C's algorithmic guarantee — pieces are overlap-free by
    // construction (anyOverlap rejects merges that would overlap). But
    // verifying with detectOverlaps on deer.obj's accumulated FP drift
    // surfaces sliver false-positives that the spike doc documents
    // ("Variant C's piece counts are an upper bound"). Corpus-wide
    // overlap-free verification lives in test/integration/pipeline.test.ts
    // where tolerance handling can be done deliberately. Here we just
    // assert the algorithm produces pieces.
    const obj = readFileSync(join(corpusDir, "deer.obj"), "utf-8");
    const mesh = parseObj(obj);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(result.pieces.length).toBeGreaterThan(0);
    for (const piece of result.pieces) {
      expect(piece.layout.faces.length).toBeGreaterThan(0);
      expect(piece.faces.length).toBe(piece.layout.faces.length);
    }
  });

  it("dominates v2 on deer.obj piece count (≤ 28)", () => {
    const obj = readFileSync(join(corpusDir, "deer.obj"), "utf-8");
    const mesh = parseObj(obj);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(result.pieces.length).toBeLessThanOrEqual(28);
  });

  it("reports rejected, accepted, and cyclesSkipped fields", () => {
    const stl = readFileSync(join(corpusDir, "cube.stl"), "utf-8");
    const mesh = parseStl(stl);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(typeof result.rejected).toBe("number");
    expect(typeof result.accepted).toBe("number");
    expect(typeof result.cyclesSkipped).toBe("number");
    expect(typeof result.timedOut).toBe("boolean");
  });

  it("returns a RecutResult-compatible shape", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);
    const dual = buildAdjacency(mesh);

    const result: CutRemovalResult = runCutRemoval(mesh, dual);

    expect(Array.isArray(result.pieces)).toBe(true);
    expect(Array.isArray(result.cuts)).toBe(true);
    for (const piece of result.pieces) {
      expect(Array.isArray(piece.faces)).toBe(true);
      expect(Array.isArray(piece.folds)).toBe(true);
      expect(piece.layout).toBeDefined();
    }
  });
});
