import fs from "node:fs";
import path from "node:path";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { toSvgString } from "../src/encode.js";

describe("SVG -> PNG decode", () => {
	it("should decode SVG output with jsQR", async () => {
		const text = "https://example.com/test-qr";
		const svg = toSvgString(text, {
			ecc: "Q",
			render: {
				moduleSize: 10,
				margin: 4,
				darkColor: "#000000",
				lightColor: "#ffffff",
				viewBox: true,
			},
		});

		const outPng = path.resolve(process.cwd(), "test.png");
		const pngBuffer = await sharp(Buffer.from(svg))
			.png({ compressionLevel: 0 })
			.toBuffer();
		fs.writeFileSync(outPng, pngBuffer);

		const decoded = PNG.sync.read(pngBuffer);
		const data = new Uint8ClampedArray(decoded.data);
		const result = jsQR(data, decoded.width, decoded.height);

		expect(result).not.toBeNull();
		expect(result?.data).toBe(text);
	});
});
