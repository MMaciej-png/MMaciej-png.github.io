import {
  detectJakartaTokens,
  extractEnglishLabels,
  stripParticlesForDisplay
} from "../core/textTags.js";
import { detectAffixTags } from "../core/affixTags.js";

export function createCardRenderer({
  frontTextEl,
  backTextEl,
  frontPointsEl,
  backPointsEl,
  frontRegisterEl,
  backRegisterEl,
  frontBadgesEl,
  backBadgesEl,
  frontMetaBadgesEl,
  backMetaBadgesEl,
  tagsPanelEl,
  affixPanelEl
}) {

  // Badges are computed at render-time; JSON schema stays locked.
  // - Token badges (Jakarta slang/particles/shorteners) only show when Indonesian is visible.
  // - Meta badges like SPOKEN show on both sides.

  function buildRender(cardObj) {
    const direction = Math.random() < 0.5 ? "IE" : "EI";

    const labels = extractEnglishLabels(cardObj.eng);
    const engDisplay = labels.clean ?? cardObj.eng;
    const metaLabels = labels.labels ?? [];

    return {
      direction,
      question: direction === "IE" ? cardObj.indo : engDisplay,
      answer: direction === "IE" ? engDisplay : cardObj.indo,
      points: cardObj.points,
      register: cardObj.register, // ✅ KEEP REGISTER
      moduleIsJakartaFocused: !!cardObj.moduleIsJakartaFocused,
      // Language markers for badge display rules
      questionLang: direction === "IE" ? "indo" : "eng",
      answerLang: direction === "IE" ? "eng" : "indo",
      indoText: cardObj.indo,
      tokens: detectJakartaTokens(cardObj.indo),
      // Use raw Indonesian (with affix markers) for better affix popups.
      affixes: detectAffixTags(cardObj.indoRaw ?? cardObj.indo, cardObj.moduleWordSet),
      metaLabels
    };
  }

  function clearBadges(el) {
    if (!el) return;
    el.innerHTML = "";
  }

  const REGISTER_HELP = {
    formal:
      "Polite / official. Use with strangers, elders, customer service, formal writing, presentations, etc.",
    informal:
      "Casual / friendly. Use with friends, family, peers, and relaxed everyday conversation.",
    neutral:
      "Neutral / general. Usually safe in most situations; not especially formal or slangy."
  };

  function getRegisterHelpItems(currentRegister) {
    const r = String(currentRegister ?? "neutral").toLowerCase();
    const order = ["formal", "neutral", "informal"];
    return order.map((k) => ({
      label: k.toUpperCase() + (k === r ? " (THIS)" : ""),
      meaning: REGISTER_HELP[k] ?? ""
    }));
  }

  function openRegisterHelp(register) {
    hideAffixPanel();
    showTagsPanel({
      title: "Register (Formal / Neutral / Informal)",
      items: getRegisterHelpItems(register)
    });
  }

  function getSheetBackdropEl() {
    return document.getElementById("sheet-backdrop");
  }

  function anySheetVisible() {
    return !!document.querySelector('.tags-panel[aria-hidden="false"]');
  }

  function openSheet(closeFn) {
    const backdrop = getSheetBackdropEl();
    if (!backdrop) return;

    // keep things simple: one active sheet close handler at a time
    window.__closeActiveSheet = closeFn;

    backdrop.classList.remove("hidden");
    backdrop.classList.add("is-open");
    backdrop.setAttribute("aria-hidden", "false");

    // ESC to close
    if (!window.__onSheetKeydown) {
      window.__onSheetKeydown = (ev) => {
        if (ev.key === "Escape") {
          if (typeof window.__closeActiveSheet === "function") window.__closeActiveSheet();
        }
      };
      window.addEventListener("keydown", window.__onSheetKeydown);
    }
  }

  function closeSheetIfNoneVisibleSoon() {
    const backdrop = getSheetBackdropEl();
    if (!backdrop) return;

    // Defer so "hide A then show B" won't flicker the backdrop.
    window.setTimeout(() => {
      if (anySheetVisible()) return;

      backdrop.classList.remove("is-open");
      backdrop.setAttribute("aria-hidden", "true");

      window.setTimeout(() => {
        if (!anySheetVisible()) backdrop.classList.add("hidden");
      }, 180);
    }, 0);
  }

  function hidePanel(panelEl) {
    if (!panelEl) return;
    panelEl.classList.remove("is-open");
    panelEl.setAttribute("aria-hidden", "true");
    closeSheetIfNoneVisibleSoon();

    window.setTimeout(() => {
      if (!panelEl.classList.contains("is-open")) {
        panelEl.innerHTML = "";
      }
    }, 240);
  }

  function hideTagsPanel() {
    hidePanel(tagsPanelEl);
  }

  function hideAffixPanel() {
    hidePanel(affixPanelEl);
  }

  function showPanel(panelEl, { title, items }) {
    if (!panelEl) return;
    if (!items?.length) {
      hidePanel(panelEl);
      return;
    }

    panelEl.innerHTML = "";
    panelEl.setAttribute("aria-hidden", "false");
    openSheet(() => hidePanel(panelEl));

    const header = document.createElement("div");
    header.className = "tags-panel-header";

    const titleEl = document.createElement("div");
    titleEl.className = "tags-panel-title";
    titleEl.textContent = title ?? "Tags";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "tags-panel-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "✕";
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      hidePanel(panelEl);
    };

    header.append(titleEl, closeBtn);

    const list = document.createElement("div");
    list.className = "tags-panel-list";

    for (const it of items) {
      const row = document.createElement("div");
      row.className = "tags-panel-item";

      const token = document.createElement("span");
      token.className = "tags-panel-token";
      token.textContent = it.label;

      const meaning = document.createElement("span");
      meaning.className = "tags-panel-meaning";
      meaning.textContent = it.meaning;

      row.append(token, meaning);
      list.appendChild(row);
    }

    panelEl.append(header, list);

    // Animate open on next frame
    requestAnimationFrame(() => {
      panelEl.classList.add("is-open");
    });
  }

  function showTagsPanel(payload) {
    hideAffixPanel();
    showPanel(tagsPanelEl, payload);
  }

  function showAffixPanel(payload) {
    hideTagsPanel();
    showPanel(affixPanelEl, payload);
  }

  function renderBadges(el, tokens, showParticles) {
    if (!el) return;
    el.innerHTML = "";
    for (const t of tokens) {
      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "card-badge";
      badge.textContent = t.label;
      badge.setAttribute("aria-label", `${t.label}: ${t.meaning}`);
      badge.onclick = (e) => {
        e.stopPropagation();
        showTagsPanel({
          title: "Jakarta Slang",
          items: showParticles ? tokens.map(x => ({ label: x.label, meaning: x.meaning })) : []
        });
      };
      el.appendChild(badge);
    }
  }

  function renderMetaBadges(el, labels) {
    if (!el) return;
    el.innerHTML = "";
    for (const l of labels) {
      const meaning = l === "SPOKEN" ? "spoken / casual form" : l.toLowerCase();
      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "card-badge";
      badge.dataset.badgeType = "meta";
      badge.textContent = l;
      badge.setAttribute("aria-label", meaning);
      badge.onclick = (e) => {
        e.stopPropagation();
        showTagsPanel({
          title: "Labels",
          items: [{ label: l, meaning }]
        });
      };
      el.appendChild(badge);
    }
  }

  function renderAffixBadges(el, render, faceHasIndo) {
    if (!el) return;

    const globalAffix =
      typeof window.__showAffixHelp === "function"
        ? window.__showAffixHelp() === true
        : false;

    if (!globalAffix || !faceHasIndo) return;
    if (!render.affixes?.length) return;

    for (const a of render.affixes) {
      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "card-badge";
      badge.dataset.badgeType = "affix";
      badge.textContent = a.label;
      badge.setAttribute("aria-label", "Affix help");
      badge.onclick = (e) => {
        e.stopPropagation();
        showAffixPanel({
          title: "Affix Help",
          items: render.affixes.map(x => ({ label: x.label, meaning: x.meaning }))
        });
      };
      el.appendChild(badge);
    }
  }

  function renderFront(render, delta = null) {
    const globalShow =
      typeof window.__includeJakartaTokens === "function"
        ? window.__includeJakartaTokens() === true
        : false;
    const showParticles = render.moduleIsJakartaFocused || globalShow;

    const frontText =
      render.questionLang === "indo" && !showParticles
        ? stripParticlesForDisplay(render.question)
        : render.question;

    frontTextEl.textContent = frontText;
    renderRegister(frontRegisterEl, render.register);
    // Spoken/Casual meta labels show on both sides
    renderMetaBadges(frontMetaBadgesEl, render.metaLabels);
    // Token badges only when Indonesian is visible on this face
    if (render.questionLang === "indo" && showParticles) renderBadges(frontBadgesEl, render.tokens, showParticles);
    else clearBadges(frontBadgesEl);

    // Affix badges sit next to token badges
    renderAffixBadges(frontBadgesEl, render, render.questionLang === "indo");

    // If we aren't showing particle badges here, ensure the particle sheet isn't left open
    if (!(render.questionLang === "indo" && showParticles)) hideTagsPanel();
    renderPoints(frontPointsEl, render.points, delta);
  }

  function renderBack(render, delta = null) {
    const globalShow =
      typeof window.__includeJakartaTokens === "function"
        ? window.__includeJakartaTokens() === true
        : false;
    const showParticles = render.moduleIsJakartaFocused || globalShow;

    const q =
      render.questionLang === "indo" && !showParticles
        ? stripParticlesForDisplay(render.question)
        : render.question;

    const a =
      render.answerLang === "indo" && !showParticles
        ? stripParticlesForDisplay(render.answer)
        : render.answer;

    backTextEl.textContent =
      `${q}\n────────\n${a}`;

    renderRegister(backRegisterEl, render.register);
    renderMetaBadges(backMetaBadgesEl, render.metaLabels);

    // Only show token badges when the particles are actually visible (or this is a dedicated module).
    if (showParticles) renderBadges(backBadgesEl, render.tokens, showParticles);
    else clearBadges(backBadgesEl);

    // Affix badges sit next to token badges
    renderAffixBadges(backBadgesEl, render, true);

    if (!showParticles) hideTagsPanel();
    renderPoints(backPointsEl, render.points, delta);
  }

  function renderRegister(el, register) {
    if (!el) return;

    el.style.display = "block";
    el.textContent = register.toUpperCase();
    el.dataset.register = register;

    // Make it behave like a small help button (without flipping the card)
    el.setAttribute("role", "button");
    el.tabIndex = 0;
    el.setAttribute("aria-label", `Register: ${register}. Click for explanation.`);

    el.onclick = (e) => {
      e.stopPropagation();
      openRegisterHelp(register);
    };
    el.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        openRegisterHelp(register);
      }
    };
  }

  function renderPoints(el, points, delta) {
    if (delta && delta !== 0) {
      const sign = delta > 0 ? "+" : "";
      const color = delta > 0 ? "#22c55e" : "#ef4444";

      el.innerHTML = `
        PTS ${points - delta}
        <span style="color:${color}; font-weight:600;">
          ${sign}${delta}
        </span>
      `;
    } else {
      el.textContent = `PTS ${points}`;
    }
  }

  return {
    buildRender,
    renderFront,
    renderBack,
    hideTagsPanel,
    hideAffixPanel
  };
}
