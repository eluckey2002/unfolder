# F4 — 2D layout, overlap detection, recut

Three pure stages forming the geometric core: walk the spanning tree to lay every face in the plane, find triangle-triangle overlaps, and split into connected overlap-free pieces by greedy set-cover.

## buildLayout happy path

```mermaid
flowchart TD
  Start([mesh, tree]) --> Index["foldByPair = Map<key, Adjacency>;<br/>children[parent] = [child,...]<br/>flatten.ts:91-100"]
  Index --> Root["place root face:<br/>Pa=(0,0), Pb=(|ab|,0), Pc=upper third-point<br/>flatten.ts:104-117"]
  Root --> Queue([queue = [root]])
  Queue --> Pop{queue non-empty?}
  Pop -->|yes| P["p = queue.shift()<br/>flatten.ts:121"]
  P --> Children{"for f in children[p]<br/>flatten.ts:122"}
  Children --> Lookup["find fold edge by canonicalPairKey(f,p)<br/>flatten.ts:123-127"]
  Lookup --> Locate["find P_s0, P_s1, P_parentApex in parentFace<br/>flatten.ts:131-145"]
  Locate --> Apex["apexV = childVerts != s0, s1<br/>flatten.ts:147-153"]
  Apex --> Circ["getThirdPoint(P_s0, P_s1, |apex-s0|, |apex-s1|)<br/>circle-circle intersection<br/>flatten.ts:54-86, 155-160"]
  Circ --> Side["choose candidate opposite side from parentApex<br/>(sign of signed-area test)<br/>flatten.ts:41-47, 162-173"]
  Side --> Place["faces[f] = positions oriented per childVerts<br/>flatten.ts:175-187"]
  Place --> Enq["queue.push(f)"]
  Enq --> Children
  Children -->|done| Pop
  Pop -->|empty| Out([Layout2D { faces } face-index aligned])
```

## detectOverlaps happy path

```mermaid
flowchart TD
  Start([layout]) --> Geoms["geoms = faces.map(positions → Polygon)<br/>overlap.ts:33-35, 49"]
  Geoms --> Pair{"for i<j O(F²) sweep<br/>overlap.ts:51-52"}
  Pair --> Inter["polygonClipping.intersection(geoms[i], geoms[j])<br/>overlap.ts:53"]
  Inter -->|non-empty| Push["overlaps.push({faceA:i, faceB:j})<br/>overlap.ts:54-56"]
  Inter -->|empty| Pair
  Push --> Pair
  Pair -->|done| Out([FaceOverlap[] ordered by faceA, faceB])
```

Note: fold-adjacent faces share exact `Vec2` values from flatten and `polygon-clipping` returns `[]` for boundary-only contact — no extra exclusion needed ([overlap.ts:7-12](src/core/overlap.ts:7)).

## recut happy path

```mermaid
flowchart TD
  Start([tree, layout, overlaps]) --> PMap["buildParentFoldMap: child-face → parent Adjacency<br/>recut.ts:55-68, 245"]
  PMap --> Depth["computeDepths via parent[]<br/>recut.ts:70-91, 246"]
  Depth --> Paths["for each overlap, treePathChildren(a,b):<br/>walk up to LCA collecting child-face ids<br/>recut.ts:98-122, 248-250"]
  Paths --> Cover["greedySetCover(paths):<br/>repeatedly pick child-face covering most paths<br/>recut.ts:129-176, 251"]
  Cover --> Components["connectedComponents using inline union-find<br/>over (parentFold edges minus cuts)<br/>recut.ts:178-230, 252"]
  Components --> Assemble["for each component build Piece<br/>{ layout subset, faces, folds }<br/>recut.ts:254-278"]
  Assemble --> Promote["promote each cut fold to RecutResult.cuts<br/>recut.ts:268-272, 282"]
  Promote --> Out([RecutResult { pieces, cuts }])
```

## Side effects

None. F4 stages are pure. `polygon-clipping` library is the only external dependency.

## External dependencies

- F1 (`Mesh3D` for `buildLayout`)
- F3 (`SpanningTree` for `buildLayout` and `recut`)
- External lib: [polygon-clipping](https://www.npmjs.com/package/polygon-clipping) — `intersection` in `detectOverlaps`.
- Output consumed by F5.

## Notes for duplication phase

- `canonicalPairKey` at [flatten.ts:37-38](src/core/flatten.ts:37) is the same lexical pattern as F2's `canonicalEdgeKey`.
- The inline union-find inside `connectedComponents` at [recut.ts:183-208](src/core/recut.ts:183) duplicates the helper at [spanning-tree.ts:44-77](src/core/spanning-tree.ts:44). Both: `parent[]` + `rank[]`, path-compressing find, union-by-rank.
- `recut.cuts` is the union of original tree cuts plus promoted fold edges ([recut.ts:281-283](src/core/recut.ts:281)); downstream stages (F5) must not assume these arrive in any particular order.
