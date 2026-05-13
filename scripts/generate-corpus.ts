import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  TetrahedronGeometry,
  type BufferGeometry,
} from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

const exporter = new STLExporter();
const material = new MeshBasicMaterial();

const solids: { name: string; geometry: BufferGeometry }[] = [
  { name: "tetrahedron", geometry: new TetrahedronGeometry(1) },
  { name: "cube", geometry: new BoxGeometry(1, 1, 1) },
  { name: "octahedron", geometry: new OctahedronGeometry(1) },
];

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "test", "corpus");

for (const { name, geometry } of solids) {
  const mesh = new Mesh(geometry, material);
  const ascii = exporter.parse(mesh, { binary: false }) as string;
  const outPath = join(outDir, `${name}.stl`);
  writeFileSync(outPath, ascii);
  console.log(`Wrote ${outPath}`);
}
