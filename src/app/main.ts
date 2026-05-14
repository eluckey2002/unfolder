import tetrahedronStl from "../../test/corpus/tetrahedron.stl?raw";

import { parseStl } from "../core/parse-stl.js";
import { createViewport } from "./render.js";

const container = document.getElementById("viewport");
if (!(container instanceof HTMLElement)) {
  throw new Error("main.ts: #viewport element not found.");
}

const mesh = parseStl(tetrahedronStl);
console.log(`unfolder: parsed mesh with ${mesh.vertices.length} vertices, ${mesh.faces.length} faces.`);

createViewport(container, mesh);
