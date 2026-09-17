import { filterToSupported, textToVoxels } from '@constructive-io/brand-font';
import { colorways, VoxelModel } from '@constructive-io/brand-geometry';
import { MARK } from '@constructive-io/brand-logo';
import { Choreography, choreography, Family, motionBounds, presets, Reel, reels, Timeline } from '@constructive-io/brand-motion';
import { animatedSvg } from '@constructive-io/brand-motion-2d';
import { CameraPathName, cameraPaths } from '@constructive-io/brand-motion-3d';
import { renderFrame, viewBoxForBounds } from '@constructive-io/brand-svg';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Seg } from '../components/Seg';
import { Svg } from '../components/Svg';
import { download } from '../components/util';
import { MarkCanvas } from '../three/MarkCanvas';

type Colorway = keyof typeof colorways;

const TILE_OPTS = { size: 28, strokeWidth: 2.5, padding: 10 };
const STAGE_OPTS = { size: 44, strokeWidth: 3.5, padding: 20 };

interface Piece {
  id: string;
  label: string;
  choreo: Choreography;
  camera: CameraPathName;
  duration: number;
  subject: 'mark' | 'text';
}

const REEL_CAMERA: Record<Reel, CameraPathName> = {
  'build-breathe-scatter': 'sweep',
  'orbit-in-out': 'orbit',
  'print-wave': 'plan-to-iso',
  'typewriter-hold': 'dolly',
  pulse: 'drift',
};

const pieces: Piece[] = [
  ...(Object.keys(reels) as Reel[]).map((r) => ({
    id: `reel:${r}`,
    label: r,
    choreo: reels[r],
    camera: REEL_CAMERA[r],
    duration: r === 'pulse' ? 4 : 9,
    subject: (r === 'typewriter-hold' ? 'text' : 'mark') as Piece['subject'],
  })),
  ...(Object.keys(presets) as Family[]).flatMap((f) =>
    (presets[f] as readonly string[]).map((p) => ({
      id: `${f}:${p}`,
      label: `${f} · ${p}`,
      choreo: choreography(f, p),
      camera: 'iso' as CameraPathName,
      duration: 3,
      subject: 'mark' as Piece['subject'],
    })),
  ),
];

/** One shared clock for the whole gallery so tiles stay in phase; `fps` caps React updates. */
function useClock(duration: number, playing: boolean, fps = 60): number {
  const [t, setT] = useState(0);
  const tl = useRef(new Timeline(duration));
  const lastT = useRef(-1);
  useEffect(() => {
    tl.current.duration = duration;
  }, [duration]);
  useEffect(() => {
    const clock = tl.current;
    clock.mode = 'loop';
    if (playing) clock.play();
    else clock.pause();
    let raf = 0;
    const step = 1 / (fps * clock.duration);
    const loop = (now: number) => {
      const p = clock.tick(now);
      if (Math.abs(p - lastT.current) >= step || p < lastT.current) {
        lastT.current = p;
        setT(p);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, fps]);
  return t;
}

function Tile({ piece, model, t, cw, active, onPick }: { piece: Piece; model: VoxelModel; t: number; cw: (typeof colorways)[Colorway]; active: boolean; onPick: () => void }) {
  const viewBox = useMemo(() => viewBoxForBounds(motionBounds(model, piece.choreo), TILE_OPTS), [model, piece]);
  const svg = renderFrame(model, piece.choreo(model, t), { ...TILE_OPTS, colors: cw, stroke: cw.stroke, viewBox }).svg;
  return (
    <button className={`reel-tile${active ? ' on' : ''}`} onClick={onPick} aria-pressed={active} title={`Play ${piece.label} on the stage`}>
      <Svg markup={svg} className="reel-tile-img" />
      <span className="reel-tile-label">{piece.label}</span>
    </button>
  );
}

export function Showreel({ theme }: { theme: 'light' | 'dark' }) {
  const [pieceId, setPieceId] = useState(pieces[0].id);
  const [colorway, setColorway] = useState<Colorway>(theme);
  const [text, setText] = useState('CONSTRUCTIVE');
  const [cameraOverride, setCameraOverride] = useState<CameraPathName | 'auto'>('auto');
  const [playing, setPlaying] = useState(true);
  const [view, setView] = useState<'3d' | '2d' | 'both'>('both');

  const piece = pieces.find((p) => p.id === pieceId) ?? pieces[0];
  const cw = colorways[colorway];
  const camera = cameraOverride === 'auto' ? piece.camera : cameraOverride;

  const textModel = useMemo(() => textToVoxels(filterToSupported(text.toUpperCase()) || 'C'), [text]);
  const model = piece.subject === 'text' ? textModel : MARK;

  const t = useClock(piece.duration, playing);
  const tileT = useClock(3, playing, 20);

  const states = useMemo(() => piece.choreo(model, t), [piece, model, t]);
  const viewBox = useMemo(() => viewBoxForBounds(motionBounds(model, piece.choreo, 48), STAGE_OPTS), [model, piece]);
  const frame = useMemo(
    () => renderFrame(model, states, { ...STAGE_OPTS, colors: cw, stroke: cw.stroke, viewBox }).svg,
    [model, states, cw, viewBox],
  );

  const exportAnimated = () =>
    download(
      `${piece.id.replace(':', '-')}.anim.svg`,
      animatedSvg(model, piece.choreo, { ...STAGE_OPTS, colors: cw, stroke: cw.stroke, viewBox, frames: 48, duration: piece.duration, playback: 'loop' }),
      'image/svg+xml',
    );

  return (
    <section className="section" id="showreel">
      <div className="eyebrow">Showreel</div>
      <h2>Reels, camera paths, and every preset</h2>
      <p className="lede">
        Reels chain families into multi-act sequences (<code>chain</code>, <code>mirror</code>, <code>reverse</code>,{' '}
        <code>layer</code>) that start and end at rest so they loop cleanly. In 3D a <em>camera path</em> runs on the
        same clock — orbit, sweep, dolly — while the 2D export stays locked to the isometric view. Click any tile to
        put it on the stage.
      </p>

      <div className="reel-stage-wrap">
        <div className="controls" style={{ marginBottom: '1rem' }}>
          <Seg value={view} options={['both', '3d', '2d'] as const} onChange={setView} />
          <Seg value={colorway} options={Object.keys(colorways) as Colorway[]} onChange={setColorway} />
          <Seg
            value={cameraOverride}
            options={['auto', ...(Object.keys(cameraPaths) as CameraPathName[])]}
            onChange={setCameraOverride}
          />
          <button className="btn small" onClick={() => setPlaying((p) => !p)}>
            {playing ? 'Pause' : 'Play'}
          </button>
          {piece.subject === 'text' && (
            <input type="text" value={text} maxLength={14} onChange={(e) => setText(e.target.value)} aria-label="text to animate" />
          )}
        </div>
        <div className={`reel-stage ${view}`}>
          {view !== '2d' && (
            <div className="hero-canvas reel-3d">
              <MarkCanvas
                model={model}
                states={states}
                t={t}
                style={cw}
                explode={0}
                wireframe={false}
                autoRotate={false}
                camera="path"
                cameraPath={cameraPaths[camera]}
              />
              <div className="reel-badge">
                3D · camera <code>{camera}</code>
              </div>
            </div>
          )}
          {view !== '3d' && (
            <div className="panel preview reel-2d">
              <Svg markup={frame} />
              <div className="reel-badge">2D · iso</div>
            </div>
          )}
        </div>
        <div className="reel-meta">
          <div>
            <strong>{piece.label}</strong>
            <span style={{ color: 'var(--muted)' }}>
              {' '}
              · {piece.duration}s · t = {t.toFixed(2)} · {model.voxels.length} cubes
            </span>
          </div>
          <button className="btn primary small" onClick={exportAnimated}>
            Download animated SVG
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: '2.5rem' }}>Reels</h3>
      <div className="reel-tiles">
        {pieces
          .filter((p) => p.id.startsWith('reel:'))
          .map((p) => (
            <Tile key={p.id} piece={p} model={p.subject === 'text' ? textModel : MARK} t={t} cw={cw} active={p.id === pieceId} onPick={() => setPieceId(p.id)} />
          ))}
      </div>

      <h3 style={{ marginTop: '2.5rem' }}>Every preset</h3>
      <div className="reel-tiles dense">
        {pieces
          .filter((p) => !p.id.startsWith('reel:'))
          .map((p) => (
            <Tile key={p.id} piece={p} model={MARK} t={tileT} cw={cw} active={p.id === pieceId} onPick={() => setPieceId(p.id)} />
          ))}
      </div>
    </section>
  );
}
