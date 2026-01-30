/* engine/selection.js */

let lastPickedId = null;

export function weightedRandom(candidateItems) {
  if (!candidateItems.length) return null;

  /* ===============================
     HARD NO-REPEAT RULE
  =============================== */

  let pool = candidateItems;

  if (lastPickedId && candidateItems.length > 1) {
    pool = candidateItems.filter(i => i.id !== lastPickedId);
    if (!pool.length) pool = candidateItems;
  }

  /* ===============================
     TOTAL WEIGHT
  =============================== */

  let total = 0;
  for (const item of pool) {
    total += effectiveWeight(item);
  }

  let r = Math.random() * total;

  for (const item of pool) {
    r -= effectiveWeight(item);
    if (r <= 0) {
      lastPickedId = item.id;
      return item;
    }
  }

  lastPickedId = pool[0].id;
  return pool[0];
}


/* ===============================
   EFFECTIVE WEIGHT
=============================== */

function effectiveWeight(item) {
  // Base mastery
  let w = Math.max(1, Number(item.weight) || 1);

  /* -----------------------------
     1️⃣ Novelty boost
  ----------------------------- */
  const seen = item.seen ?? 0;
  if (seen === 0) w *= 2;
  else if (seen === 1) w *= 1.2;

  /* -----------------------------
     2️⃣ Recency suppression
  ----------------------------- */
  if (item.lastSeen) {
    const minutesSince = (Date.now() - item.lastSeen) / 60000;

    if (minutesSince < 5) w *= 0.1;
    else if (minutesSince < 15) w *= 0.5;
  }

  return Math.max(w, 0.1);
}


/* ===============================
   ID GENERATION
=============================== */

export function makeId(type, module, indo, english) {
  return `${type}::${module}::${indo}::${english}`.toLowerCase();
}

