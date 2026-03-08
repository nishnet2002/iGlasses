import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const thirdPartyDir = path.join(rootDir, "third_party");

const assets = [
  {
    from: path.join(rootDir, "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css"),
    to: path.join(thirdPartyDir, "bootstrap.min.css")
  },
  {
    from: path.join(rootDir, "node_modules", "bootstrap", "dist", "js", "bootstrap.bundle.min.js"),
    to: path.join(thirdPartyDir, "bootstrap.bundle.min.js")
  },
  {
    from: path.join(rootDir, "node_modules", "three", "build", "three.module.js"),
    to: path.join(thirdPartyDir, "three.module.js")
  },
  {
    from: path.join(rootDir, "node_modules", "three", "build", "three.core.js"),
    to: path.join(thirdPartyDir, "three.core.js")
  }
];

await mkdir(thirdPartyDir, { recursive: true });

for (const asset of assets) {
  await copyFile(asset.from, asset.to);
}

console.log(`Prepared ${assets.length} local frontend assets in ${thirdPartyDir}.`);
