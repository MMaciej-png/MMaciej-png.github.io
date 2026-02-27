/**
 * Fill empty entries in content-{lang}.json using a translation API.
 * Uses MyMemory (free, no key): https://api.mymemory.translated.net
 * Saves after each batch so you can re-run to resume.
 *
 * Run from project root:
 *   node data/fill-all-languages.js           # fill all languages that have empty entries
 *   node data/fill-all-languages.js pl         # fill only Polish
 *   node data/fill-all-languages.js ru mo      # fill Russian and Moldovan
 *
 * First run: node data/ensure-full-structure.js pl  (so content-pl has same structure as en)
 */

const fs = require("fs");
const path = require("path");

const LANG_CODES = ["indo", "ja", "ko", "pl", "fr", "mo", "ro", "ru"];

/** MyMemory API target code (some differ from our code, e.g. indo -> id, mo -> ro). */
const MYMEMORY_CODE = {
  indo: "id",
  ja: "ja",
  ko: "ko",
  pl: "pl",
  fr: "fr",
  mo: "ro",
  ro: "ro",
  ru: "ru",
};

/** Placeholders to fix after translation: [english, target]. Keep (name) etc. in English in source. */
const PLACEHOLDERS = {
  indo: [
    ["(name)", "(nama)"],
    ["(time)", "(waktu)"],
    ["(place)", "(tempat)"],
    ["(day)", "(hari)"],
    ["(number)", "(angka)"],
    ["(thing)", "(benda)"],
  ],
  ja: [
    ["(name)", "(名前)"],
    ["(time)", "(時間)"],
    ["(place)", "(場所)"],
    ["(day)", "(日)"],
    ["(number)", "(数)"],
    ["(thing)", "(もの)"],
  ],
  ko: [
    ["(name)", "(이름)"],
    ["(time)", "(시간)"],
    ["(place)", "(장소)"],
    ["(day)", "(날)"],
    ["(number)", "(숫자)"],
    ["(thing)", "(것)"],
  ],
  pl: [
    ["(name)", "(imię)"],
    ["(time)", "(czas)"],
    ["(place)", "(miejsce)"],
    ["(day)", "(dzień)"],
    ["(number)", "(liczba)"],
    ["(thing)", "(rzecz)"],
  ],
  fr: [
    ["(name)", "(nom)"],
    ["(time)", "(heure)"],
    ["(place)", "(lieu)"],
    ["(day)", "(jour)"],
    ["(number)", "(nombre)"],
    ["(thing)", "(chose)"],
  ],
  mo: [
    ["(name)", "(nume)"],
    ["(time)", "(ora)"],
    ["(place)", "(locul)"],
    ["(day)", "(ziua)"],
    ["(number)", "(numărul)"],
    ["(thing)", "(lucrul)"],
  ],
  ro: [
    ["(name)", "(nume)"],
    ["(time)", "(ora)"],
    ["(place)", "(loc)"],
    ["(day)", "(ziua)"],
    ["(number)", "(număr)"],
    ["(thing)", "(lucru)"],
  ],
  ru: [
    ["(name)", "(имя)"],
    ["(time)", "(время)"],
    ["(place)", "(место)"],
    ["(day)", "(день)"],
    ["(number)", "(число)"],
    ["(thing)", "(вещь)"],
  ],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateViaMyMemory(trimmed, targetCode, retries = 2) {
  const langCode = MYMEMORY_CODE[targetCode] || targetCode;
  const encoded = encodeURIComponent(trimmed);
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${langCode}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.responseStatus !== 200 || !data.responseData) {
        if (attempt < retries) await sleep(1000);
        continue;
      }
      let out = data.responseData.translatedText;
      if (data.responseData.finished === 0 && data.responseData.match) out = data.responseData.match;
      if (!out || out.trim() === ".") return "";
      return out.trim();
    } catch (e) {
      if (attempt < retries) await sleep(1000);
      else console.error("MyMemory error:", trimmed.slice(0, 40), e.message);
    }
  }
  return "";
}

async function translateViaLibre(trimmed, targetCode, retries = 2) {
  // LibreTranslate: default to de.libretranslate.com as in the example snippet,
  // but allow overriding via LIBRETRANSLATE_URL for your own instance.
  const baseUrl = process.env.LIBRETRANSLATE_URL || "https://de.libretranslate.com/translate";
  const langCode = MYMEMORY_CODE[targetCode] || targetCode; // same mapping works (mo/ro etc.)
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: trimmed,
          source: "en", // source content is always English
          target: langCode,
          format: "text",
          alternatives: 1,
          api_key: process.env.LIBRETRANSLATE_API_KEY || "",
        }),
      });
      if (!res.ok) {
        if (attempt < retries) await sleep(1000);
        continue;
      }
      const raw = await res.text();
      // Server may return HTML error page instead of JSON
      const isJson = /^\s*\{/.test(raw);
      if (!isJson) {
        if (attempt < retries) await sleep(1000);
        else console.error("LibreTranslate: server returned non-JSON (e.g. HTML). Try another LIBRETRANSLATE_URL or use MyMemory.");
        continue;
      }
      const data = JSON.parse(raw);
      const out = (data && (data.translatedText || data.translation)) || "";
      if (!out || out.trim() === ".") return "";
      return out.trim();
    } catch (e) {
      if (attempt < retries) await sleep(1000);
      else console.error("LibreTranslate error:", trimmed.slice(0, 40), e.message);
    }
  }
  return "";
}

async function translate(text, targetCode, retries = 2) {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";

  // Optional override: set TRANSLATE_PROVIDER=mymemory to force MyMemory,
  // otherwise default to LibreTranslate first.
  const provider = (process.env.TRANSLATE_PROVIDER || "libre").toLowerCase();

  let out = "";
  if (provider === "libre") {
    // Only use LibreTranslate when explicitly requested.
    out = await translateViaLibre(trimmed, targetCode, retries);
  } else if (provider === "mymemory") {
    out = await translateViaMyMemory(trimmed, targetCode, retries);
  } else {
    // Fallback: try MyMemory then Libre if provider is unknown.
    out = await translateViaMyMemory(trimmed, targetCode, retries);
    if (!out) out = await translateViaLibre(trimmed, targetCode, retries);
  }

  if (!out) return "";

  const ph = PLACEHOLDERS[targetCode];
  if (ph) {
    ph.forEach(([en, repl]) => {
      out = out.replace(new RegExp(en.replace(/[()]/g, "\\$&"), "gi"), repl);
    });
  }
  return out.trim();
}

function isEmpty(val) {
  return val === "" || val === undefined || (typeof val === "string" && !val.trim());
}

function collectEmpty(obj, langKey, list) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => collectEmpty(o, langKey, list));
    return;
  }
  if ("en" in obj) {
    if (!(langKey in obj) || isEmpty(obj[langKey])) {
      if (!(langKey in obj)) obj[langKey] = "";
      list.push(obj);
      return;
    }
    return;
  }
  Object.values(obj).forEach((v) => collectEmpty(v, langKey, list));
}

async function fillLanguage(langCode) {
  const filePath = path.join(__dirname, `content-${langCode}.json`);
  if (!fs.existsSync(filePath)) {
    console.log("Skip", langCode, "- no file", filePath);
    return;
  }
  let content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const entries = [];
  collectEmpty(content, langCode, entries);
  const uniqueEn = [...new Set(entries.map((e) => e.en))];
  console.log(langCode + ":", "empty entries:", entries.length, "| unique en:", uniqueEn.length);
  if (uniqueEn.length === 0) {
    return;
  }

  const BATCH = 80;
  const DELAY_MS = 500;

  function save() {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
    console.log("  Saved", filePath);
  }

  for (let b = 0; b < uniqueEn.length; b += BATCH) {
    const batch = uniqueEn.slice(b, b + BATCH);
    for (let i = 0; i < batch.length; i++) {
      const en = batch[i];
      const translated = await translate(en, langCode);
      const value = translated && translated.trim() !== "." ? translated.trim() : "";
      entries.forEach((e) => {
        if (e.en === en) e[langCode] = value;
      });
      await sleep(DELAY_MS);
    }
    save();
    console.log("  Translated", Math.min(b + BATCH, uniqueEn.length), "/", uniqueEn.length);
  }
  console.log(langCode + ": done.");
}

async function main() {
  const args = process.argv.slice(2);
  const langs = args.length > 0 ? args.filter((c) => LANG_CODES.includes(c)) : LANG_CODES;
  if (langs.length === 0) {
    console.log("Usage: node data/fill-all-languages.js [indo ja ko pl fr mo ro ru]");
    console.log("No args = fill all languages. Args = fill only those.");
    process.exit(1);
  }
  console.log("Filling:", langs.join(", "));
  for (const lang of langs) {
    await fillLanguage(lang);
  }
  console.log("All done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
