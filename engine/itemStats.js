/* engine/itemStats.js */

const KEY = "item_stats_v1.1";
const store = JSON.parse(localStorage.getItem(KEY)) || {};

function ensure(mode, id) {
  store[mode] ??= {};
  store[mode][id] ??= {
    points: 100,
    weight: 100,
    fail_streak: 0
  };
  return store[mode][id];
}

export function getItemStats(mode, id) {
  return ensure(mode, id);
}

export function applyItemDelta(mode, id, delta) {
  const stats = ensure(mode, id);
  stats.points += delta;
  persist();
  return stats.points;
}

export function saveItemStats(mode, id, patch) {
  const stats = ensure(mode, id);
  Object.assign(stats, patch);
  persist();
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(store));
}
