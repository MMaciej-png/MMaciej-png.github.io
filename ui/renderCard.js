export function createCardRenderer({
  frontTextEl,
  backTextEl,
  frontPointsEl,
  backPointsEl,
  frontRegisterEl,
  backRegisterEl
}) {

  function buildRender(cardObj) {
    const direction = Math.random() < 0.5 ? "IE" : "EI";

    return {
      direction,
      question: direction === "IE" ? cardObj.indo : cardObj.eng,
      answer: direction === "IE" ? cardObj.eng : cardObj.indo,
      points: cardObj.points,
      register: cardObj.register // ✅ KEEP REGISTER
    };
  }

  function renderFront(render, delta = null) {
    frontTextEl.textContent = render.question;
    renderRegister(frontRegisterEl, render.register);
    renderPoints(frontPointsEl, render.points, delta);
  }

  function renderBack(render, delta = null) {
    backTextEl.textContent =
      `${render.question}\n────────\n${render.answer}`;

    renderRegister(backRegisterEl, render.register);
    renderPoints(backPointsEl, render.points, delta);
  }

  function renderRegister(el, register) {
    if (!el) return;

    el.style.display = "block";
    el.textContent = register.toUpperCase();
    el.dataset.register = register;
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
    renderBack
  };
}
