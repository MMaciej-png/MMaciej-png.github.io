/* ===============================
   NORMALISATION (LOCKED)
=============================== */

const EN_EQUIVALENTS = [

  /* ===============================
     CORE BE / HAVE / WILL
     =============================== */

  // be
  [/\bi['’]?m\b/g, "i am"],
  [/\byou['’]?re\b/g, "you are"],
  [/\bhe['’]?s\b/g, "he is"],
  [/\bshe['’]?s\b/g, "she is"],
  [/\bit['’]?s\b/g, "it is"],
  [/\bwe['’]?re\b/g, "we are"],
  [/\bthey['’]?re\b/g, "they are"],

  // have
  [/\bi['’]?ve\b/g, "i have"],
  [/\byou['’]?ve\b/g, "you have"],
  [/\bwe['’]?ve\b/g, "we have"],
  [/\bthey['’]?ve\b/g, "they have"],

  // will
  [/\bi['’]?ll\b/g, "i will"],
  [/\byou['’]?ll\b/g, "you will"],
  [/\bhe['’]?ll\b/g, "he will"],
  [/\bshe['’]?ll\b/g, "she will"],
  [/\bwe['’]?ll\b/g, "we will"],
  [/\bthey['’]?ll\b/g, "they will"],


  /* ===============================
     WOULD / HAD
     =============================== */

  [/\bi['’]?d\b/g, "i would"],
  [/\byou['’]?d\b/g, "you would"],
  [/\bhe['’]?d\b/g, "he would"],
  [/\bshe['’]?d\b/g, "she would"],
  [/\bwe['’]?d\b/g, "we would"],
  [/\bthey['’]?d\b/g, "they would"],


  /* ===============================
     NEGATION
     =============================== */

  [/\bcan['’]?t\b/g, "cannot"],
  [/\bwon['’]?t\b/g, "will not"],
  [/\bdon['’]?t\b/g, "do not"],
  [/\bdoesn['’]?t\b/g, "does not"],
  [/\bdidn['’]?t\b/g, "did not"],
  [/\bisn['’]?t\b/g, "is not"],
  [/\baren['’]?t\b/g, "are not"],
  [/\bwasn['’]?t\b/g, "was not"],
  [/\bweren['’]?t\b/g, "were not"],


  /* ===============================
     QUESTIONS / INTERROGATIVES
     =============================== */

  // how
  [/\bhow\s+are\s+you\b/g, "how are you"],
  [/\bhow['’]?s\s+it\s+going\b/g, "how are you"],
  [/\bhow\s+is\s+it\s+going\b/g, "how are you"],

  // what
  [/\bwhat['’]?s\b/g, "what is"],

  // why
  [/\bwhy\b/g, "why"],

  // where
  [/\bwhere\b/g, "where"],

  // when
  [/\bwhen\b/g, "when"],


  /* ===============================
     FUTURE / INTENT
     =============================== */

  // going to → will
  [/\b(am|are|is)\s+going\s+to\b/g, "will"],
  [/\b(gonna)\b/g, "will"],

  // want to
  [/\b(wanna)\b/g, "want to"],


  /* ===============================
     AGREEMENT / RESPONSE STYLE
     =============================== */

  [/\b(yes|yeah|yep|yup|ya)\b/g, "yes"],
  [/\b(no|nah|nope)\b/g, "no"],
  [/\bok\b/g, "okay"],


  /* ===============================
     DEGREE / INTENSITY
     =============================== */

  [/\b(really|very|so|super)\b/g, "very"],
  [/\b(kind\s+of|kinda|sort\s+of|sorta)\b/g, "kind of"],
  [/\b(a\s+bit|bit|little)\b/g, "a little"],


  /* ===============================
     TIME EXPRESSIONS
     =============================== */

  // now
  [/\b(right\s+now|now)\b/g, "now"],

  // later
  [/\b(later\s+on)\b/g, "later"],

  // today / tomorrow
  [/\b(today)\b/g, "today"],
  [/\b(tomorrow)\b/g, "tomorrow"],

  // tonight
  [/\b(tonight|later\s+tonight)\b/g, "tonight"],


  /* ===============================
     EARLY / LATE (SAFE PHRASES)
     =============================== */

  // early
  [/\b(early\s+on|quite\s+early)\b/g, "early"],
  [/\b(earlier\s+than\s+expected)\b/g, "early"],

  // late
  [/\b(running\s+late)\b/g, "late"],


  /* ===============================
     MOVEMENT / ARRIVAL
     =============================== */

  [/\b(come|arrive)\b/g, "come"],
  [/\b(go|leave|head\s+off)\b/g, "go"],
  [/\b(get\s+back|return)\b/g, "return"],
  [/\b(on\s+the\s+way)\b/g, "coming"],


  /* ===============================
     COMMUNICATION
     =============================== */

  [/\b(talk|chat)\b/g, "talk"],
  [/\b(text|message|dm)\b/g, "message"],


  /* ===============================
     POLITENESS / FILLERS (IGNORE)
     =============================== */

  [/\b(please|pls|plz|actually|just|like|right)\b/g, ""],


  /* ===============================
     NORMALISE PUNCTUATION / STYLE
     =============================== */

  [/\b(okay|ok)\b/g, "okay"],
  [/\b(good|tasty)\b/g, "good"],
];



const ID_EQUIVALENTS = [

  /* ===============================
     INTERROGATIVES / QUESTION STYLE
     =============================== */

  // how
  [/\b(gimana|bagaimana)\b/g, "bagaimana"],

  // what
  [/\b(apa)\b/g, "apa"],

  // why
  [/\b(kenapa|mengapa)\b/g, "kenapa"],

  // where
  [/\b(di\s+mana|dimana)\b/g, "dimana"],

  // when
  [/\b(kapan)\b/g, "kapan"],

  // common "how are you" constructions
  [/\b(apa\s+kabar(nya)?|gimana\s+kabar(nya)?|bagaimana\s+kabar(nya)?)\b/g, "kabar"],


  /* ===============================
     PRONOUNS (REGISTER + SLANG)
     =============================== */

  // I / me
  [/\b(aku|saya|gue|gua)\b/g, "aku"],

  // you
  [/\b(kamu|kau|anda|loe|lu)\b/g, "kamu"],

  // we
  [/\b(kita|kami)\b/g, "kita"],

  // they
  [/\b(mereka)\b/g, "mereka"],


  /* ===============================
     NEGATION (VERY IMPORTANT)
     =============================== */

  [/\b(ga|gak|nggak|enggak|tak|ndak)\b/g, "tidak"],


  /* ===============================
     ASPECT / TENSE MARKERS
     =============================== */

  // already
  [/\b(udah|sudah)\b/g, "sudah"],

  // currently
  [/\b(lagi|sedang)\b/g, "sedang"],

  // not yet
  [/\b(belum)\b/g, "belum"],


  /* ===============================
     DEGREE / INTENSITY
     =============================== */

  [/\b(banget|sekali)\b/g, "banget"],
  [/\b(dikit|sedikit)\b/g, "sedikit"],
  [/\b(paling)\b/g, "paling"],


  /* ===============================
     TIME / TEMPORAL EXPRESSIONS
     =============================== */

  // now
  [/\b(sekarang|skrng)\b/g, "sekarang"],

  // later
  [/\b(ntar|entar)\b/g, "nanti"],

  // earlier / before
  [/\b(tadi|dulu)\b/g, "dulu"],

  // tomorrow
  [/\b(besok)\b/g, "besok"],

  // tonight / later tonight
  [/\b(nanti\s+malam)\b/g, "malam"],

  // afternoon regional
  [/\b(petang)\b/g, "sore"],


  /* ===============================
     EARLY / TIME-OF-DAY (PHRASE SAFE)
     =============================== */

  // early morning expressions
  [/\b(pagi\s+pagi)\b/g, "pagi"],
  [/\b(pagi\s+sekali)\b/g, "pagi"],
  [/\b(dini\s+hari)\b/g, "pagi"],

  // dawn (optional but common)
  [/\b(subuh)\b/g, "pagi"],

  // earlier than expected
  [/\b(lebih\s+awal)\b/g, "lebih cepat"],


  /* ===============================
     MOTION / MOVEMENT VERBS
     =============================== */

  // arrive / come
  [/\b(datang|sampai)\b/g, "sampai"],

  // go / leave
  [/\b(pergi|berangkat)\b/g, "pergi"],

  // return
  [/\b(pulang|balik)\b/g, "pulang"],


  /* ===============================
     WANT / INTENT (BEGINNER FRIENDLY)
     =============================== */

  [/\b(mau|pengen|pengin|ingin)\b/g, "mau"],


  /* ===============================
     COMMUNICATION VERBS (LIGHT)
     =============================== */

  [/\b(ngobrol|bicara|omong)\b/g, "bicara"],
  [/\b(chat|ngechat|ngirim\s+pesan)\b/g, "pesan"],


  /* ===============================
     PARTICLES / FILLERS (IGNORE)
     =============================== */

  [/\b(aja)\b/g, "saja"],
  [/\b(kok|nih+h?|dong|sih|deh|lah)\b/g, ""],
  [/\b(ya|yah|lho)\b/g, ""],


  /* ===============================
     VERY LIGHT MORPHOLOGY STRIP
     (CASUAL-BEGINNER SAFE)
     =============================== */

  // ber- verbs → base
  [/\bber(\w+)\b/g, "$1"],

  // di- / ter- passive → base
  [/\b(di|ter)(\w+)\b/g, "$2"],


  /* ===============================
     REDUPLICATION
     =============================== */

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
