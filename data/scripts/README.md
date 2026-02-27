# Data scripts

One-off and content-pipeline scripts. Run from **project root**:

```bash
node data/scripts/<script-name>.js
```

Scripts use `data/` for content files and `data/archive/` for source/translation maps.

| Script | Purpose |
|--------|---------|
| `count-entries.js` | Count total/filled entries per language in content-*.json |
| `add-french.js` / `add-polish.js` | Add language key to every entry in archive/NewContent.json |
| `migrate-to-translations.js` | Convert NewContent.json to translations format (one-time) |
| `create-content-ja.js` / `-ko.js` / `-mo.js` / `-ru.js` / `-ro.js` | Create content-&lt;lang&gt;.json from template (en or fr/mo) |
| `fill-japanese.js` / `fill-korean.js` | Fill content from archive translation maps |
| `fill-moldovan.js` | Fill content-mo.json via MyMemory API (en→ro) |
| `normalize-slash-alternatives.js` | Convert "A / B" strings to arrays in content-*.json |
| `expand-senses.js` | Expand multi-sense entries into one per sense |
| `list-ja-chars.js` | List Japanese characters in content-ja.json and missing readings |

**Main pipeline** (run from project root):

- `node data/split-content-by-lang.js` — split archive/NewContent.json into content-*.json
- `node data/fill-all-languages.js` — fill empty entries in content-*.json via translation API
- `node data/cleanup-all-languages.js` — fix translations, strip notes, unify section names
