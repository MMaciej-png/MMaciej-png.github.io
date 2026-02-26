import { getModuleId } from "./moduleIds.js";

const KEY = "casual_module_stats_v2";

function loadAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY)) ?? {};
    return migrateKeysToIds(raw);
  } catch {
    return {};
  }
}

/** One-time migration: rewrite stats keys from English names to module IDs. */
function migrateKeysToIds(all) {
  let changed = false;
  for (const pairKey of Object.keys(all)) {
    const pair = all[pairKey];
    if (!pair || typeof pair !== "object") continue;
    for (const key of Object.keys(pair)) {
      const id = getModuleId(key);
      if (id && id !== key) {
        if (!pair[id] || typeof pair[id] !== "object") pair[id] = pair[key];
        delete pair[key];
        changed = true;
      }
    }
  }
  if (changed) saveAll(all);
  return all;
}

function saveAll(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (_) {}
}

/** Get module stats for a given language pair and module. Stats are per pair (no global sharing). */
export function getModuleStats(moduleName, pair) {
  const all = loadAll();
  const pairKey = String(pair ?? "en-indo");
  if (!all[pairKey]) all[pairKey] = {};
  if (!all[pairKey][moduleName]) {
    all[pairKey][moduleName] = {
      attempted: 0,
      correct: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    saveAll(all);
  }
  return all[pairKey][moduleName];
}

/** Save module stats for a given language pair and module. */
export function saveModuleStats(moduleName, stats, pair) {
  const all = loadAll();
  const pairKey = String(pair ?? "en-indo");
  all[pairKey] ??= {};
  all[pairKey][moduleName] = stats;
  saveAll(all);
}
