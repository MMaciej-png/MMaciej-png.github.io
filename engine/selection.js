/* engine/selection.js */

export function weightedRandom(items) {
  if (!items.length) return null;

  let total = 0;
  for (const i of items) {
    total += Math.max(1, Number(i.weight) || 1);
  }

  let r = Math.random() * total;
  for (const i of items) {
    r -= Math.max(1, Number(i.weight) || 1);
    if (r <= 0) return i;
  }

  return items[0];
}


export function makeId(type, indo, eng) {
  return `${type}::${indo}::${eng}`.toLowerCase();
}
