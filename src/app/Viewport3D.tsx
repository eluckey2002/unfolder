/**
 * 3D viewport — react-three-fiber port of src/app/render.ts.
 *
 * Behavior parity contract (matched against the pre-migration
 * render.ts at session start):
 *   - PerspectiveCamera fov 45, near 0.01, far 100, position (3, 2, 3)
 *   - AmbientLight intensity 0.4
 *   - DirectionalLight intensity 0.9 at (5, 5, 5)
 *   - MeshStandardMaterial color #6b88a8, flatShading
 *   - OrbitControls with damping enabled
 *
 * r3f handles the render loop, resize listener, and disposal
 * declaratively — the manual requestAnimationFrame loop, manual
 * resize handler, and dispose-callback from render.ts are gone.
 */

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
} from "three";

import type { Mesh3D } from "../core/mesh.js";

function buildGeometry(mesh: Mesh3D): BufferGeometry {
  const positions = new Float32Array(mesh.vertices.length * 3);
  for (let i = 0; i < mesh.vertices.length; i++) {
    const [x, y, z] = mesh.vertices[i];
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  const indices = new Uint32Array(mesh.faces.length * 3);
  for (let i = 0; i < mesh.faces.length; i++) {
    const [a, b, c] = mesh.faces[i];
    indices[i * 3] = a;
    indices[i * 3 + 1] = b;
    indices[i * 3 + 2] = c;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

export interface Viewport3DProps {
  mesh: Mesh3D;
}

export function Viewport3D({ mesh }: Viewport3DProps) {
  // Memoize geometry so it doesn't rebuild every render. The mesh
  // identity is stable for the lifetime of the loaded model in v4.0.
  const geometry = useMemo(() => buildGeometry(mesh), [mesh]);

  return (
    <Canvas camera={{ fov: 45, near: 0.01, far: 100, position: [3, 2, 3] }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} />
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#6b88a8" flatShading />
      </mesh>
      <OrbitControls enableDamping />
    </Canvas>
  );
}
