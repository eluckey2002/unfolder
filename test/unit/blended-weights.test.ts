import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import {
  computeBlendedWeights,
  DEFAULT_BLEND,
} from "../../src/core/blended-weights.js";
import type { Mesh3D } from "../../src/core/mesh.js";

describe("computeBlendedWeights", () => {
  it("exports DEFAULT_BLEND with the spike's coefficient triple", () => {
    expect(DEFAULT_BLEND).toEqual({ convex: 0.5, concave: 1.0, length: -0.1 });
  });

  it("returns one weight per adjacency, parallel-indexed", () => {
    const mesh: Mesh3D = {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, Math.sqrt(3) / 2, 0],
        [0.5, Math.sqrt(3) / 6, Math.sqrt(6) / 3],
      ],
      faces: [
        [0, 1, 2],
        [0, 1, 3],
        [0, 2, 3],
        [1, 2, 3],
      ],
    };
    const dual = buildAdjacency(mesh);
    const weights = computeBlendedWeights(mesh, dual);

    expect(weights.length).toBe(dual.adjacencies.length);
    expect(weights.every((w) => Number.isFinite(w))).toBe(true);
  });

  it("coefficient changes produce different weight surfaces", () => {
    const mesh: Mesh3D = {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0.5],
        [0, 1, 0.5],
        [0.5, 0.5, 1],
      ],
      faces: [
        [0, 1, 2],
        [0, 2, 3],
        [0, 1, 4],
        [1, 2, 4],
        [2, 3, 4],
        [0, 3, 4],
      ],
    };
    const dual = buildAdjacency(mesh);
    const baseline = computeBlendedWeights(mesh, dual);
    const higher = computeBlendedWeights(mesh, dual, {
      convex: 0.5,
      concave: 5.0,
      length: -0.1,
    });
    expect(higher.some((w, i) => Math.abs(w - baseline[i]) > 1e-9)).toBe(true);
  });
});
