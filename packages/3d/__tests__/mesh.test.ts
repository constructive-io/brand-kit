import { gridToVoxels } from '@constructive-io/brand-geometry';

import { buildMesh, exportObj, toMtl, toObj, triangulate } from '../src';

const MARK = gridToVoxels([[0, 1, 1], [1, 0, 0], [1, 0, 0], [0, 1, 1]], 'Yz');

const cube = gridToVoxels([[1]], 'xy');

describe('buildMesh cubes topology', () => {
  it('keeps every cube whole with its own vertices and group', () => {
    const m = buildMesh(MARK, { topology: 'cubes' });
    expect(m.faces).toHaveLength(36);
    expect(m.vertices).toHaveLength(48);
    expect(new Set(m.faces.map((f) => f.group)).size).toBe(6);
    const obj = toObj(m, { mtllib: 'x.mtl' });
    expect(obj.match(/^g cube_\d+$/gm)).toHaveLength(6);
    expect(obj.match(/^f /gm)).toHaveLength(36);
  });
});

describe('buildMesh', () => {
  it('single cube: 8 vertices, 6 quads', () => {
    const m = buildMesh(cube);
    expect(m.vertices).toHaveLength(8);
    expect(m.faces).toHaveLength(6);
    expect(triangulate(m)).toHaveLength(36);
  });

  it('mark: culls the 3 shared faces and shares vertices', () => {
    const m = buildMesh(MARK);
    expect(m.faces).toHaveLength(30);
    // 48 corners − 3 shared faces × 4 − 2 diagonal-touching edges × 2 = 32
    expect(m.vertices).toHaveLength(32);
  });

  it('is consistently oriented: every directed edge has a matching reverse', () => {
    const m = buildMesh(MARK);
    const edges = new Map<string, number>();
    for (const { indices } of m.faces) {
      for (let i = 0; i < 4; i++) {
        const a = indices[i];
        const b = indices[(i + 1) % 4];
        edges.set(`${a}>${b}`, (edges.get(`${a}>${b}`) ?? 0) + 1);
      }
    }
    for (const [key, n] of edges) {
      const [a, b] = key.split('>');
      expect(edges.get(`${b}>${a}`)).toBe(n);
    }
  });

  it('centres the model', () => {
    const m = buildMesh(MARK, { center: true });
    for (const axis of ['x', 'y', 'z'] as const) {
      const vals = m.vertices.map((v) => v[axis]);
      expect(Math.min(...vals) + Math.max(...vals)).toBeCloseTo(0);
    }
  });
});

describe('obj export', () => {
  it('writes vertices, normals, materials and quads', () => {
    const { obj, mtl } = exportObj(MARK, 'constructive-mark');
    expect(obj.match(/^v /gm)).toHaveLength(32);
    expect(obj.match(/^vn /gm)).toHaveLength(6);
    expect(obj.match(/^f /gm)).toHaveLength(30);
    expect(obj).toContain('mtllib constructive-mark.mtl');
    expect(obj).toContain('usemtl top');
    expect(mtl).toContain('newmtl right');
    expect(mtl).toContain('Kd 0.0039 0.6314 1.0000');
  });

  it('matches golden output', () => {
    const { obj, mtl } = exportObj(MARK, 'constructive-mark');
    expect(obj).toMatchSnapshot();
    expect(mtl).toMatchSnapshot();
  });

  it('z-up keeps world axes', () => {
    const m = buildMesh(gridToVoxels([[1]], 'xy'));
    expect(toObj(m, { yUp: false })).toContain('v 0.0000 0.0000 1.0000');
    expect(toObj(m, { yUp: true })).toContain('v 0.0000 1.0000 0.0000');
    expect(toMtl(m)).toContain('newmtl top');
  });
});
