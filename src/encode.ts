import { encode } from "qr-core";
import { renderSvg } from "./render.js";
import { ToSvgStringOptions } from "./types.js";

export function toSvgString(input: string, options: ToSvgStringOptions = {}): string {
    const { render, ...encodeOptions } = options;

    // Clean up undefined render options if any, though destructuring handles it.
    // We pass strict options to encode.

    // Note: We cast encodeOptions because ToSvgStringOptions is a superset/compatible
    // with qr-core options, but we want to ensure robust typing.
    // In a real scenario, we might want to pick specific fields, but spread is efficient
    // and allows future qr-core options to pass through if added to types.

    const qr = encode(input, encodeOptions as any);

    return renderSvg(qr, render);
}
