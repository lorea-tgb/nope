import { getNopeEntityById } from "../src/nopeData.js";

export const config = {
  runtime: "edge",
};

function formatDropChance(chance) {
  return `${Number(chance).toFixed(chance < 1 ? 2 : 1).replace(/\.?0+$/, "")}%`;
}

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

function getStickerValue(entity) {
  if (entity?.type === "uber") {
    return "probability has been insulted - value: still zero";
  }

  if (entity?.type === "gif") {
    return "value: animated zero";
  }

  return "value: emotionally zero";
}

function buildShareHtml(req, entity) {
  const baseUrl = getBaseUrl(req);
  const shareUrl = entity ? `${baseUrl}/share/${encodeURIComponent(entity.id)}` : `${baseUrl}/`;
  const ogImageUrl = `${baseUrl}/api/og?id=${encodeURIComponent(entity?.id || "missing")}`;
  const title = entity ? `${entity.name} - NOPEDEX` : "NOPE not found - NOPEDEX";
  const description = entity
    ? `${entity.rarityLabel} - odds ${formatDropChance(entity.dropChance)} - ${getStickerValue(entity)}`
    : "NOPE not found. probably your fault.";
  const stickerImageUrl = entity ? `${baseUrl}${entity.image}` : `${baseUrl}/images/nopebutton.png`;

  // Social platforms cache previews aggressively. When testing a changed card,
  // try a different sticker or add a temporary query string after deployment.
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
          linear-gradient(rgba(57, 255, 20, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 152, 234, 0.06) 1px, transparent 1px),
          #020806;
        background-size: 34px 34px;
        color: #d8ffe2;
        font-family: "Courier New", monospace;
      }

      .card {
        width: min(94vw, 620px);
        padding: 14px;
        border: 4px solid var(--ton-blue);
        background: #07120d;
        box-shadow: 0 0 0 4px #00110a, 0 0 32px rgba(57, 255, 20, 0.26);
      }

      .titlebar {
        margin: -14px -14px 14px;
        padding: 10px 12px;
        background: var(--ton-blue);
        color: #00110a;
        font-weight: 900;
        text-transform: uppercase;
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .media {
        aspect-ratio: 1 / 1;
        display: grid;
        place-items: center;
        background: #020806;
        border: 3px solid var(--pepe-green);
        margin-bottom: 12px;
        overflow: hidden;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      h1 {
        margin: 8px 0;
        font-size: clamp(2rem, 8vw, 4.2rem);
        line-height: 0.95;
        color: #fff;
        text-shadow: 3px 0 var(--glitch-pink), -3px 0 var(--ton-blue);
      }

      .badge {
        display: inline-block;
        margin: 2px 0 8px;
        padding: 6px 9px;
        border: 2px solid var(--pepe-green);
        color: var(--pepe-green);
        background: #00110a;
        font-weight: 900;
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
      <div class="titlebar"><span>NOPEDEX // GARBAGE INDEX</span><span>VALUE: ZERO</span></div>
      ${
        entity
          ? `<div class="media"><img src="${escapeHtml(stickerImageUrl)}" alt="${escapeHtml(entity.name)}" /></div>
      <h1>${escapeHtml(entity.name)}</h1>
      <span class="badge">${escapeHtml(entity.rarityLabel)} - odds ${escapeHtml(formatDropChance(entity.dropChance))}</span>
      <p>${escapeHtml(entity.caption)}</p>
      <p>${escapeHtml(getStickerValue(entity))}</p>`
          : `<h1>NOPE not found.</h1>
      <p>probably your fault.</p>
      <p>value: still zero</p>`
      }
      <a href="/">ENTER NOPE MACHINE</a>
    </main>
  </body>
</html>`;
}

export default function handler(req) {
  const id = new URL(req.url).searchParams.get("id");
  const entity = getNopeEntityById(id);

  return new Response(buildShareHtml(req, entity), {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=86400",
      "content-type": "text/html; charset=utf-8",
    },
  });
}
