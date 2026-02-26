/**
 * Language registry and pair state for language-pair switching.
 * Single source of truth: add a language here to support it app-wide.
 */

const STORAGE_KEY = "language_pair_v1";

export const LANGUAGES = [
  { code: "en", name: "English", ttsLocale: "en-GB", flagClass: "fi-gb", contentKey: "english" },
  { code: "indo", name: "Indonesian", ttsLocale: "id-ID", flagClass: "fi-id", contentKey: "indo" },
  { code: "ja", name: "Japanese", ttsLocale: "ja-JP", flagClass: "fi-jp", contentKey: "japanese" },
  { code: "ko", name: "Korean", ttsLocale: "ko-KR", flagClass: "fi-kr", contentKey: "korean" },
  { code: "pl", name: "Polish", ttsLocale: "pl-PL", flagClass: "fi-pl", contentKey: "polish" },
  { code: "fr", name: "French", ttsLocale: "fr-FR", flagClass: "fi-fr", contentKey: "french" },
];

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

/** Content key (in JSON) -> language code. 'eng' alias for English. */
export function getContentKeyToCode() {
  const m = new Map();
  for (const l of LANGUAGES) {
    m.set(l.contentKey, l.code);
    if (l.contentKey === "english") m.set("eng", l.code);
  }
  return m;
}

/** All valid unordered pairs, e.g. ["en-indo", "en-pl", "pl-indo"]. */
export function getAllPairs() {
  const codes = LANGUAGES.map((l) => l.code);
  const pairs = [];
  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      pairs.push(`${codes[i]}-${codes[j]}`);
    }
  }
  return pairs;
}

export function getLanguagePair() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const [a, b] = parsePair(raw);
    if (byCode.has(a) && byCode.has(b) && a !== b) return `${a}-${b}`;
  } catch (_) {}
  return "en-indo";
}

export function setLanguagePair(pair) {
  const [a, b] = parsePair(pair);
  if (!byCode.has(a) || !byCode.has(b) || a === b) return;
  try {
    localStorage.setItem(STORAGE_KEY, `${a}-${b}`);
  } catch (_) {}
}

export function getTtsLocale(code) {
  const l = byCode.get(code);
  return l ? l.ttsLocale : "en-GB";
}

export function getFlagClass(code) {
  const l = byCode.get(code);
  return l ? l.flagClass : "fi-gb";
}

export function getLanguageName(code) {
  const l = byCode.get(code);
  return l ? l.name : code;
}

/** Parse pair string into [langA, langB]. */
export function parsePair(pair) {
  const [a, b] = String(pair || "en-indo").split("-");
  return [a || "en", b || "indo"];
}

/** Return canonical pair string for two codes (order by LANGUAGES), or null if same. */
export function getCanonicalPair(codeA, codeB) {
  if (!codeA || !codeB || codeA === codeB) return null;
  const codes = LANGUAGES.map((l) => l.code);
  const i = codes.indexOf(codeA);
  const j = codes.indexOf(codeB);
  if (i === -1 || j === -1) return null;
  return i < j ? `${codeA}-${codeB}` : `${codeB}-${codeA}`;
}
