import { gridToVoxels } from '@constructive-io/brand-geometry';

import { buildMesh, exportObj, toMtl, toObj, triangulate } from '../src';

const MARK = gridToVoxels([[0, 1, 1], [1, 0, 0], [1, 0, 0], [0, 1, 1]], 'Yz');

const cube = gridToVoxels([[1]], 'xy');

describe('buildMesh', () => {
  it('single cube: 8 vertices, 6 quads', () => {
    const m = buildMesh(cube);
    expect(m.vertices).toHaveLength(8);
    expect(m.faces).toHaveLength(6);
    expect(triangulate(m)).toHaveLength(36);
  });

  it('mark: six whole cubes, each with its own vertices and group', () => {
    const m = buildMesh(MARK);
    expect(m.faces).toHaveLength(36);
    expect(m.vertices).toHaveLength(48);
    expect(new Set(m.faces.map((f) => f.group)).size).toBe(6);
    const obj = toObj(m, { mtllib: 'x.mtl' });
    expect(obj.match(/^g cube_\d+$/gm)).toHaveLength(6);
  });

  it('mark: cubes touch — 48 corners collapse to 32 distinct points', () => {
    const m = buildMesh(MARK);
    const uniq = new Set(m.vertices.map((v) => `${v.x},${v.y},${v.z}`));
    expect(uniq.size).toBe(32);
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
    expect(obj.match(/^v /gm)).toHaveLength(48);
    expect(obj.match(/^vn /gm)).toHaveLength(6);
    expect(obj.match(/^f /gm)).toHaveLength(36);
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

  it('maps brand space to a right-handed frame and keeps outward CCW winding', () => {
    // brand +x is screen-right from the (1,1,1) iso camera; in a right-handed scene that axis is +y.
    const m = buildMesh(gridToVoxels([[1, 1]], 'xy'), { center: false });
    const obj = toObj(m, { yUp: false });
    expect(obj).toContain('v 0.0000 2.0000 0.0000');
    expect(obj).not.toContain('v 2.0000 0.0000 0.0000');

    const v = obj.split('\n').filter((l) => l.startsWith('v ')).map((l) => l.slice(2).split(' ').map(Number));
    const vn = obj.split('\n').filter((l) => l.startsWith('vn ')).map((l) => l.slice(3).split(' ').map(Number));
    for (const line of obj.split('\n').filter((l) => l.startsWith('f '))) {
      const refs = line.slice(2).split(' ').map((r) => r.split('//').map(Number));
      const [a, b, c] = refs.map(([i]) => v[i - 1]);
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
      const n = vn[refs[0][1] - 1];
      expect(cross[0] * n[0] + cross[1] * n[1] + cross[2] * n[2]).toBeGreaterThan(0);
    }
  });

  it('z-up keeps world axes', () => {
    const m = buildMesh(gridToVoxels([[1]], 'xy'));
    expect(toObj(m, { yUp: false })).toContain('v 0.0000 0.0000 1.0000');
    expect(toObj(m, { yUp: true })).toContain('v 0.0000 1.0000 0.0000');
    expect(toMtl(m)).toContain('newmtl top');
  });
});
