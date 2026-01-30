import { loadItems } from "./loadData.js";
import { calculateRank } from "../engine/rank.js";

export async function getCasualSR() {
  const items = await loadItems();

  const seen = new Map();

  for (const i of items) {
    const key = `${i.type}::${i.indo}::${i.eng}`;

    // Only count the concept once
    if (!seen.has(key)) {
      seen.set(key, i.points);
    }
  }

  const totalPoints = [...seen.values()]
    .reduce((sum, p) => sum + p, 0);

  return calculateRank({
    totalPoints,
    totalItems: seen.size
  });
}
