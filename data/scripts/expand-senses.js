/**
 * Expand multi-sense entries into one entry per sense.
 * E.g. Indonesian "Selamat" = Good/Well/Safe → in French we need one card per sense:
 *   Good↔Bon, Well↔Bien, Safe↔En sécurité.
 * Run from project root: node data/expand-senses.js
 */
const fs = require("fs");
const path = require("path");

const LANG_CODES = ["en", "indo", "ja", "ko", "pl", "fr"];
const DATA_DIR = path.join(__dirname, "..");

function isEntry(o) {
  return o && typeof o === "object" && !Array.isArray(o) && o.en !== undefined;
}

function getLen(entry) {
  let max = 1;
  for (const c of LANG_CODES) {
    const v = entry[c];
    if (Array.isArray(v) && v.length > max) max = v.length;
  }
  return max;
}

function getVal(v, j) {
  if (v === undefined || v === null) return "";
  return Array.isArray(v) ? (v[j] ?? "") : v;
}

/** Merge two content trees entry-by-entry (by path). */
function mergeTwo(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    return Array.from({ length: len }, (_, i) => mergeTwo(a[i], b[i]));
  }
  if (isEntry(a) && isEntry(b)) {
    return { ...a, ...b };
  }
  if (a && typeof a === "object" && b && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const out = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[key] !== undefined && b[key] !== undefined) {
        out[key] = mergeTwo(a[key], b[key]);
      } else {
        out[key] = a[key] ?? b[key];
      }
    }
    return out;
  }
  return a ?? b;
}

function mergeAll(files) {
  let acc = files[0];
  for (let i = 1; i < files.length; i++) acc = mergeTwo(acc, files[i]);
  return acc;
}

/** Resolve path in a nested object (path = array of keys). */
function getAt(root, pathArr) {
  let cur = root;
  for (const p of pathArr) cur = cur?.[p];
  return cur;
}

function expandAt(content, pathArr, index, length, mergedEntry, keysForFile) {
  const arr = getAt(content, pathArr);
  if (!Array.isArray(arr)) return;
  const newEntries = Array.from({ length }, (_, j) => {
    const entry = {};
    for (const k of keysForFile) {
      const val = getVal(mergedEntry[k], j);
      if (val !== undefined && val !== "") entry[k] = val;
    }
    return entry;
  });
  arr.splice(index, 1, ...newEntries);
}

/** Which keys each file has at this path (for building expanded entries). */
function getKeysForFile(fileContent, pathArr) {
  const entry = getAt(fileContent, pathArr);
  if (!entry || typeof entry !== "object") return ["en"];
  return Object.keys(entry).filter((k) => k === "en" || LANG_CODES.includes(k));
}

function main() {
  const files = {};
  for (const code of LANG_CODES) {
    const p = path.join(DATA_DIR, `content-${code}.json`);
    if (!fs.existsSync(p)) continue;
    files[code] = JSON.parse(fs.readFileSync(p, "utf8"));
  }

  const merged = mergeAll(Object.values(files));

  const expansions2 = [];
  function walk(obj, pathArr) {
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => walk(item, [...pathArr, i]));
      return;
    }
    if (isEntry(obj)) {
      const len = getLen(obj);
      if (len > 1) {
        const parentPath = pathArr.slice(0, -1);
        const index = pathArr[pathArr.length - 1];
        expansions2.push({ parentPath, index, length: len, mergedEntry: obj });
      }
      return;
    }
    if (obj && typeof obj === "object") {
      for (const [key, val] of Object.entries(obj)) {
        walk(val, [...pathArr, key]);
      }
    }
  }
  walk(merged, []);

  // Sort by path (stringified) and index descending so splice doesn't shift indices
  expansions2.sort((a, b) => {
    const pa = a.parentPath.join("\0");
    const pb = b.parentPath.join("\0");
    if (pa !== pb) return pa.localeCompare(pb);
    return b.index - a.index;
  });

  for (const { parentPath, index, length, mergedEntry } of expansions2) {
    for (const code of LANG_CODES) {
      if (!files[code]) continue;
      const keys = getKeysForFile(files[code], [...parentPath, index]);
      expandAt(files[code], parentPath, index, length, mergedEntry, keys);
    }
  }

  for (const code of LANG_CODES) {
    if (!files[code]) continue;
    const outPath = path.join(DATA_DIR, `content-${code}.json`);
    fs.writeFileSync(outPath, JSON.stringify(files[code], null, 4), "utf8");
    console.log("Wrote", outPath);
  }

  console.log("Expanded", expansions2.length, "multi-sense entries into one card per sense.");
}

main();
