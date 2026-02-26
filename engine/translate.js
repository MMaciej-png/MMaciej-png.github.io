/* ===============================
   NORMALISATION (LOCKED)
=============================== */

import { getJaTextToRomaji } from "./jaCharReadings.js";

const EN_EQUIVALENTS = [

  /* ===============================
     CORE BE / HAVE / WILL
     =============================== */
  // be
  [/\bi['’]?m\b/g, "i am"],
  [/\byou['’]?re\b/g, "you are"],
  [/\bhe['’]?s\b/g, "he is"],
  [/\bshe['’]?s\b/g, "she is"],
  [/\bthere['’]?s\b/g, "there is"],
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

  [/\b(i am|i'm)\s+not\s+well\b/g, "i do not feel well"],

  // Optional: common variants
  [/\b(i am|i'm)\s+unwell\b/g, "i do not feel well"],
  [/\b(not\s+feeling\s+well)\b/g, "do not feel well"],


  /* ===============================
     QUESTIONS / INTERROGATIVES
     =============================== */

  [/\b(could\s+you|would\s+you)\b/g, "can you"],
  [/\b(can\s+u|could\s+u)\b/g, "can you"],

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
  [/\b(a\s+sec|a\s+second|a\s+moment)\b/g, "a moment"],
  [/\b(alright|alr|aight)\b/g, "okay"],
  [/\b(sure|suree|yea|ye)\b/g, "yes"],
  [/\b(yeah\s+okay|yeah\s+ok)\b/g, "okay"],
  [/\b(ha+|he+|haha+|hehe+|lol+|lmao+)\b/g, "haha"],
  [/\b(okay\s+then|alright\s+then|all\s+right\s+then)\b/g, "okay"],
  [/\b(yes|yeah|yep|yup|ya)\b/g, "yes"],
  [/\b(no|nah|nope)\b/g, "no"],
  [/\bok\b/g, "okay"],


  /* ===============================
     DEGREE / INTENSITY
     =============================== */

  [/\b(really|very|so|super)\b/g, "very"],
  [/\b(kind\s+of|kinda|sort\s+of|sorta)\b/g, "kind of"],
  [/\b(a\s+bit|bit|little)\b/g, "a little"],
  [/\b(it\s+is\s+fine|that\s+is\s+fine|fine)\b/g, "fine"],


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
  [/\b(mr|sir)\b/g, "mr"],
  [/\b(mrs|ma'am|maam)\b/g, "mrs"],
  [/\b(come|arrive)\b/g, "come"],
  [/\b(go|leave|head\s+off)\b/g, "go"],
  [/\b(get\s+back|return)\b/g, "return"],
  [/\b(on\s+the\s+way)\b/g, "coming"],
  [/\b(owns|own|has)\b/g, "has"],
  [/\b(quite|so|soo)\b/g, "so"],

  /* ===============================
     COMMUNICATION
     =============================== */
  [/\b(i\s+see|got\s+it|gotcha|i\s+get\s+it)\b/g, "understand"],
  [/\b(ok|oke|okay)\b/g, "oke"],
  [/\b(talk|chat)\b/g, "talk"],
  [/\b(text|message|dm)\b/g, "message"],
  [/\b(hello|hi|hey)\b/g, "hello"],
  [/\b(choose|pick)\b/g, "choose"],
  /* ===============================
     POLITENESS / FILLERS (IGNORE)
     =============================== */

  [/\b(please|pls|plz|actually|just|like|right)\b/g, ""],

  /* ===============================
   MEANING / CLARIFICATION
   =============================== */

  [/\b(mean|means|meaning)\b/g, "mean"],

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
  [/\b(tolongin|bantu)\b/g, "bantu"],
  [/\b(gimana|bagaimana)\b/g, "bagaimana"],
  [/\b(belum\s+sih)\b/g, "belum"],
  [/\b(kayaknya|kayanya)\b/g, "mungkin"],

  // what
  [/\b(apa)\b/g, "apa"],

  // why
  [/\b(halo|hai)\b/g, "halo"],
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
   [/\b(iya|oke)\b/g, "iya"],
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

  [/\b(gapapa|gak\s+apa\s+apa|nggak\s+apa\s+apa|tidak\s+apa\s+apa)\b/g, "tidak apa"],
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

  [/\b(sk|skrg|skr)\b/g, "sekarang"],
  [/\b(nt|ntr)\b/g, "nanti"],

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
   MEANING / CLARIFICATION
   =============================== */

  [/\b(berarti|artinya)\b/g, "berarti"],


  /* ===============================
     COMMUNICATION VERBS (LIGHT)
     =============================== */
  [/\b(oh\s+gitu|gitu\s+ya)\b/g, "mengerti"],
  [/\b(ngerti\s+kok)\b/g, "mengerti"],
  [/\b(ngobrol|bicara|omong)\b/g, "bicara"],
  [/\b(chat|ngechat|ngirim\s+pesan)\b/g, "pesan"],
  [/\b(nulis|tulis)\b/g, "tulis"],
  [/\b(enak|lezat|nikmat)\b/g, "enak"],
  [/\b(maksudnya)\b/g, "maksud"],
  /* ===============================
     PARTICLES / FILLERS (IGNORE)
     =============================== */
  [/\b(oh+|ohh+|ooh+)\b/g, "oh"],
  [/\b(yaudah|ya\s+udah)\b/g, "sudah"],
  [/\b(ha+|he+|haha+|hehe+|wkwk+|wk+)\b/g, "haha"],
  [/\b(aja)\b/g, "saja"],
  [/\b(kok|nih+h?|dong|sih|deh|lah)\b/g, ""],
  [/\b(ya|yah|lho)\b/g, ""],
  [/\b(deh)\b/g, ""],


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


/* ===============================
   POLISH EQUIVALENTS & NORMALISATION
=============================== */
const PL_DIACRITICS = [
  ["ą", "a"], ["ę", "e"], ["ć", "c"], ["ł", "l"], ["ń", "n"], ["ó", "o"], ["ś", "s"], ["ź", "z"], ["ż", "z"],
  ["Ą", "a"], ["Ę", "e"], ["Ć", "c"], ["Ł", "l"], ["Ń", "n"], ["Ó", "o"], ["Ś", "s"], ["Ź", "z"], ["Ż", "z"],
];
const PL_EQUIVALENTS = [
  [/\b(przepraszam\s+bardzo|przepraszam)\b/g, "przepraszam"],
  [/\b(dziękuję\s+bardzo|dziękuje|dziekuje)\b/g, "dziekuje"],
  [/\b(cześć|hej|hejka|siema)\b/g, "czesc"],
  [/\b(dobry\s+ranek|ranek)\b/g, "dzien dobry"],
  [/\b(do\s+widzenia|pa|na\s+razie)\b/g, "do widzenia"],
  [/\b(tak|no|aha)\b/g, "tak"],
  [/\b(nie|nope)\b/g, "nie"],
  [/\b(proszę|prosze)\b/g, "prosze"],
  [/\b(jestem|nazywam\s+się)\b/g, "jestem"],
];

/* ===============================
   FRENCH EQUIVALENTS & NORMALISATION
=============================== */
const FR_DIACRITICS = [
  ["à", "a"], ["â", "a"], ["ä", "a"], ["é", "e"], ["è", "e"], ["ê", "e"], ["ë", "e"], ["î", "i"], ["ï", "i"],
  ["ô", "o"], ["ù", "u"], ["û", "u"], ["ü", "u"], ["ÿ", "y"], ["ç", "c"], ["œ", "oe"], ["æ", "ae"],
  ["À", "a"], ["Â", "a"], ["Ä", "a"], ["É", "e"], ["È", "e"], ["Ê", "e"], ["Ë", "e"], ["Î", "i"], ["Ï", "i"],
  ["Ô", "o"], ["Ù", "u"], ["Û", "u"], ["Ü", "u"], ["Ÿ", "y"], ["Ç", "c"], ["Œ", "oe"], ["Æ", "ae"],
];
const FR_EQUIVALENTS = [
  [/\b(oui|ouais|ouaip|si|mouais)\b/g, "oui"],
  [/\b(non|nan|nope)\b/g, "non"],
  [/\b(bonjour|salut|coucou)\b/g, "bonjour"],
  [/\b(merci\s+beaucoup|merci)\b/g, "merci"],
  [/\b(au\s+revoir|à\s+bientôt|salut)\b/g, "au revoir"],
  [/\b(je\s+suis|j'ai)\b/g, "je"],
  [/\b(s'il\s+te\s+plaît|s'il\s+vous\s+plaît|stp|svp)\b/g, "s'il vous plait"],
  [/\b(excusez-moi|désolé|désolée|pardon)\b/g, "excusez-moi"],
];

/* ===============================
   MOLDOVAN / ROMANIAN EQUIVALENTS & NORMALISATION
=============================== */
const MO_DIACRITICS = [
  ["ă", "a"], ["â", "a"], ["î", "i"], ["ș", "s"], ["ț", "t"],
  ["Ă", "a"], ["Â", "a"], ["Î", "i"], ["Ș", "s"], ["Ț", "t"],
];
const MO_EQUIVALENTS = [
  [/\b(da|așa)\b/g, "da"],
  [/\b(nu|nope)\b/g, "nu"],
  [/\b(bună|buna|bună ziua|salut)\b/g, "buna"],
  [/\b(mulțumesc|multumesc|mersi)\b/g, "multumesc"],
  [/\b(la revedere|pa|pe mâine)\b/g, "la revedere"],
  [/\b(eu sunt|mă numesc)\b/g, "eu sunt"],
  [/\b(te rog|vă rog|vă rog)\b/g, "te rog"],
  [/\b(scuze|scuzeți-mă|scuzati-ma)\b/g, "scuze"],
];

/* ===============================
   RUSSIAN EQUIVALENTS & NORMALISATION (Cyrillic)
=============================== */
const RU_NORMALISE = [
  ["ё", "е"], ["Ё", "е"],
];
const RU_EQUIVALENTS = [
  [/\b(привет|прив|здравствуй|здравствуйте)\b/gu, "привет"],
  [/\b(спасибо|спс|благодарю)\b/gu, "спасибо"],
  [/\b(пока|до свидания|бывай)\b/gu, "пока"],
  [/\b(да|ага|угу|ну да)\b/gu, "да"],
  [/\b(нет|неа)\b/gu, "нет"],
  [/\b(пожалуйста|пжлста)\b/gu, "пожалуйста"],
  [/\b(извини|извините|прости|простите)\b/gu, "извини"],
  [/\b(меня зовут)\b/gu, "меня зовут"],
];

/* ===============================
   JAPANESE ROMAJI EQUIVALENTS (for answer matching)
=============================== */
const JA_EQUIVALENTS = [
  [/\u014d/g, "o"],  [/\u016b/g, "u"],  [/\u012b/g, "i"],  [/\u0113/g, "e"],  [/\u0101/g, "a"],  // macrons ō ū ī ē ā
  [/\b(arigatou|arigatō|arigato)\b/g, "arigatou"],
  [/\b(konnichiwa|konnichiha)\b/g, "konnichiwa"],
  [/\b(sensei|sensee)\b/g, "sensei"],
  [/\b(juu|jū|ju)\b/g, "juu"],
  [/\b(nana|shichi)\b/g, "nana"],
  [/\b(yon|shi)\b/g, "yon"],
  [/\b(ichi|iti)\b/g, "ichi"],
  [/\b(roku|rokuu)\b/g, "roku"],
  [/\b(hachi|hati)\b/g, "hachi"],
  [/\b(kyuu|kyu|ku)\b/g, "kyuu"],
  [/\b(gakkou|gakko)\b/g, "gakkou"],
  [/\b(toukyou|tokyo|tōkyō)\b/g, "tokyo"],
];

/* ===============================
   KOREAN ROMANIZATION EQUIVALENTS (Revised vs common spellings)
=============================== */
const KR_EQUIVALENTS = [
  [/\b(annyeong|anyeong|an-nyeong)\b/g, "annyeong"],
  [/\b(gamsa|kamsa|gam sa)\b/g, "gamsa"],
  [/\b(hanguk|han-guk)\b/g, "hanguk"],
  [/\b(jeoneun|jeo neun)\b/g, "jeoneun"],
  [/\b(imnida|ipnida|hamnida)\b/g, "imnida"],
];


// Tone-only tokens
const OPTIONAL_TOKENS = new Set([
  "kok", "nih", "dong", "sih", "deh", "akan", "ya", "yah", "lagi" , "haha", "saja"
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

/** Hangul syllables and Jamo */
const KR_SCRIPT = /[\uAC00-\uD7A3\u1100-\u11FF]/;
/** Hiragana, Katakana, or CJK (Kanji) */
const JA_SCRIPT = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

export function inferLangFromExpected(expected) {
  if (typeof expected !== "string") return "EN";
  if (KR_SCRIPT.test(expected)) return "KR";
  if (JA_SCRIPT.test(expected)) return "JA";

  const t = expected.toLowerCase();

  const plHints = [
    "jestem", "nazywam", "dziękuję", "przepraszam", "proszę", "cześć", "dobry",
    "witaj", "dzień", "dobranoc", "miło", "tak", "nie", "może", "okej", "pa"
  ];
  const hasPlDiacritics = /[ąęćłńóśźż]/i.test(expected);
  const hasPlWord = plHints.some(w =>
    t.includes(` ${w} `) || t.startsWith(`${w} `) || t.endsWith(` ${w}`) || t === w
  );
  if (hasPlDiacritics || hasPlWord) return "PL";

  const frHints = [
    "je", "tu", "il", "elle", "nous", "vous", "ils", "elles",
    "est", "sont", "avez", "suis", "bonjour", "merci", "oui", "non"
  ];
  const hasFrDiacritics = /[àâäæçéèêëïîôùûüÿœ]/i.test(expected);
  const hasFrWord = frHints.some(w =>
    t.includes(` ${w} `) || t.startsWith(`${w} `) || t.endsWith(` ${w}`) || t === w
  );
  if (hasFrDiacritics || hasFrWord) return "FR";

  const moHints = [
    "bună", "buna", "da", "nu", "mulțumesc", "multumesc", "eu", "tu", "el", "ea",
    "sunt", "este", "merci", "salut", "la revedere", "te rog", "scuze"
  ];
  const hasMoDiacritics = /[ăâîșț]/i.test(expected);
  const hasMoWord = moHints.some(w =>
    t.includes(` ${w} `) || t.startsWith(`${w} `) || t.endsWith(` ${w}`) || t === w
  );
  if (hasMoDiacritics || hasMoWord) return "MO";

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

  if (lang === "PL") {
    return inputs.map(input => {
      let t = input
        .toLowerCase()
        .replace(/"[^"]*"/g, "")
        .replace(/'[^']*'/g, "");
      for (const [from, to] of PL_DIACRITICS) t = t.split(from).join(to);
      for (const [p, r] of PL_EQUIVALENTS) t = t.replace(p, r);
      return t
        .replace(/[-–—]/g, " ")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    });
  }

  if (lang === "FR") {
    return inputs.map(input => {
      let t = input
        .toLowerCase()
        .replace(/"[^"]*"/g, "")
        .replace(/'[^']*'/g, "");
      for (const [from, to] of FR_DIACRITICS) t = t.split(from).join(to);
      for (const [p, r] of FR_EQUIVALENTS) t = t.replace(p, r);
      return t
        .replace(/[-–—]/g, " ")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    });
  }

  if (lang === "MO") {
    return inputs.map(input => {
      let t = input
        .toLowerCase()
        .replace(/"[^"]*"/g, "")
        .replace(/'[^']*'/g, "");
      for (const [from, to] of MO_DIACRITICS) t = t.split(from).join(to);
      for (const [p, r] of MO_EQUIVALENTS) t = t.replace(p, r);
      return t
        .replace(/[-–—]/g, " ")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    });
  }

  if (lang === "RU") {
    return inputs.map(input => {
      let t = input
        .toLowerCase()
        .replace(/"[^"]*"/g, "")
        .replace(/'[^']*'/g, "");
      for (const [from, to] of RU_NORMALISE) t = t.split(from).join(to);
      for (const [p, r] of RU_EQUIVALENTS) t = t.replace(p, r);
      return t
        .replace(/[-–—]/g, " ")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    });
  }

  if (lang === "JA") {
    return inputs.map(input => {
      let t = input
        .replace(/"[^"]*"/g, "")
        .replace(/'[^']*'/g, "");
      if (!JA_SCRIPT.test(t)) {
        t = t.toLowerCase();
        for (const [p, r] of JA_EQUIVALENTS) t = t.replace(p, r);
      }
      return t
        .replace(/[-–—]/g, " ")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    });
  }

  if (lang === "KR") {
    return inputs.map(input => {
      let t = input
        .replace(/"[^"]*"/g, "")
        .replace(/'[^']*'/g, "");
      if (!KR_SCRIPT.test(t)) {
        t = t.toLowerCase();
        for (const [p, r] of KR_EQUIVALENTS) t = t.replace(p, r);
      }
      return t
        .replace(/[-–—]/g, " ")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
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
  const expectedLang = inferLangFromExpected(expected);

  if (expectedLang === "PL") {
    const uPL = normalise(user, "PL")[0];
    return variants.some(v => {
      const vPLs = normalise(v, "PL", true);
      return vPLs.some(vPL => containsAllRequiredTokens(uPL, vPL));
    });
  }

  if (expectedLang === "FR") {
    const uFR = normalise(user, "FR")[0];
    return variants.some(v => {
      const vFRs = normalise(v, "FR", true);
      return vFRs.some(vFR => containsAllRequiredTokens(uFR, vFR));
    });
  }

  if (expectedLang === "MO") {
    const uMO = normalise(user, "MO")[0];
    return variants.some(v => {
      const vMOs = normalise(v, "MO", true);
      return vMOs.some(vMO => containsAllRequiredTokens(uMO, vMO));
    });
  }

  if (expectedLang === "RU") {
    const uRU = normalise(user, "RU")[0];
    return variants.some(v => {
      const vRUs = normalise(v, "RU", true);
      return vRUs.some(vRU => containsAllRequiredTokens(uRU, vRU));
    });
  }

  if (expectedLang === "JA") {
    const uJA = normalise(user, "JA")[0];
    return variants.some(v => {
      const vJAs = normalise(v, "JA", true);
      if (JA_SCRIPT.test(v)) {
        const romaji = getJaTextToRomaji(v);
        if (romaji) vJAs.push(...normalise(romaji, "JA", true));
      }
      return vJAs.some(vJA => containsAllRequiredTokens(uJA, vJA));
    });
  }

  if (expectedLang === "KR") {
    const uKR = normalise(user, "KR")[0];
    return variants.some(v => {
      const vKRs = normalise(v, "KR", true);
      return vKRs.some(vKR => containsAllRequiredTokens(uKR, vKR));
    });
  }

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
