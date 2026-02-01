# Diamond Style (45°) — Rendering Notes

This document defines the **Diamond** visual style for `@goker/qr-code`.

**Non-negotiable rule:** the QR **matrix stays identical** (same data, ECC, mask, version, and quiet zone). Only the **SVG rendering** changes. The quiet zone MUST remain intact.

---

## What “Diamond” Actually Is

You get the Diamond look in exactly two simple ways:

1) **Diagonal grouping** (`grouping: "45"` or `grouping: "-45"`)
   - produces diagonal segments that naturally form a diamond silhouette.

2) **Rotate the whole QR** (`rotateDeg: 45`)
   - rotates the rendered output as a single SVG group.

There is no extra encoding logic, no alternate QR structure, and no special “diamond algorithm”.
It is purely a **rendering technique**.

---

## Public Options (Design Contract)

### 1) moduleShape
Only two shapes are supported:

- `moduleShape: "square"`
- `moduleShape: "circle"`

Anything else is unnecessary because corner rounding and grouping already cover the design space.

---

### 2) cornerRadius (MUST)
`cornerRadius` is **not optional**. It MUST work for every output type.

This means:

- If modules are rendered as `rect`, use rounded rect.
- If modules / segments are rendered as `polygon`, the renderer MUST convert them into a
  rounded path (fillet each corner) and output a path.
- If output is already a `path` (e.g., blob mode), corner rounding MUST be applied consistently
  where corners/joins exist.

**Implementation requirement:** corner rounding must be implemented as a geometry post-process
that can round corners for polygon/path geometries, not just for rects.

---

### 3) grouping
Grouping controls how the matrix is turned into geometry:

- `grouping: "row"`
- `grouping: "col"`
- `grouping: "dot"`
- `grouping: "blob"`
- `grouping: "45"`
- `grouping: "-45"`

**Important:** grouping MUST be independent from any "renderer" label or preset.

---

### 4) renderer (optional preset layer)
If you keep a `renderer: "classic" | "diamond"` option, then **diamond MUST be only a preset**.

**Diamond preset mapping:**
- `rotateDeg = 45`
- `grouping = "-45"`

That’s it. No additional behaviors.

If you remove `renderer` entirely, users can achieve the same result by explicitly setting
`rotateDeg` and `grouping`.

---

### 5) moduleRotationDeg (square-only)
Square modules MUST support rotation:

- `moduleRotationDeg: number` (e.g., `0`, `45`, `90`)

This enables “kilim / woven pattern” aesthetics when combined with row/col/dot grouping.

Rules:
- Applies only when `moduleShape: "square"`.
- Does not change the QR matrix; only rotates the rendered geometry for each module/segment.

---

## Geometry Requirements

### A) Diagonal grouping produces trapezoids/parallelograms (not rects)
For `grouping: "45"` and `grouping: "-45"`:

- Output segments correspond to **4-corner trapezoid/parallelogram** shapes in diagonal space.
- These MUST be drawn as **polygons**, not rects.
- Then cornerRadius rounding converts polygons to rounded paths.

This is mandatory for correctness and visual consistency.

---

### B) Polygon-first approach also helps blog visuals
Using polygons as a primary geometry primitive makes it easier to:
- apply cornerRadius consistently,
- build stylized diagonal segments,
- keep the style stable across resolutions and export contexts.

---

## SVG Safety Rules (Must-Follow)

### 1) Fill-only rendering
Do NOT use:
- `stroke`
- `stroke-linecap`
- `stroke-linejoin`

Stroke-based styling can shift edges, blur module boundaries, and break the visual structure.
All thickness and rounding MUST come from geometry.

### 2) Quiet zone integrity
Quiet zone MUST remain visually empty after:
- grouping,
- rounding,
- module rotation,
- global rotation.

### 3) Transform order (recommended)
A stable render pipeline:

1) Build geometry in matrix space (+ quiet zone padding).
2) Apply grouping to produce segments.
3) Apply `moduleRotationDeg` (square-only), where applicable.
4) Apply cornerRadius rounding as a geometry post-process.
5) Apply global rotation (`rotateDeg`, e.g., 45°) to the final SVG group.

---

## Summary (One-Liner)

Diamond is not a separate QR type. It is simply **diagonal grouping (±45°)** and/or a
**global 45° rotation**, while preserving the original QR matrix and quiet zone.
