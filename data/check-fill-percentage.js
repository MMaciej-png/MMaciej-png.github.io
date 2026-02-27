/**
 * Report fill percentage per language: how many content entries have a non-empty
 * value for that language's key. Run from project root: node data/check-fill-percentage.js
 */

const fs = require("fs");
const path = require("path");

const LANG_CODES = ["indo", "ja", "ko", "pl", "fr", "mo", "ro", "ru"];

function isEmpty(val) {
  return val === "" || val === undefined || (typeof val === "string" && !val.trim());
}

function countEntries(obj, langKey, counts) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => countEntries(o, langKey, counts));
    return;
  }
  if ("en" in obj) {
    counts.total++;
    if (langKey in obj && !isEmpty(obj[langKey])) counts.filled++;
    return;
  }
  Object.values(obj).forEach((v) => countEntries(v, langKey, counts));
}

function main() {
  const dir = __dirname;
  console.log("Content fill percentage (filled / total entries)\n");

  for (const lang of LANG_CODES) {
    const filePath = path.join(dir, `content-${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(lang + ": no file");
      continue;
    }
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const counts = { total: 0, filled: 0 };
    countEntries(content, lang, counts);
    const pct = counts.total ? ((counts.filled / counts.total) * 100).toFixed(1) : "0";
    console.log(lang + ": " + counts.filled + " / " + counts.total + " (" + pct + "%)");
  }

  console.log("\nDone.");
}

main();
