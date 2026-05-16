import { describe, expect, it } from "vitest";

import type { Adjacency } from "../../src/core/adjacency.js";
import { reportCurvature } from "../../src/core/curvature.js";
import type { Mesh3D } from "../../src/core/mesh.js";

describe("reportCurvature", () => {
  it("classifies tetrahedron vertices as elliptic with zero violations under full-cut set", () => {
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
    const cuts: Adjacency[] = [
      { faceA: 0, faceB: 1, edge: [0, 1] },
      { faceA: 0, faceB: 2, edge: [0, 2] },
      { faceA: 0, faceB: 3, edge: [1, 2] },
      { faceA: 1, faceB: 2, edge: [0, 3] },
      { faceA: 1, faceB: 3, edge: [1, 3] },
      { faceA: 2, faceB: 3, edge: [2, 3] },
    ];

    const report = reportCurvature(mesh, cuts);

    expect(report.counts.elliptic).toBe(4);
    expect(report.counts.hyperbolic).toBe(0);
    expect(report.violations).toEqual([]);
  });

  it("flags an elliptic vertex with no incident cuts as a violation", () => {
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

    const report = reportCurvature(mesh, []);

    expect(report.violations.length).toBe(4);
    expect(report.violations.every((v) => v.class === "elliptic")).toBe(true);
    expect(report.violations.every((v) => v.incidentCuts === 0)).toBe(true);
  });
});
