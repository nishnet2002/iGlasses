import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const vendorDir = path.join(rootDir, "vendor");

const assets = [
  {
    from: path.join(rootDir, "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css"),
    to: path.join(vendorDir, "bootstrap.min.css")
  },
  {
    from: path.join(rootDir, "node_modules", "bootstrap", "dist", "js", "bootstrap.bundle.min.js"),
    to: path.join(vendorDir, "bootstrap.bundle.min.js")
  },
  {
    from: path.join(rootDir, "node_modules", "three", "build", "three.module.js"),
    to: path.join(vendorDir, "three.module.js")
  },
  {
    from: path.join(rootDir, "node_modules", "three", "build", "three.core.js"),
    to: path.join(vendorDir, "three.core.js")
  }
];

await mkdir(vendorDir, { recursive: true });

for (const asset of assets) {
  await copyFile(asset.from, asset.to);
}

console.log(`Prepared ${assets.length} local frontend assets in ${vendorDir}.`);
