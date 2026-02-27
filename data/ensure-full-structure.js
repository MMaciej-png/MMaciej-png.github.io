/**
 * Ensure content-{lang}.json has the same structure as content-en.json:
 * every entry that has "en" also has the language key (set to "" if missing).
 *
 * Run:
 *   node data/ensure-full-structure.js pl           # one language
 *   node data/ensure-full-structure.js pl ja fr ko  # several
 *   node data/ensure-full-structure.js all-low       # ja, ko, pl, fr (languages often low)
 * Then run fill-all-languages.js to translate empty entries via API.
 */
const fs = require("fs");
const path = require("path");

const LANG_CODES = ["indo", "ja", "ko", "pl", "fr", "mo", "ro", "ru"];
const LOW_LANGUAGES = ["ja", "ko", "pl", "fr"];

const args = process.argv.slice(2);
const langCodes =
  args.length === 0
    ? ["pl"]
    : args[0] === "all-low"
      ? LOW_LANGUAGES
      : args.filter((c) => LANG_CODES.includes(c));

if (langCodes.length === 0) {
  console.error("Usage: node data/ensure-full-structure.js [all-low | lang codes...]");
  process.exit(1);
}

const enPath = path.join(__dirname, "content-en.json");
if (!fs.existsSync(enPath)) {
  console.error("Missing content-en.json");
  process.exit(1);
}
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

function ensureLangKey(enObj, langObj, key) {
  if (!enObj || typeof enObj !== "object") return langObj;
  if (Array.isArray(enObj)) {
    if (!Array.isArray(langObj)) return enObj.map((_, i) => ensureLangKey(enObj[i], (langObj && langObj[i]) || null, key));
    return enObj.map((enItem, i) => ensureLangKey(enItem, langObj[i], key));
  }
  if ("en" in enObj) {
    const out = { ...enObj };
    const existing = langObj && typeof langObj === "object" && key in langObj ? langObj[key] : undefined;
    const val = existing !== undefined && existing !== null && String(existing).trim() !== "" ? existing : "";
    out[key] = val;
    return out;
  }
  const out = {};
  for (const k of Object.keys(enObj)) {
    out[k] = ensureLangKey(enObj[k], langObj && langObj[k], key);
  }
  return out;
}

for (const langCode of langCodes) {
  const langPath = path.join(__dirname, `content-${langCode}.json`);
  if (!fs.existsSync(langPath)) {
    console.log("Skip", langCode, "- no file", langPath);
    continue;
  }
  const lang = JSON.parse(fs.readFileSync(langPath, "utf8"));
  const out = ensureLangKey(en, lang, langCode);
  fs.writeFileSync(langPath, JSON.stringify(out, null, 4), "utf8");
  console.log("Written", langPath, "- same structure as content-en, every entry has '" + langCode + "' key.");
}
console.log("Done. Run node data/fill-all-languages.js", langCodes.join(" "), "to fill empty entries via API.");
