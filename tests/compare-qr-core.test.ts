import qrcodegen from "nayuki-qr-code-generator";
import { encode } from "qr-core";
import { describe, expect, it } from "vitest";

function diffMatrices(
	getA: (x: number, y: number) => 0 | 1,
	getB: (x: number, y: number) => 0 | 1,
	size: number,
	limit = 50,
): string[] {
	const diffs: string[] = [];
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const a = getA(x, y);
			const b = getB(x, y);
			if (a !== b) {
				diffs.push(`(${x},${y}): core=${a} other=${b}`);
				if (diffs.length >= limit) return diffs;
			}
		}
	}
	return diffs;
}

describe("qr-core vs qrcode full matrix comparison", () => {
	it("should match module-by-module for fixed version/mask", () => {
		const text = "https://example.com/test-qr";
		const version = 3;
		const mask = 2;

		const core = encode(text, {
			ecc: "Q",
			version,
			mask,
			mode: "byte",
			strict: true,
		});

		const segs = qrcodegen.QrSegment.makeSegments(text);
		const other = qrcodegen.QrCode.encodeSegments(
			segs,
			qrcodegen.QrCode.Ecc.QUARTILE,
			version,
			version,
			mask,
			false,
		);

		expect(core.size).toBe(other.size);

		const coreGet = (x: number, y: number) => core.matrix.get(x, y);
		const otherGet = (x: number, y: number) => (other.getModule(x, y) ? 1 : 0);

		const diffs = diffMatrices(coreGet, otherGet, core.size);
		expect(
			diffs,
			`Matrix diffs (first ${diffs.length}):\n${diffs.join("\n")}`,
		).toEqual([]);
	});
});
