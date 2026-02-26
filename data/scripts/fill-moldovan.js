/**
 * Fill content-mo.json by translating empty "mo" from "en" using MyMemory free API (en -> ro).
 * Saves progress after each batch so you can re-run to resume. Preserves (name)->(nume) etc.
 * Run from project root: node data/fill-moldovan.js
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..");
const moPath = path.join(DATA_DIR, "content-mo.json");
let content = JSON.parse(fs.readFileSync(moPath, "utf8"));

const PLACEHOLDERS = [
  ["(name)", "(nume)"],
  ["(time)", "(ora)"],
  ["(place)", "(locul)"],
  ["(day)", "(ziua)"],
  ["(number)", "(numărul)"],
  ["(thing)", "(lucrul)"],
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateEnToRo(text) {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  const encoded = encodeURIComponent(trimmed);
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|ro`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus !== 200 || !data.responseData) return "";
    let out = data.responseData.translatedText;
    if (data.responseData.finished === 0 && data.responseData.match) out = data.responseData.match;
    if (!out || (out.trim() === ".")) return "";
    PLACEHOLDERS.forEach(([en, ro]) => {
      out = out.replace(new RegExp(en.replace(/[()]/g, "\\$&"), "gi"), ro);
    });
    return out.trim();
  } catch (e) {
    console.error("Translate error:", trimmed.slice(0, 40), e.message);
    return "";
  }
}

function collectEmpty(obj, list) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => collectEmpty(o, list));
    return;
  }
  if ("en" in obj && "mo" in obj && obj.mo === "") {
    list.push(obj);
    return;
  }
  Object.values(obj).forEach((v) => collectEmpty(v, list));
}

function save() {
  fs.writeFileSync(moPath, JSON.stringify(content, null, 4), "utf8");
  console.log("Saved", moPath);
}

async function main() {
  const entries = [];
  collectEmpty(content, entries);
  const uniqueEn = [...new Set(entries.map((e) => e.en))];
  console.log("Empty mo entries:", entries.length, "| Unique en to translate:", uniqueEn.length);
  if (uniqueEn.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const BATCH = 80;
  const DELAY_MS = 500;
  for (let b = 0; b < uniqueEn.length; b += BATCH) {
    const batch = uniqueEn.slice(b, b + BATCH);
    for (let i = 0; i < batch.length; i++) {
      const en = batch[i];
      const ro = await translateEnToRo(en);
      const value = ro && ro.trim() !== "." ? ro : "";
      entries.forEach((e) => {
        if (e.en === en) e.mo = value;
      });
      await sleep(DELAY_MS);
    }
    save();
    console.log("Translated", Math.min(b + BATCH, uniqueEn.length), "/", uniqueEn.length);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
