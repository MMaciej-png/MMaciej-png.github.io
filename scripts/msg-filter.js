#!/usr/bin/env node
/**
 * Git --msg-filter script to normalize commit messages.
 *
 * Reads the original commit message from stdin and writes a new message
 * (subject + optional body) to stdout.
 *
 * We:
 * - Keep merge commits as-is (they already reference PRs).
 * - Map very generic messages like "fix" / "fixes" / "bug fix" to Conventional Commits.
 * - Upgrade a few important subjects (e.g. Selection Bug Fix) and attach an issue ref.
 */

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

// Synthetic issue IDs per area so commits can reference issues like "Refs #3".
// Create matching GitHub issues with these numbers if you want UI links.
const ISSUE_FOR_SCOPE = {
  server: 1,
  chat: 2,
  selection: 3,
  translate: 4,
  content: 5,
  ui: 6,
  casual: 7,
  modes: 8,
  app: 9,
};

function inferScopeFromCommit(sha) {
  if (!sha) return { scope: null, files: [] };
  let files = [];
  try {
    const out = execSync(`git show --pretty="format:" --name-only ${sha}`, {
      cwd: repoRoot,
      encoding: "utf8",
    });
    files = out
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean);
  } catch {
    return { scope: null, files: [] };
  }

  const has = (prefix) => files.some((f) => f === prefix || f.startsWith(prefix));
  const onlyUnder = (prefix) => files.length && files.every((f) => f.startsWith(prefix));

  if (has("server.js")) return { scope: "server", files };
  if (has("engine/chatLLM.js")) return { scope: "chat", files };
  if (has("engine/selection.js")) return { scope: "selection", files };
  if (has("engine/translate.js")) return { scope: "translate", files };
  if (has("modes/casual.js")) return { scope: "casual", files };
  if (files.some((f) => f.startsWith("modes/"))) return { scope: "modes", files };
  if (onlyUnder("data/")) return { scope: "content", files };
  if (has("style.css") || files.some((f) => f.startsWith("ui/")) || has("index.html")) {
    return { scope: "ui", files };
  }
  return { scope: "app", files };
}

function buildScopedFixSubject(origType, scope) {
  const type = origType || "fix";
  if (!scope) return `${type}: bug fix`;

  let desc;
  switch (scope) {
    case "server":
      desc = "chat API server and CORS";
      break;
    case "chat":
      desc = "chat client and static-site handling";
      break;
    case "selection":
      desc = "card selection weighting and IDs";
      break;
    case "translate":
      desc = "normalisation and equivalence rules";
      break;
    case "content":
      desc = "content JSON and module structure";
      break;
    case "ui":
      desc = "layout and visual styling";
      break;
    case "casual":
      desc = "casual mode flow";
      break;
    case "modes":
      desc = "mode configuration";
      break;
    default:
      desc = "bug fix";
  }
  return `${type}(${scope}): ${desc}`;
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const lines = input.split(/\r?\n/);
  const originalSubject = (lines[0] || "").trim();
  const originalBody = lines.slice(1).join("\n").trim();

  const { subject: newSubject, extraBody } = transformSubject(originalSubject);

  let body = originalBody;
  if (extraBody) {
    body = body ? body + "\n" + extraBody : extraBody;
  }

  const out = body ? newSubject + "\n\n" + body : newSubject;
  process.stdout.write(out + "\n");
});

function transformSubject(subject) {
  const t = (subject || "").trim();
  const commitSha = process.env.GIT_COMMIT || "";
  const { scope } = inferScopeFromCommit(commitSha);

  if (!t) {
    return attachIssueRef({ subject: "chore: (empty message)" }, scope);
  }

  // Keep merge commits unchanged (they already refer to PRs like #1, #2).
  if (t.startsWith("Merge pull request")) {
    return { subject: t };
  }

  // Generic \"fixes\" commits – rewrite to scoped messages based on touched files.
  if (t === "fix: bug fix" || t === "feat: fixes") {
    const type = "fix";
    return attachIssueRef({ subject: buildScopedFixSubject(type, scope) }, scope);
  }

  // If this already looks like a Conventional Commit (and isn't one of the generic ones), keep it as-is.
  if (/^(feat|fix|chore|docs|refactor|style|test)(\([^)]+\))?:/i.test(t)) {
    return attachIssueRef({ subject: t }, scope);
  }

  // Exact overrides for important commits where we want clear names / issue refs.
  const overrides = {
    "Initial commit": { subject: "chore: initial commit" },
    "Mobile Version": { subject: "feat(ui): mobile version" },
    "Selection Bug Fix": {
      subject: "fix(selection): selection bug fix",
      extraBody: "Refs #1",
    },
    "New Words And Modules": {
      subject: "feat(content): new words and modules",
    },
    "New Content": {
      subject: "feat(content): new content",
    },
    "New Formal/Informal filter": {
      subject: "feat(ui): add formal/informal filter",
    },
    "Words/Sentences/All toggle": {
      subject: "feat(ui): add words/sentences/all toggle",
    },
    "Thanks module": {
      subject: "feat(content): thanks module",
    },
  };

  if (overrides[t]) return attachIssueRef({ ...overrides[t] }, scope);

  const lower = t.toLowerCase();

  if (lower === "fix" || lower === "fixes") {
    return attachIssueRef({ subject: "fix: bug fix" }, scope);
  }
  if (lower.includes("bug fix")) {
    return attachIssueRef({ subject: "fix: bug fix" }, scope);
  }
  if (lower.includes("final fix")) {
    return attachIssueRef({ subject: "fix: final fix" }, scope);
  }
  if (lower.startsWith("added ") || lower.startsWith("add ")) {
    return attachIssueRef({ subject: "feat: " + t.slice(6) }, scope);
  }
  if (lower.startsWith("new content")) {
    return attachIssueRef({ subject: "feat(content): new content" }, scope);
  }
  if (lower.startsWith("new words and modules")) {
    return attachIssueRef({ subject: "feat(content): new words and modules" }, scope);
  }
  if (lower.includes("normalisation")) {
    return attachIssueRef({ subject: "feat(translate): normalisation" }, scope);
  }
  if (lower.includes("translate.js fix")) {
    return attachIssueRef({ subject: "fix(translate): translate.js fix" }, scope);
  }
  if (lower.includes("selection fix")) {
    return attachIssueRef({ subject: "fix(selection): selection fix" }, scope);
  }
  if (lower.includes("tts duplicated")) {
    return attachIssueRef({ subject: "fix(tts): duplicated TTS" }, scope);
  }
  if (lower.includes("gap fills")) {
    return attachIssueRef({ subject: "feat(content): gap fills" }, scope);
  }
  if (lower.includes("reactions")) {
    return attachIssueRef({ subject: "feat(ui): reactions" }, scope);
  }
  if (lower.includes("places")) {
    return attachIssueRef({ subject: "feat(content): places" }, scope);
  }
  if (lower.includes("titles")) {
    return attachIssueRef({ subject: "feat(content): titles" }, scope);
  }
  if (lower.includes("categories")) {
    return attachIssueRef({ subject: "feat(content): categories" }, scope);
  }
  if (lower.includes("ai chat bot")) {
    return attachIssueRef({ subject: "feat(chat): add ai chat bot" }, scope);
  }
  if (lower.includes("added mic")) {
    return attachIssueRef({ subject: "feat(tts): add mic" }, scope);
  }

  // Default: keep the text but make it a chore.
  return attachIssueRef({ subject: "chore: " + t }, scope);
}

function attachIssueRef(result, scope) {
  const res = result || {};
  if (!res.extraBody && scope && ISSUE_FOR_SCOPE[scope]) {
    res.extraBody = `Refs #${ISSUE_FOR_SCOPE[scope]}`;
  }
  return res;
}

