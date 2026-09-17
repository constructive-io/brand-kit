import { gridToVoxels } from '@constructive-io/brand-geometry';

import { AT_REST, chain, Choreography, explode, hold, layer, mirror, reels, reverse, VoxelState } from '../src';

const MARK = gridToVoxels([[0, 1, 1], [1, 0, 0], [1, 0, 0], [0, 1, 1]], 'Yz');

const atRest = (states: VoxelState[]) =>
  states.every(
    (s) =>
      Math.abs(s.offset.x) < 1e-6 &&
      Math.abs(s.offset.y) < 1e-6 &&
      Math.abs(s.offset.z) < 1e-6 &&
      Math.abs(s.scale - 1) < 1e-6 &&
      Math.abs(s.opacity - 1) < 1e-6 &&
      Math.abs(s.spin) < 1e-6,
  );

describe('composition', () => {
  const ex = explode();

  it('reverse swaps the ends', () => {
    expect(reverse(ex)(MARK, 0)).toEqual(ex(MARK, 1));
    expect(reverse(ex)(MARK, 1)).toEqual(ex(MARK, 0));
  });

  it('mirror is at the original t=1 pose in the middle and back at t=0 pose at both ends', () => {
    const m = mirror(ex);
    expect(m(MARK, 0.5)).toEqual(ex(MARK, 1));
    expect(m(MARK, 0)).toEqual(ex(MARK, 0));
    expect(m(MARK, 1)).toEqual(ex(MARK, 0));
  });

  it('hold ignores t', () => {
    const h = hold(ex, 1);
    expect(h(MARK, 0)).toEqual(ex(MARK, 1));
    expect(h(MARK, 0.7)).toEqual(ex(MARK, 1));
  });

  it('chain divides time by weight and runs each step 0→1', () => {
    const calls: [string, number][] = [];
    const step = (name: string): Choreography => (model, t) => {
      calls.push([name, t]);
      return model.voxels.map(() => AT_REST);
    };
    const c = chain([{ choreo: step('a'), weight: 1 }, { choreo: step('b'), weight: 3 }]);
    c(MARK, 0.125);
    c(MARK, 0.25);
    c(MARK, 0.625);
    c(MARK, 1);
    expect(calls.map(([n, t]) => `${n}:${t.toFixed(3)}`)).toEqual(['a:0.500', 'b:0.000', 'b:0.500', 'b:1.000']);
  });

  it('layer sums offsets and multiplies scale/opacity', () => {
    const a: Choreography = (m) => m.voxels.map(() => ({ offset: { x: 1, y: 0, z: 0 }, scale: 2, opacity: 0.5, spin: 1 }));
    const b: Choreography = (m) => m.voxels.map(() => ({ offset: { x: 0, y: 2, z: 0 }, scale: 0.5, opacity: 0.5, spin: 1 }));
    const s = layer(a, b)(MARK, 0)[0];
    expect(s).toEqual({ offset: { x: 1, y: 2, z: 0 }, scale: 1, opacity: 0.25, spin: 2 });
  });
});

describe('reels', () => {
  it('pulse is at rest at both ends and displaced in the middle', () => {
    expect(atRest(reels.pulse(MARK, 0))).toBe(true);
    expect(atRest(reels.pulse(MARK, 1))).toBe(true);
    expect(atRest(reels.pulse(MARK, 0.5))).toBe(false);
  });

  it('build-breathe-scatter is at rest at act boundaries', () => {
    const r = reels['build-breathe-scatter'];
    expect(atRest(r(MARK, 3 / 7))).toBe(true);
    expect(atRest(r(MARK, 5 / 7))).toBe(true);
  });
});
