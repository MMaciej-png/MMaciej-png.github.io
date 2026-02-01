import { getModuleStats } from "./moduleStats.js";

/**
 * Module → Category / Subcategory mapping
 * You will maintain this manually
 */
const MODULE_CATEGORY_MAP = {

  // ─────────────────────────────
  // Social
  // Openings, closings, polite flow
  // ─────────────────────────────

  "Greetings (Basic)": {
    category: "Social",
    subcategory: "Greetings"
  },
  "Greetings (Time-Based)": {
    category: "Social",
    subcategory: "Greetings"
  },

  "Asking How Are You": {
    category: "Social",
    subcategory: "Conversation"
  },

  "Reactions": {
    category: "Social",
    subcategory: "Conversation"
  },

  "Yes / No / Maybe": {
    category: "Social",
    subcategory: "Conversation"
  },

  "Agreement / Disagreement (Setuju / Nggak setuju)": {
    category: "Social",
    subcategory: "Conversation"
  },

  "Inviting (Ayo / Yuk)": {
    category: "Social",
    subcategory: "Conversation"
  },

  "Accepting / Declining (Gak dulu / Lain kali)": {
    category: "Social",
    subcategory: "Conversation"
  },

  "Thanks & Politeness": {
    category: "Social",
    subcategory: "Politeness"
  },

  "Goodbyes & Leaving": {
    category: "Social",
    subcategory: "Goodbyes"
  },



  // ─────────────────────────────
  // Structure
  // Sentence logic & connectors
  // ─────────────────────────────

  "When (Time Questions)": {
    category: "Structure",
    subcategory: "Time"
  },

  "Conditions (Kalau)": {
    category: "Structure",
    subcategory: "Logic"
  },

  "Moments (Pas)": {
    category: "Structure",
    subcategory: "Logic"
  },

  "Because (Karena / Soalnya)": {
    category: "Structure",
    subcategory: "Logic"
  },

  "So / That’s why (Jadi / Makanya)": {
    category: "Structure",
    subcategory: "Logic"
  },

  "But / Contrast (Tapi / Padahal)": {
    category: "Structure",
    subcategory: "Logic"
  },

  "Then / And then (Terus / Trus)": {
    category: "Structure",
    subcategory: "Logic"
  },

  "Maybe / Probably (Mungkin / Kayaknya)": {
    category: "Structure",
    subcategory: "Logic"
  },

  "With (Sama)": {
    category: "Structure",
    subcategory: "Relations"
  },

  "For (Buat)": {
    category: "Structure",
    subcategory: "Relations"
  },

  "Titles & Relationships": {
    category: "Structure",
    subcategory: "Reference"
  },



  // ─────────────────────────────
  // Interaction
  // What I feel, can do, ask, decide
  // ─────────────────────────────

  "How I’m Doing (Positive)": {
    category: "Interaction",
    subcategory: "State"
  },

  "How I’m Doing (Negative)": {
    category: "Interaction",
    subcategory: "State"
  },

  "Softening (Agak / Kayak / Lumayan)": {
    category: "Interaction",
    subcategory: "Tone"
  },

  "Knowing & Ability": {
    category: "Interaction",
    subcategory: "Ability"
  },

  "Understanding": {
    category: "Interaction",
    subcategory: "Ability"
  },

  "Meaning & Clarification": {
    category: "Interaction",
    subcategory: "Ability"
  },

  "Questions (Yes / No)": {
    category: "Interaction",
    subcategory: "Patterns"
  },

  "Asking Opinions (Menurut kamu gimana?)": {
    category: "Interaction",
    subcategory: "Patterns"
  },

  "Requests & Help": {
    category: "Interaction",
    subcategory: "Requests"
  },

  "Wait / Hold on (Bentar / Tunggu)": {
    category: "Interaction",
    subcategory: "Requests"
  },

  "I mean… / What I meant… (Maksudku…)": {
    category: "Interaction",
    subcategory: "Ability"
  },

  "Say it again / Slower (Ulangi / Pelan-pelan)": {
    category: "Interaction",
    subcategory: "Ability"
  },

  "What I’m Doing": {
    category: "Interaction",
    subcategory: "Actions"
  },

  "Plans & Timing": {
    category: "Interaction",
    subcategory: "Actions"
  },

  "Preferences & Choices": {
    category: "Interaction",
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

  "Messaging Basics (Lagi di mana? / OTW)": {
    category: "Daily Life",
    subcategory: "Everyday"
  },



  // ─────────────────────────────
  // Foundations
  // Core language primitives
  // ─────────────────────────────

  "Numbers (Basic)": {
    category: "Foundations",
    subcategory: "Core"
  },

  "Time (Basic)": {
    category: "Foundations",
    subcategory: "Core"
  },

  "Places & Location": {
    category: "Foundations",
    subcategory: "Core"
  },

  "Existence & Availability": {
    category: "Foundations",
    subcategory: "Core"
  }

};




/**
 * Loads grouped module metadata for the UI
 */
export async function loadModulesMeta() {
    const content = await fetch("../data/NewContent.json")
        .then(r => r.json());

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

                wordCount += block.words?.length ?? 0;
                sentenceCount += block.sentences?.length ?? 0;
            }
        }
        // ===============================
        // LEGACY / UNSPLIT MODULE
        // ===============================
        else {
            wordCount = data.words?.length ?? 0;
            sentenceCount = data.sentences?.length ?? 0;
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

    return {
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
        ],
        ...grouped
    };
}
