import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "dist", "web");
const buildId = process.env.GITHUB_SHA?.slice(0, 8) || `${Date.now()}`;

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const filesToCopy = ["index.html", "styles.css", "app.js", "third_party"];

for (const file of filesToCopy) {
  await cp(path.join(rootDir, file), path.join(outputDir, file), { recursive: true });
}

const outputIndexPath = path.join(outputDir, "index.html");
const indexHtml = await readFile(outputIndexPath, "utf8");
const cacheBustedHtml = indexHtml
  .replace("./third_party/bootstrap.min.css", `./third_party/bootstrap.min.css?v=${buildId}`)
  .replace("./styles.css", `./styles.css?v=${buildId}`)
  .replace("./third_party/bootstrap.bundle.min.js", `./third_party/bootstrap.bundle.min.js?v=${buildId}`)
  .replace("./app.js", `./app.js?v=${buildId}`);

await writeFile(outputIndexPath, cacheBustedHtml, "utf8");

console.log(`Built static web output in ${outputDir}.`);
