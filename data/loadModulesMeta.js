import { getModuleStats } from "./moduleStats.js";
import { shouldExcludeWordFromPool } from "../core/textTags.js";

/**
 * Module → Category / Subcategory mapping
 * You will maintain this manually
 */
const MODULE_CATEGORY_MAP = {

  // ─────────────────────────────
  // Conversation
  // Openings, closings, small talk
  // ─────────────────────────────

  "Greetings (Basic)": {
    category: "Conversation",
    subcategory: "Greetings"
  },
  "Greetings (Time-Based)": {
    category: "Conversation",
    subcategory: "Greetings"
  },

  "Asking How Are You": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "Reactions": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "Yes / No / Maybe": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "Agreeing & Disagreeing": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "Inviting (Ayo / Yuk)": {
    category: "Conversation",
    subcategory: "Planning"
  },

  "Accepting & Declining": {
    category: "Conversation",
    subcategory: "Planning"
  },

  "Thanks & Politeness": {
    category: "Conversation",
    subcategory: "Politeness"
  },

  "Goodbyes & Leaving": {
    category: "Conversation",
    subcategory: "Goodbyes"
  },

  "Jakarta Pronouns (Gue / Lu)": {
    category: "Jakarta / Texting",
    subcategory: "Pronouns & Slang"
  },

  "Daily Small Talk (Chat)": {
    category: "Jakarta / Texting",
    subcategory: "Chatting"
  },

  "Hangout Planning (Texting)": {
    category: "Jakarta / Texting",
    subcategory: "Chatting"
  },



  // ─────────────────────────────
  // Sentence Building
  // Sentence logic & patterns
  // ─────────────────────────────

  "When (Time Questions)": {
    category: "Sentence Building",
    subcategory: "Time"
  },

  "Conditions (Kalau)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  },

  "Moments (Pas)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  },

  "Chat Softeners": {
    category: "Jakarta / Texting",
    subcategory: "Particles"
  },

  "Text Abbreviations": {
    category: "Jakarta / Texting",
    subcategory: "Shorteners"
  },

  "Because (Karena / Soalnya)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  },

  "So / That’s why (Jadi / Makanya)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  },

  "But / Contrast (Tapi / Padahal)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  },

  "Then / And then (Terus / Trus)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  },

  "Maybe / Probably (Mungkin / Kayaknya)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  },

  "With (Sama)": {
    category: "Sentence Building",
    subcategory: "Reference"
  },

  "For (Buat)": {
    category: "Sentence Building",
    subcategory: "Reference"
  },

  "Titles & Relationships": {
    category: "Sentence Building",
    subcategory: "Reference"
  },



  // ─────────────────────────────
  // Actions & Feelings
  // State, ability, requests, choices
  // ─────────────────────────────

  "How I’m doing (positive)": {
    category: "Actions & Feelings",
    subcategory: "State"
  },

  "How I’m doing (negative)": {
    category: "Actions & Feelings",
    subcategory: "State"
  },

  "Softening (Agak / Kayak / Lumayan)": {
    category: "Actions & Feelings",
    subcategory: "Tone"
  },

  "Knowing & Ability": {
    category: "Actions & Feelings",
    subcategory: "Ability"
  },

  "Understanding": {
    category: "Actions & Feelings",
    subcategory: "Ability"
  },

  "What do you mean?": {
    category: "Actions & Feelings",
    subcategory: "Ability"
  },

  "Questions (Yes / No)": {
    category: "Actions & Feelings",
    subcategory: "Patterns"
  },

  "Asking opinions": {
    category: "Actions & Feelings",
    subcategory: "Patterns"
  },

  "Requests & Help": {
    category: "Actions & Feelings",
    subcategory: "Requests"
  },

  "Wait / Hold on (Bentar / Tunggu)": {
    category: "Actions & Feelings",
    subcategory: "Requests"
  },

  "Clarifying (Maksudku…)": {
    category: "Actions & Feelings",
    subcategory: "Ability"
  },

  "Repeat / Slower": {
    category: "Actions & Feelings",
    subcategory: "Ability"
  },

  "What I’m Doing": {
    category: "Actions & Feelings",
    subcategory: "Actions"
  },

  "Plans & Timing": {
    category: "Actions & Feelings",
    subcategory: "Actions"
  },

  "Preferences & Choices": {
    category: "Actions & Feelings",
    subcategory: "Preferences"
  },



  // ─────────────────────────────
  // Daily Life
  // Concrete, real-world language
  // ─────────────────────────────

  "Food & Drink": {
    category: "Daily Life",
    subcategory: "Everyday"
  },

  "This / That (Choosing)": {
    category: "Daily Life",
    subcategory: "Everyday"
  },

  "Going & Arriving": {
    category: "Daily Life",
    subcategory: "Movement"
  },

  "Places (Everyday)": {
    category: "Daily Life",
    subcategory: "Places"
  },

  "Mine & Yours": {
    category: "Daily Life",
    subcategory: "Everyday"
  },

  "Messaging Basics": {
    category: "Jakarta / Texting",
    subcategory: "Chatting"
  },



  // ─────────────────────────────
  // Basics
  // Core language primitives
  // ─────────────────────────────

  "Numbers (Basic)": {
    category: "Basics",
    subcategory: "Core"
  },

  "Time (Basic)": {
    category: "Basics",
    subcategory: "Core"
  },

  "Places & Location": {
    category: "Basics",
    subcategory: "Core"
  },

  "Existence & Availability": {
    category: "Basics",
    subcategory: "Core"
  },

  "Emotions & Empathy": {
    category: "Actions & Feelings",
    subcategory: "State"
  },

  "Sharing News": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "Compliments": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "Frequency & Habits": {
    category: "Sentence Building",
    subcategory: "Time"
  },

  "Casual Venting": {
    category: "Daily Life",
    subcategory: "Everyday"
  },

  "Topic Shift": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "Casual Pushback": {
    category: "Conversation",
    subcategory: "Small Talk"
  },

  "As / Like (Kayak / Seperti / Maksudnya)": {
    category: "Sentence Building",
    subcategory: "Connectors"
  }

};

const CATEGORY_ORDER = [
  "Smart Modes",
  "Basics",
  "Conversation",
  "Sentence Building",
  "Actions & Feelings",
  "Daily Life",
  "Jakarta / Texting",
  "Other"
];

const SUBCATEGORY_ORDER = {
  "Conversation": ["Greetings", "Small Talk", "Planning", "Politeness", "Goodbyes"],
  "Jakarta / Texting": ["Particles", "Shorteners", "Pronouns & Slang", "Chatting"],
  "Actions & Feelings": ["State", "Tone", "Ability", "Patterns", "Requests", "Actions", "Preferences"],
  "Sentence Building": ["Connectors", "Reference", "Time"],
  "Daily Life": ["Everyday", "Movement", "Places"],
  "Basics": ["Core"],
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
