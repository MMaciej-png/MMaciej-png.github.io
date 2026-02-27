/**
 * Apply Indonesian content rules to all other languages.
 * In Indonesian, the same word often maps multiple English labels (e.g. Good/Well/Safe → Selamat,
 * Come/Arrive → Datang, I/Me → Saya or Aku). This script finds every words[] and sentences[]
 * array, groups entries by identical Indonesian value, and in each other language sets all
 * entries in the same group to use the same translation (the one at the first index of the group).
 * So words and sentences follow the same rules as Indonesian everywhere.
 *
 * Run from project root: node data/apply-indo-rules-to-all.js
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const LANG_CODES = ["ja", "ko", "pl", "fr", "mo", "ro", "ru"];
const INDO_KEY = "indo";

/** Return list of { moduleName, register, kind, array } for every words/sentences array. */
function getArrays(content) {
  const out = [];
  for (const [moduleName, moduleData] of Object.entries(content)) {
    if (!moduleData || typeof moduleData !== "object") continue;
    const registers = moduleData.neutral || moduleData.formal || moduleData.informal
      ? ["neutral", "formal", "informal"]
      : [null];
    for (const reg of registers) {
      const block = reg ? moduleData[reg] : moduleData;
      if (!block) continue;
      for (const kind of ["words", "sentences"]) {
        const arr = block[kind];
        if (Array.isArray(arr)) out.push({ moduleName, register: reg, kind, array: arr });
      }
    }
  }
  return out;
}

/** Group indices by value of obj[indoKey]. Returns array of index arrays. */
function groupByValue(arr, indoKey) {
  const byVal = new Map();
  for (let i = 0; i < arr.length; i++) {
    const o = arr[i];
    if (!o || typeof o !== "object") continue;
    const v = o[indoKey];
    const key = v === undefined || v === null ? "__empty__" : String(v).trim();
    if (!byVal.has(key)) byVal.set(key, []);
    byVal.get(key).push(i);
  }
  return [...byVal.values()].filter((group) => group.length > 1);
}

/** Apply groups to lang array: for each group, set all entries to the translation at the first index. */
function applyGroups(arr, groups, langCode) {
  let n = 0;
  for (const indices of groups) {
    const firstVal = arr[indices[0]] && arr[indices[0]][langCode] != null
      ? String(arr[indices[0]][langCode]).trim()
      : "";
    if (!firstVal) continue;
    for (let j = 1; j < indices.length; j++) {
      const entry = arr[indices[j]];
      if (entry && entry[langCode] !== firstVal) {
        entry[langCode] = firstVal;
        n++;
      }
    }
  }
  return n;
}

function main() {
  const indoPath = path.join(DIR, "content-indo.json");
  if (!fs.existsSync(indoPath)) {
    console.error("Missing content-indo.json");
    process.exit(1);
  }
  const indoContent = JSON.parse(fs.readFileSync(indoPath, "utf8"));
  const indoArrays = getArrays(indoContent);

  for (const lang of LANG_CODES) {
    const filePath = path.join(DIR, `content-${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(lang + ": skip, no file");
      continue;
    }
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const langArrays = getArrays(content);
    if (langArrays.length !== indoArrays.length) {
      console.warn(lang + ": array count mismatch with Indo, skipping");
      continue;
    }
    let total = 0;
    for (let i = 0; i < indoArrays.length; i++) {
      const indoArr = indoArrays[i].array;
      const langArr = langArrays[i].array;
      if (!Array.isArray(langArr) || langArr.length !== indoArr.length) continue;
      const groups = groupByValue(indoArr, INDO_KEY);
      total += applyGroups(langArr, groups, lang);
    }
    if (total > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
      console.log(lang + ": applied Indo grouping rules, " + total + " entries aligned");
    } else {
      console.log(lang + ": no changes");
    }
  }
  console.log("Done.");
}

main();
