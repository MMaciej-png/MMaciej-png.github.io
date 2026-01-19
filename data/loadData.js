import { makeId } from "../engine/selection.js";
import { getItemStats } from "../engine/itemStats.js";

export async function loadItems() {
  const content = await fetch("../data/NewContent.json")
    .then(r => r.json());

  const getIndo = x => (x.indo ?? x.indonesian ?? "").trim();
  const getEng  = x => (x.english ?? x.eng ?? "").trim();

  /* ===============================
     PASS 1: DETECT UNIVERSAL WORDS
  =============================== */

  // key: `${module}|${indo}` -> Set("formal", "informal")
  const wordRegisterMap = new Map();

  for (const [moduleName, moduleData] of Object.entries(content)) {
    if (!moduleData.formal && !moduleData.informal) continue;

    for (const [register, block] of Object.entries(moduleData)) {
      if (!block?.words) continue;

      for (const w of block.words) {
        const indo = getIndo(w);
        if (!indo) continue;

        const key = `${moduleName}|${indo}`;
        if (!wordRegisterMap.has(key)) {
          wordRegisterMap.set(key, new Set());
        }
        wordRegisterMap.get(key).add(register);
      }
    }
  }

  function resolveRegister(module, indo, original) {
    const key = `${module}|${indo}`;
    const set = wordRegisterMap.get(key);

    if (set && set.size > 1) return "neutral";
    return original;
  }

  /* ===============================
     ITEM MAPPER
  =============================== */

  const mapItem = (x, type, module, register) => {
    const indo = getIndo(x);
    const eng  = getEng(x);
    if (!indo || !eng) return null;

    // 🔒 ID MUST NOT CHANGE
    const id = makeId(type, indo, eng);
    const stats = getItemStats("casual", id);

    const finalRegister =
      register === "neutral"
        ? "neutral"
        : resolveRegister(module, indo, register);

    return {
      id,
      type,
      module,
      register: finalRegister, // formal | informal | neutral
      indo,
      eng,
      ...stats
    };
  };

  /* ===============================
     PASS 2: BUILD ITEMS
  =============================== */

  const items = [];

  for (const [moduleName, moduleData] of Object.entries(content)) {

    // ===============================
    // MODULE WITH REGISTERS
    // ===============================
    if (moduleData.formal || moduleData.informal) {

      for (const [register, block] of Object.entries(moduleData)) {
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
