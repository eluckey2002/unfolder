import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
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
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  const tree = buildSpanningTree(dual, weights);
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

const assertApexesOpposite = (pipeline: Pipeline): void => {
  const { tree, layout } = pipeline;
  const apexOf = (
    faceIdx: number,
    s0: number,
    s1: number,
  ): { s0Pos: Vec2; s1Pos: Vec2; apex: Vec2 } => {
    const face = layout.faces[faceIdx];
    let s0Pos: Vec2 | null = null;
    let s1Pos: Vec2 | null = null;
    let apex: Vec2 | null = null;
    for (let i = 0; i < 3; i++) {
      const v = face.vertices[i];
      if (v === s0) s0Pos = face.positions[i];
      else if (v === s1) s1Pos = face.positions[i];
      else apex = face.positions[i];
    }
    if (!s0Pos || !s1Pos || !apex) {
      throw new Error(`apex extraction failed for face ${faceIdx}`);
    }
    return { s0Pos, s1Pos, apex };
  };

  for (const fold of tree.folds) {
    const [s0, s1] = fold.edge;
    const parent =
      tree.parent[fold.faceA] === fold.faceB ? fold.faceB : fold.faceA;
    const child = parent === fold.faceA ? fold.faceB : fold.faceA;
    const p = apexOf(parent, s0, s1);
    const c = apexOf(child, s0, s1);
    const sideParent = sideOf(p.s0Pos, p.s1Pos, p.apex);
    const sideChild = sideOf(p.s0Pos, p.s1Pos, c.apex);
    expect(Math.sign(sideParent)).not.toBe(0);
    expect(Math.sign(sideChild)).not.toBe(0);
    expect(Math.sign(sideParent)).not.toBe(Math.sign(sideChild));
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

  it("child apexes land opposite their parent apexes across each fold edge (tetra, cube, octa)", () => {
    assertApexesOpposite(layoutFromCorpus("tetrahedron"));
    assertApexesOpposite(layoutFromCorpus("cube"));
    assertApexesOpposite(layoutFromCorpus("octahedron"));
  });

  it("cube and octahedron: congruence holds", () => {
    assertCongruent(layoutFromCorpus("cube"));
    assertCongruent(layoutFromCorpus("octahedron"));
  });
});
