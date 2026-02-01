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
	rotateDeg: 0,
	moduleRotationDeg: 0,
	cornerRadius: 0,
	rx: 0,
};

type Point = { x: number; y: number };
type Grouping = "row" | "col" | "dot" | "blob" | "45" | "-45";

function rotatePoint(p: Point, c: Point, deg: number): Point {
	if (!deg) return p;
	const rad = (deg * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const x = p.x - c.x;
	const y = p.y - c.y;
	return { x: c.x + x * cos - y * sin, y: c.y + x * sin + y * cos };
}

function polygonPath(points: Point[], radius: number): string {
	if (radius <= 0 || points.length < 3) {
		return (
			`M ${points[0].x} ${points[0].y} ` +
			points
				.slice(1)
				.map((p) => `L ${p.x} ${p.y}`)
				.join(" ") +
			" Z"
		);
	}
	const n = points.length;
	const path: string[] = [];
	for (let i = 0; i < n; i++) {
		const prev = points[(i - 1 + n) % n];
		const cur = points[i];
		const next = points[(i + 1) % n];
		const v1 = { x: cur.x - prev.x, y: cur.y - prev.y };
		const v2 = { x: next.x - cur.x, y: next.y - cur.y };
		const l1 = Math.hypot(v1.x, v1.y);
		const l2 = Math.hypot(v2.x, v2.y);
		if (l1 === 0 || l2 === 0) continue;
		const r = Math.min(radius, l1 / 2, l2 / 2);
		const p1 = { x: cur.x - (v1.x / l1) * r, y: cur.y - (v1.y / l1) * r };
		const p2 = { x: cur.x + (v2.x / l2) * r, y: cur.y + (v2.y / l2) * r };
		if (i === 0) {
			path.push(`M ${p1.x} ${p1.y}`);
		} else {
			path.push(`L ${p1.x} ${p1.y}`);
		}
		path.push(`Q ${cur.x} ${cur.y} ${p2.x} ${p2.y}`);
	}
	path.push("Z");
	return path.join(" ");
}

function rectPoints(x: number, y: number, w: number, h: number): Point[] {
	return [
		{ x, y },
		{ x: x + w, y },
		{ x: x + w, y: y + h },
		{ x, y: y + h },
	];
}

function polygonFromPoints(points: Point[], fill: string, radius: number) {
	return `  <path d="${polygonPath(points, radius)}" fill="${fill}"/>`;
}

function dotElement(
	px: number,
	py: number,
	moduleSize: number,
	fill: string,
	shape: "square" | "circle",
	radius: number,
	moduleRotationDeg: number,
) {
	if (shape === "circle") {
		const r = moduleSize / 2;
		return `  <circle cx="${px + r}" cy="${py + r}" r="${r}" fill="${fill}"/>`;
	}
	if (moduleRotationDeg) {
		const center = { x: px + moduleSize / 2, y: py + moduleSize / 2 };
		const points = rectPoints(px, py, moduleSize, moduleSize).map((p) =>
			rotatePoint(p, center, moduleRotationDeg),
		);
		return polygonFromPoints(points, fill, radius);
	}
	return polygonFromPoints(
		rectPoints(px, py, moduleSize, moduleSize),
		fill,
		radius,
	);
}

function computeRotatedSize(size: number, deg: number): number {
	if (!deg) return size;
	const rad = (deg * Math.PI) / 180;
	const absCos = Math.abs(Math.cos(rad));
	const absSin = Math.abs(Math.sin(rad));
	return Math.ceil(size * (absCos + absSin));
}

export function renderSvg(qr: QrLike, options: RenderSvgOptions = {}): string {
	if (
		!qr ||
		typeof qr.size !== "number" ||
		!qr.matrix ||
		typeof qr.matrix.get !== "function"
	) {
		throw new SvgError(SvgErrorCode.INVALID_QR_OBJECT, "Invalid QrLike object");
	}

	const opts = { ...DEFAULT_OPTIONS, ...options };
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

	const cornerRadius = opts.cornerRadius ?? opts.rx ?? 0;
	const grouping: Grouping = opts.grouping || "row";
	const rotateDeg = opts.renderer === "diamond" ? 45 : opts.rotateDeg || 0;
	const moduleRotateDeg = opts.moduleRotationDeg || 0;

	const totalSize = (qr.size + 2 * opts.margin) * opts.moduleSize;
	const rotatedSize = computeRotatedSize(totalSize, rotateDeg);
	const center = { x: totalSize / 2, y: totalSize / 2 };
	const offset = (rotatedSize - totalSize) / 2;

	let svg = "";
	if (opts.xmlDeclaration) {
		svg += '<?xml version="1.0" standalone="yes"?>\n';
	}
	let svgAttrs = `width="${rotatedSize}" height="${rotatedSize}"`;
	if (opts.viewBox) {
		svgAttrs += ` viewBox="0 0 ${rotatedSize} ${rotatedSize}"`;
	}
	if (opts.crispEdges) {
		svgAttrs += ` shape-rendering="crispEdges"`;
	}
	svg += `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttrs}>\n`;
	if (opts.lightColor !== "transparent") {
		svg += `  <rect x="0" y="0" width="${rotatedSize}" height="${rotatedSize}" fill="${opts.lightColor}"/>\n`;
	}
	svg += `  <g transform="translate(${offset} ${offset}) rotate(${rotateDeg} ${center.x} ${center.y})">\n`;

	const emitPolygon = (points: Point[]) => {
		const finalPoints =
			moduleRotateDeg && opts.moduleShape === "square"
				? points.map((p) =>
						rotatePoint(
							p,
							{
								x: (points[0].x + points[2].x) / 2,
								y: (points[0].y + points[2].y) / 2,
							},
							moduleRotateDeg,
						),
					)
				: points;
		svg += `${polygonFromPoints(finalPoints, opts.darkColor, cornerRadius)}\n`;
	};

	const emitDot = (x: number, y: number) => {
		svg += `${dotElement(
			x,
			y,
			opts.moduleSize,
			opts.darkColor,
			opts.moduleShape,
			cornerRadius,
			moduleRotateDeg,
		)}\n`;
	};

	const emitDiagRun = (
		startX: number,
		startY: number,
		length: number,
		dir: 1 | -1,
	) => {
		const dirX = 1 / Math.SQRT2;
		const dirY = dir === 1 ? 1 / Math.SQRT2 : -1 / Math.SQRT2;
		const perpX = -dirY;
		const perpY = dirX;
		const px = (startX + opts.margin) * opts.moduleSize;
		const py = (startY + opts.margin) * opts.moduleSize;
		const len = length * opts.moduleSize * Math.SQRT2;
		const p0 = { x: px, y: py };
		const p1 = { x: px + dirX * len, y: py + dirY * len };
		const p2 = {
			x: p1.x + perpX * opts.moduleSize,
			y: p1.y + perpY * opts.moduleSize,
		};
		const p3 = {
			x: px + perpX * opts.moduleSize,
			y: py + perpY * opts.moduleSize,
		};
		emitPolygon([p0, p1, p2, p3]);
	};

	if (grouping === "dot") {
		for (let y = 0; y < qr.size; y++) {
			for (let x = 0; x < qr.size; x++) {
				if (qr.matrix.get(x, y) === 1) {
					const px = (x + opts.margin) * opts.moduleSize;
					const py = (y + opts.margin) * opts.moduleSize;
					emitDot(px, py);
				}
			}
		}
	} else if (grouping === "col") {
		for (let x = 0; x < qr.size; x++) {
			let y = 0;
			while (y < qr.size) {
				if (qr.matrix.get(x, y) === 1) {
					let height = 1;
					while (y + height < qr.size && qr.matrix.get(x, y + height) === 1) {
						height++;
					}
					const px = (x + opts.margin) * opts.moduleSize;
					const py = (y + opts.margin) * opts.moduleSize;
					emitPolygon(
						rectPoints(px, py, opts.moduleSize, height * opts.moduleSize),
					);
					y += height;
				} else {
					y++;
				}
			}
		}
	} else if (grouping === "45" || grouping === "-45") {
		const dir: 1 | -1 = grouping === "45" ? -1 : 1;
		const minD = dir === 1 ? -(qr.size - 1) : 0;
		const maxD = dir === 1 ? qr.size - 1 : (qr.size - 1) * 2;
		for (let d = minD; d <= maxD; d++) {
			let run = 0;
			let runStartX = 0;
			let runStartY = 0;
			for (let x = 0; x < qr.size; x++) {
				const y = dir === 1 ? x - d : d - x;
				if (y < 0 || y >= qr.size) continue;
				if (qr.matrix.get(x, y) === 1) {
					if (run === 0) {
						runStartX = x;
						runStartY = y;
					}
					run++;
				} else if (run > 0) {
					emitDiagRun(runStartX, runStartY, run, dir);
					run = 0;
				}
			}
			if (run > 0) {
				emitDiagRun(runStartX, runStartY, run, dir);
			}
		}
	} else if (grouping === "blob") {
		// Combined row + col runs for a denser blob look.
		for (let y = 0; y < qr.size; y++) {
			let x = 0;
			while (x < qr.size) {
				if (qr.matrix.get(x, y) === 1) {
					let width = 1;
					while (x + width < qr.size && qr.matrix.get(x + width, y) === 1) {
						width++;
					}
					const px = (x + opts.margin) * opts.moduleSize;
					const py = (y + opts.margin) * opts.moduleSize;
					emitPolygon(
						rectPoints(px, py, width * opts.moduleSize, opts.moduleSize),
					);
					x += width;
				} else {
					x++;
				}
			}
		}
		for (let x = 0; x < qr.size; x++) {
			let y = 0;
			while (y < qr.size) {
				if (qr.matrix.get(x, y) === 1) {
					let height = 1;
					while (y + height < qr.size && qr.matrix.get(x, y + height) === 1) {
						height++;
					}
					const px = (x + opts.margin) * opts.moduleSize;
					const py = (y + opts.margin) * opts.moduleSize;
					emitPolygon(
						rectPoints(px, py, opts.moduleSize, height * opts.moduleSize),
					);
					y += height;
				} else {
					y++;
				}
			}
		}
	} else {
		for (let y = 0; y < qr.size; y++) {
			let x = 0;
			while (x < qr.size) {
				if (qr.matrix.get(x, y) === 1) {
					let width = 1;
					while (x + width < qr.size && qr.matrix.get(x + width, y) === 1) {
						width++;
					}
					const px = (x + opts.margin) * opts.moduleSize;
					const py = (y + opts.margin) * opts.moduleSize;
					emitPolygon(
						rectPoints(px, py, width * opts.moduleSize, opts.moduleSize),
					);
					x += width;
				} else {
					x++;
				}
			}
		}
	}

	svg += "  </g>\n";
	svg += "</svg>";
	return svg;
}
