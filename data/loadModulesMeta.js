import { getModuleStats } from "./moduleStats.js";

const MODULE_CATEGORY_MAP = {
    "Greetings & Openings": "Daily Conversation",
    "How I’m Doing": "Daily Conversation",
    "What I’m Doing / Availability": "Daily Conversation",
    "Needs, Wants & Preferences": "Daily Conversation",
    "Food & Drink": "Daily Conversation",
    "Thanks & Politeness": "Daily Conversation",

    "People & Relationships": "Pronouns & Reference",
    "This, That & things": "Pronouns & Reference",
    "Possession": "Pronouns & Reference",

    "Movement & Arrival": "Movement & Plans",
    "Plans, Timing & Updates": "Movement & Plans",
    "Goodbyes & Polite Exits": "Movement & Plans",
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

    const grouped = {};

    for (const [moduleName, data] of Object.entries(content)) {
        let wordCount = 0;
        let sentenceCount = 0;

        // ===============================
        // MODULE WITH REGISTERS
        // ===============================
        if (data.formal || data.informal) {
            for (const block of Object.values(data)) {
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



        // ✅ FIX: correct map name
        const category =
            MODULE_CATEGORY_MAP[moduleName] ?? "Other";

        if (!grouped[category]) {
            grouped[category] = [];
        }

        grouped[category].push(meta);

        // Aggregate for "All Modules"
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
