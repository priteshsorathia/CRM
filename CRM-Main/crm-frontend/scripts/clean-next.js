const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const targets = [
  path.join(projectRoot, ".next"),
  path.join(projectRoot, "node_modules", ".cache"),
];

for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch (error) {
    // Best-effort cleanup; don't fail scripts if a path is locked/missing.
    console.warn(`[clean-next] Could not remove ${target}: ${error?.message || error}`);
  }
}

