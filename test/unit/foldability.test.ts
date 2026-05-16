import { describe, expect, it } from "vitest";

import type { Vec2 } from "../../src/core/flatten.js";
import { classifyFoldability } from "../../src/core/foldability.js";
import type { RenderEdge, RenderablePiece } from "../../src/core/tabs.js";

/**
 * Build an equilateral-triangle piece (3 cut edges in face-triplet
 * order) at the given side length. All corner angles are 60° so the
 * angle signal (added in Task 2) never trips for these fixtures —
 * lets us isolate the edge-length signal here.
 */
const equilateralPiece = (sideMm: number): RenderablePiece => {
  const h = (sideMm * Math.sqrt(3)) / 2;
  const a: Vec2 = [0, 0];
  const b: Vec2 = [sideMm, 0];
  const c: Vec2 = [sideMm / 2, h];
  const edges: RenderEdge[] = [
    { kind: "cut", from: a, to: b, label: 1, tab: null },
    { kind: "cut", from: b, to: c, label: 2, tab: null },
    { kind: "cut", from: c, to: a, label: 3, tab: null },
  ];
  return { edges };
};

describe("classifyFoldability — edge-length signal", () => {
  it("returns 'clean' when all edges are ≥ 5 mm and corners well above thresholds", () => {
    expect(classifyFoldability(equilateralPiece(10))).toBe("clean");
  });

  it("returns 'caution' when the smallest edge is in [2 mm, 5 mm)", () => {
    expect(classifyFoldability(equilateralPiece(4))).toBe("caution");
  });

  it("returns 'warn' when the smallest edge is < 2 mm", () => {
    expect(classifyFoldability(equilateralPiece(1.5))).toBe("warn");
  });
});
