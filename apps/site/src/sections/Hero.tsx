import { colorways } from '@constructive-io/brand-geometry';
import { exportMark, MARK, renderMark } from '@constructive-io/brand-logo';
import { useRef, useState } from 'react';

import { Seg } from '../components/Seg';
import { download } from '../components/util';
import { zip } from '../components/zip';
import { MarkCanvas, MarkCanvasHandle } from '../three/MarkCanvas';

type Colorway = keyof typeof colorways;

export function Hero({ theme }: { theme: 'light' | 'dark' }) {
  const [colorway, setColorway] = useState<Colorway>(theme);
  const [camera, setCamera] = useState<'iso' | 'free'>('iso');
  const [explode, setExplode] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const ref = useRef<MarkCanvasHandle>(null);

  return (
    <section className="section hero" id="top">
      <div>
        <div className="eyebrow">Constructive brand kit</div>
        <h1>
          Constructed,
          <br />
          not drawn.
        </h1>
        <p className="lede">
          The Constructive mark is a C built from six unit cubes and projected isometrically. Every asset in this kit — SVG,
          OBJ, this WebGL render — is generated from that one description.
        </p>
        <div className="hero-actions">
          <a className="btn primary" href="#derivation">
            See the derivation
          </a>
          <button className="btn" onClick={() => download('constructive-mark.svg', renderMark({ colors: colorways[colorway] }).svg, 'image/svg+xml')}>
            Download SVG
          </button>
          <button
            className="btn"
            onClick={() => {
              const { obj, mtl } = exportMark({ colors: colorways[colorway] });
              download(
                'constructive-mark-obj.zip',
                zip([
                  { name: 'constructive-mark.obj', content: obj },
                  { name: 'constructive-mark.mtl', content: mtl },
                ]),
              );
            }}
          >
            Download OBJ + MTL (.zip)
          </button>
        </div>
      </div>
      <div>
        <div className="hero-canvas">
          <MarkCanvas
            ref={ref}
            model={MARK}
            style={colorways[colorway]}
            explode={explode}
            wireframe={wireframe}
            autoRotate={autoRotate}
            camera={camera}
          />
        </div>
        <div className="controls">
          <Seg value={colorway} options={Object.keys(colorways) as Colorway[]} onChange={setColorway} />
          <Seg value={camera} options={['iso', 'free']} onChange={(v) => setCamera(v)} />
          <label>
            explode
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
          </label>
          <label>
            <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} /> wireframe
          </label>
          <label>
            <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} /> rotate
          </label>
          {camera === 'free' && (
            <button className="btn small" onClick={() => ref.current?.resetView()}>
              reset to iso
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
