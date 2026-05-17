/**
 * PatternPane shape test — one <svg> per pages[] entry.
 *
 * v4.0 component contract is intentionally thin: emit one card per
 * page, dump the v3 emitSvg() string into each card. Per-piece React
 * structure (drag, badge, highlight) lands in v4.1+.
 */

import { render } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe, expect, it } from "vitest";

import type { Page } from "../core/paginate.js";

import { PatternPane } from "./PatternPane.js";

const blankPage: Page = { widthMm: 215.9, heightMm: 279.4, pieces: [] };

afterEach(() => {
  document.body.innerHTML = "";
});

describe("PatternPane", () => {
  it("renders one <svg> per pages[] entry", () => {
    const { container } = render(<PatternPane pages={[blankPage, blankPage, blankPage]} />);
    expect(container.querySelectorAll("svg")).toHaveLength(3);
  });

  it("renders zero <svg> for empty pages[]", () => {
    const { container } = render(<PatternPane pages={[]} />);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });
});
