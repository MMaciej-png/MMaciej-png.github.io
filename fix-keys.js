const fs = require('fs');
const path = 'data/NewContent.json';
let content = fs.readFileSync(path, 'utf8');
const replacements = [
  ['"How I'm Doing (Positive)"', '"How I\'m doing (positive)"'],
  ['"How I'm Doing (Negative)"', '"How I\'m doing (negative)"']
];
for (const [oldStr, newStr] of replacements) {
  if (content.includes(oldStr)) {
    content = content.split(oldStr).join(newStr);
    console.log('Replaced:', oldStr);
  } else {
    console.log('Not found:', JSON.stringify(oldStr), 'codes:', [...oldStr].map(c => c.charCodeAt(0)));
  }
}
fs.writeFileSync(path, content);
console.log('Done.');
