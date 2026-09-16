import { base } from '../components/util';

const official = [
  { file: 'constructive.svg', name: 'Mark', bg: 'var(--panel)' },
  { file: 'constructive-white-bg.svg', name: 'Mark · white', bg: '#fff' },
  { file: 'constructive-brand-color-bg.svg', name: 'Mark · brand', bg: '#01A1FF' },
  { file: 'constructive-horiz-black-text.svg', name: 'Horizontal · dark text', bg: '#fff' },
  { file: 'constructive-horiz-white-text.svg', name: 'Horizontal · white text', bg: '#232323' },
  { file: 'constructive-horiz-brand-bg.svg', name: 'Horizontal · brand', bg: '#01A1FF' },
  { file: 'constructive-vertical-black-text.svg', name: 'Vertical · dark text', bg: '#fff' },
  { file: 'constructive-vertical-white-text.svg', name: 'Vertical · white text', bg: '#232323' },
  { file: 'constructive-vertical-brand-bg.svg', name: 'Vertical · brand', bg: '#01A1FF' },
];

const generated = [
  { file: 'mark-light.svg', name: 'Cube mark · light', bg: '#fff' },
  { file: 'mark-dark.svg', name: 'Cube mark · dark', bg: '#232323' },
  { file: 'mark-mono.svg', name: 'Cube mark · mono', bg: '#fff' },
  { file: 'mark-solid.svg', name: 'Cube mark · solid', bg: '#F3F6FA' },
  { file: 'mark-outline.svg', name: 'Cube mark · outline', bg: '#fff' },
  { file: 'mark-wireframe.svg', name: 'Cube mark · wireframe', bg: '#fff' },
];

function Tiles({ items, dir }: { items: typeof official; dir: string }) {
  return (
    <div className="tiles">
      {items.map((t) => {
        const href = `${base}/${dir}/${t.file}`;
        return (
          <div className="tile" key={t.file}>
            <div className="tile-img" style={{ background: t.bg }}>
              <img src={href} alt={t.name} />
            </div>
            <div className="tile-meta">
              <span>{t.name}</span>
              <a href={href} download>
                SVG
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Logos() {
  return (
    <section className="section" id="logos">
      <div className="eyebrow">Logos</div>
      <h2>Lockups</h2>
      <p className="lede">
        Official lockups are the reference. Use the horizontal lockup by default, the mark alone when space is tight, and
        never redraw either — regenerate them.
      </p>
      <h3 style={{ marginTop: '2rem' }}>Official</h3>
      <Tiles items={official} dir="official" />
      <h3 style={{ marginTop: '2.5rem' }}>Generated cube mark</h3>
      <p style={{ color: 'var(--muted)', maxWidth: '60ch' }}>
        Built by <code>@constructive-io/brand-svg</code> from the shared geometry. Also available as OBJ/MTL:{' '}
        <a href={`${base}/generated/obj/constructive-mark.obj`} download>
          constructive-mark.obj
        </a>
        ,{' '}
        <a href={`${base}/generated/obj/constructive-mark.mtl`} download>
          .mtl
        </a>
        .
      </p>
      <Tiles items={generated} dir="generated/svg" />

      <div className="grid-2" style={{ marginTop: '3rem' }}>
        <div>
          <h3>Do</h3>
          <ul className="rule-list">
            <li>Keep clear space of at least one cube width around the mark.</li>
            <li>Use the light colorway on white and mist; dark on ink.</li>
            <li>Render at or above 24px — the mark loses its cubes below that.</li>
            <li>Regenerate from the kit rather than editing exported files.</li>
          </ul>
        </div>
        <div>
          <h3>Don't</h3>
          <ul className="rule-list">
            <li className="dont">Rotate, skew, or change the isometric angle.</li>
            <li className="dont">Recolor individual faces outside the defined colorways.</li>
            <li className="dont">Add drop shadows, gradients, or bevels to faces.</li>
            <li className="dont">Set the wordmark in any typeface other than Poppins.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
