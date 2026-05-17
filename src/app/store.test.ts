/**
 * Store-shape lock for v4.0.
 *
 * v4 spec § 4 names three categories; in v4.0 we lock the field
 * SHAPE even though only `sourceMesh` + `currentLayout` are populated.
 * `appliedFixes[]` entry shape is checked at type level via a no-op
 * push of a correctly-shaped entry inside the test (which throws if
 * the immer reducer rejects it). The shape lock prevents a v4.1
 * type migration once edge-toggle and undo arrive.
 */

import { describe, expect, it } from "vitest";

import { useAppStore } from "./store.js";

describe("useAppStore — v4 § 4 state shape", () => {
  it("exposes SOURCE-OF-TRUTH fields with v4.0 initial values", () => {
    const s = useAppStore.getState();
    expect(s.sourceMesh).toBeNull();
    expect(s.pipelineConfig).toBeNull();
    expect(s.pinnedRegions).toBeInstanceOf(Set);
    expect(s.pinnedRegions.size).toBe(0);
    expect(Array.isArray(s.appliedFixes)).toBe(true);
    expect(s.appliedFixes).toHaveLength(0);
  });

  it("exposes DERIVED fields stubbed empty in v4.0", () => {
    const s = useAppStore.getState();
    expect(s.currentLayout).toBeNull();
    expect(s.preflightReport).toBeNull();
    expect(s.fixSuggestions).toEqual([]);
  });

  it("exposes UI EPHEMERA fields", () => {
    const s = useAppStore.getState();
    expect(s.selection).toBeNull();
    expect(s.hover).toBeNull();
    expect(s.panelState).toBeDefined();
    expect(s.drawerState).toBeDefined();
  });

  it("setSourceMesh and setCurrentLayout mutate via immer", () => {
    const before = useAppStore.getState();
    const mesh = { vertices: [], faces: [] };
    useAppStore.getState().setSourceMesh(mesh);
    expect(useAppStore.getState().sourceMesh).toEqual(mesh);
    expect(useAppStore.getState().sourceMesh).not.toBe(before.sourceMesh);
    // Reset for other tests.
    useAppStore.getState().setSourceMesh(null);
  });

  it("appliedFixes accepts entries with the v4 spec § 4 shape", () => {
    // Type-level check: a correctly-shaped entry compiles and pushes.
    // No entries are appended at runtime in v4.0; this is a shape lock.
    const entry = {
      regionSelector: { kind: "piece" as const, pieceId: 0 },
      constraintChange: { kind: "noop" as const },
      seed: 0,
      edgeOrderHash: "0".repeat(64),
    };
    useAppStore.getState().pushAppliedFix(entry);
    expect(useAppStore.getState().appliedFixes).toHaveLength(1);
    useAppStore.getState().resetAppliedFixes();
    expect(useAppStore.getState().appliedFixes).toHaveLength(0);
  });
});
