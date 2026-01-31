# Diamond Renderer (45°) — Design Notes

This document describes an optional “Diamond” rendering mode for `@goker/qr-code`.  
The key principle: **the QR matrix stays identical** (same data, ECC, masking, version, quiet zone). Only the **SVG rendering strategy** changes.

---

## Why Diamond?

QR codes are generally rotation-tolerant in practice, so we can explore a visual style without touching the encoding layer.

**Diamond** is a renderer preset that:
- keeps the **quiet zone intact**
- keeps the **module matrix unchanged**
- applies a **45° rotation** at the SVG group level
- optionally uses **line-based grouping** to create a “striped” diamond aesthetic

This is purely a **visual treatment** and does not add or remove QR features.

---

## Core Concept

1. Generate the module matrix (from `qr-core`) as usual.
2. Render that matrix into SVG shapes using a grouping strategy.
3. Rotate the final rendered group by **45°** around the SVG center.

**Important:** Do not rotate or distort the matrix coordinates before computing the quiet zone.  
Quiet zone should be applied in matrix space, then the full SVG group is rotated.

---

## Rendering Strategies (Grouping Modes)

All modes render the same matrix, but optimize for different aesthetics and performance.

### 1) Row-run grouping (`grouping: "row"`)
- For each row, merge consecutive dark modules into a single long rounded rect (“pill”).
- Produces a **striped** look.
- Great performance: fewer SVG nodes.

**Best for:** poster-like graphics, strong geometric identity.

### 2) Column-run grouping (`grouping: "col"`)
- Same as row-run, but merge consecutive dark modules by column.
- Creates a different rhythm after rotation (often feels “woven”).

**Best for:** design variants, tighter visual texture.

### 3) Dot-per-module (`grouping: "dot"`)
- Render each module as its own shape (circle or rounded square).
- Soft aesthetic but increases SVG element count.

**Best for:** friendly/modern look when performance is not the primary concern.

### 4) Connected blobs (`grouping: "blob"`)
- Merge connected components into paths (flood-fill regions).
- Produces an organic “ink” feel, but is more complex to implement.

**Best for:** experimental styles, brand signatures.

### 5) Hybrid (`grouping: "hybrid"`)
- Combine strategies (e.g., row-runs for body, custom finder patterns).
- Enables “signature” styling without altering data modules.

**Best for:** productized presets, branded QR visuals.

---

## Diamond Preset

The Diamond preset is essentially:

- `rotate: 45`
- `grouping: "row"` (recommended default)
- `moduleShape: "pill"` or `rounded`
- quiet zone unchanged

### Suggested default behavior
- Default to **row-run grouping** because it creates the most “diamond” visual identity.
- Allow switching to `"col"` or `"dot"` for variations.

---

## Proposed API (Renderer-Level)

A minimal, composable surface:

- `renderer: "classic" | "diamond"`
- `grouping: "row" | "col" | "dot" | "blob" | "hybrid"`
- `rotate: number` (diamond preset sets this to 45 by default)
- `moduleShape: "square" | "rounded" | "circle" | "pill"`

Optional quality controls:
- `rx` (corner radius)
- `optimizeSvg: boolean` (reduce nodes by merging runs)
- `stroke: never` (prefer fill-only for scan reliability)

---

## Implementation Notes (SVG)

### Rotation
- Rotate the **final** group: `transform="rotate(45 cx cy)"`
- Use the exact center of the viewBox for `(cx, cy)`.

### Quiet zone
- Must remain visually empty even after rotation.
- Apply quiet zone padding in the SVG coordinate system before rotation (i.e., enlarge the canvas / viewBox appropriately).

### Anti-aliasing and pixel fit
To reduce scan variance across devices:
- Prefer **fill-only** rendering (avoid strokes).
- Avoid overly large corner radii that “eat” gaps.
- Keep module sizing consistent and avoid fractional scaling where possible.

---

## Readability Guardrails (Renderer-Safe)

Diamond is safe **as long as** the renderer does not violate QR structural constraints:

- Do not modify the underlying matrix.
- Do not shrink or remove quiet zone.
- Do not “stylize away” module separations (e.g., radius too large, strokes that blur boundaries).
- If adding a logo or center cutout, recommend higher ECC in the encoder layer (Q/H), but keep this as guidance—not a renderer requirement.

---

## Preset Ideas (Ready-to-Ship)

### A) `diamond/row`
- `renderer: "diamond"`
- `grouping: "row"`
- `moduleShape: "pill"`

**Look:** strong striped diamond, minimal, high performance.

### B) `diamond/col`
- `renderer: "diamond"`
- `grouping: "col"`
- `moduleShape: "pill"`

**Look:** tighter weave-like rhythm.

### C) `diamond/dot`
- `renderer: "diamond"`
- `grouping: "dot"`
- `moduleShape: "circle"`

**Look:** soft, modern, higher node count.

---

## Positioning (One-Liner)

“Same QR matrix, different renderers: Diamond explores a design space purely at the SVG layer—line grouping plus a 45° rotation creates a clean diamond aesthetic without touching quiet zone or encoding.”

---
