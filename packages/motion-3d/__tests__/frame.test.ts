import { project } from '@constructive-io/brand-geometry';
import * as THREE from 'three';

import { BOX_FACE_ORDER, isoCameraPosition, toScene, vecToScene } from '../src/frame';

/** Project a scene-space point the way the iso camera does, in screen units (y down). */
function screen(v: THREE.Vector3): { x: number; y: number } {
  const cam = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
  cam.up.set(0, 0, 1);
  cam.position.copy(isoCameraPosition(20));
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();
  const p = v.clone().project(cam);
  return { x: p.x * 4, y: -p.y * 4 };
}

describe('brand → scene frame', () => {
  it('matches the SVG isometric projection up to one uniform scale', () => {
    const ref = screen(toScene(0, 0, 1));
    const k = -ref.y / -project({ x: 0, y: 0, z: 1 }).y; // scene units per SVG unit
    expect(k).toBeGreaterThan(0);
    for (const [x, y, z] of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [2, -1, 3], [-1, 2, 0.5]]) {
      const s = screen(toScene(x, y, z));
      const svg = project({ x, y, z });
      expect(s.x).toBeCloseTo(svg.x * k, 6);
      expect(s.y).toBeCloseTo(svg.y * k, 6);
    }
  });

  it('puts brand +x on screen-right and +y on screen-left', () => {
    expect(screen(toScene(1, 0, 0)).x).toBeGreaterThan(0);
    expect(screen(toScene(0, 1, 0)).x).toBeLessThan(0);
    expect(screen(toScene(0, 0, 1)).y).toBeLessThan(0);
  });

  it('vecToScene agrees with toScene', () => {
    expect(vecToScene({ x: 1, y: 2, z: 3 }).toArray()).toEqual(toScene(1, 2, 3).toArray());
  });

  it('assigns brand materials to the visible box faces', () => {
    // three.js BoxGeometry groups: +x, -x, +y, -y, +z, -z
    expect(BOX_FACE_ORDER[0]).toBe('left'); // scene +x = brand +y
    expect(BOX_FACE_ORDER[2]).toBe('right'); // scene +y = brand +x
    expect(BOX_FACE_ORDER[4]).toBe('top');
  });
});
