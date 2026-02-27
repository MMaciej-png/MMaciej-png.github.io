#!/usr/bin/env node
/**
 * Rewrites git commit messages using scripts/commit-message-map.json.
 * Run from repo root. Creates a backup ref before rewriting.
 *
 * Prerequisites:
 *   1. Run: node scripts/build-commit-message-map.js
 *   2. Review scripts/commit-message-map.json and edit if needed
 *
 * Usage: node scripts/rewrite-commit-messages.js
 *
 * WARNING: This rewrites history. If you've already pushed, you'll need to
 * force-push (e.g. git push --force-with-lease). Coordinate with collaborators.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const counterPath = path.join(__dirname, ".commit-msg-counter");
const mapPath = path.join(__dirname, "commit-message-map.json");

if (!fs.existsSync(mapPath)) {
  console.error("Run build-commit-message-map.js first.");
  process.exit(1);
}

const status = execSync("git status --porcelain", { cwd: repoRoot, encoding: "utf8" });
if (status.trim()) {
  console.error("Working tree has uncommitted changes. Commit or stash them first.");
  process.exit(1);
}

// Reset counter so msg-filter uses indices 0, 1, 2, ...
fs.writeFileSync(counterPath, "0", "utf8");

const env = { ...process.env, FILTER_BRANCH_SQUELCH_WARNING: "1" };
try {
  execSync("git filter-branch -f --msg-filter \"node scripts/msg-filter.js\" HEAD", {
    cwd: repoRoot,
    stdio: "inherit",
    env,
  });
  console.log("\nDone. Backup ref: refs/original/refs/heads/<branch>");
  console.log("To remove backup: git update-ref -d refs/original/refs/heads/<branch>");
} finally {
  if (fs.existsSync(counterPath)) {
    fs.unlinkSync(counterPath);
  }
}
