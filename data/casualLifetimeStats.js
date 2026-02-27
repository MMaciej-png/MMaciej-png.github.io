// data/casualLifetimeStats.js — stats per language pair (no global sharing)

const KEY = "casual_lifetime_stats_v2";

const defaultBucket = () => ({
  total: 0,
  complete: 0,
  failed: 0,
  bestStreak: 0,
  streaks: [],
  word: { correct: 0, total: 0 },
  sentence: { correct: 0, total: 0 }
});

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/** Get lifetime stats for a language pair. Returns mutable object; call saveCasualLifetime() after changes. */
export function getCasualLifetime(pair) {
  const all = loadAll();
  const pairKey = String(pair ?? "en-indo");
  if (!all[pairKey]) {
    all[pairKey] = defaultBucket();
    saveAll(all);
  }
  return all[pairKey];
}

/** Persist all lifetime stats (e.g. after mutating getCasualLifetime(pair)). */
export function saveCasualLifetime() {
  const all = loadAll();
  saveAll(all);
}

/** Update UI with lifetime stats for the given language pair. */
export function updateCasualLifetimeUI(pair) {
  const lifetime = getCasualLifetime(pair);

  const total = lifetime.total;
  const complete = lifetime.complete;
  const failed = lifetime.failed;

  const overallAccuracy = total
    ? Math.round((complete / total) * 100)
    : 0;

  const wordAccuracy = lifetime.word.total
    ? Math.round(
        (lifetime.word.correct / lifetime.word.total) * 100
      ) + "%"
    : "—";

  const sentenceAccuracy = lifetime.sentence.total
    ? Math.round(
        (lifetime.sentence.correct / lifetime.sentence.total) * 100
      ) + "%"
    : "—";

  const avgStreak = lifetime.streaks.length
    ? Math.round(
        lifetime.streaks.reduce((a, b) => a + b, 0) /
        lifetime.streaks.length
      )
    : "—";

  const totalEl = document.getElementById("casual-total");
  const completeEl = document.getElementById("casual-complete");
  const failedEl = document.getElementById("casual-failed");
  const accuracyEl = document.getElementById("casual-accuracy");
  const wordAccEl = document.getElementById("casual-word-accuracy");
  const sentenceAccEl = document.getElementById("casual-sentence-accuracy");
  const bestStreakEl = document.getElementById("casual-best-streak");
  const avgStreakEl = document.getElementById("casual-avg-streak");

  if (totalEl) totalEl.textContent = total;
  if (completeEl) completeEl.textContent = complete;
  if (failedEl) failedEl.textContent = failed;
  if (accuracyEl) accuracyEl.textContent = overallAccuracy + "%";
  if (wordAccEl) wordAccEl.textContent = wordAccuracy;
  if (sentenceAccEl) sentenceAccEl.textContent = sentenceAccuracy;
  if (bestStreakEl) bestStreakEl.textContent = lifetime.bestStreak;
  if (avgStreakEl) avgStreakEl.textContent = avgStreak;

  saveCasualLifetime();
}
