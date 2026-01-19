import { makeId } from "../engine/selection.js";
import { getItemStats } from "../engine/itemStats.js";

export async function loadItems() {
  const content = await fetch("../data/NewContent.json")
    .then(r => r.json());

  const getIndo = x => (x.indo ?? x.indonesian ?? "").trim();
  const getEng  = x => (x.english ?? x.eng ?? "").trim();

  const VALID_REGISTERS = new Set(["formal", "informal", "neutral"]);

  /* ===============================
     ITEM MAPPER
  =============================== */

  const mapItem = (x, type, module, register) => {
    const indo = getIndo(x);
    const eng  = getEng(x);
    if (!indo || !eng) return null;

    // 🔒 ID MUST NEVER CHANGE
    const id = makeId(type, indo, eng);
    const stats = getItemStats("casual", id);

    return {
      id,
      type,
      module,
      register, // formal | informal | neutral
      indo,
      eng,
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
