import { useEffect, useState } from 'react';

import { base } from './components/util';
import { Colors } from './sections/Colors';
import { Derivation } from './sections/Derivation';
import { Hero } from './sections/Hero';
import { Logos } from './sections/Logos';
import { Motion } from './sections/Motion';
import { Playground } from './sections/Playground';

const links = [
  ['#derivation', 'Derivation'],
  ['#logos', 'Logos'],
  ['#colors', 'Color & type'],
  ['#playground', 'Playground'],
  ['#motion', 'Motion'],
  ['https://github.com/constructive-io/brand-kit', 'GitHub'],
] as const;

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <a className="nav-brand" href="#top">
            <img src={`${base}/generated/svg/mark-${theme}.svg`} alt="" />
            Constructive <span style={{ color: 'var(--muted)', fontWeight: 400 }}>Brand Kit</span>
          </a>
          <nav className="nav-links">
            {links.map(([href, label]) => (
              <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {label}
              </a>
            ))}
            <button className="btn small" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="toggle theme">
              {theme === 'light' ? 'dark' : 'light'}
            </button>
          </nav>
        </div>
      </header>
      <main>
        <Hero theme={theme} />
        <Derivation theme={theme} />
        <Logos />
        <Colors />
        <Playground theme={theme} />
        <Motion theme={theme} />
      </main>
      <footer className="footer">
        Constructive brand kit · geometry, SVG, OBJ and this site are generated from one voxel model ·{' '}
        <a href="https://github.com/constructive-io/brand-kit/blob/main/DESIGN.md">DESIGN.md</a>
      </footer>
    </>
  );
}
