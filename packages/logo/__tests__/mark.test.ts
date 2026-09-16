import { bounds, depth, exposedFaces, sortByDepth } from '@constructive-io/brand-geometry';

import { exportMark, MARK, MARK_GRID, renderMark } from '../src';

describe('mark', () => {
  it('is six cubes', () => {
    expect(MARK.voxels).toHaveLength(6);
    expect(MARK_GRID.flat().filter((c) => c === 1)).toHaveLength(6);
  });

  it('lies on the X = 0 wall', () => {
    expect(MARK.voxels.every((v) => v.x === 0)).toBe(true);
    expect(bounds(MARK)).toEqual({ min: { x: 0, y: -2, z: -3 }, max: { x: 1, y: 1, z: 1 } });
  });

  it('sorts back to front', () => {
    const d = sortByDepth(MARK).map(depth);
    expect(d).toEqual([...d].sort((a, b) => a - b));
  });

  it('has the expected exposed face count', () => {
    // 6 cubes × 6 faces = 36, minus 2 per shared face.
    // Shared faces: (0,1)-(0,2), (1,0)-(2,0), (3,1)-(3,2) → 3 pairs.
    expect(exposedFaces(MARK)).toHaveLength(36 - 6);
  });

  it('renders SVG and OBJ from the same model', () => {
    expect(renderMark().svg).toContain('<svg');
    expect(exportMark().obj).toContain('constructive-mark');
  });
});
