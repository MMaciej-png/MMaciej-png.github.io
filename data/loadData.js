import { makeId } from "../engine/selection.js";
import { getItemStats } from "../engine/itemStats.js";

export async function loadItems() {
  const w = await fetch("../data/words.json").then(r => r.json());
  const s = await fetch("../data/sentences.json").then(r => r.json());

  const getIndo = x => (x.indo ?? x.indonesian ?? "").trim();
  const getEng  = x => (x.english ?? x.eng ?? "").trim();

  const mapItem = (x, type) => {
    const indo = getIndo(x);
    const eng = getEng(x);
    if (!indo || !eng) return null;

    const id = makeId(type, indo, eng);
    const stats = getItemStats("casual", id);

    return {
      id,
      type,
      indo,
      eng,
      ...stats
    };
  };

  return [
    ...w.map(x => mapItem(x, "word")),
    ...s.map(x => mapItem(x, "sentence"))
  ].filter(Boolean);
}
