import { makeId } from "../engine/selection.js";
import { getItemStats } from "../engine/itemStats.js";
import {
  detectJakartaTokens,
  isJakartaFocusedModule,
  shouldExcludeWordFromPool,
  shouldExcludeSentenceFromPool,
  shouldExcludeModuleFromPool,
  isEnglishSoftenerOnly,
} from "../core/textTags.js";
import { stripAffixMarkers } from "../core/affixTags.js";
import {
  getLanguagePair,
  parsePair,
  LANGUAGES
} from "./languageConfig.js";

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

function getTranslation(entry, code) {
  const v = entry?.translations?.[code] ?? entry?.[code];
  if (v !== undefined && v !== null) return String(Array.isArray(v) ? v[0] : v).trim();
  const lang = byCode.get(code);
  if (!lang) return "";
  const key = lang.contentKey;
  const raw = entry[key] ?? (key === "english" ? entry.eng : null) ?? "";
  return String(raw).trim();
}

/** All accepted variants for a language (for answer checking). */
function getTranslationVariants(entry, code) {
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

  const getIndo = x => getTranslation(x, "indo");
  const getEng  = x => getTranslation(x, "en");

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
      const textA = getTranslation(x, langACode);
      const textB = getTranslation(x, langBCode);
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
    const textA = getTranslation(x, langACode);
    const textB = getTranslation(x, langBCode);
    if (!textA || !textB) return null;

    const pair = getLanguagePair();
    let variantsA = getTranslationVariants(x, langACode);
    let variantsB = getTranslationVariants(x, langBCode);

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

    const id = makeId(type, module, textA, textB, pair);
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

  for (const [moduleName, moduleData] of Object.entries(content)) {

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
          const item = mapItem(w, "word", moduleName, register);
          if (item) items.push(item);
        }

        /* ---------- SENTENCES ---------- */
        for (const s of block.sentences ?? []) {
          const item = mapItem(s, "sentence", moduleName, register);
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
      const item = mapItem(w, "word", moduleName, "neutral");
      if (item) items.push(item);
    }

    /* ---------- SENTENCES ---------- */
    for (const s of moduleData.sentences ?? []) {
      const item = mapItem(s, "sentence", moduleName, "neutral");
      if (item) items.push(item);
    }
  }

  return items;
}
