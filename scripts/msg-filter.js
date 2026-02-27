#!/usr/bin/env node
/**
 * Used as git filter-branch --msg-filter. Reads current message from stdin (discarded).
 * Outputs new message from commit-message-map.json by index (counter file).
 */

const fs = require("fs");
const path = require("path");

const scriptDir = path.resolve(__dirname);
const counterPath = path.join(scriptDir, ".commit-msg-counter");
const mapPath = path.join(scriptDir, "commit-message-map.json");

let counter = 0;
if (fs.existsSync(counterPath)) {
  counter = parseInt(fs.readFileSync(counterPath, "utf8").trim(), 10) || 0;
}

const mapping = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const entry = mapping[counter];
const newSubject = entry && (entry.subject || entry);
const newBody = entry && entry.body;
const newMessage = newBody ? `${newSubject}\n\n${newBody}` : (newSubject || "chore: (no message)");

fs.writeFileSync(counterPath, String(counter + 1), "utf8");
process.stdout.write(newMessage);
