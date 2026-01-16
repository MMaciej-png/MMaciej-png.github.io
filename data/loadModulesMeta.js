/* data/loadModulesMeta.js */

import { getModuleStats } from "./moduleStats.js";

/**
 * Loads module metadata for UI:
 * - item counts
 * - accuracy (derived)
 * - best streak
 * Includes virtual entries:
 * - All Modules
 * - Weakest Cards
 */

const CATEGORY_MAP = {
    "Greetings & Openings": "Daily Conversation",
    "How I’m Doing": "Daily Conversation",
    "What I’m Doing / Availability": "Daily Conversation",

    "Movement & Arrival": "Movement & Plans",
    "Plans, Timing & Updates": "Movement & Plans",
    "Goodbyes & Polite Exits": "Movement & Plans",

    "Statements & Descriptions": "Statements & Grammar"
};


export async function loadModulesMeta() {
    const content = await fetch("../data/NewContent.json")
        .then(r => r.json());

    const modules = [];

    let allAttempted = 0;
    let allCorrect = 0;
    let allBestStreak = 0;
    let allTotalItems = 0;

    for (const [moduleName, data] of Object.entries(content)) {
        const wordCount = (data.words ?? []).length;
        const sentenceCount = (data.sentences ?? []).length;
        const total = wordCount + sentenceCount;

        const stats = getModuleStats(moduleName);

        const accuracy =
            stats.attempted > 0
                ? Math.round((stats.correct / stats.attempted) * 100)
                : null;

        modules.push({
            name: moduleName,
            type: "module",
            category: CATEGORY_MAP[moduleName] ?? "Other",
            words: wordCount,
            sentences: sentenceCount,
            total,
            accuracy,
            bestStreak: stats.bestStreak
        });


        allAttempted += stats.attempted;
        allCorrect += stats.correct;
        allBestStreak = Math.max(allBestStreak, stats.bestStreak);
        allTotalItems += total;
    }

    /* ---------- Virtual: All Modules ---------- */
    modules.unshift({
        name: "All Modules",
        type: "all",
        words: null,
        sentences: null,
        total: allTotalItems,
        accuracy:
            allAttempted > 0
                ? Math.round((allCorrect / allAttempted) * 100)
                : null,
        bestStreak: allBestStreak
    });

    /* ---------- Virtual: Weakest Cards ---------- */
    modules.splice(1, 0, {
        name: "Weakest Cards",
        type: "weakest",
        words: null,
        sentences: null,
        total: 25,        // UI hint only
        accuracy: null,   // derived dynamically
        bestStreak: null
    });

    return modules;
}
