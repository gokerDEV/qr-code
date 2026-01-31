# qr-code

**Minimal SVG Output Library (Powered by `qr-core`)**

`qr-code` is a lightweight, zero-dependency (other than `qr-core`) library for generating QR codes directly as SVG strings. It is designed to be:

-   **Deterministic**: Same input + options = byte-identical output.
-   **Universal**: Works in Node.js, Browsers, Edge Runtimes, and Cloudflare Workers (no DOM/Canvas required).
-   **Strict**: Written in TypeScript 5.x with `strict: true` and no `any`.
-   **Optimized**: Merges horizontal modules (runs) into single `<rect>` elements to minimize SVG size.

## Installation

```bash
npm install qr-code
```

## Usage

### 1. Simple Encode & Render (Recommended)

Use `toSvgString` to encode text and get an SVG string in one step:

```typescript
import { toSvgString } from "qr-code";

const svg = toSvgString("https://example.com", {
  // Encoding Options (passed to qr-core)
  ecc: "M",           // 'L', 'M', 'Q', 'H'
  version: "auto",    // 1-40 or 'auto'
  mask: "auto",       // 0-7 or 'auto'

  // Rendering Options
  render: {
    moduleSize: 10,   // px per module
    margin: 4,        // Modules of white space around
    darkColor: "#000000",
    lightColor: "#ffffff",
    viewBox: true     // Include viewBox attribute
  }
});

console.log(svg);
// Output: <svg ...>...</svg>
```

### 2. Advanced: Render Pre-Encoded Matrix

If you already have a `qr-core` object (or any compatible `QrLike` structure), you can use `renderSvg` directly. This is useful if you want to reuse the same calculated matrix for multiple outputs/formats.

```typescript
import { encode } from "qr-core";
import { renderSvg } from "qr-code";

// 1. Encode separately
const qr = encode("https://example.com", { ecc: "H" });

// 2. Render
const svg = renderSvg(qr, {
  moduleSize: 4,
  darkColor: "#333",
  lightColor: "transparent" // Transparent background
});
```

## API Reference

### `toSvgString(input, options?)`

Encodes input text and returns a complete SVG string.

-   **`input`**: string - The text to encode.
-   **`options`**: `ToSvgStringOptions`
    -   All `qr-core` encoding options (`ecc`, `version`, `mask`, `mode`, `strict`, ...).
    -   `render`: `RenderSvgOptions` (see below).

### `renderSvg(qr, options?)`

Renders an existing QR matrix to an SVG string.

-   **`qr`**: `QrLike` object (`{ size: number, matrix: { get(x,y): 0|1 } }`).
-   **`options`**: `RenderSvgOptions`

### `RenderSvgOptions`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `moduleSize` | `number` | `4` | Pixel size of each module (must be integer > 0). |
| `margin` | `number` | `4` | Quiet zone size in modules (0-64). |
| `darkColor` | `string` | `"#000"` | CSS color for dark modules. |
| `lightColor` | `string` | `"transparent"` | CSS color for background. |
| `xmlDeclaration` | `boolean` | `false` | Prepend `<?xml ...?>` tag. |
| `viewBox` | `boolean` | `true` | Include `viewBox` attribute on `<svg>`. |
| `crispEdges` | `boolean` | `true` | Add `shape-rendering="crispEdges"`. |

## License

MIT
