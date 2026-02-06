import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildConjugationFixtures,
  stringifyConjugationFixtures,
} from "./lib/conjugation-fixtures.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const bankPath = path.join(ROOT, "packages/core/fixtures/bank.json");
const targets = [
  path.join(ROOT, "packages/core/fixtures/conjugation.json"),
  path.join(ROOT, "apps/ios/Resources/fixtures/conjugation.json"),
  path.join(ROOT, "apps/android/app/src/main/assets/fixtures/conjugation.json"),
];

const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
const expected = stringifyConjugationFixtures(buildConjugationFixtures(bank));

const mismatches = [];
for (const target of targets) {
  if (!fs.existsSync(target)) {
    mismatches.push({ target, reason: "missing file" });
    continue;
  }
  const actual = fs.readFileSync(target, "utf8");
  if (actual !== expected) {
    mismatches.push({ target, reason: "content differs" });
  }
}

if (mismatches.length > 0) {
  console.error("Conjugation fixtures are out of sync:");
  for (const item of mismatches) {
    console.error(`- ${path.relative(ROOT, item.target)}: ${item.reason}`);
  }
  console.error("Run: node scripts/generate-conjugation.mjs");
  process.exit(1);
}

console.log("Conjugation fixtures are in sync.");
