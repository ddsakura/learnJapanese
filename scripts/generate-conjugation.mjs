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
const outPath = path.join(ROOT, "packages/core/fixtures/conjugation.json");
const iosPath = path.join(ROOT, "apps/ios/Resources/fixtures/conjugation.json");
const androidPath = path.join(
  ROOT,
  "apps/android/app/src/main/assets/fixtures/conjugation.json",
);

const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
const fixtures = buildConjugationFixtures(bank);
const text = stringifyConjugationFixtures(fixtures);

fs.writeFileSync(outPath, text);
fs.writeFileSync(iosPath, text);
fs.writeFileSync(androidPath, text);

console.log(`Generated ${path.relative(ROOT, outPath)}`);
console.log(`Synced ${path.relative(ROOT, iosPath)}`);
console.log(`Synced ${path.relative(ROOT, androidPath)}`);
