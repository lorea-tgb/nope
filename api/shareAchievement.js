import { getAchievementById } from "../src/nopeData.js";

export const config = {
  runtime: "edge",
};

function getBaseUrl(req) {
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "nope-neon.vercel.app";

  return `${protocol}://${host}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildAchievementHtml(req, achievement) {
  const baseUrl = getBaseUrl(req);
  const shareUrl = achievement
    ? `${baseUrl}/share/achievement/${encodeURIComponent(achievement.id)}`
    : `${baseUrl}/`;
  const ogImageUrl = `${baseUrl}/api/og?achievement=${encodeURIComponent(achievement?.id || "missing")}`;
  const title = achievement
    ? `${achievement.name} - NOPE Achievement`
    : "NOPE achievement not found";
  const description = achievement
    ? `${achievement.description} - reward: ${achievement.reward} - value gained: zero`
    : "NOPE achievement not found. probably your fault.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    <style>
      :root {
        color-scheme: dark;
        --ton-blue: #0098ea;
        --pepe-green: #39ff14;
        --glitch-pink: #ff2bd6;
      }

      * { box-sizing: border-box; }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 22px;
        background:
          repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 8px),
          linear-gradient(90deg, rgba(0, 152, 234, 0.12), transparent 34%, rgba(255, 43, 214, 0.1)),
          #020806;
        color: #d8ffe2;
        font-family: "Courier New", monospace;
      }

      .card {
        width: min(94vw, 680px);
        padding: 16px;
        border: 4px solid var(--pepe-green);
        background: #07120d;
        box-shadow:
          0 0 0 4px #00110a,
          -7px 0 0 var(--glitch-pink),
          7px 0 0 var(--ton-blue),
          0 0 38px rgba(57, 255, 20, 0.28);
      }

      .titlebar {
        margin: -16px -16px 16px;
        padding: 10px 12px;
        background: var(--ton-blue);
        color: #00110a;
        font-weight: 900;
        text-transform: uppercase;
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .stamp {
        display: inline-block;
        padding: 7px 10px;
        border: 2px solid var(--pepe-green);
        color: var(--pepe-green);
        background: #00110a;
        font-weight: 900;
        text-transform: uppercase;
      }

      h1 {
        margin: 12px 0;
        font-size: clamp(2rem, 8vw, 4.4rem);
        line-height: 0.95;
        color: #fff;
        text-shadow: 3px 0 var(--glitch-pink), -3px 0 var(--ton-blue);
      }

      p { line-height: 1.35; }

      a {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 14px;
        border: 2px solid var(--ton-blue);
        background: var(--pepe-green);
        color: #00110a;
        font-weight: 900;
        text-decoration: none;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="titlebar"><span>NOPE OS // REWARD SYSTEM</span><span>VALUE: ZERO</span></div>
      ${
        achievement
          ? `<span class="stamp">ACHIEVEMENT UNLOCKED</span>
      <h1>${escapeHtml(achievement.name)}</h1>
      <p>${escapeHtml(achievement.description)}</p>
      <p>reward: ${escapeHtml(achievement.reward)}</p>
      <p>value gained: zero</p>`
          : `<span class="stamp">ACHIEVEMENT MISSING</span>
      <h1>NOPE achievement not found.</h1>
      <p>probably your fault.</p>
      <p>value gained: zero</p>`
      }
      <a href="/">ENTER NOPE MACHINE</a>
    </main>
  </body>
</html>`;
}

export default function handler(req) {
  const id = new URL(req.url).searchParams.get("id");
  const achievement = getAchievementById(id);

  return new Response(buildAchievementHtml(req, achievement), {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=86400",
      "content-type": "text/html; charset=utf-8",
    },
  });
}
