import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { buildLayout, getThirdPoint } from "../../src/core/flatten.js";
import type { Layout2D, Vec2 } from "../../src/core/flatten.js";
import type { Mesh3D } from "../../src/core/mesh.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import type { SpanningTree } from "../../src/core/spanning-tree.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

interface Pipeline {
  mesh: Mesh3D;
  tree: SpanningTree;
  layout: Layout2D;
}

const layoutFromCorpus = (name: string): Pipeline => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  const mesh = parseStl(stl);
  const tree = buildSpanningTree(buildAdjacency(mesh));
  const layout = buildLayout(mesh, tree);
  return { mesh, tree, layout };
};

const dist2D = (a: Vec2, b: Vec2): number => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
};

const dist3D = (mesh: Mesh3D, ai: number, bi: number): number => {
  const [ax, ay, az] = mesh.vertices[ai];
  const [bx, by, bz] = mesh.vertices[bi];
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const sideOf = (p0: Vec2, p1: Vec2, p: Vec2): number =>
  (p1[0] - p0[0]) * (p[1] - p0[1]) - (p1[1] - p0[1]) * (p[0] - p0[0]);

const EPS = 1e-9;

const assertCongruent = (pipeline: Pipeline): void => {
  const { mesh, layout } = pipeline;
  for (let f = 0; f < mesh.faces.length; f++) {
    const flat = layout.faces[f];
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      const d2 = dist2D(flat.positions[i], flat.positions[j]);
      const d3 = dist3D(mesh, flat.vertices[i], flat.vertices[j]);
      expect(Math.abs(d2 - d3)).toBeLessThan(EPS);
    }
  }
};

describe("flatten", () => {
  it("getThirdPoint: known 3-4-5 triangle", () => {
    const [c1, c2] = getThirdPoint([0, 0], [4, 0], 5, 3);
    const targets: Vec2[] = [
      [4, 3],
      [4, -3],
    ];
    const matches = targets.every((target) =>
      [c1, c2].some(
        (cand) =>
          Math.abs(cand[0] - target[0]) < EPS &&
          Math.abs(cand[1] - target[1]) < EPS,
      ),
    );
    expect(matches).toBe(true);
  });

  it("tetrahedron: every face's 2D triangle is congruent to its 3D triangle", () => {
    assertCongruent(layoutFromCorpus("tetrahedron"));
  });

  it("tetrahedron: child apexes land opposite their parent apexes across the fold edge", () => {
    const { mesh, tree, layout } = layoutFromCorpus("tetrahedron");
    for (const fold of tree.folds) {
      const [s0, s1] = fold.edge;
      const parent =
        tree.parent[fold.faceA] === fold.faceB ? fold.faceB : fold.faceA;
      const child = parent === fold.faceA ? fold.faceB : fold.faceA;

      const pFace = layout.faces[parent];
      const cFace = layout.faces[child];

      let P_s0: Vec2 | null = null;
      let P_s1: Vec2 | null = null;
      let P_parentApex: Vec2 | null = null;
      for (let i = 0; i < 3; i++) {
        const v = pFace.vertices[i];
        if (v === s0) P_s0 = pFace.positions[i];
        else if (v === s1) P_s1 = pFace.positions[i];
        else P_parentApex = pFace.positions[i];
      }
      let P_childApex: Vec2 | null = null;
      for (let i = 0; i < 3; i++) {
        const v = cFace.vertices[i];
        if (v !== s0 && v !== s1) P_childApex = cFace.positions[i];
      }
      expect(P_s0 && P_s1 && P_parentApex && P_childApex).toBeTruthy();

      const sideParent = sideOf(P_s0!, P_s1!, P_parentApex!);
      const sideChild = sideOf(P_s0!, P_s1!, P_childApex!);
      expect(Math.sign(sideParent)).not.toBe(0);
      expect(Math.sign(sideChild)).not.toBe(0);
      expect(Math.sign(sideParent)).not.toBe(Math.sign(sideChild));

      void mesh;
    }
  });

  it("cube and octahedron: congruence holds", () => {
    assertCongruent(layoutFromCorpus("cube"));
    assertCongruent(layoutFromCorpus("octahedron"));
  });
});
