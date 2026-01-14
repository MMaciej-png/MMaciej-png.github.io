/* data/saveData.js */

const KEY = "item_stats_v1.1";
const store = JSON.parse(localStorage.getItem(KEY)) || {};

export function getItemStats(id) {
  if (!store[id]) {
    store[id] = { points: 100, weight: 100, fail_streak: 0 };
  }
  return store[id];
}

export function saveItemStats() {
  localStorage.setItem(KEY, JSON.stringify(store));
}
