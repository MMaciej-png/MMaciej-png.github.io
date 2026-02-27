/**
 * Clean content-mo.json for flashcards (Moldovan only).
 * For all languages use: node data/cleanup-all-languages.js
 * Run from project root: node data/cleanup-moldovan-content.js
 */
const fs = require("fs");
const path = require("path");

const moPath = path.join(__dirname, "content-mo.json");
const content = JSON.parse(fs.readFileSync(moPath, "utf8"));

// Fix failed API responses that wrote "." as translation
const DOT_TRANSLATIONS = {
  condition: "Condiție",
  Able: "Capabil",
  Body: "Corp",
  "Right now": "Chiar acum",
};

// Usage-note parenthetical content to strip (so flashcards show direct translation only).
// Placeholders like (name), (nume), (time), (ora) are never in these lists.
const STRIP_EN = [
  "spoken", "formal", "re: a matter", "before sleeping", "polite", "alone",
  "yes-no question", "Right", "casual", "a sec", "a matter", "Tentang / Soal"
];
const STRIP_MO = [
  "vorbit", "formal", "re: o chestiune", "înainte de culcare", "politicos",
  "singur", "ocazional", "vorbită", "Dreapta"
];

function stripExplanatoryParens(text, stripList) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  // Strip " (usage note)" or " (usage note)." when the inner text is in stripList
  out = out.replace(/\s*\(([^)]+)\)\.?/g, (match, inner) => {
    const t = inner.trim();
    if (stripList.some((s) => t === s || t.toLowerCase() === s.toLowerCase()))
      return "";
    return match;
  });
  return out.replace(/\s+/g, " ").trim();
}

function processEntry(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(processEntry);
    return;
  }
  if ("en" in obj && "mo" in obj) {
    // Fix "." mo
    if (obj.mo === "." && obj.en) {
      obj.mo = DOT_TRANSLATIONS[obj.en] || obj.en;
    }
    // Strip explanatory parentheticals
    obj.en = stripExplanatoryParens(obj.en, STRIP_EN);
    obj.mo = stripExplanatoryParens(obj.mo, STRIP_MO);
    return;
  }
  Object.values(obj).forEach(processEntry);
}

processEntry(content);
fs.writeFileSync(moPath, JSON.stringify(content, null, 4), "utf8");
console.log("Cleaned", moPath);
