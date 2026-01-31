import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		conditions: ["default"],
		alias: [
			{
				find: "qr-core",
				replacement: path.resolve(
					__dirname,
					"node_modules/qr-core/dist/src/index.js",
				),
			},
		],
	},
	test: {
		deps: {
			inline: ["qr-core"],
		},
	},
});
