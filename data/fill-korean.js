/**
 * Fill content-ko.json with Korean translations from a map (normalized English → Korean).
 * Run from project root: node data/fill-korean.js
 */
const fs = require("fs");
const path = require("path");

const n = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\u2019/g, "'");

const contentPath = path.join(__dirname, "content-ko.json");
const mapPath = path.join(__dirname, "ko-translations.json");
const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));

let filled = 0;
let skipped = 0;

function fillKo(obj) {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(fillKo);
    return;
  }
  if (obj.en !== undefined) {
    const key = n(obj.en);
    const ko = map[key];
    if (ko) {
      obj.ko = ko;
      filled++;
    } else {
      skipped++;
    }
    return;
  }
  for (const v of Object.values(obj)) fillKo(v);
}

fillKo(content);
fs.writeFileSync(contentPath, JSON.stringify(content, null, 4), "utf8");
console.log("Filled", filled, "Korean entries. Skipped (no map):", skipped);
