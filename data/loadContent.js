/**
 * Load content for a language pair. Uses separate content-{lang}.json files;
 * each file has the same structure and every entry includes "en" for alignment.
 * For pairs that include English, loads one file (e.g. content-indo.json).
 * For pairs without English, loads two files and merges by path.
 */

const LANG_CODES = ["en", "indo", "ja", "ko", "pl", "fr"];

function isEntry(obj) {
  return obj && typeof obj === "object" && !Array.isArray(obj) && "en" in obj;
}

function mergeEntries(entryA, entryB, langA, langB) {
  return {
    en: entryA.en ?? entryB.en ?? "",
    [langA]: entryA[langA] ?? "",
    [langB]: entryB[langB] ?? ""
  };
}

function mergeContent(a, b, langA, langB) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return a;
    return a.map((item, i) => mergeContent(item, b[i], langA, langB));
  }
  if (isEntry(a) && isEntry(b)) {
    return mergeEntries(a, b, langA, langB);
  }
  if (a && typeof a === "object" && b && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const out = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[key] !== undefined && b[key] !== undefined) {
        out[key] = mergeContent(a[key], b[key], langA, langB);
      } else {
        out[key] = a[key] ?? b[key];
      }
    }
    return out;
  }
  return a ?? b;
}

/**
 * Load content for the given pair. Returns content object where each entry
 * has "en" plus the two language keys (e.g. { en, indo, pl }).
 */
export async function loadContentForPair(langA, langB) {
  const base = "data/";
  if (langA === "en" || langB === "en") {
    const other = langA === "en" ? langB : langA;
    if (!LANG_CODES.includes(other)) return {};
    const res = await fetch(`${base}content-${other}.json`).then((r) => r.json());
    return res;
  }
  const [resA, resB] = await Promise.all([
    fetch(`${base}content-${langA}.json`).then((r) => r.json()),
    fetch(`${base}content-${langB}.json`).then((r) => r.json())
  ]);
  return mergeContent(resA, resB, langA, langB);
}
