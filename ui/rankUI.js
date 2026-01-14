export function updateCasualRankUI({ rank, basePoints, delta }) {
  const img = document.getElementById("casual-rank-img");
  const srEl = document.getElementById("casual-rank-sr");

  if (!img || !srEl) return;

  const DISPLAY_SR_BASE = 1000;
  const sr = DISPLAY_SR_BASE + delta;

  img.src = `./images/${rank}.png`;
  img.alt = rank;

  srEl.textContent = sr;
}
