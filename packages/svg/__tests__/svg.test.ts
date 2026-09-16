import { gridToVoxels } from '@constructive-io/brand-geometry';

import { projectFaces, renderFrame, renderSvg, viewBoxForBounds } from '../src';

const MARK = gridToVoxels([[0, 1, 1], [1, 0, 0], [1, 0, 0], [0, 1, 1]], 'Yz');

describe('renderSvg(MARK)', () => {
  it('matches the golden mark', () => {
    expect(renderSvg(MARK).svg).toMatchSnapshot();
  });

  it('draws 3 visible faces per exposed side', () => {
    const faces = projectFaces(MARK);
    // 6 cubes × 3 visible faces minus the shared +y faces (col1→col2 in rows 0 and 3)
    // and the shared +z faces (row1→row2 stack in col 0... none share +z).
    expect(faces.every((f) => ['+x', '+y', '+z'].includes(f.face))).toBe(true);
    expect(faces.length).toBe(6 * 3 - 3);
  });

  it('is sorted back to front', () => {
    const d = projectFaces(MARK).map((f) => f.depth);
    expect(d).toEqual([...d].sort((a, b) => a - b));
  });

  it('supports the other modes', () => {
    expect(renderSvg(MARK, { mode: 'outline' }).svg).toContain('fill="none"');
    expect(renderSvg(MARK, { mode: 'outline' }).svg).not.toContain('#01A1FF"\n');
    const wf = renderSvg(MARK, { mode: 'wireframe' });
    expect(wf.faces.length).toBe(30);
    expect(wf.svg).toContain('opacity=');
  });

  it('applies colorway overrides and background', () => {
    const { svg } = renderSvg(MARK, { colors: { right: '#000000' }, background: '#232323' });
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('<rect');
  });
});

describe('renderSvg', () => {
  it('produces a square-ish viewBox for a single cube', () => {
    const { viewBox } = renderSvg(gridToVoxels([[1]], 'xy'), { size: 100, padding: 0, strokeWidth: 0 });
    expect(viewBox.w).toBeCloseTo(100 * Math.sqrt(3));
    expect(viewBox.h).toBeCloseTo(200);
  });

  it('renders empty models', () => {
    expect(renderSvg({ voxels: [] }).svg).toContain('<svg');
  });
});

describe('annotate', () => {
  it('renders cube text', () => {
    const r = renderSvg(MARK, { annotate: true });
    expect(r.svg).toContain('data-voxel=');
    expect(r.faces.length).toBeGreaterThan(0);
  });
});

describe('renderFrame', () => {
  const rest = MARK.voxels.map(() => ({ offset: { x: 0, y: 0, z: 0 }, scale: 1, opacity: 1, spin: 0 }));

  it('matches renderSvg when every voxel is at rest', () => {
    expect(renderFrame(MARK, rest).faces.length).toBe(renderSvg(MARK).faces.length);
  });

  it('reveals culled faces once cubes separate', () => {
    const moved = rest.map((t, i) => (i === 0 ? { ...t, offset: { x: 0, y: 0, z: 3 }, opacity: 0.5 } : t));
    const r = renderFrame(MARK, moved);
    expect(r.faces.length).toBeGreaterThan(renderSvg(MARK).faces.length);
    expect(r.svg).toContain('opacity="0.5"');
  });

  it('honours a fixed viewBox', () => {
    const vb = viewBoxForBounds({ min: { x: -5, y: -5, z: -5 }, max: { x: 5, y: 5, z: 5 } });
    expect(renderFrame(MARK, rest, { viewBox: vb }).viewBox).toEqual(vb);
  });
});
