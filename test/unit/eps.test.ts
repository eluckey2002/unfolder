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

describe("eps consumers", () => {
  it("flatten.ts imports COINCIDENT_EPS and SIDE_EPS from eps.ts", async () => {
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync("src/core/flatten.ts", "utf-8"),
    );
    expect(src).toMatch(/from\s+["']\.\/eps\.js["']/);
    expect(src).not.toMatch(/const\s+COINCIDENT_EPS\s*=/);
    expect(src).not.toMatch(/const\s+SIDE_EPS\s*=/);
  });

  it("intern-vertex.ts imports PARSE_DECIMALS from eps.ts", async () => {
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync("src/core/intern-vertex.ts", "utf-8"),
    );
    expect(src).toMatch(/PARSE_DECIMALS/);
    expect(src).toMatch(/from\s+["']\.\/eps\.js["']/);
  });
});
