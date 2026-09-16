import { FaceLabel, Vec3 } from '@constructive-io/brand-geometry';
import * as THREE from 'three';

/**
 * Brand space → scene space. The brand projection puts +x on screen-right and
 * +y on screen-left, which is the mirror of a right-handed camera on the
 * (1,1,1) diagonal; swapping x and y makes the WebGL view match the SVG exactly.
 */
export function toScene(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(y, x, z);
}

export function vecToScene(v: Vec3): THREE.Vector3 {
  return toScene(v.x, v.y, v.z);
}

/**
 * Brand face label for each BoxGeometry material group, in three.js order
 * (+x, -x, +y, -y, +z, -z in scene space). Scene +x is brand +y (left face),
 * scene +y is brand +x (right face), +z is the top.
 */
export const BOX_FACE_ORDER: readonly FaceLabel[] = ['left', 'left', 'right', 'right', 'top', 'top'];

/** Camera position on the (1,1,1) diagonal, scaled to `distance`. */
export function isoCameraPosition(distance: number): THREE.Vector3 {
  return new THREE.Vector3(1, 1, 1).setLength(distance);
}

export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
