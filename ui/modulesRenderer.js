/* ui/modulesRenderer.js */

/* ui/modulesRenderer.js */

export function createModulesRenderer({ containerEl, onSelect }) {

    const openFolders = new Set();


    function render(modules) {
        containerEl.innerHTML = "";

        /* ---------- Build groups ---------- */
        const grouped = {};

        // Smart Modes group
        grouped["Smart Modes"] = modules.filter(
            m => m.type === "all" || m.type === "weakest"
        );

        // Real module groups
        for (const m of modules) {
            if (m.type !== "module") continue;
            (grouped[m.category] ??= []).push(m);
        }

        for (const [category, mods] of Object.entries(grouped)) {
            if (!mods.length) continue;
            containerEl.appendChild(makeGroup(category, mods));
        }
    }


    /* ===============================
       GROUP (FOLDER)
    =============================== */

    function makeGroup(category, modules) {
        const wrap = document.createElement("div");
        wrap.className = "module-group";

        const header = document.createElement("button");
        header.className = "module-group-header";
        header.textContent = category;

        const body = document.createElement("div");
        body.className = "module-group-body";

        const isOpen = openFolders.has(category);
        body.classList.toggle("collapsed", !isOpen);
        header.classList.toggle("open", isOpen);

        modules.forEach(m => body.appendChild(makeModuleButton(m)));

        header.onclick = () => {
            const nowOpen = body.classList.toggle("collapsed") === false;
            header.classList.toggle("open", nowOpen);

            if (nowOpen) openFolders.add(category);
            else openFolders.delete(category);
        };

        wrap.append(header, body);
        return wrap;
    }


    /* ===============================
       MODULE BUTTON (WITH STATS)
    =============================== */

    function makeModuleButton(m) {
        const btn = document.createElement("button");
        btn.className = `module-btn ${m.type ?? ""}`;

        btn.innerHTML = `
      <div class="module-main">
        <span class="module-name">${m.name}</span>
      </div>

      <div class="module-meta">
        ${renderCounts(m)}
        ${renderAccuracy(m)}
        ${renderStreak(m)}
      </div>
    `;

        btn.onclick = () => onSelect(m.name);
        return btn;
    }

    function renderCounts(m) {
        if (m.words == null && m.sentences == null) {
            return `<span>${m.total ?? ""} Items</span>`;
        }

        return `
      <span>${m.total ?? ""} Items</span>
    `;
    }

    function renderAccuracy(m) {
        if (m.accuracy == null) {
            return `<span class="muted">—</span>`;
        }
        return `<span>${m.accuracy}%</span>`;
    }

    function renderStreak(m) {
        if (!m.bestStreak) return `<span></span>`;
        return `<span>🔥 ${m.bestStreak}</span>`;
    }

    return { render };
}
