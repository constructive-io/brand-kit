import { colors, fonts,gradients } from '@constructive-io/brand-geometry';

const swatches: { name: string; key: keyof typeof colors; note: string }[] = [
  { name: 'Constructive Blue', key: 'blue', note: 'Primary. Right face of the mark, links, actions.' },
  { name: 'Ink', key: 'ink', note: 'Body text, dark surfaces.' },
  { name: 'Gray', key: 'gray', note: 'Secondary text, mono colorway faces.' },
  { name: 'Mist', key: 'mist', note: 'Light surfaces and panels.' },
  { name: 'Pale Blue', key: 'paleBlue', note: 'Borders, dividers, frost gradient end.' },
  { name: 'White', key: 'white', note: 'Top and left faces of the mark.' },
];

export function Colors() {
  return (
    <section className="section" id="colors">
      <div className="eyebrow">Color</div>
      <h2>Palette</h2>
      <p className="lede">
        One blue, warm neutrals, and a lot of white. Color sits on the right face of the mark, where light would not — it
        marks the cube as constructed rather than lit.
      </p>
      <div className="tiles" style={{ marginTop: '2rem' }}>
        {swatches.map((s) => (
          <div className="swatch" key={s.key}>
            <div className="swatch-color" style={{ background: colors[s.key] }} />
            <div className="swatch-meta">
              <strong>{s.name}</strong>
              <code>{colors[s.key]}</code>
              <div style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>{s.note}</div>
            </div>
          </div>
        ))}
        {Object.entries(gradients).map(([name, g]) => (
          <div className="swatch" key={name}>
            <div className="swatch-color" style={{ background: `linear-gradient(180deg, ${g.from}, ${g.to})` }} />
            <div className="swatch-meta">
              <strong>{name === 'blue' ? 'Blue gradient' : 'Frost gradient'}</strong>
              <code>
                {g.from} → {g.to}
              </code>
              <div style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
                {name === 'blue' ? 'Hero surfaces, feature emphasis.' : 'Backgrounds behind the mark.'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginTop: '4rem' }} id="type">
        Typography
      </div>
      <h2>Type</h2>
      <div className="tiles" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        <div className="type-sample" style={{ fontFamily: `'${fonts.display}', sans-serif` }}>
          <div className="big" style={{ fontWeight: 600 }}>
            Poppins
          </div>
          <p style={{ color: 'var(--muted)' }}>Display. Headlines, the wordmark, navigation. Weights 500–700.</p>
        </div>
        <div className="type-sample" style={{ fontFamily: `'${fonts.sans}', sans-serif` }}>
          <div className="big">Inter</div>
          <p style={{ color: 'var(--muted)' }}>Interface and body. Weights 400–600. Default for everything unspecified.</p>
        </div>
        <div className="type-sample" style={{ fontFamily: `'${fonts.serif}', serif`, fontWeight: 300 }}>
          <div className="big">Merriweather</div>
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--sans)' }}>Editorial. Ledes, pull quotes, long-form. Light 300 only.</p>
        </div>
      </div>
    </section>
  );
}
