# Indonesian Trainer (IndoTrainer)

A vocabulary and conversation trainer for Indonesian. Flip cards, practice with modules, and chat with an AI partner that corrects like a native speaker.

**Version:** 2.1.0

---

## Features

### Casual mode (main study flow)
- **Flip cards** – See Indonesian (or English); type the translation and press Enter. Card flips to show the answer; you get 3 attempts per card.
- **Modules** – Content is organized by modules (e.g. Greetings, Time-Based). Select one or more modules in the right panel to limit the pool. “All Modules” uses everything.
- **Register filter** – Words/sentences can be formal, informal, or neutral. Filter by register in the Modules panel.
- **Words vs sentences** – Filter by “All”, “Words”, or “Sentences”.
- **Jakarta tokens** – Optional filter to include or exclude Jakarta/slang-focused items (when tagged in content).
- **Affix help** – Optional teaching panel that explains affixes (prefixes/suffixes) for the current word.
- **Session stats** – Correct / wrong count, accuracy %, and streak for the current session.
- **Lifetime stats** – Total cards, completed, failed, overall/word/sentence accuracy, best and average streak. Stored in the browser (localStorage).
- **Rank** – Casual rank (Bronze → Silver → Gold → Platinum → Diamond → Master) based on lifetime performance; displayed in the left Stats panel.
- **TTS** – Speech volume and speed controls; 🔊 on each card and in practice chat to hear Indonesian. The app prefers **Windows TTS** (Microsoft voices) when available. On Windows, install speech packages for each language you use: **Settings → Time & language → Speech → Manage voices** (or Add voices).
- **Sounds** – Optional correct/wrong audio feedback.

### Practice chat
- **AI conversation** – Chat in Indonesian (or ask for help in English). The bot uses only vocabulary from your **selected modules** so it matches your level.
- **Styles** – **Casual**, **Slang** (Jakartan teen texting with shorteners like g, km, wkwk), or **Formal** (Bahasa baku).
- **Corrections** – The bot flags clearly wrong Indonesian (e.g. “aku enak” for “I’m good”) and explains what natives say. For “close but not quite natural” phrasing (e.g. “aku baik baik aja”), it can gently suggest “aku baik-baik saja” or “aku baik” and encourage you.
- **Translation spoilers** – Tap to reveal English translation for messages (when relevant).
- **Suggestions** – Ask for suggested replies and tap chips to send them.
- **“I don’t understand”** – Get a word-by-word explanation of the bot’s last message.
- **Suggested fix** – If you make a typo or idiomatically wrong phrase, the bot can suggest a correction with a “Use: [phrase]” button to paste into the input.
- **TTS** – 🔊 on messages to hear Indonesian.
- **Scroll** – Message list is in a scrollable area so you can scroll back through the conversation.
- **Memory** – Recent conversation history is sent to the API so the bot keeps context.

### UI and layout
- **Donate** – ☕ Donate button (e.g. Buy Me a Coffee) in the main title row; link is configurable in `index.html`.
- **Responsive** – Layout scales for different viewport sizes; rescaling runs when the practice chat is opened or closed.
- **Keyboard** – Enter to submit translation; Tab, Enter, and focus handling for accessibility.

---

## Tech stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (ES modules). No framework.
- **Backend (local / deploy):** Node.js (`server.js`) – serves static files and proxies chat to OpenAI.
- **Chat API:** OpenAI Chat Completions (e.g. `gpt-4o-mini`). API key is only on the server (env), never sent from the client.
- **Data:** `data/NewContent.json` – modules with `formal` / `informal` / `neutral` blocks, each with `words` and `sentences` arrays (`indo`, `english`).
- **Persistence:** Browser localStorage for casual lifetime stats and module progress.

---

## Setup and run (local)

1. **Clone or download** the repo.
2. **Install:**  
   `npm install`  
   (Only needed if you run the Node server; the app can also be opened as static files, but chat will not work without a server.)
3. **Chat (optional):** Create a `.env` in the project root with:
   ```env
   OPENAI_API_KEY=sk-your-openai-key
   ```
   Do not commit `.env`. If this is missing, the app still runs; only the practice chat will fail until the key is set.
4. **Start server:**  
   `npm start`  
   (or `node server.js`)
5. **Open:**  
   [http://localhost:3000](http://localhost:3000)

---

## Configuration

### Environment (server)
- **`OPENAI_API_KEY`** – Required for practice chat. Set in `.env` locally or in the host’s environment (e.g. Render).
- **`PORT`** – Server port (default `3000`).
- **`ALLOWED_ORIGINS`** – Comma-separated origins for CORS (default includes `https://mmaciej-png.github.io` and `http://localhost:3000`). Set on the server when the frontend is on another domain.

### Frontend (when using a remote chat backend)
- **`window.INDOTRAINER_CHAT_API`** – Set before the app loads to point the chat at a backend other than the same origin. Example (in `index.html`):  
  `window.INDOTRAINER_CHAT_API = "https://your-backend.onrender.com";`  
  Leave unset when using the same server (e.g. localhost or a single deploy).

### Donate link
- In `index.html`, edit the donate link:  
  `href="https://www.buymeacoffee.com/yourusername"`  
  Replace with your Buy Me a Coffee, Ko-fi, or other donation URL.

---

## Deployment

### Static frontend (e.g. GitHub Pages)
- Push the repo and host the root as a static site (e.g. GitHub Pages). The app will load, but **practice chat will not work** until a backend is available (no `/api/chat` and no place to set `OPENAI_API_KEY`).
- The client shows a friendly message when it detects a static site (404/405 or HTML response from `/api/chat`).

### Chat backend (e.g. Render)
- Use **Render** (or another Node host) to run the same app as a web service so `/api/chat` and CORS are available.
- **`render.yaml`** in the repo root is a Render Blueprint: one web service, `npm install` / `npm start`, with `OPENAI_API_KEY` set in the Render Dashboard (Environment). Set the key when creating the service; do not commit it.
- After deploy, set **`window.INDOTRAINER_CHAT_API`** in your static frontend to the Render service URL (e.g. `https://your-service.onrender.com`) so the chat uses that backend.
- **CORS** is handled in `server.js` (allowed origins and OPTIONS preflight for `/api/chat`). Add more origins via `ALLOWED_ORIGINS` on the server if needed.

---

## Project structure (summary)

| Path | Purpose |
|------|--------|
| `index.html` | Single-page app shell, layout, donate + chat buttons, scale logic |
| `style.css` | All styles (layout, cards, chat, modules, rank, donate) |
| `server.js` | Static file server + `/api/chat` proxy to OpenAI, CORS, .env loading |
| `render.yaml` | Render Blueprint for deploying the Node server |
| `core/` | TTS, audio, text/affix tags |
| `data/` | Load/save logic, `NewContent.json`, module meta, lifetime stats |
| `engine/` | Flip card, input, scoring, selection, rank, translate, chat LLM/vocab |
| `modes/` | Casual (main) mode logic |
| `ui/` | Card renderer, modules list, rank display, session stats, chat UI |
| `images/` | Rank badges (e.g. BRONZE, SILVER) and flags |
| `sounds/` | Correct/wrong sound files |

---

## Wipe all data

To reset all saved progress (lifetime stats, module stats, item stats, and preferences) for this app:

1. Open the app in your browser.
2. Open Developer Tools (F12 or right‑click → Inspect).
3. Go to the **Console** tab.
4. Run:
   ```js
   localStorage.clear();
   ```
5. Reload the page.

This clears all localStorage for this origin (including IndoTrainer keys like `casual_lifetime_stats_v1.1`, `casual_module_stats`, `item_stats_v1.1`, and preference flags). After a refresh, the app will show default stats and you can start fresh.

---

## Notes

- **Windows speech (TTS):** The 🔊 button uses the browser’s speech synthesis. On Windows, download the speech packages for your languages so voices are available: **Settings → Time & language → Speech → Manage voices** (or “Add voices”). Without them, some languages may have no voice or fall back to a default.
- **Content:** Edit `data/NewContent.json` to add or change modules. Structure: module name → `formal` / `informal` / `neutral` → `words` and `sentences` with `indo` and `english`.
- **Chat model:** Practice chat uses `gpt-4o-mini` by default (set in `ui/chatUI.js`). The server only proxies; model and system prompt are defined in the client.
- **Scaling:** The layout uses a viewport scaling function that runs on load, resize, and when the practice chat is opened or closed so the chat and main app scale together.
- **Accessibility:** Focus management when closing the chat, aria labels, and keyboard support (e.g. Enter to send) are built in. Touch targets are at least 44px where possible.
- **.gitignore:** `*.md` is ignored except `!README.md` so this README can be committed. `.env` and `.env.*` are ignored; never commit API keys.

---

## License

See [LICENSE](LICENSE) in the repo.
