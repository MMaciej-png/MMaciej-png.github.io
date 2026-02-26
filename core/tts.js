/* ===============================
   TEXT TO SPEECH ENGINE
   =============================== */

let rate = 1;
let volume = 1;

let voices = [];

/** Cache: locale prefix (e.g. "en", "ro", "id") -> Voice. Filled on demand. */
let voiceCache = {};

/* -------------------------------
   VOICE LOADING
-------------------------------- */

function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceCache = {};
}

/** Prefer Windows TTS (Microsoft) voices when available; they use local speech packages. */
function isWindowsVoice(v) {
  return v && /microsoft\s|windows\s|sapi/i.test(String(v.name || ""));
}

/** Get a voice for the given locale (e.g. "ro-RO", "en-GB"). Prefers Windows/Microsoft voices first, then exact match, then prefix; for Romanian, prefers Google/Romanian-named voices. */
function getVoiceForLocale(locale) {
  if (!locale || !voices.length) return null;
  const loc = locale.toLowerCase();
  const prefix = loc.split("-")[0];
  if (voiceCache[prefix]) return voiceCache[prefix];
  const matches = voices.filter(
    (v) =>
      v.lang.toLowerCase() === loc ||
      v.lang.toLowerCase().startsWith(prefix + "-") ||
      v.lang.toLowerCase().startsWith(prefix)
  );
  const windowsFirst = matches.find(isWindowsVoice);
  if (windowsFirst) {
    voiceCache[prefix] = windowsFirst;
    return windowsFirst;
  }
  const preferRo =
    prefix === "ro"
      ? (v) =>
          /google|romanian|microsoft/i.test(v.name) ||
          v.lang.toLowerCase().startsWith("ro-")
      : () => true;
  const v = matches.find(preferRo) || matches[0] || null;
  if (v) voiceCache[prefix] = v;
  return v;
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

/** Google TTS uses Romanian (ro-RO); Moldovan (mo/mo-MD) is not a separate locale. */
function toTtsLocale(lang) {
  if (!lang) return "en-GB";
  const l = String(lang).toLowerCase();
  if (l === "mo" || l === "moldovan" || l.startsWith("mo-")) return "ro-RO";
  return lang;
}

function doSpeak(text, locale) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale;

  u.rate = jitter(rate, RATE_JITTER);
  u.volume = volume;

  const v = getVoiceForLocale(locale);
  if (v) u.voice = v;

  const prefix = locale.toLowerCase().split("-")[0];
  const basePitch = prefix === "id" ? ID_PITCH_BASE : EN_PITCH_BASE;
  u.pitch = jitter(basePitch, PITCH_JITTER);

  speechSynthesis.cancel();
  setTimeout(() => speechSynthesis.speak(u), 30);
}

export function speak(text, lang = "en-GB") {
  if (!text) return;

  const locale = toTtsLocale(lang);
  loadVoices();

  /* Chrome often returns no voices until voiceschanged fires; defer once for non-English so a proper voice is used */
  const needsNonDefaultVoice =
    locale.toLowerCase().startsWith("ro-") ||
    (locale.toLowerCase() !== "en-gb" && locale.toLowerCase() !== "en-us");
  if (needsNonDefaultVoice && voices.length === 0) {
    const once = () => {
      speechSynthesis.removeEventListener("voiceschanged", once);
      loadVoices();
      doSpeak(text, locale);
    };
    speechSynthesis.addEventListener("voiceschanged", once);
    setTimeout(() => {
      loadVoices();
      if (voices.length > 0) {
        speechSynthesis.removeEventListener("voiceschanged", once);
        doSpeak(text, locale);
      }
    }, 400);
    return;
  }

  doSpeak(text, locale);
}
