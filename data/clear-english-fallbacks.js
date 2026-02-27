/**
 * Clear entries where the language value is the same as English (leftover from
 * English fallback). Those slots become empty again so fill-all-languages.js
 * can re-translate them. Run from project root: node data/clear-english-fallbacks.js
 */

const fs = require("fs");
const path = require("path");

const LANG_CODES = ["indo", "ja", "ko", "pl", "fr", "mo", "ro", "ru"];

function clearEnglishFallbacks(obj, langKey, stats) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => clearEnglishFallbacks(o, langKey, stats));
    return;
  }
  if ("en" in obj && langKey in obj) {
    const en = typeof obj.en === "string" ? obj.en.trim() : "";
    const val = obj[langKey];
    if (typeof val === "string" && val.trim() === en) {
      obj[langKey] = "";
      stats.cleared++;
    }
    return;
  }
  Object.values(obj).forEach((v) => clearEnglishFallbacks(v, langKey, stats));
}

function main() {
  const dir = __dirname;
  console.log("Clearing entries where translation equals English (so they can be re-translated).\n");

  for (const lang of LANG_CODES) {
    const filePath = path.join(dir, `content-${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(lang + ": no file, skip");
      continue;
    }
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const stats = { cleared: 0 };
    clearEnglishFallbacks(content, lang, stats);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
    console.log(lang + ": cleared " + stats.cleared + " English-fallback entries");
  }

  console.log("\nDone. Run node data/fill-all-languages.js to re-translate empty entries.");
}

main();
