/**
 * 2D pattern pane — one card per paginated page.
 *
 * v4.0 contract: pass through the v3 emitSvg() string output via
 * dangerouslySetInnerHTML. No per-piece React structure yet — that
 * lands in v4.1 when piece-drag arrives, and again in v4.2 when
 * per-piece risk badges land.
 *
 * The `<svg>` returned by emitSvg() carries its own viewBox + width
 * + height attributes (page-size in mm); the wrapping div delegates
 * fit-to-card to the SVG element's intrinsic sizing.
 */

import { emitSvg } from "../core/emit-svg.js";
import type { Page } from "../core/paginate.js";

export interface PatternPaneProps {
  pages: Page[];
}

export function PatternPane({ pages }: PatternPaneProps) {
  return (
    <div className="pattern-pane">
      {pages.map((page, i) => (
        <div key={i} className="page-card">
          <h3>{`Page ${i + 1}`}</h3>
          <div
            className="page-svg"
            // emitSvg returns a fully-formed <svg> string — no React
            // structure inside. v4.1+ may replace this with a real
            // SVG element tree for interaction.
            dangerouslySetInnerHTML={{ __html: emitSvg(page) }}
          />
        </div>
      ))}
    </div>
  );
}
