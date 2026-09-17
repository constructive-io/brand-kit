import { exportObj } from '@constructive-io/brand-3d';
import { filterToSupported, textToVoxels } from '@constructive-io/brand-font';
import { colorways } from '@constructive-io/brand-geometry';
import { RenderMode,renderSvg } from '@constructive-io/brand-svg';
import { useMemo, useState } from 'react';

import { Seg } from '../components/Seg';
import { Svg } from '../components/Svg';
import { download } from '../components/util';
import { zip } from '../components/zip';
import { MarkCanvas } from '../three/MarkCanvas';

type Colorway = keyof typeof colorways;

export function Playground({ theme }: { theme: 'light' | 'dark' }) {
  const [text, setText] = useState('BUILD');
  const [colorway, setColorway] = useState<Colorway>(theme);
  const [mode, setMode] = useState<RenderMode>('filled');
  const [spacing, setSpacing] = useState(1);
  const [explode, setExplode] = useState(0);

  const clean = filterToSupported(text.toUpperCase()) || 'C';
  const model = useMemo(() => textToVoxels(clean, { letterSpacing: spacing }), [clean, spacing]);
  const cw = colorways[colorway];
  const svg = useMemo(() => renderSvg(model, { mode, colors: cw, stroke: cw.stroke, size: 40, strokeWidth: 4, padding: 12 }), [model, mode, cw]);
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cubes';

  return (
    <section className="section" id="playground">
      <div className="eyebrow">Playground</div>
      <h2>Cube type</h2>
      <p className="lede">
        The same pipeline renders a five-row cube alphabet. Type anything; export it as SVG or as an OBJ (one closed cube per voxel) for
        print, motion, or signage.
      </p>
      <div className="grid-2" style={{ marginTop: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <input type="text" value={text} maxLength={16} onChange={(e) => setText(e.target.value)} aria-label="text to render" />
          <div className="controls">
            <Seg value={colorway} options={Object.keys(colorways) as Colorway[]} onChange={setColorway} />
            <Seg value={mode} options={['filled', 'outline', 'wireframe'] as const} onChange={setMode} />
            <label>
              spacing
              <input type="range" min={0} max={3} step={1} value={spacing} onChange={(e) => setSpacing(Number(e.target.value))} />
            </label>
            <label>
              explode
              <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
            </label>
          </div>
          <div className="dl-row">
            <button className="btn primary small" onClick={() => download(`${slug}.svg`, svg.svg, 'image/svg+xml')}>
              Download SVG
            </button>
            <button
              className="btn small"
              onClick={() => {
                const { obj, mtl } = exportObj(model, slug, { colors: cw });
                download(
                  `${slug}-obj.zip`,
                  zip([
                    { name: `${slug}.obj`, content: obj },
                    { name: `${slug}.mtl`, content: mtl },
                  ]),
                );
              }}
            >
              Download OBJ + MTL (.zip)
            </button>
          </div>
          <div className="math" style={{ fontSize: '0.75rem' }}>{`textToVoxels('${clean}', { letterSpacing: ${spacing} })
→ ${model.voxels.length} cubes, ${svg.faces.length} visible faces`}</div>
        </div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="panel preview" style={{ minHeight: 200 }}>
            <Svg markup={svg.svg} />
          </div>
          <div className="hero-canvas" style={{ aspectRatio: '16 / 9' }}>
            <MarkCanvas model={model} style={cw} explode={explode} wireframe={mode === 'wireframe'} autoRotate={false} camera="free" />
          </div>
        </div>
      </div>
    </section>
  );
}
