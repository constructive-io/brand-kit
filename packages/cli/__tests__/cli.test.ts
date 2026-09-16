import { generateAll, objCommand, parseArgs, svgCommand } from '../src';

describe('parseArgs', () => {
  it('parses command, positionals and flags', () => {
    expect(parseArgs(['svg', 'text', 'HI', '--mode', 'outline', '--size=40', '--annotate'])).toEqual({
      command: 'svg',
      positional: ['text', 'HI'],
      flags: { mode: 'outline', size: '40', annotate: true },
    });
  });
});

describe('svgCommand', () => {
  it('renders the mark by default', () => {
    expect(svgCommand([], {})).toContain('<svg');
  });
  it('renders grids and text', () => {
    expect(svgCommand(['grid', '011/100/100/011'], {})).toBe(svgCommand(['mark'], {}));
    expect(svgCommand(['text', 'C'], { mode: 'wireframe' })).toContain('opacity=');
  });
  it('rejects bad input', () => {
    expect(() => svgCommand(['nope'], {})).toThrow(/unknown model/);
    expect(() => svgCommand([], { plane: 'qq' })).toThrow(/unknown plane/);
    expect(() => svgCommand([], { colorway: 'neon' })).toThrow(/unknown colorway/);
  });
});

describe('objCommand', () => {
  it('names outputs', () => {
    const r = objCommand(['text', 'Hi there'], {});
    expect(r.name).toBe('text-hi-there');
    expect(r.obj).toContain('o text-hi-there');
    expect(r.mtl).toContain('newmtl');
  });
});

describe('generateAll', () => {
  it('produces a stable file set', () => {
    const files = generateAll();
    const paths = files.map((f) => f.path);
    expect(paths).toContain('svg/mark-light.svg');
    expect(paths).toContain('svg/mark-wireframe.svg');
    expect(paths).toContain('svg/planes/mark-Yz.svg');
    expect(paths).toContain('svg/alphabet/C.svg');
    expect(paths).toContain('obj/constructive-mark.obj');
    expect(new Set(paths).size).toBe(paths.length);
    expect(files.every((f) => f.content.length > 0)).toBe(true);
  });
});
