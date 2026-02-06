import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const CORE = path.join(ROOT, "packages/core/fixtures/bank.json");
const SOURCES = {
  android: path.join(
    ROOT,
    "apps/android/app/src/main/assets/fixtures/bank.json",
  ),
  ios: path.join(ROOT, "apps/ios/Resources/fixtures/bank.json"),
  web: path.join(ROOT, "apps/web/src/data/bank.json"),
};

function usage() {
  console.log(
    "Usage: node scripts/fixtures-pull.mjs --from android|ios|web|file [--path /path/to/bank.json]",
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
const fromIndex = args.indexOf("--from");
const pathIndex = args.indexOf("--path");
const from = fromIndex >= 0 ? args[fromIndex + 1] : null;
const providedPath = pathIndex >= 0 ? args[pathIndex + 1] : null;

if (!from) {
  usage();
  process.exit(1);
}

let sourcePath = null;
if (from === "file") {
  sourcePath = providedPath;
} else if (Object.prototype.hasOwnProperty.call(SOURCES, from)) {
  sourcePath = providedPath ?? SOURCES[from];
}

if (!sourcePath) {
  usage();
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Missing source bank file: ${sourcePath}`);
  process.exit(1);
}

copy(sourcePath, CORE);
