import { Grid, gridToVoxels, IsoPlane, VoxelModel } from '@constructive-io/brand-geometry';

import { alphabet, LetterGrid } from './alphabet';

export const GLYPH_ROWS = 5;

export function glyph(char: string): LetterGrid | undefined {
  return alphabet[char.toUpperCase()] ?? alphabet[char];
}

export function isCharSupported(char: string): boolean {
  return glyph(char) !== undefined;
}

export function supportedChars(): string[] {
  return Object.keys(alphabet);
}

export function filterToSupported(text: string): string {
  return [...text].filter(isCharSupported).join('');
}

/** Lay glyphs side by side into one grid, `letterSpacing` empty columns apart. */
export function textToGrid(text: string, letterSpacing = 1): Grid {
  const grids = [...text].map((c) => glyph(c) ?? alphabet[' ']);
  if (grids.length === 0) return [[0]];

  const spacer = Array<number>(letterSpacing).fill(0);
  const combined: Grid = Array.from({ length: GLYPH_ROWS }, (): number[] => []);

  grids.forEach((g, i) => {
    for (let row = 0; row < GLYPH_ROWS; row++) {
      combined[row].push(...g[row]);
      if (i < grids.length - 1) combined[row].push(...spacer);
    }
  });
  return combined;
}

export interface TextOptions {
  plane?: IsoPlane;
  letterSpacing?: number;
}

/** Text as a voxel model on a plane (default: the mark's plane). */
export function textToVoxels(text: string, { plane = 'Yz', letterSpacing = 1 }: TextOptions = {}): VoxelModel {
  return gridToVoxels(textToGrid(text, letterSpacing), plane);
}
