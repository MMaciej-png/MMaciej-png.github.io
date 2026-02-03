/**
 * Format vocab list for the chat LLM system prompt.
 * @param {Array<{ indo: string, english: string, module: string, register?: string }>} vocab
 * @returns {string}
 */
export function formatVocabForPrompt(vocab) {
  if (!vocab || vocab.length === 0) return "";

  const byModule = new Map();
  for (const v of vocab) {
    const key = v.module || "General";
    if (!byModule.has(key)) byModule.set(key, []);
    byModule.get(key).push({ indo: v.indo.trim(), english: (v.english || "").trim() });
  }

  const lines = [];
  for (const [moduleName, entries] of byModule) {
    lines.push(`Module: ${moduleName}`);
    for (const { indo, english } of entries) {
      if (indo) lines.push(`- ${indo} / ${english || "—"}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
