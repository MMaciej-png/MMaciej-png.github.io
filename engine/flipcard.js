/* engine/flipcard.js
   Correct behavior:
   - Only update hidden face content.
   - Preload next question on hidden front AFTER question->answer transition completes.
   - Promote next card + clear input AFTER answer->question transition completes.
*/

export function createFlipController(cardEl) {
  const innerEl = cardEl.querySelector(".card-inner");
  if (!innerEl) {
    throw new Error("FlipController: .card-inner not found inside card");
  }

  let isFlipped = false;
  let isTransitioning = false;

  // callbacks
  let onAnswerShown = null;    // fires AFTER flip to answer completes (safe to render front)
  let onQuestionShown = null;  // fires AFTER flip back to question completes (safe to render back)

  function flipToAnswer() {
    if (isTransitioning || isFlipped) return;
    isTransitioning = true;
    isFlipped = true;
    cardEl.classList.add("flipped");
  }

  function beginAdvance() {
    if (isTransitioning || !isFlipped) return;
    isTransitioning = true;
    isFlipped = false;
    cardEl.classList.remove("flipped");
  }

  function handleTransitionEnd(e) {
    // We only care about the transform transition on .card-inner
    if (e.target !== innerEl) return;
    if (e.propertyName !== "transform") return;

    isTransitioning = false;

    // If we're flipped now, answer is visible; front is hidden → safe to render/preload next question on front
    if (cardEl.classList.contains("flipped")) {
      onAnswerShown?.();
      return;
    }

    // If we're not flipped, question is visible; back is hidden → safe to render/update back for current card
    onQuestionShown?.();
  }

  // click anywhere on card flips to answer (your existing behavior)
  cardEl.addEventListener("click", flipToAnswer);
  innerEl.addEventListener("transitionend", handleTransitionEnd);

  return {
    flipToAnswer,
    beginAdvance,

    setOnAnswerShown(fn) {
      onAnswerShown = fn;
    },

    setOnQuestionShown(fn) {
      onQuestionShown = fn;
    },

    get isTransitioning() {
      return isTransitioning;
    },

    get isFlipped() {
      return isFlipped;
    }
  };
}
