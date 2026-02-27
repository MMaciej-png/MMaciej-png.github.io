/**
 * Split NewContent.json into one file per language. Every file has the same
 * structure; every entry includes the "en" (English) key for alignment.
 * Run from project root: node data/split-content-by-lang.js
 *
 * Output: content-en.json, content-indo.json, content-pl.json, content-fr.json
 */
const fs = require("fs");
const path = require("path");

const LANG_CODES = ["en", "indo", "ja", "ko", "pl", "fr", "mo", "ru"];
const srcPath = path.join(__dirname, "archive", "NewContent.json");
const content = JSON.parse(fs.readFileSync(srcPath, "utf8"));

function cloneStructure(src, langCode) {
  if (src === null || typeof src !== "object") return src;
  if (Array.isArray(src)) {
    return src.map((item) => cloneStructure(item, langCode));
  }
  if (src.translations) {
    const en = String(src.translations.en ?? "").trim();
    const val = String(src.translations[langCode] ?? "").trim();
    const out = { en };
    if (langCode !== "en" && val) out[langCode] = val;
    return out;
  }
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    out[k] = cloneStructure(v, langCode);
  }
  return out;
}

for (const code of LANG_CODES) {
  const out = cloneStructure(content, code);
  const outPath = path.join(__dirname, `content-${code}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 4), "utf8");
  console.log("Wrote", outPath);
}

console.log("Done. All files have 'en' keys; each file adds its language key.");
