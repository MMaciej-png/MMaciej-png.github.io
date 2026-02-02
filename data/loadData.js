import { makeId } from "../engine/selection.js";
import { getItemStats } from "../engine/itemStats.js";
import {
  detectJakartaTokens,
  isJakartaFocusedModule,
  shouldExcludeWordFromPool
} from "../core/textTags.js";
import { stripAffixMarkers } from "../core/affixTags.js";

export async function loadItems() {
  const content = await fetch("../data/NewContent.json")
    .then(r => r.json());

  const getIndo = x => (x.indo ?? x.indonesian ?? "").trim();
  const getEng  = x => (x.english ?? x.eng ?? "").trim();

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
     ITEM MAPPER
  =============================== */

  const mapItem = (x, type, module, register) => {
    const indoRaw = getIndo(x);
    const eng  = getEng(x);
    if (!indoRaw || !eng) return null;

    // Learner-visible Indonesian should NOT show affix markers.
    const indo = stripAffixMarkers(indoRaw);

    // 🔒 ID MUST NEVER CHANGE
    // We canonicalize the indo string for IDs so adding markers later doesn't reset SR stats.
    const id = makeId(type, indo, eng);
    const stats = getItemStats("casual", id);

    const jakartaTokens = detectJakartaTokens(indo);
    let excludeFromPool =
      type === "word" && shouldExcludeWordFromPool(indo);

    return {
      id,
      type,
      module,
      register, // formal | informal | neutral
      indo,
      indoRaw,
      eng,
      moduleWordSet: MODULE_WORDSETS.get(module),
      hasJakartaTokens: jakartaTokens.length > 0,
      jakartaTokens,
      moduleIsJakartaFocused: isJakartaFocusedModule(module),
      excludeFromPool,
      ...stats
    };
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
