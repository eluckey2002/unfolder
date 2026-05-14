import tetrahedronStl from "../../test/corpus/tetrahedron.stl?raw";

import { buildAdjacency } from "../core/adjacency.js";
import { computeDihedralWeights } from "../core/dihedral.js";
import { emitSvg } from "../core/emit-svg.js";
import { buildLayout } from "../core/flatten.js";
import { parseStl } from "../core/parse-stl.js";
import { buildSpanningTree } from "../core/spanning-tree.js";
import { createViewport } from "./render.js";

const viewportContainer = document.getElementById("viewport");
if (!(viewportContainer instanceof HTMLElement)) {
  throw new Error("main.ts: #viewport element not found.");
}
const netContainer = document.getElementById("net");
if (!(netContainer instanceof HTMLElement)) {
  throw new Error("main.ts: #net element not found.");
}

const mesh = parseStl(tetrahedronStl);
console.log(
  `unfolder: parsed mesh with ${mesh.vertices.length} vertices, ${mesh.faces.length} faces.`,
);

createViewport(viewportContainer, mesh);

const dual = buildAdjacency(mesh);
const weights = computeDihedralWeights(mesh, dual);
const tree = buildSpanningTree(dual, weights);
const layout = buildLayout(mesh, tree);
const svg = emitSvg(layout, tree);

netContainer.innerHTML = svg;
console.log(
  `unfolder: laid out ${layout.faces.length} faces (${tree.folds.length} folds, ${tree.cuts.length} cuts).`,
);
