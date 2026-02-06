import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const CORE = path.join(ROOT, "packages/core/fixtures/bank.json");
const TARGETS = {
  android: path.join(
    ROOT,
    "apps/android/app/src/main/assets/fixtures/bank.json",
  ),
  ios: path.join(ROOT, "apps/ios/Resources/fixtures/bank.json"),
  web: path.join(ROOT, "apps/web/src/data/bank.json"),
};

function usage() {
  console.log(
    "Usage: node scripts/fixtures-push.mjs --to android|ios|web|all",
  );
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copy(src, dest) {
  ensureDir(dest);
  fs.copyFileSync(src, dest);
  console.log(`Synced ${path.relative(ROOT, src)} -> ${path.relative(ROOT, dest)}`);
}

const args = process.argv.slice(2);
const toIndex = args.indexOf("--to");
const target = toIndex >= 0 ? args[toIndex + 1] : "all";

if (!target) {
  usage();
  process.exit(1);
}

if (!fs.existsSync(CORE)) {
  console.error(`Missing core bank file: ${CORE}`);
  process.exit(1);
}

const selected =
  target === "all"
    ? Object.keys(TARGETS)
    : Object.prototype.hasOwnProperty.call(TARGETS, target)
      ? [target]
      : [];

if (selected.length === 0) {
  usage();
  process.exit(1);
}

selected.forEach((key) => copy(CORE, TARGETS[key]));
