/**
 * Make English source text clearer and more consistent across content.
 * Expands common contractions and normalises phrasing so translation lookup
 * (after normalisation) is consistent. Updates "en" in all content-*.json files.
 *
 * Run from project root: node data/clarify-english.js
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;

/** Replacements: clearer / more consistent English (expand contractions for consistency). */
const CLARIFY = [
  [/\bI'm\b/g, "I am"],
  [/\bI've\b/g, "I have"],
  [/\bI'll\b/g, "I will"],
  [/\bI'd\b/g, "I would"],
  [/\byou're\b/g, "you are"],
  [/\byou've\b/g, "you have"],
  [/\byou'll\b/g, "you will"],
  [/\bhe's\b/g, "he is"],
  [/\bshe's\b/g, "she is"],
  [/\bit's\b/g, "it is"],
  [/\bwe're\b/g, "we are"],
  [/\bwe've\b/g, "we have"],
  [/\bwe'll\b/g, "we will"],
  [/\bthey're\b/g, "they are"],
  [/\bthey've\b/g, "they have"],
  [/\bthat's\b/g, "that is"],
  [/\bwhat's\b/g, "what is"],
  [/\bwho's\b/g, "who is"],
  [/\bhow's\b/g, "how is"],
  [/\bwhere's\b/g, "where is"],
  [/\bthere's\b/g, "there is"],
  [/\bhere's\b/g, "here is"],
  [/\bcan't\b/g, "cannot"],
  [/\bwon't\b/g, "will not"],
  [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bwasn't\b/g, "was not"],
  [/\bweren't\b/g, "were not"],
  [/\bhaven't\b/g, "have not"],
  [/\bhasn't\b/g, "has not"],
  [/\bhadn't\b/g, "had not"],
  [/\bwouldn't\b/g, "would not"],
  [/\bcouldn't\b/g, "could not"],
  [/\bshouldn't\b/g, "should not"],
  [/\bwe're\b/g, "we are"],
  [/\bLet's\b/g, "Let us"],
  [/\bLet’s\b/g, "Let us"],
];

function clarify(text) {
  if (typeof text !== "string") return text;
  let t = text;
  for (const [re, repl] of CLARIFY) t = t.replace(re, repl);
  return t;
}

function walkAndClarify(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => walkAndClarify(o));
    return;
  }
  if ("en" in obj && typeof obj.en === "string") {
    obj.en = clarify(obj.en);
    return;
  }
  Object.values(obj).forEach((v) => walkAndClarify(v));
}

const contentFiles = ["content-en.json", "content-indo.json", "content-ja.json", "content-ko.json", "content-pl.json", "content-fr.json", "content-mo.json", "content-ro.json", "content-ru.json"];

for (const name of contentFiles) {
  const filePath = path.join(DIR, name);
  if (!fs.existsSync(filePath)) continue;
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  walkAndClarify(content);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
  console.log("Clarified English in", name);
}

console.log("Done. Run node data/ensure-full-structure.js if you need to re-sync structure.");
