import { gridToVoxels } from '@constructive-io/brand-geometry';
import { choreography } from '@constructive-io/brand-motion';

import { animatedSvg, sequence, spriteSheet } from '../src';

const MARK = gridToVoxels(
  [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [0, 1, 1],
  ],
  'Yz',
);

describe('sequence', () => {
  it('samples t from 0 to 1 with a shared viewBox and padded names', () => {
    const s = sequence(MARK, choreography('explode', 'radial'), { frames: 5, name: 'explode-radial' });
    expect(s.frames.map((f) => f.t)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(s.frames[0].name).toBe('explode-radial-000.svg');
    const viewBoxes = new Set(s.frames.map((f) => f.svg.match(/viewBox="([^"]*)"/)?.[1]));
    expect(viewBoxes.size).toBe(1);
  });

  it('is deterministic', () => {
    const a = sequence(MARK, choreography('tetris', 'classic-drop'), { frames: 8 });
    const b = sequence(MARK, choreography('tetris', 'classic-drop'), { frames: 8 });
    expect(a).toEqual(b);
  });

  it('ends on the assembled mark', () => {
    const s = sequence(MARK, choreography('assemble', 'bottom-up'), { frames: 3 });
    const last = s.frames[2].svg.replace(/viewBox="[^"]*"/, '').replace(/width="[^"]*" height="[^"]*"/, '');
    const still = sequence(MARK, () => MARK.voxels.map(() => ({ offset: { x: 0, y: 0, z: 0 }, scale: 1, opacity: 1, spin: 0 })), {
      frames: 1,
      viewBox: s.viewBox,
    }).frames[0].svg.replace(/viewBox="[^"]*"/, '').replace(/width="[^"]*" height="[^"]*"/, '');
    expect(last).toBe(still);
  });
});

describe('animatedSvg', () => {
  it('emits one SMIL group per frame and loops', () => {
    const svg = animatedSvg(MARK, choreography('converge', 'wave'), { frames: 6, duration: 1.5 });
    expect(svg.match(/<animate /g)).toHaveLength(6);
    expect(svg).toContain('dur="1.5s"');
    expect(svg).toContain('repeatCount="indefinite"');
    expect(svg.match(/<svg /g)).toHaveLength(1);
  });

  it('bounce doubles the timeline without repeating the end frames', () => {
    const svg = animatedSvg(MARK, choreography('orbit', 'helix'), { frames: 6, duration: 1, playback: 'bounce' });
    expect(svg.match(/<animate /g)).toHaveLength(10);
    expect(svg).toContain('dur="2s"');
  });
});

describe('spriteSheet', () => {
  it('tiles frames in a grid', () => {
    const sheet = spriteSheet(MARK, choreography('explode', 'scatter'), { frames: 6, columns: 3 });
    expect(sheet.columns).toBe(3);
    expect(sheet.rows).toBe(2);
    expect(sheet.svg.match(/<g transform="translate/g)).toHaveLength(6);
    const [, w, h] = sheet.svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) ?? [];
    expect(Number(w)).toBeCloseTo(sheet.cell.width * 3, 2);
    expect(Number(h)).toBeCloseTo(sheet.cell.height * 2, 2);
  });
});
