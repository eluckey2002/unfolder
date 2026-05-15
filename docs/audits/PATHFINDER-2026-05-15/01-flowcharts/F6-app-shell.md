# F6 — Application shell

Wires the F1→F5 pipeline at module-load time on a hardcoded tetrahedron input, mounts the 3D preview, and inserts each page's SVG into the DOM.

## main.ts happy path

```mermaid
flowchart TD
  Start([module load]) --> Import["import tetrahedronStl as ?raw<br/>main.ts:1"]
  Import --> Mount["query #viewport, #net (HTMLElements)<br/>main.ts:15-22"]
  Mount -->|missing, throw| ErrDom([Error: element not found])
  Mount --> Parse["mesh = parseStl(tetrahedronStl)<br/>main.ts:24"]
  Parse --> Log1["console.log: vertex/face counts<br/>main.ts:25-27"]
  Log1 --> Render["createViewport(viewportContainer, mesh) (F6→render.ts)<br/>main.ts:29"]
  Render --> Adj["dual = buildAdjacency(mesh) (F2)<br/>main.ts:31"]
  Adj --> Weights["weights = computeDihedralWeights(mesh, dual) (F2)<br/>main.ts:32"]
  Weights --> Tree["tree = buildSpanningTree(dual, weights) (F3)<br/>main.ts:33"]
  Tree --> Layout["layout = buildLayout(mesh, tree) (F4)<br/>main.ts:34"]
  Layout --> Over["overlaps = detectOverlaps(layout) (F4)<br/>main.ts:35"]
  Over --> Recut["result = recut(tree, layout, overlaps) (F4)<br/>main.ts:36"]
  Recut --> Render2["renderable = buildRenderablePieces(result) (F5)<br/>main.ts:37"]
  Render2 --> Pages["pages = paginate(renderable, LETTER) (F5)<br/>main.ts:38"]
  Pages --> Clear["netContainer.replaceChildren()<br/>main.ts:40"]
  Clear --> Loop{"for each page i<br/>main.ts:41"}
  Loop --> Card["build .page-card with h3 + .page-svg<br/>innerHTML = emitSvg(pages[i]) (F5)<br/>main.ts:42-49"]
  Card --> Loop
  Loop -->|done| Log2["console.log summary<br/>main.ts:53-55"]
  Log2 --> Done([DOM mounted])
```

## render.ts happy path

```mermaid
flowchart TD
  Start([container, mesh]) --> Scene["new Scene, Camera (45°), WebGLRenderer<br/>render.ts:41-48"]
  Scene --> Lights["Ambient + Directional light<br/>render.ts:50-53"]
  Lights --> Geom["buildGeometry: positions + indices typed arrays;<br/>computeVertexNormals<br/>render.ts:16-38, 55"]
  Geom --> AddMesh["Mesh(geometry, MeshStandardMaterial flatShading)<br/>render.ts:56-57"]
  AddMesh --> Ctrl["OrbitControls with damping<br/>render.ts:59-60"]
  Ctrl --> Resize["handleResize: setSize, aspect, projection<br/>register resize listener<br/>render.ts:62-70"]
  Resize --> Loop["requestAnimationFrame tick:<br/>controls.update + renderer.render<br/>render.ts:72-76"]
  Loop --> ReturnDispose["return dispose() closure<br/>render.ts:78-88"]
```

## Side effects

- DOM: queries `#viewport` and `#net`, appends WebGL canvas, replaces children of net container with page cards. ([main.ts:15-22, 40-51](src/app/main.ts:15), [render.ts:48](src/app/render.ts:48))
- Window: `resize` listener; `requestAnimationFrame` loop ([render.ts:70-75](src/app/render.ts:70)).
- Console: two `console.log` calls in main.ts ([main.ts:25-27, 53-55](src/app/main.ts:25)).

## External dependencies

- F1, F2, F3, F4, F5 (entire pure pipeline)
- External libs: `three`, `three/examples/jsm/controls/OrbitControls`.
- Vite `?raw` import for embedded `test/corpus/tetrahedron.stl` fixture.

## Notes for duplication phase

- The input is **hardcoded** to `tetrahedron.stl` ([main.ts:1, 24](src/app/main.ts:1)). There is no file picker / drop zone / format dispatcher — `parseObj` exists and is tested but the app cannot reach it. This is "missing capability" rather than duplication, but it surfaces the absence of a parser dispatch.
- The pipeline call sequence (parse → adjacency → weights → tree → layout → overlap → recut → tabs → paginate → emit) is duplicated literally between [main.ts:24-38](src/app/main.ts:24) and [scripts/baseline-pipeline.ts](scripts/baseline-pipeline.ts) — both walk the same eight calls in the same order with different inputs and side-effect sinks. (Baseline script not shown in this flowchart but confirmed via corpus.)
