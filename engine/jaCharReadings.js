/**
 * One-to-one mapping: Japanese kana character → romaji reading.
 * Used to show reading above each character on flashcards without storing jaReading in content.
 * Hepburn romanization. Add kanji→reading as needed.
 */
const HIRAGANA =
  "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん" +
  "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ" +
  "ぁぃぅぇぉゃゅょっ";
const HIRAGANA_ROMAJI =
  "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n"
    .split(" ")
    .concat(
      "ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po".split(" "),
      "a i u e o ya yu yo".split(" "), // small ぁぃぅぇぉ ゃゅょ
      [""] // っ
    );

const KATAKANA =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ" +
  "ァィゥェォャュョッ";
const KATAKANA_ROMAJI =
  "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n"
    .split(" ")
    .concat(
      "ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po".split(" "),
      "a i u e o ya yu yo".split(" "),
      [""]
    );

const map = new Map();
[...HIRAGANA].forEach((c, i) => {
  map.set(c, HIRAGANA_ROMAJI[i] ?? "");
});
[...KATAKANA].forEach((c, i) => {
  map.set(c, KATAKANA_ROMAJI[i] ?? "");
});

// Prolonged sound mark (chōon ー): lengthens previous vowel; no standalone syllable
map.set("ー", "");

// Small tsu っ ッ: geminate consonant (doubles next consonant); show a hint so something displays
map.set("っ", "—");
map.set("ッ", "—");

// V series for loanwords (ヴ = "v", so ヴァ = va, ヴィ = vi, etc.)
map.set("ヴ", "v");
map.set("ヷ", "va");
map.set("ヺ", "vo");

// Half-width Katakana (U+FF71–U+FF9D): same romaji as full-width ア–ン (no ヲ in half-width, so ﾜ=wa, ﾝ=n)
const HALFWIDTH_KATAKANA =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
const HALFWIDTH_ROMAJI =
  "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa n".split(" ");
[...HALFWIDTH_KATAKANA].forEach((c, i) => {
  map.set(c, HALFWIDTH_ROMAJI[i] ?? "");
});
// Half-width prolonged sound, dakuten, handakuten (no standalone reading)
map.set("ｰ", "");   // half-width chōon U+FF70
map.set("ﾞ", "");   // half-width dakuten
map.set("ﾟ", "");   // half-width handakuten

// Common Kanji (primary reading) so pronunciation appears above kanji too
const KANJI_READINGS = new Map([
  ["私", "watashi"],
  ["彼", "kare"],
  ["彼女", "kanojo"],
  ["何", "nani"],
  ["今", "ima"],
  ["人", "hito"],
  ["日", "hi"],
  ["時", "toki"],
  ["行", "iku"],
  ["来", "ku"],
  ["食", "ta"],
  ["見", "mi"],
  ["言", "i"],
  ["大", "dai"],
  ["小", "shou"],
  ["子", "ko"],
  ["友", "tomo"],
  ["名前", "namae"],
  ["元", "gen"],
  ["気", "ki"],
  ["元気", "genki"],
  ["学", "gaku"],
  ["校", "kou"],
  ["学校", "gakkou"],
  ["生", "sei"],
  ["学生", "gakusei"],
  ["先", "sen"],
  ["先生", "sensei"],
  ["仕", "shi"],
  ["事", "ji"],
  ["持", "mo"],
  ["私たち", "watashitachi"],
  // From content-ja audit (single Kanji)
  ["丈", "take"],
  ["両", "ryou"],
  ["他", "ta"],
  ["休", "yasu"],
  ["会", "ka"],
  ["伝", "tsuta"],
  ["働", "hatara"],
  ["分", "bun"],
  ["初", "hatsu"],
  ["前", "mae"],
  ["助", "tasu"],
  ["午", "go"],
  ["反", "han"],
  ["台", "dai"],
  ["同", "dou"],
  ["名", "na"],
  ["場", "ba"],
  ["夕", "yuu"],
  ["多", "ta"],
  ["夜", "yoru"],
  ["夫", "otto"],
  ["女", "onna"],
  ["好", "su"],
  ["妻", "tsuma"],
  ["始", "haji"],
  ["嬉", "ureshi"],
  ["室", "shitsu"],
  ["家", "ie"],
  ["寝", "ne"],
  ["対", "tai"],
  ["少", "shou"],
  ["屋", "ya"],
  ["幸", "shiawase"],
  ["当", "tou"],
  ["待", "ma"],
  ["後", "ato"],
  ["忘", "wasu"],
  ["忙", "isoga"],
  ["急", "kyuu"],
  ["意", "i"],
  ["愛", "ai"],
  ["所", "tokoro"],
  ["手", "te"],
  ["新", "atarashi"],
  ["方", "kata"],
  ["族", "zoku"],
  ["明", "aka"],
  ["昨", "saku"],
  ["普", "fu"],
  ["暑", "atsu"],
  ["最", "sai"],
  ["朝", "asa"],
  ["本", "hon"],
  ["欲", "hoshi"],
  ["母", "haha"],
  ["氏", "shi"],
  ["浴", "yo"],
  ["父", "chichi"],
  ["物", "mono"],
  ["疲", "tsuka"],
  ["着", "tsu"],
  ["知", "shi"],
  ["空", "sora"],
  ["美", "utsukushi"],
  ["腹", "hara"],
  ["良", "yo"],
  ["親", "oya"],
  ["話", "hana"],
  ["誰", "dare"],
  ["近", "chika"],
  ["通", "tou"],
  ["進", "susu"],
  ["達", "tachi"],
  ["違", "chiga"],
  ["部", "bu"],
  ["閉", "toji"],
  ["電", "den"],
  ["願", "nega"],
  ["飲", "no"],
  ["高", "taka"],
  // Numbers (primary reading)
  ["零", "rei"],
  ["一", "ichi"],
  ["二", "ni"],
  ["三", "san"],
  ["四", "yon"],
  ["五", "go"],
  ["六", "roku"],
  ["七", "nana"],
  ["八", "hachi"],
  ["九", "kyuu"],
  ["十", "juu"],
  ["百", "hyaku"],
  ["千", "sen"],
  ["万", "man"],
]);
KANJI_READINGS.forEach((reading, kanji) => {
  if (kanji.length === 1) map.set(kanji, reading);
});

/** Phrases where the reading differs from literal (e.g. は as particle = "wa", ー lengthens vowel). Checked before per-char. */
const PHRASE_READINGS = new Map([
  // Hiragana
  ["こんにちは", "konnichiwa"],
  ["こんにちわ", "konnichiwa"],
  ["ありがとう", "arigatou"],
  ["ありがとうございます", "arigatou gozaimasu"],
  // Katakana loanwords (long vowel ー = double vowel in romaji)
  ["コーヒー", "koohii"],
  ["テレビ", "terebi"],
  ["パソコン", "pasokon"],
  ["インターネット", "intaanetto"],
  ["ラーメン", "raamen"],
  ["カレー", "karee"],
  ["スーパー", "suupaa"],
  ["ノート", "nooto"],
  ["ペン", "pen"],
  ["ビール", "biiru"],
  ["タクシー", "takushii"],
  ["ホテル", "hoteru"],
  ["レストラン", "resutoran"],
  ["アメリカ", "amerika"],
  ["イギリス", "igirisu"],
  ["コンピューター", "konpyuutaa"],
  ["スマートフォン", "sumaatofon"],
  ["コピー", "kopii"],
  ["プリンター", "purintaa"],
  // Kanji phrases (whole-word reading)
  ["私たち", "watashitachi"],
  ["彼女", "kanojo"],
  ["名前", "namae"],
  ["元気", "genki"],
  ["学校", "gakkou"],
  ["学生", "gakusei"],
  ["先生", "sensei"],
  ["持っている", "motteiru"],
  ["良い", "yoi"],
  ["着く", "tsuku"],
  ["来る", "kuru"],
  ["午後", "gogo"],
  ["夕方", "yuugata"],
  ["大丈夫です", "daijoubu desu"],
  ["お願いします", "onegaishimasu"],
  ["会う", "au"],
  ["後で", "ato de"],
  ["最初", "saisho"],
  ["進む", "susumu"],
  ["お腹が空いた", "onaka ga suita"],
  ["疲れた", "tsukareta"],
  ["始める", "hajimeru"],
  ["友達", "tomodachi"],
  ["彼氏", "kareshi"],
  ["普通", "futsuu"],
  ["昨日", "kinou"],
  ["明日", "ashita"],
  ["欲しい", "hoshii"],
  ["違う", "chigau"],
  ["飲む", "nomu"],
  ["知る", "shiru"],
  ["寝る", "neru"],
  ["話す", "hanasu"],
  ["新しい", "atarashii"],
  ["美しい", "utsukushii"],
  ["少ない", "sukunai"],
  ["近い", "chikai"],
  // Number phrases
  ["十七", "juu nana"],
  ["十", "juu"],
]);

export function getPhraseReading(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.trim();
  return PHRASE_READINGS.get(t) ?? null;
}

export function getReadingForChar(char) {
  return map.get(char) ?? "";
}

/** Iteration mark 々 (and ゝヽ) repeats the previous character's reading. */
const JA_ITERATION_MARKS = new Set(["々", "ゝ", "ヽ"]);

/** Build per-character readings from the store. Returns array of readings (same length as chars), empty string where not in store. */
export function getReadingsForText(text) {
  if (!text || typeof text !== "string") return [];
  const chars = [...text];
  const readings = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (JA_ITERATION_MARKS.has(c)) {
      readings.push(readings.length > 0 ? readings[readings.length - 1] : "");
    } else {
      readings.push(getReadingForChar(c));
    }
  }
  return readings;
}

/** Convert Japanese text to romaji (for answer matching). Uses phrase reading if available, else per-char joined. */
export function getJaTextToRomaji(text) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  const phrase = PHRASE_READINGS.get(t) ?? KANJI_READINGS.get(t);
  if (phrase) return phrase;
  const readings = getReadingsForText(t);
  return readings.every((r) => r !== "") ? readings.join("") : "";
}

/** Kanji/phrase → Hiragana for TTS so the engine says "watashi" not "shi" for 私. */
const JA_HIRAGANA_FOR_TTS = new Map([
  ["私", "わたし"],
  ["彼", "かれ"],
  ["彼女", "かのじょ"],
  ["何", "なに"],
  ["私たち", "わたしたち"],
  ["名前", "なまえ"],
  ["元気", "げんき"],
  ["学校", "がっこう"],
  ["学生", "がくせい"],
  ["先生", "せんせい"],
  ["持っている", "もっている"],
  ["良い", "よい"],
  ["来る", "くる"],
  ["着く", "つく"],
  ["午後", "ごご"],
  ["夕方", "ゆうがた"],
  ["彼氏", "かれし"],
  ["友達", "ともだち"],
  ["忙", "いそが"],
  ["忙しい", "いそがしい"],
  ["少", "しょう"],
  ["少々お待ちください", "しょうしょうおまちください"],
  ["待", "ま"],
]);

/** Romaji syllable → Hiragana (for converting KANJI_READINGS romaji to Hiragana). Longest-first order. */
const ROMAJI_SYLLABLES = [
  "chi", "tsu", "shi", "sha", "shu", "sho", "cha", "chu", "cho", "ja", "ju", "jo",
  "ga", "gi", "gu", "ge", "go", "za", "ji", "zu", "ze", "zo", "da", "de", "do",
  "ba", "bi", "bu", "be", "bo", "pa", "pi", "pu", "pe", "po",
  "ka", "ki", "ku", "ke", "ko", "sa", "su", "se", "so", "ta", "te", "to",
  "na", "ni", "nu", "ne", "no", "ha", "hi", "fu", "he", "ho", "ma", "mi", "mu", "me", "mo",
  "ya", "yu", "yo", "ra", "ri", "ru", "re", "ro", "wa", "wo", "n",
  "a", "i", "u", "e", "o"
].sort((a, b) => b.length - a.length);

const ROMAJI_TO_HIRAGANA = new Map();
[...HIRAGANA].forEach((h, i) => {
  const r = HIRAGANA_ROMAJI[i];
  if (r) ROMAJI_TO_HIRAGANA.set(r, h);
});
["じゃ", "じゅ", "じょ", "ちゃ", "ちゅ", "ちょ", "しゃ", "しゅ", "しょ"].forEach((h, i) => {
  ROMAJI_TO_HIRAGANA.set(["ja", "ju", "jo", "cha", "chu", "cho", "sha", "shu", "sho"][i], h);
});

function romajiToHiragana(romaji) {
  if (!romaji || typeof romaji !== "string") return "";
  let s = romaji.toLowerCase().trim();
  const out = [];
  while (s.length) {
    if (/^\s+/.test(s)) {
      out.push(s.match(/^\s+/)[0]);
      s = s.replace(/^\s+/, "");
      continue;
    }
    if (s.length >= 2 && s[0] === s[1] && /[kstp]/.test(s[0])) {
      out.push("っ");
      s = s.slice(1);
      continue;
    }
    let matched = false;
    for (const syl of ROMAJI_SYLLABLES) {
      if (s.startsWith(syl) && ROMAJI_TO_HIRAGANA.has(syl)) {
        out.push(ROMAJI_TO_HIRAGANA.get(syl));
        s = s.slice(syl.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push(s[0]);
      s = s.slice(1);
    }
  }
  return out.join("");
}

/**
 * Return Japanese text as Hiragana where we have a reading, so TTS says e.g. わたし not し for 私.
 * Iteration mark 々 repeats the previous character's Hiragana.
 * Falls back to KANJI_READINGS romaji→Hiragana for single Kanji so more content is convertible when Kanji is OFF.
 */
export function getJaTextForTts(text) {
  if (!text || typeof text !== "string") return text;
  const t = text.trim();
  const full = JA_HIRAGANA_FOR_TTS.get(t);
  if (full) return full;
  const chars = [...t];
  const out = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (JA_ITERATION_MARKS.has(c)) {
      if (out.length) out.push(out[out.length - 1]);
      else out.push(c);
    } else {
      let h = JA_HIRAGANA_FOR_TTS.get(c);
      if (h == null && c.length === 1) {
        const romaji = KANJI_READINGS.get(c);
        if (romaji) h = romajiToHiragana(romaji.replace(/\s+/g, ""));
      }
      out.push(typeof h === "string" && h ? h : c);
    }
  }
  return out.join("");
}

/** Full-width Katakana range that maps to Hiragana by subtracting 0x60. */
const KATAKANA_FW_START = 0x30a1;
const KATAKANA_FW_END = 0x30f6;

/**
 * Convert Katakana (full-width and half-width) to Hiragana.
 * When the user turns "Katakana: OFF", we show everything in Hiragana.
 */
export function katakanaToHiragana(text) {
  if (!text || typeof text !== "string") return text;
  return [...text].map((c) => {
    const code = c.codePointAt(0);
    if (code >= KATAKANA_FW_START && code <= KATAKANA_FW_END) {
      return String.fromCodePoint(code - 0x60);
    }
    const halfIdx = HALFWIDTH_KATAKANA.indexOf(c);
    if (halfIdx >= 0) {
      const fw = KATAKANA[halfIdx];
      const fwCode = fw.codePointAt(0);
      if (fwCode >= KATAKANA_FW_START && fwCode <= KATAKANA_FW_END) {
        return String.fromCodePoint(fwCode - 0x60);
      }
      return fw;
    }
    return c;
  }).join("");
}

/** Hiragana block (U+3040–U+309F). Allow space, full-width space, 。、・？！…— */
const HIRAGANA_START = 0x3040;
const HIRAGANA_END = 0x309f;
const JA_ALLOWED_NON_HIRAGANA = /^[\s。、・？！…—　]$/;

function isHiraganaOrAllowed(c) {
  const code = c.codePointAt(0);
  if (code >= HIRAGANA_START && code <= HIRAGANA_END) return true;
  return JA_ALLOWED_NON_HIRAGANA.test(c);
}

/**
 * True if the text can be fully converted to Hiragana (Kanji→Hiragana, Katakana→Hiragana).
 * Used to exclude from pool when user has Kanji OFF and Katakana OFF so only Hiragana is shown.
 */
export function canConvertToHiragana(text) {
  if (!text || typeof text !== "string") return true;
  const step = katakanaToHiragana(getJaTextForTts(text));
  return [...step].every(isHiraganaOrAllowed);
}
