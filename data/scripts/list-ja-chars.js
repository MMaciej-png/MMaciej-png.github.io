/**
 * List all Japanese characters in content-ja.json and which ones lack a reading.
 * Run from project root: node data/list-ja-chars.js
 */
const fs = require("fs");
const path = require("path");

const JA_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

// From jaCharReadings.js: Hiragana + Katakana (all have readings)
const HIRAGANA =
  "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん" +
  "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ" +
  "ぁぃぅぇぉゃゅょっ";
const KATAKANA =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ" +
  "ァィゥェォャュョッ";
const HALFWIDTH = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";

const HAS_READING = new Set([...HIRAGANA, ...KATAKANA, ...HALFWIDTH]);
// Single-char Kanji from jaCharReadings KANJI_READINGS (must match engine/jaCharReadings.js)
const KANJI_IN_MAP = new Set([
  "私", "彼", "何", "今", "人", "日", "時", "行", "来", "食", "見", "言", "大", "小", "子", "友",
  "元", "気", "学", "校", "生", "先", "仕", "事", "持",
  "丈", "両", "他", "休", "会", "伝", "働", "分", "初", "前", "助", "午", "反", "台", "同", "名",
  "場", "夕", "多", "夜", "夫", "女", "好", "妻", "始", "嬉", "室", "家", "寝", "対", "少", "屋",
  "幸", "当", "待", "後", "忘", "忙", "急", "意", "愛", "所", "手", "新", "方", "族", "明", "昨",
  "普", "暑", "最", "朝", "本", "欲", "母", "氏", "浴", "父", "物", "疲", "着", "知", "空", "美",
  "腹", "良", "親", "話", "誰", "近", "通", "進", "達", "違", "部", "閉", "電", "願", "飲", "高",
  "零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万"
]);
KANJI_IN_MAP.forEach((c) => HAS_READING.add(c));

// Special chars that have no standalone reading (we map to "")
const NO_READING_OK = new Set(["ー", "っ", "ッ", "ｰ", "ﾞ", "ﾟ", "ヴ", "ヷ", "ヺ"]);

function collectStrings(obj, out) {
  if (typeof obj === "string") {
    if (JA_REGEX.test(obj)) out.push(obj);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => collectStrings(item, out));
    return;
  }
  if (obj && typeof obj === "object") {
    Object.values(obj).forEach((v) => collectStrings(v, out));
  }
}

function main() {
  const DATA_DIR = path.join(__dirname, "..");
  const contentPath = path.join(DATA_DIR, "content-ja.json");
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const strings = [];
  collectStrings(content, strings);

  const allChars = new Set();
  strings.forEach((s) => {
    if (!s || !s.trim()) return;
    for (const c of s) {
      if (JA_REGEX.test(c)) allChars.add(c);
    }
  });

  const missing = [];
  const hasReading = [];
  for (const c of allChars) {
    const inSet = HAS_READING.has(c);
    const isCJK = /[\u4E00-\u9FFF]/.test(c);
    if (isCJK && !inSet) missing.push(c);
    else if (inSet || NO_READING_OK.has(c)) hasReading.push(c);
    else if (!inSet && !NO_READING_OK.has(c)) missing.push(c);
  }

  // Sort missing: Kanji first (by code point), then others
  missing.sort((a, b) => a.codePointAt(0) - b.codePointAt(0));

  console.log("=== Japanese characters in content-ja.json ===\n");
  console.log("Total unique Japanese characters:", allChars.size);
  console.log("Characters WITH reading:", HAS_READING.size + " (built-in) +", hasReading.length, "from content");
  console.log("Characters MISSING reading:", missing.length);
  console.log("\n--- MISSING (need to add to jaCharReadings.js) ---\n");
  missing.forEach((c) => console.log(c, "U+" + c.codePointAt(0).toString(16).toUpperCase()));
  console.log("\n--- Sample strings containing missing chars ---");
  const missingSet = new Set(missing);
  const examples = [];
  strings.forEach((s) => {
    if (!s || s.length > 60) return;
    for (const c of s) {
      if (missingSet.has(c)) {
        examples.push(s.trim());
        return;
      }
    }
  });
  examples.slice(0, 30).forEach((s) => console.log(" ", s));
  return missing;
}

main();
