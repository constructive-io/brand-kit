import { VoxelModel } from '@constructive-io/brand-geometry';
import { Choreography, motionBounds } from '@constructive-io/brand-motion';
import { renderFrame, RenderOptions, ViewBox, viewBoxForBounds } from '@constructive-io/brand-svg';

export interface SequenceOptions extends RenderOptions {
  /** Number of frames, inclusive of t = 0 and t = 1. */
  frames?: number;
  /** Zero-padded basename prefix, e.g. "explode-radial". */
  name?: string;
  /** Override the shared viewBox (defaults to the choreography's motion bounds). */
  viewBox?: ViewBox;
}

export interface Frame {
  index: number;
  t: number;
  name: string;
  svg: string;
}

export interface Sequence {
  viewBox: ViewBox;
  frames: Frame[];
}

/** Sample a choreography at evenly spaced t values into SVG frames sharing one viewBox. */
export function sequence(model: VoxelModel, choreo: Choreography, opts: SequenceOptions = {}): Sequence {
  const { frames: count = 24, name = 'frame', viewBox: vb, ...render } = opts;
  const viewBox = vb ?? viewBoxForBounds(motionBounds(model, choreo), render);
  const frames: Frame[] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 1 : i / (count - 1);
    frames.push({
      index: i,
      t,
      name: `${name}-${String(i).padStart(3, '0')}.svg`,
      svg: renderFrame(model, choreo(model, t), { ...render, viewBox }).svg,
    });
  }
  return { viewBox, frames };
}

export interface AnimatedSvgOptions extends SequenceOptions {
  /** Seconds for one pass through t ∈ [0, 1]. */
  duration?: number;
  /** `loop` restarts, `bounce` plays forward then backward. */
  playback?: 'loop' | 'bounce';
}

const num = (n: number): string => (Math.round(n * 1000) / 1000).toString();

/**
 * A single self-contained SVG that plays the choreography with SMIL, by
 * toggling frame groups' visibility. No scripting, works in any browser and
 * most design tools; every frame is still the deterministic renderFrame output.
 */
export function animatedSvg(model: VoxelModel, choreo: Choreography, opts: AnimatedSvgOptions = {}): string {
  const { duration = 2, playback = 'loop', ...seq } = opts;
  const { viewBox, frames } = sequence(model, choreo, seq);
  const order = playback === 'bounce' ? [...frames, ...frames.slice(1, -1).reverse()] : frames;
  const n = order.length;
  const total = playback === 'bounce' ? duration * 2 : duration;
  const body = order
    .map((f, i) => {
      const inner = f.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      const values = order.map((_, j) => (j === i ? 'visible' : 'hidden')).join(';');
      const keyTimes = order.map((_, j) => num(j / n)).join(';');
      return `<g visibility="hidden">${inner}<animate attributeName="visibility" values="${values}" keyTimes="${keyTimes}" dur="${num(total)}s" calcMode="discrete" repeatCount="indefinite"/></g>`;
    })
    .join('\n');
  const vb = `${num(viewBox.x)} ${num(viewBox.y)} ${num(viewBox.w)} ${num(viewBox.h)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${num(viewBox.w)}" height="${num(viewBox.h)}">\n${body}\n</svg>\n`;
}

export interface SpriteSheetOptions extends SequenceOptions {
  /** Frames per row (defaults to a near-square layout). */
  columns?: number;
}

export interface SpriteSheet {
  svg: string;
  columns: number;
  rows: number;
  cell: { width: number; height: number };
}

/** All frames tiled on one SVG canvas, for CSS `steps()` animation or texture atlases. */
export function spriteSheet(model: VoxelModel, choreo: Choreography, opts: SpriteSheetOptions = {}): SpriteSheet {
  const { columns: cols, ...seq } = opts;
  const { viewBox, frames } = sequence(model, choreo, seq);
  const columns = cols ?? Math.ceil(Math.sqrt(frames.length));
  const rows = Math.ceil(frames.length / columns);
  const cell = { width: viewBox.w, height: viewBox.h };
  const tiles = frames
    .map((f, i) => {
      const inner = f.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      const tx = (i % columns) * cell.width - viewBox.x;
      const ty = Math.floor(i / columns) * cell.height - viewBox.y;
      return `<g transform="translate(${num(tx)} ${num(ty)})">${inner}</g>`;
    })
    .join('\n');
  const w = columns * cell.width;
  const h = rows * cell.height;
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(w)} ${num(h)}" width="${num(w)}" height="${num(h)}">\n${tiles}\n</svg>\n`,
    columns,
    rows,
    cell,
  };
}
