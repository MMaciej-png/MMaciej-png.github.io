// modes/ranked.js

import { playCorrect, playWrong } from "../core/audio.js";

export const rankedEngine = (() => {
  let root, card, front, back, input;
  let index = 0;
  let queue = [];
  let listeners = [];

  function start() {
    root = document.getElementById("ranked-root");
    root.hidden = false;

    document.getElementById("ranked-status").textContent = "Playing";

    buildDOM();
    bindEvents();
    buildQueue();
    render();
  }

  function stop() {
    listeners.forEach(off => off());
    listeners = [];
    if (root) {
      root.innerHTML = "";
      root.hidden = true;
    }
    const statusEl = document.getElementById("ranked-status");
    if (statusEl) statusEl.textContent = "Idle";
  }

  function buildDOM() {
    root.innerHTML = `
      <div class="card">
        <div class="card-inner">
          <div class="card-face">
            <span class="card-text" id="ranked-front"></span>
          </div>
          <div class="card-face card-back">
            <span class="card-text" id="ranked-back"></span>
          </div>
        </div>
      </div>
      <input id="ranked-input" placeholder="Ranked answer" />
    `;

    card = root.querySelector(".card");
    front = root.querySelector("#ranked-front");
    back = root.querySelector("#ranked-back");
    input = root.querySelector("#ranked-input");
  }

  function bindEvents() {
    const onKey = e => {
      if (e.key !== "Enter") return;

      if (input.value.trim().toLowerCase() === queue[index].back.toLowerCase()) {
        playCorrect();
      } else {
        playWrong();
      }

      index++;
      if (index >= queue.length) {
        stop();
        return;
      }
      render();
    };

    input.addEventListener("keydown", onKey);
    listeners.push(() => input.removeEventListener("keydown", onKey));
  }

  function buildQueue() {
    queue = [
      { front: "Terima kasih", back: "Thank you" },
      { front: "Selamat pagi", back: "Good morning" }
    ];
    index = 0;
  }

  function render() {
    const item = queue[index];
    front.textContent = item.front;
    back.textContent = `${item.front}\n\n${item.back}`;
    input.value = "";
    input.focus();
  }

  return { start, stop };
})();
