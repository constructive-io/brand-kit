import { easings } from '@constructive-io/brand-motion';
import * as THREE from 'three';

/**
 * Camera pose in the brand frame: azimuth around the vertical axis (radians,
 * 0 = the canonical isometric view), elevation above the ground plane
 * (radians), and distance from the origin as a multiple of the scene's fit.
 */
export interface CameraPose {
  azimuth: number;
  elevation: number;
  distance: number;
}

/** Camera choreography: t ∈ [0, 1] → pose. Pairs with a cube choreography over the same t. */
export type CameraPath = (t: number) => CameraPose;

/** Elevation of the (1,1,1) diagonal: atan(1/√2) ≈ 35.264°. */
export const ISO_ELEVATION = Math.atan(1 / Math.SQRT2);

export const ISO_POSE: CameraPose = { azimuth: 0, elevation: ISO_ELEVATION, distance: 1 };

const TAU = Math.PI * 2;

export const cameraPaths = {
  /** Locked isometric view — identical framing to the SVG. */
  iso: (): CameraPose => ISO_POSE,
  /** One full turn around the vertical axis at the iso elevation. */
  orbit: (t: number): CameraPose => ({ azimuth: t * TAU, elevation: ISO_ELEVATION, distance: 1 }),
  /** Quarter turn there and back with a gentle rise — good for reveals. */
  sweep: (t: number): CameraPose => {
    const k = easings.easeInOut(t < 0.5 ? t * 2 : 2 - t * 2);
    return { azimuth: (k - 0.5) * (Math.PI / 2), elevation: ISO_ELEVATION + k * 0.35, distance: 1 + k * 0.15 };
  },
  /** Start close and low, pull back up onto the diagonal. */
  dolly: (t: number): CameraPose => {
    const k = easings.easeOut(t);
    return { azimuth: -0.4 * (1 - k), elevation: 0.15 + (ISO_ELEVATION - 0.15) * k, distance: 0.55 + 0.45 * k };
  },
  /** Slow drift between two near-iso poses, for idle loops. */
  drift: (t: number): CameraPose => {
    const s = Math.sin(t * TAU);
    return { azimuth: s * 0.25, elevation: ISO_ELEVATION + Math.cos(t * TAU) * 0.08, distance: 1 };
  },
  /** Top-down plan view falling into the iso view. */
  'plan-to-iso': (t: number): CameraPose => {
    const k = easings.easeInOut(t);
    return { azimuth: 0, elevation: Math.PI / 2 - 0.001 - (Math.PI / 2 - 0.001 - ISO_ELEVATION) * k, distance: 1 };
  },
} satisfies Record<string, CameraPath>;

export type CameraPathName = keyof typeof cameraPaths;

/**
 * Convert a pose into a scene-space camera position. Azimuth 0 places the
 * camera on the (1,1,1) diagonal in brand coordinates.
 */
export function poseToPosition(pose: CameraPose, fitDistance: number): THREE.Vector3 {
  const r = pose.distance * fitDistance;
  const horiz = Math.cos(pose.elevation) * r;
  const base = Math.PI / 4 + pose.azimuth;
  return new THREE.Vector3(Math.cos(base) * horiz, Math.sin(base) * horiz, Math.sin(pose.elevation) * r);
}
