/**
 * Paginate stage: bin-pack renderable pieces onto printable pages
 * at a single uniform scale. SVG user units in the emit stage are
 * millimetres so PageSpec dimensions map 1:1 to the output viewBox.
 * Naive shelf packing, axis-aligned only — no rotation, no splitting.
 * Pure function.
 */

import type { Vec2 } from "./flatten.js";
import type { RenderablePiece } from "./tabs.js";

export interface PageSpec {
  widthMm: number;
  heightMm: number;
  marginMm: number;
  gutterMm: number;
}

export const LETTER: PageSpec = {
  widthMm: 215.9,
  heightMm: 279.4,
  marginMm: 10,
  gutterMm: 5,
};

export const A4: PageSpec = {
  widthMm: 210,
  heightMm: 297,
  marginMm: 10,
  gutterMm: 5,
};

export interface PlacedPiece {
  sourceIndex: number;
  piece: RenderablePiece;
}

export interface Page {
  widthMm: number;
  heightMm: number;
  pieces: PlacedPiece[];
}

interface Bbox {
  minX: number;
  minY: number;
  w: number;
  h: number;
}

const computeBbox = (piece: RenderablePiece): Bbox => {
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
  return { minX, minY, w: maxX - minX, h: maxY - minY };
};

const transformPiece = (
  piece: RenderablePiece,
  bbox: Bbox,
  ox: number,
  oy: number,
  s: number,
): RenderablePiece => {
  const map = (p: Vec2): Vec2 => [
    ox + (p[0] - bbox.minX) * s,
    oy + (p[1] - bbox.minY) * s,
  ];
  const edges = piece.edges.map((edge) => {
    if (edge.kind === "fold") {
      return { kind: "fold" as const, from: map(edge.from), to: map(edge.to) };
    }
    return {
      kind: "cut" as const,
      from: map(edge.from),
      to: map(edge.to),
      label: edge.label,
      tab: edge.tab ? edge.tab.map(map) : null,
    };
  });
  // Preserve per-face attributes that don't depend on layout placement.
  // foldability is intentionally NOT preserved here — it's (re-)assigned
  // post-paginate by runPipeline so it always reflects post-placement geometry.
  const out: RenderablePiece = { edges };
  if (piece.faceColors !== undefined) out.faceColors = piece.faceColors;
  return out;
};

export function paginate(
  pieces: RenderablePiece[],
  page: PageSpec,
): Page[] {
  if (pieces.length === 0) return [];

  const printableW = page.widthMm - 2 * page.marginMm;
  const printableH = page.heightMm - 2 * page.marginMm;
  if (printableW <= 0 || printableH <= 0) {
    throw new Error(
      `paginate: PageSpec leaves no printable area (printableW=${printableW}, printableH=${printableH}).`,
    );
  }

  const bboxes = pieces.map((p, i) => {
    const b = computeBbox(p);
    if (b.w <= 0 || b.h <= 0) {
      throw new Error(
        `paginate: piece ${i} has zero-extent bbox (w=${b.w}, h=${b.h}).`,
      );
    }
    return b;
  });

  let s = Infinity;
  for (const b of bboxes) {
    const sx = printableW / b.w;
    const sy = printableH / b.h;
    const fit = Math.min(sx, sy);
    if (fit < s) s = fit;
  }

  const order = pieces.map((_, i) => i);
  order.sort((a, b) => {
    const ha = bboxes[a].h * s;
    const hb = bboxes[b].h * s;
    if (hb !== ha) return hb - ha;
    return a - b;
  });

  const pagesOut: Page[] = [];
  let current: PlacedPiece[] = [];
  let shelfTop = 0;
  let shelfHeight = 0;
  let x = 0;

  const pushPage = (): void => {
    pagesOut.push({
      widthMm: page.widthMm,
      heightMm: page.heightMm,
      pieces: current,
    });
    current = [];
  };

  for (const idx of order) {
    const b = bboxes[idx];
    const wScaled = b.w * s;
    const hScaled = b.h * s;

    if (x + wScaled > printableW) {
      shelfTop += shelfHeight + page.gutterMm;
      x = 0;
      shelfHeight = 0;
    }
    if (shelfTop + hScaled > printableH) {
      if (current.length > 0) pushPage();
      shelfTop = 0;
      x = 0;
      shelfHeight = 0;
    }

    const ox = page.marginMm + x;
    const oy = page.marginMm + shelfTop;
    current.push({
      sourceIndex: idx,
      piece: transformPiece(pieces[idx], b, ox, oy, s),
    });
    x += wScaled + page.gutterMm;
    if (hScaled > shelfHeight) shelfHeight = hScaled;
  }
  if (current.length > 0) pushPage();

  return pagesOut;
}
