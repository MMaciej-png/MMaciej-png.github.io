/**
 * Fill content-ja.json with Japanese translations from a map (normalized English → Japanese).
 * Run from project root: node data/fill-japanese.js
 */
const fs = require("fs");
const path = require("path");

const n = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\u2019/g, "'");

const contentPath = path.join(__dirname, "content-ja.json");
const mapPath = path.join(__dirname, "ja-translations.json");
const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));

let filled = 0;
let skipped = 0;

function fillJa(obj) {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(fillJa);
    return;
  }
  if (obj.en !== undefined) {
    const key = n(obj.en);
    const ja = map[key];
    if (ja) {
      obj.ja = ja;
      filled++;
    } else {
      skipped++;
    }
    return;
  }
  for (const v of Object.values(obj)) fillJa(v);
}

fillJa(content);
fs.writeFileSync(contentPath, JSON.stringify(content, null, 4), "utf8");
console.log("Filled", filled, "Japanese entries. Skipped (no map):", skipped);
