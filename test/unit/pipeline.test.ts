import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LETTER } from "../../src/core/paginate.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { runPipeline } from "../../src/core/pipeline.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../../test/corpus");

describe("runPipeline", () => {
  it("returns every intermediate stage", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.dual).toBeDefined();
    expect(result.recut).toBeDefined();
    expect(result.renderable).toBeDefined();
    expect(result.pages).toBeDefined();
    expect(result.curvature).toBeDefined();
  });

  it("uses cut-removal (Variant C) as the default unfolder", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(typeof (result.recut as { rejected?: number }).rejected).toBe(
      "number",
    );
  });

  it("defaults to LETTER page spec", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.pages[0].widthMm).toBe(LETTER.widthMm);
    expect(result.pages[0].heightMm).toBe(LETTER.heightMm);
  });

  it("post-condition: curvature report shows zero violations on tetrahedron", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.curvature.violations).toEqual([]);
  });
});
