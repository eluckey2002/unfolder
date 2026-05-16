import tetrahedronStl from "../../test/corpus/tetrahedron.stl?raw";

import { emitSvg } from "../core/emit-svg.js";
import { parseStl } from "../core/parse-stl.js";
import { runPipeline } from "../core/pipeline.js";
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

const { recut, pages } = runPipeline(mesh);

netContainer.replaceChildren();
for (let i = 0; i < pages.length; i++) {
  const card = document.createElement("div");
  card.className = "page-card";
  const caption = document.createElement("h3");
  caption.textContent = `Page ${i + 1}`;
  const svgWrap = document.createElement("div");
  svgWrap.className = "page-svg";
  svgWrap.innerHTML = emitSvg(pages[i]);
  card.append(caption, svgWrap);
  netContainer.appendChild(card);
}

console.log(
  `unfolder: ${recut.pieces.length} piece(s) on ${pages.length} page(s); cut-removal accepted ${recut.accepted}, rejected ${recut.rejected}, cycles skipped ${recut.cyclesSkipped}.`,
);
