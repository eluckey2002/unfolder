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
import { classifyFoldability } from "./foldability.js";
import type { Mesh3D } from "./mesh.js";
import {
  LETTER,
  type Page,
  type PageSpec,
  paginate,
} from "./paginate.js";
import type { RGB } from "./parse-mtl.js";
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
  materials?: Map<string, RGB>,
): PipelineResult {
  const dual = buildAdjacency(mesh);
  const recut = runCutRemoval(mesh, dual);
  const renderable = buildRenderablePieces(recut);
  if (materials !== undefined && mesh.faceMaterials !== undefined) {
    for (let p = 0; p < renderable.length; p++) {
      const piece = renderable[p];
      const meshFaceIndices = recut.pieces[p].faces;
      const colors: (RGB | undefined)[] = meshFaceIndices.map((mfi) => {
        const name = mesh.faceMaterials?.[mfi];
        return name === undefined ? undefined : materials.get(name);
      });
      if (colors.some((c) => c !== undefined)) {
        piece.faceColors = colors;
      }
    }
  }
  const pages = paginate(renderable, page);
  for (const p of pages) {
    for (const placed of p.pieces) {
      placed.piece.foldability = classifyFoldability(placed.piece);
    }
  }
  const curvature = reportCurvature(mesh, recut.cuts);

  if (curvature.violations.length > 0) {
    console.warn(
      `runPipeline: curvature post-condition flagged ${curvature.violations.length} vertex violation(s).`,
    );
  }

  return { dual, recut, renderable, pages, curvature };
}
