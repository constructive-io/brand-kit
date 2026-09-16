import { filterToSupported, textToVoxels } from '@constructive-io/brand-font';
import { colorways } from '@constructive-io/brand-geometry';
import { MARK } from '@constructive-io/brand-logo';
import { choreography, Family, motionBounds, PlaybackMode, presets, Timeline } from '@constructive-io/brand-motion';
import { animatedSvg, sequence } from '@constructive-io/brand-motion-2d';
import { renderFrame, viewBoxForBounds } from '@constructive-io/brand-svg';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Seg } from '../components/Seg';
import { Svg } from '../components/Svg';
import { download } from '../components/util';
import { MarkCanvas } from '../three/MarkCanvas';

type Colorway = keyof typeof colorways;

const FRAME_OPTS = { size: 50, strokeWidth: 4, padding: 16 };

export function Motion({ theme }: { theme: 'light' | 'dark' }) {
  const [family, setFamily] = useState<Family>('explode');
  const [preset, setPreset] = useState<string>(presets.explode[0]);
  const [subject, setSubject] = useState<'mark' | 'text'>('mark');
  const [text, setText] = useState('BUILD');
  const [colorway, setColorway] = useState<Colorway>(theme);
  const [mode, setMode] = useState<PlaybackMode>('loop');
  const [duration, setDuration] = useState(3);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const timeline = useRef(new Timeline(3));

  const cw = colorways[colorway];
  const model = useMemo(() => (subject === 'mark' ? MARK : textToVoxels(filterToSupported(text.toUpperCase()) || 'C')), [subject, text]);
  const choreo = useMemo(() => choreography(family, preset), [family, preset]);
  const viewBox = useMemo(() => viewBoxForBounds(motionBounds(model, choreo), FRAME_OPTS), [model, choreo]);
  const states = useMemo(() => choreo(model, t), [choreo, model, t]);
  const frame = useMemo(() => renderFrame(model, states, { ...FRAME_OPTS, colors: cw, stroke: cw.stroke, viewBox }).svg, [model, states, cw, viewBox]);

  useEffect(() => {
    const tl = timeline.current;
    tl.duration = duration;
    tl.mode = mode;
    if (playing) tl.play();
    else tl.pause();
  }, [duration, mode, playing]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const tl = timeline.current;
      const p = tl.tick(now);
      setT(p);
      if (!tl.playing && playing) setPlaying(false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const pick = (f: Family) => {
    setFamily(f);
    setPreset(presets[f][0]);
    timeline.current.restart();
    setPlaying(true);
  };

  const renderOpts = { ...FRAME_OPTS, colors: cw, stroke: cw.stroke };
  const exportFrames = () => {
    for (const f of sequence(model, choreo, { ...renderOpts, viewBox, frames: 24, name: `${family}-${preset}` }).frames) {
      download(f.name, f.svg, 'image/svg+xml');
    }
  };
  const exportAnimated = () =>
    download(
      `${family}-${preset}.anim.svg`,
      animatedSvg(model, choreo, { ...renderOpts, viewBox, frames: 24, duration, playback: mode === 'bounce' ? 'bounce' : 'loop' }),
      'image/svg+xml',
    );

  return (
    <section className="section" id="motion">
      <div className="eyebrow">Motion</div>
      <h2>One choreography, two renderers</h2>
      <p className="lede">
        <code>@constructive-io/brand-motion</code> describes movement in cube units: each preset maps time to an offset,
        scale, opacity and spin per cube. <code>brand-motion-2d</code> turns that into SVG frames, animated SVG and sprite
        sheets; <code>brand-motion-3d</code> plays it in three.js. Left and right are the same state, so what you export
        is exactly what plays in 3D.
      </p>
      <div className="grid-2" style={{ marginTop: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="controls">
            <Seg value={family} options={Object.keys(presets) as Family[]} onChange={pick} />
            <Seg
              value={preset}
              options={presets[family] as readonly string[]}
              onChange={(p) => {
                setPreset(p);
                timeline.current.restart();
                setPlaying(true);
              }}
            />
          </div>
          <div className="controls">
            <Seg value={subject} options={['mark', 'text'] as const} onChange={setSubject} />
            {subject === 'text' && (
              <input type="text" value={text} maxLength={10} onChange={(e) => setText(e.target.value)} aria-label="text to animate" />
            )}
            <Seg value={colorway} options={Object.keys(colorways) as Colorway[]} onChange={setColorway} />
          </div>
          <div className="controls">
            <button className="btn small" onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              className="btn small"
              onClick={() => {
                timeline.current.restart();
                setPlaying(true);
              }}
            >
              Restart
            </button>
            <Seg value={mode} options={['once', 'loop', 'bounce'] as const} onChange={setMode} />
            <label>
              {duration.toFixed(1)}s
              <input type="range" min={1} max={8} step={0.5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </label>
          </div>
          <label className="timeline">
            t = {t.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={t}
              onChange={(e) => {
                setPlaying(false);
                timeline.current.seek(Number(e.target.value));
                setT(Number(e.target.value));
              }}
            />
          </label>
          <div className="dl-row">
            <button className="btn primary small" onClick={exportAnimated}>
              Download animated SVG
            </button>
            <button className="btn small" onClick={exportFrames}>
              Export 24 SVG frames
            </button>
            <button className="btn small" onClick={() => download(`${family}-${preset}-t${t.toFixed(2)}.svg`, frame, 'image/svg+xml')}>
              Download this frame
            </button>
          </div>
          <div className="math" style={{ fontSize: '0.75rem' }}>{`choreography('${family}', '${preset}')(model, ${t.toFixed(2)})
→ ${states.length} states · brand-kit frames ${subject === 'mark' ? 'mark' : `text ${text}`} --family ${family} --preset ${preset}`}</div>
        </div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="panel preview" style={{ minHeight: 220 }}>
            <Svg markup={frame} />
          </div>
          <div className="hero-canvas" style={{ aspectRatio: '16 / 9' }}>
            <MarkCanvas model={model} states={states} style={cw} explode={0} wireframe={false} autoRotate={false} camera="free" />
          </div>
        </div>
      </div>
    </section>
  );
}
