/* engine/runState.js */

export function createRunState() {
  return {
    current: null,
    currentRender: null,

    next: null,
    nextRender: null,

    attemptsLeft: 3,
    locked: false,

    resetCard() {
      this.attemptsLeft = 3;
      this.locked = false;
    }
  };
}
