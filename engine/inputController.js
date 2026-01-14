/* engine/inputController.js */

/**
 * InputController
 * ---------------
 * Mode-agnostic input semantics.
 * Emits intent-level callbacks instead of game logic.
 */



export function createInputController({
    inputEl,
    cardEl,
    cardInnerEl,
    flip
}) {
    let locked = false;

    // callbacks (set by mode)
    let onSubmit = null;
    let onAdvance = null;
    let onUnlockAttempt = null;

    let onGiveUp = null;

    function handleKeyDown(e) {
        if (e.key !== "Enter") return;
        if (flip.isTransitioning) return;

        // ANSWER SIDE
        if (cardEl.classList.contains("flipped")) {
            if (locked) {
                onUnlockAttempt?.(inputEl.value);
                return;
            }

            onAdvance?.();
            return;
        }

        // QUESTION SIDE
        onSubmit?.(inputEl.value);
    }

    function handleCardClick() {
        if (flip.isTransitioning) return;

        // QUESTION SIDE → give up
        if (!cardEl.classList.contains("flipped")) {
            if (!locked) onGiveUp?.();
            return;
        }

        // ANSWER SIDE → advance
        if (!locked) onAdvance?.();
    }

    function bind() {
        inputEl.addEventListener("keydown", handleKeyDown);
        cardInnerEl.addEventListener("click", handleCardClick);
    }

    function unbind() {
        inputEl.removeEventListener("keydown", handleKeyDown);
        cardInnerEl.removeEventListener("click", handleCardClick);
    }

    return {
        bind,
        unbind,

        // lock control (mode decides when)
        setLocked(v) {
            locked = v;
        },

        // hooks
        setOnSubmit(fn) {
            onSubmit = fn;
        },
        setOnAdvance(fn) {
            onAdvance = fn;
        },
        setOnGiveUp(fn) {
            onGiveUp = fn;
        },
        setOnUnlockAttempt(fn) {
            onUnlockAttempt = fn;
        }

    };
}
