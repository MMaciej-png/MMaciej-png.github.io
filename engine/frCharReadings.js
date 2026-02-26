/**
 * French: no ruby for diacritics — they only add accents to normal letters (é→e, ç→c, etc.).
 * No character is mapped, so nothing is shown above French text.
 */
const MAP = new Map([]);

export function getReadingForChar(char) {
  return MAP.get(char) ?? "";
}

export function getReadingsForText(text) {
  return [...text].map((c) => getReadingForChar(c));
}
