const KEY = "casual_module_stats";

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

export function getModuleStats(moduleName) {
  const all = loadAll();

  if (!all[moduleName]) {
    all[moduleName] = {
      attempted: 0,
      correct: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    saveAll(all);
  }

  return all[moduleName];
}

export function saveModuleStats(moduleName, stats) {
  const all = loadAll();
  all[moduleName] = stats;
  saveAll(all);
}
