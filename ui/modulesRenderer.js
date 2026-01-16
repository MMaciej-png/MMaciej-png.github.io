/* ui/modulesRenderer.js */

export function createModulesRenderer({ containerEl, onSelect }) {
  if (!containerEl) {
    throw new Error("modulesRenderer: containerEl is required");
  }

  let activeModule = null;

  function render(modules) {
    containerEl.innerHTML = "";

    for (const module of modules) {
      const isAll = module.name === "__ALL__";
      const isActive =
        (isAll && activeModule === null) ||
        (!isAll && module.name === activeModule);

      const btn = document.createElement("button");
      btn.className = "module-btn";

      if (isActive) btn.classList.add("active");

      const title = document.createElement("div");
      title.className = "module-title";
      title.textContent = isAll ? "All Modules" : module.name;

      const meta = document.createElement("div");
      meta.className = "module-meta";

      const count = document.createElement("span");
      count.textContent = `${module.total ?? 0} items`;

      const accuracy = document.createElement("span");
      accuracy.textContent =
        module.accuracy == null ? "—" : `${module.accuracy}%`;

      meta.appendChild(count);
      meta.appendChild(accuracy);

      if (module.bestStreak && module.bestStreak > 0) {
        const streak = document.createElement("span");
        streak.className = "module-streak";
        streak.textContent = `🔥 ${module.bestStreak}`;
        meta.appendChild(streak);
      }

      btn.appendChild(title);
      btn.appendChild(meta);

      btn.onclick = () => {
        activeModule = isAll ? null : module.name;
        onSelect?.(activeModule);
        render(modules);
      };

      containerEl.appendChild(btn);
    }
  }

  return {
    render
  };
}
