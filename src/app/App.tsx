/**
 * v4.0 root app shell.
 *
 * Composition: Viewport3D (left) | PatternPane (right).
 *
 * Pipeline lifecycle: runs once on mount on the hardcoded
 * ginger-bread.obj + .mtl fixture (?raw Vite imports — same as the
 * pre-v4 main.ts), populates the store with sourceMesh +
 * currentLayout, then renders.
 *
 * No file-loader UI in v4.0 — that lands in v4.1 per design spec § 3.
 */

import { useEffect } from "react";

import gingerBreadMtl from "../../test/corpus/ginger-bread.mtl?raw";
import gingerBreadObj from "../../test/corpus/ginger-bread.obj?raw";
import { parseMtl } from "../core/parse-mtl.js";
import { parseObj } from "../core/parse-obj.js";
import { runPipeline } from "../core/pipeline.js";

import { PatternPane } from "./PatternPane.js";
import { useAppStore } from "./store.js";
import { Viewport3D } from "./Viewport3D.js";

export function App() {
  const sourceMesh = useAppStore((s) => s.sourceMesh);
  const currentLayout = useAppStore((s) => s.currentLayout);

  useEffect(() => {
    // Single-shot pipeline run on mount. v4.1+ will re-run when the
    // user loads a different file, applies a fix, etc.
    const mesh = parseObj(gingerBreadObj);
    const materials = parseMtl(gingerBreadMtl);
    const { recut, renderable, pages } = runPipeline(mesh, undefined, materials);

    console.log(
      `unfolder: parsed mesh with ${mesh.vertices.length} vertices, ${mesh.faces.length} faces.`,
    );
    console.log(
      `unfolder: ${recut.pieces.length} piece(s) on ${pages.length} page(s); cut-removal accepted ${recut.accepted}, rejected ${recut.rejected}, cycles skipped ${recut.cyclesSkipped}.`,
    );

    const { setSourceMesh, setCurrentLayout } = useAppStore.getState();
    setSourceMesh(mesh);
    setCurrentLayout({ pages, recut, renderable });
  }, []);

  return (
    <div id="app">
      <div id="viewport">{sourceMesh && <Viewport3D mesh={sourceMesh} />}</div>
      <div id="net">{currentLayout && <PatternPane pages={currentLayout.pages} />}</div>
    </div>
  );
}
