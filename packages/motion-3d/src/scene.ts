import { center, FaceColors, VoxelModel } from '@constructive-io/brand-geometry';
import { VoxelState } from '@constructive-io/brand-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { BOX_FACE_ORDER, hasWebGL, isoCameraPosition, toScene, vecToScene } from './frame';

export interface SceneStyle extends FaceColors {
  stroke: string;
  background?: string;
}

export interface SceneOptions {
  style: SceneStyle;
  /** 0 = assembled, 1 = fully exploded. */
  explode: number;
  wireframe: boolean;
  autoRotate: boolean;
  /** Orthographic isometric camera vs. free perspective orbit. */
  camera: 'iso' | 'free';
}

export { hasWebGL };

/**
 * A plain three.js scene that renders a VoxelModel as unit cubes in the
 * brand's world frame (Z up, camera on the (1,1,1) diagonal). Framework
 * wrappers only own the canvas element and forward option changes.
 */
export class CubeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private ortho: THREE.OrthographicCamera;
  private persp: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private group = new THREE.Group();
  private cubes: { mesh: THREE.Mesh; edges: THREE.LineSegments; home: THREE.Vector3; dir: THREE.Vector3 }[] = [];
  private opts: SceneOptions;
  private states: VoxelState[] | null = null;
  private frame = 0;
  private disposed = false;
  private ro: ResizeObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    model: VoxelModel,
    opts: SceneOptions,
  ) {
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.persp = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    for (const cam of [this.ortho, this.persp]) {
      cam.up.set(0, 0, 1);
      cam.position.set(10, 10, 10);
      cam.lookAt(0, 0, 0);
    }

    this.controls = new OrbitControls(this.persp, canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 2, 8);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-4, 6, 2);
    this.scene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.9), this.group);

    this.setModel(model);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.loop();
  }

  setModel(model: VoxelModel): void {
    for (const c of this.cubes) {
      this.group.remove(c.mesh, c.edges);
      c.mesh.geometry.dispose();
      c.edges.geometry.dispose();
    }
    this.cubes = [];

    const c = center(model);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const edgeGeo = new THREE.EdgesGeometry(box);
    for (const v of model.voxels) {
      const home = toScene(v.x + 0.5 - c.x, v.y + 0.5 - c.y, v.z + 0.5 - c.z);
      const mesh = new THREE.Mesh(box, this.materials());
      const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: this.opts.style.stroke }));
      mesh.position.copy(home);
      edges.position.copy(home);
      const dir = home.length() > 0 ? home.clone().normalize() : new THREE.Vector3(0, 0, 1);
      this.cubes.push({ mesh, edges, home, dir });
      this.group.add(mesh, edges);
    }
    this.fit(model);
    this.applyOptions();
  }

  private materials(): THREE.Material[] {
    const { top, left, right } = this.opts.style;
    const mat = (hex: string) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.55, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: 1 });
    const byLabel = { top: mat(top), left: mat(left), right: mat(right) };
    return BOX_FACE_ORDER.map((label) => byLabel[label]);
  }

  private fit(model: VoxelModel): void {
    const span = Math.max(...model.voxels.map((v) => Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z)), 3) / 2 + 1.5;
    this.ortho.zoom = 1;
    this.ortho.left = -span;
    this.ortho.right = span;
    this.ortho.top = span;
    this.ortho.bottom = -span;
    this.ortho.updateProjectionMatrix();
    this.persp.position.setLength(span * 2.6);
    this.controls.update();
  }

  update(opts: Partial<SceneOptions>): void {
    const styleChanged = opts.style && JSON.stringify(opts.style) !== JSON.stringify(this.opts.style);
    this.opts = { ...this.opts, ...opts };
    if (styleChanged) {
      for (const c of this.cubes) {
        (c.mesh.material as THREE.Material[]).forEach((m) => m.dispose());
        c.mesh.material = this.materials();
        (c.edges.material as THREE.LineBasicMaterial).color.set(this.opts.style.stroke);
      }
    }
    this.applyOptions();
  }

  /** Drive cubes from a brand-motion choreography frame; null returns to the explode slider. */
  setStates(states: VoxelState[] | null): void {
    this.states = states;
    this.applyOptions();
  }

  private applyOptions(): void {
    this.cubes.forEach((c, i) => {
      c.mesh.visible = !this.opts.wireframe;
      const st = this.states?.[i];
      const p = st
        ? c.home.clone().add(vecToScene(st.offset))
        : c.home.clone().addScaledVector(c.dir, this.opts.explode * 1.5);
      c.mesh.position.copy(p);
      c.edges.position.copy(p);
      const k = st?.scale ?? 1;
      c.mesh.scale.setScalar(k);
      c.edges.scale.setScalar(k);
      c.mesh.rotation.z = -(st?.spin ?? 0);
      c.edges.rotation.z = -(st?.spin ?? 0);
      const op = st?.opacity ?? 1;
      (c.mesh.material as THREE.MeshStandardMaterial[]).forEach((m) => {
        m.transparent = op < 1;
        m.opacity = op;
      });
      const em = c.edges.material as THREE.LineBasicMaterial;
      em.transparent = op < 1;
      em.opacity = op;
    });
    this.controls.enabled = this.opts.camera === 'free';
    this.controls.autoRotate = this.opts.autoRotate && this.opts.camera === 'free';
  }

  /** Snap the free camera back onto the isometric diagonal. */
  resetView(): void {
    this.persp.position.copy(isoCameraPosition(this.persp.position.length()));
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private resize(): void {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    const span = this.ortho.top;
    this.ortho.left = -span * aspect;
    this.ortho.right = span * aspect;
    this.ortho.updateProjectionMatrix();
    this.persp.aspect = aspect;
    this.persp.updateProjectionMatrix();
  }

  private loop = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    if (this.opts.camera === 'iso' && this.opts.autoRotate) {
      this.group.rotation.z += 0.004;
    } else if (this.opts.camera === 'iso') {
      // ease back to the canonical orientation
      this.group.rotation.z += (0 - this.group.rotation.z) * 0.1;
    } else {
      this.group.rotation.z = 0;
      this.controls.update();
    }
    this.renderer.render(this.scene, this.opts.camera === 'iso' ? this.ortho : this.persp);
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
