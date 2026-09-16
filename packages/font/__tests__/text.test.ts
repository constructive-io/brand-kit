import { alphabet, exportText, renderText, supportedChars, textToGrid, textToVoxels } from '../src';

describe('text', () => {
  it('every glyph has 5 rows of equal width', () => {
    for (const ch of supportedChars()) {
      const g = alphabet[ch];
      expect(g).toHaveLength(5);
      expect(new Set(g.map((r) => r.length)).size).toBe(1);
    }
  });

  it('joins glyphs with spacing', () => {
    const grid = textToGrid('II', 2);
    expect(grid[0]).toHaveLength(alphabet['I'][0].length * 2 + 2);
  });

  it('renders text as voxels on the mark plane', () => {
    const m = textToVoxels('C');
    expect(m.voxels.length).toBe(alphabet['C'].flat().filter((c) => c === 1).length);
    expect(m.voxels.every((v) => v.x === 0)).toBe(true);
  });

  it('renders SVG and OBJ for text', () => {
    expect(renderText('CI').svg).toContain('<svg');
    expect(exportText('CI').obj).toContain('constructive-text');
  });
});
