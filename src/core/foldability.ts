/**
 * Per-piece foldability classifier: a pure downstream pass over a
 * paginated `RenderablePiece` that maps explainable geometric
 * signals to one of three audit classes — `clean`, `caution`, `warn`
 * — keyed to thresholds the user can reason about (printed mm,
 * degrees). Consumed by `emit-svg.ts` for the tint overlay and by
 * `scripts/baseline-pipeline.ts` for corpus-wide reporting.
 */

import type { RenderablePiece } from "./tabs.js";

export type FoldabilityClass = "clean" | "caution" | "warn";

const EDGE_CAUTION_MM = 5;
const EDGE_WARN_MM = 2;

type Trip = "none" | "caution" | "warn";

const worseTrip = (a: Trip, b: Trip): Trip => {
  if (a === "warn" || b === "warn") return "warn";
  if (a === "caution" || b === "caution") return "caution";
  return "none";
};

const edgeLengthTrip = (piece: RenderablePiece): Trip => {
  let trip: Trip = "none";
  for (const e of piece.edges) {
    const dx = e.to[0] - e.from[0];
    const dy = e.to[1] - e.from[1];
    const len = Math.hypot(dx, dy);
    if (len < EDGE_WARN_MM) return "warn";
    if (len < EDGE_CAUTION_MM) trip = worseTrip(trip, "caution");
  }
  return trip;
};

export function classifyFoldability(piece: RenderablePiece): FoldabilityClass {
  const edgeTrip = edgeLengthTrip(piece);
  if (edgeTrip === "warn") return "warn";
  if (edgeTrip === "caution") return "caution";
  return "clean";
}
