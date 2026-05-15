# F2 — Topology + edge weighting

Builds the dual graph (one node per face, one edge per shared 3D edge) and computes a per-adjacency dihedral fold-weight. Both run as a pair; downstream stages use the parallel `adjacencies` / `weights` arrays.

## buildAdjacency happy path

```mermaid
flowchart TD
  Start([mesh: Mesh3D]) --> Init["edgeToFaces Map<string, number[]><br/>adjacency.ts:43"]
  Init --> LoopFace{"for each faceIndex 0..F-1<br/>adjacency.ts:45"}
  LoopFace --> Edges["edges = [(v0,v1),(v1,v2),(v2,v0)]<br/>adjacency.ts:46-51"]
  Edges --> KeyLoop{"for each (a,b)<br/>adjacency.ts:52"}
  KeyLoop --> Key["canonicalEdgeKey(a,b): sort then 'a,b'<br/>adjacency.ts:39-40, 53"]
  Key --> MapAppend["edgeToFaces.get/set push faceIndex<br/>adjacency.ts:54-59"]
  MapAppend --> KeyLoop
  KeyLoop -->|done| LoopFace
  LoopFace -->|done| Walk{"for each (key, faces) in edgeToFaces<br/>adjacency.ts:69"}
  Walk --> Check{"faces.length === 2?"}
  Check -->|no, throw| ErrManifold([Error: closed manifold violation])
  Check -->|yes| BuildAdj["push Adjacency { faceA, faceB, edge }<br/>byFace[faceA].push, byFace[faceB].push<br/>adjacency.ts:79-86"]
  BuildAdj --> Walk
  Walk -->|done| Out([DualGraph { adjacencies, byFace }])
```

## computeDihedralWeights happy path

```mermaid
flowchart TD
  Start([mesh, dual]) --> Normals{"for each face i<br/>dihedral.ts:73-75"}
  Normals --> FaceN["faceNormal(mesh, i):<br/>cross(e1,e2)/|cross|<br/>dihedral.ts:44-59"]
  FaceN --> Degen{"|cross| < 1e-12?"}
  Degen -->|yes, throw| ErrDegen([Error: degenerate face])
  Degen -->|no| Normals
  Normals -->|done| Adj{"for each adjacency i<br/>dihedral.ts:78"}
  Adj --> Dot["d = clamp(dot(nA, nB), -1, 1)<br/>dihedral.ts:80"]
  Dot --> Acos["weights[i] = acos(d)<br/>in [0, π]<br/>dihedral.ts:81"]
  Acos --> Adj
  Adj -->|done| Out([weights: number[] parallel-indexed to dual.adjacencies])
```

## Side effects

None. Both stages pure.

## External dependencies

- F1 (consumes `Mesh3D`)
- `DualGraph` and `weights` consumed downstream by F3.

## Notes for duplication phase

- `canonicalEdgeKey` defined locally at [adjacency.ts:39-40](src/core/adjacency.ts:39); the same lexical pattern (`a < b ? \`${a},${b}\` : \`${b},${a}\``) reappears in F4 ([flatten.ts:37-38](src/core/flatten.ts:37)) and F5 ([tabs.ts:30-31](src/core/tabs.ts:30)).
- `buildAdjacency` rejects edges with !==2 faces, encoding the v1/v2 closed-manifold guarantee directly into topology construction ([adjacency.ts:74-78](src/core/adjacency.ts:74)).
