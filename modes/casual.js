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

import { createRunState } from "../engine/runState.js";
import { getCasualSR } from "../data/casualSR.js";
import { updateCasualRankUI } from "../ui/rankUI.js";

async function refreshCasualRank() {
  const sr = await getCasualSR();
  updateCasualRankUI(sr);
}

const state = createRunState();


import {
  casualLifetime,
  updateCasualLifetimeUI
} from "../data/casualLifetimeStats.js";

/* ===============================
   CASUAL ENGINE
=============================== */

export const casualEngine = (() => {
  let card, cardInner, input;

  let items = [];
  let current = null;
  let currentRender = null;

  let nextItem = null;
  let nextRender = null;

  let attemptsLeft = 3;
  let locked = false;

  let flip;
  let inputController;
  let renderer;

  let sessionCorrect = 0;
  let sessionFailed = 0;
  let sessionStreak = 0;
  let sessionBestStreak = 0;

  updateSessionUI();

  /* ===============================
     START
  =============================== */

  async function start() {
    card = document.getElementById("casual-card");
    cardInner = card.querySelector(".card-inner");
    input = document.getElementById("casual-input");

    renderer = createCardRenderer({
      frontTextEl: document.querySelector("#casual-front .card-text"),
      backTextEl: document.querySelector("#casual-back .card-text"),
      frontPointsEl: document.getElementById("c-points"),
      backPointsEl: document.getElementById("c-points-back")
    });

    /* ---------- FLIP ---------- */

    flip = createFlipController(card);

    // STAGE next card when answer is shown
    // after flip finishes to answer side (answer is visible)
    flip.setOnAnswerShown(() => {
      nextItem = weightedRandom(items);
      if (!nextItem) return;

      nextRender = renderer.buildRender(nextItem);

      // ✅ render FRONT while front is hidden (safe)
      renderer.renderFront(nextRender);
    });

    // after flip finishes back to question side (question is visible)
    flip.setOnQuestionShown(promoteNextCard);


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
      if (isCorrect(value, currentRender.answer, current.type)) {
        locked = false;
        inputController.setLocked(false);
        flip.beginAdvance();
      }
    });

    inputController.setLocked(false);
    inputController.bind();

    /* ---------- TTS (STOP CLICK BUBBLE) ---------- */

    card.querySelectorAll(".tts-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();

        const isAnswer = card.classList.contains("flipped");
        if (isAnswer) {
          speak(current.indo, "id-ID");
        } else {
          const lang =
            currentRender.direction === "IE" ? "id-ID" : "en-GB";
          speak(currentRender.question, lang);
        }
      });
    });

    document
      .getElementById("c-tts-rate")
      ?.addEventListener("input", e => setRate(+e.target.value));

    /* ---------- LOAD DATA ---------- */

    const rawItems = await loadItems();

    items = rawItems.map(item => {
      const stats = getItemStats("casual", item.id);
      return {
        ...item,
        points: stats.points,
        weight: stats.weight,
        fail_streak: stats.fail_streak
      };
    });

    current = weightedRandom(items);
    if (!current) {
      console.error("CASUAL: no items loaded", items);
      return;
    }

    currentRender = renderer.buildRender(current);
    renderer.renderFront(currentRender);
    renderer.renderBack(currentRender);

    updateCasualLifetimeUI();
    refreshCasualRank();

    input.focus();
  }

  /* ===============================
     GAME LOGIC
  =============================== */

  function promoteNextCard() {
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
  }



  function checkAnswer(value) {
    if (isCorrect(value, currentRender.answer, current.type)) {
      success();
    } else {
      attemptsLeft--;
      attemptsLeft <= 0 ? fail() : softFail();
    }
  }

  function success() {

    playCorrect();

    const beforePoints = current.points;

    applySuccess({ item: current, attemptsLeft });
    saveItemStats("casual", current.id, current);

    const delta = current.points - beforePoints;

    currentRender.points = current.points;

    // ✅ render answer with delta
    renderer.renderBack(currentRender, delta);


    /* ---------- SESSION STATS ---------- */
    sessionCorrect++;
    sessionStreak++;
    sessionBestStreak = Math.max(sessionBestStreak, sessionStreak);

    /* ---------- LIFETIME STATS ---------- */
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

    card.classList.add("correct");

    // 🔑 FLIP THROUGH CONTROLLER
    flip.flipToAnswer();

    updateSessionUI();
    updateCasualLifetimeUI();
    refreshCasualRank();

  }


  function fail() {
    locked = true;
    inputController.setLocked(true);

    playWrong();
    
    const beforePoints = current.points;

    applyFail({ item: current, attemptsLeft });
    saveItemStats("casual", current.id, current);

    const delta = current.points - beforePoints;
    
    currentRender.points = current.points;

    // ✅ render answer with delta
    renderer.renderBack(currentRender, delta);

    /* ---------- SESSION STATS ---------- */
    sessionFailed++;
    casualLifetime.streaks.push(sessionStreak);
    sessionStreak = 0;

    /* ---------- LIFETIME STATS ---------- */
    casualLifetime.total++;
    casualLifetime.failed++;

    if (current.type === "word") {
      casualLifetime.word.total++;
    } else {
      casualLifetime.sentence.total++;
    }

    card.classList.add("wrong");

    // 🔑 FLIP THROUGH CONTROLLER
    flip.flipToAnswer();

    updateSessionUI();
    updateCasualLifetimeUI();
    refreshCasualRank();

  }

  function softFail() {
    card.classList.add("wrong");
    setTimeout(() => card.classList.remove("wrong"), 300);
  }

  function updateSessionUI() {
    const total = sessionCorrect + sessionFailed;
    const acc = total
      ? Math.round((sessionCorrect / total) * 100)
      : 0;

    document.getElementById("c-ok").textContent = sessionCorrect;
    document.getElementById("c-bad").textContent = sessionFailed;
    document.getElementById("c-acc").textContent = acc + "%";
    document.getElementById("c-streak").textContent = "🔥 " + sessionStreak;
  }


  return { start };
})();
