const fs = require("fs");
const path = require("path");

const LANG_CODES = ["en", "indo", "ja", "ko", "pl", "fr", "mo", "ro", "ru"];

function countEntries(obj, langKey, acc) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((o) => countEntries(o, langKey, acc));
    return;
  }
  if ("en" in obj) {
    acc.total++;
    const v = obj[langKey];
    if (v !== undefined && v !== null && String(v).trim() !== "") acc.filled++;
    return;
  }
  Object.values(obj).forEach((v) => countEntries(v, langKey, acc));
}

const results = {};
for (const code of LANG_CODES) {
  const DATA_DIR = path.join(__dirname, "..");
const filePath = path.join(DATA_DIR, `content-${code}.json`);
  if (!fs.existsSync(filePath)) {
    results[code] = { total: 0, filled: 0, note: "no file" };
    continue;
  }
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const acc = { total: 0, filled: 0 };
  countEntries(content, code, acc);
  results[code] = acc;
}

console.log("Language | total entries | filled (has translation)");
console.log("---------|---------------|--------------------------");
for (const [code, r] of Object.entries(results)) {
  const note = r.note ? " " + r.note : "";
  console.log(`${code.padEnd(8)} | ${String(r.total).padStart(13)} | ${String(r.filled).padStart(24)}${note}`);
}
const enTotal = results.en?.total ?? 0;
console.log("\nReference: en total =", enTotal);
for (const [code, r] of Object.entries(results)) {
  if (code === "en" || r.note) continue;
  const diff = enTotal - r.total;
  if (diff !== 0) console.log(`  ${code}: ${diff > 0 ? diff + " fewer" : -diff + " more"} entries than en`);
}
