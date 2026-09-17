import { VoxelModel } from '@constructive-io/brand-geometry';
import { VoxelState } from '@constructive-io/brand-motion';
import { CubeScene, hasWebGL, SceneOptions } from '@constructive-io/brand-motion-3d';
import { renderFrame, RenderOptions, renderSvg } from '@constructive-io/brand-svg';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { Svg } from '../components/Svg';

export interface MarkCanvasProps extends SceneOptions {
  model: VoxelModel;
  className?: string;
  /** Per-voxel animation frame from brand-motion; overrides `explode` while set. */
  states?: VoxelState[] | null;
  /** Choreography time for `camera="path"`. */
  t?: number;
}

export interface MarkCanvasHandle {
  resetView(): void;
}

/** Thin React wrapper: owns a <canvas>, hands it to CubeScene, forwards props. */
export const MarkCanvas = forwardRef<MarkCanvasHandle, MarkCanvasProps>(function MarkCanvas(
  { model, className, states = null, t = 0, ...opts },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [webgl] = useState(hasWebGL);

  useEffect(() => {
    if (!canvasRef.current || !webgl) return;
    const scene = new CubeScene(canvasRef.current, model, optsRef.current);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [webgl]);

  useEffect(() => {
    sceneRef.current?.setModel(model);
  }, [model]);

  useEffect(() => {
    sceneRef.current?.update(opts);
  }, [opts.style, opts.explode, opts.wireframe, opts.autoRotate, opts.camera, opts.cameraPath]);

  useEffect(() => {
    sceneRef.current?.setStates(states, t);
  }, [states, t, model]);

  useImperativeHandle(ref, () => ({ resetView: () => sceneRef.current?.resetView() }), []);

  // Static fallback (same geometry, same colors) when WebGL is unavailable.
  const fallback = useMemo(() => {
    if (webgl) return '';
    const o: RenderOptions = { mode: opts.wireframe ? 'wireframe' : 'filled', colors: opts.style, stroke: opts.style.stroke };
    return states ? renderFrame(model, states, o).svg : renderSvg(model, o).svg;
  }, [webgl, model, states, opts.wireframe, opts.style]);
  if (!webgl) return <Svg markup={fallback} className={`${className ?? ''} webgl-fallback`} />;

  return <canvas ref={canvasRef} className={className} />;
});
