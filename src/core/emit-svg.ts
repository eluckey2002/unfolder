/**
 * Emit stage: serialize one renderable piece to an SVG document
 * string. Fold edges dashed, cut edges solid, glue tabs as
 * trapezoidal polygons, cut edges labelled with matching numbers
 * across pieces. Pure function.
 */

import type { RenderablePiece } from "./tabs.js";

export function emitSvg(piece: RenderablePiece): string {
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

  const width = maxX - minX;
  const height = maxY - minY;
  const size = Math.max(width, height);
  const margin = Math.max(0.05 * size, 0.1);
  const vbX = minX - margin;
  const vbY = minY - margin;
  const vbW = width + 2 * margin;
  const vbH = height + 2 * margin;

  const strokeWidth = size * 0.005;
  const tabStroke = strokeWidth * 0.75;
  const dash = size * 0.02;
  const gap = size * 0.015;
  const fontSize = size * 0.03;
  const labelOffset = fontSize * 0.6;

  const elems: string[] = [];

  for (const edge of piece.edges) {
    const [ax, ay] = edge.from;
    const [bx, by] = edge.to;
    if (edge.kind === "fold") {
      elems.push(
        `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#000" stroke-width="${strokeWidth}" stroke-dasharray="${dash} ${gap}" />`,
      );
      continue;
    }

    elems.push(
      `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#000" stroke-width="${strokeWidth}" />`,
    );

    if (edge.tab) {
      const pts = edge.tab.map(([x, y]) => `${x},${y}`).join(" ");
      elems.push(
        `<polygon points="${pts}" fill="none" stroke="#666" stroke-width="${tabStroke}" />`,
      );
    }

    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    let labelX = midX;
    let labelY = midY;
    if (edge.tab) {
      const t2 = edge.tab[2];
      const t3 = edge.tab[3];
      const outMidX = (t2[0] + t3[0]) / 2;
      const outMidY = (t2[1] + t3[1]) / 2;
      const outVecX = outMidX - midX;
      const outVecY = outMidY - midY;
      const outLen = Math.sqrt(outVecX * outVecX + outVecY * outVecY);
      if (outLen > 0) {
        labelX = midX - (outVecX / outLen) * labelOffset;
        labelY = midY - (outVecY / outLen) * labelOffset;
      }
    }
    elems.push(
      `<text x="${labelX}" y="${labelY}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" fill="#000">${edge.label}</text>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">\n${elems.join("\n")}\n</svg>`;
}
