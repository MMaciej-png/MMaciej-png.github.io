/**
 * Fix Indo-only leakage in Greetings (Well/Safe → same as Good).
 * For the same rules applied to ALL content (every module, words and sentences),
 * use: node data/apply-indo-rules-to-all.js
 *
 * Run from project root: node data/fix-greeting-words.js
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const LANG_CODES = ["ja", "ko", "pl", "fr", "mo", "ro", "ru"];
const GREETING_MODULES = ["Greetings (Basic)", "Greetings (Time-Based)"];

function fixWordsArray(words, langCode) {
  if (!Array.isArray(words) || !langCode) return 0;
  const goodEntry = words.find((e) => e && e.en === "Good");
  const goodVal = goodEntry && goodEntry[langCode] != null ? String(goodEntry[langCode]).trim() : "";
  if (!goodVal) return 0;
  let n = 0;
  for (const e of words) {
    if (!e || !e.en) continue;
    if (e.en === "Well" || e.en === "Safe") {
      if (e[langCode] !== goodVal) {
        e[langCode] = goodVal;
        n++;
      }
    }
  }
  return n;
}

function fixModule(moduleData, langCode) {
  let n = 0;
  if (moduleData.neutral && moduleData.neutral.words) {
    n += fixWordsArray(moduleData.neutral.words, langCode);
  }
  return n;
}

function fixContent(content, langCode) {
  let total = 0;
  for (const modName of GREETING_MODULES) {
    const mod = content[modName];
    if (mod) total += fixModule(mod, langCode);
  }
  return total;
}

function main() {
  for (const lang of LANG_CODES) {
    const filePath = path.join(DIR, `content-${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(lang + ": skip, no file");
      continue;
    }
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const n = fixContent(content, lang);
    if (n > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
      console.log(lang + ": fixed " + n + " Well/Safe → Good (greeting sense) in Greetings modules");
    } else {
      console.log(lang + ": no changes");
    }
  }
  console.log("Done.");
}

main();
