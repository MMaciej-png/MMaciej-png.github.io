/**
 * Local server: serves static app and proxies chat to OpenAI.
 * API key is read from env only (never sent to the client).
 *
 * Usage: set OPENAI_API_KEY in env, then run:
 *   npm start
 * or
 *   node server.js
 *
 * .env is loaded manually so we don't require dotenv as a dependency.
 * You can also export OPENAI_API_KEY=sk-... in the shell.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

// Optional: load .env if present (so user can put OPENAI_API_KEY in .env)
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || "https://mmaciej-png.github.io,http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
);

function corsOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  if (origin && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) return origin;
  return "*";
}

function corsHeaders(req) {
  const o = corsOrigin(req);
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".wav": "audio/wav",
    ".svg": "image/svg+xml",
  };
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function proxyChat(req, res, body) {
  const headers = { "Content-Type": "application/json", ...corsHeaders(req) };

  if (!OPENAI_API_KEY) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: "OPENAI_API_KEY not set. Set it in .env or in the environment." }));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    res.writeHead(400, headers);
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  const { messages, systemPrompt, model = "gpt-4o-mini" } = payload;
  if (!Array.isArray(messages) || !systemPrompt) {
    res.writeHead(400, headers);
    res.end(JSON.stringify({ error: "messages and systemPrompt required" }));
    return;
  }

  const openaiMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const opts = {
    hostname: "api.openai.com",
    port: 443,
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  };

  const postData = JSON.stringify({
    model,
    messages: openaiMessages,
    response_format: { type: "json_object" },
  });

  opts.headers["Content-Length"] = Buffer.byteLength(postData);

  const proxyReq = require("https").request(opts, (proxyRes) => {
    let data = "";
    proxyRes.on("data", (ch) => (data += ch));
    proxyRes.on("end", () => {
      res.writeHead(proxyRes.statusCode, { "Content-Type": "application/json", ...corsHeaders(req) });
      res.end(data);
    });
  });

  proxyReq.on("error", (err) => {
    res.writeHead(502, headers);
    res.end(JSON.stringify({ error: "Proxy error: " + err.message }));
  });

  proxyReq.write(postData);
  proxyReq.end();
}

const server = http.createServer((req, res) => {
  const rawPath = (req.url || "").split("?")[0];
  const pathname = rawPath.replace(/\/+$/, "") || "";
  const isApiChat = pathname === "/api/chat";

  if (isApiChat) {
    if (req.method === "OPTIONS") {
      res.writeHead(200, { ...corsHeaders(req), "Content-Length": "0" });
      res.end();
      return;
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", (ch) => (body += ch));
      req.on("end", () => proxyChat(req, res, body));
      return;
    }
    res.writeHead(405, { "Content-Type": "application/json", ...corsHeaders(req) });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }

  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  if (!path.resolve(filePath).startsWith(path.resolve(__dirname))) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveStatic(req, res, filePath);
    return;
  }
  if (fs.existsSync(filePath + ".html")) {
    serveStatic(req, res, filePath + ".html");
    return;
  }
  if (req.url === "/" || req.url.startsWith("/?")) {
    serveStatic(req, res, path.join(__dirname, "index.html"));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("IndoTrainer server at http://localhost:" + PORT);
  if (!OPENAI_API_KEY) console.warn("OPENAI_API_KEY not set; chat will fail until you set it in .env or env.");
});
