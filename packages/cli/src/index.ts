import { exportObj } from '@constructive-io/brand-3d';
import { supportedChars, textToVoxels } from '@constructive-io/brand-font';
import { colorways, gridToVoxels, isIsoPlane, ISO_PLANES, IsoPlane, VoxelModel } from '@constructive-io/brand-geometry';
import { MARK, MARK_GRID } from '@constructive-io/brand-logo';
import { choreography, Family, presets } from '@constructive-io/brand-motion';
import { animatedSvg, Frame, sequence } from '@constructive-io/brand-motion-2d';
import { RenderMode, renderSvg } from '@constructive-io/brand-svg';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface Flags {
  [key: string]: string | boolean | undefined;
}

export interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Flags;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = 'help', ...rest] = argv;
  const positional: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=', 2);
      if (v !== undefined) flags[k] = v;
      else if (rest[i + 1] !== undefined && !rest[i + 1].startsWith('--')) flags[k] = rest[++i];
      else flags[k] = true;
    } else positional.push(a);
  }
  return { command, positional, flags };
}

const str = (v: string | boolean | undefined, d: string): string => (typeof v === 'string' ? v : d);
const num = (v: string | boolean | undefined, d: number): number => (typeof v === 'string' ? Number(v) : d);

function plane(v: string | boolean | undefined): IsoPlane {
  const p = str(v, 'Yz');
  if (!isIsoPlane(p)) throw new Error(`unknown plane "${p}" (one of ${ISO_PLANES.join(', ')})`);
  return p;
}

function modelFrom(positional: string[], flags: Flags): { model: VoxelModel; name: string } {
  const [what = 'mark', arg] = positional;
  switch (what) {
  case 'mark':
    return { model: gridToVoxels(MARK_GRID, plane(flags.plane)), name: 'constructive-mark' };
  case 'text': {
    if (!arg) throw new Error('usage: text <string>');
    const model = textToVoxels(arg, { plane: plane(flags.plane), letterSpacing: num(flags.spacing, 1) });
    return { model, name: `text-${arg.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` };
  }
  case 'grid': {
    if (!arg) throw new Error('usage: grid <rows separated by "/"; e.g. 011/100/100/011>');
    const grid = arg.split('/').map((r) => [...r].map((c) => (c === '1' || c === '#' ? 1 : 0)));
    return { model: gridToVoxels(grid, plane(flags.plane)), name: 'grid' };
  }
  default:
    throw new Error(`unknown model "${what}" (mark | text <str> | grid <rows>)`);
  }
}

function colorway(flags: Flags) {
  const key = str(flags.colorway, 'light');
  if (!(key in colorways)) throw new Error(`unknown colorway "${key}" (${Object.keys(colorways).join(', ')})`);
  return colorways[key as keyof typeof colorways];
}

export function svgCommand(positional: string[], flags: Flags): string {
  const { model } = modelFrom(positional, flags);
  const cw = colorway(flags);
  return renderSvg(model, {
    mode: str(flags.mode, 'filled') as RenderMode,
    size: num(flags.size, 120),
    strokeWidth: num(flags['stroke-width'], 10),
    padding: num(flags.padding, 20),
    colors: cw,
    stroke: str(flags.stroke, cw.stroke),
    background: typeof flags.background === 'string' ? flags.background : undefined,
    annotate: flags.annotate === true,
  }).svg;
}

export function objCommand(positional: string[], flags: Flags): { obj: string; mtl: string; name: string } {
  const { model, name } = modelFrom(positional, flags);
  const out = exportObj(model, str(flags.name, name), {
    size: num(flags.size, 1),
    colors: colorway(flags),
    yUp: flags['z-up'] !== true,
  });
  return { ...out, name: str(flags.name, name) };
}

/** Render an animation as a deterministic sequence of SVG frames sharing one viewBox. */
export function framesCommand(positional: string[], flags: Flags): Frame[] {
  const { model } = modelFrom(positional, flags);
  const cw = colorway(flags);
  const family = str(flags.family, 'explode') as Family;
  if (!(family in presets)) throw new Error(`unknown family "${family}" (${Object.keys(presets).join(', ')})`);
  const preset = str(flags.preset, presets[family][0]);
  if (!(presets[family] as readonly string[]).includes(preset)) {
    throw new Error(`unknown preset "${preset}" for ${family} (${presets[family].join(', ')})`);
  }
  const choreo = choreography(family, preset, typeof flags.distance === 'string' ? Number(flags.distance) : undefined);
  const count = num(flags.frames, 24);
  const opts = {
    mode: str(flags.mode, 'filled') as RenderMode,
    size: num(flags.size, 60),
    strokeWidth: num(flags['stroke-width'], 5),
    padding: num(flags.padding, 20),
    colors: cw,
    stroke: str(flags.stroke, cw.stroke),
    background: typeof flags.background === 'string' ? flags.background : undefined,
  };
  return sequence(model, choreo, { ...opts, frames: count, name: `${family}-${preset}` }).frames;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

/** Everything committed under assets/generated. */
export function generateAll(): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const push = (path: string, content: string) => files.push({ path, content });

  for (const [cwName, cw] of Object.entries(colorways)) {
    for (const mode of ['filled', 'outline', 'wireframe'] as RenderMode[]) {
      if (mode !== 'filled' && cwName !== 'light') continue;
      const suffix = mode === 'filled' ? cwName : mode;
      push(`svg/mark-${suffix}.svg`, renderSvg(MARK, { mode, colors: cw, stroke: cw.stroke }).svg);
    }
  }

  for (const p of ISO_PLANES) {
    push(`svg/planes/mark-${p}.svg`, renderSvg(gridToVoxels(MARK_GRID, p), { colors: colorways.light }).svg);
  }

  for (const ch of supportedChars()) {
    if (ch === ' ') continue;
    const safe = /^[A-Z0-9]$/.test(ch) ? ch : `u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`;
    push(`svg/alphabet/${safe}.svg`, renderSvg(textToVoxels(ch), { size: 40, strokeWidth: 4, padding: 8 }).svg);
  }

  const mark = exportObj(MARK, 'constructive-mark', { colors: colorways.solid });
  push('obj/constructive-mark.obj', mark.obj);
  push('obj/constructive-mark.mtl', mark.mtl);
  const word = exportObj(textToVoxels('CONSTRUCTIVE'), 'constructive-wordmark-cubes', { colors: colorways.solid });
  push('obj/constructive-wordmark-cubes.obj', word.obj);
  push('obj/constructive-wordmark-cubes.mtl', word.mtl);

  // Per motion family: stills at t=0 and t=0.5 plus a self-contained SMIL animation.
  for (const family of Object.keys(presets) as Family[]) {
    const preset = presets[family][0];
    const choreo = choreography(family, preset);
    const opts = { size: 60, strokeWidth: 5, colors: colorways.light };
    const { frames } = sequence(MARK, choreo, { ...opts, frames: 3 });
    push(`svg/motion/${family}-${preset}-t00.svg`, frames[0].svg);
    push(`svg/motion/${family}-${preset}-t05.svg`, frames[1].svg);
    push(`svg/motion/${family}-${preset}.anim.svg`, animatedSvg(MARK, choreo, { ...opts, frames: 24, duration: 2.5, playback: 'bounce' }));
  }

  return files;
}

const HELP = `brand-kit — Constructive brand geometry tools

  brand-kit svg  [mark | text <str> | grid <rows>] [--mode filled|outline|wireframe]
                 [--colorway light|dark|mono|solid] [--plane Yz] [--size 120]
                 [--stroke-width 10] [--padding 20] [--background #fff] [--out file.svg]
  brand-kit obj  [mark | text <str> | grid <rows>] [--colorway solid] [--plane Yz]
                 [--size 1] [--z-up] [--out dir]
  brand-kit frames [mark | text <str> | grid <rows>] --family explode|assemble|converge|orbit|tetris
                 [--preset <name>] [--frames 24] [--distance 3] [--colorway light] [--out dir]
  brand-kit generate [--out assets/generated]

Motion presets:
${(Object.keys(presets) as Family[]).map((f) => `  ${f.padEnd(9)} ${presets[f].join(', ')}`).join('\n')}

Grid rows are strings of 1/0, joined by "/": 011/100/100/011 is the mark.
`;

export function run(argv: string[], log: (s: string) => void = console.log): number {
  const { command, positional, flags } = parseArgs(argv);
  switch (command) {
  case 'svg': {
    const svg = svgCommand(positional, flags);
    if (typeof flags.out === 'string') writeFileSync(flags.out, svg);
    else log(svg);
    return 0;
  }
  case 'obj': {
    const { obj, mtl, name } = objCommand(positional, flags);
    const dir = str(flags.out, '.');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${name}.obj`), obj);
    writeFileSync(join(dir, `${name}.mtl`), mtl);
    log(`wrote ${join(dir, name)}.{obj,mtl}`);
    return 0;
  }
  case 'frames': {
    const frames = framesCommand(positional, flags);
    const dir = str(flags.out, 'frames');
    mkdirSync(dir, { recursive: true });
    for (const f of frames) writeFileSync(join(dir, f.name), f.svg);
    log(`wrote ${frames.length} frames to ${dir}`);
    return 0;
  }
  case 'generate': {
    const dir = str(flags.out, 'assets/generated');
    const files = generateAll();
    for (const f of files) {
      const full = join(dir, f.path);
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, f.content);
    }
    log(`wrote ${files.length} files to ${dir}`);
    return 0;
  }
  case 'help':
  case '--help':
  case '-h':
    log(HELP);
    return 0;
  default:
    log(`unknown command "${command}"\n\n${HELP}`);
    return 1;
  }
}
