/**
 * Create content-mo.json from content-fr.json: same structure, each entry gets "mo": "".
 * Run once so the app can load en-mo; then fill in Moldovan/Romanian translations.
 * Run from project root: node data/create-content-mo.js
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..");
const frPath = path.join(DATA_DIR, "content-fr.json");
const moPath = path.join(DATA_DIR, "content-mo.json");
const content = JSON.parse(fs.readFileSync(frPath, "utf8"));

function addMoKey(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(addMoKey);
  if (Object.prototype.hasOwnProperty.call(obj, "en")) {
    const { fr, ...rest } = obj;
    return { ...rest, mo: obj.mo != null ? obj.mo : "" };
  }
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = addMoKey(v);
  return out;
}

const out = addMoKey(content);
fs.writeFileSync(moPath, JSON.stringify(out, null, 4), "utf8");
console.log("Wrote", moPath, "– add Moldovan/Romanian translations to each entry.");
