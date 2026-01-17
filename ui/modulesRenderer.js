/* ui/modulesRenderer.js */

const openFolders = new Set(["Smart Modes"]);

/**
 * Creates the Modules Renderer
 */
export function createModulesRenderer({ containerEl, onSelect }) {

  function render(groups, activeModule) {
    containerEl.innerHTML = "";

    for (const [category, modules] of Object.entries(groups)) {
      const groupEl = makeGroup(category, modules, activeModule, onSelect);
      containerEl.appendChild(groupEl);
    }
  }

  return { render };
}

/* ===============================
   GROUP (FOLDER)
=============================== */

function makeGroup(category, modules, activeModule, onSelect) {
  const wrap = document.createElement("div");
  wrap.className = "module-group";

  const header = document.createElement("button");
  header.className = "module-group-header";
  header.textContent = category;

  const body = document.createElement("div");
  body.className = "module-group-body";

  const containsActive = modules.some(m => m.name === activeModule);
  const isOpen = containsActive || openFolders.has(category);

  body.classList.toggle("collapsed", !isOpen);
  header.classList.toggle("open", isOpen);

  modules.forEach(m => {
    body.appendChild(makeModuleButton(m, activeModule, onSelect));
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

function makeModuleButton(m, activeModule, onSelect) {
  const btn = document.createElement("button");
  btn.className = "module-btn";

  if (m.name === activeModule) {
    btn.classList.add("active");
  }

  btn.innerHTML = `
    <div class="module-main">
      <span class="module-name">${m.name}</span>
      ${renderDescription(m)}
    </div>

    ${renderMeta(m)}
  `;

  btn.onclick = () => onSelect(m.name);
  return btn;
}

/* ===============================
   DESCRIPTION
=============================== */

function renderDescription(m) {
  if (m.type === "weakest") {
    return `<div class="module-desc">25 weakest items based on past performance</div>`;
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
  // show even if 0
  if (m.currentStreak == null) return "";
  return `<span>🔥 ${m.currentStreak}</span>`;
}

function renderBestStreak(m) {
  // show even if 0
  if (m.bestStreak == null) return "";
  return `<span>🏆 ${m.bestStreak}</span>`;
}
