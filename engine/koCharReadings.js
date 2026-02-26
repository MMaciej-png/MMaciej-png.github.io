/**
 * Hangul syllable → romaja (Revised Romanization of Korean).
 * Used to show reading above each character on Korean flashcards.
 */
const LEADING = [
  "g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"
];
const VOWEL = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"
];
const TRAILING = [
  "", "k", "k", "ks", "n", "nj", "nh", "t", "l", "lk", "lm", "lb", "ls", "lt", "lp", "lh", "m", "p", "ps", "s", "ng", "t", "ch", "k", "t", "p", "h", "h"
];

function hangulToRomaja(char) {
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "";
  const offset = code - 0xac00;
  const l = Math.floor(offset / 588);
  const v = Math.floor((offset % 588) / 28);
  const t = offset % 28;
  let out = LEADING[l] + VOWEL[v];
  if (t > 0) out += TRAILING[t];
  return out;
}

export function getReadingForChar(char) {
  if (/\p{L}/u.test(char) && (char >= "\uAC00" && char <= "\uD7A3")) {
    return hangulToRomaja(char);
  }
  return "";
}

export function getReadingsForText(text) {
  return [...text].map((c) => getReadingForChar(c));
}
