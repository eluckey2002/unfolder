# F1 — Input parsing

Two format-specific parsers feeding a common `Mesh3D` contract.

## parseStl happy path

```mermaid
flowchart TD
  Start([contents: string]) --> Header["startsWith 'solid' check<br/>parse-stl.ts:16-18"]
  Header -->|throw| ErrSolid([Error: not ASCII STL])
  Header --> Init["init vertices[], faces[], pending[], vertexIndex Map<br/>parse-stl.ts:20-34"]
  Init --> Loop{"for each line<br/>parse-stl.ts:36"}
  Loop -->|not 'vertex'| Loop
  Loop -->|'vertex'| Parse["Number(parts[1..3])<br/>parse-stl.ts:40-43"]
  Parse --> Finite{Finite?}
  Finite -->|no, throw| ErrCoord([Error: non-finite])
  Finite -->|yes| Intern["internVertex(x,y,z) 6-decimal key<br/>parse-stl.ts:24-32"]
  Intern --> Push["pending.push(idx)<br/>parse-stl.ts:48"]
  Push --> Three{"pending.length === 3?"}
  Three -->|no| Loop
  Three -->|yes| Face["faces.push triangle<br/>parse-stl.ts:50-51"]
  Face --> Loop
  Loop -->|done| Final{"pending empty?"}
  Final -->|no, throw| ErrTrunc([Error: mid-triangle])
  Final -->|yes| Out([Mesh3D { vertices, faces }])
```

## parseObj happy path

```mermaid
flowchart TD
  Start([contents: string]) --> Init["init vertices[], faces[], vertexIndex Map,<br/>ordinalToCanonical[]<br/>parse-obj.ts:18-21"]
  Init --> Loop{"for each line<br/>parse-obj.ts:51"}
  Loop -->|strip '#' and whitespace| Head["parts[0]<br/>parse-obj.ts:52-58"]
  Head -->|empty| Loop
  Head -->|'v'| ParseV["Number(parts[1..3])<br/>parse-obj.ts:61-67"]
  ParseV --> InternV["internVertex 6-decimal key<br/>parse-obj.ts:23-31"]
  InternV --> RecordOrdinal["ordinalToCanonical.push(idx)<br/>parse-obj.ts:69"]
  RecordOrdinal --> Loop
  Head -->|'f'| Refs["parts.slice(1) ≥3<br/>parse-obj.ts:74-79"]
  Refs --> Resolve["resolveFaceRef(ref):<br/>strip /tex/norm, abs or relative idx<br/>parse-obj.ts:33-49"]
  Resolve --> FanT["fan triangulate verts[0],i,i+1<br/>parse-obj.ts:81-83"]
  FanT --> Loop
  Head -->|other| Loop
  Loop -->|done| Empty{"faces empty?"}
  Empty -->|yes, throw| ErrNo([Error: no faces])
  Empty -->|no| Out([Mesh3D { vertices, faces }])
```

## Side effects

None. Both parsers are pure — input is a string, output is the `Mesh3D` value.

## External dependencies (calls into other features)

None. F1 has no inbound calls; it is invoked by F6's orchestrator only.

## Notes for duplication phase

- Both files define the same `internVertex(x, y, z)` closure with identical 6-decimal `toFixed(6)` key construction ([parse-stl.ts:24-32](src/core/parse-stl.ts:24), [parse-obj.ts:23-31](src/core/parse-obj.ts:23)). The OBJ parser even calls this out in its docstring: "the same way `parseStl` does it".
- Both files validate finiteness of each coordinate with identical error semantics ([parse-stl.ts:44-46](src/core/parse-stl.ts:44), [parse-obj.ts:64-68](src/core/parse-obj.ts:64)).
