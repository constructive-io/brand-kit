import { add, depth, Vec3 } from './iso';
import { gridToWorld, IsoPlane } from './planes';

/**
 * A voxel is the unit cube [x, x+1] × [y, y+1] × [z, z+1].
 */
export type Voxel = Vec3;

export interface VoxelModel {
  voxels: Voxel[];
}

export type Grid = number[][];

/** Which face of a cube. Named by outward normal. */
export type FaceId = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

export const FACE_NORMALS: Record<FaceId, Vec3> = {
  '+x': { x: 1, y: 0, z: 0 },
  '-x': { x: -1, y: 0, z: 0 },
  '+y': { x: 0, y: 1, z: 0 },
  '-y': { x: 0, y: -1, z: 0 },
  '+z': { x: 0, y: 0, z: 1 },
  '-z': { x: 0, y: 0, z: -1 },
};

export type VisibleFaceId = '+z' | '+y' | '+x';

/**
 * The three faces the isometric camera can see. The camera sits at
 * +∞·(1,1,1) looking along (-1,-1,-1), so faces whose normal has a positive
 * dot with (1,1,1) face it: +z (top), +y (left on screen), +x (right).
 */
export const VISIBLE_FACES: readonly VisibleFaceId[] = ['+z', '+y', '+x'];

export type FaceLabel = 'top' | 'left' | 'right';

/** Brand names for the visible faces. */
export const FACE_LABEL: Record<VisibleFaceId, FaceLabel> = {
  '+z': 'top',
  '+y': 'left',
  '+x': 'right',
};

export function isVisibleFace(face: FaceId): face is VisibleFaceId {
  return face === '+z' || face === '+y' || face === '+x';
}

/**
 * Corner offsets of each face, counter-clockwise when viewed from outside
 * (so the right-hand rule gives the outward normal).
 */
export const FACE_CORNERS: Record<FaceId, [Vec3, Vec3, Vec3, Vec3]> = {
  '+x': [
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: 1, y: 1, z: 1 },
    { x: 1, y: 0, z: 1 },
  ],
  '-x': [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 1, z: 1 },
  ],
  '+y': [
    { x: 1, y: 1, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 1, z: 1 },
    { x: 1, y: 1, z: 1 },
  ],
  '-y': [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
    { x: 0, y: 0, z: 1 },
  ],
  '+z': [
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: 0, y: 1, z: 1 },
  ],
  '-z': [
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ],
};

/** World-space corners of one face of a voxel. */
export function faceCorners(v: Voxel, face: FaceId): [Vec3, Vec3, Vec3, Vec3] {
  const [a, b, c, d] = FACE_CORNERS[face];
  return [add(v, a), add(v, b), add(v, c), add(v, d)];
}

/** Lift a 2D grid (1 = cube) onto a plane. */
export function gridToVoxels(grid: Grid, plane: IsoPlane): VoxelModel {
  const voxels: Voxel[] = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === 1) voxels.push(gridToWorld(row, col, plane));
    }
  }
  return { voxels };
}

export function voxelKey(v: Vec3): string {
  return `${v.x},${v.y},${v.z}`;
}

export function voxelSet(model: VoxelModel): Set<string> {
  return new Set(model.voxels.map(voxelKey));
}

export function hasVoxel(set: Set<string>, v: Vec3): boolean {
  return set.has(voxelKey(v));
}

/** Voxels ordered back-to-front for the painter's algorithm. */
export function sortByDepth(model: VoxelModel): Voxel[] {
  return [...model.voxels].sort((a, b) => depth(a) - depth(b));
}

export interface Bounds3 {
  min: Vec3;
  max: Vec3;
}

/** Axis-aligned bounds of the solid (max is the far corner, so max = cell + 1). */
export function bounds(model: VoxelModel): Bounds3 {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const v of model.voxels) {
    min.x = Math.min(min.x, v.x);
    min.y = Math.min(min.y, v.y);
    min.z = Math.min(min.z, v.z);
    max.x = Math.max(max.x, v.x + 1);
    max.y = Math.max(max.y, v.y + 1);
    max.z = Math.max(max.z, v.z + 1);
  }
  return { min, max };
}

/** Center of the bounding box. */
export function center(model: VoxelModel): Vec3 {
  const b = bounds(model);
  return {
    x: (b.min.x + b.max.x) / 2,
    y: (b.min.y + b.max.y) / 2,
    z: (b.min.z + b.max.z) / 2,
  };
}

/** Translate every voxel by an integer offset. */
export function translate(model: VoxelModel, offset: Vec3): VoxelModel {
  return { voxels: model.voxels.map((v) => add(v, offset)) };
}

/**
 * Faces of the solid that touch air (not shared with a neighbouring voxel).
 * This is what a mesh exporter should emit.
 */
export function exposedFaces(model: VoxelModel): { voxel: Voxel; face: FaceId }[] {
  const set = voxelSet(model);
  const out: { voxel: Voxel; face: FaceId }[] = [];
  for (const voxel of model.voxels) {
    for (const face of Object.keys(FACE_NORMALS) as FaceId[]) {
      if (!hasVoxel(set, add(voxel, FACE_NORMALS[face]))) out.push({ voxel, face });
    }
  }
  return out;
}
