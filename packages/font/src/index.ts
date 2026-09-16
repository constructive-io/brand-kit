import { exportObj, ExportResult, MeshOptions, ObjOptions } from '@constructive-io/brand-3d';
import { RenderOptions, RenderResult, renderSvg } from '@constructive-io/brand-svg';

import { TextOptions, textToVoxels } from './text';

export * from './alphabet';
export * from './text';

/** Cube text as SVG. */
export function renderText(text: string, opts: RenderOptions & TextOptions = {}): RenderResult {
  const { plane, letterSpacing, ...rest } = opts;
  return renderSvg(textToVoxels(text, { plane, letterSpacing }), rest);
}

/** Cube text as OBJ + MTL. */
export function exportText(
  text: string,
  opts: MeshOptions & Omit<ObjOptions, 'name' | 'mtllib'> & TextOptions = {},
): ExportResult {
  const { plane, letterSpacing, ...rest } = opts;
  return exportObj(textToVoxels(text, { plane, letterSpacing }), 'constructive-text', rest);
}
