/**
 * Clean all content-{lang}.json for flashcards: fix failed "." translations, strip
 * explanatory parentheticals, remove Indonesian-specific section titles and entries.
 * Run from project root: node data/cleanup-all-languages.js
 * Optional: node data/cleanup-all-languages.js mo ru   (clean only those)
 */
const fs = require("fs");
const path = require("path");

const LANG_CODES = ["en", "indo", "ja", "ko", "pl", "fr", "mo", "ru"];

// Section titles: strip Indonesian (and similar) labels so all languages use neutral names.
const SECTION_TITLE_CLEAN = {
  "Conditions (Kalau)": "Conditions",
  "Moments (Pas)": "Moments",
  "With (Sama)": "With",
  "For (Buat)": "For",
  "Because (Karena / Soalnya)": "Because",
  "Inviting (Ayo / Yuk)": "Inviting",
  "Jakarta Pronouns (Gue / Lu)": "Informal pronouns",
  "About (Tentang / Soal)": "About",
};

// English entries to remove: Indonesian-specific, meta labels, or word-fragment suffixes.
const REMOVE_EN_ENTRIES = [
  "The one that",
  "emphasis",
  "Softener",
  "condition",
  "Condition",
  "\u2011ty",   // ‑ty (suffix fragment, U+2011 = non‑breaking hyphen)
  "-ty",
  "\u2011teen", // ‑teen (suffix fragment)
  "-teen",
];

// Usage-note parenthetical content to strip from English (all files).
const STRIP_EN = [
  "spoken", "formal", "re: a matter", "before sleeping", "polite", "alone",
  "yes-no question", "Right", "casual", "a sec", "a matter", "Tentang / Soal",
];

// Per-language: strip these from the target translation (usage notes in that language).
// Placeholders (name), (nume), (nom), etc. are never in these lists.
const STRIP_TARGET = {
  en: [],
  indo: [],
  ja: [],
  ko: [],
  pl: [],
  fr: [], // (nom) kept; (e)/(te)/(se) are grammatical, not usage notes
  mo: [
    "vorbit", "formal", "re: o chestiune", "înainte de culcare", "politicos",
    "singur", "ocazional", "vorbită", "Dreapta",
  ],
  ru: [
    "разговорный", "официально", "формально", "вежливо", "перед сном",
    "Справа", "устно", "отдельно", "разговорный разговор", "археология",
  ],
};

function stripExplanatoryParens(text, stripList) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  out = out.replace(/\s*\(([^)]+)\)\.?/g, (match, inner) => {
    const t = inner.trim();
    if (stripList.some((s) => t === s || t.toLowerCase() === s.toLowerCase()))
      return "";
    return match;
  });
  return out.replace(/\s+/g, " ").trim();
}

// All quote-like characters: straight ", curly/smart ", ", ", and guillemets « »
const QUOTE_CHARS = /["\u201C\u201D\u201E\u201F\u00AB\u00BB\\]/g;

// Remove speech marks (quotes) and stray XML/SSML tags from flashcard text.
function stripSpeechMarksAndTags(text) {
  if (!text || typeof text !== "string") return text;
  let out = text
    .replace(/^[\s"\\\u201C\u201D\u201E\u201F\u00AB\u00BB]+|[\s"\\\u201C\u201D\u201E\u201F\u00AB\u00BB]*"+[\s]*$/g, "")  // leading/trailing
    .replace(/\\"/g, "")
    .replace(QUOTE_CHARS, "")                        // any remaining quotes (straight, curly, guillemets)
    .replace(/<[^>]+>/g, "")                         // XML/SSML tags
    .replace(/^\s*-\s+/, "")                         // leading " - " (e.g. "- Haide." → "Haide.")
    .replace(/\s+/g, " ")
    .trim();
  return out;
}

function cleanSectionTitles(content) {
  for (const key of Object.keys(content)) {
    const clean = SECTION_TITLE_CLEAN[key];
    if (clean && clean !== key) {
      content[clean] = content[key];
      delete content[key];
    }
  }
}

function processContent(content, langKey) {
  const stripTarget = STRIP_TARGET[langKey] || [];

  function processEntry(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      // Remove Indonesian-specific entries (e.g. "The one that")
      for (let i = obj.length - 1; i >= 0; i--) {
        const item = obj[i];
        if (item && typeof item === "object" && "en" in item && REMOVE_EN_ENTRIES.includes(item.en))
          obj.splice(i, 1);
      }
      obj.forEach((o) => processEntry(o));
      return;
    }
    if ("en" in obj && (langKey === "en" || langKey in obj)) {
      // Fix "." translation (failed API): use English as fallback
      if (langKey !== "en" && obj[langKey] === "." && obj.en) {
        obj[langKey] = obj.en;
      }
      obj.en = stripExplanatoryParens(obj.en, STRIP_EN);
      obj.en = stripSpeechMarksAndTags(obj.en);
      if (langKey in obj) {
        obj[langKey] = stripExplanatoryParens(obj[langKey], stripTarget);
        obj[langKey] = stripSpeechMarksAndTags(obj[langKey]);
      }
      return;
    }
    Object.values(obj).forEach((v) => processEntry(v));
  }

  processEntry(content);
}

function main() {
  const args = process.argv.slice(2);
  const langs = args.length > 0 ? args.filter((c) => LANG_CODES.includes(c)) : LANG_CODES;

  for (const lang of langs) {
    const filePath = path.join(__dirname, `content-${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.log("Skip", lang, "- no file");
      continue;
    }
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    cleanSectionTitles(content);
    processContent(content, lang);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
    console.log("Cleaned", filePath);
  }
  console.log("Done.");
}

main();
