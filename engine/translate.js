/* ===============================
   NORMALISATION (LOCKED)
=============================== */

const EN_EQUIVALENTS = [
  // ---- core be / have / will ----
  [/\bi['’]?m\b/g, "i am"],
  [/\byou['’]?re\b/g, "you are"],
  [/\bhe['’]?s\b/g, "he is"],
  [/\bshe['’]?s\b/g, "she is"],
  [/\bit['’]?s\b/g, "it is"],
  [/\bwe['’]?re\b/g, "we are"],
  [/\bthey['’]?re\b/g, "they are"],

  [/\bi['’]?ve\b/g, "i have"],
  [/\byou['’]?ve\b/g, "you have"],
  [/\bwe['’]?ve\b/g, "we have"],
  [/\bthey['’]?ve\b/g, "they have"],

  [/\bi['’]?ll\b/g, "i will"],
  [/\byou['’]?ll\b/g, "you will"],
  [/\bhe['’]?ll\b/g, "he will"],
  [/\bshe['’]?ll\b/g, "she will"],
  [/\bwe['’]?ll\b/g, "we will"],
  [/\bthey['’]?ll\b/g, "they will"],

  // ---- would / had (ambiguous but safe) ----
  [/\bi['’]?d\b/g, "i would"],
  [/\byou['’]?d\b/g, "you would"],
  [/\bhe['’]?d\b/g, "he would"],
  [/\bshe['’]?d\b/g, "she would"],
  [/\bwe['’]?d\b/g, "we would"],
  [/\bthey['’]?d\b/g, "they would"],

  // ---- negations ----
  [/\bcan['’]?t\b/g, "cannot"],
  [/\bwon['’]?t\b/g, "will not"],
  [/\bdon['’]?t\b/g, "do not"],
  [/\bdoesn['’]?t\b/g, "does not"],
  [/\bdidn['’]?t\b/g, "did not"],

  // ---- lets ----
  [/\blet['’]?s\b/g, "let us"],
  [/\blets\b/g, "let us"],

  // ---- filler words (forgiving) ----
  [/\b(really|just|actually|very)\b/g, ""]
];


const ID_EQUIVALENTS = [
  [/\b(ga|gak|nggak|enggak)\b/g, "tidak"],
  [/\b(udah|sudah)\b/g, "sudah"],
  [/\b(lagi|sedang)\b/g, "sedang"],
  [/\baja\b/g, "saja"],
  [/\b(kok|nih+h?)\b/g, ""]
];

/* ===============================
   LANGUAGE HEURISTIC
   (USED ELSEWHERE — NOT FOR GRADING)
=============================== */

export function inferLangFromExpected(expected) {
  if (typeof expected !== "string") return "EN";
  const t = expected.toLowerCase();

  const idHints = [
    "aku", "kamu", "dia", "kita", "kami", "mereka",
    "tidak", "nggak", "gak", "ga", "enggak",
    "yang", "di", "ke", "dari", "untuk", "dengan",
    "sudah", "udah", "belum", "lagi", "sedang",
    "aja", "saja", "kok", "nih"
  ];

  for (const w of idHints) {
    if (
      t.includes(` ${w} `) ||
      t.startsWith(`${w} `) ||
      t.endsWith(` ${w}`)
    ) {
      return "ID";
    }
  }

  return "EN";
}

function processBrackets(text) {
  if (!text.includes("(")) return [text];

  let variants = [text];
  const groupRegex = /\(([^)]+)\)/;

  while (variants.some(v => groupRegex.test(v))) {
    const next = [];

    for (const v of variants) {
      const match = v.match(groupRegex);
      if (!match) {
        next.push(v);
        continue;
      }

      const [full, inner] = match;

      // semantic alternatives
      if (inner.includes("/")) {
        for (const opt of inner.split("/")) {
          next.push(v.replace(full, opt.trim()));
        }
      }
      // non-semantic comment → remove entirely
      else {
        next.push(v.replace(full, ""));
      }
    }

    variants = next;
  }

  return variants;
}



/* ===============================
   NORMALISE
=============================== */

export function normalise(text, lang, expand = false) {
  if (typeof text !== "string") return expand ? [] : "";

  const inputs = expand
    ? processBrackets(text)
    : [text];


  let t = text.toLowerCase();

  // remove parentheses + quoted segments
  t = t.replace(/"[^"]*"/g, "");
  t = t.replace(/'[^']*'/g, "");

  // apply equivalences
  if (lang === "EN") {
    for (const [p, r] of EN_EQUIVALENTS) t = t.replace(p, r);
  } else {
    for (const [p, r] of ID_EQUIVALENTS) t = t.replace(p, r);
  }

  // punctuation + whitespace
  return t
    .replace(/[-–—]/g, " ")     // ← added: handle baik-baik etc.
    .replace(/[?.!,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ===============================
   SPLIT VARIANTS
=============================== */

export function splitExpectedVariants(expected) {
  if (typeof expected !== "string") return [];

  return expected
    .split("/")
    .map(s => s.trim())
    .filter(Boolean);
}

/* ===============================
   CORRECTNESS CHECK (FIXED)
=============================== */

/**
 * Casual grading rule:
 * - forgiving
 * - language-agnostic
 * - accepts EN or ID normalisation
 * - supports slash variants
 */
export function isCorrect(user, expected) {
  if (!user || !expected) return false;

  const variants = splitExpectedVariants(expected);

  const uEN = normalise(user, "EN")[0];
  const uID = normalise(user, "ID")[0];

  return variants.some(v => {
    const vENs = normalise(v, "EN", true);
    const vIDs = normalise(v, "ID", true);

    return (
      vENs.includes(uEN) ||
      vIDs.includes(uID)
    );
  });
}
