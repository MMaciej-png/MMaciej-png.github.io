/* ui/modulesRenderer.js */

const openFolders = new Set(["Smart Modes"]);

/**
 * Creates the Modules Renderer
 */
export function createModulesRenderer({ containerEl, onSelect }) {

  function render(groups, activeModules, activeMode, contentFilter) {
    containerEl.innerHTML = "";

    /* ===============================
       GLOBAL CONTENT TOGGLE (TOP)
    =============================== */
    renderToggle(containerEl, contentFilter, onSelect);

    /* ===============================
       MODULE GROUPS
    =============================== */
    for (const [category, modules] of Object.entries(groups)) {
      const groupEl = makeGroup(
        category,
        modules,
        activeModules,
        activeMode,
        onSelect
      );
      containerEl.appendChild(groupEl);
    }
  }

  return { render };
}

/* ===============================
   CONTENT TOGGLE
=============================== */

function renderToggle(container, current, onSelect) {
  const btn = document.createElement("button");
  btn.className = "content-toggle";

  const label =
    current === "all" ? "Words & Sentences" :
    current === "words" ? "Only Words" :
    "Only Sentences";

  btn.innerHTML = `
    <span class="toggle-icon">🔄</span>
    <span class="toggle-label">${label}</span>
  `;

  btn.onclick = () => {
    onSelect("__CONTENT_TOGGLE__");
  };

  container.appendChild(btn);
}


/* ===============================
   GROUP (FOLDER)
=============================== */

function makeGroup(category, modules, activeModules, activeMode, onSelect) {
  const wrap = document.createElement("div");
  wrap.className = "module-group";

  const header = document.createElement("button");
  header.className = "module-group-header";
  header.textContent = category;

  const body = document.createElement("div");
  body.className = "module-group-body";

  const containsActive = modules.some(m =>
    activeModules.has(m.name)
  );

  const isOpen =
    category === "Smart Modes" ||
    containsActive ||
    openFolders.has(category);

  body.classList.toggle("collapsed", !isOpen);
  header.classList.toggle("open", isOpen);

  modules.forEach(m => {
    body.appendChild(
      makeModuleButton(m, activeModules, activeMode, onSelect)
    );
  });

  header.onclick = () => {
    const willOpen = body.classList.contains("collapsed");

    body.classList.toggle("collapsed", !willOpen);
    header.classList.toggle("open", willOpen);

    if (willOpen) openFolders.add(category);
    else openFolders.delete(category);
  };

  wrap.append(header, body);
  return wrap;
}

/* ===============================
   MODULE BUTTON
=============================== */

function makeModuleButton(m, activeModules, activeMode, onSelect) {
  const btn = document.createElement("button");
  btn.className = "module-btn";

  const isActive =
    (m.type === "all" && activeMode === "modules" && activeModules.size === 0) ||
    (m.type === "weakest" && activeMode === "weakest") ||
    (!m.type && activeModules.has(m.name));

  if (isActive) btn.classList.add("active");

  btn.innerHTML = `
    <div class="module-main">
      <span class="module-name">${m.name}</span>
      ${renderDescription(m)}
    </div>
    ${renderMeta(m)}
  `;

  btn.onclick = () => onSelect(m.name, m.type);
  return btn;
}

/* ===============================
   DESCRIPTION
=============================== */

function renderDescription(m) {
  if (m.type === "weakest") {
    return `
      <div class="module-desc">
        25 weakest items based on past performance
      </div>
    `;
  }
  return "";
}

/* ===============================
   META (STATS)
=============================== */

function renderMeta(m) {
  if (m.type === "weakest") return "";

  return `
    <div class="module-meta">
      ${renderCounts(m)}
      ${renderAccuracy(m)}
      ${renderCurrentStreak(m)}
      ${renderBestStreak(m)}
    </div>
  `;
}

function renderCounts(m) {
  if (m.total == null) return "";
  return `<span>${m.total} Items</span>`;
}

function renderAccuracy(m) {
  if (m.accuracy == null) return `<span class="muted">—</span>`;
  return `<span>${m.accuracy}%</span>`;
}

function renderCurrentStreak(m) {
  if (m.currentStreak == null) return "";
  return `<span>🔥 ${m.currentStreak}</span>`;
}

function renderBestStreak(m) {
  if (m.bestStreak == null) return "";
  return `<span>🏆 ${m.bestStreak}</span>`;
}
