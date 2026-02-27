/**
 * Remove or fix English words/sentences that don't fit their module.
 * E.g. in Greetings, "Well" and "Safe" were only there to map to Indonesian
 * "Selamat" — they don't mean greeting in English, so remove them from all content.
 * Config: REMOVE_IN_MODULE[moduleName][register][kind] = Set of "en" values to remove.
 *
 * Run from project root: node data/fix-module-misfits.js
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;

/** Words/sentences to remove in specific (module, register, kind). English label doesn't fit the module. */
const REMOVE_IN_MODULE = {
  "Greetings (Basic)": {
    neutral: {
      words: new Set(["Well", "Safe"]),
      sentences: new Set([]),
    },
    formal: { words: new Set([]), sentences: new Set([]) },
    informal: { words: new Set([]), sentences: new Set([]) },
  },
  "Greetings (Time-Based)": {
    neutral: {
      words: new Set(["Well", "Safe"]),
      sentences: new Set([]),
    },
    formal: { words: new Set([]), sentences: new Set([]) },
    informal: { words: new Set([]), sentences: new Set([]) },
  },
};

const ALL_CONTENT_FILES = [
  "content-en.json",
  "content-indo.json",
  "content-ja.json",
  "content-ko.json",
  "content-pl.json",
  "content-fr.json",
  "content-mo.json",
  "content-ro.json",
  "content-ru.json",
];

function getLangKey(filename) {
  const m = filename.match(/^content-(.+)\.json$/);
  return m ? m[1] : null;
}

function filterArray(arr, toRemove) {
  if (!toRemove || toRemove.size === 0) return arr;
  return arr.filter((entry) => {
    const en = entry && entry.en != null ? String(entry.en).trim() : "";
    return !toRemove.has(en);
  });
}

function processContent(content) {
  let totalRemoved = 0;
  for (const [moduleName, moduleData] of Object.entries(content)) {
    if (!moduleData || typeof moduleData !== "object") continue;
    const moduleRemoval = REMOVE_IN_MODULE[moduleName];
    if (!moduleRemoval) continue;

    const registers = moduleData.neutral || moduleData.formal || moduleData.informal
      ? ["neutral", "formal", "informal"]
      : [null];
    for (const reg of registers) {
      const block = reg ? moduleData[reg] : moduleData;
      if (!block) continue;
      const regKey = reg || "neutral";
      const removal = moduleRemoval[regKey];
      if (!removal) continue;

      for (const kind of ["words", "sentences"]) {
        const arr = block[kind];
        if (!Array.isArray(arr)) continue;
        const toRemove = removal[kind];
        const before = arr.length;
        const filtered = filterArray(arr, toRemove);
        const after = filtered.length;
        if (after < before) {
          block[kind] = filtered;
          totalRemoved += before - after;
        }
      }
    }
  }
  return totalRemoved;
}

function main() {
  let totalAcross = 0;
  for (const filename of ALL_CONTENT_FILES) {
    const filePath = path.join(DIR, filename);
    if (!fs.existsSync(filePath)) continue;
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const removed = processContent(content);
    if (removed > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
      const lang = getLangKey(filename) || filename;
      console.log(lang + ": removed " + removed + " misfit entries");
      totalAcross += removed;
    }
  }
  if (totalAcross === 0) {
    console.log("No misfit entries found (or already removed).");
  } else {
    console.log("Done. Total removed: " + totalAcross + " across all files.");
  }
}

main();
