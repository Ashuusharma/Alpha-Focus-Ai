import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const CATEGORIES = [
  "acne",
  "dark_circles",
  "anti_aging",
  "hair_loss",
  "scalp_health",
  "beard_growth",
  "body_acne",
  "lip_care",
];

function readMatrixMode() {
  if (process.argv.includes("--full")) return "full";
  if (process.argv.includes("--budget")) return "budget";
  return process.env.E2E_MATRIX_MODE || "budget";
}

function ensureFixtureDir(workspace) {
  const dir = path.join(workspace, "artifacts", "e2e-fixtures");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFixture(filePath, base64) {
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
}

function createBadPhotoFixtures(workspace) {
  const dir = ensureFixtureDir(workspace);
  const fixtures = {
    black: path.join(dir, "black-1x1.png"),
    white: path.join(dir, "white-1x1.png"),
    tiny: path.join(dir, "tiny-2x2.png"),
  };

  // 1x1 black PNG
  writeFixture(fixtures.black, "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZkCsAAAAASUVORK5CYII=");
  // 1x1 white PNG
  writeFixture(fixtures.white, "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AABQEBAMM2kS8AAAAASUVORK5CYII=");
  // 2x2 tiny PNG
  writeFixture(fixtures.tiny, "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNkYGD4z8DAwMDEAAUAAfQBA5N4S2gAAAAASUVORK5CYII=");

  return fixtures;
}

function runCase(workspace, input) {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      E2E_CATEGORY: input.category,
      E2E_SCENARIO: input.scenario,
      E2E_SAMPLE_IMAGE: input.image,
      E2E_RESUME_DELAY_MS: String(input.resumeDelayMs || 2500),
      E2E_SKIP_DB_VERIFY: input.skipDbVerify ? "1" : "0",
      E2E_MOCK_GALAXY: input.mockGalaxy ? "1" : "0",
    };

    const child = spawn(process.execPath, ["scripts/e2e-flow-verify.mjs"], {
      cwd: workspace,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({ ok: code === 0, code: code || 0, stdout, stderr });
    });
  });
}

async function main() {
  const workspace = process.cwd();
  const defaultImage = path.join("public", "icons", "icon-512.png");
  const badFixtures = createBadPhotoFixtures(workspace);
  const mode = readMatrixMode();
  const defaultSkipDbVerify = (process.env.E2E_SKIP_DB_VERIFY || "1") === "1";
  const defaultMockGalaxy = (process.env.E2E_MOCK_GALAXY || "1") === "1";

  const cases = [];

  if (mode === "full") {
    for (const category of CATEGORIES) {
      cases.push({
        name: `category:${category}`,
        category,
        scenario: "standard",
        image: defaultImage,
        skipDbVerify: defaultSkipDbVerify,
        mockGalaxy: defaultMockGalaxy,
      });
    }

    cases.push(
      {
        name: "bad-photo:black",
        category: "acne",
        scenario: "standard",
        image: path.relative(workspace, badFixtures.black),
        skipDbVerify: defaultSkipDbVerify,
        mockGalaxy: defaultMockGalaxy,
      },
      {
        name: "bad-photo:white",
        category: "acne",
        scenario: "standard",
        image: path.relative(workspace, badFixtures.white),
        skipDbVerify: defaultSkipDbVerify,
        mockGalaxy: defaultMockGalaxy,
      },
      {
        name: "bad-photo:tiny",
        category: "acne",
        scenario: "standard",
        image: path.relative(workspace, badFixtures.tiny),
        skipDbVerify: defaultSkipDbVerify,
        mockGalaxy: defaultMockGalaxy,
      },
      {
        name: "behavior:leave-resume",
        category: "acne",
        scenario: "leave_resume",
        image: defaultImage,
        resumeDelayMs: 3500,
        skipDbVerify: defaultSkipDbVerify,
        mockGalaxy: defaultMockGalaxy,
      },
      {
        name: "behavior:repeat-scan",
        category: "acne",
        scenario: "repeat_scan",
        image: defaultImage,
        skipDbVerify: defaultSkipDbVerify,
        mockGalaxy: defaultMockGalaxy,
      }
    );
  } else {
    // Budget mode keeps API/database usage low on free tiers.
    cases.push(
      {
        name: "category:acne",
        category: "acne",
        scenario: "standard",
        image: defaultImage,
        skipDbVerify: true,
        mockGalaxy: true,
      },
      {
        name: "category:dark_circles",
        category: "dark_circles",
        scenario: "standard",
        image: defaultImage,
        skipDbVerify: true,
        mockGalaxy: true,
      },
      {
        name: "behavior:leave-resume",
        category: "acne",
        scenario: "leave_resume",
        image: defaultImage,
        resumeDelayMs: 2500,
        skipDbVerify: true,
        mockGalaxy: true,
      }
    );
  }

  process.stdout.write(`Matrix mode: ${mode} | cases: ${cases.length}\n`);

  const results = [];
  for (const testCase of cases) {
    process.stdout.write(`\n===== RUN ${testCase.name} =====\n`);
    const result = await runCase(workspace, testCase);
    results.push({ name: testCase.name, ...result });
  }

  const failed = results.filter((item) => !item.ok);
  const passed = results.length - failed.length;

  process.stdout.write("\n===== MATRIX SUMMARY =====\n");
  process.stdout.write(`Passed: ${passed}/${results.length}\n`);
  for (const item of results) {
    process.stdout.write(`${item.ok ? "PASS" : "FAIL"} ${item.name}\n`);
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack || ""}` : JSON.stringify(error);
  console.error("e2e-quality-matrix failed");
  console.error(message);
  process.exit(1);
});
