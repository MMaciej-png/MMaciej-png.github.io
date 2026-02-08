/* engine/scoring.js */

/** Casual scoring rules. */

export function applySuccess({ item, attemptsLeft }) {
  const delta =
    attemptsLeft === 3 ? 6 :
    attemptsLeft === 2 ? 4 : 2;

  item.points += delta;
  item.weight = Math.max(1, item.weight - delta);
  item.fail_streak = 0;

  return delta;
}

export function applyFail({ item, attemptsLeft }) {
  const delta = -(5 + attemptsLeft + item.fail_streak * 5);

  item.points += delta;
  item.weight = Math.max(1, item.weight - delta);
  item.fail_streak++;

  return delta;
}
