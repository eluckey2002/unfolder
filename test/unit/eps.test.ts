import { describe, expect, it } from "vitest";

import {
  COINCIDENT_EPS,
  PARSE_DECIMALS,
  SIDE_EPS,
} from "../../src/core/eps.js";

describe("eps", () => {
  it("PARSE_DECIMALS is 6 — vertex dedup quantization matches parsers", () => {
    expect(PARSE_DECIMALS).toBe(6);
  });

  it("SIDE_EPS is consistent with the parser quantization grain", () => {
    expect(SIDE_EPS).toBeGreaterThanOrEqual(Math.pow(10, -PARSE_DECIMALS));
  });

  it("COINCIDENT_EPS is at or below SIDE_EPS", () => {
    expect(COINCIDENT_EPS).toBeLessThanOrEqual(SIDE_EPS);
  });
});
