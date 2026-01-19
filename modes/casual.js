/* modes/casual.js */

import { speak, setRate } from "../core/tts.js";
import { playCorrect, playWrong } from "../core/audio.js";

import { isCorrect } from "../engine/translate.js";
import { weightedRandom } from "../engine/selection.js";

import { loadItems } from "../data/loadData.js";
import { getItemStats, saveItemStats } from "../engine/itemStats.js";

import { applySuccess, applyFail } from "../engine/scoring.js";
import { createFlipController } from "../engine/flipcard.js";
import { createInputController } from "../engine/inputController.js";
import { createCardRenderer } from "../ui/renderCard.js";

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

async function refreshCasualRank() {
  const sr = await getCasualSR();
  updateCasualRankUI(sr);
}

async function refreshModulesPanel() {
  if (!modulesRenderer) return;

  const groups = await loadModulesMeta();

  if (groups["Smart Modes"]) {
    const all = groups["Smart Modes"].find(m => m.name === "All Modules");
    if (all) all.currentStreak = sessionStreak;
  }

  modulesRenderer.render(
    groups,
    activeModules,
    activeMode,
    contentFilter,
    registerFilter
  );
}

/* ===============================
   FILTER PIPELINE
=============================== */

function applyAllFilters() {
  let pool = [...allItems];

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

function pickNewCard({ resetRecency = false } = {}) {
  if (!items.length) return;

  if (resetRecency) {
    for (const i of items) i.lastSeen = null;
  }

  current = weightedRandom(items);
  if (!current) return;

  currentRender = renderer.buildRender(current);
  renderer.renderFront(currentRender);
  renderer.renderBack(currentRender);
}

/* ===============================
   ENGINE
=============================== */

export const casualEngine = (() => {

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
      backRegisterEl: document.querySelector("#casual-back .card-register")
    });

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

    /* ---------- FLIP ---------- */

    flip = createFlipController(card);

    flip.setOnAnswerShown(() => {
      nextItem = weightedRandom(items);
      if (!nextItem) return;
      nextRender = renderer.buildRender(nextItem);
      renderer.renderFront(nextRender);
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
      input.focus();

      card.classList.remove("correct", "wrong");
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
      if (locked && isCorrect(value, currentRender.answer, current.type)) {
        locked = false;
        flip.beginAdvance();
      }
    });

    inputController.bind();

    /* ---------- TTS ---------- */

    card.querySelectorAll(".tts-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const isAnswer = card.classList.contains("flipped");
        speak(
          isAnswer ? current.indo : currentRender.question,
          isAnswer
            ? "id-ID"
            : currentRender.direction === "IE"
              ? "id-ID"
              : "en-GB"
        );
      });
    });

    document
      .getElementById("c-tts-rate")
      ?.addEventListener("input", e => setRate(+e.target.value));

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
    input.focus();
  }

  /* ===============================
     ANSWERS
  =============================== */

  function checkAnswer(value) {
    if (locked) return;

    if (isCorrect(value, currentRender.answer, current.type)) {
      success();
    } else {
      attemptsLeft--;
      attemptsLeft <= 0 ? fail() : softFail();
    }
  }

  function success() {
    playCorrect();

    const before = current.points;
    applySuccess({ item: current, attemptsLeft });
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

    const before = current.points;
    applyFail({ item: current, attemptsLeft });
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
    setTimeout(() => card.classList.remove("wrong"), 300);
  }

  function updateSessionUI() {
    const total = sessionCorrect + sessionFailed;
    document.getElementById("c-ok").textContent = sessionCorrect;
    document.getElementById("c-bad").textContent = sessionFailed;
    document.getElementById("c-acc").textContent =
      total ? Math.round((sessionCorrect / total) * 100) + "%" : "0%";
    document.getElementById("c-streak").textContent = "🔥 " + sessionStreak;
  }

  return { start };
})();
