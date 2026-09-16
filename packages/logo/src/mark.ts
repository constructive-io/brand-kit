import { Grid, gridToVoxels, IsoPlane, VoxelModel } from '@constructive-io/brand-geometry';

/**
 * The Constructive mark: a "C" built from six unit cubes.
 *
 *   . ■ ■
 *   ■ . .
 *   ■ . .
 *   . ■ ■
 *
 * The grid stands on the left wall (plane `Yz`, X = 0) so the C reads
 * left-to-right when projected. Everything else in the kit — the SVG
 * lockups, the 3D model, the animations — derives from these two values.
 */
export const MARK_GRID: Grid = [
  [0, 1, 1],
  [1, 0, 0],
  [1, 0, 0],
  [0, 1, 1],
];

export const MARK_PLANE: IsoPlane = 'Yz';

export const MARK: VoxelModel = gridToVoxels(MARK_GRID, MARK_PLANE);
