import { getModuleStats } from "./moduleStats.js";

/**
 * Module → Category / Subcategory mapping
 * You will maintain this manually
 */
const MODULE_CATEGORY_MAP = {
    // ─────────────────────────────
    // Conversation Basics
    // ─────────────────────────────

    // Greetings

    "Greetings (Basic)": {
        category: "Conversation Basics",
        subcategory: "Greetings"
    },
    "Greetings (Time-Based)": {
        category: "Conversation Basics",
        subcategory: "Greetings"
    },

    // Checking In

    "Asking How Are You": {
        category: "Conversation Basics",
        subcategory: "Checking In"
    },

    // Responses

    "Yes / No / Maybe": {
        category: "Conversation Basics",
        subcategory: "Responses"
    },

    "Thanks & Politeness": {
        category: "Conversation Basics",
        subcategory: "Responses"
    },

    // Goodbyes

    "Goodbyes & Leaving": {
        category: "Conversation Basics",
        subcategory: "Goodbyes"
    },

    // ─────────────────────────────
    // Talking About Yourself
    // ─────────────────────────────

    // Status & Feelings

    "How I’m Doing (Positive)": {
        category: "Talking About Yourself",
        subcategory: "Status & Feelings"
    },

    "How I’m Doing (Negative)": {
        category: "Talking About Yourself",
        subcategory: "Status & Feelings"
    },

    // Ability & Knowledge

    "Knowing & Ability": {
        category: "Talking About Yourself",
        subcategory: "Ability & Knowledge"
    },
    "Requests & Help": {
        category: "Talking About Yourself",
        subcategory: "Ability & Knowledge"
    },
    "Understanding": {
        category: "Talking About Yourself",
        subcategory: "Ability & Knowledge"
    },

    // Availability & Actions

    "What I’m Doing": {
        category: "Talking About Yourself",
        subcategory: "Availability & Actions"
    },

    "Plans & Timing": {
        category: "Talking About Yourself",
        subcategory: "Availability & Actions"
    },

    // Preferences
    "Preferences & Choices": {
        category: "Talking About Yourself",
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
