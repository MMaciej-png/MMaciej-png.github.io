/**
 * Cyrillic (Russian) → Latin transliteration for showing readings above text on flashcards.
 * BGN/PCGN-style (familiar to English speakers): ш→sh, ч→ch, etc.
 */
const CYRILLIC_TO_LATIN = new Map([
  ["а", "a"], ["б", "b"], ["в", "v"], ["г", "g"], ["д", "d"], ["е", "e"], ["ё", "yo"], ["ж", "zh"], ["з", "z"],
  ["и", "i"], ["й", "y"], ["к", "k"], ["л", "l"], ["м", "m"], ["н", "n"], ["о", "o"], ["п", "p"], ["р", "r"],
  ["с", "s"], ["т", "t"], ["у", "u"], ["ф", "f"], ["х", "kh"], ["ц", "ts"], ["ч", "ch"], ["ш", "sh"], ["щ", "shch"],
  ["ъ", ""], ["ы", "y"], ["ь", ""], ["э", "e"], ["ю", "yu"], ["я", "ya"],
  ["А", "A"], ["Б", "B"], ["В", "V"], ["Г", "G"], ["Д", "D"], ["Е", "E"], ["Ё", "Yo"], ["Ж", "Zh"], ["З", "Z"],
  ["И", "I"], ["Й", "Y"], ["К", "K"], ["Л", "L"], ["М", "M"], ["Н", "N"], ["О", "O"], ["П", "P"], ["Р", "R"],
  ["С", "S"], ["Т", "T"], ["У", "U"], ["Ф", "F"], ["Х", "Kh"], ["Ц", "Ts"], ["Ч", "Ch"], ["Ш", "Sh"], ["Щ", "Shch"],
  ["Ъ", ""], ["Ы", "Y"], ["Ь", ""], ["Э", "E"], ["Ю", "Yu"], ["Я", "Ya"],
]);

/** Cyrillic range (Russian, common Slavic) */
const CYRILLIC_RANGE = /[\u0400-\u04FF]/;

export function getReadingForChar(char) {
  if (CYRILLIC_TO_LATIN.has(char)) return CYRILLIC_TO_LATIN.get(char);
  if (CYRILLIC_RANGE.test(char)) return ""; // other Cyrillic
  return "";
}

/**
 * Returns an array of Latin readings, one per character. Non-Cyrillic chars get "".
 */
export function getReadingsForText(text) {
  if (!text || typeof text !== "string") return [];
  return [...text].map((c) => getReadingForChar(c));
}
