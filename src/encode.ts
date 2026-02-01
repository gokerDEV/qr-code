import { type EncodeOptions, encode } from "qr-core";
import { renderSvg } from "./render";
import type { ToSvgStringOptions } from "./types";

/**
 * Encode input text and return a complete SVG string.
 *
 * @param input - Text or URL to encode.
 * @param options - Encoding and rendering options.
 * @returns SVG string output.
 *
 * @example
 * ```ts
 * import { toSvgString } from "@goker/qr-code";
 *
 * const svg = toSvgString("https://example.com", {
 *   ecc: "M",
 *   render: { moduleSize: 6, margin: 4 }
 * });
 * ```
 */
export function toSvgString(
	input: string,
	options: ToSvgStringOptions = {},
): string {
	const { render, ...encodeOptions } = options;

	// Clean up undefined render options if any, though destructuring handles it.
	// We pass strict options to encode.

	// Note: We cast encodeOptions because ToSvgStringOptions is a superset/compatible
	// with qr-core options, but we want to ensure robust typing.
	// In a real scenario, we might want to pick specific fields, but spread is efficient
	// and allows future qr-core options to pass through if added to types.

	const qr = encode(input, encodeOptions as EncodeOptions);

	return renderSvg(qr, render);
}
