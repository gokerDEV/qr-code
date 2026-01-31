import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            "qr-core": path.resolve(__dirname, "node_modules/qr-core/dist/src/index.js"),
        },
    },
});
