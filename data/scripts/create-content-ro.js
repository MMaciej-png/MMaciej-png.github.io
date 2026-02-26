/**
 * Create content-ro.json from content-mo.json: same structure, each entry gets "ro" from "mo".
 * Moldovan and Romanian use the same language; this gives Romanian its own content file.
 * Run from project root: node data/create-content-ro.js
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..");
const moPath = path.join(DATA_DIR, "content-mo.json");
const roPath = path.join(DATA_DIR, "content-ro.json");
const content = JSON.parse(fs.readFileSync(moPath, "utf8"));

function moToRo(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(moToRo);
  if (Object.prototype.hasOwnProperty.call(obj, "en")) {
    const { mo, ...rest } = obj;
    return { ...rest, ro: mo != null ? mo : "" };
  }
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = moToRo(v);
  return out;
}

const out = moToRo(content);
fs.writeFileSync(roPath, JSON.stringify(out, null, 4), "utf8");
console.log("Wrote", roPath, "– Romanian content (from Moldovan).");
