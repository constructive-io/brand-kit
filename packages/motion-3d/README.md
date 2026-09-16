# @constructive-io/brand-motion-3d

three.js renderer for Constructive voxel models and `@constructive-io/brand-motion` choreographies. Plain classes, no framework: hand it a `<canvas>` and drive it from React, Vue or vanilla JS.

```ts
import { MARK } from '@constructive-io/brand-logo';
import { colorways } from '@constructive-io/brand-geometry';
import { choreography, Timeline } from '@constructive-io/brand-motion';
import { CubeScene, hasWebGL } from '@constructive-io/brand-motion-3d';

const scene = new CubeScene(canvas, MARK, {
  style: { ...colorways.light, stroke: colorways.light.stroke },
  explode: 0,
  wireframe: false,
  autoRotate: true,
  camera: 'iso', // orthographic on the (1,1,1) diagonal — matches the SVG exactly
});

const choreo = choreography('explode', 'spiral');
const tl = new Timeline(3);
tl.mode = 'bounce';
tl.play();
function tick(now: number) {
  scene.setStates(choreo(MARK, tl.tick(now)));
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

`three` is a peer dependency. The `toScene` / `BOX_FACE_ORDER` helpers encode the brand → three.js frame so the WebGL view lines up with `@constructive-io/brand-svg` output.
