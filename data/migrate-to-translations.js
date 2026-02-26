/**
 * One-time migration: convert NewContent.json from per-language keys
 * (english, indo, polish, french) to a single "translations" object per entry.
 * Run from project root: node data/migrate-to-translations.js
 *
 * Before: { "indo": "Halo", "english": "Hello", "polish": "Cześć", "french": "Bonjour" }
 * After:  { "translations": { "en": "Hello", "indo": "Halo", "pl": "Cześć", "fr": "Bonjour" } }
 */
const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "NewContent.json");
const content = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

function migrateEntry(obj) {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(migrateEntry);
    return;
  }
  const hasLangKeys =
    "english" in obj ||
    "eng" in obj ||
    "indo" in obj ||
    "indonesian" in obj ||
    "polish" in obj ||
    "french" in obj;
  if (hasLangKeys) {
    const en = String(obj.english ?? obj.eng ?? "").trim();
    const indo = String(obj.indo ?? obj.indonesian ?? "").trim();
    const pl = String(obj.polish ?? "").trim();
    const fr = String(obj.french ?? "").trim();
    obj.translations = { en, indo, pl, fr };
    delete obj.english;
    delete obj.eng;
    delete obj.indo;
    delete obj.indonesian;
    delete obj.polish;
    delete obj.french;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === "translations") continue;
    migrateEntry(v);
  }
}

migrateEntry(content);
fs.writeFileSync(jsonPath, JSON.stringify(content, null, 4), "utf8");
console.log("Migrated NewContent.json to translations format");
