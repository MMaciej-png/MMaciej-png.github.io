/**
 * Format vocab list for the chat LLM system prompt.
 * Uses langA/langB when present (language-pair aware), else indo/english.
 * @param {Array<{ indo?: string, english?: string, langA?: string, langB?: string, module: string, register?: string }>} vocab
 * @returns {string}
 */
export function formatVocabForPrompt(vocab) {
  if (!vocab || vocab.length === 0) return "";

  const byModule = new Map();
  for (const v of vocab) {
    const key = v.module || "General";
    if (!byModule.has(key)) byModule.set(key, []);
    const side1 = (v.langA != null && v.langB != null)
      ? (v.langA || "").trim()
      : (v.indo || "").trim();
    const side2 = (v.langA != null && v.langB != null)
      ? (v.langB || "").trim()
      : (v.english || "").trim();
    if (side1 || side2) byModule.get(key).push({ side1, side2 });
  }

  const lines = [];
  for (const [moduleName, entries] of byModule) {
    lines.push(`Module: ${moduleName}`);
    for (const { side1, side2 } of entries) {
      lines.push(`- ${side1 || "—"} / ${side2 || "—"}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
