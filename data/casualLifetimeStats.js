// data/casualLifetimeStats.js

export const casualLifetime = JSON.parse(
  localStorage.getItem("casual_lifetime_stats_v1.1")
) || {
  total: 0,
  complete: 0,
  failed: 0,
  bestStreak: 0,
  streaks: [],
  word: {
    correct: 0,
    total: 0
  },
  sentence: {
    correct: 0,
    total: 0
  }
};

export function updateCasualLifetimeUI() {
  const total = casualLifetime.total;
  const complete = casualLifetime.complete;
  const failed = casualLifetime.failed;

  const overallAccuracy = total
    ? Math.round((complete / total) * 100)
    : 0;

  const wordAccuracy = casualLifetime.word.total
    ? Math.round(
        (casualLifetime.word.correct / casualLifetime.word.total) * 100
      ) + "%"
    : "—";

  const sentenceAccuracy = casualLifetime.sentence.total
    ? Math.round(
        (casualLifetime.sentence.correct / casualLifetime.sentence.total) * 100
      ) + "%"
    : "—";

  const avgStreak = casualLifetime.streaks.length
    ? Math.round(
        casualLifetime.streaks.reduce((a, b) => a + b, 0) /
        casualLifetime.streaks.length
      )
    : "—";

  // ✅ IDs NOW MATCH YOUR HTML
  document.getElementById("casual-total").textContent = total;
  document.getElementById("casual-complete").textContent = complete;
  document.getElementById("casual-failed").textContent = failed;

  document.getElementById("casual-accuracy").textContent =
    overallAccuracy + "%";

  document.getElementById("casual-word-accuracy").textContent = wordAccuracy;
  document.getElementById("casual-sentence-accuracy").textContent =
    sentenceAccuracy;

  document.getElementById("casual-best-streak").textContent =
    casualLifetime.bestStreak;

  document.getElementById("casual-avg-streak").textContent = avgStreak;

  localStorage.setItem(
    "casual_lifetime_stats_v1.1",
    JSON.stringify(casualLifetime)
  );
}
