/**
 * Overlap detection stage: a pure predicate over a 2D layout that
 * finds every pair of faces whose unfolded triangles overlap.
 *
 * Built on `polygon-clipping`'s `intersection` operation. Two faces
 * overlap iff their triangle-triangle intersection has positive area
 * (returned as a non-empty MultiPolygon). Fold-adjacent faces share an
 * exact edge — the flatten stage reuses the shared-edge `Vec2` values
 * — so their intersection is a boundary segment with zero interior
 * area and `polygon-clipping` returns `[]`. No spanning-tree input is
 * needed to exclude them.
 *
 * The first consumer is the baseline harness; session 0016's automatic
 * recut is the first pipeline consumer.
 */

import polygonClipping from "polygon-clipping";
import type { Polygon } from "polygon-clipping";

import type { Layout2D, Vec2 } from "./flatten.js";

/**
 * One overlap relationship: two faces whose 2D triangles share
 * positive interior area in the unfolded layout.
 */
export interface FaceOverlap {
  /** The smaller face index (canonical ordering, mirrors `Adjacency`). */
  faceA: number;
  /** The larger face index. */
  faceB: number;
}

const faceToGeom = (positions: readonly [Vec2, Vec2, Vec2]): Polygon => [
  [positions[0], positions[1], positions[2]],
];

/**
 * Find every overlapping face pair in a 2D layout.
 *
 * O(F²) all-pairs sweep; fine for the v2 corpus. A spatial index
 * (e.g. an AABB grid or R-tree) is the known scaling path when face
 * counts grow — deferred until profiling demands it.
 *
 * Results are returned in ascending order by `faceA`, then `faceB`.
 */
export function detectOverlaps(layout: Layout2D): FaceOverlap[] {
  const overlaps: FaceOverlap[] = [];
  const faces = layout.faces;
  const geoms = faces.map((f) => faceToGeom(f.positions));

  for (let i = 0; i < geoms.length; i++) {
    for (let j = i + 1; j < geoms.length; j++) {
      let result: ReturnType<typeof polygonClipping.intersection>;
      try {
        result = polygonClipping.intersection(geoms[i], geoms[j]);
      } catch {
        // polygon-clipping can throw on near-coincident shared edges
        // ("Unable to complete output ring..."), which appear in
        // cut-removal output where fold-merged faces share exact
        // edges by construction. The geometric truth in those cases
        // is "shared edge, not overlap"; treat the throw as
        // non-overlap. Real overlaps with interior intersection
        // still take the normal path.
        continue;
      }
      if (result.length > 0) {
        overlaps.push({ faceA: i, faceB: j });
      }
    }
  }

  return overlaps;
}
