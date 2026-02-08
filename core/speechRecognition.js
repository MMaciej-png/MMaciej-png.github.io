/**
 * Web Speech API wrapper for voice input.
 * Optional feature: only available when SpeechRecognition is supported.
 */

const SpeechRecognitionClass =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export function isSpeechRecognitionSupported() {
  return !!SpeechRecognitionClass;
}

/**
 * Create a speech recognition instance.
 * @param {Object} opts
 * @param {string} [opts.lang='id-ID'] - Language for recognition
 * @param {function(string)} [opts.onResult] - Called with final transcript
 * @param {function(Event)} [opts.onError] - Called on error
 * @param {function()} [opts.onEnd] - Called when recognition ends
 */
export function createSpeechRecognition(opts = {}) {
  if (!SpeechRecognitionClass) return null;

  const { lang = "id-ID", onResult, onError, onEnd } = opts;
  const rec = new SpeechRecognitionClass();

  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;

  rec.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join("");
    const last = e.results[e.results.length - 1];
    if (last.isFinal && transcript.trim() && onResult) {
      rec.stop();
      onResult(transcript.trim());
    }
  };

  rec.onerror = (e) => {
    if (onError) onError(e);
  };

  rec.onend = () => {
    if (onEnd) onEnd();
  };

  return rec;
}
