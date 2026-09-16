import {
  colorways,
  Grid,
  gridToVoxels,
  gridToWorld,
  ISO_PLANES,
  IsoPlane,
  project,
} from '@constructive-io/brand-geometry';
import { MARK_GRID, MARK_PLANE } from '@constructive-io/brand-logo';
import { RenderMode,renderSvg } from '@constructive-io/brand-svg';
import { useMemo, useState } from 'react';

import { GridEditor } from '../components/GridEditor';
import { Seg } from '../components/Seg';
import { Svg } from '../components/Svg';
import { MarkCanvas } from '../three/MarkCanvas';

const fmt = (n: number) => (Object.is(n, -0) ? '0' : n.toFixed(3).replace(/\.?0+$/, ''));

export function Derivation({ theme }: { theme: 'light' | 'dark' }) {
  const [grid, setGrid] = useState<Grid>(MARK_GRID);
  const [plane, setPlane] = useState<IsoPlane>(MARK_PLANE);
  const [mode, setMode] = useState<RenderMode>('filled');
  const [annotate, setAnnotate] = useState(false);
  const cw = colorways[theme];

  const model = useMemo(() => gridToVoxels(grid, plane), [grid, plane]);
  const svg = useMemo(() => renderSvg(model, { mode, colors: cw, stroke: cw.stroke, annotate }), [model, mode, cw, annotate]);
  const sample = gridToWorld(0, 1, plane);
  const p = project(sample);

  return (
    <section className="section" id="derivation">
      <div className="eyebrow">Derivation</div>
      <h2>Grid → cubes → projection</h2>
      <p className="lede">
        The mark is a 4×3 boolean grid. Each filled cell becomes a unit cube in 3D; the cubes are projected onto the page
        along the (1,1,1) diagonal. Change the grid or the plane and everything downstream updates.
      </p>

      <div className="derive-layout">
        <div className="steps">
          <div className="step">
            <div>
              <h3>Grid</h3>
              <p>
                <code>MARK_GRID</code> — a C. Click cells to edit. Rows run top-to-bottom, columns left-to-right.
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <GridEditor grid={grid} onChange={setGrid} />
                <button className="btn small" onClick={() => setGrid(MARK_GRID)}>
                  reset
                </button>
              </div>
            </div>
          </div>

          <div className="step">
            <div>
              <h3>Lift into 3D</h3>
              <p>
                A plane maps <code>(row, col)</code> to <code>(x, y, z)</code>. The canonical mark uses <code>Yz</code>: columns
                run along −y, rows run down −z, so the C stands upright on a wall facing the camera.
              </p>
              <div className="controls">
                <Seg value={plane} options={ISO_PLANES} onChange={setPlane} />
              </div>
              <div className="math">{`gridToWorld(row=0, col=1, '${plane}') = (${fmt(sample.x)}, ${fmt(sample.y)}, ${fmt(sample.z)})`}</div>
            </div>
          </div>

          <div className="step">
            <div>
              <h3>Project isometrically</h3>
              <p>
                True isometric: the three axes meet the page at 120° and share one scale. The projection is linear, so a
                cube's eight corners map to at most six visible points.
              </p>
              <div className="math">{`cx = (x − y) · √3⁄2 · s
cy = (x + y) · 1⁄2 · s − z · s

depth = x + y + z        (painter's order, back → front)

project(${fmt(sample.x)}, ${fmt(sample.y)}, ${fmt(sample.z)}) = (${fmt(p.x)}, ${fmt(p.y)})`}</div>
            </div>
          </div>

          <div className="step">
            <div>
              <h3>Render</h3>
              <p>
                Faces shared between two cubes are culled. What remains is drawn back-to-front: top, left, right. Only three
                faces of any cube can ever face the camera, so three fills describe the whole mark.
              </p>
              <div className="controls">
                <Seg value={mode} options={['filled', 'outline', 'wireframe'] as const} onChange={setMode} />
                <label>
                  <input type="checkbox" checked={annotate} onChange={(e) => setAnnotate(e.target.checked)} /> data-attributes
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="derive-preview">
          <div className="panel preview">
            <Svg markup={svg.svg} />
          </div>
          <div className="hero-canvas" style={{ aspectRatio: '16 / 10' }}>
            <MarkCanvas model={model} style={cw} explode={0} wireframe={mode === 'wireframe'} autoRotate camera="iso" />
          </div>
          <div className="math" style={{ fontSize: '0.75rem' }}>
            {`${model.voxels.length} cubes · ${svg.faces.length} faces drawn · viewBox ${svg.viewBox.w}×${svg.viewBox.h}`}
          </div>
        </div>
      </div>
    </section>
  );
}
