/**
 * Create content-ru.json from content-fr.json: same structure, each entry gets "ru": "".
 * Run once so the app can load en-ru; then fill in Russian translations.
 * Run from project root: node data/create-content-ru.js
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..");
const frPath = path.join(DATA_DIR, "content-fr.json");
const ruPath = path.join(DATA_DIR, "content-ru.json");
const content = JSON.parse(fs.readFileSync(frPath, "utf8"));

function addRuKey(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(addRuKey);
  if (Object.prototype.hasOwnProperty.call(obj, "en")) {
    const { fr, ...rest } = obj;
    return { ...rest, ru: obj.ru != null ? obj.ru : "" };
  }
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = addRuKey(v);
  return out;
}

const out = addRuKey(content);
fs.writeFileSync(ruPath, JSON.stringify(out, null, 4), "utf8");
console.log("Wrote", ruPath, "– add Russian translations to each entry.");
