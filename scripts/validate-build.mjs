import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const requiredPaths = [
  "index.html",
  "app.js",
  "styles.css",
  "build/icon.png",
  "build/icon.ico",
  "electron/main.js",
  "third_party/bootstrap.min.css",
  "third_party/bootstrap.bundle.min.js",
  "third_party/three.module.js",
  "third_party/three.core.js"
];

for (const relativePath of requiredPaths) {
  await access(path.join(rootDir, relativePath));
}

console.log(`Validated ${requiredPaths.length} required build inputs.`);
