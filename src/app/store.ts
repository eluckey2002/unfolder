/**
 * v4 app store — shape per v4 design spec § 4.
 *
 * Three categories:
 *   SOURCE OF TRUTH  — persisted from v4.1, in-memory only in v4.0
 *   DERIVED          — recomputed lazily from source of truth
 *   UI EPHEMERA      — not undoable, not persisted
 *
 * v4.0 populates only `sourceMesh` and `currentLayout`. Every other
 * field is shape-locked so v4.1 (file-loader, undo, region re-unfold)
 * doesn't need a type migration.
 *
 * Library choice: zustand 5 + immer 5-compatible middleware. Spec
 * § 4 called this a low-confidence call; strategist confirmed in the
 * 0030 prompt. Library probe in this session surfaced no obstacle:
 * react 19 + zustand 5 + immer 11 peer-deps all satisfied.
 */

import { produce } from "immer";
import { create } from "zustand";

import type { Mesh3D } from "../core/mesh.js";
import type { Page } from "../core/paginate.js";
import type { PageSpec } from "../core/paginate.js";
import type { CutRemovalResult } from "../core/cut-removal.js";
import type { RenderablePiece } from "../core/tabs.js";

// ---------------------------------------------------------------------------
// Type-level shape lock — these are NOT consumed in v4.0 but must compile.
// ---------------------------------------------------------------------------

/**
 * Selects the region of the layout a fix applies to. v4.1+ may grow
 * additional variants (face-set, edge-set, etc.); the discriminated
 * union pattern is locked here.
 */
export type RegionSelector =
  | { kind: "piece"; pieceId: number }
  | { kind: "faces"; faceIds: number[] };

/**
 * The discrete change a fix applies to the pipeline's input
 * constraints. v4.0 carries `noop` only — every other variant lands
 * in v4.3 with the fix-suggestion engine. The discriminant exists
 * now so the union grows additively.
 */
export type ConstraintChange =
  | { kind: "noop" }
  | { kind: "pinRegion"; region: RegionSelector }
  | { kind: "forceEdgeCut"; edgeId: number }
  | { kind: "forceEdgeFold"; edgeId: number };

/**
 * One entry in `appliedFixes`. The determinism contract — seed +
 * edgeOrderHash — is encoded in the type even though v4.0 never
 * appends an entry. This is the shape lock the v4.0 spec calls out.
 */
export interface AppliedFix {
  regionSelector: RegionSelector;
  constraintChange: ConstraintChange;
  /** u32 PRNG seed for the pipeline run that produced this entry. */
  seed: number;
  /**
   * SHA-256 hex digest of the canonical edge-order used by the
   * pipeline at the point of application. Cross-checked on replay to
   * guarantee deterministic re-derivation.
   */
  edgeOrderHash: string;
}

/**
 * v4.0 pipeline config: a typed wrapper around the v3 page spec.
 * v4.1+ will grow weight fn, recut variant, tab strategy.
 */
export interface PipelineConfigSnapshot {
  pageSpec: PageSpec;
}

/**
 * v4.0 derived layout: the v3 pipeline result captured so the UI can
 * read pages without re-running. v4.3 will widen this to carry badge
 * + suggestion derivations.
 */
export interface CurrentLayout {
  pages: Page[];
  recut: CutRemovalResult;
  renderable: RenderablePiece[];
}

/**
 * v4.0 preflight report: stub. v4.2 populates piece count, scale,
 * mesh hygiene, per-piece risk badges.
 */
export interface PreflightReport {
  pieceCount: number;
}

/**
 * v4.0 fix suggestion: stub. v4.3 populates kind, params,
 * predictedLayout, predictedBadges per spec § 4.
 */
export interface FixSuggestion {
  kind: string;
}

export type Selection = { kind: "piece"; pieceId: number } | { kind: "face"; faceId: number };
export type Hover = Selection;

export interface PanelState {
  preflightOpen: boolean;
}

export interface DrawerState {
  open: boolean;
  activeBadgeId: string | null;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface AppState {
  // SOURCE OF TRUTH (persisted from v4.1; v4.0 in-memory only)
  sourceMesh: Mesh3D | null;
  pipelineConfig: PipelineConfigSnapshot | null;
  pinnedRegions: Set<RegionSelector>;
  appliedFixes: AppliedFix[];

  // DERIVED (cached, recomputed lazily)
  currentLayout: CurrentLayout | null;
  preflightReport: PreflightReport | null;
  fixSuggestions: FixSuggestion[];

  // UI EPHEMERA (not undoable, not persisted)
  selection: Selection | null;
  hover: Hover | null;
  panelState: PanelState;
  drawerState: DrawerState;

  // ---- Actions (v4.0 minimal set; widens in v4.1+) ----
  setSourceMesh: (mesh: Mesh3D | null) => void;
  setCurrentLayout: (layout: CurrentLayout | null) => void;
  pushAppliedFix: (entry: AppliedFix) => void;
  resetAppliedFixes: () => void;
}

const initialState: Omit<
  AppState,
  "setSourceMesh" | "setCurrentLayout" | "pushAppliedFix" | "resetAppliedFixes"
> = {
  sourceMesh: null,
  pipelineConfig: null,
  pinnedRegions: new Set<RegionSelector>(),
  appliedFixes: [],
  currentLayout: null,
  preflightReport: null,
  fixSuggestions: [],
  selection: null,
  hover: null,
  panelState: { preflightOpen: false },
  drawerState: { open: false, activeBadgeId: null },
};

/**
 * Local immer helper. We use immer's `produce` directly rather than
 * the zustand/middleware/immer wrapper to keep zustand-v5 + immer-v11
 * type plumbing minimal — the wrapper requires a generic
 * StateCreator<T, [["zustand/immer", never]], [], T> annotation that
 * isn't worth the indirection for v4.0's four actions.
 */
export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setSourceMesh: (mesh) =>
    set(
      produce<AppState>((draft) => {
        // Immer's draft type drops the Mesh3D nominal-ish brand; the
        // assignment is structurally safe.
        draft.sourceMesh = mesh as AppState["sourceMesh"];
      }),
    ),

  setCurrentLayout: (layout) =>
    set(
      produce<AppState>((draft) => {
        draft.currentLayout = layout as AppState["currentLayout"];
      }),
    ),

  pushAppliedFix: (entry) =>
    set(
      produce<AppState>((draft) => {
        draft.appliedFixes.push(entry);
      }),
    ),

  resetAppliedFixes: () =>
    set(
      produce<AppState>((draft) => {
        draft.appliedFixes = [];
      }),
    ),
}));
