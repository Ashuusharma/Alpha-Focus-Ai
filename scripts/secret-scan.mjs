import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignored = ["node_modules", ".next", ".git", "coverage"];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".env", ".yml", ".yaml", ".md"]);

const patterns = [
  /sk-[A-Za-z0-9]{20,}/g,
  /AIza[A-Za-z0-9_-]{20,}/g,
  /ghp_[A-Za-z0-9]{20,}/g,
  /BEGIN (RSA|OPENSSH|PRIVATE) KEY/g,
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (extensions.has(path.extname(entry.name)) || entry.name.startsWith('.env')) out.push(full);
  }
  return out;
}

const files = walk(root);
const hits = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const regex of patterns) {
    const match = text.match(regex);
    if (match) {
      hits.push({ file: path.relative(root, file), token: match[0] });
      break;
    }
  }
}

if (hits.length > 0) {
  console.error("Potential secrets detected:");
  for (const hit of hits) {
    console.error(`- ${hit.file}`);
  }
  process.exit(1);
}

console.log("Secret scan passed.");
