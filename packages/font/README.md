# @constructive-io/brand-font

The Constructive cube typeface: a five-row block alphabet built from unit cubes on the shared voxel geometry.

```ts
import { textToVoxels, renderText, exportText, supportedChars } from '@constructive-io/brand-font';

renderText('BUILD', { mode: 'outline' }).svg;
exportText('BUILD').obj;
```
