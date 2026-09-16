import { Vec3 } from './iso';

/**
 * A plane maps a 2D grid (row, col) onto one of the three world planes.
 *
 * Two letters: first = the world axis that grid columns run along,
 * second = the axis that grid rows run along. Lowercase = positive
 * direction, uppercase = negative.
 *
 * Floor (Z = 0):        xy  yx  Xy  Yx
 * Right wall (Y = 0):   xz  zx
 * Left wall (X = 0):    yz  zy  Yz  Zy
 *
 * The Constructive mark uses `Yz`: columns run toward the viewer along -Y,
 * rows run down along -Z, so a glyph reads left-to-right on the left wall.
 */
export type IsoPlane = 'xy' | 'yx' | 'Xy' | 'Yx' | 'xz' | 'zx' | 'yz' | 'zy' | 'Yz' | 'Zy';

export const ISO_PLANES: readonly IsoPlane[] = ['xy', 'yx', 'Xy', 'Yx', 'xz', 'zx', 'yz', 'zy', 'Yz', 'Zy'];

export function isIsoPlane(value: string): value is IsoPlane {
  return (ISO_PLANES as readonly string[]).includes(value);
}

/** Negate without producing -0. */
const neg = (n: number): number => (n === 0 ? 0 : -n);

/** Map a grid cell to the world-space cell it occupies. */
export function gridToWorld(row: number, col: number, plane: IsoPlane): Vec3 {
  switch (plane) {
  case 'xy':
    return { x: col, y: row, z: 0 };
  case 'yx':
    return { x: row, y: col, z: 0 };
  case 'Xy':
    return { x: neg(col), y: row, z: 0 };
  case 'Yx':
    return { x: row, y: neg(col), z: 0 };
  case 'xz':
    return { x: col, y: 0, z: neg(row) };
  case 'zx':
    return { x: row, y: 0, z: neg(col) };
  case 'yz':
    return { x: 0, y: col, z: neg(row) };
  case 'zy':
    return { x: 0, y: row, z: neg(col) };
  case 'Yz':
    return { x: 0, y: neg(col), z: neg(row) };
  case 'Zy':
    return { x: 0, y: neg(row), z: neg(col) };
  }
}
