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
  if (!t) return { subject: "chore: (empty message)" };

  // If this already looks like a Conventional Commit, keep it as-is.
  if (/^(feat|fix|chore|docs|refactor|style|test)(\([^)]+\))?:/i.test(t)) {
    return { subject: t };
  }

  // Keep merge commits unchanged (they already refer to PRs like #1, #2).
  if (t.startsWith("Merge pull request")) {
    return { subject: t };
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

  if (overrides[t]) return overrides[t];

  const lower = t.toLowerCase();

  if (lower === "fix" || lower === "fixes") {
    return { subject: "fix: bug fix" };
  }
  if (lower.includes("bug fix")) {
    return { subject: "fix: bug fix" };
  }
  if (lower.includes("final fix")) {
    return { subject: "fix: final fix" };
  }
  if (lower.startsWith("added ") || lower.startsWith("add ")) {
    return { subject: "feat: " + t.slice(6) };
  }
  if (lower.startsWith("new content")) {
    return { subject: "feat(content): new content" };
  }
  if (lower.startsWith("new words and modules")) {
    return { subject: "feat(content): new words and modules" };
  }
  if (lower.includes("normalisation")) {
    return { subject: "feat(translate): normalisation" };
  }
  if (lower.includes("translate.js fix")) {
    return { subject: "fix(translate): translate.js fix" };
  }
  if (lower.includes("selection fix")) {
    return { subject: "fix(selection): selection fix" };
  }
  if (lower.includes("tts duplicated")) {
    return { subject: "fix(tts): duplicated TTS" };
  }
  if (lower.includes("gap fills")) {
    return { subject: "feat(content): gap fills" };
  }
  if (lower.includes("reactions")) {
    return { subject: "feat(ui): reactions" };
  }
  if (lower.includes("places")) {
    return { subject: "feat(content): places" };
  }
  if (lower.includes("titles")) {
    return { subject: "feat(content): titles" };
  }
  if (lower.includes("categories")) {
    return { subject: "feat(content): categories" };
  }
  if (lower.includes("ai chat bot")) {
    return { subject: "feat(chat): add ai chat bot" };
  }
  if (lower.includes("added mic")) {
    return { subject: "feat(tts): add mic" };
  }

  // Default: keep the text but make it a chore.
  return { subject: "chore: " + t };
}

