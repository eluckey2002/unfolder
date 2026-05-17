import gingerBreadObj from "../../test/corpus/ginger-bread.obj?raw";

import { emitSvg } from "../core/emit-svg.js";
import { parseObj } from "../core/parse-obj.js";
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

const mesh = parseObj(gingerBreadObj);
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
