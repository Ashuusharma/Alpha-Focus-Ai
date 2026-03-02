import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "app");

function getRouteFromPage(file) {
  const rel = path.relative(appDir, file).replace(/\\/g, "/");
  if (rel === "page.tsx") return "/";
  if (!rel.endsWith("/page.tsx")) return null;
  const route = "/" + rel.replace(/\/page\.tsx$/, "");
  return route === "/" ? "/" : route;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const appFiles = walk(appDir);
const routes = new Set(appFiles.map(getRouteFromPage).filter(Boolean));
const sourceFiles = appFiles.filter((f) => /\.(ts|tsx)$/.test(f));

const routeRegexes = [
  /router\.push\(\s*["'](\/[A-Za-z0-9_\-/\?=&#]*)["']\s*\)/g,
  /href=\s*["'](\/[A-Za-z0-9_\-/\?=&#]*)["']/g,
];

const missing = [];

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const regex of routeRegexes) {
    for (const match of content.matchAll(regex)) {
      const rawRoute = match[1];
      const route = rawRoute.split("?")[0];
      if (!routes.has(route) && !route.startsWith("/api/")) {
        missing.push({ file: path.relative(root, file), route });
      }
    }
  }
}

if (missing.length > 0) {
  console.error("Missing route targets detected:");
  for (const item of missing) {
    console.error(`- ${item.route} referenced in ${item.file}`);
  }
  process.exit(1);
}

console.log("Route existence check passed.");
