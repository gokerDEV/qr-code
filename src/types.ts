export interface QrLike {
	size: number;
	matrix: {
		get(x: number, y: number): 0 | 1;
	};
}

export interface RenderSvgOptions {
	/**
	 * Module size in pixels.
	 * Must be a positive integer.
	 * @default 4
	 */
	moduleSize?: number;

	/**
	 * Margin in modules.
	 * Must be an integer in [0, 64].
	 * @default 4
	 */
	margin?: number;

	/**
	 * Color of dark modules.
	 * @default "#000"
	 */
	darkColor?: string;

	/**
	 * Color of light modules (background).
	 * @default "transparent"
	 */
	lightColor?: string;

	/**
	 * Include XML declaration.
	 * @default false
	 */
	xmlDeclaration?: boolean;

	/**
	 * Include viewBox attribute.
	 * @default true
	 */
	viewBox?: boolean;

	/**
	 * Use shape-rendering="crispEdges".
	 * @default true
	 */
	crispEdges?: boolean;

	/**
	 * Renderer style.
	 * @default "classic"
	 */
	renderer?: "classic" | "diamond";

	/**
	 * Grouping strategy for non-classic renderers.
	 * @default "row"
	 */
	grouping?: "row" | "col" | "dot" | "45" | "-45";

	/**
	 * Module shape for dot/grouped rendering.
	 * @default "square"
	 */
	moduleShape?: "square" | "rounded" | "circle" | "pill";

	/**
	 * Rotation in degrees (diamond preset uses 45).
	 * @default 45 for diamond, 0 otherwise
	 */
	rotate?: number;

	/**
	 * Corner radius in pixels for rounded modules.
	 */
	rx?: number;
}

export interface ToSvgStringOptions {
	// Encoding pass-through (QrCoreOptions)
	ecc?: "L" | "M" | "Q" | "H";
	version?: number | "auto";
	mask?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "auto";
	mode?: "auto" | "byte" | "alphanumeric" | "numeric";
	charset?: "utf-8" | "iso-8859-1";
	quietZone?: number;
	strict?: boolean;

	// Rendering
	render?: RenderSvgOptions;
}

export enum SvgErrorCode {
	INVALID_OPTIONS = "INVALID_OPTIONS",
	INVALID_QR_OBJECT = "INVALID_QR_OBJECT",
	RENDER_FAILED = "RENDER_FAILED",
}

export class SvgError extends Error {
	code: SvgErrorCode;
	details?: unknown;

	constructor(code: SvgErrorCode, message: string, details?: unknown) {
		super(message);
		this.name = "SvgError";
		this.code = code;
		this.details = details;
	}
}
