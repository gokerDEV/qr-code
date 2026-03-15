import fs from "node:fs";
import path from "node:path";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { toSvgString } from "../src/encode.js";

describe("QR Code Maximum Limit", () => {
	it("should generate and decode a very long text QR code", async () => {
		// ALPHANUMERIC limit is up to 4296 characters in Version 40 (Low ECC)
		// Let's create a long string (e.g. 2500 chars)
		const baseString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";
		const longText = baseString.repeat(70); // 70 * 37 = 2590 characters

		const svg = toSvgString(longText, {
			ecc: "L", // Lowest error correction allows maximum data
			render: {
				moduleSize: 10,
				margin: 4,
				darkColor: "#000000",
				lightColor: "#ffffff",
				viewBox: true,
			},
		});

		const outPng = path.resolve(process.cwd(), "test-max.png");
		const pngBuffer = await sharp(Buffer.from(svg))
			.png({ compressionLevel: 0 })
			.toBuffer();
		fs.writeFileSync(outPng, pngBuffer);

		const decoded = PNG.sync.read(pngBuffer);
		const data = new Uint8ClampedArray(decoded.data);
		const result = jsQR(data, decoded.width, decoded.height);

		expect(result).not.toBeNull();
		expect(result?.data).toBe(longText);

		// Clean up
		if (fs.existsSync(outPng)) {
			fs.unlinkSync(outPng);
		}
	});
});
