/**
 * Export unique English phrases that have empty translation for a language.
 * Output: data/manual/{lang}-to-fill.json  (object: en -> "")
 * After filling translations, rename/copy to {lang}.json and run apply-manual-translations.js
 *
 * Run: node data/export-empty.js pl
 */

const fs = require("fs");
const path = require("path");

const LANG_CODES = ["indo", "ja", "ko", "pl", "fr", "mo", "ro", "ru"];
const dir = __dirname;

function isEmpty(val) {
  return val === "" || val === undefined || (typeof val === "string" && !val.trim());
}

function collectEmpty(obj, langKey, list) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => collectEmpty(o, langKey, list));
    return;
  }
  if ("en" in obj) {
    if (!(langKey in obj) || isEmpty(obj[langKey])) {
      list.push(obj.en);
      return;
    }
    return;
  }
  Object.values(obj).forEach((v) => collectEmpty(v, langKey, list));
}

const lang = process.argv[2];
if (!LANG_CODES.includes(lang)) {
  console.error("Usage: node data/export-empty.js <lang>");
  console.error("Lang: " + LANG_CODES.join(", "));
  process.exit(1);
}

const contentPath = path.join(dir, `content-${lang}.json`);
if (!fs.existsSync(contentPath)) {
  console.error("No file:", contentPath);
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const enList = [];
collectEmpty(content, lang, enList);
const unique = [...new Set(enList)].sort();
const toFill = {};
unique.forEach((en) => { toFill[en] = ""; });

const manualDir = path.join(dir, "manual");
if (!fs.existsSync(manualDir)) fs.mkdirSync(manualDir, { recursive: true });
const outPath = path.join(manualDir, `${lang}-to-fill.json`);
fs.writeFileSync(outPath, JSON.stringify(toFill, null, 2), "utf8");
console.log(lang + ": exported " + unique.length + " empty phrases to " + outPath);
