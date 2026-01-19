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

  // ---- would / had ----
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

  // ---- future / intent ----
  [/\b(am|are|is)\s+going\s+to\b/g, "will"],
  [/\b(gonna|going to)\b/g, "will"],
  [/\b(wanna|want to)\b/g, "want to"],

  // ---- grouping ----
  [/\b(can not|cannot)\b/g, "can not"],
  [/\b(yes|yeah)\b/g, "yes"],
  [/\b(come|arrive)\b/g, "come"],
  [/\b(kind of|kinda|kindof)\b/g, "kind of"],

  // ---- time inference ----
  [/\b(am|are|is)\b(?=.*\b(today|tomorrow|later)\b)/g, "will"],

  // ---- quantity ----
  [/\b(little|a little|a bit|bit)\b/g, "a little"],

  // ---- fillers ----
  [/\b(really|just|actually|very|right|please|pls|are)\b/g, ""],

  // ---- normalise ok ----
  [/\b(ok|okay)\b/g, "okay"],
];



const ID_EQUIVALENTS = [
  // ---- negation ----
  [/\b(ga|gak|nggak|enggak)\b/g, "tidak"],

  // ---- tense / aspect ----
  [/\b(udah|sudah)\b/g, "sudah"],
  [/\b(lagi|sedang)\b/g, "sedang"],

  // ---- particles ----
  [/\baja\b/g, "saja"],
  [/\b(kok|nih+h?)\b/g, ""],
  [/\b(ya|yah)\b/g, ""],

  // ---- time ----
  [/\b(sekarang)\b/g, "sekarang"],
  [/\b(tadi|dulu)\b/g, "dulu"],

  // ---- quantity ----
  [/\b(sedikit|dikit)\b/g, "dikit"],

  // ---- motion ----
  [/\b(datang|sampai)\b/g, "sampai"],

  // ---- pronouns ----
  [/\b(aku|saya|gue)\b/g, "aku"],
  [/\b(kamu|kau)\b/g, "kamu"],

  // ---- morphology (CASUAL) ----
  [/\bber(\w+)\b/g, "$1"],
  [/\b(di|ter)(\w+)\b/g, "$2"],

  // ---- reduplication ----
  [/\b(\w+)-\1\b/g, "$1"],
];


// Tone-only tokens
const OPTIONAL_TOKENS = new Set([
  "kok", "nih", "dong", "sih", "deh", "akan", "ya", "yah"
]);

function isOptional(word) {
  return OPTIONAL_TOKENS.has(word);
}


/* ===============================
   ENCLITIC EXPANSION (VARIANT-BASED)
=============================== */

function expandEncliticsID(text) {
  const variants = new Set([text]);

  for (const v of [...variants]) {
    v.replace(/\b(\w+?)ku\b/g, (m, base) => {
      variants.add(`${base} ku`);
      return m;
    });

    v.replace(/\b(\w+?)mu\b/g, (m, base) => {
      variants.add(`${base} kamu`);
      return m;
    });

    v.replace(/\b(\w+?)nya\b/g, (m, base) => {
      variants.add(`${base} dia`);
      return m;
    });
  }

  return [...variants];
}


/* ===============================
   LANGUAGE HEURISTIC
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

  return idHints.some(w =>
    t.includes(` ${w} `) || t.startsWith(`${w} `) || t.endsWith(` ${w}`)
  ) ? "ID" : "EN";
}


/* ===============================
   BRACKET EXPANSION
=============================== */

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

      if (inner.includes("/")) {
        for (const opt of inner.split("/")) {
          next.push(v.replace(full, opt.trim()));
        }
      } else {
        next.push(v.replace(full, ""));
      }
    }

    variants = next;
  }

  return variants;
}


function containsAllRequiredTokens(userNorm, expectedNorm) {
  const expectedWords = new Set(expectedNorm.split(" "));
  const userWords = new Set(userNorm.split(" "));

  for (const w of expectedWords) {
    if (!isOptional(w) && !userWords.has(w)) {
      return false;
    }
  }
  return true;
}


/* ===============================
   NORMALISE
=============================== */

export function normalise(text, lang, expand = false) {
  if (typeof text !== "string") return expand ? [] : "";

  const inputs = expand ? processBrackets(text) : [text];

  if (lang === "ID") {
    return inputs.flatMap(input => {
      let base = input.toLowerCase()
        .replace(/"[^"]*"/g, "")
        .replace(/'[^']*'/g, "");

      const expanded = expandEncliticsID(base);

      return expanded.map(t => {
        for (const [p, r] of ID_EQUIVALENTS) t = t.replace(p, r);
        return t
          .replace(/[-–—]/g, " ")
          .replace(/[?.!,]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      });
    });
  }

  return inputs.map(input => {
    let t = input.toLowerCase()
      .replace(/"[^"]*"/g, "")
      .replace(/'[^']*'/g, "");

    for (const [p, r] of EN_EQUIVALENTS) t = t.replace(p, r);

    return t
      .replace(/[-–—]/g, " ")
      .replace(/[?.!,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  });
}


/* ===============================
   SPLIT VARIANTS
=============================== */

export function splitExpectedVariants(expected) {
  if (typeof expected !== "string") return [];

  return processBrackets(expected)
    .flatMap(s => s.split("/"))
    .map(s => s.trim())
    .filter(Boolean);
}


/* ===============================
   CORRECTNESS CHECK
=============================== */

export function isCorrect(user, expected) {
  if (!user || !expected) return false;

  const variants = splitExpectedVariants(expected);

  const uEN = normalise(user, "EN")[0];
  const uID = normalise(user, "ID")[0];

  return variants.some(v => {
    const vENs = normalise(v, "EN", true);
    const vIDs = normalise(v, "ID", true);

    return (
      vENs.some(vEN => containsAllRequiredTokens(uEN, vEN)) ||
      vIDs.some(vID => containsAllRequiredTokens(uID, vID))
    );
  });
}
