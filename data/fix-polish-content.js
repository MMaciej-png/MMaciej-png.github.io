/**
 * Apply Polish ruleset fixes: remove duplicate (en,pl) sentences per register,
 * fix formal sentences that use informal "ty" to use Pan/Pani. Modifies content-pl.json in place.
 * Run from project root: node data/fix-polish-content.js
 */

const fs = require("fs");
const path = require("path");

const plPath = path.join(__dirname, "content-pl.json");
const content = JSON.parse(fs.readFileSync(plPath, "utf8"));

// Formal equivalents for sentences that were using informal Polish (direct translation, formal register)
// Only add Pan/Pani when the English implies formal address (e.g. "you" in a polite context). Do not add formal "you" when the English is neutral (e.g. "How are you now?").
const formalFixes = [
  { en: "Can you help me?", pl: "Czy mógłby Pan mi pomóc?" },
  { en: "What do you mean?", pl: "Co Pan ma na myśli?" },
  { en: "Can you already?", pl: "Czy już może Pan?" },
  { en: "Can you say it again?", pl: "Czy mógłby Pan powiedzieć jeszcze raz?" },
  { en: "Do you understand?", pl: "Czy rozumie Pan?" },
  { en: "Where are you?", pl: "Gdzie jest Pan?" },
  { en: "You're beautiful.", pl: "Jest Pani piękna." },
  { en: "You're handsome.", pl: "Jest Pan przystojny." },
];

const wordFixes = [
  { en: "boyfriend.", pl: "Chłopak" },
];

const sentenceFixes = [
  { en: "boyfriend.", pl: "To mój chłopak." },
];

function applyFormalFixes(moduleName, block) {
  if (!block || !block.sentences) return;
  const fixesByEn = new Map(formalFixes.map((f) => [f.en.trim(), f.pl]));
  for (const s of block.sentences) {
    const en = (s.en || "").trim();
    if (fixesByEn.has(en)) s.pl = fixesByEn.get(en);
  }
}

function applySentenceFixes(block) {
  if (!block || !block.sentences) return;
  const fixesByEn = new Map(sentenceFixes.map((f) => [f.en.trim(), f.pl]));
  for (const s of block.sentences) {
    const en = (s.en || "").trim();
    if (fixesByEn.has(en)) s.pl = fixesByEn.get(en);
  }
}

function applyWordFixes(block) {
  if (!block || !Array.isArray(block.words)) return;
  const fixesByEn = new Map(wordFixes.map((f) => [f.en.trim(), f.pl]));
  for (const w of block.words) {
    const en = (w.en || "").trim();
    if (fixesByEn.has(en)) w.pl = fixesByEn.get(en);
  }
}

function dedupeSentences(block) {
  if (!block || !Array.isArray(block.sentences)) return;
  const seen = new Set();
  block.sentences = block.sentences.filter((s) => {
    const key = `${(s.en || "").trim()}\n${(s.pl || "").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeWordsByEn(block) {
  if (!block || !Array.isArray(block.words)) return;
  const seen = new Set();
  block.words = block.words.filter((w) => {
    const en = (w.en || "").trim();
    if (seen.has(en)) return false;
    seen.add(en);
    return true;
  });
}

for (const [modName, module] of Object.entries(content)) {
  if (!module || typeof module !== "object") continue;
  for (const reg of ["neutral", "formal", "informal"]) {
    const block = module[reg];
    if (!block) continue;
    applyWordFixes(block);
    applySentenceFixes(block);
    dedupeWordsByEn(block);
    dedupeSentences(block);
    if (reg === "formal") applyFormalFixes(modName, block);
  }
}

fs.writeFileSync(plPath, JSON.stringify(content, null, 4) + "\n", "utf8");
console.log("Applied: sentence dedupe + formal Polish fixes. Run node data/check-polish.js to verify.");
