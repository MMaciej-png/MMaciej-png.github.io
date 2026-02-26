import { getModuleStats } from "./moduleStats.js";
import { getModuleId, getModuleDisplayName, getCategoryForModuleKey } from "./moduleIds.js";
import { shouldExcludeWordFromPool, isJakartaFocusedModule } from "../core/textTags.js";
import { getLanguagePair, parsePair, LANGUAGES } from "./languageConfig.js";
import { canConvertToHiragana } from "../engine/jaCharReadings.js";

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

function getTranslation(entry, code) {
  const v = entry?.translations?.[code] ?? entry?.[code];
  if (v !== undefined && v !== null) return String(Array.isArray(v) ? v[0] : v).trim();
  const lang = byCode.get(code);
  if (!lang) return "";
  const raw = entry[lang.contentKey] ?? entry[lang.code] ?? (lang.contentKey === "english" ? entry.eng : null) ?? "";
  return String(raw).trim();
}

const CATEGORY_ORDER = [
  "Smart Modes",
  "Getting started",
  "How are you?",
  "Making plans",
  "Clarifying & help",
  "Opinions & agreement",
  "Connecting ideas",
  "People & things",
  "Daily life",
  "Questions & tone",
  "Sharing & reacting",
  "Chat & texting",
  "Other"
];

const SUBCATEGORY_ORDER = {
  "Getting started": ["Greetings", "Thanks & goodbyes", "Numbers, time & place"],
  "How are you?": ["Ask & answer", "Not so good", "Reactions"],
  "Making plans": ["Invite & respond", "When & how often"],
  "Clarifying & help": ["Clarifying", "Requests", "Can & know"],
  "Opinions & agreement": ["Agree & disagree", "Change topic"],
  "Connecting ideas": ["Because & so", "But & then", "If & like"],
  "People & things": ["With, for & whose", "People & choice", "Family & friends", "Couple talk"],
  "Daily life": ["What I'm doing", "Food, places & going", "Venting"],
  "Questions & tone": ["Yes or no", "Softening"],
  "Sharing & reacting": ["Sharing & compliments"],
  "Chat & texting": ["Casual you & I", "Chat phrases", "Shorteners"],
  "Other": ["Uncategorised"]
};




/**
 * Loads grouped module metadata for the UI
 */
export async function loadModulesMeta(options = {}) {
    const languagePair = options?.languagePair ?? getLanguagePair();
    const [langACode, langBCode] = parsePair(languagePair);
    const { loadContentForPair } = await import("./loadContent.js");
    const content = await loadContentForPair(langACode, langBCode);

    const contentFilter = options?.contentFilter ?? "all"; // all | words | sentences
    const registerFilter = options?.registerFilter ?? "all"; // all | informal | formal
    const showKanjiForJapanese = options?.showKanjiForJapanese !== false;
    const showKatakanaForJapanese = options?.showKatakanaForJapanese !== false;

    const pairIncludesJa = langACode === "ja" || langBCode === "ja";
    const pairIncludesIndo = langACode === "indo" || langBCode === "indo";
    const hiraganaOnly = pairIncludesJa && !showKanjiForJapanese && !showKatakanaForJapanese;

    const allowWord = contentFilter !== "sentences";
    const allowSentence = contentFilter !== "words";

    const allowRegister = (reg) => {
        if (registerFilter === "all") return true;
        return reg === "neutral" || reg === registerFilter;
    };

    const hasBothForPair = (entry) =>
        getTranslation(entry, langACode) && getTranslation(entry, langBCode);

    const countForPool = (entry) => {
        if (!hiraganaOnly) return true;
        if (langACode === "ja" && !canConvertToHiragana(getTranslation(entry, langACode))) return false;
        if (langBCode === "ja" && !canConvertToHiragana(getTranslation(entry, langBCode))) return false;
        return true;
    };

    let totalItems = 0;
    let allAttempted = 0;
    let allCorrect = 0;
    let allBestStreak = 0;

    // category → subcategory → [modules]
    const grouped = {};

    for (const [moduleName, data] of Object.entries(content)) {
        const moduleId = getModuleId(moduleName);
        // Jakarta / Chat & texting modules only appear when Indonesian is in the pair.
        if (!pairIncludesIndo && isJakartaFocusedModule(moduleId)) continue;

        let wordCount = 0;
        let sentenceCount = 0;

        // ===============================
        // MODULE WITH REGISTERS
        // ===============================
        if (data.neutral || data.formal || data.informal) {
            for (const key of ["neutral", "formal", "informal"]) {
                const block = data[key];
                if (!block) continue;
                if (!allowRegister(key)) continue;

                if (allowWord) {
                    for (const w of (block.words ?? [])) {
                        if (!hasBothForPair(w)) continue;
                        const indo = getTranslation(w, "indo");
                        if (indo && shouldExcludeWordFromPool(indo)) continue;
                        if (!countForPool(w)) continue;
                        wordCount++;
                    }
                }
                if (allowSentence) {
                    for (const s of (block.sentences ?? [])) {
                        if (!hasBothForPair(s)) continue;
                        if (!countForPool(s)) continue;
                        sentenceCount++;
                    }
                }
            }
        }
        // ===============================
        // LEGACY / UNSPLIT MODULE
        // ===============================
        else {
            // Legacy modules are implicitly neutral, and neutral is always allowed.
            if (allowWord) {
                for (const w of (data.words ?? [])) {
                    if (!hasBothForPair(w)) continue;
                    const indo = getTranslation(w, "indo");
                    if (indo && shouldExcludeWordFromPool(indo)) continue;
                    if (!countForPool(w)) continue;
                    wordCount++;
                }
            }
            if (allowSentence) {
                for (const s of (data.sentences ?? [])) {
                    if (!hasBothForPair(s)) continue;
                    if (!countForPool(s)) continue;
                    sentenceCount++;
                }
            }
        }

        const total = wordCount + sentenceCount;

        const stats = getModuleStats(moduleId, languagePair);
        const displayName = getModuleDisplayName(moduleId, langACode) || moduleName;

        const accuracy =
            stats.attempted > 0
                ? Math.round((stats.correct / stats.attempted) * 100)
                : null;

        const meta = {
            id: moduleId,
            name: displayName,
            words: wordCount,
            sentences: sentenceCount,
            total,
            accuracy,
            bestStreak: stats.bestStreak ?? 0,
            currentStreak: stats.currentStreak ?? 0
        };

        // ===============================
        // CATEGORY / SUBCATEGORY HANDLING
        // ===============================
        const mapping = getCategoryForModuleKey(moduleName);

        const { category, subcategory } = mapping;

        if (!grouped[category]) grouped[category] = {};
        if (!grouped[category][subcategory]) grouped[category][subcategory] = [];

        grouped[category][subcategory].push(meta);

        // ===============================
        // AGGREGATE FOR "ALL MODULES"
        // ===============================
        totalItems += total;
        allAttempted += stats.attempted;
        allCorrect += stats.correct;
        allBestStreak = Math.max(allBestStreak, stats.bestStreak ?? 0);
    }

    const out = {
        "Smart Modes": [
            {
                name: "All Modules",
                type: "all",
                total: totalItems,
                accuracy:
                    allAttempted > 0
                        ? Math.round((allCorrect / allAttempted) * 100)
                        : null,
                bestStreak: allBestStreak,
                currentStreak: 0
            },
            {
                name: "Weakest Cards",
                type: "weakest",
                total: null,
                accuracy: null,
                bestStreak: 0,
                currentStreak: 0
            }
        ]
    };

    // Stable ordering (so UI grouping isn't dependent on JSON insertion order).
    const remainingCats = Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)).sort();
    const cats = [...CATEGORY_ORDER.filter(c => grouped[c]), ...remainingCats];

    for (const cat of cats) {
        const subgroups = grouped[cat];
        if (!subgroups) continue;

        const orderedSub = {};
        const wanted = SUBCATEGORY_ORDER[cat] ?? [];
        const remainingSubs = Object.keys(subgroups).filter(s => !wanted.includes(s)).sort();
        const subs = [...wanted.filter(s => subgroups[s]), ...remainingSubs];

        for (const sub of subs) {
            orderedSub[sub] = subgroups[sub].slice().sort((a, b) => a.name.localeCompare(b.name));
        }
        out[cat] = orderedSub;
    }

    return out;
}
