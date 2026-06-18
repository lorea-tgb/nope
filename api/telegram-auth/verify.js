/* global process */

export const config = {
  runtime: "edge",
};

const TELEGRAM_LOGIN_MAX_AGE_SECONDS = 60 * 60 * 24;
const TELEGRAM_LOGIN_FUTURE_SKEW_SECONDS = 60 * 5;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function normalizeTelegramUsername(username) {
  if (typeof username !== "string") {
    return "";
  }

  return username.trim().replace(/^@+/, "");
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeStringEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") {
    return false;
  }

  let difference = left.length ^ right.length;
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}

async function createTelegramLoginHash(dataCheckString, botToken) {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.digest("SHA-256", encoder.encode(botToken));
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(dataCheckString));

  return bytesToHex(signature);
}

function createDataCheckString(payload) {
  return Object.entries(payload)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)])
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function isFreshAuthDate(authDate) {
  const authTimestamp = Number(authDate);

  if (!Number.isFinite(authTimestamp)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  return (
    authTimestamp >= nowSeconds - TELEGRAM_LOGIN_MAX_AGE_SECONDS &&
    authTimestamp <= nowSeconds + TELEGRAM_LOGIN_FUTURE_SKEW_SECONDS
  );
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return jsonResponse({ error: "telegram_auth_not_configured" }, 500);
  }

  let payload;

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (!payload || typeof payload !== "object" || typeof payload.hash !== "string") {
    return jsonResponse({ error: "invalid_payload" }, 400);
  }

  if (!isFreshAuthDate(payload.auth_date)) {
    return jsonResponse({ error: "stale_login" }, 401);
  }

  const dataCheckString = createDataCheckString(payload);
  const expectedHash = await createTelegramLoginHash(dataCheckString, botToken);

  if (!timingSafeStringEqual(expectedHash, payload.hash)) {
    return jsonResponse({ error: "invalid_hash" }, 401);
  }

  const username = normalizeTelegramUsername(payload.username);

  if (!username) {
    return jsonResponse({ error: "missing_username" }, 422);
  }

  return jsonResponse({
    telegramId: payload.id,
    username,
    connectedAt: new Date().toISOString(),
    source: "telegram-web-login",
  });
}
