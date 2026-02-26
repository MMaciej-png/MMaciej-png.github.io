/**
 * Convert "A / B / C" string values into arrays ["A", "B", "C"] in content-*.json.
 * So we store alternatives properly and the app can show one clean pair (first element).
 * Run from project root: node data/normalize-slash-alternatives.js
 */
const fs = require("fs");
const path = require("path");

const LANG_CODES = ["en", "indo", "ja", "ko", "pl", "fr"];

function splitSlash(s) {
  if (typeof s !== "string") return s;
  const trimmed = s.trim();
  if (!trimmed.includes(" / ")) return trimmed;
  return trimmed.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
}

function normalize(obj) {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(normalize);
    return;
  }
  if (isEntry(obj)) {
    for (const code of LANG_CODES) {
      if (obj[code] !== undefined && typeof obj[code] === "string" && obj[code].includes(" / ")) {
        obj[code] = splitSlash(obj[code]);
      }
    }
    return;
  }
  for (const v of Object.values(obj)) normalize(v);
}

function isEntry(o) {
  return o && typeof o === "object" && !Array.isArray(o) && "en" in o;
}

const DATA_DIR = path.join(__dirname, "..");
for (const code of LANG_CODES) {
  const filePath = path.join(DATA_DIR, `content-${code}.json`);
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  normalize(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf8");
  console.log("Normalized", filePath);
}

console.log("Done. Slash alternatives are now arrays; app shows first option.");
