import { loadItems } from "./loadData.js";
import { calculateRank } from "../engine/rank.js";

export async function getCasualSR() {
  const items = await loadItems();

  const seen = new Map();

  for (const i of items) {
    // id is unique per (type, module, sideA, sideB, pair) so rank is per language pair
    if (!seen.has(i.id)) {
      seen.set(i.id, i.points);
    }
  }

  const totalPoints = [...seen.values()]
    .reduce((sum, p) => sum + p, 0);

  return calculateRank({
    totalPoints,
    totalItems: seen.size
  });
}
