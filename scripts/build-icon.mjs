import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");
const svgPath = path.join(buildDir, "icon.svg");
const pngPath = path.join(buildDir, "icon.png");
const icoPath = path.join(buildDir, "icon.ico");

await mkdir(buildDir, { recursive: true });

const svg = await readFile(svgPath);
const renderPng = (size) => {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: size
    },
    font: {
      loadSystemFonts: true
    }
  });

  return resvg.render().asPng();
};

const pngBuffer = renderPng(512);
await writeFile(pngPath, pngBuffer);

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffer = await pngToIco(icoSizes.map((size) => renderPng(size)));
await writeFile(icoPath, icoBuffer);

console.log(`Built icon assets at ${pngPath} and ${icoPath}.`);
