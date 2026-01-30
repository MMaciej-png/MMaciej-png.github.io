/* engine/selection.js */

let lastPickedId = null;

export function weightedRandom(candidateItems) {
  if (!candidateItems.length) return null;

  /* ===============================
     HARD NO-REPEAT RULE
     (unless only one candidate)
  =============================== */

  let pool = candidateItems;

  if (lastPickedId && candidateItems.length > 1) {
    pool = candidateItems.filter(i => i.id !== lastPickedId);

    // Safety fallback (should never happen, but defensive)
    if (!pool.length) {
      pool = candidateItems;
    }
  }

  /* ===============================
     CONCEPT FREQUENCY MAP
     (only for current pool)
  =============================== */

  const conceptCount = new Map();

  for (const item of pool) {
    const key = item.id;
    conceptCount.set(key, (conceptCount.get(key) || 0) + 1);
  }

  /* ===============================
     TOTAL WEIGHT
  =============================== */

  let total = 0;

  for (const item of pool) {
    total += effectiveWeight(item, conceptCount);
  }

  let r = Math.random() * total;

  for (const item of pool) {
    r -= effectiveWeight(item, conceptCount);
    if (r <= 0) {
      lastPickedId = item.id;
      return item;
    }
  }

  // Fallback
  lastPickedId = pool[0].id;
  return pool[0];
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

  if (seen === 0) w *= 2;
  else if (seen === 1) w *= 1;

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
     (prevents aku / bisa / yang spam)
  ----------------------------- */
  const count = conceptCount.get(item.indo.toLowerCase()) || 1;

  // Square-root dampening
  w /= Math.sqrt(count);

  return Math.max(w, 0.1);
}


/* ===============================
   ID GENERATION (UNCHANGED)
=============================== */

export function makeId(type, indo, eng) {
  return `${type}::${indo}::${eng}`.toLowerCase();
}
