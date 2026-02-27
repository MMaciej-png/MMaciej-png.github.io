/**
 * Apply manual translations from data/manual/{lang}.json into content-{lang}.json.
 * Keys in the manual file are English phrases; values are translations.
 * Only entries that are currently empty get filled (non-empty are left as-is).
 *
 * Run: node data/apply-manual-translations.js pl
 *      node data/apply-manual-translations.js pl fr ro
 */

const fs = require("fs");
const path = require("path");

const LANG_CODES = ["indo", "ja", "ko", "pl", "fr", "mo", "ro", "ru"];
const dir = __dirname;

function isEmpty(val) {
  return val === "" || val === undefined || (typeof val === "string" && !val.trim());
}

function applyTranslations(obj, langKey, manual, stats) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => applyTranslations(o, langKey, manual, stats));
    return;
  }
  if ("en" in obj && langKey in obj) {
    if (isEmpty(obj[langKey])) {
      const en = typeof obj.en === "string" ? obj.en.trim() : "";
      const translated = manual[en];
      if (typeof translated === "string" && translated.trim()) {
        obj[langKey] = translated.trim();
        stats.applied++;
      }
    }
    return;
  }
  Object.values(obj).forEach((v) => applyTranslations(v, langKey, manual, stats));
}

const args = process.argv.slice(2).filter((c) => LANG_CODES.includes(c));
if (args.length === 0) {
  console.error("Usage: node data/apply-manual-translations.js <lang> [lang ...]");
  console.error("Lang: " + LANG_CODES.join(", "));
  process.exit(1);
}

const manualDir = path.join(dir, "manual");

for (const lang of args) {
  const contentPath = path.join(dir, `content-${lang}.json`);
  const manualPath = path.join(manualDir, `${lang}.json`);
  if (!fs.existsSync(contentPath)) {
    console.log(lang + ": skip, no content file");
    continue;
  }
  if (!fs.existsSync(manualPath)) {
    console.log(lang + ": skip, no " + manualPath + " (create from " + lang + "-to-fill.json after filling)");
    continue;
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const manual = JSON.parse(fs.readFileSync(manualPath, "utf8"));
  const stats = { applied: 0 };
  applyTranslations(content, lang, manual, stats);
  fs.writeFileSync(contentPath, JSON.stringify(content, null, 4), "utf8");
  console.log(lang + ": applied " + stats.applied + " translations");
}

console.log("Done.");
