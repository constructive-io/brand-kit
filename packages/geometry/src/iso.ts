/**
 * Isometric projection.
 *
 * World axes: +X toward the viewer's lower-right, +Y toward the viewer's
 * lower-left, +Z up. The camera looks along (-1, -1, -1), so the three
 * visible faces of a unit cube are +Z (top), +Y (left) and +X (right).
 *
 * Screen axes: +x right, +y down (SVG convention).
 *
 *   sx = (x - y) · cos 30° · s
 *   sy = (x + y) · sin 30° · s − z · s
 *
 * where s is the on-screen length of one cube edge.
 */

export const ISO_ANGLE_DEG = 30;
export const ISO_ANGLE = (ISO_ANGLE_DEG * Math.PI) / 180;

/** cos 30° = √3 / 2 — horizontal run of one unit edge */
export const ISO_COS = Math.sqrt(3) / 2;
/** sin 30° = 1 / 2 — vertical rise of one unit edge */
export const ISO_SIN = 0.5;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Project a world point to the screen. `size` is the edge length in px. */
export function project(p: Vec3, size = 1): Vec2 {
  return {
    x: (p.x - p.y) * ISO_COS * size,
    y: (p.x + p.y) * ISO_SIN * size - p.z * size,
  };
}

/**
 * Painter's-algorithm depth. Larger is closer to the camera.
 * The view direction is (-1,-1,-1), so distance along it is x + y + z.
 */
export function depth(p: Vec3): number {
  return p.x + p.y + p.z;
}

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
