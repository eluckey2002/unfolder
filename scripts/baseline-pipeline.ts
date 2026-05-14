import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseStl } from "../src/core/parse-stl.js";
import { parseObj } from "../src/core/parse-obj.js";
import { buildAdjacency } from "../src/core/adjacency.js";
import { computeDihedralWeights } from "../src/core/dihedral.js";
import { buildSpanningTree } from "../src/core/spanning-tree.js";
import { buildLayout, type Layout2D, type Vec2 } from "../src/core/flatten.js";
import { emitSvg } from "../src/core/emit-svg.js";

/**
 * Run the unfolding pipeline over every mesh in test/corpus/ and
 * record a baseline: pipeline completion plus a naive count of
 * overlapping 2D face pairs.
 *
 * The overlap check below is a one-off measurement tool, NOT the v2
 * overlap-detection stage. Session 0015 builds the real version in
 * src/core/ on top of polygon-clipping; this script's O(n²) SH-clip
 * triangle-pair sweep exists only to produce the failure corpus.
 */

const AREA_EPS = 1e-10;

const signedArea = (poly: Vec2[]): number => {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
};

const ccw = (t: Vec2[]): Vec2[] =>
  signedArea(t) >= 0 ? t : [t[0], t[2], t[1]];

const lineIntersect = (
  p1: Vec2,
  p2: Vec2,
  q1: Vec2,
  q2: Vec2,
): Vec2 => {
  const dx1 = p2[0] - p1[0];
  const dy1 = p2[1] - p1[1];
  const dx2 = q2[0] - q1[0];
  const dy2 = q2[1] - q1[1];
  const denom = dx1 * dy2 - dy1 * dx2;
  if (denom === 0) return p1;
  const t = ((q1[0] - p1[0]) * dy2 - (q1[1] - p1[1]) * dx2) / denom;
  return [p1[0] + t * dx1, p1[1] + t * dy1];
};

/** Sutherland–Hodgman: subject ∩ convex clip (both CCW). */
const clipPolygon = (subject: Vec2[], clip: Vec2[]): Vec2[] => {
  let out: Vec2[] = subject.slice();
  for (let i = 0; i < clip.length; i++) {
    if (out.length === 0) break;
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const inside = (p: Vec2): number =>
      ex * (p[1] - a[1]) - ey * (p[0] - a[0]);
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const sCur = inside(cur);
      const sPrev = inside(prev);
      if (sCur >= 0) {
        if (sPrev < 0) out.push(lineIntersect(prev, cur, a, b));
        out.push(cur);
      } else if (sPrev >= 0) {
        out.push(lineIntersect(prev, cur, a, b));
      }
    }
  }
  return out;
};

const overlappingPairs = (layout: Layout2D): number => {
  const tris = layout.faces.map((f) => ccw(f.positions.slice() as Vec2[]));
  let count = 0;
  for (let i = 0; i < tris.length; i++) {
    for (let j = i + 1; j < tris.length; j++) {
      const inter = clipPolygon(tris[i], tris[j]);
      if (inter.length >= 3 && Math.abs(signedArea(inter)) > AREA_EPS) {
        count++;
      }
    }
  }
  return count;
};

const here = dirname(fileURLToPath(import.meta.url));
const corpusDir = join(here, "..", "test", "corpus");
const outputPath = join(here, "..", "docs", "baseline-pipeline.md");

const entries = readdirSync(corpusDir, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .filter((n) => {
    const ext = extname(n).toLowerCase();
    return ext === ".stl" || ext === ".obj";
  })
  .sort();

type Result = {
  model: string;
  format: string;
  faces: string;
  pipeline: string;
  overlaps: string;
};

const results: Result[] = [];

for (const fname of entries) {
  const ext = extname(fname).toLowerCase();
  const contents = readFileSync(join(corpusDir, fname), "utf8");
  const r: Result = {
    model: fname,
    format: ext.slice(1),
    faces: "—",
    pipeline: "completed",
    overlaps: "—",
  };

  let mesh;
  try {
    mesh = ext === ".stl" ? parseStl(contents) : parseObj(contents);
    r.faces = String(mesh.faces.length);
  } catch {
    r.pipeline = "failed at parse";
    results.push(r);
    continue;
  }

  let dual;
  try {
    dual = buildAdjacency(mesh);
  } catch {
    r.pipeline = "failed at buildAdjacency";
    results.push(r);
    continue;
  }

  let weights;
  try {
    weights = computeDihedralWeights(mesh, dual);
  } catch {
    r.pipeline = "failed at computeDihedralWeights";
    results.push(r);
    continue;
  }

  let tree;
  try {
    tree = buildSpanningTree(dual, weights);
  } catch {
    r.pipeline = "failed at buildSpanningTree";
    results.push(r);
    continue;
  }

  let layout;
  try {
    layout = buildLayout(mesh, tree);
  } catch {
    r.pipeline = "failed at buildLayout";
    results.push(r);
    continue;
  }

  try {
    emitSvg(layout, tree);
  } catch {
    r.pipeline = "failed at emitSvg";
    results.push(r);
    continue;
  }

  r.overlaps = String(overlappingPairs(layout));
  results.push(r);
}

const headers = ["model", "format", "faces", "pipeline", "overlapping face pairs"];
const rows = results.map((r) => [r.model, r.format, r.faces, r.pipeline, r.overlaps]);
const widths = headers.map((h, i) =>
  Math.max(h.length, ...rows.map((row) => row[i].length)),
);
const formatRow = (cells: string[]) =>
  "| " + cells.map((c, i) => c.padEnd(widths[i])).join(" | ") + " |";
const sepRow = "| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |";

const completed = results.filter((r) => r.pipeline === "completed");
const clean = completed.filter((r) => r.overlaps === "0");

const today = new Date().toISOString().slice(0, 10);
const md = [
  "# Pipeline baseline",
  "",
  `Generated by \`scripts/baseline-pipeline.ts\` on ${today}. Re-run with \`pnpm baseline\`.`,
  "",
  formatRow(headers),
  sepRow,
  ...rows.map(formatRow),
  "",
  `**Summary:** ${clean.length} of ${completed.length} models that completed the pipeline produced an overlap-free net.`,
  "",
].join("\n");

writeFileSync(outputPath, md);

console.log(formatRow(headers));
console.log(sepRow);
for (const row of rows) console.log(formatRow(row));
console.log();
console.log(
  `${clean.length} of ${completed.length} models produce overlap-free nets.`,
);
console.log(`\nWrote ${outputPath}`);
