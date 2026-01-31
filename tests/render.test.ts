import { describe, it, expect } from "vitest";
import { renderSvg } from "../src/render.js";
import { toSvgString } from "../src/encode.js";
import { SvgErrorCode, SvgError } from "../src/types.js";

// Mock QrLike object for testing renderSvg directly
const mockQr = {
    size: 3,
    matrix: {
        get: (x: number, y: number) => {
            // Simple 3x3 pattern:
            // 1 0 1
            // 0 1 0
            // 1 0 1
            if ((x === 0 && y === 0) || (x === 2 && y === 0) ||
                (x === 1 && y === 1) ||
                (x === 0 && y === 2) || (x === 2 && y === 2)) {
                return 1 as const;
            }
            return 0 as const;
        },
    },
};

describe("renderSvg", () => {
    it("should render a basic SVG", () => {
        const svg = renderSvg(mockQr, {
            moduleSize: 10,
            margin: 0,
            darkColor: "#000",
            lightColor: "#fff",
        });

        expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" shape-rendering="crispEdges">');
        expect(svg).toContain('<rect x="0" y="0" width="30" height="30" fill="#fff"/>');
        // Top-left
        expect(svg).toContain('<rect x="0" y="0" width="10" height="10" fill="#000"/>');
        // Top-right
        expect(svg).toContain('<rect x="20" y="0" width="10" height="10" fill="#000"/>');
    });

    it("should throw error for invalid moduleSize", () => {
        expect(() => renderSvg(mockQr, { moduleSize: 0 })).toThrow(SvgError);
        try {
            renderSvg(mockQr, { moduleSize: 0 });
        } catch (e) {
            expect((e as SvgError).code).toBe(SvgErrorCode.INVALID_OPTIONS);
        }
    });

    it("should respect transparent background", () => {
        const svg = renderSvg(mockQr, { lightColor: "transparent" });
        expect(svg).not.toContain('fill="transparent"');
        // It should NOT render a background rect if transparent (optimization)
        // Wait, looking at implementation:
        // if (lightColor !== "transparent") { ... }
        // So if it IS transparent, no rect.
        expect(svg).not.toMatch(/<rect[^>]*width="[^"]*"[^>]*height="[^"]*"[^>]*fill="transparent"/);
    });
});

describe("toSvgString", () => {
    it("should generate a valid QR code SVG from string", () => {
        // This integration test relies on qr-core being available.
        // Since we are mocking the environment or relying on the real one, 
        // valid input should produce a valid SVG string.
        const svg = toSvgString("hello world", {
            ecc: "L",
            render: { moduleSize: 2, margin: 4 }
        });

        expect(svg).toContain("<svg");
        expect(svg).toContain("</svg>");
        expect(svg).toContain('fill="#000"');
    });
});
