/**
 * Language-agnostic module IDs and localized display names.
 * Content JSON keys remain in English; app logic uses stable IDs for filtering,
 * stats, and persistence. UI shows getModuleDisplayName(id, langCode).
 */

/** Slugify a module key for use as stable id (e.g. "Greetings (Basic)" → "greetings_basic"). */
export function slugifyModuleKey(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .replace(/\s*[\/–—]\s*/g, " ")
    .replace(/\s+/g, "_")
    .replace(/[()\u2018\u2019\u201c\u201d\u2026\u0027']/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

/**
 * Stable ID for a module. Pass the content key (English name) from JSON.
 * Same key always yields the same id.
 */
export function getModuleId(moduleName) {
  const s = String(moduleName ?? "").trim();
  if (!s) return "";
  return slugifyModuleKey(s);
}

/**
 * Display name for a module in the given language.
 * Falls back to English, then to the id.
 */
export function getModuleDisplayName(id, langCode) {
  if (!id) return "";
  const names = MODULE_DISPLAY_NAMES[id];
  if (!names) return id;
  const code = (langCode || "en").toLowerCase();
  return names[code] ?? names.en ?? id;
}

/**
 * Category/subcategory for grouping in the UI.
 * Keyed by content key (English name); use getModuleId for id-based lookup if needed.
 */
export const MODULE_CATEGORY_MAP = {
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
  "How I'm doing (negative)": { category: "How are you?", subcategory: "Not so good" },
  "Reactions": { category: "How are you?", subcategory: "Reactions" },
  "Yes / No / Maybe": { category: "How are you?", subcategory: "Reactions" },
  "Emotions & Empathy": { category: "How are you?", subcategory: "Reactions" },

  "Inviting": { category: "Making plans", subcategory: "Invite & respond" },
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
  "About": { category: "Opinions & agreement", subcategory: "Change topic" },

  "Conditions": { category: "Connecting ideas", subcategory: "If & like" },
  "Moments": { category: "Connecting ideas", subcategory: "If & like" },
  "Because": { category: "Connecting ideas", subcategory: "Because & so" },
  "So / That's why (Jadi / Makanya)": { category: "Connecting ideas", subcategory: "Because & so" },
  "But / Contrast (Tapi / Padahal)": { category: "Connecting ideas", subcategory: "But & then" },
  "Then / And then (Terus / Trus)": { category: "Connecting ideas", subcategory: "But & then" },
  "Maybe / Probably (Mungkin / Kayaknya)": { category: "Connecting ideas", subcategory: "If & like" },
  "As / Like (Kayak / Seperti / Maksudnya)": { category: "Connecting ideas", subcategory: "If & like" },

  "With": { category: "People & things", subcategory: "With, for & whose" },
  "For": { category: "People & things", subcategory: "With, for & whose" },
  "Mine & Yours": { category: "People & things", subcategory: "With, for & whose" },
  "This / That (Choosing)": { category: "People & things", subcategory: "People & choice" },
  "Titles & Relationships": { category: "People & things", subcategory: "People & choice" },
  "Relationships (Family & Friends)": { category: "People & things", subcategory: "Family & friends" },
  "Couple Talk": { category: "People & things", subcategory: "Couple talk" },
  "What I'm Doing": { category: "Daily life", subcategory: "What I'm doing" },
  "Food & Drink": { category: "Daily life", subcategory: "Food, places & going" },
  "Going & Arriving": { category: "Daily life", subcategory: "Food, places & going" },
  "Places (Everyday)": { category: "Daily life", subcategory: "Food, places & going" },
  "Casual Venting": { category: "Daily life", subcategory: "Venting" },

  "Questions (Yes / No)": { category: "Questions & tone", subcategory: "Yes or no" },
  "Softening (Agak / Kayak / Lumayan)": { category: "Questions & tone", subcategory: "Softening" },

  "Sharing News": { category: "Sharing & reacting", subcategory: "Sharing & compliments" },
  "Compliments": { category: "Sharing & reacting", subcategory: "Sharing & compliments" },

  "Informal pronouns": { category: "Chat & texting", subcategory: "Casual you & I" },
  "Daily Small Talk (Chat)": { category: "Chat & texting", subcategory: "Chat phrases" },
  "Messaging Basics": { category: "Chat & texting", subcategory: "Chat phrases" },
  "Hangout Planning (Texting)": { category: "Chat & texting", subcategory: "Chat phrases" },
  "Text Abbreviations": { category: "Chat & texting", subcategory: "Shorteners" },
  "Chat Softeners": { category: "Chat & texting", subcategory: "Shorteners" },
};

/** All known module display names by id. en = default; add other lang codes for localization. */
const MODULE_DISPLAY_NAMES = (function () {
  const byId = {};
  for (const enName of Object.keys(MODULE_CATEGORY_MAP)) {
    const id = slugifyModuleKey(enName);
    if (!byId[id]) byId[id] = { en: enName };
  }
  return byId;
})();

/** Resolve category for a content key (may be missing for legacy keys). */
export function getCategoryForModuleKey(moduleName) {
  const direct = MODULE_CATEGORY_MAP[moduleName];
  if (direct) return direct;
  const id = getModuleId(moduleName);
  if (!id) return { category: "Other", subcategory: "Uncategorised" };
  const entry = Object.entries(MODULE_CATEGORY_MAP).find(([key]) => slugifyModuleKey(key) === id);
  return entry ? entry[1] : { category: "Other", subcategory: "Uncategorised" };
}
