import {
  depth,
  exposedFaces,
  gridToVoxels,
  gridToWorld,
  ISO_COS,
  ISO_PLANES,
  project,
} from '../src';

describe('projection', () => {
  it('uses the 30° isometric basis', () => {
    expect(project({ x: 1, y: 0, z: 0 })).toEqual({ x: ISO_COS, y: 0.5 });
    expect(project({ x: 0, y: 1, z: 0 })).toEqual({ x: -ISO_COS, y: 0.5 });
    expect(project({ x: 0, y: 0, z: 1 })).toEqual({ x: 0, y: -1 });
  });

  it('scales by size', () => {
    expect(project({ x: 1, y: 1, z: 0 }, 100)).toEqual({ x: 0, y: 100 });
  });

  it('depth increases toward the camera', () => {
    expect(depth({ x: 1, y: 0, z: 0 })).toBeGreaterThan(depth({ x: 0, y: 0, z: 0 }));
  });
});

describe('planes', () => {
  it('maps every plane to a distinct cell for (1,2)', () => {
    const cells = ISO_PLANES.map((p) => JSON.stringify(gridToWorld(1, 2, p)));
    expect(new Set(cells).size).toBe(ISO_PLANES.length);
  });

  it('Yz puts columns along -Y and rows along -Z', () => {
    expect(gridToWorld(0, 0, 'Yz')).toEqual({ x: 0, y: 0, z: 0 });
    expect(gridToWorld(0, 2, 'Yz')).toEqual({ x: 0, y: -2, z: 0 });
    expect(gridToWorld(3, 0, 'Yz')).toEqual({ x: 0, y: 0, z: -3 });
  });
});

describe('gridToVoxels', () => {
  it('culls interior faces of a 2×2×1 slab', () => {
    const slab = gridToVoxels([[1, 1], [1, 1]], 'xy');
    expect(slab.voxels).toHaveLength(4);
    expect(exposedFaces(slab)).toHaveLength(4 * 6 - 4 * 2);
  });
});
