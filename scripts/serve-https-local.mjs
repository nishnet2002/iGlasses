import fs from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const port = Number(process.env.PORT || 4443);
const distDir = path.join(repoRoot, "dist", "web");
const certDir = path.join(repoRoot, ".cert");
const pfxPath = path.join(certDir, "glasses-local-dev.pfx");
const passwordPath = path.join(certDir, "glasses-local-dev.password.txt");

if (!fs.existsSync(distDir)) {
  console.error("Missing dist/web. Run `npm run build:web` first.");
  process.exit(1);
}

if (!fs.existsSync(pfxPath) || !fs.existsSync(passwordPath)) {
  console.error("Missing local HTTPS certificate files.");
  console.error("Run `npm run cert:local:https` first.");
  process.exit(1);
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function resolveRequestPath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname.split("?")[0]);
  const normalized = path.normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = path.join(distDir, normalized);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, "index.html");
  }

  return filePath;
}

function getAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return [...new Set(addresses)];
}

const server = https.createServer(
  {
    pfx: fs.readFileSync(pfxPath),
    passphrase: fs.readFileSync(passwordPath, "utf8").trim()
  },
  (request, response) => {
    const filePath = resolveRequestPath(request.url || "/");

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Unable to read requested file.");
        return;
      }

      response.writeHead(200, {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "no-store"
      });
      response.end(data);
    });
  }
);

server.listen(port, "0.0.0.0", () => {
  console.log(`HTTPS server running from ${distDir}`);
  console.log(`Local: https://localhost:${port}`);

  for (const address of getAddresses()) {
    console.log(`LAN: https://${address}:${port}`);
  }
});
