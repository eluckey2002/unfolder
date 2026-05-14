/**
 * Emit stage: serialize a 2D layout to an SVG document string.
 * Fold edges dashed, cut edges solid. Pure function.
 */

import type { Layout2D, Vec2 } from "./flatten.js";
import type { SpanningTree } from "./spanning-tree.js";

const canonicalEdgeKey = (a: number, b: number): string =>
  a < b ? `${a},${b}` : `${b},${a}`;

export function emitSvg(layout: Layout2D, tree: SpanningTree): string {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const face of layout.faces) {
    for (const [x, y] of face.positions) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const size = Math.max(width, height);
  const margin = Math.max(0.05 * size, 0.1);
  const vbX = minX - margin;
  const vbY = minY - margin;
  const vbW = width + 2 * margin;
  const vbH = height + 2 * margin;

  const strokeWidth = size * 0.005;
  const dash = size * 0.02;
  const gap = size * 0.015;

  const foldSet = new Set<string>();
  for (const fold of tree.folds) {
    foldSet.add(canonicalEdgeKey(fold.edge[0], fold.edge[1]));
  }

  const lines: string[] = [];
  for (const face of layout.faces) {
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      const va = face.vertices[i];
      const vb = face.vertices[j];
      const pa: Vec2 = face.positions[i];
      const pb: Vec2 = face.positions[j];
      const isFold = foldSet.has(canonicalEdgeKey(va, vb));
      const dashAttr = isFold ? ` stroke-dasharray="${dash} ${gap}"` : "";
      lines.push(
        `<line x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" stroke="#000" stroke-width="${strokeWidth}"${dashAttr} />`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">\n${lines.join("\n")}\n</svg>`;
}
