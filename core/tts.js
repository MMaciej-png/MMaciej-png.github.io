let rate = 1;

let voices = [];scrollX
let voiceCache = {
  id: null,
  en: null
};


function loadVoices() {
  voices = speechSynthesis.getVoices();

  voiceCache["id"] =
    voices.find(v => v.lang.toLowerCase().startsWith("id"))
    || null;

  voiceCache["en"] =
    voices.find(v => v.lang.toLowerCase().startsWith("en-gb"))
    || voices.find(v => v.lang.toLowerCase().startsWith("en"))
    || null;
}


if (speechSynthesis) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

export function setRate(r) {
  rate = r;
}

export function speak(text, lang = "en-GB") {
  if (!text) return;

  speechSynthesis.cancel();

  const prefix = lang.startsWith("id") ? "id" : "en";

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.pitch = prefix === "id" ? 1.05 : 1.0;

  const v = voiceCache[prefix];
  if (v) u.voice = v;

  speechSynthesis.speak(u);
}
