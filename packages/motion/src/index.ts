import { bounds, center, Vec3, Voxel, VoxelModel } from '@constructive-io/brand-geometry';

/**
 * Motion is described in the brand's world frame (unit cubes, Z up), never in
 * pixels. A choreography maps (model, t ∈ [0, 1]) to one state per voxel; the
 * SVG renderer and the WebGL scene both consume those states, so a preset looks
 * identical in 2D and 3D.
 */
export interface VoxelState {
  /** World-space displacement from the cube's resting position. */
  offset: Vec3;
  /** Uniform scale about the cube's center. 1 = at rest. */
  scale: number;
  /** 0..1 */
  opacity: number;
  /** Rotation about the vertical (z) axis through the cube's center, radians. */
  spin: number;
}

export type Choreography = (model: VoxelModel, t: number) => VoxelState[];

export const AT_REST: VoxelState = { offset: { x: 0, y: 0, z: 0 }, scale: 1, opacity: 1, spin: 0 };

// ---------------------------------------------------------------------------
// easing

export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
export type Easing = (t: number) => number;

export const easings: Record<EasingName, Easing> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1),
};

export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/** Local progress for a voxel that starts at `delay` (fraction of the whole) and runs to the end. */
export function progressWindow(t: number, delay: number, ease: Easing): number {
  const span = Math.max(1 - delay, 1e-6);
  return ease(clamp01((t - delay) / span));
}

/** Deterministic pseudo-random in [0, 1) so "random" presets render the same frame every time. */
export function hash(...seeds: number[]): number {
  let h = 2166136261;
  for (const s of seeds) {
    h ^= Math.floor(s * 1000) + 0x9e3779b9;
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// ---------------------------------------------------------------------------
// helpers shared by presets

export type Axis = 'x' | 'y' | 'z';

const axisVec = (axis: Axis, sign: number): Vec3 => ({ x: axis === 'x' ? sign : 0, y: axis === 'y' ? sign : 0, z: axis === 'z' ? sign : 0 });
const scaled = (v: Vec3, k: number): Vec3 => ({ x: v.x * k, y: v.y * k, z: v.z * k });

/** Stagger delays so the last voxel still finishes at t = 1. Returns delay per index. */
export function stagger(count: number, spread: number): (i: number) => number {
  return (i) => (count <= 1 ? 0 : (i / (count - 1)) * spread);
}

/** Rank voxels along one axis: 0 for the smallest coordinate, up to n − 1. */
export function rankAlong(model: VoxelModel, axis: Axis, reverse = false): number[] {
  const values = [...new Set(model.voxels.map((v) => v[axis]))].sort((a, b) => (reverse ? b - a : a - b));
  return model.voxels.map((v) => values.indexOf(v[axis]));
}

// ---------------------------------------------------------------------------
// presets

export type ExplodePreset = 'radial' | 'directional' | 'spiral' | 'gravity' | 'scatter';

export interface ExplodeOptions {
  preset?: ExplodePreset;
  /** Distance in cube units at t = 0 (assembles as t → 1). */
  distance?: number;
  easing?: EasingName;
  /** Fraction of the timeline used to stagger start times. */
  spread?: number;
}

/** Cubes fly in from a burst pattern and assemble. */
export function explode({ preset = 'radial', distance = 3, easing = 'easeInOut', spread = 0.2 }: ExplodeOptions = {}): Choreography {
  return (model, t) => {
    const ease = easings[easing];
    const c = center(model);
    const n = model.voxels.length;
    const delay = stagger(n, spread);
    return model.voxels.map((v, i) => {
      let dir: Vec3;
      let scale0 = 1;
      switch (preset) {
      case 'radial': {
        const rel = { x: v.x + 0.5 - c.x, y: v.y + 0.5 - c.y, z: v.z + 0.5 - c.z };
        const len = Math.hypot(rel.x, rel.y, rel.z) || 1;
        dir = scaled(rel, 1 / len);
        scale0 = 0.3;
        break;
      }
      case 'directional':
        dir = { x: 1 + i * 0.15, y: -0.3 + i * 0.1, z: 0.6 - i * 0.15 };
        break;
      case 'spiral': {
        const a = (i / n) * Math.PI * 4;
        const r = 0.6 + i * 0.15;
        dir = { x: Math.cos(a) * r, y: Math.sin(a) * r, z: i * 0.25 };
        scale0 = 0.5;
        break;
      }
      case 'gravity':
        dir = { x: (hash(i, 1) - 0.5) * 0.6, y: (hash(i, 2) - 0.5) * 0.6, z: -1.3 - i * 0.25 };
        break;
      case 'scatter':
        dir = { x: (hash(i, 3) - 0.5) * 2, y: (hash(i, 4) - 0.5) * 2, z: (hash(i, 5) - 0.5) * 2 };
        scale0 = 0.2 + hash(i, 6) * 0.8;
        break;
      }
      const p = progressWindow(t, delay(i), ease);
      const remaining = 1 - p;
      return {
        offset: scaled(dir, distance * remaining),
        scale: scale0 + (1 - scale0) * p,
        opacity: 0.2 + 0.8 * p,
        spin: remaining * Math.PI * 0.6 * (i % 2 === 0 ? 1 : -1),
      };
    });
  };
}

export type AssemblePreset = 'top-down' | 'bottom-up' | 'left-right' | 'right-left' | 'print' | 'typewriter';

export interface AssembleOptions {
  preset?: AssemblePreset;
  distance?: number;
  easing?: EasingName;
  /** 0 = strictly sequential layers, 1 = all at once. */
  overlap?: number;
}

/** Layer-by-layer build: each layer slides in along one axis, in order. */
export function assemble({ preset = 'top-down', distance = 3, easing = 'easeOut', overlap = 0.4 }: AssembleOptions = {}): Choreography {
  return (model, t) => {
    const ease = easings[easing];
    let order: number[];
    let dirFor: (v: Voxel, i: number) => Vec3;
    switch (preset) {
    case 'top-down':
      order = rankAlong(model, 'z', true);
      dirFor = () => axisVec('z', 1);
      break;
    case 'bottom-up':
      order = rankAlong(model, 'z');
      dirFor = () => axisVec('z', -1);
      break;
    case 'left-right':
      order = rankAlong(model, 'y', true);
      dirFor = () => axisVec('y', 1);
      break;
    case 'right-left':
      order = rankAlong(model, 'y');
      dirFor = () => axisVec('x', 1);
      break;
    case 'print': {
      order = rankAlong(model, 'z', true);
      const axes: [Axis, number][] = [
        ['z', 1],
        ['y', 1],
        ['x', 1],
      ];
      dirFor = (_v, i) => {
        const [a, s] = axes[order[i] % axes.length];
        return axisVec(a, s);
      };
      break;
    }
    case 'typewriter': {
      const rows = rankAlong(model, 'z', true);
      const cols = rankAlong(model, 'y', true);
      const width = Math.max(...cols) + 1;
      order = rows.map((r, i) => r * width + cols[i]);
      const ranks = [...new Set(order)].sort((a, b) => a - b);
      order = order.map((o) => ranks.indexOf(o));
      dirFor = (_v, i) => (order[i] % 2 === 0 ? axisVec('y', 1) : axisVec('x', 1));
      break;
    }
    }
    const steps = Math.max(...order) + 1;
    const stepDur = 1 / (steps * (1 - overlap) + overlap);
    const stepOffset = stepDur * (1 - overlap);
    return model.voxels.map((v, i) => {
      const start = order[i] * stepOffset;
      const p = ease(clamp01((t - start) / stepDur));
      return {
        offset: scaled(dirFor(v, i), distance * (1 - p)),
        scale: 1,
        opacity: p,
        spin: 0,
      };
    });
  };
}

export type ConvergePreset = 'converge' | 'stagger' | 'wave' | 'breathe';

export interface ConvergeOptions {
  preset?: ConvergePreset;
  distance?: number;
  easing?: EasingName;
}

/** Each cube slides home along one of the three isometric axes. */
export function converge({ preset = 'converge', distance = 3, easing }: ConvergeOptions = {}): Choreography {
  const ease = easings[easing ?? (preset === 'wave' ? 'elastic' : 'easeInOut')];
  const dist = preset === 'breathe' ? distance * 0.4 : distance;
  const spread = preset === 'converge' ? 0 : preset === 'stagger' ? 0.5 : 0.3;
  return (model, t) => {
    const n = model.voxels.length;
    const delay = stagger(n, spread);
    const axes: [Axis, number][] = [
      ['x', 1],
      ['y', 1],
      ['z', 1],
      ['x', -1],
      ['y', -1],
      ['z', -1],
    ];
    return model.voxels.map((_v, i) => {
      const p = progressWindow(t, delay(i), ease);
      const [a, s] = axes[i % axes.length];
      return { offset: scaled(axisVec(a, s), dist * (1 - p)), scale: 1, opacity: 0.3 + 0.7 * p, spin: 0 };
    });
  };
}

export type OrbitPreset = 'spiral-in' | 'carousel' | 'helix' | 'figure8' | 'vortex';

export interface OrbitOptions {
  preset?: OrbitPreset;
  radius?: number;
  revolutions?: number;
  /** Vertical amplitude in cube units. */
  lift?: number;
  easing?: EasingName;
}

/** Cubes orbit the model's center and settle into place. */
export function orbit({ preset = 'spiral-in', radius = 3, revolutions = 2, lift = 1.5, easing = 'easeInOut' }: OrbitOptions = {}): Choreography {
  return (model, t) => {
    const ease = easings[easing];
    const p = ease(t);
    const shrink = 1 - p;
    const n = model.voxels.length;
    return model.voxels.map((_v, i) => {
      const phase = (i / n) * Math.PI * 2;
      let offset: Vec3;
      switch (preset) {
      case 'spiral-in': {
        const a = phase + p * revolutions * Math.PI * 2;
        const r = radius * shrink;
        offset = { x: Math.cos(a) * r, y: Math.sin(a) * r, z: Math.sin(a * 0.5) * lift * shrink };
        break;
      }
      case 'carousel': {
        const a = phase + p * revolutions * Math.PI * 2;
        const r = radius * shrink;
        offset = { x: Math.cos(a) * r, y: Math.sin(a) * r, z: (i - (n - 1) / 2) * 0.5 * shrink };
        break;
      }
      case 'helix': {
        const a = phase + p * revolutions * Math.PI * 2;
        const r = radius * shrink;
        offset = { x: Math.cos(a) * r, y: Math.sin(a) * r, z: lift * shrink + i * 0.4 * shrink };
        break;
      }
      case 'figure8': {
        const a = phase + p * revolutions * Math.PI * 2;
        const r = radius * shrink;
        offset = { x: Math.sin(a) * r, y: Math.sin(a * 2) * r * 0.5, z: Math.cos(a) * lift * shrink };
        break;
      }
      case 'vortex': {
        const a = phase + p * revolutions * Math.PI * 2 * (1 + i * 0.3);
        const r = radius * Math.sqrt(shrink);
        offset = { x: Math.cos(a) * r, y: Math.sin(a) * r, z: Math.sin(p * Math.PI) * lift * 2 * shrink };
        break;
      }
      }
      return { offset, scale: 1, opacity: 0.4 + 0.6 * p, spin: 0 };
    });
  };
}

export interface Cluster {
  /** Indices into model.voxels that move together as one piece. */
  voxels: number[];
  axis: Axis;
  direction: 1 | -1;
  /** Start time as a fraction of the timeline. */
  delay: number;
  /** Total spin of the piece (radians) while it travels. */
  spin?: number;
}

export type TetrisPreset = 'classic-drop' | 'slide-in' | 'zigzag' | 'rotate-drop' | 'cascade';

export interface TetrisOptions {
  preset?: TetrisPreset;
  /** Explicit clusters override the preset's grouping. */
  clusters?: Cluster[];
  distance?: number;
  easing?: EasingName;
}

/** Group voxels into horizontal layers (same z), top layer first. */
export function layerClusters(model: VoxelModel): number[][] {
  const zs = [...new Set(model.voxels.map((v) => v.z))].sort((a, b) => b - a);
  return zs.map((z) => model.voxels.map((v, i) => (v.z === z ? i : -1)).filter((i) => i >= 0));
}

function tetrisClusters(model: VoxelModel, preset: TetrisPreset): Cluster[] {
  const layers = layerClusters(model);
  const n = layers.length;
  const seq = (i: number) => (n <= 1 ? 0 : (i / n) * 0.6);
  switch (preset) {
  case 'classic-drop':
    return layers.map((voxels, i) => ({ voxels, axis: 'z', direction: 1, delay: seq(i) }));
  case 'slide-in':
    return layers.map((voxels, i) => ({ voxels, axis: i % 2 ? 'y' : 'x', direction: 1, delay: seq(i) }));
  case 'rotate-drop':
    return layers.map((voxels, i) => ({ voxels, axis: 'z', direction: 1, delay: seq(i), spin: Math.PI * (i % 2 ? -1 : 1) }));
  case 'cascade':
    return [...layers].reverse().map((voxels, i) => ({ voxels, axis: i % 2 ? 'x' : 'z', direction: i % 2 ? -1 : 1, delay: seq(i), spin: Math.PI / 2 }));
  case 'zigzag':
    return model.voxels.map((_v, i) => ({ voxels: [i], axis: i % 2 ? 'x' : 'y', direction: i % 4 < 2 ? 1 : -1, delay: (i / model.voxels.length) * 0.75 }));
  }
}

/** Pieces of several cubes drop in like Tetris; each piece may spin about its own centroid. */
export function tetris({ preset = 'classic-drop', clusters, distance = 4, easing = 'easeOut' }: TetrisOptions = {}): Choreography {
  return (model, t) => {
    const ease = easings[easing];
    const states: VoxelState[] = model.voxels.map(() => ({ ...AT_REST }));
    for (const cl of clusters ?? tetrisClusters(model, preset)) {
      const p = progressWindow(t, cl.delay, ease);
      const remaining = 1 - p;
      const offset = scaled(axisVec(cl.axis, cl.direction), distance * remaining);
      // spin about the cluster centroid: rotate each cube's home about it, expressed as extra offset
      const cx = cl.voxels.reduce((s, i) => s + model.voxels[i].x + 0.5, 0) / cl.voxels.length;
      const cy = cl.voxels.reduce((s, i) => s + model.voxels[i].y + 0.5, 0) / cl.voxels.length;
      const ang = (cl.spin ?? 0) * remaining;
      for (const i of cl.voxels) {
        const v = model.voxels[i];
        const rx = v.x + 0.5 - cx;
        const ry = v.y + 0.5 - cy;
        const rot = ang
          ? { x: rx * Math.cos(ang) - ry * Math.sin(ang) - rx, y: rx * Math.sin(ang) + ry * Math.cos(ang) - ry, z: 0 }
          : { x: 0, y: 0, z: 0 };
        states[i] = {
          offset: { x: offset.x + rot.x, y: offset.y + rot.y, z: offset.z },
          scale: 1,
          opacity: 0.3 + 0.7 * p,
          spin: ang,
        };
      }
    }
    return states;
  };
}

/** Every built-in choreography by name, for CLIs and UIs. */
export const presets = {
  explode: ['radial', 'directional', 'spiral', 'gravity', 'scatter'] as const,
  assemble: ['top-down', 'bottom-up', 'left-right', 'right-left', 'print', 'typewriter'] as const,
  converge: ['converge', 'stagger', 'wave', 'breathe'] as const,
  orbit: ['spiral-in', 'carousel', 'helix', 'figure8', 'vortex'] as const,
  tetris: ['classic-drop', 'slide-in', 'zigzag', 'rotate-drop', 'cascade'] as const,
};

export type Family = keyof typeof presets;

export function choreography(family: Family, preset: string, distance?: number): Choreography {
  switch (family) {
  case 'explode':
    return explode({ preset: preset as ExplodePreset, distance });
  case 'assemble':
    return assemble({ preset: preset as AssemblePreset, distance });
  case 'converge':
    return converge({ preset: preset as ConvergePreset, distance });
  case 'orbit':
    return orbit({ preset: preset as OrbitPreset, radius: distance });
  case 'tetris':
    return tetris({ preset: preset as TetrisPreset, distance });
  }
}

// ---------------------------------------------------------------------------
// composition

/** Play a choreography backwards: t=0 at rest, t=1 fully displaced. */
export function reverse(c: Choreography): Choreography {
  return (model, t) => c(model, 1 - t);
}

/** Run to rest in the first half, then un-build in the second. */
export function mirror(c: Choreography): Choreography {
  return (model, t) => c(model, t < 0.5 ? t * 2 : 2 - t * 2);
}

/** Hold a choreography at a fixed time (usually 1 = at rest) for a segment. */
export function hold(c: Choreography, at = 1): Choreography {
  return (model) => c(model, at);
}

export interface ChainStep {
  choreo: Choreography;
  /** Relative length of this step; defaults to 1. */
  weight?: number;
}

/**
 * Concatenate choreographies in time. Each step runs 0→1 over its slice of the
 * whole; steps should therefore start and end at rest (or be `reverse`d) to
 * avoid pops at the seams.
 */
export function chain(steps: ChainStep[]): Choreography {
  const weights = steps.map((s) => s.weight ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  return (model, t) => {
    let acc = 0;
    for (let i = 0; i < steps.length; i++) {
      const w = weights[i] / total;
      const last = i === steps.length - 1;
      if (t < acc + w || last) return steps[i].choreo(model, clamp01((t - acc) / w));
      acc += w;
    }
    return steps[steps.length - 1].choreo(model, 1);
  };
}

/** Add the displacement/spin of `b` on top of `a` (scale and opacity multiply). Good for idle layers. */
export function layer(a: Choreography, b: Choreography): Choreography {
  return (model, t) => {
    const sa = a(model, t);
    const sb = b(model, t);
    return sa.map((s, i) => ({
      offset: { x: s.offset.x + sb[i].offset.x, y: s.offset.y + sb[i].offset.y, z: s.offset.z + sb[i].offset.z },
      scale: s.scale * sb[i].scale,
      opacity: s.opacity * sb[i].opacity,
      spin: s.spin + sb[i].spin,
    }));
  };
}

/**
 * Longer, multi-act sequences built from the families above. Every act is
 * arranged to start and end at rest, so reels loop without a seam. These are
 * what the site's showreel and the README previews play.
 */
export const reels = {
  /** Cubes drop in like tetris, settle, breathe, then scatter away. */
  'build-breathe-scatter': chain([
    { choreo: tetris({ preset: 'cascade' }), weight: 3 },
    { choreo: mirror(reverse(converge({ preset: 'breathe' }))), weight: 2 },
    { choreo: reverse(explode({ preset: 'scatter' })), weight: 2 },
  ]),
  /** Spiral in from orbit, hold, spiral back out. */
  'orbit-in-out': chain([
    { choreo: orbit({ preset: 'spiral-in' }), weight: 3 },
    { choreo: hold(orbit()), weight: 1 },
    { choreo: reverse(orbit({ preset: 'helix' })), weight: 3 },
  ]),
  /** Print layer by layer, wave once, un-print. */
  'print-wave': chain([
    { choreo: assemble({ preset: 'print' }), weight: 3 },
    { choreo: mirror(reverse(converge({ preset: 'wave' }))), weight: 2 },
    { choreo: reverse(assemble({ preset: 'bottom-up' })), weight: 2 },
  ]),
  /** Typewriter assembly for text; a full sentence in cubes. */
  'typewriter-hold': chain([
    { choreo: assemble({ preset: 'typewriter' }), weight: 4 },
    { choreo: mirror(reverse(converge({ preset: 'stagger' }))), weight: 2 },
    { choreo: reverse(explode({ preset: 'gravity' })), weight: 2 },
  ]),
  /** Radial explode and rebuild — the classic loop. */
  pulse: mirror(reverse(explode({ preset: 'radial', distance: 2 }))),
} satisfies Record<string, Choreography>;

export type Reel = keyof typeof reels;

// ---------------------------------------------------------------------------
// timeline

export type PlaybackMode = 'once' | 'loop' | 'bounce';

/** Framework-free clock: feed it wall time, read progress. */
export class Timeline {
  progress = 0;
  playing = false;
  speed = 1;
  mode: PlaybackMode = 'loop';
  private dir = 1;
  private last: number | null = null;

  constructor(public duration = 3) {}

  play(): void {
    this.playing = true;
    this.last = null;
  }

  pause(): void {
    this.playing = false;
  }

  seek(t: number): void {
    this.progress = clamp01(t);
  }

  restart(): void {
    this.progress = 0;
    this.dir = 1;
    this.play();
  }

  /** Advance with a timestamp in ms; returns current progress. */
  tick(now: number): number {
    if (!this.playing) return this.progress;
    if (this.last !== null) {
      const dt = (now - this.last) / 1000;
      this.progress += ((dt * this.speed) / this.duration) * this.dir;
      if (this.progress >= 1) {
        if (this.mode === 'bounce') {
          this.progress = 1;
          this.dir = -1;
        } else if (this.mode === 'loop') this.progress = 0;
        else {
          this.progress = 1;
          this.playing = false;
        }
      } else if (this.progress <= 0 && this.dir < 0) {
        this.progress = 0;
        this.dir = 1;
      }
    }
    this.last = now;
    return this.progress;
  }
}

/** Bounding box of a model with a choreography applied at t, useful for fixed viewBoxes. */
export function motionBounds(model: VoxelModel, choreo: Choreography, samples = 24): { min: Vec3; max: Vec3 } {
  const b = bounds(model);
  const min = { ...b.min };
  const max = { ...b.max };
  for (let s = 0; s <= samples; s++) {
    const states = choreo(model, s / samples);
    model.voxels.forEach((v, i) => {
      const o = states[i].offset;
      min.x = Math.min(min.x, v.x + o.x);
      min.y = Math.min(min.y, v.y + o.y);
      min.z = Math.min(min.z, v.z + o.z);
      max.x = Math.max(max.x, v.x + 1 + o.x);
      max.y = Math.max(max.y, v.y + 1 + o.y);
      max.z = Math.max(max.z, v.z + 1 + o.z);
    });
  }
  return { min, max };
}
