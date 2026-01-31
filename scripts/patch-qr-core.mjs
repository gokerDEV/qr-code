import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, "../node_modules/qr-core/package.json");

if (!fs.existsSync(pkgPath)) {
	process.exit(0);
}

const raw = fs.readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(raw);

const indexJs = "./dist/index.js";
const indexDts = "./dist/index.d.ts";

pkg.main = indexJs;
pkg.types = indexDts;

const exportsRoot = pkg.exports?.["."] ?? {};
exportsRoot.import = indexJs;
exportsRoot.default = indexJs;
exportsRoot.types = indexDts;
pkg.exports = { ...pkg.exports, ".": exportsRoot };

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
