#!/usr/bin/env node
/**
 * Builds a mapping of improved commit messages (conventional commits + issue refs).
 * Run from repo root. Output: scripts/commit-message-map.json (array in order oldest→newest).
 *
 * Usage: node scripts/build-commit-message-map.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const outPath = path.join(__dirname, "commit-message-map.json");

// Exact overrides: current subject -> { subject, body? }
// Use for unique messages where we want specific wording or issue links.
const OVERRIDES = {
  "Initial commit": { subject: "chore: initial commit" },
  "nes starting with '#' will be ignored, and an empty message aborts xXxXX": {
    subject: "chore: fix commit message (abort message)",
  },
  "added file": { subject: "chore: add file" },
  "changed rank names to match image names": {
    subject: "fix(data): align rank names with image names",
  },
  "Fixed File Directory": { subject: "fix: correct file directory" },
  "Mobile Version": { subject: "feat(ui): mobile version" },
  "Should be done": { subject: "chore: finalise changes" },
  "Added fixes": { subject: "fix: add fixes" },
  "fixed normalisation": { subject: "fix(translate): normalisation" },
  "Fixed Translate.js normalisation to include enclitic pronouns": {
    subject: "fix(translate): include enclitic pronouns in normalisation",
  },
  "rank update 200->500": { subject: "chore(data): rank update 200 to 500" },
  "Added New Module -Greetings and arrival- including sentences and words, and calculating weight by inclduing the frequency of when last words were last seen.":
    {
      subject:
        "feat(content): add Greetings and arrival module with weighted frequency",
    },
  "created module tabs": { subject: "feat(ui): add module tabs" },
  "Folders no longer reset on answer": {
    subject: "fix(ui): folders no longer reset on answer",
  },
  "fixed modules auto closing, and highlighted selected module, added current streak":
    {
      subject:
        "feat(ui): fix module auto-close, highlight selection, add current streak",
    },
  "multiple selection addition": {
    subject: "feat(selection): support multiple selection",
  },
  "bug where wrong answer locks the site.": {
    subject: "fix(selection): wrong answer no longer locks the site",
  },
  "fixed all module bug for infinite correct guesses": {
    subject: "fix(modules): fix infinite correct guesses for all module",
  },
  "fixed mysterious horizontal scroll bar": {
    subject: "fix(style): remove horizontal scroll bar",
  },
  "Words/Sentences/All toggle": {
    subject: "feat(ui): add Words/Sentences/All toggle",
  },
  "Smart module opening on every click": {
    subject: "fix(ui): smart module opening on click",
  },
  "added come and arrive equivelance": {
    subject: "feat(translate): add come/arrive equivalence",
  },
  "added equivelences": { subject: "feat(translate): add equivalences" },
  "New Formal/Informal filter": {
    subject: "feat(ui): add formal/informal filter",
  },
  "more options for word (Tasty)": {
    subject: "feat(content): more options for word (Tasty)",
  },
  "rework": { subject: "refactor: rework" },
  "Selection Bug Fix": {
    subject: "fix(selection): selection bug fix",
    body: "Refs #1",
  },
  "merge jakarta tokens filter": {
    subject: "feat(content): merge Jakarta tokens filter",
  },
  "display spoken": { subject: "feat(tts): display spoken" },
  "ai chat bot": { subject: "feat(chat): add AI chat bot" },
  "added mic": { subject: "feat(tts): add mic" },
  "fixed naming": { subject: "fix: fix naming" },
  "Added Ja, pl,fr,ko": {
    subject: "feat(content): add Japanese, Polish, French, Korean",
  },
};

// Patterns: regex or substring -> { type, scope?, template }
function applyPattern(s) {
  const t = s.trim();
  if (!t) return { subject: "chore: (empty message)" };
  if (OVERRIDES[t]) return OVERRIDES[t];

  const lower = t.toLowerCase();
  if (t.startsWith("Merge pull request")) return { subject: t };
  if (lower.includes("final fix")) return { subject: "fix: final fix" };
  if (lower.includes("bug fix 2")) return { subject: "fix: resolve bug" };
  if (lower.includes("bug fix")) return { subject: "fix: resolve bug" };
  if (lower === "fix" || lower === "fixes") return { subject: "fix: resolve issue" };
  if (lower.includes("selection fix"))
    return { subject: "fix(selection): selection fix" };
  if (lower.includes("point fix")) return { subject: "fix: point fix" };
  if (lower.includes("sr fix")) return { subject: "fix: sr fix" };
  if (lower.includes("image fix")) return { subject: "fix(ui): image fix" };
  if (lower.includes("fixed json")) return { subject: "fix(data): fix json" };
  if (lower.includes("fixed html")) return { subject: "fix: fix html" };
  if (lower.startsWith("added ") || lower.startsWith("add "))
    return { subject: "feat: " + t };
  if (lower.startsWith("new content"))
    return { subject: "feat(content): new content" };
  if (lower.startsWith("new words and modules"))
    return { subject: "feat(content): new words and modules" };
  if (lower.startsWith("new content")) return { subject: "feat(content): new content" };
  if (lower.includes("normalisation")) return { subject: "feat(translate): normalisation" };
  if (lower.includes("meaning and clarrification"))
    return {
      subject: "feat(content): meaning and clarification + categorising",
    };
  if (lower.includes("better json")) return { subject: "refactor(data): better json" };
  if (lower.includes("tts duplicated")) return { subject: "fix(tts): duplicated TTS" };
  if (lower.includes("gap fills")) return { subject: "feat(content): gap fills" };
  if (lower.includes("reactions")) return { subject: "feat(ui): reactions" };
  if (lower.includes("added normalisation"))
    return { subject: "feat(translate): add normalisation" };
  if (lower.includes("ordering")) return { subject: "chore(content): ordering" };
  if (lower.includes("titles")) return { subject: "feat(content): titles" };
  if (lower.includes("places")) return { subject: "feat(content): places" };
  if (lower.includes("categories")) return { subject: "feat(content): categories" };
  if (lower.includes("more")) return { subject: "feat: more" };
  if (lower.includes("jam")) return { subject: "feat(content): jam" };
  if (lower.includes("kalau")) return { subject: "feat(content): kalau" };
  if (lower.includes("thanks module")) return { subject: "feat(content): Thanks module" };
  if (lower.includes("softener bug")) return { subject: "fix: softener bug" };
  if (lower.includes("better selection")) return { subject: "fix(selection): better selection" };
  if (lower.includes("centering")) return { subject: "style(ui): centering" };
  if (lower.includes("laptop compat")) return { subject: "fix(ui): laptop compat" };
  if (lower.includes("mobile compat")) return { subject: "fix(ui): mobile compat" };
  if (lower.includes("title")) return { subject: "feat(content): title" };
  if (lower.includes("scrollbar css")) return { subject: "style: scrollbar css" };
  if (lower.includes("large text")) return { subject: "style(ui): large text" };
  if (lower.includes("translate.js fix"))
    return { subject: "fix(translate): Translate.js fix" };
  if (lower.includes("words bug fix")) return { subject: "fix(content): words bug fix" };
  if (lower.includes("added category")) return { subject: "feat(ui): added category for main" };
  if (lower.includes("added folders")) return { subject: "feat(ui): add folders for modules" };
  if (lower.includes("better css")) return { subject: "style: better css" };
  if (lower.includes("minor bug")) return { subject: "fix: minor bug" };
  if (lower.includes("added more words")) return { subject: "feat(content): add more words" };
  if (lower.includes("more content") || lower === "more content")
    return { subject: "feat(content): more content" };
  if (lower === "moreee") return { subject: "feat(content): more content" };
  if (lower.includes("added fixes")) return { subject: "fix: added fixes" };

  if (lower.startsWith("fix ")) return { subject: "fix: " + t.slice(4) };
  if (lower.startsWith("fixed ")) return { subject: "fix: " + t };
  if (lower.startsWith("fix: ")) return { subject: t };
  if (/^feat(\([^)]+\))?:/.test(t)) return { subject: t };
  return { subject: "chore: " + t };
}

function main() {
  const out = execSync("git log --reverse --format=%s", {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const subjects = out.split("\n").filter(Boolean);
  const mapping = subjects.map((s) => {
    const r = applyPattern(s);
    const line = r.body ? `${r.subject}\n\n${r.body}` : r.subject;
    return { subject: r.subject, body: r.body };
  });
  fs.writeFileSync(
    path.join(__dirname, "commit-message-map.json"),
    JSON.stringify(mapping, null, 2),
    "utf8"
  );
  console.log("Wrote commit-message-map.json with", mapping.length, "entries.");
}

main();
