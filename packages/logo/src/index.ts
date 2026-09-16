import { exportObj, ExportResult, MeshOptions, ObjOptions } from '@constructive-io/brand-3d';
import { RenderOptions, RenderResult, renderSvg } from '@constructive-io/brand-svg';

import { MARK } from './mark';

export * from './mark';

/** The Constructive mark as SVG. */
export function renderMark(opts: RenderOptions = {}): RenderResult {
  return renderSvg(MARK, opts);
}

/** The Constructive mark as OBJ + MTL. */
export function exportMark(opts: MeshOptions & Omit<ObjOptions, 'name' | 'mtllib'> = {}): ExportResult {
  return exportObj(MARK, 'constructive-mark', opts);
}
