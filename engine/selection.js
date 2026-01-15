/* engine/selection.js */

export function weightedRandom(items) {
  if (!items.length) return null;

  let total = 0;

  for (const item of items) {
    total += effectiveWeight(item);
  }

  let r = Math.random() * total;

  for (const item of items) {
    r -= effectiveWeight(item);
    if (r <= 0) return item;
  }

  return items[0];
}

function effectiveWeight(item) {
  // Base difficulty (your existing system)
  let w = Math.max(1, Number(item.weight) || 1);

  // -----------------------------
  // 1️⃣ Novelty boost
  // -----------------------------
  // Never seen cards MUST surface
  const seen = item.seen ?? 0;

  if (seen === 0) w *= 4;
  else if (seen === 1) w *= 2;

  // -----------------------------
  // 2️⃣ Recency suppression
  // -----------------------------
  if (item.lastSeen) {
    const minutesSince = (Date.now() - item.lastSeen) / 60000;

    if (minutesSince < 5) {
      w *= 0.2;     // almost never repeat
    } else if (minutesSince < 15) {
      w *= 0.5;
    }
  }

  return Math.max(w, 0.1);
}

export function makeId(type, indo, eng) {
  return `${type}::${indo}::${eng}`.toLowerCase();
}
