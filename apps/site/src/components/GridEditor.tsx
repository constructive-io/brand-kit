import { Grid } from '@constructive-io/brand-geometry';

export function GridEditor({ grid, onChange }: { grid: Grid; onChange: (g: Grid) => void }) {
  const cols = grid[0]?.length ?? 0;
  const toggle = (r: number, c: number) => {
    const next = grid.map((row) => [...row]);
    next[r][c] = next[r][c] ? 0 : 1;
    onChange(next);
  };
  return (
    <div className="grid-editor" style={{ gridTemplateColumns: `repeat(${cols}, 34px)` }} aria-label="cube grid">
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <button key={`${r}-${c}`} className={cell ? 'on' : ''} onClick={() => toggle(r, c)} aria-pressed={!!cell} aria-label={`row ${r} col ${c}`} />
        )),
      )}
    </div>
  );
}
