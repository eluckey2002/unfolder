/**
 * Shared precision constants for the pipeline.
 *
 * Parsers quantize vertex coordinates to 6 decimals when
 * deduplicating; geometric predicates downstream must use epsilons
 * looser than the parser grain so they do not reject vertex
 * positions the parser already collapsed. Audit finding C1 (May
 * 2026, P1) — see `docs/audits/core-review-2026-05-16.md`.
 */

export const PARSE_DECIMALS = 6;
export const COINCIDENT_EPS = 1e-6;
export const SIDE_EPS = 1e-5;
