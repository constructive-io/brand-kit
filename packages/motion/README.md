# @constructive-io/brand-motion

Choreographies for animating Constructive voxel models. A choreography maps `(model, t ∈ [0,1])` to a state per cube (offset, scale, opacity, spin) in world units, so the same preset drives 2D SVG frames (`renderFrame` in `@constructive-io/brand-svg`) and the 3D WebGL scene.

Families: `explode`, `assemble`, `converge`, `orbit`, `tetris` — see `presets` for variants.

```ts
import { explode, Timeline } from '@constructive-io/brand-motion';

const choreo = explode({ preset: 'spiral' });
const states = choreo(MARK, 0.5);
```
