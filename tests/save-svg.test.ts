import { describe, it } from "vitest";
import { toSvgString } from "../src/encode.js";
import fs from "node:fs";
import path from "node:path";

describe("Generate File", () => {
    it("should generate a valid QR code SVG and save it to test.svg", () => {
        const svg = toSvgString("https://example.com/test-qr", {
            ecc: "Q",
            render: {
                moduleSize: 10,
                margin: 4,
                darkColor: "#1a1a1a",
                lightColor: "#ffffff",
                viewBox: true,
            },
        });

        const outputPath = path.resolve(process.cwd(), "test.svg");
        fs.writeFileSync(outputPath, svg, "utf-8");

        //console.log(`\n\nSVG Saved to: ${outputPath}\n\n`);
    });
});
