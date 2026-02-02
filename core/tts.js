/* ===============================
   TEXT TO SPEECH ENGINE
   =============================== */

let rate = 1;
let volume = 1;

let voices = [];

let voiceCache = {
  id: null,
  en: null
};

/* -------------------------------
   VOICE LOADING
-------------------------------- */

function loadVoices() {
  voices = speechSynthesis.getVoices();

  voiceCache.id =
    voices.find(v => v.lang.toLowerCase().startsWith("id")) || null;

  voiceCache.en =
    voices.find(v => v.lang.toLowerCase().startsWith("en-gb")) ||
    voices.find(v => v.lang.toLowerCase().startsWith("en")) ||
    null;
}

if (speechSynthesis) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

/* -------------------------------
   PUBLIC CONTROLS
-------------------------------- */

export function setRate(r) {
  rate = r;
}

export function setVolume(v) {
  // Clamp to [0,1]
  const n = Number(v);
  volume = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
}

/* -------------------------------
   VARIATION HELPERS
-------------------------------- */

function jitter(value, range) {
  return value + (Math.random() * 2 - 1) * range;
}

/* subtle, safe ranges */
const RATE_JITTER = 0.05;   // ±5%
const PITCH_JITTER = 0.08; // very small prosody shift

const ID_PITCH_BASE = 1.05;
const EN_PITCH_BASE = 1.0;

/* -------------------------------
   SPEAK
-------------------------------- */

export function speak(text, lang = "en-GB") {
  if (!text) return;

  const prefix = lang.toLowerCase().startsWith("id") ? "id" : "en";

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;

  /* rate variation */
  u.rate = jitter(rate, RATE_JITTER);

  /* volume */
  u.volume = volume;

  /* pitch variation */
  const basePitch =
    prefix === "id" ? ID_PITCH_BASE : EN_PITCH_BASE;

  u.pitch = jitter(basePitch, PITCH_JITTER);

  /* voice selection */
  const v = voiceCache[prefix];
  if (v) u.voice = v;

  speechSynthesis.cancel();
  setTimeout(() => {
    speechSynthesis.speak(u);
  }, 30);

}
