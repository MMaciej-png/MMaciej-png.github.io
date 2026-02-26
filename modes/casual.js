/* modes/casual.js */

// Cache-bust query prevents stale module caching during local testing
import { speak, setRate, setVolume } from "../core/tts.js?v=1";
import { playCorrect, playWrong } from "../core/audio.js";

import { isCorrect } from "../engine/translate.js";
import { getJaTextForTts, canConvertToHiragana } from "../engine/jaCharReadings.js";
import { weightedRandom } from "../engine/selection.js";

import { loadItems } from "../data/loadData.js";
import { getItemStats, saveItemStats } from "../engine/itemStats.js";
import { stripParticlesForDisplay } from "../core/textTags.js";
import { stripAffixMarkers } from "../core/affixTags.js";

import { applySuccess, applyFail } from "../engine/scoring.js";
import { createFlipController } from "../engine/flipcard.js";
import { createInputController } from "../engine/inputController.js";
import { createCardRenderer } from "../ui/cardRenderer.js";
import { isSpeechRecognitionSupported, createSpeechRecognition } from "../core/speechRecognition.js";

import { getCasualSR } from "../data/casualSR.js";
import { updateCasualRankUI } from "../ui/rankUI.js";

import { createModulesRenderer } from "../ui/modulesRenderer.js";
import { loadModulesMeta } from "../data/loadModulesMeta.js";

import {
  getModuleStats,
  saveModuleStats
} from "../data/moduleStats.js";

import {
  casualLifetime,
  updateCasualLifetimeUI
} from "../data/casualLifetimeStats.js";

import {
  getLanguagePair,
  setLanguagePair,
  getAllPairs,
  getFlagClass,
  getLanguageName,
  getTtsLocale,
  LANGUAGES,
  parsePair
} from "../data/languageConfig.js";

/* ===============================
   STATE
=============================== */

let card, cardInner, input;
let renderer, flip, inputController;
let modulesRenderer = null;

let allItems = [];
let items = [];

/* CONTENT FILTER */
let contentFilter = "all"; // "all" | "words" | "sentences"

/* REGISTER FILTER */
let registerFilter = "all"; // "all" | "informal" | "formal"

/* JAKARTA TOKENS FILTER */
const JAKARTA_TOKENS_KEY = "include_jakarta_tokens";
let includeJakartaTokens = false; // default OFF

/* AFFIX HELP (TEACHING) */
const AFFIX_HELP_KEY = "show_affix_help";
let showAffixHelp = false; // default OFF

/* JAPANESE: SHOW KANJI OR HIRAGANA */
const JA_SHOW_KANJI_KEY = "ja_show_kanji";
let showKanjiForJapanese = true; // default ON (show Kanji with ruby)

/* JAPANESE: SHOW KATAKANA OR CONVERT TO HIRAGANA */
const JA_SHOW_KATAKANA_KEY = "ja_show_katakana";
let showKatakanaForJapanese = true; // default ON (show Katakana); when OFF, display is Hiragana only

/* MODULE FILTERS */
let activeModules = new Set(); // empty = all modules
let activeMode = "modules";    // "modules" | "weakest"

/* CURRENT CARD */
let current = null;
let currentRender = null;
let nextItem = null;
let nextRender = null;

/* ATTEMPTS */
let attemptsLeft = 3;
let locked = false;

/* SESSION STATS */
let sessionCorrect = 0;
let sessionFailed = 0;
let sessionStreak = 0;
let sessionBestStreak = 0;

/* ===============================
   HELPERS
=============================== */

function syncMatchingItems(sourceItem) {
  const canonIndo = (s) => {
    const noAffix = stripAffixMarkers(String(s ?? ""));
    const noParticles = stripParticlesForDisplay(noAffix);
    return noParticles.trim().toLowerCase();
  };
  const canonEng = (s) => String(s ?? "").trim().toLowerCase();
  const canon = (s) => String(s ?? "").trim().toLowerCase();

  const useLangPair = sourceItem.langA != null && sourceItem.langB != null;
  const sourceA = useLangPair ? canon(sourceItem.langA) : canonIndo(sourceItem.indo);
  const sourceB = useLangPair ? canon(sourceItem.langB) : canonEng(sourceItem.eng);

  for (const item of allItems) {
    if (item === sourceItem || item.type !== sourceItem.type) continue;
    const match = useLangPair && item.langA != null && item.langB != null
      ? canon(item.langA) === sourceA && canon(item.langB) === sourceB
      : canonIndo(item.indo) === sourceA && canonEng(item.eng) === sourceB;
    if (match) {
      item.points = sourceItem.points;
      item.weight = sourceItem.weight;
      item.fail_streak = sourceItem.fail_streak;
      saveItemStats("casual", item.id, item);
    }
  }
}


async function refreshCasualRank() {
  const sr = await getCasualSR();
  updateCasualRankUI(sr);
}

async function refreshModulesPanel() {
  if (!modulesRenderer) return;

  const groups = await loadModulesMeta({
    contentFilter,
    registerFilter,
    languagePair: getLanguagePair()
  });

  if (groups["Smart Modes"]) {
    const all = groups["Smart Modes"].find(m => m.name === "All Modules");
    if (all) all.currentStreak = sessionStreak;
  }

  const [codeA, codeB] = parsePair(getLanguagePair());
  const pairIncludesJa = codeA === "ja" || codeB === "ja";
  const pairIncludesIndo = codeA === "indo" || codeB === "indo";

  modulesRenderer.render(
    groups,
    activeModules,
    activeMode,
    contentFilter,
    registerFilter,
    includeJakartaTokens,
    showAffixHelp,
    pairIncludesJa,
    showKanjiForJapanese,
    showKatakanaForJapanese,
    pairIncludesIndo
  );
}

/* ===============================
   FILTER PIPELINE
=============================== */

function applyAllFilters() {
  let pool = [...allItems];

  // Never show “token-only” word cards (particles/abbrevs/laughter).
  pool = pool.filter(i => !i.excludeFromPool);

  // Content filter
  if (contentFilter === "words") {
    pool = pool.filter(i => i.type === "word");
  } else if (contentFilter === "sentences") {
    pool = pool.filter(i => i.type === "sentence");
  }

  if (registerFilter !== "all") {
    pool = pool.filter(i =>
      i.register === registerFilter ||
      i.register === "neutral"
    );
  }

  // NOTE: Jakarta toggle now controls DISPLAY, not the pool.

  // When Kanji and Katakana are both OFF, only pool items we can fully convert to Hiragana.
  const [codeA, codeB] = parsePair(getLanguagePair());
  const pairIncludesJa = codeA === "ja" || codeB === "ja";
  if (pairIncludesJa && !showKanjiForJapanese && !showKatakanaForJapanese) {
    pool = pool.filter((i) => {
      if (i.langACode === "ja" && !canConvertToHiragana(i.langA)) return false;
      if (i.langBCode === "ja" && !canConvertToHiragana(i.langB)) return false;
      return true;
    });
  }

  // Module filter
  if (activeMode === "modules" && activeModules.size > 0) {
    pool = pool.filter(i => activeModules.has(i.module));
  }

  // Weakest override
  if (activeMode === "weakest") {
    pool = pool
      .sort((a, b) => a.points - b.points)
      .slice(0, 25);
  }

  items = pool;
}

function getCandidatePoolForPick() {
  // The Jakarta toggle is a DISPLAY toggle, but we must prevent
  // "looks-identical" duplicates when particles are hidden.
  if (includeJakartaTokens) return items;

  const out = [];
  const groups = new Map(); // key -> { best: item }

  for (const it of items) {
    // Only sentence cards can collapse to the same display text.
    // Dedicated Jakarta-focused modules always display tokens, so don't dedupe them.
    if (it.type !== "sentence" || it.moduleIsJakartaFocused) {
      out.push(it);
      continue;
    }
    if (!it.indo) {
      out.push(it);
      continue;
    }

    const stripped = stripParticlesForDisplay(it.indo);

    const key =
      `${it.type}::${it.module}::${it.register}::${stripped}`
        .toLowerCase();

    const g = groups.get(key) ?? { best: null };

    // Prefer the "clean" version if it exists (i.e. no particles in stored text).
    if (!g.best) g.best = it;
    else {
      const bestStripped = stripParticlesForDisplay(g.best.indo);
      const bestHasParticles = g.best.indo !== bestStripped;
      const itHasParticles = it.indo !== stripped;

      if (bestHasParticles && !itHasParticles) g.best = it;
      else if (bestHasParticles === itHasParticles) {
        // Tie-breaker: keep the weaker item (lower points) so practice stays meaningful.
        const bestPts = Number(g.best.points) || 0;
        const itPts = Number(it.points) || 0;
        if (itPts < bestPts) g.best = it;
      }
    }

    groups.set(key, g);
  }

  // Add one representative per collapsed group.
  for (const { best } of groups.values()) {
    if (best) out.push(best);
  }

  return out;
}

function pickNewCard({ resetRecency = false } = {}) {
  const candidatePool = getCandidatePoolForPick();
  if (!candidatePool.length) return;

  // Close tag panel on next card (with animation)
  renderer?.hideTagsPanel?.();
  renderer?.hideAffixPanel?.();

  if (resetRecency) {
    for (const i of candidatePool) i.lastSeen = null;
  }

  current = weightedRandom(candidatePool);
  if (!current) return;
  current.seen = (current.seen ?? 0) + 1;
  current.lastSeen = Date.now();
  currentRender = renderer.buildRender(current);
  renderer.renderFront(currentRender);
  renderer.renderBack(currentRender);
}

/* ===============================
   ENGINE
=============================== */

export const casualEngine = (() => {

  let langPairSelectorEl = null;
  let langPairPopupBackdrop = null;
  let langPairPopupEl = null;
  let langPairPopupSide = null;

  function showLangPairPopup(show, side) {
    langPairPopupSide = side;
    if (langPairPopupBackdrop) langPairPopupBackdrop.classList.toggle("is-open", show);
    if (langPairPopupEl) {
      langPairPopupEl.classList.toggle("is-open", show);
      langPairPopupEl.setAttribute("aria-hidden", show ? "false" : "true");
    }
    const trigger = langPairSelectorEl?.querySelector(`[data-side="${side}"]`);
    if (trigger) trigger.setAttribute("aria-expanded", show ? "true" : "false");
    if (show) {
      const onEsc = (e) => {
        if (e.key === "Escape") {
          showLangPairPopup(false, null);
          document.removeEventListener("keydown", onEsc);
        }
      };
      document.addEventListener("keydown", onEsc);
    }
  }

  function renderLangPairSelector(containerEl) {
    if (!containerEl) return;
    const current = getLanguagePair();
    const [codeA, codeB] = parsePair(current);
    containerEl.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "lang-pair-sides";

    const btnA = document.createElement("button");
    btnA.type = "button";
    btnA.className = "lang-pair-side-btn";
    btnA.setAttribute("data-side", "A");
    btnA.setAttribute("aria-label", "Change first language");
    btnA.setAttribute("aria-haspopup", "true");
    btnA.setAttribute("aria-expanded", "false");
    btnA.innerHTML = `<span class="fi ${getFlagClass(codeA)} lang-flag lang-flag-large" aria-hidden="true"></span><span class="lang-pair-side-name">${getLanguageName(codeA)}</span>`;
    btnA.onclick = () => showLangPairPopup(true, "A");
    wrap.appendChild(btnA);

    const sep = document.createElement("span");
    sep.className = "lang-pair-sep";
    sep.textContent = "↔";
    wrap.appendChild(sep);

    const btnB = document.createElement("button");
    btnB.type = "button";
    btnB.className = "lang-pair-side-btn";
    btnB.setAttribute("data-side", "B");
    btnB.setAttribute("aria-label", "Change second language");
    btnB.setAttribute("aria-haspopup", "true");
    btnB.setAttribute("aria-expanded", "false");
    btnB.innerHTML = `<span class="fi ${getFlagClass(codeB)} lang-flag lang-flag-large" aria-hidden="true"></span><span class="lang-pair-side-name">${getLanguageName(codeB)}</span>`;
    btnB.onclick = () => showLangPairPopup(true, "B");
    wrap.appendChild(btnB);

    containerEl.appendChild(wrap);

    if (!langPairPopupBackdrop) {
      langPairPopupBackdrop = document.createElement("div");
      langPairPopupBackdrop.className = "lang-pair-popup-backdrop";
      langPairPopupBackdrop.setAttribute("aria-hidden", "true");
      langPairPopupBackdrop.onclick = () => showLangPairPopup(false, null);
      document.body.appendChild(langPairPopupBackdrop);
    }
    if (!langPairPopupEl) {
      langPairPopupEl = document.createElement("div");
      langPairPopupEl.className = "lang-pair-popup";
      langPairPopupEl.setAttribute("role", "dialog");
      langPairPopupEl.setAttribute("aria-label", "Choose language");
      langPairPopupEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(langPairPopupEl);
    }

    langPairPopupEl.innerHTML = "";
    const title = document.createElement("div");
    title.className = "lang-pair-popup-title";
    title.textContent = "Choose language";
    langPairPopupEl.appendChild(title);
    const list = document.createElement("div");
    list.className = "lang-pair-popup-list";
    for (const lang of LANGUAGES) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "lang-pair-popup-option";
      option.innerHTML = `<span class="fi ${lang.flagClass} lang-flag lang-flag-large" aria-hidden="true"></span> ${lang.name}`;
      option.onclick = async () => {
        const side = langPairPopupSide;
        showLangPairPopup(false, null);
        const [a, b] = parsePair(getLanguagePair());
        const newA = side === "A" ? lang.code : a;
        const newB = side === "B" ? lang.code : b;
        if (newA === newB) return;
        const pair = `${newA}-${newB}`;
        if (pair !== getLanguagePair()) {
          setLanguagePair(pair);
          await reloadForNewPair();
        } else {
          renderLangPairSelector(containerEl);
        }
      };
      list.appendChild(option);
    }
    langPairPopupEl.appendChild(list);
  }

  async function reloadForNewPair() {
    const rawItems = await loadItems();
    allItems = rawItems.map(item => {
      const stats = getItemStats("casual", item.id);
      return {
        ...item,
        points: stats.points,
        weight: stats.weight,
        fail_streak: stats.fail_streak
      };
    });
    applyAllFilters();
    pickNewCard({ resetRecency: true });
    updateCasualLifetimeUI();
    refreshCasualRank();
    await refreshModulesPanel();
    if (langPairSelectorEl) renderLangPairSelector(langPairSelectorEl);
  }

  async function start() {
    card = document.getElementById("casual-card");
    cardInner = card.querySelector(".card-inner");
    input = document.getElementById("casual-input");

    renderer = createCardRenderer({
      frontTextEl: document.querySelector("#casual-front .card-text"),
      backTextEl: document.querySelector("#casual-back .card-text"),
      frontPointsEl: document.getElementById("c-points"),
      backPointsEl: document.getElementById("c-points-back"),
      frontRegisterEl: document.querySelector("#casual-front .card-register"),
      backRegisterEl: document.querySelector("#casual-back .card-register"),
      frontRegisterMetaEl: document.getElementById("c-register-meta-front"),
      backRegisterMetaEl: document.getElementById("c-register-meta-back"),
      frontBadgesEl: document.getElementById("c-badges-front"),
      backBadgesEl: document.getElementById("c-badges-back"),
      frontMetaBadgesEl: document.getElementById("c-meta-badges-front"),
      backMetaBadgesEl: document.getElementById("c-meta-badges-back"),
      tagsPanelEl: document.getElementById("c-tags-panel"),
      affixPanelEl: document.getElementById("c-affix-panel"),
      getShowKanjiForJapanese: () => showKanjiForJapanese,
      getShowKatakanaForJapanese: () => showKatakanaForJapanese
    });

    // Load persisted settings
    try {
      includeJakartaTokens = localStorage.getItem(JAKARTA_TOKENS_KEY) === "1";
    } catch {
      includeJakartaTokens = false;
    }

    try {
      showAffixHelp = localStorage.getItem(AFFIX_HELP_KEY) === "1";
    } catch {
      showAffixHelp = false;
    }

    try {
      showKanjiForJapanese = localStorage.getItem(JA_SHOW_KANJI_KEY) !== "0";
    } catch {
      showKanjiForJapanese = true;
    }

    try {
      showKatakanaForJapanese = localStorage.getItem(JA_SHOW_KATAKANA_KEY) !== "0";
    } catch {
      showKatakanaForJapanese = true;
    }

    // Expose as a tiny global getter so the renderer can react to toggles
    window.__includeJakartaTokens = () => includeJakartaTokens;
    window.__showAffixHelp = () => showAffixHelp;
    window.__showKanjiForJapanese = () => showKanjiForJapanese;
    window.__showKatakanaForJapanese = () => showKatakanaForJapanese;

    /* ---------- MODULES ---------- */

    modulesRenderer = createModulesRenderer({
      containerEl: document.querySelector(".modules-list"),
      onSelect: async (name, type) => {
        /* CONTENT TOGGLE */
        if (name === "__CONTENT_TOGGLE__") {
          contentFilter =
            contentFilter === "all" ? "words" :
              contentFilter === "words" ? "sentences" :
                "all";

          applyAllFilters();
          pickNewCard({ resetRecency: true });
          refreshModulesPanel();
          return;
        }

        /* REGISTER TOGGLE */
        if (name === "__REGISTER_TOGGLE__") {
          registerFilter =
            registerFilter === "all" ? "informal" :
              registerFilter === "informal" ? "formal" :
                "all";

          applyAllFilters();
          pickNewCard({ resetRecency: true });
          refreshModulesPanel();
          return;
        }

        /* PARTICLES DISPLAY TOGGLE */
        if (name === "__JAKARTA_TOGGLE__") {
          includeJakartaTokens = !includeJakartaTokens;
          try {
            localStorage.setItem(JAKARTA_TOKENS_KEY, includeJakartaTokens ? "1" : "0");
          } catch {}

          if (current) {
            currentRender = renderer.buildRender(current);
            renderer.renderFront(currentRender);
            renderer.renderBack(currentRender);
          }
          refreshModulesPanel();
          return;
        }

        /* AFFIX HELP TOGGLE */
        if (name === "__AFFIX_TOGGLE__") {
          showAffixHelp = !showAffixHelp;
          try {
            localStorage.setItem(AFFIX_HELP_KEY, showAffixHelp ? "1" : "0");
          } catch {}

          if (current) {
            currentRender = renderer.buildRender(current);
            renderer.renderFront(currentRender);
            renderer.renderBack(currentRender);
          }
          refreshModulesPanel();
          return;
        }

        /* KANJI TOGGLE (Japanese: show Kanji with ruby vs Hiragana only) */
        if (name === "__KANJI_TOGGLE__") {
          showKanjiForJapanese = !showKanjiForJapanese;
          try {
            localStorage.setItem(JA_SHOW_KANJI_KEY, showKanjiForJapanese ? "1" : "0");
          } catch {}

          if (current) {
            currentRender = renderer.buildRender(current);
            renderer.renderFront(currentRender);
            renderer.renderBack(currentRender);
          }
          refreshModulesPanel();
          return;
        }

        /* KATAKANA TOGGLE (Japanese: show Katakana vs convert to Hiragana) */
        if (name === "__KATAKANA_TOGGLE__") {
          showKatakanaForJapanese = !showKatakanaForJapanese;
          try {
            localStorage.setItem(JA_SHOW_KATAKANA_KEY, showKatakanaForJapanese ? "1" : "0");
          } catch {}

          if (current) {
            currentRender = renderer.buildRender(current);
            renderer.renderFront(currentRender);
            renderer.renderBack(currentRender);
          }
          refreshModulesPanel();
          return;
        }

        /* WEAKEST MODE */
        if (type === "weakest") {
          activeMode = "weakest";
          activeModules.clear();

          applyAllFilters();
          pickNewCard({ resetRecency: true });
          refreshModulesPanel();
          return;
        }

        /* ALL MODULES */
        if (type === "all") {
          activeMode = "modules";
          activeModules.clear();

          applyAllFilters();
          pickNewCard({ resetRecency: true });
          refreshModulesPanel();
          return;
        }

        /* NORMAL MODULE TOGGLE */
        activeMode = "modules";

        if (activeModules.has(name)) {
          activeModules.delete(name);
        } else {
          activeModules.add(name);
        }

        applyAllFilters();
        pickNewCard({ resetRecency: true });
        refreshModulesPanel();
      }
    });

    await refreshModulesPanel();

    /* ---------- MIC (voice input) – set up before flip so we can update mic in callbacks ---------- */

    const micBtn = document.getElementById("casual-mic-btn");
    const INPUT_PLACEHOLDER = "Type translation and press Enter";
    let currentRec = null;
    let stopMicOnNewCard = () => {};

    /* ---------- FLIP ---------- */

    flip = createFlipController(card);

    // Close tag panel immediately when the card is tapped/flipped
    card.addEventListener(
      "click",
      () => {
        renderer?.hideTagsPanel?.();
        renderer?.hideAffixPanel?.();
      },
      { capture: true }
    );

    flip.setOnAnswerShown(() => {
      nextItem = weightedRandom(getCandidatePoolForPick());
      if (!nextItem) return;
      nextRender = renderer.buildRender(nextItem);
      renderer.renderFront(nextRender);
      if (micBtn) micBtn.disabled = true;
    });

    flip.setOnQuestionShown(() => {
      if (!nextItem || !nextRender) return;

      current = nextItem;
      currentRender = nextRender;

      nextItem = null;
      nextRender = null;

      attemptsLeft = 3;
      locked = false;
      inputController.setLocked(false);

      renderer.renderBack(currentRender);
      input.value = "";
      fitInputText();
      input.focus();
      stopMicOnNewCard();

      card.classList.remove("correct", "wrong");
      if (micBtn) micBtn.disabled = false;
    });

    /* ---------- INPUT ---------- */

    inputController = createInputController({
      inputEl: input,
      cardEl: card,
      cardInnerEl: cardInner,
      flip
    });

    inputController.setOnSubmit(checkAnswer);
    inputController.setOnAdvance(() => flip.beginAdvance());
    inputController.setOnGiveUp(() => {
      attemptsLeft = 0;
      fail();
    });

    inputController.setOnUnlockAttempt(value => {
      const expected = currentRender.answerVariants?.length ? currentRender.answerVariants.join(" / ") : currentRender.answer;
      if (locked && isCorrect(value, expected, current.type)) {
        locked = false;
        flip.beginAdvance();
      }
    });

    inputController.bind();

    /* ---------- TRANSLATION INPUT – auto-fit font size ---------- */

    const MIN_INPUT_FONT_SIZE = 14;
    const MAX_INPUT_FONT_SIZE = 24;

    function fitInputText() {
      if (!input.value.trim()) {
        input.style.fontSize = "";
        input.style.height = "";
        return;
      }
      let size = MAX_INPUT_FONT_SIZE;
      input.style.fontSize = `${size}px`;
      while (size > MIN_INPUT_FONT_SIZE && input.scrollWidth > input.clientWidth) {
        size -= 2;
        input.style.fontSize = `${size}px`;
      }
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 200) + "px";
    }

    input.addEventListener("input", fitInputText);
    input.addEventListener("paste", () => setTimeout(fitInputText, 0));

    /* ---------- MIC (voice input) – wire up if supported ---------- */

    if (micBtn && isSpeechRecognitionSupported()) {
      micBtn.style.display = "";
      micBtn.disabled = card.classList.contains("flipped");

      function setMicListening(on) {
        micBtn.classList.toggle("is-listening", on);
        micBtn.setAttribute("aria-pressed", String(on));
        if (!on) micBtn.disabled = locked || card.classList.contains("flipped");
        input.placeholder = on
          ? `Listening in ${getLanguageName(currentRender?.answerLang || "en")}…`
          : INPUT_PLACEHOLDER;
      }

      stopMicOnNewCard = () => {
        if (currentRec) {
          currentRec.stop();
        }
        setMicListening(false);
      };

      micBtn.onclick = () => {
        if (locked || card.classList.contains("flipped") || !current) return;

        if (micBtn.classList.contains("is-listening")) {
          stopMicOnNewCard();
          return;
        }

        const lang = getTtsLocale(currentRender?.answerLang || "en");

        const rec = createSpeechRecognition({
          lang,
          onResult(transcript) {
            input.value = transcript;
            fitInputText();
            input.focus();
          },
          onError() {
            currentRec = null;
            setMicListening(false);
          },
          onEnd() {
            currentRec = null;
            setMicListening(false);
          },
        });

        if (rec) {
          currentRec = rec;
          setMicListening(true);
          rec.start();
        }
      };

      const origSetLocked = inputController.setLocked;
      inputController.setLocked = (v) => {
        origSetLocked(v);
        if (!micBtn.classList.contains("is-listening")) {
          micBtn.disabled = locked || card.classList.contains("flipped");
        }
      };
    }

    /* ---------- TTS ---------- */

    card.querySelectorAll(".tts-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const isAnswer = card.classList.contains("flipped");
        let text = isAnswer ? currentRender.answer : currentRender.question;
        const locale = isAnswer
          ? getTtsLocale(currentRender.answerLang)
          : getTtsLocale(currentRender.questionLang);
        if (locale && locale.toLowerCase().startsWith("ja")) {
          text = getJaTextForTts(text) || text;
        }
        speak(text, locale);
      });
    });

    document
      .getElementById("c-tts-rate")
      ?.addEventListener("input", e => setRate(+e.target.value));

    document
      .getElementById("c-tts-volume")
      ?.addEventListener("input", e => setVolume(+e.target.value));

    /* ---------- LOAD DATA ---------- */

    const rawItems = await loadItems();

    allItems = rawItems.map(item => {
      const stats = getItemStats("casual", item.id);
      return {
        ...item,
        points: stats.points,
        weight: stats.weight,
        fail_streak: stats.fail_streak
      };
    });

    applyAllFilters();
    pickNewCard({ resetRecency: true });

    updateCasualLifetimeUI();
    refreshCasualRank();
    langPairSelectorEl = document.getElementById("lang-pair-selector");
    renderLangPairSelector(langPairSelectorEl);
    input.focus();
  }

  /* ===============================
     ANSWERS
  =============================== */

  function checkAnswer(value) {
    if (locked) return;

    const expected = currentRender.answerVariants?.length ? currentRender.answerVariants.join(" / ") : currentRender.answer;
    if (isCorrect(value, expected, current.type)) {
      success();
    } else {
      attemptsLeft--;
      attemptsLeft <= 0 ? fail() : softFail();
    }
  }

  function success() {
    playCorrect();
    renderer?.hideTagsPanel?.();
    renderer?.hideAffixPanel?.();

    const before = current.points;
    applySuccess({ item: current, attemptsLeft });
    syncMatchingItems(current);
    saveItemStats("casual", current.id, current);

    renderer.renderBack(
      { ...currentRender, points: current.points },
      current.points - before
    );

    sessionCorrect++;
    sessionStreak++;
    sessionBestStreak = Math.max(sessionBestStreak, sessionStreak);

    casualLifetime.total++;
    casualLifetime.complete++;

    if (current.type === "word") {
      casualLifetime.word.total++;
      casualLifetime.word.correct++;
    } else {
      casualLifetime.sentence.total++;
      casualLifetime.sentence.correct++;
    }

    casualLifetime.bestStreak = Math.max(
      casualLifetime.bestStreak,
      sessionStreak
    );

    const m = getModuleStats(current.module);
    m.attempted++;
    m.correct++;
    m.currentStreak++;
    m.bestStreak = Math.max(m.bestStreak, m.currentStreak);
    saveModuleStats(current.module, m);

    card.classList.add("correct");
    flip.flipToAnswer();

    updateSessionUI();
    updateCasualLifetimeUI();
    refreshCasualRank();
    refreshModulesPanel();
  }

  function fail() {
    locked = true;
    playWrong();
    renderer?.hideTagsPanel?.();
    renderer?.hideAffixPanel?.();

    const before = current.points;
    applyFail({ item: current, attemptsLeft });
    syncMatchingItems(current);
    saveItemStats("casual", current.id, current);

    renderer.renderBack(
      { ...currentRender, points: current.points },
      current.points - before
    );

    sessionFailed++;
    casualLifetime.streaks.push(sessionStreak);
    sessionStreak = 0;

    casualLifetime.total++;
    casualLifetime.failed++;

    if (current.type === "word") casualLifetime.word.total++;
    else casualLifetime.sentence.total++;

    const m = getModuleStats(current.module);
    m.attempted++;
    m.currentStreak = 0;
    saveModuleStats(current.module, m);

    card.classList.add("wrong");
    flip.flipToAnswer();

    updateSessionUI();
    updateCasualLifetimeUI();
    refreshCasualRank();
    refreshModulesPanel();
  }

  function softFail() {
    card.classList.add("wrong");

    // ✅ Only auto-remove if NOT the final attempt
    if (attemptsLeft > 0) {
      setTimeout(() => {
        card.classList.remove("wrong");
      }, 300);
    }
  }

  function updateSessionUI() {
    const total = sessionCorrect + sessionFailed;
    document.getElementById("c-ok").textContent = sessionCorrect;
    document.getElementById("c-bad").textContent = sessionFailed;
    document.getElementById("c-acc").textContent =
      total ? Math.round((sessionCorrect / total) * 100) + "%" : "0%";
    document.getElementById("c-streak").textContent = "🔥 " + sessionStreak;
  }

  function getSelectedModuleNames() {
    if (activeModules.size > 0) return [...activeModules];
    return [...new Set(allItems.map((i) => i.module))];
  }

  function getVocabForChat() {
    return items.map((i) => ({
      indo: i.indo,
      english: i.eng,
      langA: i.langA,
      langB: i.langB,
      langACode: i.langACode,
      langBCode: i.langBCode,
      module: i.module,
      register: i.register
    }));
  }

  return { start, getSelectedModuleNames, getVocabForChat };
})();
