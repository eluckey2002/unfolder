import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

export function createViewport(container: HTMLElement, mesh: Mesh3D): () => void {
  const scene = new Scene();

  const camera = new PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(3, 2, 3);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  scene.add(new AmbientLight(0xffffff, 0.4));
  const directional = new DirectionalLight(0xffffff, 0.9);
  directional.position.set(5, 5, 5);
  scene.add(directional);

  const geometry = buildGeometry(mesh);
  const material = new MeshStandardMaterial({ color: 0x6b88a8, flatShading: true });
  scene.add(new Mesh(geometry, material));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const handleResize = (): void => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  handleResize();
  window.addEventListener("resize", handleResize);

  let frameHandle = requestAnimationFrame(function tick() {
    controls.update();
    renderer.render(scene, camera);
    frameHandle = requestAnimationFrame(tick);
  });

  return () => {
    cancelAnimationFrame(frameHandle);
    window.removeEventListener("resize", handleResize);
    controls.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };
}
