export function createSessionUI(root) {
  let correct = 0;
  let failed = 0;
  let streak = 0;

  function update() {
    const total = correct + failed;
    const acc = total ? Math.round((correct / total) * 100) : 0;

    root.querySelector("#c-ok").textContent = correct;
    root.querySelector("#c-bad").textContent = failed;
    root.querySelector("#c-acc").textContent = `${acc}%`;
    root.querySelector("#c-streak").textContent = `🔥 ${streak}`;
  }

  return {
    reset() {
      correct = 0;
      failed = 0;
      streak = 0;
      update();
    },

    success() {
      correct++;
      streak++;
      update();
    },

    fail() {
      failed++;
      streak = 0;
      update();
    }
  };
}
