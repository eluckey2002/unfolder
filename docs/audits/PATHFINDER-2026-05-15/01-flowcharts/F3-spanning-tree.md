# F3 — Spanning tree (dihedral-weighted MST)

Per ADR 0004: Kruskal MST over adjacencies sorted by dihedral weight. Output is a v1-shaped `SpanningTree` (folds, cuts, parent, root); only the input signature changed (weights now required).

## buildSpanningTree happy path

```mermaid
flowchart TD
  Start([dual, weights, root=0]) --> Valid{"root in range?<br/>weights.length === adjacencies.length?<br/>spanning-tree.ts:84-95"}
  Valid -->|no, throw| ErrInput([Error])
  Valid -->|yes| Sort["order = [0..A-1] sorted by weights[i] asc<br/>spanning-tree.ts:97-99"]
  Sort --> UF["uf = makeUnionFind(faceCount)<br/>spanning-tree.ts:44-77, 101"]
  UF --> Kruskal{"for idx in order<br/>spanning-tree.ts:103"}
  Kruskal --> Try["uf.union(faceA, faceB)?<br/>spanning-tree.ts:104-107"]
  Try -->|true| MarkFold["isFold[idx] = true"]
  Try -->|false| Kruskal
  MarkFold --> Kruskal
  Kruskal -->|done| Split["partition adjacencies into folds[] / cuts[]<br/>spanning-tree.ts:110-118"]
  Split --> NeighborMap["build foldNeighbors[face] = [face]<br/>spanning-tree.ts:120-130"]
  NeighborMap --> BFS["BFS from root over foldNeighbors;<br/>record parent[]<br/>spanning-tree.ts:132-146"]
  BFS --> Conn{"all faces visited?<br/>spanning-tree.ts:148-156"}
  Conn -->|no, throw| ErrDisconnected([Error: disconnected dual])
  Conn -->|yes| Out([SpanningTree { root, parent, folds, cuts }])
```

## Side effects

None.

## External dependencies

- F2 (consumes `DualGraph` and `weights[]`)
- Output consumed by F4 (flatten + recut both walk `parent[]` and `folds`).

## Notes for duplication phase

- `makeUnionFind` defined at [spanning-tree.ts:44-77](src/core/spanning-tree.ts:44) is structurally near-identical to the inline union-find at [recut.ts:183-208](src/core/recut.ts:183) (`connectedComponents`). Both implement path-compressing find and union-by-rank with a `parent[]` + `rank[]` array.
