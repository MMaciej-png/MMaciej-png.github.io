/* ui/modulesRenderer.js */

const openFolders = new Set(["Smart Modes"]);

/**
 * Creates the Modules Renderer
 */
export function createModulesRenderer({ containerEl, onSelect }) {

  function render(
    groups,
    activeModules,
    activeMode,
    contentFilter,
    registerFilter,
    includeJakartaTokens,
    showAffixHelp
  ) {
    containerEl.innerHTML = "";

    renderTogglesGrid(
      containerEl,
      contentFilter,
      registerFilter,
      includeJakartaTokens,
      showAffixHelp,
      onSelect
    );

    /* ===============================
       MODULE GROUPS (CATEGORIES)
    =============================== */
    for (const [category, data] of Object.entries(groups)) {

      // SMART MODES (legacy flat list)
      if (Array.isArray(data)) {
        const groupEl = makeFlatGroup(
          category,
          data,
          activeModules,
          activeMode,
          onSelect
        );
        containerEl.appendChild(groupEl);
        continue;
      }

      // NORMAL CATEGORY → SUBCATEGORY → MODULES
      const groupEl = makeCategoryGroup(
        category,
        data,
        activeModules,
        activeMode,
        onSelect
      );
      containerEl.appendChild(groupEl);
    }
  }

  return { render };
}

function renderTogglesGrid(
  container,
  contentFilter,
  registerFilter,
  includeJakartaTokens,
  showAffixHelp,
  onSelect
) {
  const wrap = document.createElement("div");
  wrap.className = "module-toggles-grid";

  const btnContent = document.createElement("button");
  btnContent.type = "button";
  btnContent.className = "module-toggle-btn toggle-content";
  btnContent.textContent =
    contentFilter === "all" ? "Words + Sentences" :
      contentFilter === "words" ? "Only Words" :
        "Only Sentences";
  btnContent.onclick = () => onSelect("__CONTENT_TOGGLE__");

  const btnRegister = document.createElement("button");
  btnRegister.type = "button";
  btnRegister.className = "module-toggle-btn toggle-register";
  btnRegister.textContent =
    registerFilter === "all" ? "Formal + Informal" :
      registerFilter === "informal" ? "Informal" :
        "Formal";
  btnRegister.onclick = () => onSelect("__REGISTER_TOGGLE__");

  const btnParticles = document.createElement("button");
  btnParticles.type = "button";
  btnParticles.className = "module-toggle-btn toggle-particles";
  btnParticles.dataset.state = includeJakartaTokens ? "on" : "off";
  btnParticles.textContent = includeJakartaTokens ? "Particles: ON" : "Particles: OFF";
  btnParticles.onclick = () => onSelect("__JAKARTA_TOGGLE__");

  const btnAffix = document.createElement("button");
  btnAffix.type = "button";
  btnAffix.className = "module-toggle-btn toggle-affix";
  btnAffix.dataset.state = showAffixHelp ? "on" : "off";
  btnAffix.textContent = showAffixHelp ? "Affix Help: ON" : "Affix Help: OFF";
  btnAffix.onclick = () => onSelect("__AFFIX_TOGGLE__");

  wrap.append(btnContent, btnRegister, btnParticles, btnAffix);
  container.appendChild(wrap);
}

/* ===============================
   CONTENT TOGGLE
=============================== */

function renderContentToggle(container, current, onSelect) {
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

  btn.onclick = () => onSelect("__CONTENT_TOGGLE__");
  container.appendChild(btn);
}

/* ===============================
   REGISTER TOGGLE
=============================== */

function renderRegisterToggle(container, current, onSelect) {
  const btn = document.createElement("button");
  btn.className = "content-toggle register-toggle";

  const label =
    current === "all" ? "Formal & Informal" :
      current === "informal" ? "Informal" :
        "Formal";

  btn.innerHTML = `
    <span class="toggle-icon">🔁</span>
    <span class="toggle-label">${label}</span>
  `;

  btn.onclick = () => onSelect("__REGISTER_TOGGLE__");
  container.appendChild(btn);
}

/* ===============================
   FLAT GROUP (SMART MODES)
=============================== */

function makeFlatGroup(category, modules, activeModules, activeMode, onSelect) {
  const wrap = document.createElement("div");
  wrap.className = "module-group";

  const header = document.createElement("button");
  header.className = "module-group-header";
  header.textContent = category;

  const body = document.createElement("div");
  body.className = "module-group-body";

  const containsActive = modules.some(m =>
    (m.type === "all" && activeMode === "modules" && activeModules.size === 0) ||
    (m.type === "weakest" && activeMode === "weakest") ||
    (!m.type && activeModules.has(m.name))
  );

  const isOpen =
    openFolders.has(category) ||
    containsActive;

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
   CATEGORY GROUP
=============================== */

function makeCategoryGroup(
  category,
  subgroups,
  activeModules,
  activeMode,
  onSelect
) {
  const wrap = document.createElement("div");
  wrap.className = "module-group";

  const header = document.createElement("button");
  header.className = "module-group-header";
  header.textContent = category;

  const body = document.createElement("div");
  body.className = "module-group-body";

  const categoryKey = category;

  const containsActive = Object.values(subgroups).some(modules =>
    modules.some(m => !m.type && activeModules.has(m.name))
  );

  const isOpen =
    openFolders.has(categoryKey) ||
    containsActive;

  body.classList.toggle("collapsed", !isOpen);
  header.classList.toggle("open", isOpen);

  for (const [subcategory, modules] of Object.entries(subgroups)) {
    body.appendChild(
      makeSubcategoryGroup(
        category,
        subcategory,
        modules,
        activeModules,
        activeMode,
        onSelect,
        isOpen
      )
    );
  }

  header.onclick = () => {
    const willOpen = body.classList.contains("collapsed");

    body.classList.toggle("collapsed", !willOpen);
    header.classList.toggle("open", willOpen);

    if (willOpen) openFolders.add(categoryKey);
    else openFolders.delete(categoryKey);
  };

  wrap.append(header, body);
  return wrap;
}

/* ===============================
   SUBCATEGORY GROUP
=============================== */

function makeSubcategoryGroup(
  category,
  subcategory,
  modules,
  activeModules,
  activeMode,
  onSelect,
  parentOpen
) {
  const wrap = document.createElement("div");
  wrap.className = "module-subgroup";

  const header = document.createElement("button");
  header.className = "module-subgroup-header";
  header.textContent = subcategory;

  const body = document.createElement("div");
  body.className = "module-subgroup-body";

  const key = `${category}::${subcategory}`;

  const containsActive = modules.some(m =>
    !m.type && activeModules.has(m.name)
  );

  const isOpen =
    openFolders.has(key) || containsActive;

  body.classList.toggle("collapsed", !isOpen);
  header.classList.toggle("open", isOpen);

  // Parent visibility gate (visual only)
  if (!parentOpen) {
    body.classList.add("collapsed");
    header.classList.remove("open");
  }

  modules.forEach(m => {
    body.appendChild(
      makeModuleButton(m, activeModules, activeMode, onSelect)
    );
  });

  header.onclick = () => {
    const willOpen = body.classList.contains("collapsed");

    body.classList.toggle("collapsed", !willOpen);
    header.classList.toggle("open", willOpen);

    if (willOpen) openFolders.add(key);
    else openFolders.delete(key);
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
