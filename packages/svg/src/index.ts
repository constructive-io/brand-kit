import {
  colorways,
  depth,
  exposedFaces,
  FACE_LABEL,
  FACE_NORMALS,
  FaceColors,
  faceCorners,
  FaceId,
  isVisibleFace,
  project,
  Vec2,
  Vec3,
  VoxelModel,
} from '@constructive-io/brand-geometry';

export type RenderMode =
  /** Visible faces filled per colorway, stroked edges. */
  | 'filled'
  /** Visible faces, no fill — the hidden-line drawing. */
  | 'outline'
  /** Every exposed face as a stroke — see-through construction lines. */
  | 'wireframe';

export interface RenderOptions {
  mode?: RenderMode;
  /** Edge length in px. */
  size?: number;
  padding?: number;
  colors?: Partial<FaceColors>;
  stroke?: string;
  strokeWidth?: number;
  strokeLinejoin?: 'round' | 'miter' | 'bevel';
  /** Wireframe/outline opacity of edges hidden behind the solid. */
  hiddenOpacity?: number;
  background?: string;
  /** Emit `data-face` / `data-voxel` attributes for scripting. */
  annotate?: boolean;
  /** Fixed decimal places in path data. */
  precision?: number;
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RenderedFace {
  voxel: { x: number; y: number; z: number };
  face: FaceId;
  points: Vec2[];
  fill: string;
  depth: number;
}

export interface RenderResult {
  svg: string;
  viewBox: ViewBox;
  faces: RenderedFace[];
}

const DEFAULTS: Required<Omit<RenderOptions, 'colors' | 'background'>> = {
  mode: 'filled',
  size: 120,
  padding: 20,
  stroke: colorways.light.stroke,
  strokeWidth: 10,
  strokeLinejoin: 'round',
  hiddenOpacity: 0.35,
  annotate: false,
  precision: 3,
};

function fmt(n: number, precision: number): string {
  const s = n.toFixed(precision);
  return s.replace(/\.?0+$/, '') || '0';
}

function pathFor(points: Vec2[], precision: number): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p.x, precision)} ${fmt(p.y, precision)}`).join('') + 'Z';
}

/** Project a voxel model to 2D faces, back-to-front. */
export function projectFaces(model: VoxelModel, opts: RenderOptions = {}): RenderedFace[] {
  const { mode, size } = { ...DEFAULTS, ...opts };
  const colors: FaceColors = { ...colorways.light, ...opts.colors };
  const faces: RenderedFace[] = [];

  for (const { voxel, face } of exposedFaces(model)) {
    if (mode !== 'wireframe' && !isVisibleFace(face)) continue;
    const corners = faceCorners(voxel, face);
    faces.push({
      voxel,
      face,
      points: corners.map((c) => project(c, size)),
      fill: isVisibleFace(face) ? colors[FACE_LABEL[face]] : 'none',
      depth: depth(voxel),
    });
  }

  // Painter's algorithm: farthest first. Within a voxel draw top last so its
  // stroke sits on the silhouette.
  const faceRank: Record<FaceId, number> = { '-x': 0, '-y': 0, '-z': 0, '+y': 1, '+x': 1, '+z': 2 };
  return faces.sort((a, b) => a.depth - b.depth || faceRank[a.face] - faceRank[b.face]);
}

export function viewBoxFor(faces: RenderedFace[], padding: number): ViewBox {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const f of faces) {
    for (const p of f.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!isFinite(minX)) return { x: 0, y: 0, w: padding * 2, h: padding * 2 };
  return { x: minX - padding, y: minY - padding, w: maxX - minX + padding * 2, h: maxY - minY + padding * 2 };
}

/** Render a voxel model to an SVG document string. */
export function renderSvg(model: VoxelModel, opts: RenderOptions = {}): RenderResult {
  const o = { ...DEFAULTS, ...opts };
  const faces = projectFaces(model, opts);
  const vb = viewBoxFor(faces, o.padding + o.strokeWidth / 2);
  const p = o.precision;

  const paths = faces.map((f) => {
    const attrs: string[] = [`d="${pathFor(f.points, p)}"`];
    if (o.mode === 'filled') attrs.push(`fill="${f.fill}"`);
    else attrs.push('fill="none"');
    if (o.mode === 'wireframe' && !isVisibleFace(f.face)) attrs.push(`opacity="${o.hiddenOpacity}"`);
    if (o.annotate) {
      attrs.push(`data-face="${f.face}"`, `data-voxel="${f.voxel.x},${f.voxel.y},${f.voxel.z}"`);
    }
    return `  <path ${attrs.join(' ')}/>`;
  });

  const bg = o.background
    ? `  <rect x="${fmt(vb.x, p)}" y="${fmt(vb.y, p)}" width="${fmt(vb.w, p)}" height="${fmt(vb.h, p)}" fill="${o.background}"/>\n`
    : '';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[vb.x, vb.y, vb.w, vb.h].map((n) => fmt(n, p)).join(' ')}" ` +
    `width="${fmt(vb.w, p)}" height="${fmt(vb.h, p)}">\n` +
    bg +
    `  <g stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linejoin="${o.strokeLinejoin}" stroke-linecap="round">\n` +
    paths.map((l) => '  ' + l).join('\n') +
    '\n  </g>\n</svg>\n';

  return { svg, viewBox: vb, faces };
}


// ---------------------------------------------------------------------------
// animation frames

/** Per-voxel transform for a single frame (structurally the same as brand-motion's VoxelState). */
export interface VoxelTransform {
  offset: Vec3;
  scale: number;
  opacity: number;
  /** Rotation about the vertical axis through the cube center, radians. */
  spin: number;
}

export interface FrameOptions extends RenderOptions {
  /** Fixed viewBox so a sequence of frames does not jitter. Defaults to the frame's own bounds. */
  viewBox?: ViewBox;
}

const isRest = (t: VoxelTransform): boolean => t.offset.x === 0 && t.offset.y === 0 && t.offset.z === 0 && t.scale === 1 && t.spin === 0;

/** Apply a transform to a world point about a cube center. */
function transformPoint(p: Vec3, c: Vec3, t: VoxelTransform): Vec3 {
  const rx = (p.x - c.x) * t.scale;
  const ry = (p.y - c.y) * t.scale;
  const rz = (p.z - c.z) * t.scale;
  const cos = Math.cos(t.spin);
  const sin = Math.sin(t.spin);
  return {
    x: c.x + rx * cos - ry * sin + t.offset.x,
    y: c.y + rx * sin + ry * cos + t.offset.y,
    z: c.z + rz + t.offset.z,
  };
}

/**
 * Render one frame of an animation: every voxel displaced by its transform.
 * Faces shared between two cubes are only culled while both cubes are at rest,
 * so pieces reveal their inner faces as they separate.
 */
export function renderFrame(model: VoxelModel, transforms: VoxelTransform[], opts: FrameOptions = {}): RenderResult {
  const o = { ...DEFAULTS, ...opts };
  const colors: FaceColors = { ...colorways.light, ...opts.colors };
  const p = o.precision;
  const key = (v: Vec3) => `${v.x},${v.y},${v.z}`;
  const rest = new Set(model.voxels.map((v, i) => (isRest(transforms[i] ?? AT_REST_T) ? key(v) : '')).filter(Boolean));

  type Frameface = RenderedFace & { opacity: number; index: number };
  const faces: Frameface[] = [];
  model.voxels.forEach((voxel, i) => {
    const t = transforms[i] ?? AT_REST_T;
    const c = { x: voxel.x + 0.5, y: voxel.y + 0.5, z: voxel.z + 0.5 };
    for (const face of ALL_FACES) {
      if (o.mode !== 'wireframe' && !isVisibleFace(face)) continue;
      if (isRest(t)) {
        const n = FACE_NORMALS[face];
        if (rest.has(key({ x: voxel.x + n.x, y: voxel.y + n.y, z: voxel.z + n.z }))) continue;
      }
      const corners = faceCorners(voxel, face).map((q) => transformPoint(q, c, t));
      faces.push({
        voxel,
        face,
        points: corners.map((q) => project(q, o.size)),
        fill: isVisibleFace(face) ? colors[FACE_LABEL[face]] : 'none',
        depth: depth(transformPoint(c, c, t)),
        opacity: t.opacity,
        index: i,
      });
    }
  });
  const faceRank: Record<FaceId, number> = { '-x': 0, '-y': 0, '-z': 0, '+y': 1, '+x': 1, '+z': 2 };
  faces.sort((a, b) => a.depth - b.depth || faceRank[a.face] - faceRank[b.face]);

  const vb = opts.viewBox ?? viewBoxFor(faces, o.padding + o.strokeWidth / 2);
  const paths = faces.map((f) => {
    const attrs: string[] = [`d="${pathFor(f.points, p)}"`, `fill="${o.mode === 'filled' ? f.fill : 'none'}"`];
    if (f.opacity < 1) attrs.push(`opacity="${fmt(f.opacity, 3)}"`);
    if (o.annotate) attrs.push(`data-face="${f.face}"`, `data-voxel="${f.index}"`);
    return `  <path ${attrs.join(' ')}/>`;
  });
  const bg = o.background
    ? `  <rect x="${fmt(vb.x, p)}" y="${fmt(vb.y, p)}" width="${fmt(vb.w, p)}" height="${fmt(vb.h, p)}" fill="${o.background}"/>\n`
    : '';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[vb.x, vb.y, vb.w, vb.h].map((n) => fmt(n, p)).join(' ')}" ` +
    `width="${fmt(vb.w, p)}" height="${fmt(vb.h, p)}">\n` +
    bg +
    `  <g stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linejoin="${o.strokeLinejoin}" stroke-linecap="round">\n` +
    paths.map((l) => '  ' + l).join('\n') +
    '\n  </g>\n</svg>\n';
  return { svg, viewBox: vb, faces };
}

const AT_REST_T: VoxelTransform = { offset: { x: 0, y: 0, z: 0 }, scale: 1, opacity: 1, spin: 0 };
const ALL_FACES: readonly FaceId[] = ['-x', '-y', '-z', '+y', '+x', '+z'];

/** ViewBox that contains a whole world-space box, for fixed-frame sequences. */
export function viewBoxForBounds(b: { min: Vec3; max: Vec3 }, opts: RenderOptions = {}): ViewBox {
  const o = { ...DEFAULTS, ...opts };
  const pts: Vec2[] = [];
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(project({ x, y, z }, o.size));
  return viewBoxFor([{ voxel: { x: 0, y: 0, z: 0 }, face: '+z', points: pts, fill: 'none', depth: 0 }], o.padding + o.strokeWidth / 2);
}
