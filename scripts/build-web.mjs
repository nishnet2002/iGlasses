import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "dist", "web");

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const filesToCopy = ["index.html", "styles.css", "app.js", "vendor"];

for (const file of filesToCopy) {
  await cp(path.join(rootDir, file), path.join(outputDir, file), { recursive: true });
}

console.log(`Built static web output in ${outputDir}.`);
