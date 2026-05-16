/**
 * Pipeline orchestrator: one function that runs every pure stage
 * and surfaces every intermediate value for callers that need a
 * slice.
 *
 * v3 default: cut-removal (Variant C) — replaces the v2
 * buildSpanningTree + recut sequence with a single greedy pass.
 * The MST path remains available for callers that import the
 * pieces individually.
 *
 * Resolves queue item U4 (Pathfinder analysis 2026-05-15).
 */

import { buildAdjacency, type DualGraph } from "./adjacency.js";
import { reportCurvature, type CurvatureReport } from "./curvature.js";
import {
  type CutRemovalResult,
  runCutRemoval,
} from "./cut-removal.js";
import type { Mesh3D } from "./mesh.js";
import {
  LETTER,
  type Page,
  type PageSpec,
  paginate,
} from "./paginate.js";
import {
  buildRenderablePieces,
  type RenderablePiece,
} from "./tabs.js";

export interface PipelineResult {
  dual: DualGraph;
  recut: CutRemovalResult;
  renderable: RenderablePiece[];
  pages: Page[];
  curvature: CurvatureReport;
}

export function runPipeline(
  mesh: Mesh3D,
  page: PageSpec = LETTER,
): PipelineResult {
  const dual = buildAdjacency(mesh);
  const recut = runCutRemoval(mesh, dual);
  const renderable = buildRenderablePieces(recut);
  const pages = paginate(renderable, page);
  const curvature = reportCurvature(mesh, recut.cuts);

  if (curvature.violations.length > 0) {
    console.warn(
      `runPipeline: curvature post-condition flagged ${curvature.violations.length} vertex violation(s).`,
    );
  }

  return { dual, recut, renderable, pages, curvature };
}
