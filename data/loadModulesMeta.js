import { getModuleStats } from "./moduleStats.js";

/**
 * Module → Category / Subcategory mapping
 * You will maintain this manually
 */
const MODULE_CATEGORY_MAP = {
    // ─────────────────────────────
    // Basic Conversation
    // ─────────────────────────────

    // Greetings

    "Greetings (Basic)": {
        category: "Basic Conversation",
        subcategory: "Greetings"
    },
    "Greetings (Time-Based)": {
        category: "Basic Conversation",
        subcategory: "Greetings"
    },

    // Checking In

    "Asking How Are You": {
        category: "Basic Conversation",
        subcategory: "Checking In"
    },

    // Responses

    "Yes / No / Maybe": {
        category: "Basic Conversation",
        subcategory: "Responses"
    },

    "Reactions": {
        category: "Basic Conversation",
        subcategory: "Responses"
    },

    "Thanks & Politeness": {
        category: "Basic Conversation",
        subcategory: "Responses"
    },

    // Goodbyes

    "Goodbyes & Leaving": {
        category: "Basic Conversation",
        subcategory: "Goodbyes"
    }, 

    // ─────────────────────────────
    // Sentence Structure
    // ─────────────────────────────

    // Time Reference

    "When (Time Questions)": {
        category: "Sentence Structure",
        subcategory: "Time Reference"
    },

    // Conditions

    "Conditions (Kalau)": {
        category: "Sentence Structure",
        subcategory: "Conditions"
    },

    //Moments

    "Moments (Pas)": {
        category: "Sentence Structure",
        subcategory: "Moments"
    },

    // Connections
    "With (Sama)": {
        category: "Sentence Structure",
        subcategory: "Connections"
    },

    // Titles
    "Titles & Relationships": {
        category: "Sentence Structure",
        subcategory: "Titles"
    },


    // ─────────────────────────────
    // Basic Interaction
    // ─────────────────────────────

    // Status & Feelings

    "How I’m Doing (Positive)": {
        category: "Basic Interaction",
        subcategory: "Status & Feelings"
    },

    "How I’m Doing (Negative)": {
        category: "Basic Interaction",
        subcategory: "Status & Feelings"
    },

    // Ability & Knowledge

    "Knowing & Ability": {
        category: "Basic Interaction",
        subcategory: "Ability & Knowledge"
    },
    "Requests & Help": {
        category: "Basic Interaction",
        subcategory: "Ability & Knowledge"
    },
    "Understanding": {
        category: "Basic Interaction",
        subcategory: "Ability & Knowledge"
    },

    "Meaning & Clarification": {
        category: "Basic Interaction",
        subcategory: "Ability & Knowledge"
    },

    
    "Questions (Yes / No)": {
        category: "Basic Interaction",
        subcategory: "Ability & Knowledge"
    },

    // Availability & Actions

    "What I’m Doing": {
        category: "Basic Interaction",
        subcategory: "Availability & Actions"
    },

    "Plans & Timing": {
        category: "Basic Interaction",
        subcategory: "Availability & Actions"
    },

    // Preferences
    "Preferences & Choices": {
        category: "Basic Interaction",
        subcategory: "Preferences"
    },


    // ─────────────────────────────
    // Daily Life
    // ─────────────────────────────

    // Activities

    "Food & Drink": {
        category: "Daily Life",
        subcategory: "Activities"
    },

    "This / That (Choosing)": {
        category: "Daily Life",
        subcategory: "Activities"
    },

    // Movement

    "Going & Arriving": {
        category: "Daily Life",
        subcategory: "Movement"
    },
    // Possession

    "Mine & Yours": {
        category: "Daily Life",
        subcategory: "Possession"
    },

    // ─────────────────────────────
    // Basics
    // ─────────────────────────────

    // Numbers

    "Numbers (Basic)": {
        category: "Basics",
        subcategory: "Numbers"
    },

    // Time

    "Time (Basic)": {
        category: "Basics",
        subcategory: "Time"
    },
    // Location

    "Places & Location": {
        category: "Basics",
        subcategory: "Location"
    },

    "Existence & Availability": {
        category: "Basics",
        subcategory: "Existence"
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
