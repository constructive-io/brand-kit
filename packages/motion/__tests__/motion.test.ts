import { gridToVoxels } from '@constructive-io/brand-geometry';

import { assemble, AT_REST, choreography, converge, explode, Family, motionBounds, orbit, presets, tetris, Timeline } from '../src';

const MARK = gridToVoxels([[0, 1, 1], [1, 0, 0], [1, 0, 0], [0, 1, 1]], 'Yz');

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('choreographies', () => {
  const all = (Object.keys(presets) as Family[]).flatMap((f) => presets[f].map((p) => [f, p] as const));

  it.each(all)('%s/%s returns one state per voxel and ends at rest', (family, preset) => {
    const c = choreography(family, preset);
    const start = c(MARK, 0);
    const end = c(MARK, 1);
    expect(start).toHaveLength(MARK.voxels.length);
    for (const s of end) {
      expect(near(s.offset.x, 0) && near(s.offset.y, 0) && near(s.offset.z, 0)).toBe(true);
      expect(near(s.scale, 1)).toBe(true);
      expect(near(s.opacity, 1)).toBe(true);
      expect(near(s.spin, 0)).toBe(true);
    }
  });

  it.each(all)('%s/%s is displaced at t = 0', (family, preset) => {
    const moved = choreography(family, preset)(MARK, 0).some((s) => Math.hypot(s.offset.x, s.offset.y, s.offset.z) > 0.5);
    expect(moved).toBe(true);
  });

  it('is deterministic', () => {
    expect(explode({ preset: 'scatter' })(MARK, 0.3)).toEqual(explode({ preset: 'scatter' })(MARK, 0.3));
  });

  it('assemble orders layers top-down', () => {
    const s = assemble({ preset: 'top-down', overlap: 0 })(MARK, 0.3);
    const top = MARK.voxels.findIndex((v) => v.z === 0);
    const bottom = MARK.voxels.findIndex((v) => v.z === -3);
    expect(s[top].opacity).toBeGreaterThan(s[bottom].opacity);
  });

  it('tetris moves layers as rigid pieces', () => {
    const s = tetris({ preset: 'classic-drop' })(MARK, 0.2);
    const top = MARK.voxels.map((v, i) => (v.z === 0 ? i : -1)).filter((i) => i >= 0);
    expect(top).toHaveLength(2);
    expect(s[top[0]].offset).toEqual(s[top[1]].offset);
  });

  it('orbit and converge respect distance', () => {
    const o = orbit({ radius: 5 })(MARK, 0)[0].offset;
    expect(Math.hypot(o.x, o.y)).toBeGreaterThan(4);
    const c = converge({ distance: 2 })(MARK, 0)[0].offset;
    expect(Math.hypot(c.x, c.y, c.z)).toBeCloseTo(2);
  });

  it('motionBounds contains the resting model', () => {
    const b = motionBounds(MARK, explode());
    expect(b.min.z).toBeLessThanOrEqual(-3);
    expect(b.max.z).toBeGreaterThanOrEqual(1);
  });
});

describe('Timeline', () => {
  it('loops', () => {
    const tl = new Timeline(1);
    tl.play();
    tl.tick(0);
    expect(tl.tick(500)).toBeCloseTo(0.5);
    expect(tl.tick(1100)).toBe(0);
  });

  it('bounces', () => {
    const tl = new Timeline(1);
    tl.mode = 'bounce';
    tl.play();
    tl.tick(0);
    tl.tick(1200);
    expect(tl.progress).toBe(1);
    expect(tl.tick(1700)).toBeCloseTo(0.5);
  });

  it('stops once', () => {
    const tl = new Timeline(1);
    tl.mode = 'once';
    tl.play();
    tl.tick(0);
    tl.tick(2000);
    expect(tl.playing).toBe(false);
    expect(tl.progress).toBe(1);
    expect(AT_REST.scale).toBe(1);
  });
});
