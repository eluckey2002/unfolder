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

/**
 * Build an isoceles triangle piece with given base + tip-angle (deg).
 * Base ≥ 5 mm and tip angle ≥ 30° → clean. Smaller values trip the
 * angle signal at the tip vertex.
 */
const isocelesPiece = (baseMm: number, tipDeg: number): RenderablePiece => {
  const halfBase = baseMm / 2;
  const heightMm = halfBase / Math.tan((tipDeg * Math.PI) / 180 / 2);
  const a: Vec2 = [0, 0];
  const b: Vec2 = [baseMm, 0];
  const c: Vec2 = [halfBase, heightMm];
  const edges: RenderEdge[] = [
    { kind: "cut", from: a, to: b, label: 1, tab: null },
    { kind: "cut", from: b, to: c, label: 2, tab: null },
    { kind: "cut", from: c, to: a, label: 3, tab: null },
  ];
  return { edges };
};

describe("classifyFoldability — face-corner-angle signal", () => {
  it("returns 'caution' when the smallest corner angle is in [15°, 30°) and edges are clean", () => {
    expect(classifyFoldability(isocelesPiece(10, 20))).toBe("caution");
  });

  it("returns 'warn' when the smallest corner angle is < 15° and edges are clean", () => {
    expect(classifyFoldability(isocelesPiece(10, 10))).toBe("warn");
  });
});

describe("classifyFoldability — aggregation", () => {
  it("returns 'warn' when both an edge and an angle trip caution (2 caution → warn)", () => {
    expect(classifyFoldability(isocelesPiece(3, 20))).toBe("warn");
  });
});
