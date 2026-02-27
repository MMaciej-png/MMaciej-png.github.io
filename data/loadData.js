import { makeId } from "../engine/selection.js";
import { getItemStats } from "../engine/itemStats.js";
import { normalise } from "../engine/translate.js";
import {
  detectJakartaTokens,
  isJakartaFocusedModule,
  shouldExcludeWordFromPool,
  shouldExcludeSentenceFromPool,
  shouldExcludeModuleFromPool,
  isEnglishSoftenerOnly,
} from "../core/textTags.js";
import { stripAffixMarkers } from "../core/affixTags.js";
import { getModuleId } from "./moduleIds.js";
import {
  getLanguagePair,
  parsePair,
  LANGUAGES
} from "./languageConfig.js";

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

/** Walk content tree and collect all entries that have "en". */
function collectEntries(obj, out) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => collectEntries(o, out));
    return;
  }
  if ("en" in obj) {
    out.push(obj);
    return;
  }
  Object.values(obj).forEach((v) => collectEntries(v, out));
}

/** Build map: normalised English -> one canonical entry (prefer entries with non-empty translations for langA, langB). */
function buildCanonicalByNormEn(content, langACode, langBCode) {
  const entries = [];
  collectEntries(content, entries);
  const map = new Map();
  for (const entry of entries) {
    const en = typeof entry.en === "string" ? entry.en.trim() : "";
    if (!en) continue;
    const normEn = normalise(en, "EN", false)[0];
    if (!normEn) continue;
    const existing = map.get(normEn);
    const hasA = (entry[langACode] ?? "").toString().trim();
    const hasB = (entry[langBCode] ?? "").toString().trim();
    const prefer = !existing || (hasA && hasB && (!(existing[langACode] ?? "").toString().trim() || !(existing[langBCode] ?? "").toString().trim()));
    if (prefer) map.set(normEn, entry);
  }
  return map;
}

function getTranslation(entry, code, canonicalByNormEn) {
  const en = typeof entry?.en === "string" ? entry.en.trim() : "";
  if (canonicalByNormEn && en) {
    const normEn = normalise(en, "EN", false)[0];
    const canon = normEn ? canonicalByNormEn.get(normEn) : null;
    if (canon) {
      const v = canon.translations?.[code] ?? canon[code];
      if (v !== undefined && v !== null) return String(Array.isArray(v) ? v[0] : v).trim();
      const lang = byCode.get(code);
      if (lang) {
        const raw = canon[lang.contentKey] ?? (lang.contentKey === "english" ? canon.eng : null) ?? "";
        if (raw !== undefined && raw !== null && String(raw).trim()) return String(raw).trim();
      }
    }
  }
  const v = entry?.translations?.[code] ?? entry?.[code];
  if (v !== undefined && v !== null) return String(Array.isArray(v) ? v[0] : v).trim();
  const lang = byCode.get(code);
  if (!lang) return "";
  const key = lang.contentKey;
  const raw = entry[key] ?? (key === "english" ? entry.eng : null) ?? "";
  return String(raw).trim();
}

/** All accepted variants for a language (for answer checking). Uses canonical entry after normalisation when provided. */
function getTranslationVariants(entry, code, canonicalByNormEn) {
  const en = typeof entry?.en === "string" ? entry.en.trim() : "";
  if (canonicalByNormEn && en) {
    const normEn = normalise(en, "EN", false)[0];
    const canon = normEn ? canonicalByNormEn.get(normEn) : null;
    if (canon) {
      const v = canon.translations?.[code] ?? canon[code];
      if (v !== undefined && v !== null) {
        if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
        return [String(v).trim()].filter(Boolean);
      }
    }
  }
  const v = entry?.translations?.[code] ?? entry?.[code];
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  return [String(v).trim()].filter(Boolean);
}

/** Optional reading (e.g. romaji for Japanese) to show above the text. */
function getReading(entry, code) {
  if (code === "ja") {
    const r = entry?.jaReading ?? entry?.translations?.jaReading ?? "";
    return String(r ?? "").trim();
  }
  if (code === "ko") {
    const r = entry?.koReading ?? entry?.translations?.koReading ?? "";
    return String(r ?? "").trim();
  }
  return "";
}

export async function loadItems() {
  const pair = getLanguagePair();
  const [langACode, langBCode] = parsePair(pair);
  const { loadContentForPair } = await import("./loadContent.js");
  const content = await loadContentForPair(langACode, langBCode);

  const canonicalByNormEn = buildCanonicalByNormEn(content, langACode, langBCode);
  const getT = (x, code) => getTranslation(x, code, canonicalByNormEn);
  const getTV = (x, code) => getTranslationVariants(x, code, canonicalByNormEn);

  const getIndo = x => getT(x, "indo");
  const getEng  = x => getT(x, "en");

  const VALID_REGISTERS = new Set(["formal", "informal", "neutral"]);

  /* ===============================
     MODULE WORD LOOKUP (for affix heuristics)
  =============================== */

  const normalizeWordParts = (indo) => {
    const t = stripAffixMarkers(String(indo ?? ""))
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s/-]/gu, " ");
    return t
      .split(/[\s/]+/g)
      .map(x => x.trim())
      .filter(Boolean);
  };

  const MODULE_WORDSETS = new Map(); // moduleName -> Set<string>
  const ensureWordSet = (moduleName) => {
    let s = MODULE_WORDSETS.get(moduleName);
    if (!s) {
      s = new Set();
      MODULE_WORDSETS.set(moduleName, s);
    }
    return s;
  };

  for (const [moduleName, moduleData] of Object.entries(content)) {
    const set = ensureWordSet(moduleName);

    if (moduleData.formal || moduleData.informal || moduleData.neutral) {
      for (const [register, block] of Object.entries(moduleData)) {
        if (!VALID_REGISTERS.has(register)) continue;
        if (!block) continue;
        for (const w of block.words ?? []) {
          const indo = getIndo(w);
          for (const part of normalizeWordParts(indo)) set.add(part);
        }
      }
    } else {
      for (const w of moduleData.words ?? []) {
        const indo = getIndo(w);
        for (const part of normalizeWordParts(indo)) set.add(part);
      }
    }
  }

  /* ===============================
     COLLECT VARIANTS (same source → multiple translations)
  =============================== */
  const variantsByKeyA = new Map(); // key (module|register|type|textA) → textB[]
  const variantsByKeyB = new Map(); // key (module|register|type|textB) → textA[]

  function collectVariants(entries, type, moduleName, register) {
    const reg = register ?? "neutral";
    for (const x of entries) {
      const textA = getT(x, langACode);
      const textB = getT(x, langBCode);
      if (!textA || !textB) continue;
      const keyA = `${moduleName}|${reg}|${type}|${textA}`;
      const keyB = `${moduleName}|${reg}|${type}|${textB}`;
      if (!variantsByKeyA.has(keyA)) variantsByKeyA.set(keyA, []);
      if (!variantsByKeyA.get(keyA).includes(textB)) variantsByKeyA.get(keyA).push(textB);
      if (!variantsByKeyB.has(keyB)) variantsByKeyB.set(keyB, []);
      if (!variantsByKeyB.get(keyB).includes(textA)) variantsByKeyB.get(keyB).push(textA);
    }
  }

  for (const [moduleName, moduleData] of Object.entries(content)) {
    if (moduleData.formal || moduleData.informal || moduleData.neutral) {
      for (const [register, block] of Object.entries(moduleData)) {
        if (!VALID_REGISTERS.has(register) || !block) continue;
        collectVariants(block.words ?? [], "word", moduleName, register);
        collectVariants(block.sentences ?? [], "sentence", moduleName, register);
      }
    } else {
      collectVariants(moduleData.words ?? [], "word", moduleName, "neutral");
      collectVariants(moduleData.sentences ?? [], "sentence", moduleName, "neutral");
    }
  }

  /* ===============================
     ITEM MAPPER (pair-aware)
  =============================== */

  const mapItem = (x, type, module, register) => {
    const textA = getT(x, langACode);
    const textB = getT(x, langBCode);
    if (!textA || !textB) return null;

    const pair = getLanguagePair();
    let variantsA = getTV(x, langACode);
    let variantsB = getTV(x, langBCode);

    const reg = register ?? "neutral";
    const keyA = `${module}|${reg}|${type}|${textA}`;
    const keyB = `${module}|${reg}|${type}|${textB}`;
    const collectedB = variantsByKeyA.get(keyA);
    const collectedA = variantsByKeyB.get(keyB);
    if (collectedB && collectedB.length > 0) variantsB = [...new Set([...collectedB, ...variantsB])];
    if (collectedA && collectedA.length > 0) variantsA = [...new Set([...collectedA, ...variantsA])];

    // For affix logic we need indo when pair includes indo
    const indoRaw = getIndo(x);
    const indo = indoRaw ? stripAffixMarkers(indoRaw) : "";

    const id = makeId(type, module, reg, textA, textB, pair, langACode, langBCode);
    const stats = getItemStats("casual", id);

    const jakartaTokens = detectJakartaTokens(indo);
    const pairIncludesIndo = langACode === "indo" || langBCode === "indo";
    const enText = getEng(x);
    let excludeFromPool =
      (pairIncludesIndo &&
        (shouldExcludeModuleFromPool(module) ||
          (type === "word" && indo && shouldExcludeWordFromPool(indo)) ||
          (type === "sentence" && indo && shouldExcludeSentenceFromPool(indo)))) ||
      (!pairIncludesIndo && enText && isEnglishSoftenerOnly(enText));

    const item = {
      id,
      type,
      module,
      register,
      langA: textA,
      langB: textB,
      langAVariants: variantsA.length ? variantsA : [textA],
      langBVariants: variantsB.length ? variantsB : [textB],
      langACode,
      langBCode,
      moduleWordSet: MODULE_WORDSETS.get(module),
      hasJakartaTokens: jakartaTokens.length > 0,
      jakartaTokens,
      moduleIsJakartaFocused: isJakartaFocusedModule(module),
      excludeFromPool,
      ...stats
    };
    if (langACode === "ja" || langACode === "ko") item.langAReading = getReading(x, langACode);
    if (langBCode === "ja" || langBCode === "ko") item.langBReading = getReading(x, langBCode);
    if (langACode === "indo" || langBCode === "indo") {
      item.indo = indo;
      item.indoRaw = indoRaw;
    }
    if (langACode === "en" || langBCode === "en") {
      item.eng = getEng(x);
    }
    return item;
  };

  /* ===============================
     BUILD ITEMS
  =============================== */

  const items = [];

  const pairIncludesIndo = langACode === "indo" || langBCode === "indo";

  for (const [moduleName, moduleData] of Object.entries(content)) {
    const moduleId = getModuleId(moduleName);
    // Jakarta / Chat & texting modules: only include items when Indonesian is in the pair.
    if (!pairIncludesIndo && isJakartaFocusedModule(moduleId)) continue;

    // ===============================
    // MODULE WITH REGISTERS
    // ===============================
    if (
      moduleData.formal ||
      moduleData.informal ||
      moduleData.neutral
    ) {
      for (const [register, block] of Object.entries(moduleData)) {
        if (!VALID_REGISTERS.has(register)) continue;
        if (!block) continue;

        /* ---------- WORDS ---------- */
        for (const w of block.words ?? []) {
          const item = mapItem(w, "word", moduleId, register);
          if (item) items.push(item);
        }

        /* ---------- SENTENCES ---------- */
        for (const s of block.sentences ?? []) {
          const item = mapItem(s, "sentence", moduleId, register);
          if (item) items.push(item);
        }
      }

      continue;
    }

    // ===============================
    // LEGACY / UNSPLIT MODULE
    // ===============================

    /* ---------- WORDS ---------- */
    for (const w of moduleData.words ?? []) {
      const item = mapItem(w, "word", moduleId, "neutral");
      if (item) items.push(item);
    }

    /* ---------- SENTENCES ---------- */
    for (const s of moduleData.sentences ?? []) {
      const item = mapItem(s, "sentence", moduleId, "neutral");
      if (item) items.push(item);
    }
  }

  return items;
}
