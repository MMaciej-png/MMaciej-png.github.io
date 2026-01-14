import { loadItems } from "./loadData.js";
import { calculateRank } from "../engine/rank.js";

export async function getCasualSR() {
  const items = await loadItems();

  const totalPoints = items.reduce(
    (sum, i) => sum + i.points,0
  );

  return calculateRank({
    totalPoints,
    totalItems: items.length
  });
}
