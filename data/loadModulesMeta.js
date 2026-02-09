import { getModuleStats } from "./moduleStats.js";
import { shouldExcludeWordFromPool } from "../core/textTags.js";

/**
 * Module → Category / Subcategory mapping
 * Categories = lesson plans; subcategories = what's being learned in that lesson
 */
const MODULE_CATEGORY_MAP = {

  "Greetings (Basic)": { category: "Getting started", subcategory: "Greetings" },
  "Greetings (Time-Based)": { category: "Getting started", subcategory: "Greetings" },
  "Thanks & Politeness": { category: "Getting started", subcategory: "Thanks & goodbyes" },
  "Goodbyes & Leaving": { category: "Getting started", subcategory: "Thanks & goodbyes" },
  "Numbers (Basic)": { category: "Getting started", subcategory: "Numbers, time & place" },
  "Numbers (11–100)": { category: "Getting started", subcategory: "Numbers, time & place" },
  "Time (Basic)": { category: "Getting started", subcategory: "Numbers, time & place" },
  "Places & Location": { category: "Getting started", subcategory: "Numbers, time & place" },
  "Existence & Availability": { category: "Getting started", subcategory: "Numbers, time & place" },

  "Asking How Are You": { category: "How are you?", subcategory: "Ask & answer" },
  "How I'm doing (positive)": { category: "How are you?", subcategory: "Ask & answer" },
  "How I'm doing (negative)": { category: "How are you?", subcategory: "Ask & answer" },
  "Reactions": { category: "How are you?", subcategory: "Reactions" },
  "Yes / No / Maybe": { category: "How are you?", subcategory: "Reactions" },
  "Emotions & Empathy": { category: "How are you?", subcategory: "Reactions" },

  "Inviting (Ayo / Yuk)": { category: "Making plans", subcategory: "Invite & respond" },
  "Accepting & Declining": { category: "Making plans", subcategory: "Invite & respond" },
  "Plans & Timing": { category: "Making plans", subcategory: "When & how often" },
  "When (Time Questions)": { category: "Making plans", subcategory: "When & how often" },
  "Frequency & Habits": { category: "Making plans", subcategory: "When & how often" },

  "Understanding": { category: "Clarifying & help", subcategory: "Clarifying" },
  "What do you mean?": { category: "Clarifying & help", subcategory: "Clarifying" },
  "Clarifying (Maksudku…)": { category: "Clarifying & help", subcategory: "Clarifying" },
  "Repeat / Slower": { category: "Clarifying & help", subcategory: "Clarifying" },
  "Requests & Help": { category: "Clarifying & help", subcategory: "Requests" },
  "Wait / Hold on (Bentar / Tunggu)": { category: "Clarifying & help", subcategory: "Requests" },
  "Knowing & Ability": { category: "Clarifying & help", subcategory: "Can & know" },

  "Agreeing & Disagreeing": { category: "Opinions & agreement", subcategory: "Agree & disagree" },
  "Asking opinions": { category: "Opinions & agreement", subcategory: "Agree & disagree" },
  "Preferences & Choices": { category: "Opinions & agreement", subcategory: "Agree & disagree" },
  "Topic Shift": { category: "Opinions & agreement", subcategory: "Change topic" },
  "Casual Pushback": { category: "Opinions & agreement", subcategory: "Change topic" },

  "Conditions (Kalau)": { category: "Connecting ideas", subcategory: "If & like" },
  "Moments (Pas)": { category: "Connecting ideas", subcategory: "If & like" },

  "Because (Karena / Soalnya)": { category: "Connecting ideas", subcategory: "Because & so" },

  "So / That’s why (Jadi / Makanya)": { category: "Connecting ideas", subcategory: "Because & so" },

  "But / Contrast (Tapi / Padahal)": { category: "Connecting ideas", subcategory: "But & then" },
  "Then / And then (Terus / Trus)": { category: "Connecting ideas", subcategory: "But & then" },
  "Maybe / Probably (Mungkin / Kayaknya)": { category: "Connecting ideas", subcategory: "If & like" },
  "As / Like (Kayak / Seperti / Maksudnya)": { category: "Connecting ideas", subcategory: "If & like" },

  "With (Sama)": { category: "People & things", subcategory: "With, for & whose" },
  "For (Buat)": { category: "People & things", subcategory: "With, for & whose" },
  "Mine & Yours": { category: "People & things", subcategory: "With, for & whose" },
  "This / That (Choosing)": { category: "People & things", subcategory: "People & choice" },
  "Titles & Relationships": { category: "People & things", subcategory: "People & choice" },
  "What I'm Doing": { category: "Daily life", subcategory: "What I'm doing" },
  "Food & Drink": { category: "Daily life", subcategory: "Food, places & going" },
  "Going & Arriving": { category: "Daily life", subcategory: "Food, places & going" },
  "Places (Everyday)": { category: "Daily life", subcategory: "Food, places & going" },
  "Casual Venting": { category: "Daily life", subcategory: "Venting" },

  "Questions (Yes / No)": { category: "Questions & tone", subcategory: "Yes or no" },
  "Softening (Agak / Kayak / Lumayan)": { category: "Questions & tone", subcategory: "Softening" },

  "Sharing News": { category: "Sharing & reacting", subcategory: "Sharing & compliments" },
  "Compliments": { category: "Sharing & reacting", subcategory: "Sharing & compliments" },

  "Jakarta Pronouns (Gue / Lu)": { category: "Chat & texting", subcategory: "Casual you & I" },
  "Daily Small Talk (Chat)": { category: "Chat & texting", subcategory: "Chat phrases" },
  "Messaging Basics": { category: "Chat & texting", subcategory: "Chat phrases" },
  "Hangout Planning (Texting)": { category: "Chat & texting", subcategory: "Chat phrases" },
  "Text Abbreviations": { category: "Chat & texting", subcategory: "Shorteners" },
  "Chat Softeners": { category: "Chat & texting", subcategory: "Shorteners" }

};


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
  "How are you?": ["Ask & answer", "Reactions"],
  "Making plans": ["Invite & respond", "When & how often"],
  "Clarifying & help": ["Clarifying", "Requests", "Can & know"],
  "Opinions & agreement": ["Agree & disagree", "Change topic"],
  "Connecting ideas": ["Because & so", "But & then", "If & like"],
  "People & things": ["With, for & whose", "People & choice"],
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
    const content = await fetch("../data/NewContent.json")
        .then(r => r.json());

    const contentFilter = options?.contentFilter ?? "all"; // all | words | sentences
    const registerFilter = options?.registerFilter ?? "all"; // all | informal | formal

    const allowWord = contentFilter !== "sentences";
    const allowSentence = contentFilter !== "words";

    const allowRegister = (reg) => {
        if (registerFilter === "all") return true;
        // Mirror casual mode: if filtering to a register, still include neutral.
        return reg === "neutral" || reg === registerFilter;
    };

    let totalItems = 0;
    let allAttempted = 0;
    let allCorrect = 0;
    let allBestStreak = 0;

    // category → subcategory → [modules]
    const grouped = {};

    for (const [moduleName, data] of Object.entries(content)) {
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
                        const indo = (w?.indo ?? "").trim();
                        if (!indo) continue;
                        if (shouldExcludeWordFromPool(indo)) continue;
                        wordCount++;
                    }
                }
                if (allowSentence) {
                    for (const s of (block.sentences ?? [])) {
                        const indo = (s?.indo ?? "").trim();
                        if (!indo) continue;
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
                    const indo = (w?.indo ?? "").trim();
                    if (!indo) continue;
                    if (shouldExcludeWordFromPool(indo)) continue;
                    wordCount++;
                }
            }
            if (allowSentence) {
                for (const s of (data.sentences ?? [])) {
                    const indo = (s?.indo ?? "").trim();
                    if (!indo) continue;
                    sentenceCount++;
                }
            }
        }

        const total = wordCount + sentenceCount;

        const stats = getModuleStats(moduleName);

        const accuracy =
            stats.attempted > 0
                ? Math.round((stats.correct / stats.attempted) * 100)
                : null;

        const meta = {
            name: moduleName,
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
        const mapping = MODULE_CATEGORY_MAP[moduleName] ?? {
            category: "Other",
            subcategory: "Uncategorised"
        };

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
