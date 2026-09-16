# @constructive-io/brand-motion-2d

2D output for `@constructive-io/brand-motion` choreographies. Every frame is the deterministic `renderFrame` from `@constructive-io/brand-svg`, so what you export here is pixel-for-pixel what the WebGL scene in `@constructive-io/brand-motion-3d` plays.

```ts
import { MARK } from '@constructive-io/brand-logo';
import { choreography } from '@constructive-io/brand-motion';
import { animatedSvg, sequence, spriteSheet } from '@constructive-io/brand-motion-2d';

const choreo = choreography('explode', 'spiral');

// Numbered SVG frames sharing one viewBox (for video / GIF pipelines)
const { frames } = sequence(MARK, choreo, { frames: 48, name: 'explode-spiral' });

// One self-contained SVG animated with SMIL, no JavaScript
const svg = animatedSvg(MARK, choreo, { frames: 24, duration: 2, playback: 'bounce' });

// Frames tiled on one canvas, for CSS steps() or texture atlases
const sheet = spriteSheet(MARK, choreo, { frames: 16, columns: 4 });
```

All functions accept the `RenderOptions` of `@constructive-io/brand-svg` (`colors`, `mode`, `size`, `strokeWidth`, `background`, …).
