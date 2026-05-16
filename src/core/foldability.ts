/**
 * Per-piece foldability classifier: a pure downstream pass over a
 * paginated `RenderablePiece` that maps explainable geometric
 * signals to one of three audit classes — `clean`, `caution`, `warn`
 * — keyed to thresholds the user can reason about (printed mm,
 * degrees). Consumed by `emit-svg.ts` for the tint overlay and by
 * `scripts/baseline-pipeline.ts` for corpus-wide reporting.
 */

import type { RenderEdge, RenderablePiece } from "./tabs.js";

export type FoldabilityClass = "clean" | "caution" | "warn";

const EDGE_CAUTION_MM = 5;
const EDGE_WARN_MM = 2;
const ANGLE_CAUTION_DEG = 30;
const ANGLE_WARN_DEG = 15;
const RAD_TO_DEG = 180 / Math.PI;

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

const cornerAngleDeg = (eIn: RenderEdge, eOut: RenderEdge): number => {
  // At the vertex shared by eIn.to and eOut.from: back-vector along
  // eIn meets forward-vector along eOut.
  const ux = eIn.from[0] - eIn.to[0];
  const uy = eIn.from[1] - eIn.to[1];
  const vx = eOut.to[0] - eOut.from[0];
  const vy = eOut.to[1] - eOut.from[1];
  const mag = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (mag === 0) return 180;
  const cos = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / mag));
  return Math.acos(cos) * RAD_TO_DEG;
};

const faceCornerAngleTrip = (piece: RenderablePiece): Trip => {
  let trip: Trip = "none";
  const n = piece.edges.length;
  for (let f = 0; f + 3 <= n; f += 3) {
    for (let i = 0; i < 3; i++) {
      const eIn = piece.edges[f + i];
      const eOut = piece.edges[f + ((i + 1) % 3)];
      const angle = cornerAngleDeg(eIn, eOut);
      if (angle < ANGLE_WARN_DEG) return "warn";
      if (angle < ANGLE_CAUTION_DEG) trip = worseTrip(trip, "caution");
    }
  }
  return trip;
};

export function classifyFoldability(piece: RenderablePiece): FoldabilityClass {
  const edgeTrip = edgeLengthTrip(piece);
  const angleTrip = faceCornerAngleTrip(piece);
  if (edgeTrip === "none" && angleTrip === "none") return "clean";
  if (edgeTrip !== "none" && angleTrip !== "none") return "warn";
  const sole = edgeTrip === "none" ? angleTrip : edgeTrip;
  return sole === "warn" ? "warn" : "caution";
}
