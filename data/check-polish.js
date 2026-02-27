/**
 * Polish content check: CONTENT_RULESET_PL + shared rules.
 * Validates: direct translations, module structure, register (formal = Pan/Pani, informal = ty),
 * word coverage, duplicates. Run from project root: node data/check-polish.js
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const plPath = path.join(DIR, "content-pl.json");
const enPath = path.join(DIR, "content-en.json");

// Informal "you" markers in Polish (formal should avoid these). Use (^|\s) to avoid matching "ty" inside words like "zajęty".
const INFORMAL_MARKERS = /(?:^|\s)(ty|jesteś|masz|możesz|chcesz|idziesz|powinieneś|zrobisz|wiesz|mógłbyś|mogłabyś)(?:\s|[.!?,]|$)/i;
// Formal markers (informal sentences can still use them in some contexts; we only flag formal using informal)
const FORMAL_MARKERS = /\b(pan|pani|państwo|mógłby\s+pan|mogłaby\s+pani)\b/i;

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function* walkEntries(obj, path = []) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      yield* walkEntries(obj[i], [...path, i]);
    }
    return;
  }
  if ("en" in obj) {
    yield { entry: obj, path };
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    yield* walkEntries(v, [...path, k]);
  }
}

function getModules(content) {
  const mods = {};
  for (const [name, module] of Object.entries(content)) {
    if (module && typeof module === "object" && (module.neutral || module.formal || module.informal)) {
      mods[name] = module;
    }
  }
  return mods;
}

function collectByModule(content) {
  const byModule = {};
  for (const [modName, module] of Object.entries(content)) {
    if (!module || typeof module !== "object") continue;
    byModule[modName] = { neutral: [], formal: [], informal: [] };
    for (const reg of ["neutral", "formal", "informal"]) {
      const block = module[reg];
      if (!block) continue;
      for (const kind of ["words", "sentences"]) {
        const arr = block[kind];
        if (!Array.isArray(arr)) continue;
        for (let i = 0; i < arr.length; i++) {
          byModule[modName][reg].push({ ...arr[i], _kind: kind, _index: i });
        }
      }
    }
  }
  return byModule;
}

function main() {
  const plContent = loadJson(plPath);
  const enContent = fs.existsSync(enPath) ? loadJson(enPath) : null;
  const plModules = getModules(plContent);
  const enModules = enContent ? getModules(enContent) : {};
  const report = {
    missingPl: [],
    duplicateEnInRegister: [],
    formalUsesInformal: [],
    samePlForDifferentEn: [],
    wrongWordTranslation: [],
    duplicateSentenceInRegister: [],
    emptyWordsInSentence: [],
  };

  // Known wrong word translations (en -> wrong pl). Correct mapping used for hint.
  const knownWrong = [
    { en: "See", wrongPl: "Do", correct: "Widzieć" },
    { en: "Earlier", wrongPl: "Pierwszy", correct: "Wcześniej" },
    { en: "Boyfriend", wrongPl: "Dziewczyna", correct: "Chłopak" },
    { en: "Hmm", wrongPl: "O", correct: "Hmm" },
  ];

  for (const [modName, plMod] of Object.entries(plModules)) {
    for (const reg of ["neutral", "formal", "informal"]) {
      const block = plMod[reg];
      if (!block) continue;
      const words = block.words || [];
      const sentences = block.sentences || [];
      const seenEn = new Map(); // en -> first pl seen
      const seenKey = new Set(); // "en|pl" for duplicate sentence

      for (const w of words) {
        const en = (w.en || "").toString().trim();
        const pl = (w.pl || "").toString().trim();
        if (!en) continue;
        if (!pl) report.missingPl.push({ module: modName, register: reg, en, type: "word" });
        const wrong = knownWrong.find((x) => x.en === en && x.wrongPl === pl);
        if (wrong) report.wrongWordTranslation.push({ module: modName, register: reg, en, pl, correct: wrong.correct });
        if (seenEn.has(en) && seenEn.get(en) !== pl) report.samePlForDifferentEn.push({ module: modName, register: reg, en, pl, firstPl: seenEn.get(en) });
        else if (!seenEn.has(en)) seenEn.set(en, pl);
      }

      for (const s of sentences) {
        const en = (s.en || "").toString().trim();
        const pl = (s.pl || "").toString().trim();
        if (!en) continue;
        if (!pl) report.missingPl.push({ module: modName, register: reg, en, type: "sentence" });
        const key = `${en}|${pl}`;
        if (seenKey.has(key)) report.duplicateSentenceInRegister.push({ module: modName, register: reg, en, pl });
        seenKey.add(key);
        if (reg === "formal" && pl && INFORMAL_MARKERS.test(pl)) report.formalUsesInformal.push({ module: modName, en, pl });
      }
    }
  }

  // Duplicate (same en) in same register
  for (const [modName, plMod] of Object.entries(plModules)) {
    for (const reg of ["neutral", "formal", "informal"]) {
      const block = plMod[reg];
      if (!block) continue;
      const sentences = block.sentences || [];
      const byEn = new Map();
      for (const s of sentences) {
        const en = (s.en || "").toString().trim();
        if (!en) continue;
        if (!byEn.has(en)) byEn.set(en, []);
        byEn.get(en).push((s.pl || "").toString().trim());
      }
      for (const [en, pls] of byEn) {
        const unique = new Set(pls);
        if (unique.size > 1) report.duplicateEnInRegister.push({ module: modName, register: reg, en, pls: [...unique] });
      }
    }
  }

  // Print report
  console.log("Polish content check (CONTENT_RULESET_PL + shared)\n");

  if (report.missingPl.length) {
    console.log("Missing pl:");
    report.missingPl.slice(0, 30).forEach((x) => console.log("  ", x.module, x.register, x.type, x.en));
    if (report.missingPl.length > 30) console.log("  ... and", report.missingPl.length - 30, "more");
    console.log();
  }
  if (report.wrongWordTranslation.length) {
    console.log("Wrong word translation (en -> pl; should be correct):");
    report.wrongWordTranslation.forEach((x) => console.log("  ", x.module, x.register, x.en, "->", x.pl, "=>", x.correct));
    console.log();
  }
  if (report.formalUsesInformal.length) {
    console.log("Formal sentence uses informal Polish (ty / second-person):");
    report.formalUsesInformal.forEach((x) => console.log("  ", x.module, x.en, "|", x.pl));
    console.log();
  }
  if (report.duplicateEnInRegister.length) {
    console.log("Same en with different pl in same register:");
    report.duplicateEnInRegister.forEach((x) => console.log("  ", x.module, x.register, x.en, "|", x.pls));
    console.log();
  }
  if (report.duplicateSentenceInRegister.length) {
    console.log("Duplicate sentence (same en+pl) in same register:");
    report.duplicateSentenceInRegister.slice(0, 20).forEach((x) => console.log("  ", x.module, x.register, x.en));
    if (report.duplicateSentenceInRegister.length > 20) console.log("  ... and", report.duplicateSentenceInRegister.length - 20, "more");
    console.log();
  }
  if (report.samePlForDifferentEn.length) {
    console.log("Same pl for different en (word):");
    report.samePlForDifferentEn.forEach((x) => console.log("  ", x.module, x.register, x.en, "|", x.pl, "vs", x.firstPl));
    console.log();
  }

  const total = report.missingPl.length + report.wrongWordTranslation.length + report.formalUsesInformal.length
    + report.duplicateEnInRegister.length + report.duplicateSentenceInRegister.length + report.samePlForDifferentEn.length;
  console.log(total ? `Total issues: ${total}` : "No issues found.");
}

main();
