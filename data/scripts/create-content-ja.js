/**
 * Create content-ja.json from content-en.json: same structure, each entry gets "ja": "".
 * Run once so the app can load en-ja without 404; then fill in Japanese translations.
 * Run from project root: node data/create-content-ja.js
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..");
const enPath = path.join(DATA_DIR, "content-en.json");
const jaPath = path.join(DATA_DIR, "content-ja.json");
const content = JSON.parse(fs.readFileSync(enPath, "utf8"));

function addJaKey(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(addJaKey);
  if (Object.prototype.hasOwnProperty.call(obj, "en")) {
    return { ...obj, ja: obj.ja != null ? obj.ja : "" };
  }
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = addJaKey(v);
  return out;
}

const out = addJaKey(content);
fs.writeFileSync(jaPath, JSON.stringify(out, null, 4), "utf8");
console.log("Wrote", jaPath, "– add Japanese translations to each entry.");
