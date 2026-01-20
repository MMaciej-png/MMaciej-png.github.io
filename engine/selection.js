/* engine/selection.js */

export function weightedRandom(items) {
  if (!items.length) return null;

  /* ===============================
     CONCEPT FREQUENCY MAP
     (indo-based, shared concepts)
  =============================== */

  const conceptCount = new Map();

  for (const item of items) {
    const key = item.indo.toLowerCase();
    conceptCount.set(key, (conceptCount.get(key) || 0) + 1);
  }

  /* ===============================
     TOTAL WEIGHT
  =============================== */

  let total = 0;

  for (const item of items) {
    total += effectiveWeight(item, conceptCount);
  }

  let r = Math.random() * total;

  for (const item of items) {
    r -= effectiveWeight(item, conceptCount);
    if (r <= 0) return item;
  }

  return items[0];
}


/* ===============================
   EFFECTIVE WEIGHT
=============================== */

function effectiveWeight(item, conceptCount) {
  // Base difficulty (stored mastery)
  let w = Math.max(1, Number(item.weight) || 1);

  /* -----------------------------
     1️⃣ Novelty boost
  ----------------------------- */
  const seen = item.seen ?? 0;

  if (seen === 0) w *= 4;
  else if (seen === 1) w *= 2;

  /* -----------------------------
     2️⃣ Recency suppression
  ----------------------------- */
  if (item.lastSeen) {
    const minutesSince = (Date.now() - item.lastSeen) / 60000;

    if (minutesSince < 5) {
      w *= 0.1;      // almost never repeat
    } else if (minutesSince < 15) {
      w *= 0.5;
    }
  }

  /* -----------------------------
     3️⃣ Concept frequency dampening
     (prevents aku/mau/yang spam)
  ----------------------------- */
  const count = conceptCount.get(item.indo.toLowerCase()) || 1;

  // Square-root dampening (balanced, beginner-friendly)
  w /= Math.sqrt(count);

  return Math.max(w, 0.1);
}


/* ===============================
   ID GENERATION (UNCHANGED)
=============================== */

export function makeId(type, indo, eng) {
  return `${type}::${indo}::${eng}`.toLowerCase();
}
