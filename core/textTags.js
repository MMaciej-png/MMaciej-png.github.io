// core/textTags.js
//
// Shared helpers for:
// - Jakarta texting token detection (particles / slang / abbreviations)
// - English label extraction like "(spoken)" so UI can show a badge

const TOKEN_DEFS = [
  // Particles / softeners
  { token: "nih", label: "NIH", meaning: "pointing / “here” / “this”" },
  { token: "sih", label: "SIH", meaning: "softener / emphasis" },
  { token: "kok", label: "KOK", meaning: "surprise / “how come?” tone" },
  { token: "dong", label: "DONG", meaning: "urging / “come on”" },
  { token: "deh", label: "DEH", meaning: "softening / casual closure" },
  { token: "tuh", label: "TUH", meaning: "pointing / “there” / “see?”" },

  // Abbreviations / shorteners
  { token: "gpp", label: "GPP", meaning: "it’s okay / no problem" },
  { token: "bgt", label: "BGT", meaning: "very / really" },
  { token: "udh", label: "UDH", meaning: "already" },
  { token: "blm", label: "BLM", meaning: "not yet" },
  { token: "otw", label: "OTW", meaning: "on my way" },
  { token: "wkwk", label: "WKWK", meaning: "laughing" },

  // Jakarta pronouns
  { token: "gue", label: "GUE", meaning: "I (Jakarta slang)" },
  { token: "gw", label: "GW", meaning: "I (Jakarta slang)" },
  { token: "lu", label: "LU", meaning: "you (Jakarta slang)" },
  { token: "lo", label: "LO", meaning: "you (Jakarta slang)" }
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeWordRegex(token) {
  // word-ish boundary: whitespace, start/end, or punctuation around the token.
  // This avoids matching inside longer words while still matching "gpp." or "(gpp)".
  const t = escapeRegExp(token);
  return new RegExp(`(^|[^\\p{L}\\p{N}_])(${t})(?=$|[^\\p{L}\\p{N}_])`, "giu");
}

/**
 * Detect Jakarta tokens in arbitrary text.
 * Returns unique tokens in first-seen order.
 */
export function detectJakartaTokens(text) {
  const s = String(text ?? "");
  if (!s.trim()) return [];

  const found = [];
  const seen = new Set();

  for (const def of TOKEN_DEFS) {
    const re = makeWordRegex(def.token);
    if (re.test(s)) {
      // reset not needed as we only care about existence
      if (!seen.has(def.label)) {
        seen.add(def.label);
        found.push({ ...def });
      }
    }
  }

  return found;
}

export function hasJakartaTokens(text) {
  return detectJakartaTokens(text).length > 0;
}

// Modules where Jakarta tokens are intentionally practiced.
// Token-bearing sentences outside these modules are treated as duplicates/noise.
const JAKARTA_FOCUSED_MODULES = new Set([
  "Jakarta Pronouns (Gue / Lu)",
  "Chat Softeners",
  "Text Abbreviations",
  "Daily Small Talk (Chat)",
  "Hangout Planning (Texting)",
  "Messaging Basics"
]);

export function isJakartaFocusedModule(moduleName) {
  return JAKARTA_FOCUSED_MODULES.has(String(moduleName ?? ""));
}

// Tokens that should NEVER be practiced as standalone word cards.
// They are “tone/metadata” and should only appear inside sentences + as badges.
const EXCLUDE_JAKARTA_WORD_TOKENS = new Set([
  // particles / softeners
  "nih", "sih", "kok", "dong", "deh", "tuh",
  // abbreviations / shorteners / chat noise
  "gpp", "bgt", "udh", "blm", "otw", "wkwk"
]);

function normalizeTokenWordForm(indo) {
  return String(indo ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.?!,:;()[\]{}"'“”]/g, "")
    .replace(/\s+/g, " ");
}

export function shouldExcludeWordFromPool(indo) {
  const s = normalizeTokenWordForm(indo);
  if (!s) return false;

  // Handle variant keys like "Gue / Gw" (split to tokens)
  const parts = s.split(/[\s/]+/g).filter(Boolean);

  // If this word entry is purely made of excluded token-words, exclude it.
  // Examples excluded: "deh", "wkwk", "otw", "udah", "belom/blm", "gpp", etc.
  // Examples NOT excluded: "gue", "lu" (pronouns are meaningful vocabulary).
  return parts.length > 0 && parts.every(p => EXCLUDE_JAKARTA_WORD_TOKENS.has(p));
}

/**
 * Extract UI-friendly labels from English strings like:
 * - "How (spoken)"  -> { clean: "How", labels: ["SPOKEN"] }
 *
 * We do NOT modify stored JSON; this is for display only.
 */
export function extractEnglishLabels(english) {
  const raw = String(english ?? "");
  const labels = [];

  const add = (x) => {
    if (!labels.includes(x)) labels.push(x);
  };

  // Common labels currently used in this repo
  if (/\(\s*spoken\s*\)/i.test(raw)) add("SPOKEN");
  if (/\(\s*casual\s*\)/i.test(raw)) add("CASUAL");

  // Strip only the label markers (keep the semantic English)
  const clean = raw
    .replace(/\s*\(\s*spoken\s*\)\s*/gi, " ")
    .replace(/\s*\(\s*casual\s*\)\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { raw, clean, labels };
}

export function getJakartaTokenMeaning(labelOrToken) {
  const q = String(labelOrToken ?? "").trim().toLowerCase();
  if (!q) return null;

  const def = TOKEN_DEFS.find(d =>
    d.label.toLowerCase() === q || d.token.toLowerCase() === q
  );
  return def?.meaning ?? null;
}

// For “particles mode” rendering: strip ONLY particles/softeners (not pronouns/abbr),
// so the sentence stays meaningful while becoming “clean”.
const PARTICLE_TOKENS = ["nih", "sih", "dong", "deh", "tuh"];

export function stripParticlesForDisplay(indo) {
  let t = String(indo ?? "");
  if (!t.trim()) return t;

  for (const p of PARTICLE_TOKENS) {
    const re = makeWordRegex(p);
    t = t.replace(re, "$1"); // keep leading boundary capture
  }

  // Clean up spacing/punctuation artifacts
  t = t
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([?.!,])/g, "$1")
    .replace(/([?.!,]){2,}/g, "$1")
    .trim();

  return t;
}

