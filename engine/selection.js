/* engine/selection.js */

let lastPickedId = null;

/* ===============================
   CONCEPT KEY
   (shared across modules)
=============================== */

function getConceptKey(item) {
  return `${item.type}::${item.indo}::${item.english}`.toLowerCase();
}


/* ===============================
   WEIGHTED RANDOM (CONCEPT-AWARE)
=============================== */

export function weightedRandom(candidateItems) {
  if (!candidateItems.length) return null;

  /* ===============================
     HARD NO-REPEAT RULE
     (unless only one candidate)
  =============================== */

  let pool = candidateItems;

  if (lastPickedId && candidateItems.length > 1) {
    pool = candidateItems.filter(i => i.id !== lastPickedId);
    if (!pool.length) pool = candidateItems;
  }

  /* ===============================
     CONCEPT MAP
     key → [items...]
  =============================== */

  const conceptMap = new Map();

  for (const item of pool) {
    const key = getConceptKey(item);
    if (!conceptMap.has(key)) {
      conceptMap.set(key, []);
    }
    conceptMap.get(key).push(item);
  }

  /* ===============================
     TOTAL WEIGHT
  =============================== */

  let total = 0;

  for (const item of pool) {
    total += effectiveWeight(item, conceptMap);
  }

  let r = Math.random() * total;

  for (const item of pool) {
    r -= effectiveWeight(item, conceptMap);
    if (r <= 0) {
      lastPickedId = item.id;
      return item;
    }
  }

  // Fallback (defensive)
  lastPickedId = pool[0].id;
  return pool[0];
}

/* ===============================
   EFFECTIVE WEIGHT
=============================== */

function effectiveWeight(item, conceptMap) {
  // Base mastery weight (persistent)
  let w = Math.max(1, Number(item.weight) || 1);

  /* -----------------------------
     1️⃣ Novelty boost
  ----------------------------- */
  const seen = item.seen ?? 0;
  if (seen === 0) w *= 2;

  /* -----------------------------
     2️⃣ Recency suppression
  ----------------------------- */
  if (item.lastSeen) {
    const minutesSince = (Date.now() - item.lastSeen) / 60000;

    if (minutesSince < 1) {
      w *= 0.5;      // almost never repeat
    } else if (minutesSince < 15) {
      w *= 1;
    }
  }

  /* -----------------------------
     3️⃣ CONCEPT SPLIT (KEY FIX)
     Same concept across modules
     splits total probability evenly
  ----------------------------- */
  const key = getConceptKey(item);
  const conceptSize = conceptMap.get(key)?.length ?? 1;

  w /= conceptSize;

  return Math.max(w, 0.1);
}

/* ===============================
   ID GENERATION (UNCHANGED)
=============================== */

export function makeId(type, indo, eng) {
  return `${type}::${indo}::${eng}`.toLowerCase();
}
