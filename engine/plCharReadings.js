/**
 * Polish characters that change sound (not just accent) → English pronunciation.
 * Only ł (L with stroke) is shown: it sounds like "w", not "l".
 * Other diacritics (ą, ę, ć, ń, ó, ś, ź, ż) are accented letters; no ruby.
 */
const MAP = new Map([
  ["ł", "w"],
  ["Ł", "w"],
]);

export function getReadingForChar(char) {
  return MAP.get(char) ?? "";
}

export function getReadingsForText(text) {
  return [...text].map((c) => getReadingForChar(c));
}
