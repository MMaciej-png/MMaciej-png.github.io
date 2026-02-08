const fs = require('fs');
const content = fs.readFileSync('data/NewContent.json', 'utf8');
const idx = content.indexOf('How I');
const snippet = content.substring(idx, idx + 40);
console.log('Snippet:', JSON.stringify(snippet));
console.log('Char codes:', [...snippet].map(c => c.charCodeAt(0)).join(','));
