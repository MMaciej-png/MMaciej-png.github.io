/**
 * Create content-ko.json from content-en.json: same structure, each entry gets "ko": "".
 * Run once so the app can load en-ko without 404; then fill in Korean translations.
 * Run from project root: node data/create-content-ko.js
 */
const fs = require("fs");
const path = require("path");

const enPath = path.join(__dirname, "content-en.json");
const koPath = path.join(__dirname, "content-ko.json");
const content = JSON.parse(fs.readFileSync(enPath, "utf8"));

function addKoKey(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(addKoKey);
  if (Object.prototype.hasOwnProperty.call(obj, "en")) {
    return { ...obj, ko: obj.ko != null ? obj.ko : "" };
  }
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = addKoKey(v);
  return out;
}

const out = addKoKey(content);
fs.writeFileSync(koPath, JSON.stringify(out, null, 4), "utf8");
console.log("Wrote", koPath, "– add Korean translations to each entry.");
