/**
 * Spike runner for the 2026-05-15 topological-surgery spike.
 *
 * Runs each of the three variants from `docs/references/takahashi.md`
 * against the 11-model corpus that `scripts/baseline-pipeline.ts`
 * uses, captures the v3 baseline metric set (piece count, cut length
 * in mm with double-count convention, tabs, paper efficiency, page
 * count, wall-clock time), emits SVG output per (variant, model) into
 * `svg/<variant>/<model>/`, and writes `results.md` with three tables
 * + the v2 baseline reference columns from `docs/baseline-v3.md`.
 *
 * Invoked via `pnpm spike`.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { buildLayout } from "../../src/core/flatten.js";
import { emitSvg } from "../../src/core/emit-svg.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { LETTER, paginate } from "../../src/core/paginate.js";
import { recut } from "../../src/core/recut.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import {
  buildRenderablePieces,
  type RenderablePiece,
} from "../../src/core/tabs.js";

import { reportCurvature } from "./variant-a-curvature/curvature.js";
import {
  DEFAULT_BLEND,
  computeBlendedWeights,
} from "./variant-b-blended/blended.js";
import { runCutRemoval } from "./variant-c-cut-removal/cut-removal.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const corpusDir = join(repoRoot, "test", "corpus");
const svgRoot = join(here, "svg");
const resultsPath = join(here, "results.md");

const PRINTABLE_W = LETTER.widthMm - 2 * LETTER.marginMm;
const PRINTABLE_H = LETTER.heightMm - 2 * LETTER.marginMm;

const VARIANT_C_TIME_BUDGET_MS = 30_000;

const corpusFiles = readdirSync(corpusDir, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .filter((n) => {
    const ext = extname(n).toLowerCase();
    return ext === ".stl" || ext === ".obj";
  })
  .sort();

interface BaselineEntry {
  faces: number;
  pieces: number;
  pages: number;
  cutLengthMm: number;
  tabs: number;
  efficiencyPct: number;
}

/**
 * v2 baseline numbers transcribed from docs/baseline-v3.md (the
 * frozen v3 starting point). Used purely for side-by-side display.
 */
const V2_BASELINE: Record<string, BaselineEntry> = {
  "croissant.obj": {
    faces: 162,
    pieces: 15,
    pages: 2,
    cutLengthMm: 2889.0,
    tabs: 96,
    efficiencyPct: 15.3,
  },
  "cube.obj": {
    faces: 12,
    pieces: 1,
    pages: 1,
    cutLengthMm: 623.3,
    tabs: 7,
    efficiencyPct: 23.4,
  },
  "cube.stl": {
    faces: 12,
    pieces: 1,
    pages: 1,
    cutLengthMm: 825.4,
    tabs: 7,
    efficiencyPct: 41.0,
  },
  "cylinder.obj": {
    faces: 28,
    pieces: 1,
    pages: 1,
    cutLengthMm: 641.1,
    tabs: 15,
    efficiencyPct: 22.4,
  },
  "deer.obj": {
    faces: 720,
    pieces: 28,
    pages: 4,
    cutLengthMm: 6038.6,
    tabs: 388,
    efficiencyPct: 9.8,
  },
  "egg.obj": {
    faces: 44,
    pieces: 1,
    pages: 1,
    cutLengthMm: 1153.7,
    tabs: 23,
    efficiencyPct: 35.5,
  },
  "ginger-bread.obj": {
    faces: 80,
    pieces: 5,
    pages: 2,
    cutLengthMm: 2214.9,
    tabs: 45,
    efficiencyPct: 23.0,
  },
  "meat-sausage.obj": {
    faces: 320,
    pieces: 3,
    pages: 3,
    cutLengthMm: 2333.8,
    tabs: 163,
    efficiencyPct: 11.3,
  },
  "octahedron.stl": {
    faces: 8,
    pieces: 1,
    pages: 1,
    cutLengthMm: 569.0,
    tabs: 5,
    efficiencyPct: 22.1,
  },
  "tetrahedron.stl": {
    faces: 4,
    pieces: 1,
    pages: 1,
    cutLengthMm: 529.1,
    tabs: 3,
    efficiencyPct: 26.5,
  },
  "uv-sphere.obj": {
    faces: 48,
    pieces: 1,
    pages: 1,
    cutLengthMm: 1022.0,
    tabs: 25,
    efficiencyPct: 22.1,
  },
};

interface VariantMetrics {
  pieces: number | null;
  pages: number | null;
  cutLengthMm: number | null;
  tabs: number | null;
  efficiencyPct: number | null;
  ms: number;
  note: string;
}

interface ParsedMesh {
  faces: number;
  mesh: ReturnType<typeof parseObj>;
}

const parseMesh = (fname: string): ParsedMesh => {
  const ext = extname(fname).toLowerCase();
  const text = readFileSync(join(corpusDir, fname), "utf8");
  const mesh = ext === ".stl" ? parseStl(text) : parseObj(text);
  return { faces: mesh.faces.length, mesh };
};

/** Compute uniform scale + cut-length + paper efficiency, mirroring baseline-pipeline.ts. */
const pieceBboxFit = (piece: RenderablePiece): number => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const bump = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const edge of piece.edges) {
    bump(edge.from[0], edge.from[1]);
    bump(edge.to[0], edge.to[1]);
    if (edge.kind === "cut" && edge.tab) {
      for (const [tx, ty] of edge.tab) bump(tx, ty);
    }
  }
  const w = maxX - minX;
  const h = maxY - minY;
  return Math.min(PRINTABLE_W / w, PRINTABLE_H / h);
};

interface MeasuredOutput {
  pieces: number;
  pages: number;
  cutLengthMm: number;
  tabs: number;
  efficiencyPct: number;
}

const measureRecut = (
  pieceCount: number,
  cuts: number,
  renderable: RenderablePiece[],
  pieceLayoutAreas: number,
): MeasuredOutput => {
  // Uniform scale matching baseline-pipeline.ts: every piece must
  // fit, so take the smallest per-piece bbox fit as the global scale.
  let scale = Infinity;
  for (const piece of renderable) {
    const fit = pieceBboxFit(piece);
    if (fit < scale) scale = fit;
  }

  let cutLenPre = 0;
  for (const piece of renderable) {
    for (const edge of piece.edges) {
      if (edge.kind !== "cut") continue;
      const dx = edge.to[0] - edge.from[0];
      const dy = edge.to[1] - edge.from[1];
      cutLenPre += Math.sqrt(dx * dx + dy * dy);
    }
  }

  const pages = paginate(renderable, LETTER);
  const totalPrintable = pages.length * PRINTABLE_W * PRINTABLE_H;
  const faceAreaPost = pieceLayoutAreas * scale * scale;
  const efficiencyPct = (faceAreaPost / totalPrintable) * 100;

  return {
    pieces: pieceCount,
    pages: pages.length,
    cutLengthMm: cutLenPre * scale,
    tabs: cuts,
    efficiencyPct,
  };
};

const sumFaceAreas2D = (
  pieces: { layout: { faces: { positions: [number[], number[], number[]] }[] } }[],
): number => {
  // Using `any`-typed coordinates because Piece / FlatFace use
  // tuple types; iterating positions as plain arrays is the
  // simplest shape-erased traversal.
  let total = 0;
  for (const piece of pieces) {
    for (const face of piece.layout.faces) {
      const [p0, p1, p2] = face.positions;
      total +=
        Math.abs(
          (p1[0] - p0[0]) * (p2[1] - p0[1]) -
            (p2[0] - p0[0]) * (p1[1] - p0[1]),
        ) / 2;
    }
  }
  return total;
};

const writeSvgs = (
  variant: string,
  model: string,
  renderable: RenderablePiece[],
): number => {
  const pages = paginate(renderable, LETTER);
  const outDir = join(svgRoot, variant, model);
  mkdirSync(outDir, { recursive: true });
  pages.forEach((page, i) => {
    writeFileSync(join(outDir, `page-${i + 1}.svg`), emitSvg(page));
  });
  return pages.length;
};

/* ---------- Variant runners ---------- */

interface VariantARecord {
  model: string;
  faces: number;
  hyperbolic: number;
  elliptic: number;
  parabolic: number;
  violations: number;
  ms: number;
}

const runVariantA = (fname: string, mesh: ReturnType<typeof parseObj>): VariantARecord => {
  const start = Date.now();
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  const tree = buildSpanningTree(dual, weights);
  const layout = buildLayout(mesh, tree);
  const overlaps = detectOverlaps(layout);
  const r = recut(tree, layout, overlaps);
  const report = reportCurvature(mesh, r.cuts);
  // Side benefit: write the v2-baseline SVGs to svg/v2-baseline/<model>/
  // so the comparison page can display them alongside the variants.
  const renderable = buildRenderablePieces(r);
  writeSvgs("v2-baseline", fname, renderable);
  return {
    model: fname,
    faces: mesh.faces.length,
    hyperbolic: report.counts.hyperbolic,
    elliptic: report.counts.elliptic,
    parabolic: report.counts.parabolic,
    violations: report.violations.length,
    ms: Date.now() - start,
  };
};

const runVariantB = (
  fname: string,
  mesh: ReturnType<typeof parseObj>,
): VariantMetrics => {
  const start = Date.now();
  try {
    const dual = buildAdjacency(mesh);
    const weights = computeBlendedWeights(mesh, dual, DEFAULT_BLEND);
    const tree = buildSpanningTree(dual, weights);
    const layout = buildLayout(mesh, tree);
    const overlaps = detectOverlaps(layout);
    const r = recut(tree, layout, overlaps);
    const renderable = buildRenderablePieces(r);
    const pieceAreas = sumFaceAreas2D(r.pieces);
    const m = measureRecut(r.pieces.length, r.cuts.length, renderable, pieceAreas);
    writeSvgs("variant-b-blended", fname, renderable);
    return {
      pieces: m.pieces,
      pages: m.pages,
      cutLengthMm: m.cutLengthMm,
      tabs: m.tabs,
      efficiencyPct: m.efficiencyPct,
      ms: Date.now() - start,
      note: "",
    };
  } catch (e) {
    return {
      pieces: null,
      pages: null,
      cutLengthMm: null,
      tabs: null,
      efficiencyPct: null,
      ms: Date.now() - start,
      note: `failed: ${(e as Error).message}`,
    };
  }
};

const runVariantC = (
  fname: string,
  mesh: ReturnType<typeof parseObj>,
): VariantMetrics => {
  const start = Date.now();
  try {
    const dual = buildAdjacency(mesh);
    const result = runCutRemoval(mesh, dual, {
      timeBudgetMs: VARIANT_C_TIME_BUDGET_MS,
    });
    // Build renderable and measure downstream where possible. If
    // the downstream chain throws (e.g. shared-edge bookkeeping),
    // we still report piece count and timing as partial output.
    let measured: MeasuredOutput | null = null;
    let downstreamErr: string | null = null;
    try {
      const renderable = buildRenderablePieces(result);
      const pieceAreas = sumFaceAreas2D(result.pieces);
      measured = measureRecut(
        result.pieces.length,
        result.cuts.length,
        renderable,
        pieceAreas,
      );
      writeSvgs("variant-c-cut-removal", fname, renderable);
    } catch (e) {
      downstreamErr = (e as Error).message;
    }
    const baseNote = result.timedOut
      ? `timed-out after ${VARIANT_C_TIME_BUDGET_MS}ms; accepted ${result.accepted}, rejected ${result.rejected}, cycles ${result.cyclesSkipped}`
      : `accepted ${result.accepted}, rejected ${result.rejected}, cycles ${result.cyclesSkipped}`;
    if (measured) {
      return {
        pieces: measured.pieces,
        pages: measured.pages,
        cutLengthMm: measured.cutLengthMm,
        tabs: measured.tabs,
        efficiencyPct: measured.efficiencyPct,
        ms: Date.now() - start,
        note: baseNote,
      };
    }
    return {
      pieces: result.pieces.length,
      pages: null,
      cutLengthMm: null,
      tabs: result.cuts.length,
      efficiencyPct: null,
      ms: Date.now() - start,
      note: `${baseNote}; downstream: ${downstreamErr ?? "skipped"}`,
    };
  } catch (e) {
    return {
      pieces: null,
      pages: null,
      cutLengthMm: null,
      tabs: null,
      efficiencyPct: null,
      ms: Date.now() - start,
      note: `failed: ${(e as Error).message}`,
    };
  }
};

/* ---------- Run + write results.md ---------- */

const fmtCell = (n: number | null, digits = 1): string =>
  n === null ? "—" : Number.isInteger(n) ? String(n) : n.toFixed(digits);

const fmtPct = (n: number | null): string =>
  n === null ? "—" : `${n.toFixed(1)}%`;

const sectionA = (rows: VariantARecord[]): string => {
  const lines: string[] = [];
  lines.push("## Variant A — Vertex-curvature pre-flatten guard\n");
  lines.push(
    "Diagnostic on top of v2's MST + recut output. Per Takahashi 2011: a hyperbolic vertex (corner-angle sum > 2π) needs ≥2 incident cut edges; an elliptic vertex (< 2π) needs ≥1; a parabolic vertex (= 2π) needs 0. `violations` counts vertices where v2's final cut set fails the necessary condition.\n",
  );
  lines.push(
    "| model | faces | hyperbolic | elliptic | parabolic | violations | ms |",
  );
  lines.push(
    "| ----- | ----- | ---------- | -------- | --------- | ---------- | -- |",
  );
  for (const r of rows) {
    lines.push(
      `| ${r.model} | ${r.faces} | ${r.hyperbolic} | ${r.elliptic} | ${r.parabolic} | ${r.violations} | ${r.ms} |`,
    );
  }
  return lines.join("\n");
};

const sectionVariantMetrics = (
  title: string,
  intro: string,
  rows: { model: string; faces: number; m: VariantMetrics }[],
): string => {
  const lines: string[] = [];
  lines.push(`## ${title}\n`);
  lines.push(`${intro}\n`);
  lines.push(
    "| model | faces | pieces (v2 → variant) | pages (v2 → variant) | cut mm (v2 → variant) | tabs (v2 → variant) | efficiency (v2 → variant) | ms | note |",
  );
  lines.push(
    "| ----- | ----- | --------------------- | -------------------- | --------------------- | ------------------- | ------------------------- | -- | ---- |",
  );
  for (const { model, faces, m } of rows) {
    const v2 = V2_BASELINE[model];
    const cell = (
      v2v: number,
      vv: number | null,
      isPct: boolean,
      digits = 1,
    ): string => {
      const lhs = isPct ? `${v2v.toFixed(1)}%` : String(v2v);
      const rhs = isPct ? fmtPct(vv) : fmtCell(vv, digits);
      return `${lhs} → ${rhs}`;
    };
    lines.push(
      `| ${model} | ${faces} | ${cell(v2.pieces, m.pieces, false, 0)} | ${cell(v2.pages, m.pages, false, 0)} | ${cell(v2.cutLengthMm, m.cutLengthMm, false, 1)} | ${cell(v2.tabs, m.tabs, false, 0)} | ${cell(v2.efficiencyPct, m.efficiencyPct, true)} | ${m.ms} | ${m.note} |`,
    );
  }
  return lines.join("\n");
};

const main = (): void => {
  // Fresh SVG output dir.
  try {
    rmSync(svgRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  mkdirSync(svgRoot, { recursive: true });

  const aRows: VariantARecord[] = [];
  const bRows: { model: string; faces: number; m: VariantMetrics }[] = [];
  const cRows: { model: string; faces: number; m: VariantMetrics }[] = [];

  for (const fname of corpusFiles) {
    const parsed = parseMesh(fname);
    console.log(`# ${fname} (${parsed.faces} faces)`);
    const a = runVariantA(fname, parsed.mesh);
    aRows.push(a);
    console.log(
      `  A: hyp=${a.hyperbolic} ell=${a.elliptic} par=${a.parabolic} violations=${a.violations} (${a.ms}ms)`,
    );
    const b = runVariantB(fname, parsed.mesh);
    bRows.push({ model: fname, faces: parsed.faces, m: b });
    console.log(
      `  B: pieces=${b.pieces} cut=${b.cutLengthMm === null ? "—" : b.cutLengthMm.toFixed(0)}mm tabs=${b.tabs} eff=${fmtPct(b.efficiencyPct)} (${b.ms}ms) ${b.note}`,
    );
    const c = runVariantC(fname, parsed.mesh);
    cRows.push({ model: fname, faces: parsed.faces, m: c });
    console.log(
      `  C: pieces=${c.pieces} cut=${c.cutLengthMm === null ? "—" : c.cutLengthMm.toFixed(0)}mm tabs=${c.tabs} eff=${fmtPct(c.efficiencyPct)} (${c.ms}ms) ${c.note}`,
    );
  }

  const doc = [
    "# Topological-surgery spike — results",
    "",
    `Generated by \`spikes/2026-05-15-topological-surgery/run.ts\` on ${new Date().toISOString().slice(0, 10)}. Re-run with \`pnpm spike\`.`,
    "",
    "The v2 baseline numbers in the side-by-side columns are transcribed from `docs/baseline-v3.md` (the frozen v3 starting point); they do not re-run as part of this spike.",
    "",
    sectionA(aRows),
    "",
    sectionVariantMetrics(
      "Variant B — Blended convex/concave/length weights",
      "Replaces v2's pure unsigned-dihedral fold weight with a linear blend of (convex angle term, concave angle term, length term). Coefficients used for this run: convex=0.5, concave=1.0, length=-0.1 (signed dihedral; long edges prefer to fold). The rest of the pipeline — recut, tabs, paginate — is v2 unchanged.",
      bRows,
    ),
    "",
    sectionVariantMetrics(
      "Variant C — Greedy cut-removal recut",
      "Replaces v2's MST + recut with PolyZamboni's inverted control flow: start with every edge cut, iterate edges sorted by 3D length descending, fold each one back if doing so leaves the merged component overlap-free. Each variant run is capped at 30s; rows that timed out finalise with whatever was merged so far.",
      cRows,
    ),
    "",
  ].join("\n");

  writeFileSync(resultsPath, doc);
  console.log(`\nWrote ${resultsPath}`);
};

main();
