/**
 * One-off script to verify OPENAI_API_KEY works.
 * Reads .env like server.js, then calls OpenAI Chat Completions with a minimal request.
 * Run: node test-api.js
 * Does not log or expose the API key.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("OPENAI_API_KEY not set. Add it to .env or set it in the environment.");
  process.exit(1);
}

const body = JSON.stringify({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Say OK in one word." }],
  max_tokens: 10,
});

const opts = {
  hostname: "api.openai.com",
  port: 443,
  path: "/v1/chat/completions",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "Content-Length": Buffer.byteLength(body),
  },
};

const req = https.request(opts, (res) => {
  let data = "";
  res.on("data", (ch) => (data += ch));
  res.on("end", () => {
    if (res.statusCode === 200) {
      try {
        const j = JSON.parse(data);
        const content = j.choices?.[0]?.message?.content ?? "(no content)";
        console.log("API key works. Response:", content.trim());
      } catch {
        console.log("API key works. (Response parsed successfully.)");
      }
    } else {
      try {
        const j = JSON.parse(data);
        const err = j.error?.message || j.error || data;
        console.error("API error (" + res.statusCode + "):", err);
      } catch {
        console.error("API error (" + res.statusCode + "):", data.slice(0, 200));
      }
      process.exit(1);
    }
  });
});

req.on("error", (err) => {
  console.error("Request failed:", err.message);
  process.exit(1);
});

req.write(body);
req.end();
