const fs = require('fs');
const path = 'data/NewContent.json';
let content = fs.readFileSync(path, 'utf8');
// Apostrophe U+2019 (') used in the JSON
const apostrophe = '\u2019';
const replacements = [
  [`"How I${apostrophe}m Doing (Positive)"`, `"How I${apostrophe}m doing (positive)"`],
  [`"How I${apostrophe}m Doing (Negative)"`, `"How I${apostrophe}m doing (negative)"`]
];
for (const [oldStr, newStr] of replacements) {
  if (content.includes(oldStr)) {
    content = content.split(oldStr).join(newStr);
    console.log('Replaced successfully');
  } else {
    console.log('Not found:', oldStr);
  }
}
fs.writeFileSync(path, content);
console.log('Done.');
