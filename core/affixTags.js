// core/affixTags.js
//
// Optional “teaching” helper:
// Detect common Indonesian affixes in a sentence and provide explanations.

function uniqBy(arr, keyFn) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function tokenizeWords(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Remove ONLY hyphens that represent explicit affix boundaries:
// - Prefix markers: di-kirim, ber-jalan, ter-tutup, meng-ajar, meny-apu, etc → dikirim, berjalan, tertutup, mengajar, menyapu
// - Suffix/clitic markers: masuk-kan, cari-i, rumah-ku, nama-nya → masukkan, carii, rumahku, namanya
// Keeps real hyphenated words like anak-anak.
export function stripAffixMarkers(text) {
  let s = String(text ?? "");
  if (!s.includes("-")) return s;

  // Prefix markers
  s = s.replace(
    /\b(di|ber|ter|me|mem|men|meng|meny)-(?=\p{L}{2,}\b)/giu,
    "$1"
  );

  // Suffix + clitic markers
  s = s.replace(
    /(\b\p{L}{2,})-(kan|i|ku|mu|nya)\b/giu,
    "$1$2"
  );

  return s;
}

function resolveKnownWordsParam(maybe) {
  if (!maybe) return null;
  if (maybe instanceof Set) return maybe;
  if (typeof maybe === "object" && maybe.knownWords instanceof Set) return maybe.knownWords;
  return null;
}

function makeKnownCheck(knownWords) {
  if (!(knownWords instanceof Set) || knownWords.size === 0) return null;
  return (w) => knownWords.has(String(w ?? "").toLowerCase());
}

const CLITIC_FALSE_POSITIVES = new Set([
  // common roots that *end* in these letters but are not clitics/suffixes
  "buku",
  "aku",
  "kaku",
  "suku",
  "kuku"
]);

// Possessive clitics are extremely common in real usage, but naive suffix
// detection causes embarrassing false positives (e.g. "buku" != "book + -ku").
// We only flag -KU/-MU/-NYA when it is very likely attached to a longer root.
function hasPossessiveClitic(w, clitic) {
  if (!w || w.length < 5) return false; // require some root
  if (CLITIC_FALSE_POSITIVES.has(w)) return false;
  return w.endsWith(clitic);
}

function stripSuffix(w, suffix) {
  const s = String(w ?? "");
  if (!s.endsWith(suffix)) return null;
  return s.slice(0, -suffix.length);
}

function stripPrefix(w, prefix) {
  const s = String(w ?? "");
  if (!s.startsWith(prefix)) return null;
  return s.slice(prefix.length);
}

const AFFIX_DEFS = [
  {
    id: "di-",
    label: "DI-",
    meaning:
      "Often means “is/was ___ed” (something is done to it).\nExample: dikirim = is sent.",
    match: (w, ctx) => {
      if (!/^di\p{L}{3,}$/u.test(w)) return false; // "dibuat", "dikirim"
      if (!ctx?.isKnown) return true;
      const base = stripPrefix(w, "di");
      return !!(base && base.length >= 3 && ctx.isKnown(base));
    }
  },
  {
    id: "meN-",
    label: "ME(N)-",
    meaning:
      "Often turns a root into an action word (a ‘doing’ verb).\nCommon spelling forms: me-, mem-, men-, meng-, meny-.",
    match: (w, ctx) => {
      if (!/^(me|mem|men|meng|meny)\p{L}{3,}$/u.test(w)) return false;
      if (!ctx?.isKnown) return true;

      // Try a few common root-recovery candidates (very rough, but helps reduce false positives).
      const candidates = [];
      for (const p of ["meny", "meng", "mem", "men", "me"]) {
        const rest = stripPrefix(w, p);
        if (!rest || rest.length < 2) continue;
        candidates.push(rest);
        if (p === "meny") candidates.push("s" + rest);
        if (p === "meng") candidates.push("k" + rest);
        if (p === "men") candidates.push("t" + rest);
        if (p === "mem") candidates.push("p" + rest);
      }
      return candidates.some(c => c.length >= 3 && ctx.isKnown(c));
    }
  },
  {
    id: "ber-",
    label: "BER-",
    meaning:
      "Often means “to do / to have / to be wearing ___” (a general activity/state).\nExample: bekerja = to work.",
    match: (w, ctx) => {
      if (!/^ber\p{L}{3,}$/u.test(w)) return false;
      if (!ctx?.isKnown) return true;
      const base = stripPrefix(w, "ber");
      return !!(base && base.length >= 3 && ctx.isKnown(base));
    }
  },
  {
    id: "ter-",
    label: "TER-",
    meaning:
      "Often means “accidentally / suddenly / already in that state”.\nExample: tertutup = closed (already/ended up closed).",
    match: (w, ctx) => {
      if (!/^ter\p{L}{3,}$/u.test(w)) return false;
      if (!ctx?.isKnown) return true;
      const base = stripPrefix(w, "ter");
      return !!(base && base.length >= 3 && ctx.isKnown(base));
    }
  },
  {
    id: "-kan",
    label: "-KAN",
    meaning:
      "Often means “make/let someone do ___” or “do ___ to something”.\nExample: masukkan = put it in.",
    match: (w, ctx) => {
      if (!/\p{L}{3,}kan$/u.test(w)) return false;
      if (!ctx?.isKnown) return true;
      const base = stripSuffix(w, "kan");
      return !!(base && base.length >= 3 && ctx.isKnown(base));
    }
  },
  {
    id: "-ku",
    label: "-KU",
    meaning:
      "Means “my ___”.\nExample: rumahku = my house.",
    match: (w, ctx) => {
      if (!hasPossessiveClitic(w, "ku")) return false;
      if (!ctx?.isKnown) return true;
      const base = stripSuffix(w, "ku");
      return !!(base && base.length >= 3 && ctx.isKnown(base));
    }
  },
  {
    id: "-mu",
    label: "-MU",
    meaning:
      "Means “your ___”.\nExample: namamu = your name.",
    match: (w, ctx) => {
      if (!hasPossessiveClitic(w, "mu")) return false;
      if (!ctx?.isKnown) return true;
      const base = stripSuffix(w, "mu");
      return !!(base && base.length >= 3 && ctx.isKnown(base));
    }
  },
  {
    id: "-nya",
    label: "-NYA",
    meaning:
      "Often means “his/her/their/its” or “the ___” (very common).\nExample: rumahnya = his house / the house.",
    match: (w, ctx) => {
      if (!(w.length >= 6 && w.endsWith("nya"))) return false;
      if (!ctx?.isKnown) return true;
      const base = stripSuffix(w, "nya");
      return !!(base && base.length >= 3 && ctx.isKnown(base));
    }
  },
  {
    id: "-i",
    label: "-I",
    meaning:
      "Often means “do ___ to/at/on something” (the action targets a place/thing).\nExample: isi = fill → isi-i (often seen as: isi + -i).",
    // Very noisy; keep conservative:
    // - minimum length
    // - avoid words that look like common roots (e.g. "ngerti") getting misread as "-i"
    match: (w, ctx) =>
      w.length >= 6 &&
      /\p{L}i$/u.test(w) &&
      !w.endsWith("ngerti") &&
      !w.endsWith("taksi") &&
      !w.endsWith("sini") &&
      !w.endsWith("ini") &&
      (!ctx?.isKnown || (() => {
        const base = stripSuffix(w, "i");
        return !!(base && base.length >= 3 && ctx.isKnown(base));
      })())
  }
];

export function detectAffixTags(indonesianText, knownWordsParam = null) {
  const raw = String(indonesianText ?? "");
  const knownWords = resolveKnownWordsParam(knownWordsParam);
  const isKnown = makeKnownCheck(knownWords);
  const ctx = { isKnown };

  // 1) Explicit marker detection (strong signal; do not require base-word evidence)
  const explicitHits = [];
  const byId = new Map(AFFIX_DEFS.map(d => [d.id, d]));

  // Find explicitly-marked affixes inside tokens
  for (const tok of tokenizeWords(raw)) {
    const mPrefix = tok.match(/^(di|ber|ter|me|mem|men|meng|meny)-(\p{L}{2,})$/u);
    if (mPrefix) {
      const pref = mPrefix[1];
      const id =
        pref === "di" ? "di-" :
          pref === "ber" ? "ber-" :
            pref === "ter" ? "ter-" :
              "meN-";
      const def = byId.get(id);
      if (def) explicitHits.push(def);
    }

    const mSuffix = tok.match(/^(\p{L}{2,})-(kan|i|ku|mu|nya)$/u);
    if (mSuffix) {
      const suf = mSuffix[2];
      const id =
        suf === "kan" ? "-kan" :
          suf === "i" ? "-i" :
            suf === "ku" ? "-ku" :
              suf === "mu" ? "-mu" :
                "-nya";
      const def = byId.get(id);
      if (def) explicitHits.push(def);
    }
  }

  // 2) Heuristic detection on marker-stripped text (robust for unmarked content)
  const stripped = stripAffixMarkers(raw);
  const words = tokenizeWords(stripped);
  if (!words.length && !explicitHits.length) return [];

  const hits = [...explicitHits];
  for (const w of words) {
    for (const def of AFFIX_DEFS) {
      try {
        if (def.match(w, ctx)) hits.push(def);
      } catch {
        // ignore matcher errors
      }
    }
  }

  return uniqBy(hits, (d) => d.id).map(d => ({
    id: d.id,
    label: d.label,
    meaning: d.meaning
  }));
}

