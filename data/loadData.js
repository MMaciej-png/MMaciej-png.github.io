import { makeId } from "../engine/selection.js";
import { getItemStats } from "../engine/itemStats.js";

export async function loadItems() {
  const content = await fetch("../data/NewContent.json")
    .then(r => r.json());

  const getIndo = x => (x.indo ?? x.indonesian ?? "").trim();
  const getEng  = x => (x.english ?? x.eng ?? "").trim();

  const mapItem = (x, type, module) => {
    const indo = getIndo(x);
    const eng = getEng(x);
    if (!indo || !eng) return null;

    const id = makeId(type, indo, eng);
    const stats = getItemStats("casual", id);

    return {
      id,
      type,
      module,
      indo,
      eng,
      ...stats
    };
  };

  const items = [];

  for (const [moduleName, moduleData] of Object.entries(content)) {

    /* ---------- WORDS ---------- */
    for (const w of moduleData.words ?? []) {
      const item = mapItem(w, "word", moduleName);
      if (item) items.push(item);
    }

    /* ---------- SENTENCES ---------- */
    for (const s of moduleData.sentences ?? []) {
      const item = mapItem(s, "sentence", moduleName);
      if (item) items.push(item);
    }
  }

  return items;
}
