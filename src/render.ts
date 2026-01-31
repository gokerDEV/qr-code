import {
	type QrLike,
	type RenderSvgOptions,
	SvgError,
	SvgErrorCode,
} from "./types.js";

const DEFAULT_OPTIONS: Required<RenderSvgOptions> = {
	moduleSize: 4,
	margin: 4,
	darkColor: "#000",
	lightColor: "transparent",
	xmlDeclaration: false,
	viewBox: true,
	crispEdges: true,
	renderer: "classic",
	grouping: "row",
	moduleShape: "square",
	rotate: 0,
	rx: 0,
};

export function renderSvg(qr: QrLike, options: RenderSvgOptions = {}): string {
	// Validate QR
	if (
		!qr ||
		typeof qr.size !== "number" ||
		!qr.matrix ||
		typeof qr.matrix.get !== "function"
	) {
		throw new SvgError(SvgErrorCode.INVALID_QR_OBJECT, "Invalid QrLike object");
	}

	// Merge defaults
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Validate Options
	if (opts.moduleSize <= 0 || !Number.isInteger(opts.moduleSize)) {
		throw new SvgError(
			SvgErrorCode.INVALID_OPTIONS,
			`Invalid moduleSize: ${opts.moduleSize}. Must be a positive integer.`,
		);
	}
	if (opts.margin < 0 || opts.margin > 64 || !Number.isInteger(opts.margin)) {
		throw new SvgError(
			SvgErrorCode.INVALID_OPTIONS,
			`Invalid margin: ${opts.margin}. Must be an integer between 0 and 64.`,
		);
	}

	const { size } = qr;
	const {
		moduleSize,
		margin,
		darkColor,
		lightColor,
		xmlDeclaration,
		viewBox,
		crispEdges,
		renderer,
		grouping,
		moduleShape,
		rotate,
		rx,
	} = opts;

	const totalSize = (size + 2 * margin) * moduleSize;
	const rotation = renderer === "diamond" ? rotate || 45 : 0;
	const absCos = Math.abs(Math.cos((rotation * Math.PI) / 180));
	const absSin = Math.abs(Math.sin((rotation * Math.PI) / 180));
	const rotatedSize = rotation
		? Math.ceil(totalSize * (absCos + absSin))
		: totalSize;

	let svg = "";
	if (xmlDeclaration) {
		svg += '<?xml version="1.0" standalone="yes"?>\n';
	}

	let svgAttrs = `width="${rotatedSize}" height="${rotatedSize}"`;
	if (viewBox) {
		svgAttrs += ` viewBox="0 0 ${rotatedSize} ${rotatedSize}"`;
	}
	if (crispEdges) {
		svgAttrs += ` shape-rendering="crispEdges"`;
	}

	svg += `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttrs}>\n`;

	// Background
	if (lightColor !== "transparent") {
		svg += `  <rect x="0" y="0" width="${rotatedSize}" height="${rotatedSize}" fill="${lightColor}"/>\n`;
	}

	const rxValue =
		moduleShape === "pill"
			? moduleSize / 2
			: moduleShape === "rounded"
				? rx || Math.max(1, Math.floor(moduleSize / 3))
				: 0;

	const rectAttrs = () =>
		rxValue > 0 ? ` rx="${rxValue}" ry="${rxValue}"` : "";

	const emitDot = (px: number, py: number) => {
		if (moduleShape === "circle") {
			const r = moduleSize / 2;
			const cx = px + r;
			const cy = py + r;
			svg += `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${darkColor}"/>\n`;
			return;
		}
		svg += `  <rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"${rectAttrs()}/>\n`;
	};

	const writeClassic = () => {
		for (let y = 0; y < size; y++) {
			let x = 0;
			while (x < size) {
				if (qr.matrix.get(x, y) === 1) {
					let width = 1;
					while (x + width < size && qr.matrix.get(x + width, y) === 1) {
						width++;
					}

					const px = (x + margin) * moduleSize;
					const py = (y + margin) * moduleSize;
					const pWidth = width * moduleSize;

					svg += `  <rect x="${px}" y="${py}" width="${pWidth}" height="${moduleSize}" fill="${darkColor}"/>\n`;

					x += width;
				} else {
					x++;
				}
			}
		}
	};

	const writeGrouped = (
		groupMode: "row" | "col" | "dot" | "diag45" | "diag-45",
	) => {
		if (groupMode === "dot") {
			for (let y = 0; y < size; y++) {
				for (let x = 0; x < size; x++) {
					if (qr.matrix.get(x, y) === 1) {
						const px = (x + margin) * moduleSize;
						const py = (y + margin) * moduleSize;
						emitDot(px, py);
					}
				}
			}
			return;
		}

		if (groupMode === "col") {
			for (let x = 0; x < size; x++) {
				let y = 0;
				while (y < size) {
					if (qr.matrix.get(x, y) === 1) {
						let height = 1;
						while (y + height < size && qr.matrix.get(x, y + height) === 1) {
							height++;
						}
						const px = (x + margin) * moduleSize;
						const py = (y + margin) * moduleSize;
						const pHeight = height * moduleSize;
						svg += `  <rect x="${px}" y="${py}" width="${moduleSize}" height="${pHeight}" fill="${darkColor}"${rectAttrs()}/>\n`;
						y += height;
					} else {
						y++;
					}
				}
			}
			return;
		}

		const emitDiag = (
			px: number,
			py: number,
			dirX: number,
			dirY: number,
			length: number,
		) => {
			const p0x = px;
			const p0y = py;
			const p1x = px + dirX * length;
			const p1y = py + dirY * length;
			const useRound =
				moduleShape === "pill" || moduleShape === "rounded" || rx > 0;
			const linecap = useRound ? "round" : "butt";
			svg += `  <path d="M ${p0x} ${p0y} L ${p1x} ${p1y}" stroke="${darkColor}" stroke-width="${moduleSize}" stroke-linecap="${linecap}" fill="none"/>\n`;
		};

		if (groupMode === "diag45") {
			const dirX = 1 / Math.SQRT2;
			const dirY = -1 / Math.SQRT2;
			for (let d = 0; d <= (size - 1) * 2; d++) {
				let run = 0;
				let runStartX = 0;
				let runStartY = 0;
				for (let x = 0; x < size; x++) {
					const y = d - x;
					if (y < 0 || y >= size) continue;
					if (qr.matrix.get(x, y) === 1) {
						if (run === 0) {
							runStartX = x;
							runStartY = y;
						}
						run++;
					} else if (run > 0) {
						const px = (runStartX + margin) * moduleSize;
						const py = (runStartY + margin) * moduleSize;
						const length = run * moduleSize * Math.SQRT2;
						emitDiag(px, py, dirX, dirY, length);
						run = 0;
					}
				}
				if (run > 0) {
					const px = (runStartX + margin) * moduleSize;
					const py = (runStartY + margin) * moduleSize;
					const length = run * moduleSize * Math.SQRT2;
					emitDiag(px, py, dirX, dirY, length);
				}
			}
			return;
		}

		if (groupMode === "diag-45") {
			const dirX = 1 / Math.SQRT2;
			const dirY = 1 / Math.SQRT2;
			for (let d = -(size - 1); d <= size - 1; d++) {
				let run = 0;
				let runStartX = 0;
				let runStartY = 0;
				for (let x = 0; x < size; x++) {
					const y = x - d;
					if (y < 0 || y >= size) continue;
					if (qr.matrix.get(x, y) === 1) {
						if (run === 0) {
							runStartX = x;
							runStartY = y;
						}
						run++;
					} else if (run > 0) {
						const px = (runStartX + margin) * moduleSize;
						const py = (runStartY + margin) * moduleSize;
						const length = run * moduleSize * Math.SQRT2;
						emitDiag(px, py, dirX, dirY, length);
						run = 0;
					}
				}
				if (run > 0) {
					const px = (runStartX + margin) * moduleSize;
					const py = (runStartY + margin) * moduleSize;
					const length = run * moduleSize * Math.SQRT2;
					emitDiag(px, py, dirX, dirY, length);
				}
			}
			return;
		}

		for (let y = 0; y < size; y++) {
			let x = 0;
			while (x < size) {
				if (qr.matrix.get(x, y) === 1) {
					let width = 1;
					while (x + width < size && qr.matrix.get(x + width, y) === 1) {
						width++;
					}
					const px = (x + margin) * moduleSize;
					const py = (y + margin) * moduleSize;
					const pWidth = width * moduleSize;
					svg += `  <rect x="${px}" y="${py}" width="${pWidth}" height="${moduleSize}" fill="${darkColor}"${rectAttrs()}/>\n`;
					x += width;
				} else {
					x++;
				}
			}
		}
	};

	if (renderer === "diamond") {
		const offset = (rotatedSize - totalSize) / 2;
		const groupMode: "row" | "col" | "dot" | "diag45" | "diag-45" =
			grouping === "col"
				? "col"
				: grouping === "dot"
					? "dot"
					: grouping === "45"
						? "diag45"
						: grouping === "-45"
							? "diag-45"
							: "row";
		svg += `  <g transform="translate(${offset} ${offset}) rotate(${rotation} ${totalSize / 2} ${totalSize / 2})">\n`;
		writeGrouped(groupMode);
		svg += "  </g>\n";
	} else {
		if (grouping === "row" && moduleShape === "square") {
			writeClassic();
		} else {
			const groupMode: "row" | "col" | "dot" | "diag45" | "diag-45" =
				grouping === "col"
					? "col"
					: grouping === "dot"
						? "dot"
						: grouping === "45"
							? "diag45"
							: grouping === "-45"
								? "diag-45"
								: "row";
			writeGrouped(groupMode);
		}
	}

	svg += "</svg>";
	return svg;
}
