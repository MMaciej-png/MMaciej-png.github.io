const fs = require('fs');
const path = 'data/loadModulesMeta.js';
let content = fs.readFileSync(path, 'utf8');
const apostrophe = '\u2019';
const replacements = [
  [`"How I${apostrophe}m Doing (Positive)"`, `"How I${apostrophe}m doing (positive)"`],
  [`"How I${apostrophe}m Doing (Negative)"`, `"How I${apostrophe}m doing (negative)"`]
];
for (const [oldStr, newStr] of replacements) {
  if (content.includes(oldStr)) {
    content = content.split(oldStr).join(newStr);
    console.log('Replaced:', oldStr.substring(0, 30) + '...');
  } else {
    console.log('Not found:', oldStr);
  }
}
fs.writeFileSync(path, content);
console.log('Done.');
