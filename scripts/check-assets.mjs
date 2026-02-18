import fs from "node:fs";
import path from "node:path";

const requiredFiles = [
  "public/manifest.webmanifest",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
];

const cwd = process.cwd();
const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(cwd, relativePath)));

if (missing.length > 0) {
  console.error("Asset preflight failed. Missing required files:");
  for (const filePath of missing) {
    console.error(`- ${filePath}`);
  }
  process.exit(1);
}

console.log("Asset preflight passed.");
