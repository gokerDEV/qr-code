import { QrLike, RenderSvgOptions, SvgError, SvgErrorCode } from "./types.js";

const DEFAULT_OPTIONS: Required<RenderSvgOptions> = {
    moduleSize: 4,
    margin: 4,
    darkColor: "#000",
    lightColor: "transparent",
    xmlDeclaration: false,
    viewBox: true,
    crispEdges: true,
};

export function renderSvg(qr: QrLike, options: RenderSvgOptions = {}): string {
    // Validate QR
    if (!qr || typeof qr.size !== "number" || !qr.matrix || typeof qr.matrix.get !== "function") {
        throw new SvgError(SvgErrorCode.INVALID_QR_OBJECT, "Invalid QrLike object");
    }

    // Merge defaults
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate Options
    if (opts.moduleSize <= 0 || !Number.isInteger(opts.moduleSize)) {
        throw new SvgError(
            SvgErrorCode.INVALID_OPTIONS,
            `Invalid moduleSize: ${opts.moduleSize}. Must be a positive integer.`
        );
    }
    if (opts.margin < 0 || opts.margin > 64 || !Number.isInteger(opts.margin)) {
        throw new SvgError(
            SvgErrorCode.INVALID_OPTIONS,
            `Invalid margin: ${opts.margin}. Must be an integer between 0 and 64.`
        );
    }

    const { size } = qr;
    const { moduleSize, margin, darkColor, lightColor, xmlDeclaration, viewBox, crispEdges } = opts;

    const totalSize = (size + 2 * margin) * moduleSize;

    let svg = "";
    if (xmlDeclaration) {
        svg += '<?xml version="1.0" standalone="yes"?>\n';
    }

    let svgAttrs = `width="${totalSize}" height="${totalSize}"`;
    if (viewBox) {
        svgAttrs += ` viewBox="0 0 ${totalSize} ${totalSize}"`;
    }
    if (crispEdges) {
        svgAttrs += ` shape-rendering="crispEdges"`;
    }

    svg += `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttrs}>\n`;

    // Background
    if (lightColor !== "transparent") {
        svg += `  <rect x="0" y="0" width="${totalSize}" height="${totalSize}" fill="${lightColor}"/>\n`;
    }

    // Modules (with horizontal run-length optimization)
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

    svg += "</svg>";
    return svg;
}
