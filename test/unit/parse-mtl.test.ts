import { describe, expect, it } from "vitest";

import { parseMtl } from "../../src/core/parse-mtl.js";

describe("parseMtl", () => {
  it("returns empty Map for empty file", () => {
    expect(parseMtl("").size).toBe(0);
  });

  it("returns empty Map for comments + whitespace only", () => {
    expect(parseMtl("# comment\n\n  \n").size).toBe(0);
  });

  it("captures one material with Kd as [0,1] floats", () => {
    const m = parseMtl("newmtl red\nKd 0.5 0.25 0.125\n");
    expect(m.get("red")).toEqual([0.5, 0.25, 0.125]);
  });

  it("captures multiple materials; later definition wins on duplicate", () => {
    const m = parseMtl(
      [
        "newmtl a",
        "Kd 0 0 0",
        "newmtl b",
        "Kd 1 1 1",
        "newmtl a",
        "Kd 0.5 0.5 0.5",
      ].join("\n"),
    );
    expect(m.get("a")).toEqual([0.5, 0.5, 0.5]);
    expect(m.get("b")).toEqual([1, 1, 1]);
  });

  it("silently ignores unsupported directives (map_Kd, Ka, Ks, Ns, illum, d, Tr, Ke)", () => {
    const mtl = [
      "newmtl x",
      "Ka 0.2 0.2 0.2",
      "Ks 0.5 0.5 0.5",
      "Ns 32",
      "illum 2",
      "d 0.9",
      "Tr 0.1",
      "Ke 0 0 0",
      "map_Kd texture.png",
      "Kd 0.7 0.8 0.9",
    ].join("\n");
    expect(() => parseMtl(mtl)).not.toThrow();
    expect(parseMtl(mtl).get("x")).toEqual([0.7, 0.8, 0.9]);
  });

  it("handles trailing comments and leading whitespace", () => {
    const m = parseMtl(
      "  newmtl x  # name x\n  Kd 0.1 0.2 0.3  # diffuse\n",
    );
    expect(m.get("x")).toEqual([0.1, 0.2, 0.3]);
  });

  it("throws on newmtl with no name", () => {
    expect(() => parseMtl("newmtl\n")).toThrow();
    expect(() => parseMtl("newmtl   \n")).toThrow();
  });

  it("throws on Kd with non-finite channel", () => {
    expect(() => parseMtl("newmtl x\nKd NaN 0 0\n")).toThrow();
    expect(() => parseMtl("newmtl x\nKd 0 abc 0\n")).toThrow();
  });

  it("throws on Kd outside [0,1]", () => {
    expect(() => parseMtl("newmtl x\nKd -0.1 0 0\n")).toThrow();
    expect(() => parseMtl("newmtl x\nKd 0 1.5 0\n")).toThrow();
  });
});
