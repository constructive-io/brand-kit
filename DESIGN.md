# Constructive Design System

This document is the durable description of the Constructive brand: what the mark *is*, how every asset is derived
from it, and the rules for using it. The code in this repository is the executable form of this document; when they
disagree, fix the code.

## 1. Principle: constructed, not drawn

Constructive builds infrastructure for people who build. The brand is therefore **architectural**: the mark is a
structure, not an illustration. It is a `C` assembled from six identical unit cubes, standing on an isometric lattice.
Nothing about it is hand-tuned — no bezier curves, no optical corrections. Given the grid and the projection below,
anyone (or any program) reproduces it exactly.

Everything else in the system follows from that stance:

- **One source of truth.** A voxel model (`{ voxels: [{x,y,z}, …] }`) is the only description of the mark. SVG, OBJ/MTL,
  WebGL, the cube alphabet, and every animation are *renderings* of that model, never separate artworks.
- **Deterministic.** Same input, same bytes. `pnpm generate` rewrites `assets/generated/` and CI fails if the result
  differs from what is committed.
- **Honest geometry.** Cubes are cubes. Faces that touch are removed; what you see in 2D is exactly the visible surface
  of the 3D object.

## 2. The mark

### 2.1 Grid

The mark starts as a 4 × 3 binary grid, rows top-to-bottom:

```
MARK_GRID = [
  [0, 1, 1],
  [1, 0, 0],
  [1, 0, 0],
  [0, 1, 1],
]
```

Six filled cells. Read as a letter, it is a squared-off `C`.

### 2.2 Lift onto a plane

A grid is 2D; the mark is 3D. Each filled cell `(row, col)` becomes a unit cube at a lattice point on one of the six
isometric planes. The canonical plane is `Yz`:

```
(row, col) ↦ (x, y, z) = (0, −col, −row)
```

so the mark is a single layer of cubes standing on the `x = 0` wall, growing along `−y` (to the right on screen) and
`−z` (downward). The other planes (`Xy`, `Xz`, `Yx`, `Zx`, `Zy`) are valid variants used for pattern work; `Yz` is
the logo.

### 2.3 Projection

The camera sits on the `(1, 1, 1)` diagonal. World points project to the page with the standard 30° isometric
projection, `s` being the cube edge in pixels:

```
u = (x − y) · (√3 ⁄ 2) · s
v = (x + y) · (1 ⁄ 2) · s − z · s
```

Consequences worth memorising:

- `+z` is straight up. `+x` goes down-right, `+y` goes down-left.
- Only three of a cube's six faces can ever face the camera: `+z` (**top**), `+y` (**left**), `+x` (**right**).
- A cube's top face is a rhombus with 60°/120° angles; the two side faces are the same rhombus rotated ±60°.

### 2.4 Culling and depth

Faces shared by two adjacent cubes are removed (`exposedFaces`). For the mark this leaves 30 of 36 faces and 32 unique
vertices — the same mesh that is exported to OBJ. For 2D rendering, faces are sorted back-to-front by the painter's
depth `x + y + z` and drawn in that order; no z-buffer is needed because cubes on a lattice never interpenetrate.

### 2.5 The three renderings

| Output | Package | What it is |
| --- | --- | --- |
| SVG | `@constructive-io/brand-svg` | Visible faces as `<path>`s with the colorway applied; `filled`, `outline`, `wireframe` |
| OBJ + MTL | `@constructive-io/brand-3d` | Quad mesh, culled and de-duplicated, Y-up by default, with `top`/`left`/`right` materials |
| WebGL | `@constructive-io/brand-motion-3d` | three.js scene with an orthographic camera on the `(1,1,1)` diagonal; identical framing to the SVG |

`@constructive-io/brand-logo` wraps these for the mark (`renderMark`, `exportMark`);
`@constructive-io/brand-font` does the same for text.

## 3. Color

| Token | Hex | Use |
| --- | --- | --- |
| Blue | `#01A1FF` | The brand color. Edges of the mark, its right face, links, primary actions |
| Ink | `#232323` | Text on light backgrounds; the mark's faces on dark backgrounds |
| Gray | `#8E9398` | Secondary text |
| Mist | `#F3F6FA` | Light page background, panels |
| Pale blue | `#D4DCEA` | Borders, dividers |
| White | `#FFFFFF` | The mark's faces on light backgrounds |

Gradients (backgrounds and hero surfaces only, never on the mark's faces):

- **Blue** `#1EC9FF → #1E78FF`
- **Frost** `#F5F8FF → #C8D7FF`

### 3.1 Colorways of the mark

A colorway assigns a fill to each visible face plus the edge stroke.

| Colorway | Top | Left | Right | Stroke | When |
| --- | --- | --- | --- | --- | --- |
| `light` | White | White | Blue | Blue | Default. White and Mist backgrounds |
| `dark` | Ink | Ink | Blue | Blue | Ink and dark backgrounds |
| `mono` | White | White | White | Ink | One-color print, embossing |
| `solid` | `#4FBDFF` | `#0186D6` | Blue | Blue | 3D / shaded contexts (OBJ, renders) |

The right face is always the brand blue: it is the "lit" face and the one thing that makes the mark read as
Constructive even at 16 px.

## 4. Typography

- **Poppins** — display and the wordmark. The word *Constructive* in lockups is Poppins SemiBold; never re-set it in
  another face.
- **Inter** — UI and body copy.
- **Merriweather** — long-form editorial copy only.

### 4.1 The cube alphabet

`@constructive-io/brand-font` provides a 5-row cube alphabet (A–Z, 0–9, common punctuation) built with the same lift
and projection as the mark. It is a *display* face for headlines, patterns, and motion — not for running text. The
`CONSTRUCTIVE` cube wordmark (`assets/generated/obj/constructive-wordmark-cubes.obj`) exists for 3D and architectural
contexts; the official lockups remain Poppins.

## 5. Lockups and usage

The official files live in `assets/official/` and are the reference for print and partner use.

- **Horizontal** (`constructive-horiz-*`) — default. Mark left, wordmark right.
- **Vertical** (`constructive-vertical-*`) — square placements, app icons, social avatars.
- **Mark alone** (`constructive.svg`, `constructive-*-bg.svg`) — favicons, badges, when the name is already present.

Rules:

- Clear space of at least one cube edge (`s`) around the mark on all sides.
- Minimum size 24 px for the mark; below that the cubes merge and it becomes a blob.
- `light` on White/Mist, `dark` on Ink. Do not place the `light` mark on Blue — use the `*-brand-bg` lockups, which
  carry their own background.
- Never rotate, skew, mirror, or change the isometric angle. The mark's orientation *is* the derivation.
- Never recolor individual faces, add shadows, bevels, gradients, or outlines beyond the defined stroke.
- Never redraw. Regenerate from this kit if a new size or colorway is needed.

## 6. Motion

Motion is how the mark shows it is built. Every animation is a **choreography**: a pure function from
`(model, t ∈ [0, 1])` to one state per cube — `offset`, `scale`, `opacity`, `spin` — in cube units. At `t = 1` every
choreography is at rest in the canonical mark.

Families (`@constructive-io/brand-motion`):

| Family | Feel | Presets |
| --- | --- | --- |
| `explode` | Disassembly; the mark flies apart and returns | radial, directional, spiral, gravity, scatter |
| `assemble` | Construction; cubes arrive and lock into place | top-down, bottom-up, left-right, right-left, print, typewriter |
| `converge` | Breathing, ambient | converge, stagger, wave, breathe |
| `orbit` | Cubes circle a shared axis before settling | spiral-in, carousel, helix, figure8, vortex |
| `tetris` | Rigid clusters drop on the lattice | classic-drop, slide-in, zigzag, rotate-drop, cascade |

Rules of motion:

- Cubes move; the camera does not (except in the interactive "free" orbit view). The isometric frame is fixed.
- Cubes stay cubes: uniform scale, spin only about the vertical axis, no deformation.
- Ease in/out; default duration 2–3 s; prefer `assemble` for intros and `converge`/`breathe` for idle loops.
- The same choreography drives SVG frames (`brand-motion-2d`) and WebGL (`brand-motion-3d`). Frame sequences share one
  fixed viewBox computed from the choreography's bounds so nothing jumps between frames.

## 7. Architecture branding

Constructive's visual language is the lattice. Beyond the logo, use:

- **Isometric grids** at the same 30° projection as backgrounds and section dividers.
- **Cube type** for large numerals and short headlines.
- **Single-layer walls** (any grid lifted onto one plane) as illustrations of structure: schemas, modules, stacks.
- **Blue edges on white faces** as the illustration style: line weight ≈ `s ⁄ 12`, round joins.

Do not introduce other 3D styles (perspective, soft shading, rounded corners) next to the mark.

## 8. Reproducing everything

```sh
pnpm install
pnpm build
pnpm generate          # assets/generated/** from the geometry
pnpm dev               # interactive site: derivation, playground, motion studio
```

`brand-kit svg | obj | frames` render any grid, text, or the mark on demand; see the README for flags.
