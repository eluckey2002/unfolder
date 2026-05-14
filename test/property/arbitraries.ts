/**
 * fast-check arbitraries that compose mesh generators with random
 * scale/translation. All meshes produced here are closed manifolds.
 *
 * Rotation is deliberately omitted: it doesn't exercise anything the
 * pipeline cares about (all geometry is computed relatively), and it
 * would only add floating-point noise.
 */

import fc from "fast-check";

import type { Mesh3D, Vec3 } from "../../src/core/mesh.js";
import {
  cube,
  octahedron,
  tetrahedron,
  triangularPrism,
} from "./meshes.js";

const finiteFloat = (min: number, max: number) =>
  fc.double({ min, max, noNaN: true, noDefaultInfinity: true });

const translationArb = fc
  .tuple(finiteFloat(-10, 10), finiteFloat(-10, 10), finiteFloat(-10, 10))
  .map(([x, y, z]): Vec3 => [x, y, z]);

const scaleArb = finiteFloat(0.5, 5);

export const tetrahedronArb = fc
  .record({ s: scaleArb, t: translationArb })
  .map(({ s, t }): Mesh3D => tetrahedron(s, t));

export const cubeArb = fc
  .record({ s: scaleArb, t: translationArb })
  .map(({ s, t }): Mesh3D => cube(s, t));

export const octahedronArb = fc
  .record({ s: scaleArb, t: translationArb })
  .map(({ s, t }): Mesh3D => octahedron(s, t));

export const triangularPrismArb = fc
  .record({
    edge: finiteFloat(0.5, 5),
    height: finiteFloat(0.5, 5),
    t: translationArb,
  })
  .map(({ edge, height, t }): Mesh3D => triangularPrism(edge, height, t));

/** Any valid closed-manifold mesh. The arbitrary the property tests use. */
export const closedMeshArb = fc.oneof(
  tetrahedronArb,
  cubeArb,
  octahedronArb,
  triangularPrismArb,
);
