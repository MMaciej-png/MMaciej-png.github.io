export const RANKS = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "master"
];

export const RANK_STEP = 200;

export function calculateRank({ totalPoints, totalItems }) {
  const basePoints = totalItems * 100;
  const delta = totalPoints - basePoints;

  const silverIndex = RANKS.indexOf("silver");
  const offset = Math.floor(delta / RANK_STEP);
  
  const index = Math.max(
    0,
    Math.min(RANKS.length - 1, silverIndex + offset)
  );

  return {
    rank: RANKS[index],
    basePoints,
    delta
  };
}
