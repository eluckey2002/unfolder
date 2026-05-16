/**
 * Emit stage: serialize one printable page to an SVG document
 * string. Coordinates arrive from `paginate` already in page-space
 * millimetres, so the SVG's viewBox and width/height map 1:1 to the
 * page's physical size. Fold edges dashed, cut edges solid, glue
 * tabs as trapezoidal polygons, cut edges labelled with matching
 * numbers across pieces. Pure function.
 */

import type { Vec2 } from "./flatten.js";
import type { Page } from "./paginate.js";
import type { RenderEdge } from "./tabs.js";

const CUT_STROKE_MM = 0.3;
const FOLD_STROKE_MM = 0.3;
const TAB_STROKE_MM = 0.2;
const FOLD_DASH_MM = 2;
const FOLD_GAP_MM = 1.5;
const LABEL_FONT_MM = 3;
const LABEL_OFFSET_MM = LABEL_FONT_MM * 0.6;
const PAGE_BORDER_STROKE_MM = 0.15;
const PAGE_BORDER_COLOR = "#ccc";

/**
 * Walk a piece's cut edges (boundary) into an ordered outline polygon.
 * Folds are ignored — they're interior. Exported for direct unit
 * testing; the only production caller is emitSvg's tint emission.
 */
export function reconstructOutline(edges: RenderEdge[]): Vec2[] {
  const cuts: RenderEdge[] = edges.filter((e) => e.kind === "cut");
  if (cuts.length === 0) return [];

  const key = (v: Vec2): string => `${v[0]},${v[1]}`;
  const adj = new Map<string, Array<{ idx: number; other: Vec2 }>>();
  const push = (k: string, entry: { idx: number; other: Vec2 }): void => {
    const list = adj.get(k);
    if (list) list.push(entry);
    else adj.set(k, [entry]);
  };
  for (let i = 0; i < cuts.length; i++) {
    const e = cuts[i];
    push(key(e.from), { idx: i, other: e.to });
    push(key(e.to), { idx: i, other: e.from });
  }

  const used = new Set<number>();
  const start = cuts[0].from;
  const outline: Vec2[] = [start];
  used.add(0);
  let current = cuts[0].to;
  while (true) {
    if (key(current) === key(start)) break;
    outline.push(current);
    const choices = adj.get(key(current));
    if (!choices) break;
    const next = choices.find((c) => !used.has(c.idx));
    if (!next) break;
    used.add(next.idx);
    current = next.other;
  }
  return outline;
}

export function emitSvg(page: Page): string {
  const elems: string[] = [];

  elems.push(
    `<rect x="0" y="0" width="${page.widthMm}" height="${page.heightMm}" fill="none" stroke="${PAGE_BORDER_COLOR}" stroke-width="${PAGE_BORDER_STROKE_MM}" />`,
  );

  for (const placed of page.pieces) {
    for (const edge of placed.piece.edges) {
      const [ax, ay] = edge.from;
      const [bx, by] = edge.to;
      if (edge.kind === "fold") {
        elems.push(
          `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#000" stroke-width="${FOLD_STROKE_MM}" stroke-dasharray="${FOLD_DASH_MM} ${FOLD_GAP_MM}" />`,
        );
        continue;
      }

      elems.push(
        `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#000" stroke-width="${CUT_STROKE_MM}" />`,
      );

      if (edge.tab) {
        const pts = edge.tab.map(([x, y]) => `${x},${y}`).join(" ");
        elems.push(
          `<polygon points="${pts}" fill="none" stroke="#666" stroke-width="${TAB_STROKE_MM}" />`,
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
          labelX = midX - (outVecX / outLen) * LABEL_OFFSET_MM;
          labelY = midY - (outVecY / outLen) * LABEL_OFFSET_MM;
        }
      }
      elems.push(
        `<text x="${labelX}" y="${labelY}" font-size="${LABEL_FONT_MM}" text-anchor="middle" dominant-baseline="central" fill="#000">${edge.label}</text>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.widthMm}mm" height="${page.heightMm}mm" viewBox="0 0 ${page.widthMm} ${page.heightMm}">\n${elems.join("\n")}\n</svg>`;
}
