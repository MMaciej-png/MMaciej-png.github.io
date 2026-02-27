#!/usr/bin/env node
/**
 * Rewrites commit messages using scripts/msg-filter.js as a git --msg-filter.
 *
 * Usage (from repo root):
 *   node scripts/rewrite-commit-messages.js
 *
 * WARNING: This rewrites history on the current branch (HEAD).
 * - You must have a CLEAN working tree (no uncommitted changes).
 * - If this branch is pushed, you will need to force-push:
 *     git push --force-with-lease
 */

const { execSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const msgFilterPath = path.join(__dirname, "msg-filter.js").replace(/\\/g, "/");

// Ensure working tree is clean.
const status = execSync("git status --porcelain", {
  cwd: repoRoot,
  encoding: "utf8",
});
if (status.trim()) {
  console.error("Working tree has uncommitted changes. Commit or stash them first.");
  process.exit(1);
}

const env = { ...process.env, FILTER_BRANCH_SQUELCH_WARNING: "1" };

try {
  const cmd = `git filter-branch -f --msg-filter "node \\"${msgFilterPath}\\"" HEAD`;
  execSync(cmd, {
    cwd: repoRoot,
    stdio: "inherit",
    env,
  });
  console.log(
    "\nDone rewriting commit messages. If this branch is pushed, run: git push --force-with-lease"
  );
} catch (err) {
  console.error("Error running git filter-branch:", err.message || err);
  process.exit(1);
}

