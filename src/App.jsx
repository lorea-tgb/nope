import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabaseClient";
import {
  CONTRACT,
  GIF_TOTAL,
  MYTHIC_TOTAL,
  NORMAL_TOTAL,
  UBER_TOTAL,
  achievements,
  allNopeEntities,
  defaultAchievementStats,
  forbiddenNopeGifs,
  getNopeEntityById,
  getRank,
  glitchWarnings,
  mythicNopeRelics,
  noHitMessages,
  nopeLabels,
  pickDiscoveryEntity,
  rarityPools,
  standardNopeEntities,
  stickerGridEntities,
  uberNopeRelics,
  zNopeEntity,
} from "./nopeData";


const STORAGE_KEYS = {
  achievementStats: "nopeMachine.achievementStats",
  collectedIds: "nopeMachine.collectedIds",
  firstStickerForced: "nope_first_sticker_forced",
  firstStickerPopupSeen: "nope_first_sticker_popup_seen",
  foundOrder: "nope_found_order",
  currentBadIdea: "nope_current_bad_idea",
  currentBadIdeaProgress: "nope_current_bad_idea_progress",
  badIdeasCompleted: "nope_bad_ideas_completed",
  nopeSurgeCharge: "nope_surge_charge",
  nopeSurgeReady: "nope_surge_ready",
  nopeSurgeActive: "nope_surge_active",
  nopeSurgeActivations: "nope_surge_activations",
  forcedStickerBookPopupCount: "nope_forced_stickerbook_popup_count",
  bootPopupSeen: "nope_boot_popup_seen",
  introSeen: "nopeIntroSeen",
  latestDiscoveryId: "nopeMachine.latestDiscoveryId",
  lastGrinderPromptNopeCount: "nope_last_grinder_prompt_count",
  duplicateMaterials: "nope_duplicate_materials",
  duplicateCopies: "nope_duplicate_copies",
  nopeCount: "nopeMachine.nopeCount",
  sacrificedIds: "nope_sacrificed_ids",
  unlockedAchievements: "nopeMachine.unlockedAchievements",
  zNopeAcquired: "nope_znope_acquired",
  zRollAttempts: "nope_z_roll_attempts",
  zRollFailures: "nope_z_roll_failures",
  zTokenClaimedAchievementIds: "nope_z_token_claimed_achievement_ids",
  zRollTokens: "nope_z_roll_tokens",
  zSignalRollsLeaked: "nope_signal_z_rolls_leaked",
  zChamberTeaserSeen: "nope_z_chamber_teaser_seen",
  nopeScore: "nope_score",
  signalFragmentsFound: "nope_signal_fragments_found",
  signalFragmentsClicked: "nope_signal_fragments_clicked",
  signalTypeClicks: "nope_signal_type_clicks",
  scoreCombo: "nope_score_combo",
  telegramPlayer: "nope_telegram_player",
  zSignalCharge: "nope_z_signal_charge",
};
const LEGACY_SCORE_HUD_POSITION_KEY = "nope_score_hud_position";

const FORCED_STICKERBOOK_DROP_THRESHOLD = 1;
const IMPORTANT_MODAL_ACTION_DELAY = 1000;
const GRINDER_PROMPT_NOPE_COOLDOWN = 20;
const SACRIFICE_MATERIAL_GAIN = 3;
const DEFAULT_DUPLICATE_MATERIALS = {
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 0,
  mythic: 0,
};
const DUPLICATE_MATERIAL_LABELS = {
  common: "COMMON NOPE",
  uncommon: "UNCOMMON NOPE",
  rare: "RARE NOPE",
  epic: "EPIC NOPE",
  mythic: "MYTHIC NOPE",
};
const DUPLICATE_GRINDER_RECIPES = [
  { cost: 10, source: "common", target: "uncommon", button: "GRIND COMMONS" },
  { cost: 8, source: "uncommon", target: "rare", button: "GRIND UNCOMMONS" },
  { cost: 6, source: "rare", target: "epic", button: "GRIND RARES" },
  { cost: 4, source: "epic", target: "mythic", button: "GRIND EPICS" },
  { cost: 5, source: "mythic", target: "uber", button: "GRIND MYTHICS" },
];
const NOPE_SCORE_VALUES = {
  achievementBasic: 2500,
  achievementCursed: 50000,
  achievementSpecial: 10000,
  achievementZ: 100000,
  burnCommon: 1000,
  burnEpic: 12500,
  burnMythic: 50000,
  burnRare: 5000,
  burnUber: 250000,
  burnUncommon: 2500,
  craftEpic: 15000,
  craftMythic: 35000,
  craftRare: 7500,
  craftUber: 100000,
  duplicateGif: 50,
  duplicateSticker: 25,
  grinderCraft: 5000,
  loopCursed: 7500,
  loopForbidden: 2500,
  loopGlitch: 1000,
  loopIllegal: 25000,
  newCommon: 250,
  newEpic: 2500,
  newMythic: 7500,
  newRare: 1000,
  newUber: 25000,
  newUncommon: 500,
  press: 10,
  signalCorrupt: 2500,
  signalDanger: 7500,
  signalNormal: 500,
  signalTon: 1000,
  signalZ: 25000,
  zNope: 1000000,
  zRollFailure: 25000,
};
const NOPE_SCORE_REASON_LABELS = {
  "achievement:basic": "ACHIEVEMENT",
  "achievement:cursed": "CURSED ACHIEVEMENT",
  "achievement:special": "BAD IDEA BONUS",
  "achievement:z": "Z ACHIEVEMENT",
  burn: "BURN BONUS",
  "bad-idea": "BAD IDEA COMPLETE",
  discovery: "NEW FIND",
  duplicate: "DUPLICATE",
  grinder: "GRINDER BONUS",
  press: "NOPE PRESS",
  "signal:corrupt": "CORRUPT SIGNAL",
  "signal:danger": "RED SIGNAL",
  "signal:normal": "STATIC SIGNAL",
  "signal:ton": "TON SIGNAL",
  "signal:z": "Z SIGNAL",
  "z-nope": "Z NOPE BONUS",
  "z-roll-failure": "Z FAILURE BONUS",
};
const NOPE_COMBO_MULTIPLIER = 1.5;
const NOPE_COMBO_TRIGGER_SCORE = 25000;
const NOPE_COMBO_WINDOW_EVENTS = 10;
const NOPE_COMBO_ACTIVE_EVENTS = 10;
const Z_SIGNAL_CHARGE_TARGET = 500000;
const NOPE_SURGE_DURATION_MS = 45000;
const NOPE_SURGE_SCORE_MULTIPLIER = 2;
const NOPE_SURGE_CHARGE_TARGET = 500000;
const NOPE_SURGE_HELP_TEXT = "NOPE SURGE fills from meaningful score. Find trash, grind trash, burn trash, click static, fail Z rolls. Button spam barely helps. Obviously.";
const TELEGRAM_LOGIN_BOT_USERNAME = "NotPepeNopeBot";
const TELEGRAM_LOGIN_CALLBACK_NAME = "__nopeTelegramLogin";
const TELEGRAM_LOGIN_WIDGET_SRC = "https://telegram.org/js/telegram-widget.js";
const TELEGRAM_AUTH_VERIFY_ENDPOINT = "/api/telegram-auth/verify";
const CURRENT_BAD_IDEAS = [
  {
    id: "press_25",
    reward: 25000,
    target: 25,
    title: "KEEP PRESSING. UNFORTUNATELY.",
    type: "press",
  },
  {
    id: "find_3_stickers",
    reward: 50000,
    target: 3,
    title: "RECOVER 3 PIECES OF TRASH",
    type: "newSticker",
  },
  {
    id: "click_2_signals",
    reward: 50000,
    target: 2,
    title: "DECODE 2 BACKGROUND LIES",
    type: "signal",
  },
  {
    id: "grind_once",
    reward: 75000,
    target: 1,
    title: "FEED THE MACHINE",
    type: "grinder",
  },
  {
    id: "burn_1",
    reward: 75000,
    target: 1,
    title: "DAMAGE YOUR COLLECTION",
    type: "burn",
  },
  {
    id: "fail_z_once",
    reward: 100000,
    target: 1,
    title: "LOSE TO THE Z CHAMBER",
    type: "zFail",
  },
  {
    id: "find_loop",
    reward: 75000,
    target: 1,
    title: "CATCH MOVING REGRET",
    type: "loop",
  },
];
function getBadIdeaTaskText(mission) {
  const taskTextById = {
    burn_1: "Burn or sacrifice 1 sticker.",
    click_2_signals: "Click 2 background signal fragments.",
    fail_z_once: "Fail 1 real Z roll.",
    find_3_stickers: "Find 3 new pieces of trash.",
    find_loop: "Find 1 loop/GIF.",
    grind_once: "Use the Duplicate Grinder once.",
    press_25: "Press NOPE 25 times.",
  };

  return taskTextById[mission?.id] ?? "Do the thing the machine should not have suggested.";
}
const Z_ROLL_ACHIEVEMENT_IDS = new Set([
  "absolute-degenerate",
  "again-really",
  "ascended-into-nope",
  "ashes-to-nopedex",
  "both-options-rejected",
  "burn-pile-curator",
  "final-boss-press",
  "five-z-rolls-still-nope",
  "fuel-hoarder",
  "god-left-the-chat",
  "industrial-regret",
  "mythic-bonfire",
  "mythic-recycling",
  "mythically-useless",
  "nopedex-heretic",
  "nope-or-no-achievement",
  "nope-or-nothing-achievement",
  "phoenix-nopedex",
  "probability-launderer",
  "scorched-earth",
  "ten-z-rolls-zero-z",
  "the-final-no",
  "total-nopeification",
  "uberly-pointless",
]);
const BACKGROUND_SIGNAL_FRAGMENTS = [
  { id: "static-nope", text: "01101110 01101111 01110000 01100101" },
  { id: "z-leak", text: "01011010 00110001" },
  { id: "nope-query", text: "01101110 01101111 01110000 01100101 00111111" },
  { id: "null-signal", text: "00000000 01001110 01001111" },
  { id: "bad-packet", text: "10 NOPE 01 404 0110" },
];
const BOOT_POPUP_LINES = [
  "NOPE MACHINE detected.",
  "checking utility...",
  "utility not found.",
  "checking value...",
  "value not found.",
  "checking contract...",
  "contract detected.",
  "contract is on TON.",
  "or NOT.",
  "obviously.",
  "Press the big stupid button....",
  "you might find something.",
  "probably not though.",
];
const BOOT_POPUP_LINE_TIMING = {
  "checking contract...": { hold: [850, 1100], typeDelay: [32, 58] },
  "contract is on TON.": { hold: [700, 900] },
  "or NOT.": { hold: [500, 750] },
  "obviously.": { hold: [650, 850] },
  "you might find something.": { hold: [900, 1200] },
  "probably not though.": { hold: [900, 1200] },
};
const BOOT_POPUP_DEFAULT_TIMING = {
  exit: [180, 300],
  hold: [350, 550],
  typeDelay: [16, 34],
};
const INITIAL_FEED_LINES = [
  "feed online.",
  "button awaiting poor decision.",
  "bad idea loaded. follow it or don't.",
];
const BACKGROUND_SIGNAL_SNIPPETS = [
  "0110101",
  "01011010",
  "001101",
  "NOPE 01",
  "0X00",
  "0110 10",
  "Z 001",
  "101101",
  "00 NOPE",
];
const SIGNAL_FRAGMENT_TYPES = [
  { type: "normal", weight: 65 },
  { type: "ton", weight: 18 },
  { type: "corrupt", weight: 10 },
  { type: "danger", weight: 5 },
  { type: "z", weight: 2 },
];
const SIGNAL_FRAGMENT_TYPE_SNIPPETS = {
  normal: BACKGROUND_SIGNAL_SNIPPETS,
  ton: ["TON 01", "CHAIN 00", "0101 NET", "T.me 10", "0:TON", "SYNC 01"],
  corrupt: ["N0?E", "ERR 011", "NO//PE", "1?0?1", "BAD 0X", "NULL??"],
  danger: ["RED 01", "BURN 10", "NOPE!", "ASH 00", "WARN 1", "STOP 0"],
  z: ["Z 001", "Z//NO", "ROLL 1", "010 Z", "Z? 00", "NO. Z"],
};
const SIGNAL_FRAGMENT_SAFE_ZONES = [
  { x: [4, 18], y: [20, 42] },
  { x: [74, 91], y: [20, 43] },
  { x: [5, 24], y: [66, 86] },
  { x: [70, 90], y: [63, 84] },
  { x: [12, 28], y: [46, 58] },
  { x: [72, 88], y: [46, 58] },
];
const SIGNAL_FRAGMENT_MOBILE_SAFE_ZONES = [
  { x: [4, 18], y: [22, 36] },
  { x: [58, 70], y: [34, 48] },
  { x: [6, 22], y: [72, 84] },
  { x: [54, 68], y: [72, 84] },
];
const STICKERBOOK_SIGNAL_FRAGMENT_SAFE_ZONES = [
  { x: [3, 10], y: [18, 40] },
  { x: [90, 96], y: [18, 42] },
  { x: [3, 11], y: [56, 80] },
  { x: [89, 96], y: [58, 78] },
  { x: [78, 91], y: [11, 15] },
  { x: [76, 92], y: [84, 88] },
];
const STICKERBOOK_SIGNAL_FRAGMENT_MOBILE_SAFE_ZONES = [
  { x: [3, 13], y: [23, 34] },
  { x: [84, 94], y: [26, 38] },
  { x: [4, 16], y: [73, 82] },
  { x: [82, 94], y: [68, 78] },
];
const SIGNAL_FRAGMENT_CONTEXTS = {
  home: {
    desktopMax: 3,
    desktopSafeZones: SIGNAL_FRAGMENT_SAFE_ZONES,
    mobileMax: 1,
    mobileSafeZones: SIGNAL_FRAGMENT_MOBILE_SAFE_ZONES,
    spawnCount: (isCompact) => (isCompact ? 1 : randomChance(0.08) ? 3 : randomChance(0.28) ? 2 : 1),
  },
  stickerbook: {
    desktopMax: 2,
    desktopSafeZones: STICKERBOOK_SIGNAL_FRAGMENT_SAFE_ZONES,
    mobileMax: 1,
    mobileSafeZones: STICKERBOOK_SIGNAL_FRAGMENT_MOBILE_SAFE_ZONES,
    spawnCount: (isCompact) => (isCompact ? 1 : randomChance(0.26) ? 2 : 1),
  },
};
const SIGNAL_FRAGMENT_SCORE_REWARDS = {
  normal: NOPE_SCORE_VALUES.signalNormal,
  ton: NOPE_SCORE_VALUES.signalTon,
  corrupt: NOPE_SCORE_VALUES.signalCorrupt,
  danger: NOPE_SCORE_VALUES.signalDanger,
  z: NOPE_SCORE_VALUES.signalZ,
};
const SIGNAL_FRAGMENT_MESSAGES = {
  normal: [
    {
      title: "SIGNAL FRAGMENT DETECTED",
      body: ["01101110 01101111 01110000 01100101", "the machine is leaking.", "that feels unhealthy."],
      button: "CLOSE STATIC",
    },
    {
      title: "CORRUPTED BACKGROUND NOISE",
      body: ["background noise decoded.", "result: still nope."],
      button: "DENY SIGNAL",
    },
  ],
  ton: [
    {
      title: "CHAIN STATIC FOUND",
      body: ["network signal recovered.", "value moved: zero.", "confidence: inappropriate."],
      button: "CLOSE STATIC",
    },
    {
      title: "CHAIN STATIC FOUND",
      body: ["telegram echo detected.", "nobody asked.", "NOPE listened anyway."],
      button: "RETURN TO IGNORANCE",
    },
  ],
  corrupt: [
    {
      title: "CORRUPTED SIGNAL OPENED",
      body: ["this fragment has been chewed by the machine.", "please do not feed it feelings."],
      button: "DENY SIGNAL",
    },
    {
      title: "CORRUPTED SIGNAL OPENED",
      body: ["decode failed successfully.", "meaning: probably NOPE."],
      button: "PRETEND NOTHING HAPPENED",
    },
  ],
  danger: [
    {
      title: "DANGER SIGNAL CLICKED",
      body: ["red static means stop.", "you clicked it anyway.", "excellent work."],
      button: "CLOSE STATIC",
    },
    {
      title: "DANGER SIGNAL CLICKED",
      body: ["burn warning detected.", "the grinder smiled.", "that is not normal."],
      button: "PRETEND NOTHING HAPPENED",
    },
  ],
  z: [
    {
      title: "Z SIGNAL LEAK",
      body: ["the final NO is listening.", "roll 1.", "or don't.", "mostly don't."],
      button: "DENY SIGNAL",
    },
    {
      title: "Z SIGNAL LEAK",
      body: ["Z Chamber noise detected.", "probability looked away."],
      button: "RETURN TO IGNORANCE",
    },
  ],
};

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChance(chance) {
  return Math.random() < chance;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickWeightedSignalType() {
  const totalWeight = SIGNAL_FRAGMENT_TYPES.reduce((total, item) => total + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of SIGNAL_FRAGMENT_TYPES) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.type;
    }
  }

  return "normal";
}

function formatDropChance(chance) {
  return `${Number(chance).toFixed(chance < 1 ? 2 : 1).replace(/\.?0+$/, "")}%`;
}

function formatScoreReason(reason) {
  if (!reason) {
    return "NOPE SCORE";
  }

  if (NOPE_SCORE_REASON_LABELS[reason]) {
    return NOPE_SCORE_REASON_LABELS[reason];
  }

  if (reason.startsWith("achievement:")) {
    return "ACHIEVEMENT";
  }

  if (reason.startsWith("burn:") || reason.startsWith("sacrifice:")) {
    return "BURN BONUS";
  }

  if (reason.startsWith("discovery:")) {
    return "NEW FIND";
  }

  if (reason.startsWith("duplicate:")) {
    return "DUPLICATE";
  }

  if (reason.startsWith("grinder:")) {
    return "GRINDER BONUS";
  }

  if (reason.startsWith("signal:")) {
    return "SIGNAL";
  }

  return reason.replace(/[-:]/g, " ").toUpperCase();
}

function formatScoreAmount(amount) {
  return Math.floor(Number(amount) || 0).toLocaleString("en-US");
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - ((-2 * progress + 2) ** 3) / 2;
}

function easeOutCubic(progress) {
  return 1 - ((1 - progress) ** 3);
}

function getScoreRollDuration(scoreGap) {
  if (scoreGap < 1000) {
    return 650;
  }

  if (scoreGap < 10000) {
    return 1400;
  }

  if (scoreGap < 100000) {
    return 2400;
  }

  if (scoreGap < 1000000) {
    return 3300;
  }

  return 4000;
}

function animateScrollToTop(element, duration = 700) {
  if (!element) {
    return;
  }

  const start = element.scrollTop;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    element.scrollTop = start * (1 - eased);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function getLoopLeakTitle(entity) {
  if (entity.rarity === "illegal") {
    return "ILLEGAL LOOP BREACH";
  }

  return `${entity.rarityLabel} LEAK`;
}

function getLoopFoundTitle(entity) {
  if (entity.rarity === "illegal") {
    return "ILLEGAL LOOP CONTAINED";
  }

  return `${entity.rarityLabel} CAPTURED`;
}

function getLoopBreachTitle(entity, mode = "discovery") {
  if (mode === "chaos") {
    return entity.rarity === "illegal" ? "OWNED LOOP MALFUNCTION" : "COLLECTED LOOP BREACH";
  }

  if (entity.rarity === "illegal") {
    return "NOPE OS BREACH DETECTED";
  }

  if (entity.rarity === "cursed") {
    return "CURSED LOOP BREACH";
  }

  if (entity.rarity === "glitch") {
    return "GLITCH LOOP LEAK";
  }

  return "FORBIDDEN LOOP BREACH";
}

function getLoopBreachDuration(entity) {
  const durations = {
    cursed: [1400, 1800],
    forbidden: [1100, 1400],
    glitch: [900, 1200],
    illegal: [1800, 2300],
  };
  const [min, max] = durations[entity.rarity] || durations.forbidden;

  return randomBetween(min, max);
}

function createLoopBreachEvent(entity, mode = "discovery") {
  return {
    duration: getLoopBreachDuration(entity),
    entity,
    intensity: entity.rarity,
    mode,
    title: getLoopBreachTitle(entity, mode),
    type: "breach",
  };
}

function readStoredArray(key) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function readStoredObject(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = storedValue ? JSON.parse(storedValue) : {};

    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
      ? { ...fallback, ...parsedValue }
      : fallback;
  } catch {
    return fallback;
  }
}

function readStoredNumber(key) {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedValue = Number(window.localStorage.getItem(key));

  return Number.isFinite(storedValue) ? storedValue : 0;
}

function readStoredString(key) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function normalizeTelegramUsername(username) {
  if (typeof username !== "string") {
    return "";
  }

  return username.trim().replace(/^@+/, "");
}

function createTelegramPlayer(user, source = "telegram-mini-app") {
  const username = normalizeTelegramUsername(user?.username);

  if (!user?.id || !username) {
    return null;
  }

  return {
    telegramId: user.id,
    username,
    connectedAt: new Date().toISOString(),
    source,
  };
}

function normalizeVerifiedTelegramPlayer(player) {
  const username = normalizeTelegramUsername(player?.username);
  const source = player?.source === "telegram-web-login" ? "telegram-web-login" : "telegram-mini-app";

  if (!player?.telegramId || !username) {
    return null;
  }

  return {
    telegramId: player.telegramId,
    username,
    connectedAt: player.connectedAt || new Date().toISOString(),
    source,
  };
}

function readStoredTelegramPlayer() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEYS.telegramPlayer);
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;
    const username = normalizeTelegramUsername(parsedValue?.username);

    if (!parsedValue || !username) {
      return null;
    }

    return normalizeVerifiedTelegramPlayer({
      telegramId: parsedValue.telegramId,
      username,
      connectedAt: parsedValue.connectedAt,
      source: parsedValue.source,
    });
  } catch {
    return null;
  }
}

function readStoredComboState() {
  const fallback = {
    activeHitsLeft: 0,
    bank: 0,
    events: 0,
  };
  const storedCombo = readStoredObject(STORAGE_KEYS.scoreCombo, fallback);

  return {
    activeHitsLeft: Math.max(0, Math.floor(Number(storedCombo.activeHitsLeft) || 0)),
    bank: Math.max(0, Math.floor(Number(storedCombo.bank) || 0)),
    events: Math.max(0, Math.floor(Number(storedCombo.events) || 0)),
  };
}

function getCurrentBadIdeaById(id) {
  return CURRENT_BAD_IDEAS.find((mission) => mission.id === id) ?? null;
}

function pickNextBadIdeaId(previousId = null) {
  const missionPool = CURRENT_BAD_IDEAS.filter((mission) => mission.id !== previousId);

  return pickRandom(missionPool.length > 0 ? missionPool : CURRENT_BAD_IDEAS).id;
}

function getDefaultScoreHudPosition() {
  if (typeof window === "undefined") {
    return { x: 40, y: 150 };
  }

  return {
    x: Math.round(Math.min(Math.max(window.innerWidth * 0.03, 28), 52)),
    y: Math.round(Math.min(Math.max(window.innerHeight * 0.16, 120), 170)),
  };
}

function clampScoreHudPosition(position) {
  if (typeof window === "undefined") {
    return position;
  }

  const maxX = Math.max(12, window.innerWidth - 250);
  const maxY = Math.max(12, window.innerHeight - 190);

  return {
    x: Math.min(Math.max(12, Math.round(position.x)), maxX),
    y: Math.min(Math.max(12, Math.round(position.y)), maxY),
  };
}

function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
}

export default function App() {
  const [telegramWebApp] = useState(() => getTelegramWebApp());
  const [showIntro, setShowIntro] = useState(() => readStoredString(STORAGE_KEYS.introSeen) !== "true");
  const [introChoice, setIntroChoice] = useState(null);
  const [isIntroExiting, setIsIntroExiting] = useState(false);
  const [lines, setLines] = useState([]);
  const [nopeCount, setNopeCount] = useState(() => readStoredNumber(STORAGE_KEYS.nopeCount));
  const [nopeScore, setNopeScore] = useState(() => readStoredNumber(STORAGE_KEYS.nopeScore));
  const [displayedNopeScore, setDisplayedNopeScore] = useState(() => readStoredNumber(STORAGE_KEYS.nopeScore));
  const [isScoreSettled, setIsScoreSettled] = useState(false);
  const [scoreBursts, setScoreBursts] = useState([]);
  const [scoreHeat, setScoreHeat] = useState(0);
  const [scoreCombo, setScoreCombo] = useState(() => readStoredComboState());
  const [comboNotice, setComboNotice] = useState(null);
  const [scoreHudPosition, setScoreHudPosition] = useState(() => getDefaultScoreHudPosition());
  const [isScoreHudDragging, setIsScoreHudDragging] = useState(false);
  const [achievementStats, setAchievementStats] = useState(() =>
    readStoredObject(STORAGE_KEYS.achievementStats, defaultAchievementStats),
  );
  const [duplicateMaterials, setDuplicateMaterials] = useState(() =>
    readStoredObject(STORAGE_KEYS.duplicateMaterials, DEFAULT_DUPLICATE_MATERIALS),
  );
  const [duplicateCopies, setDuplicateCopies] = useState(() =>
    readStoredObject(STORAGE_KEYS.duplicateCopies, {}),
  );
  const [zRollTokens, setZRollTokens] = useState(() => readStoredNumber(STORAGE_KEYS.zRollTokens));
  const [zRollAttempts, setZRollAttempts] = useState(() => readStoredNumber(STORAGE_KEYS.zRollAttempts));
  const [zRollFailures, setZRollFailures] = useState(() => readStoredNumber(STORAGE_KEYS.zRollFailures));
  const [zSignalCharge, setZSignalCharge] = useState(() => readStoredNumber(STORAGE_KEYS.zSignalCharge));
  const [activeZSignalChargePopup, setActiveZSignalChargePopup] = useState(false);
  const [znopeAcquired, setZnopeAcquired] = useState(() =>
    readStoredString(STORAGE_KEYS.zNopeAcquired) === "true" || readStoredArray(STORAGE_KEYS.collectedIds).includes("znope"),
  );
  const [zTokenClaimedAchievementIds, setZTokenClaimedAchievementIds] = useState(() =>
    readStoredArray(STORAGE_KEYS.zTokenClaimedAchievementIds),
  );
  const [zTokenPopupQueue, setZTokenPopupQueue] = useState([]);
  const [activeZTokenPopup, setActiveZTokenPopup] = useState(null);
  const [showZChamberTeaserPopup, setShowZChamberTeaserPopup] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState(() =>
    readStoredArray(STORAGE_KEYS.unlockedAchievements),
  );
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [activeAchievement, setActiveAchievement] = useState(null);
  const [activeDiscoveryPopup, setActiveDiscoveryPopup] = useState(null);
  const [activeGoodFindModal, setActiveGoodFindModal] = useState(null);
  const [activeCraftResult, setActiveCraftResult] = useState(null);
  const [activeSacrificeEntity, setActiveSacrificeEntity] = useState(null);
  const [activeUberSacrificeEntity, setActiveUberSacrificeEntity] = useState(null);
  const [activeStickerInspectEntity, setActiveStickerInspectEntity] = useState(null);
  const [activeAchievementInspect, setActiveAchievementInspect] = useState(null);
  const [telegramPlayer, setTelegramPlayer] = useState(() => readStoredTelegramPlayer());
  const [showTelegramLoginModal, setShowTelegramLoginModal] = useState(false);
  const [telegramLoginModalMode, setTelegramLoginModalMode] = useState("browser");
  const [isTelegramLoginVerifying, setIsTelegramLoginVerifying] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [activeSignalFragment, setActiveSignalFragment] = useState(null);
  const [visibleSignalFragments, setVisibleSignalFragments] = useState([]);
  const [signalFragmentsFound, setSignalFragmentsFound] = useState(() =>
    Math.max(readStoredNumber(STORAGE_KEYS.signalFragmentsFound), readStoredNumber(STORAGE_KEYS.signalFragmentsClicked)),
  );
  const [isZChamberOpen, setIsZChamberOpen] = useState(false);
  const [zChamberMode, setZChamberMode] = useState("real");
  const [activeZRollResult, setActiveZRollResult] = useState(null);
  const [uberSacrificeStep, setUberSacrificeStep] = useState(1);
  const [activeSacrificeEffect, setActiveSacrificeEffect] = useState(null);
  const [duplicateStreak, setDuplicateStreak] = useState(0);
  const [showGrinderReadyPrompt, setShowGrinderReadyPrompt] = useState(false);
  const [lastGrinderPromptNopeCount, setLastGrinderPromptNopeCount] = useState(() =>
    readStoredNumber(STORAGE_KEYS.lastGrinderPromptNopeCount),
  );
  const [isGrinderPromptPulsing, setIsGrinderPromptPulsing] = useState(false);
  const [forcedStickerBookPopupCount, setForcedStickerBookPopupCount] = useState(() =>
    readStoredNumber(STORAGE_KEYS.forcedStickerBookPopupCount),
  );
  const [activeGoodFindCanSkip, setActiveGoodFindCanSkip] = useState(false);
  const [pendingFirstStickerPopup, setPendingFirstStickerPopup] = useState(false);
  const [showFirstStickerPopup, setShowFirstStickerPopup] = useState(false);
  const [activeBreachOverlay, setActiveBreachOverlay] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExistentialPopup, setShowExistentialPopup] = useState(false);
  const [collectedIds, setCollectedIds] = useState(() =>
    readStoredArray(STORAGE_KEYS.collectedIds),
  );
  const [foundOrderIds, setFoundOrderIds] = useState(() => {
    const storedOrder = readStoredArray(STORAGE_KEYS.foundOrder);
    const storedCollectedIds = readStoredArray(STORAGE_KEYS.collectedIds);

    return [
      ...storedOrder.filter((id) => storedCollectedIds.includes(id)),
      ...storedCollectedIds.filter((id) => !storedOrder.includes(id)),
    ];
  });
  const [sacrificedIds, setSacrificedIds] = useState(() =>
    readStoredArray(STORAGE_KEYS.sacrificedIds),
  );
  const [latestDiscoveryId, setLatestDiscoveryId] = useState(() =>
    readStoredString(STORAGE_KEYS.latestDiscoveryId),
  );
  const [showBootPopup, setShowBootPopup] = useState(() => readStoredString(STORAGE_KEYS.bootPopupSeen) !== "true");
  const [bootPopupText, setBootPopupText] = useState("");
  const [bootPopupPhase, setBootPopupPhase] = useState("typing");
  const [isBooting, setIsBooting] = useState(() => readStoredString(STORAGE_KEYS.bootPopupSeen) !== "true");
  const [isGlitching, setIsGlitching] = useState(false);
  const [isAmbientGlitch, setIsAmbientGlitch] = useState(false);
  const [ambientWarning, setAmbientWarning] = useState(null);
  const [isNopeIdle, setIsNopeIdle] = useState(false);
  const [isStickerBookOpen, setIsStickerBookOpen] = useState(false);
  const [isZSignalExpanded, setIsZSignalExpanded] = useState(false);
  const [currentBadIdeaId, setCurrentBadIdeaId] = useState(() => {
    const storedMissionId = readStoredString(STORAGE_KEYS.currentBadIdea);

    return getCurrentBadIdeaById(storedMissionId)?.id ?? pickNextBadIdeaId();
  });
  const [currentBadIdeaProgress, setCurrentBadIdeaProgress] = useState(() => readStoredNumber(STORAGE_KEYS.currentBadIdeaProgress));
  const [badIdeasCompleted, setBadIdeasCompleted] = useState(() => readStoredNumber(STORAGE_KEYS.badIdeasCompleted));
  const [activeBadIdeaCompletion, setActiveBadIdeaCompletion] = useState(null);
  const [showBadIdeaDetails, setShowBadIdeaDetails] = useState(false);
  const [nopeSurgeCharge, setNopeSurgeCharge] = useState(() => readStoredNumber(STORAGE_KEYS.nopeSurgeCharge));
  const [isNopeSurgeReady, setIsNopeSurgeReady] = useState(() => readStoredString(STORAGE_KEYS.nopeSurgeReady) === "true");
  const [nopeSurgeEndsAt, setNopeSurgeEndsAt] = useState(0);
  const [nopeSurgeRemainingMs, setNopeSurgeRemainingMs] = useState(0);
  const [nopeSurgeActivations, setNopeSurgeActivations] = useState(() => readStoredNumber(STORAGE_KEYS.nopeSurgeActivations));
  const [showNopeSurgePopup, setShowNopeSurgePopup] = useState(false);
  const [nopeSurgeChargeFeedback, setNopeSurgeChargeFeedback] = useState(null);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [stickerTab, setStickerTab] = useState("all");
  const [stickerFilter, setStickerFilter] = useState("all");
  const [copiedShareId, setCopiedShareId] = useState(null);
  const [highlightedStickerId, setHighlightedStickerId] = useState(null);
  const [isStickerBookTearing, setIsStickerBookTearing] = useState(false);
  const [isImportantModalActionReady, setIsImportantModalActionReady] = useState(true);
  const [nextBadgeIndex, setNextBadgeIndex] = useState(0);
  const [buttonText, setButtonText] = useState("NOPE");
  const [globalNopeCount, setGlobalNopeCount] = useState(null);
  const [isGlobalCounterAvailable, setIsGlobalCounterAvailable] = useState(Boolean(supabase));
  const [globalCountPulse, setGlobalCountPulse] = useState(false);
  const glitchTimerRef = useRef(null);
  const discoveryTimerRef = useRef(null);
  const breachTimerRef = useRef(null);
  const achievementDelayTimerRef = useRef(null);
  const shareCopyTimerRef = useRef(null);
  const importantModalActionTimerRef = useRef(null);
  const scoreBurstTimersRef = useRef([]);
  const nopeSurgeChargeFeedbackTimerRef = useRef(null);
  const comboNoticeTimerRef = useRef(null);
  const scoreAnimationFrameRef = useRef(null);
  const scoreSettledTimerRef = useRef(null);
  const scoreRollingStartedAtRef = useRef(null);
  const displayedNopeScoreRef = useRef(displayedNopeScore);
  const scoreHeatRef = useRef(scoreHeat);
  const scoreHudDragOffsetRef = useRef({ x: 0, y: 0 });
  const scoreHudPositionRef = useRef(scoreHudPosition);
  const signalFragmentSpawnTimerRef = useRef(null);
  const signalFragmentRemoveTimersRef = useRef([]);
  const firstStickerHighlightTimerRef = useRef(null);
  const sacrificeEffectTimerRef = useRef(null);
  const stickerBookTearTimerRef = useRef(null);
  const stickerBookScrollGlitchTimerRef = useRef(null);
  const lastStickerBookScrollGlitchRef = useRef(0);
  const isStickerBookAutoScrollingRef = useRef(false);
  const ambientTimerRef = useRef(null);
  const ambientClearTimerRef = useRef(null);
  const nopeIdleTimerRef = useRef(null);
  const stickerBookOverlayRef = useRef(null);
  const stickerBookScrollRef = useRef(null);
  const duplicateGrinderSectionRef = useRef(null);
  const terminalLogRef = useRef(null);
  const lineIdRef = useRef(0);
  const feedSeededRef = useRef(false);
  const bootPopupTimersRef = useRef([]);
  const nopeCountRef = useRef(nopeCount);
  const nopeScoreRef = useRef(nopeScore);
  const scoreComboRef = useRef(scoreCombo);
  const zSignalChargeRef = useRef(zSignalCharge);
  const collectedIdsRef = useRef(collectedIds);
  const foundOrderIdsRef = useRef(foundOrderIds);
  const sacrificedIdsRef = useRef(sacrificedIds);
  const achievementStatsRef = useRef(achievementStats);
  const duplicateMaterialsRef = useRef(duplicateMaterials);
  const duplicateCopiesRef = useRef(duplicateCopies);
  const zRollTokensRef = useRef(zRollTokens);
  const zRollAttemptsRef = useRef(zRollAttempts);
  const zRollFailuresRef = useRef(zRollFailures);
  const znopeAcquiredRef = useRef(znopeAcquired);
  const zTokenClaimedAchievementIdsRef = useRef(zTokenClaimedAchievementIds);
  const zTokenPopupQueueRef = useRef(zTokenPopupQueue);
  const activeZTokenPopupRef = useRef(activeZTokenPopup);
  const showZChamberTeaserPopupRef = useRef(showZChamberTeaserPopup);
  const unlockedAchievementsRef = useRef(unlockedAchievements);
  const achievementQueueRef = useRef(achievementQueue);
  const pendingZChamberTeaserRef = useRef(false);
  const activeAchievementRef = useRef(activeAchievement);
  const activeGoodFindModalRef = useRef(activeGoodFindModal);
  const activeCraftResultRef = useRef(activeCraftResult);
  const showGrinderReadyPromptRef = useRef(showGrinderReadyPrompt);
  const isZChamberOpenRef = useRef(isZChamberOpen);
  const activeZRollResultRef = useRef(activeZRollResult);
  const forcedStickerBookPopupCountRef = useRef(forcedStickerBookPopupCount);
  const bootRunRef = useRef(0);
  const globalNopeCountRef = useRef(globalNopeCount);
  const globalSyncMessageRef = useRef(false);
  const globalFlushInProgressRef = useRef(false);
  const globalFlushIntervalRef = useRef(null);
  const globalPulseTimerRef = useRef(null);
  const grinderPromptPulseTimerRef = useRef(null);
  const pendingGlobalNopesRef = useRef(0);
  const currentBadIdeaIdRef = useRef(currentBadIdeaId);
  const currentBadIdeaProgressRef = useRef(currentBadIdeaProgress);
  const badIdeasCompletedRef = useRef(badIdeasCompleted);
  const activeBadIdeaCompletionRef = useRef(activeBadIdeaCompletion);
  const nopeSurgeChargeRef = useRef(nopeSurgeCharge);
  const isNopeSurgeReadyRef = useRef(isNopeSurgeReady);
  const nopeSurgeEndsAtRef = useRef(nopeSurgeEndsAt);
  const nopeSurgeActivationsRef = useRef(nopeSurgeActivations);
  const signalFragmentContext = isStickerBookOpen ? "stickerbook" : "home";
  const hasSignalBlockingModal = Boolean(
    activeSignalFragment ||
    activeAchievement ||
    activeGoodFindModal ||
    activeCraftResult ||
    activeSacrificeEntity ||
    activeUberSacrificeEntity ||
    activeStickerInspectEntity ||
    activeAchievementInspect ||
    showTelegramLoginModal ||
    showLeaderboardModal ||
    isZChamberOpen ||
    activeZTokenPopup ||
    activeZSignalChargePopup ||
    showZChamberTeaserPopup ||
    activeZRollResult ||
    showGrinderReadyPrompt ||
    showFirstStickerPopup ||
    activeBreachOverlay ||
    showResetConfirm ||
    showExistentialPopup ||
    activeBadIdeaCompletion ||
    showBadIdeaDetails ||
    showNopeSurgePopup
  );
  const shouldPauseSignalFragments = showIntro ||
    isBooting ||
    hasSignalBlockingModal;
  const showFirstPressPrompt = nopeCount === 0 && !showIntro && !showBootPopup && !isBooting && !hasSignalBlockingModal;
  const telegramDiscoveryHapticCooldownRef = useRef(false);
  const telegramDiscoveryHapticTimerRef = useRef(null);
  const telegramSignalLineRef = useRef(false);
  const telegramWidgetContainerRef = useRef(null);
  const isTelegramMiniApp = Boolean(telegramWebApp?.initData && telegramWebApp?.initDataUnsafe?.user);
  const telegramUser = telegramWebApp?.initDataUnsafe?.user ?? null;
  const telegramUsername = telegramPlayer?.username ?? "";
  const isTelegramConnected = Boolean(telegramUsername);

  const persistTelegramPlayer = useCallback((player) => {
    const nextTelegramPlayer = normalizeVerifiedTelegramPlayer(player);

    if (!nextTelegramPlayer) {
      return false;
    }

    setTelegramPlayer(nextTelegramPlayer);

    try {
      window.localStorage.setItem(STORAGE_KEYS.telegramPlayer, JSON.stringify(nextTelegramPlayer));
    } catch {
      // Local identity is a convenience layer only; gameplay stays anonymous if storage fails.
    }

    return true;
  }, []);

  const openTelegramMissingUsernameMessage = useCallback(() => {
    setIsTelegramLoginVerifying(false);
    setTelegramLoginModalMode("missing-username");
    setShowTelegramLoginModal(true);
  }, []);

  const openTelegramFailureMessage = useCallback(() => {
    setIsTelegramLoginVerifying(false);
    setTelegramLoginModalMode("failure");
    setShowTelegramLoginModal(true);
  }, []);

  const verifyTelegramWebLogin = useCallback(async (telegramLoginPayload) => {
    setIsTelegramLoginVerifying(true);

    try {
      const response = await fetch(TELEGRAM_AUTH_VERIFY_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(telegramLoginPayload),
      });
      const verifiedPlayer = await response.json().catch(() => null);

      if (verifiedPlayer?.error === "missing_username") {
        openTelegramMissingUsernameMessage();
        return;
      }

      if (!response.ok) {
        openTelegramFailureMessage();
        return;
      }

      if (!persistTelegramPlayer(verifiedPlayer)) {
        openTelegramMissingUsernameMessage();
        return;
      }

      setIsTelegramLoginVerifying(false);
      setShowTelegramLoginModal(false);
    } catch {
      openTelegramFailureMessage();
    }
  }, [openTelegramFailureMessage, openTelegramMissingUsernameMessage, persistTelegramPlayer]);

  const formattedCount = useMemo(
    () => nopeCount.toString().padStart(6, "0"),
    [nopeCount],
  );
  const formattedNopeScore = useMemo(
    () => displayedNopeScore.toString().padStart(9, "0"),
    [displayedNopeScore],
  );
  const activeBadIdea = useMemo(
    () => getCurrentBadIdeaById(currentBadIdeaId),
    [currentBadIdeaId],
  );
  const currentBadIdeaDisplayProgress = Math.min(currentBadIdeaProgress, activeBadIdea?.target ?? 0);
  const isNopeSurgeActive = nopeSurgeRemainingMs > 0;
  const nopeSurgeSecondsLeft = Math.ceil(nopeSurgeRemainingMs / 1000);
  const formattedNopeSurgeTime = `${String(Math.floor(nopeSurgeSecondsLeft / 60)).padStart(2, "0")}:${String(nopeSurgeSecondsLeft % 60).padStart(2, "0")}`;
  const nopeSurgeChargePercent = isNopeSurgeReady ? 100 : Math.min(100, Math.floor((nopeSurgeCharge / NOPE_SURGE_CHARGE_TARGET) * 100));
  const zSignalChargePercent = Math.min(100, Math.floor((zSignalCharge / Z_SIGNAL_CHARGE_TARGET) * 100));
  const formattedGlobalCount = useMemo(() => {
    if (!isGlobalCounterAvailable || globalNopeCount === null) {
      return "offline";
    }

    return globalNopeCount.toString().padStart(9, "0");
  }, [globalNopeCount, isGlobalCounterAvailable]);
  const latestDiscovery = useMemo(
    () => allNopeEntities.find((entity) => entity.id === latestDiscoveryId),
    [latestDiscoveryId],
  );
  const normalCollectedCount = useMemo(
    () => collectedIds.filter((id) => standardNopeEntities.some((entity) => entity.id === id)).length,
    [collectedIds],
  );
  const gifCollectedCount = useMemo(
    () => collectedIds.filter((id) => forbiddenNopeGifs.some((entity) => entity.id === id)).length,
    [collectedIds],
  );
  const mythicCollectedCount = useMemo(
    () => collectedIds.filter((id) => mythicNopeRelics.some((entity) => entity.id === id)).length,
    [collectedIds],
  );
  const uberCollectedCount = useMemo(
    () => collectedIds.filter((id) => uberNopeRelics.some((entity) => entity.id === id)).length,
    [collectedIds],
  );
  const unlockedAchievementCount = unlockedAchievements.length;
  const nopedexComplete =
    normalCollectedCount + gifCollectedCount + mythicCollectedCount >= NORMAL_TOTAL + GIF_TOTAL + MYTHIC_TOTAL;
  const nopedexAscended = nopedexComplete && uberCollectedCount >= UBER_TOTAL;
  const shareEntity = useMemo(() => {
    if (typeof window === "undefined" || !window.location.pathname.startsWith("/share/")) {
      return null;
    }

    if (window.location.pathname.startsWith("/share/achievement/")) {
      return null;
    }

    const id = decodeURIComponent(window.location.pathname.replace("/share/", "").split("/")[0]);
    return getNopeEntityById(id) ?? false;
  }, []);
  const firstStickerEntity = useMemo(() => getNopeEntityById("poornope"), []);
  const achievementSnapshot = useMemo(
    () => ({
      ...achievementStats,
      ...getCollectionCounts(collectedIds),
      collectedIds,
      nopeCount,
      zNopeAcquired: znopeAcquired ? 1 : 0,
      zRollAttempts,
      zRollFailures,
    }),
    [achievementStats, collectedIds, nopeCount, zRollAttempts, zRollFailures, znopeAcquired],
  );
  const nextBadges = useMemo(() => {
    const unlockedSet = new Set(unlockedAchievements);

    return achievements
      .filter((achievement) => !unlockedSet.has(achievement.id))
      .map((achievement) => ({
        achievement,
        progress: getAchievementProgress(achievement, achievementSnapshot),
      }))
      .filter(({ progress }) => progress && progress.current > 0 && progress.current < progress.target)
      .sort((left, right) => right.progress.current / right.progress.target - left.progress.current / left.progress.target)
      .slice(0, 3);
  }, [achievementSnapshot, unlockedAchievements]);
  const activeNextBadge = nextBadges[nextBadgeIndex % Math.max(nextBadges.length, 1)] ?? null;
  const isGrinderReady = DUPLICATE_GRINDER_RECIPES.some(
    (recipe) => (duplicateMaterials[recipe.source] ?? 0) >= recipe.cost,
  );
  const isGrinderReadyPromptBlocked = Boolean(
    activeAchievement ||
    activeGoodFindModal ||
    activeCraftResult ||
    activeSacrificeEntity ||
    activeUberSacrificeEntity ||
    activeDiscoveryPopup ||
    activeBreachOverlay ||
    showFirstStickerPopup ||
    pendingFirstStickerPopup ||
    showResetConfirm ||
    showExistentialPopup ||
    activeSacrificeEffect ||
    activeStickerInspectEntity ||
    activeAchievementInspect ||
    isZChamberOpen ||
    activeZRollResult ||
    activeZTokenPopup ||
    activeZSignalChargePopup ||
    showZChamberTeaserPopup ||
    activeBadIdeaCompletion ||
    showBadIdeaDetails ||
    showNopeSurgePopup ||
    achievementQueue.length > 0,
  );
  const isInspectModalBlocked = Boolean(
    activeAchievement ||
    activeGoodFindModal ||
    activeCraftResult ||
    activeSacrificeEntity ||
    activeUberSacrificeEntity ||
    showFirstStickerPopup ||
    pendingFirstStickerPopup ||
    showResetConfirm ||
    showGrinderReadyPrompt ||
    isZChamberOpen ||
    activeZRollResult ||
    activeZTokenPopup ||
    activeZSignalChargePopup ||
    showZChamberTeaserPopup ||
    activeBadIdeaCompletion ||
    showBadIdeaDetails ||
    showNopeSurgePopup,
  );
  const stickerBookNavItems = [
    ["all", "ALL TRASH", "ALL"],
    ["normal", "WORTHLESS NOPES", "NOPES"],
    ["gif", "FORBIDDEN LOOPS", "LOOPS"],
    ["grinder", isGrinderReady ? "DUPLICATE GRINDER // READY" : "DUPLICATE GRINDER", "GRINDER"],
    ["achievements", "ACHIEVEMENTS", "BADGES"],
  ];

  function createLine(speaker, text = "", isTypingLine = false, important = false) {
    const id = lineIdRef.current;
    lineIdRef.current += 1;

    return {
      id,
      speaker,
      text,
      isTyping: isTypingLine,
      important,
    };
  }

  function addLine(line) {
    setLines((currentLines) => [...currentLines, line].slice(-80));
  }

  function clearBootPopupTimers() {
    bootPopupTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    bootPopupTimersRef.current = [];
  }

  useEffect(() => {
    if (!telegramWebApp) {
      return;
    }

    try {
      telegramWebApp.ready?.();
      telegramWebApp.expand?.();
      telegramWebApp.setHeaderColor?.("#061b10");
      telegramWebApp.setBackgroundColor?.("#001008");
    } catch {
      // Telegram WebView capabilities vary by client version.
    }
  }, [telegramWebApp]);

  useEffect(() => {
    if (!telegramWebApp || telegramSignalLineRef.current) {
      return;
    }

    telegramSignalLineRef.current = true;
    addLine(createLine(
      "nope",
      "Telegram signal detected. suspicious.",
    ));
  }, [telegramWebApp]);

  useEffect(() => {
    if (!showTelegramLoginModal || telegramLoginModalMode !== "browser" || isTelegramMiniApp || isTelegramConnected) {
      return undefined;
    }

    const widgetContainer = telegramWidgetContainerRef.current;

    if (!widgetContainer || typeof window === "undefined") {
      return undefined;
    }

    widgetContainer.textContent = "";
    window[TELEGRAM_LOGIN_CALLBACK_NAME] = verifyTelegramWebLogin;

    const widgetScript = document.createElement("script");
    widgetScript.async = true;
    widgetScript.src = TELEGRAM_LOGIN_WIDGET_SRC;
    widgetScript.setAttribute("data-telegram-login", TELEGRAM_LOGIN_BOT_USERNAME);
    widgetScript.setAttribute("data-size", "large");
    widgetScript.setAttribute("data-userpic", "false");
    widgetScript.setAttribute("data-onauth", `${TELEGRAM_LOGIN_CALLBACK_NAME}(user)`);
    widgetScript.onerror = openTelegramFailureMessage;

    widgetContainer.appendChild(widgetScript);

    return () => {
      widgetContainer.textContent = "";
      delete window[TELEGRAM_LOGIN_CALLBACK_NAME];
    };
  }, [
    isTelegramConnected,
    isTelegramMiniApp,
    openTelegramFailureMessage,
    showTelegramLoginModal,
    telegramLoginModalMode,
    verifyTelegramWebLogin,
  ]);

  useEffect(() => {
    const terminalLog = terminalLogRef.current;

    if (terminalLog) {
      terminalLog.scrollTop = terminalLog.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    return () => {
      window.clearTimeout(glitchTimerRef.current);
      window.clearTimeout(discoveryTimerRef.current);
      window.clearTimeout(breachTimerRef.current);
      window.clearTimeout(achievementDelayTimerRef.current);
      window.clearTimeout(shareCopyTimerRef.current);
      window.clearTimeout(importantModalActionTimerRef.current);
      window.clearTimeout(firstStickerHighlightTimerRef.current);
      window.clearTimeout(sacrificeEffectTimerRef.current);
      window.clearTimeout(stickerBookTearTimerRef.current);
      window.clearTimeout(stickerBookScrollGlitchTimerRef.current);
      isStickerBookAutoScrollingRef.current = false;
      window.clearTimeout(ambientTimerRef.current);
      window.clearTimeout(ambientClearTimerRef.current);
      window.clearTimeout(nopeIdleTimerRef.current);
      window.clearTimeout(globalPulseTimerRef.current);
      window.clearTimeout(grinderPromptPulseTimerRef.current);
      window.clearTimeout(telegramDiscoveryHapticTimerRef.current);
      window.clearInterval(globalFlushIntervalRef.current);
      clearBootPopupTimers();
    };
  }, []);

  const pulseGlobalCount = useCallback(() => {
    window.clearTimeout(globalPulseTimerRef.current);
    setGlobalCountPulse(false);
    window.requestAnimationFrame(() => {
      setGlobalCountPulse(true);
      globalPulseTimerRef.current = window.setTimeout(() => {
        setGlobalCountPulse(false);
      }, 760);
    });
  }, []);

  const flushGlobalNopes = useCallback(async () => {
    if (!supabase || globalFlushInProgressRef.current || pendingGlobalNopesRef.current <= 0) {
      return;
    }

    const amountToAdd = pendingGlobalNopesRef.current;
    globalFlushInProgressRef.current = true;

    const { data, error } = await supabase.rpc("increment_global_nopes", {
      amount_to_add: amountToAdd,
    });

    globalFlushInProgressRef.current = false;

    if (error) {
      setIsGlobalCounterAvailable(false);
      return;
    }

    pendingGlobalNopesRef.current = Math.max(0, pendingGlobalNopesRef.current - amountToAdd);
    const nextGlobalCount = Number(data);

    if (Number.isFinite(nextGlobalCount)) {
      const optimisticGlobalCount = nextGlobalCount + pendingGlobalNopesRef.current;
      globalNopeCountRef.current = optimisticGlobalCount;
      setGlobalNopeCount(optimisticGlobalCount);
      setIsGlobalCounterAvailable(true);
      pulseGlobalCount();
    }
  }, [pulseGlobalCount]);

  useEffect(() => {
    let isCancelled = false;

    async function loadGlobalNopes() {
      function addGlobalStatusLine(text) {
        const id = lineIdRef.current;
        lineIdRef.current += 1;
        setLines((currentLines) => [
          ...currentLines,
          { id, important: false, isTyping: false, speaker: "nope", text },
        ].slice(-80));
      }

      if (!supabase) {
        setIsGlobalCounterAvailable(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_global_nopes");

      if (isCancelled) {
        return;
      }

      if (error) {
        setIsGlobalCounterAvailable(false);

        if (!globalSyncMessageRef.current) {
          globalSyncMessageRef.current = true;
          addGlobalStatusLine("global NOPEs temporarily unavailable. humanity paused?");
        }

        return;
      }

      const nextGlobalCount = Number(data);

      if (Number.isFinite(nextGlobalCount)) {
        globalNopeCountRef.current = nextGlobalCount;
        setGlobalNopeCount(nextGlobalCount);
        setIsGlobalCounterAvailable(true);
        pulseGlobalCount();
      }

      if (!globalSyncMessageRef.current) {
        globalSyncMessageRef.current = true;
        addGlobalStatusLine("global NOPEs synced. humanity remains busy.");
      }
    }

    loadGlobalNopes();
    globalFlushIntervalRef.current = window.setInterval(() => {
      flushGlobalNopes();
    }, 30000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushGlobalNopes();
      }
    }

    function handleBeforeUnload() {
      flushGlobalNopes();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isCancelled = true;
      window.clearInterval(globalFlushIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [flushGlobalNopes, pulseGlobalCount]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.nopeCount, String(nopeCount));
    nopeCountRef.current = nopeCount;
  }, [nopeCount]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.nopeScore, String(nopeScore));
    nopeScoreRef.current = nopeScore;
  }, [nopeScore]);

  useEffect(() => {
    if (displayedNopeScoreRef.current >= nopeScore) {
      displayedNopeScoreRef.current = nopeScore;
      return undefined;
    }

    const startValue = displayedNopeScoreRef.current;
    const targetValue = nopeScore;
    const scoreGap = targetValue - startValue;
    const duration = getScoreRollDuration(scoreGap);
    const animationStartedAt = performance.now();

    if (!scoreRollingStartedAtRef.current) {
      scoreRollingStartedAtRef.current = animationStartedAt;
    }

    window.cancelAnimationFrame(scoreAnimationFrameRef.current);

    function unlockRollingAchievement(elapsedMs) {
      const currentStats = achievementStatsRef.current;
      const updates = {};

      if (elapsedMs >= 5000 && !currentStats.scoreRollingFiveSecondCount) {
        updates.scoreRollingFiveSecondCount = 1;
      }

      if (elapsedMs >= 10000 && !currentStats.scoreRollingTenSecondCount) {
        updates.scoreRollingTenSecondCount = 1;
      }

      if (Object.keys(updates).length > 0) {
        const nextStats = updateAchievementStats(updates);
        queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }), 0, { skipCombo: true });
      }
    }

    function animateScore(now) {
      const progress = Math.min((now - animationStartedAt) / duration, 1);
      const eased = easeOutCubic(progress);
      const nextDisplayedScore = Math.min(targetValue, Math.floor(startValue + scoreGap * eased));

      displayedNopeScoreRef.current = nextDisplayedScore;
      setDisplayedNopeScore(nextDisplayedScore);
      unlockRollingAchievement(now - scoreRollingStartedAtRef.current);

      if (progress < 1) {
        scoreAnimationFrameRef.current = window.requestAnimationFrame(animateScore);
        return;
      }

      displayedNopeScoreRef.current = targetValue;
      setDisplayedNopeScore(targetValue);
      scoreRollingStartedAtRef.current = null;
      setIsScoreSettled(true);
      window.clearTimeout(scoreSettledTimerRef.current);
      scoreSettledTimerRef.current = window.setTimeout(() => {
        setIsScoreSettled(false);
      }, 650);
    }

    scoreAnimationFrameRef.current = window.requestAnimationFrame(animateScore);

    return () => {
      window.cancelAnimationFrame(scoreAnimationFrameRef.current);
    };
  // The score roller intentionally reads latest refs while animating toward the score target.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nopeScore]);

  useEffect(() => () => {
    scoreBurstTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    scoreBurstTimersRef.current = [];
    window.clearTimeout(comboNoticeTimerRef.current);
    window.clearTimeout(nopeSurgeChargeFeedbackTimerRef.current);
    window.clearTimeout(scoreSettledTimerRef.current);
    window.cancelAnimationFrame(scoreAnimationFrameRef.current);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.scoreCombo, JSON.stringify(scoreCombo));
    scoreComboRef.current = scoreCombo;
  }, [scoreCombo]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.currentBadIdea, currentBadIdeaId);
    currentBadIdeaIdRef.current = currentBadIdeaId;
  }, [currentBadIdeaId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.currentBadIdeaProgress, String(currentBadIdeaProgress));
    currentBadIdeaProgressRef.current = currentBadIdeaProgress;
  }, [currentBadIdeaProgress]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.badIdeasCompleted, String(badIdeasCompleted));
    badIdeasCompletedRef.current = badIdeasCompleted;
  }, [badIdeasCompleted]);

  useEffect(() => {
    activeBadIdeaCompletionRef.current = activeBadIdeaCompletion;
  }, [activeBadIdeaCompletion]);

  useEffect(() => {
    const normalizedCharge = Math.min(NOPE_SURGE_CHARGE_TARGET, Math.max(0, nopeSurgeCharge));
    window.localStorage.setItem(STORAGE_KEYS.nopeSurgeCharge, String(normalizedCharge));
    nopeSurgeChargeRef.current = normalizedCharge;
  }, [nopeSurgeCharge]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.nopeSurgeReady, String(isNopeSurgeReady));
    isNopeSurgeReadyRef.current = isNopeSurgeReady;
  }, [isNopeSurgeReady]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.nopeSurgeActivations, String(nopeSurgeActivations));
    nopeSurgeActivationsRef.current = nopeSurgeActivations;
  }, [nopeSurgeActivations]);

  useEffect(() => {
    nopeSurgeEndsAtRef.current = nopeSurgeEndsAt;
    window.localStorage.setItem(STORAGE_KEYS.nopeSurgeActive, String(nopeSurgeEndsAt > Date.now()));

    if (nopeSurgeEndsAt <= Date.now()) {
      return undefined;
    }

    function updateNopeSurgeRemaining() {
      const nextRemaining = Math.max(0, nopeSurgeEndsAt - Date.now());
      setNopeSurgeRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        nopeSurgeEndsAtRef.current = 0;
        setNopeSurgeEndsAt(0);
        window.localStorage.setItem(STORAGE_KEYS.nopeSurgeActive, "false");
        addInstantNopeLine("surge expired. normal disappointment resumed.");
        addInstantNopeLine("NOPE SURGE EXPIRED. green disappointment restored.");
      }
    }

    updateNopeSurgeRemaining();
    const surgeTimer = window.setInterval(updateNopeSurgeRemaining, 500);

    return () => window.clearInterval(surgeTimer);
  // Surge expiry only needs the active deadline; terminal helpers read latest state safely here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nopeSurgeEndsAt]);

  useEffect(() => {
    scoreHeatRef.current = scoreHeat;
  }, [scoreHeat]);

  useEffect(() => {
    scoreHudPositionRef.current = scoreHudPosition;
  }, [scoreHudPosition]);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_SCORE_HUD_POSITION_KEY);

    if (!canDragScoreHud()) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (!canDragScoreHud()) {
        return;
      }

      const nextPosition = clampScoreHudPosition(getDefaultScoreHudPosition());
      scoreHudPositionRef.current = nextPosition;
      setScoreHudPosition(nextPosition);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    function handleScoreHudResize() {
      if (canDragScoreHud()) {
        const nextPosition = clampScoreHudPosition(getDefaultScoreHudPosition());
        scoreHudPositionRef.current = nextPosition;
        setScoreHudPosition(nextPosition);
        return;
      }

      setScoreHudPosition((currentPosition) => clampScoreHudPosition(currentPosition));
    }

    window.addEventListener("resize", handleScoreHudResize);

    return () => {
      window.removeEventListener("resize", handleScoreHudResize);
    };
  }, []);

  useEffect(() => {
    const heatDecayTimer = window.setInterval(() => {
      setScoreHeat((currentHeat) => {
        const nextHeat = Math.max(0, currentHeat - 1);
        scoreHeatRef.current = nextHeat;

        return nextHeat;
      });
    }, 2600);

    return () => {
      window.clearInterval(heatDecayTimer);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.zSignalCharge, String(zSignalCharge));
    zSignalChargeRef.current = zSignalCharge;
  }, [zSignalCharge]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.collectedIds, JSON.stringify(collectedIds));
    collectedIdsRef.current = collectedIds;
  }, [collectedIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.foundOrder, JSON.stringify(foundOrderIds));
    foundOrderIdsRef.current = foundOrderIds;
  }, [foundOrderIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.sacrificedIds, JSON.stringify(sacrificedIds));
    sacrificedIdsRef.current = sacrificedIds;
  }, [sacrificedIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.achievementStats, JSON.stringify(achievementStats));
    achievementStatsRef.current = achievementStats;
  }, [achievementStats]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.duplicateMaterials, JSON.stringify(duplicateMaterials));
    duplicateMaterialsRef.current = duplicateMaterials;
  }, [duplicateMaterials]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.duplicateCopies, JSON.stringify(duplicateCopies));
    duplicateCopiesRef.current = duplicateCopies;
  }, [duplicateCopies]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.zRollTokens, String(zRollTokens));
    zRollTokensRef.current = zRollTokens;
  }, [zRollTokens]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.zRollAttempts, String(zRollAttempts));
    zRollAttemptsRef.current = zRollAttempts;
  }, [zRollAttempts]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.zRollFailures, String(zRollFailures));
    zRollFailuresRef.current = zRollFailures;
  }, [zRollFailures]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.zNopeAcquired, String(znopeAcquired));
    znopeAcquiredRef.current = znopeAcquired;
  }, [znopeAcquired]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.zTokenClaimedAchievementIds, JSON.stringify(zTokenClaimedAchievementIds));
    zTokenClaimedAchievementIdsRef.current = zTokenClaimedAchievementIds;
  }, [zTokenClaimedAchievementIds]);

  useEffect(() => {
    zTokenPopupQueueRef.current = zTokenPopupQueue;
  }, [zTokenPopupQueue]);

  useEffect(() => {
    activeZTokenPopupRef.current = activeZTokenPopup;
  }, [activeZTokenPopup]);

  useEffect(() => {
    showZChamberTeaserPopupRef.current = showZChamberTeaserPopup;
  }, [showZChamberTeaserPopup]);

  useEffect(() => {
    isZChamberOpenRef.current = isZChamberOpen;
  }, [isZChamberOpen]);

  useEffect(() => {
    activeZRollResultRef.current = activeZRollResult;
  }, [activeZRollResult]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.lastGrinderPromptNopeCount, String(lastGrinderPromptNopeCount));
  }, [lastGrinderPromptNopeCount]);

  useEffect(() => {
    showGrinderReadyPromptRef.current = showGrinderReadyPrompt;
  }, [showGrinderReadyPrompt]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.forcedStickerBookPopupCount, String(forcedStickerBookPopupCount));
    forcedStickerBookPopupCountRef.current = forcedStickerBookPopupCount;
  }, [forcedStickerBookPopupCount]);

  useEffect(() => {
    window.clearTimeout(signalFragmentSpawnTimerRef.current);
    signalFragmentRemoveTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    signalFragmentRemoveTimersRef.current = [];
    const contextClearTimer = window.setTimeout(() => {
      setVisibleSignalFragments([]);
    }, 0);

    if (shouldPauseSignalFragments) {
      return () => {
        window.clearTimeout(contextClearTimer);
      };
    }

    function removeFragment(fragmentId) {
      setVisibleSignalFragments((currentFragments) =>
        currentFragments.map((fragment) =>
          fragment.instanceId === fragmentId ? { ...fragment, isLeaving: true } : fragment,
        ),
      );

      const cleanupTimer = window.setTimeout(() => {
        setVisibleSignalFragments((currentFragments) =>
          currentFragments.filter((fragment) => fragment.instanceId !== fragmentId),
        );
      }, randomBetween(500, 1000));
      signalFragmentRemoveTimersRef.current.push(cleanupTimer);
    }

    function spawnFragments() {
      const isCompactSignalLayout = window.innerWidth <= 700;
      const contextConfig = SIGNAL_FRAGMENT_CONTEXTS[signalFragmentContext] ?? SIGNAL_FRAGMENT_CONTEXTS.home;
      const maxFragments = isCompactSignalLayout ? contextConfig.mobileMax : contextConfig.desktopMax;
      const safeZones = isCompactSignalLayout ? contextConfig.mobileSafeZones : contextConfig.desktopSafeZones;
      const spawnCount = contextConfig.spawnCount(isCompactSignalLayout);

      setVisibleSignalFragments((currentFragments) => {
        const availableSlots = Math.max(0, maxFragments - currentFragments.length);
        const nextSpawnCount = Math.min(spawnCount, availableSlots);

        if (nextSpawnCount <= 0) {
          return currentFragments;
        }

        const newFragments = Array.from({ length: nextSpawnCount }, () => {
          const source = pickRandom(BACKGROUND_SIGNAL_FRAGMENTS);
          const signalType = pickWeightedSignalType();
          const typeSnippets = SIGNAL_FRAGMENT_TYPE_SNIPPETS[signalType] ?? BACKGROUND_SIGNAL_SNIPPETS;
          const zone = pickRandom(safeZones);
          const instanceId = `${source.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

          const fragment = {
            ...source,
            instanceId,
            context: signalFragmentContext,
            isLeaving: false,
            signalType,
            left: randomBetween(zone.x[0], zone.x[1]),
            top: randomBetween(zone.y[0], zone.y[1]),
            displayText: randomChance(0.78) ? pickRandom(typeSnippets) : source.text.split(" ").slice(0, randomBetween(1, 2)).join(" "),
            duration: signalType === "danger" ? randomBetween(1800, 4200) : signalType === "z" ? randomBetween(2600, 5600) : randomBetween(2200, 5200),
          };

          const removeTimer = window.setTimeout(() => removeFragment(instanceId), fragment.duration);
          signalFragmentRemoveTimersRef.current.push(removeTimer);

          return fragment;
        });

        return [...currentFragments, ...newFragments];
      });

      signalFragmentSpawnTimerRef.current = window.setTimeout(spawnFragments, randomBetween(5500, 12000));
    }

    signalFragmentSpawnTimerRef.current = window.setTimeout(spawnFragments, randomBetween(3500, 8500));

    return () => {
      window.clearTimeout(contextClearTimer);
      window.clearTimeout(signalFragmentSpawnTimerRef.current);
      signalFragmentRemoveTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      signalFragmentRemoveTimersRef.current = [];
    };
  }, [shouldPauseSignalFragments, signalFragmentContext, stickerTab]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.unlockedAchievements, JSON.stringify(unlockedAchievements));
    unlockedAchievementsRef.current = unlockedAchievements;
  }, [unlockedAchievements]);

  useEffect(() => {
    if (latestDiscoveryId) {
      window.localStorage.setItem(STORAGE_KEYS.latestDiscoveryId, latestDiscoveryId);
    }
  }, [latestDiscoveryId]);

  const closeInspectModals = useCallback(() => {
    setActiveStickerInspectEntity(null);
    setActiveAchievementInspect(null);
    window.clearTimeout(achievementDelayTimerRef.current);
    achievementDelayTimerRef.current = window.setTimeout(() => {
      if (
        activeCraftResultRef.current ||
        activeGoodFindModalRef.current ||
        activeAchievementRef.current ||
        showGrinderReadyPromptRef.current ||
        achievementQueueRef.current.length === 0
      ) {
        return;
      }

      const [nextAchievement, ...remainingAchievements] = achievementQueueRef.current;
      achievementQueueRef.current = remainingAchievements;
      setAchievementQueue(remainingAchievements);
      activeAchievementRef.current = nextAchievement;
      window.clearTimeout(importantModalActionTimerRef.current);
      setIsImportantModalActionReady(false);
      importantModalActionTimerRef.current = window.setTimeout(() => {
        setIsImportantModalActionReady(true);
      }, IMPORTANT_MODAL_ACTION_DELAY);
      setActiveAchievement(nextAchievement);
    }, 450);
  }, []);

  useEffect(() => {
    if (
      duplicateStreak < 3 ||
      !isGrinderReady ||
      showGrinderReadyPrompt ||
      isGrinderReadyPromptBlocked ||
      nopeCount - lastGrinderPromptNopeCount < GRINDER_PROMPT_NOPE_COOLDOWN
    ) {
      return;
    }

    const promptTimer = window.setTimeout(() => {
      setLastGrinderPromptNopeCount(nopeCount);
      showGrinderReadyPromptRef.current = true;
      setShowGrinderReadyPrompt(true);
    }, 0);

    return () => window.clearTimeout(promptTimer);
  }, [
    duplicateStreak,
    isGrinderReady,
    isGrinderReadyPromptBlocked,
    lastGrinderPromptNopeCount,
    nopeCount,
    showGrinderReadyPrompt,
  ]);

  useEffect(() => {
    if (!isStickerBookOpen || !highlightedStickerId) {
      return undefined;
    }

    const scrollTimer = window.setTimeout(() => {
      document
        .querySelector(`[data-sticker-id="${highlightedStickerId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(scrollTimer);
  }, [highlightedStickerId, isStickerBookOpen]);

  useEffect(() => {
    if (!activeStickerInspectEntity && !activeAchievementInspect) {
      return undefined;
    }

    function handleInspectEscape(event) {
      if (event.key === "Escape") {
        closeInspectModals();
      }
    }

    window.addEventListener("keydown", handleInspectEscape);

    return () => window.removeEventListener("keydown", handleInspectEscape);
  }, [activeAchievementInspect, activeStickerInspectEntity, closeInspectModals]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setNextBadgeIndex(0);
    }, 0);

    if (nextBadges.length <= 1) {
      return () => window.clearTimeout(resetTimer);
    }

    const nextBadgeTimer = window.setInterval(() => {
      setNextBadgeIndex((currentIndex) => (currentIndex + 1) % nextBadges.length);
    }, 5200);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(nextBadgeTimer);
    };
  }, [nextBadges.length]);

  useEffect(() => {
    if (!pendingFirstStickerPopup || activeAchievement || activeStickerInspectEntity || activeAchievementInspect || activeZTokenPopup || activeZSignalChargePopup || showZChamberTeaserPopup || isZChamberOpen || activeZRollResult || showGrinderReadyPrompt || activeBadIdeaCompletion || showBadIdeaDetails || showNopeSurgePopup || achievementQueue.length > 0) {
      return undefined;
    }

    const popupTimer = window.setTimeout(() => {
      setPendingFirstStickerPopup(false);
      armImportantModalActionDelay();
      setShowFirstStickerPopup(true);
    }, 0);

    return () => window.clearTimeout(popupTimer);
  }, [activeAchievement, activeAchievementInspect, activeBadIdeaCompletion, activeStickerInspectEntity, activeZRollResult, activeZSignalChargePopup, activeZTokenPopup, achievementQueue.length, isZChamberOpen, pendingFirstStickerPopup, showBadIdeaDetails, showGrinderReadyPrompt, showNopeSurgePopup, showZChamberTeaserPopup]);

  useEffect(() => {
    if (showIntro || feedSeededRef.current) {
      return;
    }

    feedSeededRef.current = true;
    setLines(INITIAL_FEED_LINES.map((text) => createLine("nope", text)));
  }, [showIntro, showBootPopup]);

  useEffect(() => {
    if (showIntro || !showBootPopup) {
      return undefined;
    }

    let isCancelled = false;
    const runId = bootRunRef.current + 1;
    bootRunRef.current = runId;
    clearBootPopupTimers();

    function sleepBoot(ms) {
      return new Promise((resolve) => {
        const timer = window.setTimeout(() => {
          bootPopupTimersRef.current = bootPopupTimersRef.current.filter((currentTimer) => currentTimer !== timer);
          resolve();
        }, ms);

        bootPopupTimersRef.current.push(timer);
      });
    }

    async function typeBootNotice() {
      await sleepBoot(220);

      for (let lineIndex = 0; lineIndex < BOOT_POPUP_LINES.length; lineIndex += 1) {
        const bootLine = BOOT_POPUP_LINES[lineIndex];
        const lineTiming = BOOT_POPUP_LINE_TIMING[bootLine] ?? {};
        const typeDelay = lineTiming.typeDelay ?? BOOT_POPUP_DEFAULT_TIMING.typeDelay;
        const holdDelay = Array.isArray(lineTiming.hold)
          ? randomBetween(lineTiming.hold[0], lineTiming.hold[1])
          : lineTiming.hold ?? randomBetween(BOOT_POPUP_DEFAULT_TIMING.hold[0], BOOT_POPUP_DEFAULT_TIMING.hold[1]);

        if (isCancelled || bootRunRef.current !== runId) {
          return;
        }

        setBootPopupPhase("typing");
        setBootPopupText("");

        for (let charIndex = 1; charIndex <= bootLine.length; charIndex += 1) {
          await sleepBoot(randomBetween(typeDelay[0], typeDelay[1]));

          if (isCancelled || bootRunRef.current !== runId) {
            return;
          }

          setBootPopupText(bootLine.slice(0, charIndex));
        }

        setBootPopupPhase("holding");
        await sleepBoot(holdDelay);

        if (isCancelled || bootRunRef.current !== runId) {
          return;
        }

        if (lineIndex === BOOT_POPUP_LINES.length - 1) {
          setBootPopupPhase("done");
          return;
        }

        setBootPopupPhase("exiting");
        await sleepBoot(randomBetween(BOOT_POPUP_DEFAULT_TIMING.exit[0], BOOT_POPUP_DEFAULT_TIMING.exit[1]));
      }
    }

    typeBootNotice();

    return () => {
      isCancelled = true;
      clearBootPopupTimers();
    };
  }, [showIntro, showBootPopup]);

  useEffect(() => {
    if (showIntro || isBooting) {
      return undefined;
    }

    let isCancelled = false;

    function scheduleAmbientGlitch() {
      ambientTimerRef.current = window.setTimeout(() => {
        if (isCancelled) {
          return;
        }

        const shouldShowWarning = randomChance(0.62);
        const nextWarning = pickRandom(glitchWarnings);
        setAmbientWarning(shouldShowWarning ? nextWarning : null);
        setIsAmbientGlitch(true);

        ambientClearTimerRef.current = window.setTimeout(() => {
          setIsAmbientGlitch(false);
          setAmbientWarning(null);

          if (!isCancelled) {
            scheduleAmbientGlitch();
          }
        }, randomBetween(150, 350));
      }, randomBetween(8000, 18000));
    }

    scheduleAmbientGlitch();

    return () => {
      isCancelled = true;
      window.clearTimeout(ambientTimerRef.current);
      window.clearTimeout(ambientClearTimerRef.current);
      setIsAmbientGlitch(false);
      setAmbientWarning(null);
    };
  }, [showIntro, isBooting]);

  useEffect(() => {
    if (showIntro || isBooting) {
      return undefined;
    }

    window.clearTimeout(nopeIdleTimerRef.current);
    nopeIdleTimerRef.current = window.setTimeout(() => {
      setIsNopeIdle(true);
    }, randomBetween(6000, 8000));

    return () => {
      window.clearTimeout(nopeIdleTimerRef.current);
    };
  }, [showIntro, isBooting]);

  function replayIntro(event) {
    event?.preventDefault();
    setIntroChoice(null);
    setIsIntroExiting(false);
    setIsNopeIdle(false);
    window.clearTimeout(nopeIdleTimerRef.current);
    setShowIntro(true);
  }

  async function enterNopeOs(choice) {
    if (introChoice) {
      return;
    }

    setIntroChoice(choice);
    await sleep(1600);
    setIsIntroExiting(true);
    await sleep(420);
    window.localStorage.setItem(STORAGE_KEYS.introSeen, "true");
    setShowIntro(false);
  }

  function setAchievementQueueSynced(nextQueue) {
    const queue = typeof nextQueue === "function" ? nextQueue(achievementQueueRef.current) : nextQueue;
    achievementQueueRef.current = queue;
    setAchievementQueue(queue);
  }

  function setDuplicateMaterialsSynced(nextMaterials) {
    const materials = typeof nextMaterials === "function" ? nextMaterials(duplicateMaterialsRef.current) : nextMaterials;
    duplicateMaterialsRef.current = materials;
    setDuplicateMaterials(materials);
  }

  function setDuplicateCopiesSynced(nextCopies) {
    const copies = typeof nextCopies === "function" ? nextCopies(duplicateCopiesRef.current) : nextCopies;
    duplicateCopiesRef.current = copies;
    setDuplicateCopies(copies);
  }

  function setZTokenPopupQueueSynced(nextQueue) {
    const queue = typeof nextQueue === "function" ? nextQueue(zTokenPopupQueueRef.current) : nextQueue;
    zTokenPopupQueueRef.current = queue;
    setZTokenPopupQueue(queue);
  }

  function setFoundOrderIdsSynced(nextIds) {
    const ids = typeof nextIds === "function" ? nextIds(foundOrderIdsRef.current) : nextIds;
    foundOrderIdsRef.current = ids;
    setFoundOrderIds(ids);
  }

  function setSacrificedIdsSynced(nextIds) {
    const ids = typeof nextIds === "function" ? nextIds(sacrificedIdsRef.current) : nextIds;
    sacrificedIdsRef.current = ids;
    setSacrificedIds(ids);
  }

  function recordFoundOrder(entityId) {
    if (!entityId) {
      return;
    }

    setFoundOrderIdsSynced((currentIds) => [...currentIds.filter((id) => id !== entityId), entityId]);
  }

  function armImportantModalActionDelay() {
    window.clearTimeout(importantModalActionTimerRef.current);
    setIsImportantModalActionReady(false);
    importantModalActionTimerRef.current = window.setTimeout(() => {
      setIsImportantModalActionReady(true);
    }, IMPORTANT_MODAL_ACTION_DELAY);
  }

  function setActiveAchievementSynced(nextAchievement) {
    activeAchievementRef.current = nextAchievement;
    if (nextAchievement) {
      armImportantModalActionDelay();
    } else {
      setIsImportantModalActionReady(true);
    }
    setActiveAchievement(nextAchievement);
  }

  function setActiveGoodFindModalSynced(nextEntity) {
    activeGoodFindModalRef.current = nextEntity;
    if (nextEntity) {
      setActiveGoodFindCanSkip(forcedStickerBookPopupCountRef.current >= 5);
      const nextCount = forcedStickerBookPopupCountRef.current + 1;
      forcedStickerBookPopupCountRef.current = nextCount;
      setForcedStickerBookPopupCount(nextCount);
      armImportantModalActionDelay();
    } else {
      setActiveGoodFindCanSkip(false);
      setIsImportantModalActionReady(true);
    }
    setActiveGoodFindModal(nextEntity);
  }

  function setActiveCraftResultSynced(nextResult) {
    activeCraftResultRef.current = nextResult;
    setActiveCraftResult(nextResult);
  }

  function startNextAchievement(delay = 0) {
    window.clearTimeout(achievementDelayTimerRef.current);

    achievementDelayTimerRef.current = window.setTimeout(() => {
      if (
        activeCraftResultRef.current ||
        activeGoodFindModalRef.current ||
        activeAchievementRef.current ||
        showGrinderReadyPromptRef.current ||
        activeZTokenPopupRef.current ||
        showZChamberTeaserPopupRef.current ||
        activeStickerInspectEntity ||
        activeAchievementInspect ||
        isZChamberOpenRef.current ||
        activeZRollResultRef.current ||
        achievementQueueRef.current.length === 0
      ) {
        return;
      }

      const [nextAchievement, ...remainingAchievements] = achievementQueueRef.current;
      setAchievementQueueSynced(remainingAchievements);
      setActiveAchievementSynced(nextAchievement);
    }, delay);
  }

  function startNextZTokenPopup(delay = 0) {
    window.setTimeout(() => {
      if (
        activeAchievementRef.current ||
        activeGoodFindModalRef.current ||
        activeCraftResultRef.current ||
        activeZTokenPopupRef.current ||
        showZChamberTeaserPopupRef.current ||
        isZChamberOpenRef.current ||
        activeZRollResultRef.current ||
        achievementQueueRef.current.length > 0 ||
        zTokenPopupQueueRef.current.length === 0
      ) {
        return;
      }

      const [nextPopup, ...remainingPopups] = zTokenPopupQueueRef.current;
      setZTokenPopupQueueSynced(remainingPopups);
      activeZTokenPopupRef.current = nextPopup;
      setActiveZTokenPopup(nextPopup);
    }, delay);
  }

  function showDiscoveryPopup(event) {
    if (!event) {
      return;
    }

    setActiveDiscoveryPopup(event);
    window.clearTimeout(discoveryTimerRef.current);
    if (event.requiresAction) {
      return;
    }

    discoveryTimerRef.current = window.setTimeout(() => {
      setActiveDiscoveryPopup(null);
    }, event.duration);
  }

  function showBreachOverlay(event) {
    if (!event) {
      return;
    }

    setActiveBreachOverlay(event);
    window.clearTimeout(breachTimerRef.current);
    breachTimerRef.current = window.setTimeout(() => {
      setActiveBreachOverlay(null);
    }, event.duration);
  }

  function showDiscoveryVisualEvent(event) {
    if (!event) {
      return;
    }

    if (event.type === "breach") {
      showBreachOverlay(event);
      return;
    }

    showDiscoveryPopup(event);
  }

  function getCollectedGifEntities(ids = collectedIdsRef.current) {
    return forbiddenNopeGifs.filter((entity) => ids.includes(entity.id));
  }

  function getGifChaosChance(collectedGifCount) {
    if (collectedGifCount >= 16) {
      return 0.25;
    }

    if (collectedGifCount >= 9) {
      return 0.16;
    }

    if (collectedGifCount >= 4) {
      return 0.1;
    }

    if (collectedGifCount >= 1) {
      return 0.05;
    }

    return 0;
  }

  function getCollectedGifChaosEvent(ids = collectedIdsRef.current) {
    const collectedGifs = getCollectedGifEntities(ids);
    const chaosChance = getGifChaosChance(collectedGifs.length);

    if (chaosChance === 0 || !randomChance(chaosChance)) {
      return null;
    }

    return createLoopBreachEvent(pickRandom(collectedGifs), "chaos");
  }

  function getDiscoveryVisualEvent(entity, alreadyCollected) {
    if (!alreadyCollected && entity.type === "uber") {
      return {
        duration: randomBetween(1800, 2500),
        entity,
        signalType: "uber",
        type: "transmission",
      };
    }

    if (!alreadyCollected && entity.type === "mythic") {
      return {
        duration: randomBetween(3500, 4000),
        entity,
        signalType: "mythic",
        type: "transmission",
      };
    }

    if (!alreadyCollected && entity.type === "gif") {
      return {
        duration: randomBetween(2500, 3200),
        entity,
        signalType: entity.rarity,
        type: "transmission",
      };
    }

    if (!alreadyCollected) {
      return {
        duration: randomBetween(2500, 3000),
        entity,
        signalType: "new",
        type: "transmission",
      };
    }

    if (randomChance(0.1)) {
      return {
        duration: randomBetween(900, 1400),
        entity,
        signalType: entity.type === "uber" ? "uber" : entity.type === "mythic" ? "mythic" : entity.type === "gif" ? entity.rarity : "duplicate",
        type: "transmission",
      };
    }

    return null;
  }

  function getBreachVisualEvent(entity, alreadyCollected) {
    if (entity.type === "mythic" || entity.type === "uber") {
      return null;
    }

    if (entity.type === "gif") {
      if (!alreadyCollected || randomChance(0.25)) {
        return createLoopBreachEvent(entity, alreadyCollected ? "chaos" : "discovery");
      }

      return null;
    }

    return getCollectedGifChaosEvent();
  }

  function getDiscoveryMessage(entity, alreadyCollected) {
    if (alreadyCollected && entity.type === "uber") {
      return `same trash. different disappointment. ${entity.name} again.`;
    }

    if (alreadyCollected && entity.type === "mythic") {
      return `duplicate detected. emotional recycling available. ${entity.name} again.`;
    }

    if (alreadyCollected) {
      return pickRandom([
        `duplicate detected. emotional recycling available. ${entity.name} again.`,
        `same trash. different disappointment. ${entity.name} again.`,
      ]);
    }

    if (entity.type === "uber") {
      return `UBER NOPE DISCOVERED: ${entity.name}. probability has been insulted.`;
    }

    if (entity.type === "mythic") {
      return `MYTHIC NOPE DETECTED: ${entity.name}. probability wasted.`;
    }

    if (entity.type === "gif") {
      return `${getLoopFoundTitle(entity)}: ${entity.name}. added to NOPEDEX.`;
    }

    return pickRandom([
      `new trash recovered. ego risk increased. ${entity.name} added.`,
      `sticker acquired. value did not improve. ${entity.name} added.`,
    ]);
  }

  function isForcedStickerBookFind(entity, alreadyCollected) {
    return !alreadyCollected && allNopeEntities.some((nopeEntity) => nopeEntity.id === entity.id) && entity.dropChance < FORCED_STICKERBOOK_DROP_THRESHOLD;
  }

  function getGoodFindTitle(entity) {
    if (entity.type === "uber") {
      return "UBER NOPE DETECTED";
    }

    if (entity.type === "mythic") {
      return "MYTHIC NOPE DETECTED";
    }

    if (entity.type === "gif") {
      return getLoopFoundTitle(entity);
    }

    if (entity.rarity === "epic") {
      return "RARE NOPE DETECTED";
    }

    return "GOOD TRASH DETECTED";
  }

  function getGoodFindProbabilityLine(entity) {
    if (entity.type === "uber") {
      return "probability has been insulted.";
    }

    if (entity.type === "mythic") {
      return "probability briefly failed.";
    }

    if (entity.type === "gif" && entity.rarity === "illegal") {
      return "NOPE OS should not have shown you this.";
    }

    return null;
  }

  function getDuplicateMaterialTier(entity) {
    if (entity.type === "gif" || entity.type === "uber") {
      return null;
    }

    return Object.hasOwn(DEFAULT_DUPLICATE_MATERIALS, entity.rarity) ? entity.rarity : null;
  }

  function getNopeEntity(entityId) {
    return allNopeEntities.find((entity) => entity.id === entityId) || null;
  }

  function isSacrificeEligible(entity) {
    return Boolean(entity) &&
      collectedIds.includes(entity.id) &&
      !sacrificedIds.includes(entity.id) &&
      getDuplicateMaterialTier(entity) !== null;
  }

  function addDuplicateMaterial(entity) {
    const materialTier = getDuplicateMaterialTier(entity);

    if (!materialTier) {
      return achievementStatsRef.current;
    }

    setDuplicateMaterialsSynced((currentMaterials) => ({
      ...DEFAULT_DUPLICATE_MATERIALS,
      ...currentMaterials,
      [materialTier]: (currentMaterials[materialTier] ?? 0) + 1,
    }));
    const nextStats = updateAchievementStats({ duplicateMaterialEarnedCount: 1 });
    addInstantNopeLine("duplicate trash became machine food.");

    return nextStats;
  }

  function addDuplicateCopy(entity) {
    setDuplicateCopiesSynced((currentCopies) => ({
      ...currentCopies,
      [entity.id]: (currentCopies[entity.id] ?? 0) + 1,
    }));
  }

  async function copyContract(event) {
    event?.preventDefault();

    if (isBooting) {
      return;
    }

    try {
      await navigator.clipboard.writeText(CONTRACT);
      const nextStats = updateAchievementStats({ contractCopyCount: 1 });
      queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
      addInstantNopeLine("contract copied. responsibility not included. NOPE.");
    } catch {
      addInstantNopeLine(`clipboard said no. manual contract: ${CONTRACT}`);
    }
  }

  function addInstantNopeLine(text) {
    addLine(createLine("nope", text));
  }

  function setCurrentBadIdeaProgressSynced(nextProgress) {
    const progress = typeof nextProgress === "function" ? nextProgress(currentBadIdeaProgressRef.current) : nextProgress;
    const normalizedProgress = Math.max(0, Math.floor(Number(progress) || 0));
    currentBadIdeaProgressRef.current = normalizedProgress;
    setCurrentBadIdeaProgress(normalizedProgress);

    return normalizedProgress;
  }

  function setCurrentBadIdeaSynced(nextMissionId) {
    currentBadIdeaIdRef.current = nextMissionId;
    setCurrentBadIdeaId(nextMissionId);
    setCurrentBadIdeaProgressSynced(0);
  }

  function setNopeSurgeChargeSynced(nextCharge) {
    const charge = typeof nextCharge === "function" ? nextCharge(nopeSurgeChargeRef.current) : nextCharge;
    const normalizedCharge = Math.min(NOPE_SURGE_CHARGE_TARGET, Math.max(0, Math.floor(Number(charge) || 0)));
    nopeSurgeChargeRef.current = normalizedCharge;
    setNopeSurgeCharge(normalizedCharge);

    return normalizedCharge;
  }

  function showNopeSurgeChargeFeedback(amount) {
    const percentGain = Math.min(100, (amount / NOPE_SURGE_CHARGE_TARGET) * 100);
    const displayPercent = Math.round(percentGain);
    const tier = percentGain >= 25 ? "huge" : percentGain >= 10 ? "big" : "small";
    const feedback = {
      id: Date.now(),
      label: displayPercent >= 1 ? `SURGE +${displayPercent}%` : "",
      tier,
    };

    window.clearTimeout(nopeSurgeChargeFeedbackTimerRef.current);
    setNopeSurgeChargeFeedback(feedback);
    nopeSurgeChargeFeedbackTimerRef.current = window.setTimeout(() => {
      setNopeSurgeChargeFeedback((currentFeedback) => (
        currentFeedback?.id === feedback.id ? null : currentFeedback
      ));
    }, tier === "huge" ? 1400 : tier === "big" ? 1200 : 900);
  }

  function chargeNopeSurge(amount) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      isNopeSurgeReadyRef.current ||
      nopeSurgeEndsAtRef.current > Date.now()
    ) {
      return;
    }

    const chargeAmount = Math.floor(amount);
    const nextCharge = setNopeSurgeChargeSynced(nopeSurgeChargeRef.current + chargeAmount);
    showNopeSurgeChargeFeedback(chargeAmount);

    if (nextCharge >= NOPE_SURGE_CHARGE_TARGET && !isNopeSurgeReadyRef.current) {
      isNopeSurgeReadyRef.current = true;
      setIsNopeSurgeReady(true);
      addInstantNopeLine("NOPE SURGE charged. terrible timing available.");
    }
  }

  function startNopeSurge({ isDev = false } = {}) {
    const nextEndsAt = Date.now() + NOPE_SURGE_DURATION_MS;
    nopeSurgeEndsAtRef.current = nextEndsAt;
    setNopeSurgeEndsAt(nextEndsAt);
    setNopeSurgeRemainingMs(NOPE_SURGE_DURATION_MS);
    setShowNopeSurgePopup(true);
    setNopeSurgeChargeSynced(0);
    isNopeSurgeReadyRef.current = false;
    setIsNopeSurgeReady(false);
    window.clearTimeout(nopeSurgeChargeFeedbackTimerRef.current);
    setNopeSurgeChargeFeedback(null);

    if (isDev) {
      addInstantNopeLine("dev surge injected. background dignity failed.");
      return;
    }

    const nextActivations = nopeSurgeActivationsRef.current + 1;
    nopeSurgeActivationsRef.current = nextActivations;
    setNopeSurgeActivations(nextActivations);
    addInstantNopeLine("NOPE SURGE activated. background dignity failed.");
    const nextStats = updateAchievementStats({ nopeSurgeTriggerCount: 1, nopeSurgeActivationCount: 1 });
    queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }), 0, { skipCombo: true, skipScore: true });
  }

  function activateNopeSurge() {
    if (!isNopeSurgeReadyRef.current || nopeSurgeEndsAtRef.current > Date.now()) {
      return;
    }

    startNopeSurge();
  }

  function forceNopeSurge() {
    startNopeSurge({ isDev: true });
  }

  function advanceCurrentBadIdea(type, amount = 1, { isDev = false } = {}) {
    if (isDev || activeBadIdeaCompletionRef.current) {
      return;
    }

    const mission = getCurrentBadIdeaById(currentBadIdeaIdRef.current);
    if (!mission || mission.type !== type) {
      return;
    }

    const nextProgress = Math.min(mission.target, currentBadIdeaProgressRef.current + amount);
    setCurrentBadIdeaProgressSynced(nextProgress);

    if (nextProgress >= mission.target) {
      const completion = { mission };
      activeBadIdeaCompletionRef.current = completion;
      setActiveBadIdeaCompletion(completion);
      addInstantNopeLine("bad idea completed. regrettably efficient.");
    }
  }

  function acceptBadIdeaCompletion() {
    const mission = activeBadIdeaCompletion?.mission;
    if (!mission) {
      return;
    }

    awardNopeScore(mission.reward, "bad-idea", {
      displayLabel: "BAD IDEA COMPLETE",
      qualifiesForCombo: true,
      qualifiesForZCharge: true,
    });

    const nextCompletedCount = badIdeasCompletedRef.current + 1;
    badIdeasCompletedRef.current = nextCompletedCount;
    setBadIdeasCompleted(nextCompletedCount);
    const nextStats = updateAchievementStats({ badIdeaCompletedCount: 1 });
    queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
    activeBadIdeaCompletionRef.current = null;
    setActiveBadIdeaCompletion(null);
    setCurrentBadIdeaSynced(pickNextBadIdeaId(mission.id));
    addInstantNopeLine("bad idea loaded. follow it or don't.");
  }

  function getCollectionCounts(ids) {
    return {
      commonCollectedCount: ids.filter((id) => rarityPools.common.some((entity) => entity.id === id)).length,
      epicCollectedCount: ids.filter((id) => rarityPools.epic.some((entity) => entity.id === id)).length,
      gifCollectedCount: ids.filter((id) => forbiddenNopeGifs.some((entity) => entity.id === id)).length,
      mythicCollectedCount: ids.filter((id) => mythicNopeRelics.some((entity) => entity.id === id)).length,
      normalCollectedCount: ids.filter((id) => standardNopeEntities.some((entity) => entity.id === id)).length,
      rareCollectedCount: ids.filter((id) => rarityPools.rare.some((entity) => entity.id === id)).length,
      totalCollectedCount: ids.filter((id) => allNopeEntities.some((entity) => entity.id === id)).length,
      uncommonCollectedCount: ids.filter((id) => rarityPools.uncommon.some((entity) => entity.id === id)).length,
      uberCollectedCount: ids.filter((id) => uberNopeRelics.some((entity) => entity.id === id)).length,
    };
  }

  function getAchievementProgress(achievement, snapshot) {
    const progressMap = {
      "again-really": [snapshot.duplicateCount, 100, "duplicates"],
      "accidental-skill": [snapshot.comboTriggerCount, 1, "combos"],
      "animated-regret": [snapshot.gifCollectedCount, 10, "loops"],
      "ashes-to-nopedex": [snapshot.restoredFromBurnCount, 10, "restored NOPEs"],
      "ascended-into-nope": [snapshot.uberCollectedCount, UBER_TOTAL, "Uber NOPEs"],
      "ash-collector": [snapshot.sacrificeCount, 10, "sacrifices"],
      "absolute-degenerate": [snapshot.uberSacrificeCount, 1, "Uber sacrifices"],
      "bad-idea-addict": [snapshot.badIdeaCompletedCount, 5, "bad ideas"],
      "bad-idea-enjoyer": [snapshot.badIdeaCompletedCount, 1, "bad ideas"],
      "burn-notice": [snapshot.sacrificeCount, 1, "sacrifices"],
      "burn-pile-curator": [snapshot.burnPileCount, 10, "burn pile NOPEs"],
      "big-number-still-zero": [snapshot.comboBigScoreEventCount, 1, "big score events"],
      "common-sense-lost": [snapshot.commonCollectedCount, 25, "common trash stickers"],
      "combo-goblin": [snapshot.comboTriggerCount, 5, "combos"],
      "contract-said-non": [snapshot.contractCopyCount, 1, "contract copies"],
      "colour-blind-regret": [
        Number(snapshot.signalNormalClickCount >= 1) +
          Number(snapshot.signalTonClickCount >= 1) +
          Number(snapshot.signalCorruptClickCount >= 1) +
          Number(snapshot.signalDangerClickCount >= 1),
        4,
        "signal colours",
      ],
      "copypasta-contagion": [snapshot.shareCopyCount, 10, "share copies"],
      "duplicate-damage": [snapshot.duplicateCount, 10, "duplicates"],
      "emotional-recycling": [snapshot.duplicateCount, 50, "duplicates"],
      "feed-the-machine": [snapshot.sacrificeCount, 5, "sacrifices"],
      "five-z-rolls-still-nope": [snapshot.zRollFailures, 5, "failed Z rolls"],
      "final-boss-press": [snapshot.nopeCount, 500, "NOPE presses"],
      "first-try-disgusting": [snapshot.zNopeAcquired && snapshot.zRollAttempts === 1 ? 1 : 0, 1, "first-try Z"],
      "found-in-the-ashes": [snapshot.restoredFromBurnCount, 1, "restored NOPEs"],
      "found-the-static": [snapshot.signalFragmentClickCount, 1, "static signals"],
      "forbidden-behaviour": [snapshot.gifCollectedCount, 1, "loops"],
      "fuel-goblin": [snapshot.duplicateMaterialEarnedCount, 25, "duplicate fuel"],
      "fuel-hoarder": [snapshot.duplicateMaterialEarnedCount, 100, "duplicate fuel"],
      "god-left-the-chat": [snapshot.godSacrificeCount, 1, "divine sacrifices"],
      "garbage-curator": [snapshot.normalCollectedCount, 25, "stickers"],
      "gif-criminal": [snapshot.gifCollectedCount, GIF_TOTAL, "loops"],
      "high-priest-press": [snapshot.nopeCount, 100, "NOPE presses"],
      "industrial-regret": [snapshot.grinderUseCount, 25, "grinder uses"],
      "loop-sickness": [snapshot.gifCollectedCount, 5, "loops"],
      "machine-is-hungry": [snapshot.grinderUseCount, 10, "grinder uses"],
      "mild-regret": [snapshot.nopeCount, 10, "NOPE presses"],
      "mythic-bonfire": [snapshot.sacrificedMythicCount, 1, "mythic sacrifices"],
      "mythically-useless": [snapshot.mythicCollectedCount, 1, "mythic NOPEs"],
      "nopedex-heretic": [snapshot.uberSacrificeCount, 3, "Uber sacrifices"],
      "nope-enjoyer-press": [snapshot.nopeCount, 50, "NOPE presses"],
      "nopedex-damage": [snapshot.normalCollectedCount, 100, "stickers"],
      "operationally-useless-press": [snapshot.nopeCount, 250, "NOPE presses"],
      "peeked-at-the-z": [snapshot.zChamberTeaserSeen, 1, "forbidden previews"],
      "phoenix-nopedex": [snapshot.restoredFromBurnCount, 5, "restored NOPEs"],
      "public-embarrassment": [snapshot.shareCount, 5, "shares"],
      "purple-problem": [snapshot.nopeSurgeActivationCount ?? snapshot.nopeSurgeTriggerCount, 1, "surges"],
      "save-it-for-what": [snapshot.nopeSurgeActivationCount, 1, "surges"],
      "keep-on-rolling": [snapshot.scoreRollingFiveSecondCount, 1, "rolling streaks"],
      "overcharged-nothing": [snapshot.zSignalChargeFillCount, 5, "Z charges"],
      "rubbish-with-range": [snapshot.uncommonCollectedCount, 10, "uncommon trash stickers"],
      "red-flag-clicker": [snapshot.signalDangerClickCount, 1, "red signals"],
      "scorched-earth": [snapshot.sacrificeCount, 25, "sacrifices"],
      "signal-goblin": [snapshot.signalFragmentClickCount, 15, "static signals"],
      "spread-the-disease": [snapshot.shareCount, 1, "shares"],
      "static-addict": [snapshot.signalFragmentClickCount, 5, "static signals"],
      "sticker-gremlin": [snapshot.normalCollectedCount, 50, "stickers"],
      "surge-abuser": [snapshot.nopeSurgeScoreEventCount, 10, "surge scores"],
      "ten-z-rolls-zero-z": [snapshot.zRollFailures, 10, "failed Z rolls"],
      "terminal-idiot-press": [snapshot.nopeCount, 25, "NOPE presses"],
      "the-number-wont-stop": [snapshot.scoreRollingTenSecondCount, 1, "rolling streaks"],
      "the-final-no": [snapshot.zNopeAcquired, 1, "Z NOPE"],
      "trash-alchemist": [snapshot.grinderUseCount, 1, "grinder uses"],
      "total-nopeification": [
        snapshot.normalCollectedCount + snapshot.gifCollectedCount + snapshot.mythicCollectedCount,
        NORMAL_TOTAL + GIF_TOTAL + MYTHIC_TOTAL,
        "non-Uber finds",
      ],
      "trash-collector": [snapshot.normalCollectedCount, 10, "stickers"],
      "uberly-pointless": [snapshot.uberCollectedCount, 1, "Uber NOPEs"],
      "why-are-you-like-this": [snapshot.normalCollectedCount, NORMAL_TOTAL, "stickers"],
      "signal-battery": [snapshot.zSignalChargeFillCount, 1, "Z charges"],
      "z-heard-you": [snapshot.signalZClickCount, 1, "Z leaks"],
      "z-nope-failed-once": [snapshot.zRollFailures, 1, "failed Z rolls"],
    };
    const progress = progressMap[achievement.id];

    if (!progress) {
      return null;
    }

    const [current, target, label] = progress;

    return {
      current: Math.min(current ?? 0, target),
      label,
      target,
    };
  }

  function buildAchievementSnapshot(overrides = {}) {
    const ids = overrides.collectedIds ?? collectedIdsRef.current;
    const burnedIds = overrides.sacrificedIds ?? sacrificedIdsRef.current;
    const stats = { ...achievementStatsRef.current, ...(overrides.achievementStats ?? {}) };

    return {
      ...stats,
      ...getCollectionCounts(ids),
      burnPileCount: burnedIds.length,
      collectedIds: ids,
      nopeCount: overrides.nopeCount ?? nopeCountRef.current,
      sacrificedIds: burnedIds,
      zNopeAcquired: overrides.zNopeAcquired ?? (znopeAcquiredRef.current ? 1 : 0),
      zRollAttempts: overrides.zRollAttempts ?? zRollAttemptsRef.current,
      zRollFailures: overrides.zRollFailures ?? zRollFailuresRef.current,
    };
  }

  function getScoreVisualTier(amount) {
    if (amount >= 1000000) {
      return "z";
    }

    if (amount >= 100000) {
      return "huge";
    }

    if (amount >= 10000) {
      return "large";
    }

    if (amount >= 1000) {
      return "medium";
    }

    return "small";
  }

  function setScoreComboSynced(nextCombo) {
    const combo = typeof nextCombo === "function" ? nextCombo(scoreComboRef.current) : nextCombo;
    const normalizedCombo = {
      activeHitsLeft: Math.max(0, Math.floor(Number(combo.activeHitsLeft) || 0)),
      bank: Math.max(0, Math.floor(Number(combo.bank) || 0)),
      events: Math.max(0, Math.floor(Number(combo.events) || 0)),
    };

    scoreComboRef.current = normalizedCombo;
    setScoreCombo(normalizedCombo);

    return normalizedCombo;
  }

  function setZSignalChargeSynced(nextCharge) {
    const charge = typeof nextCharge === "function" ? nextCharge(zSignalChargeRef.current) : nextCharge;
    const normalizedCharge = Math.max(0, Math.floor(Number(charge) || 0));

    zSignalChargeRef.current = normalizedCharge;
    setZSignalCharge(normalizedCharge);

    return normalizedCharge;
  }

  function chargeZSignal(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const nextChargeTotal = zSignalChargeRef.current + Math.floor(amount);

    if (nextChargeTotal < Z_SIGNAL_CHARGE_TARGET) {
      setZSignalChargeSynced(nextChargeTotal);
      return;
    }

    const overflowCharge = nextChargeTotal - Z_SIGNAL_CHARGE_TARGET;
    const nextTokens = zRollTokensRef.current + 1;
    zRollTokensRef.current = nextTokens;
    setZRollTokens(nextTokens);
    setZSignalChargeSynced(overflowCharge);
    setActiveZSignalChargePopup(true);
    addInstantNopeLine("Z Signal charged. +1 roll leaked.");
    const nextStats = updateAchievementStats({ zSignalChargeFillCount: 1 });
    queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }), 0, { skipCombo: true });
  }

  function showComboNotice(type) {
    setComboNotice({
      id: Date.now(),
      type,
    });
    window.clearTimeout(comboNoticeTimerRef.current);
    comboNoticeTimerRef.current = window.setTimeout(() => {
      setComboNotice(null);
    }, type === "online" ? 1800 : 1300);
  }

  function addScoreBurst(amount, reason, tier, { baseAmount = amount, comboApplied = false, context = "score", position = null, surgeApplied = false } = {}) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const burst = {
      amount,
      baseAmount,
      comboApplied,
      context,
      formattedAmount: formatScoreAmount(amount),
      id,
      position,
      reason: formatScoreReason(reason),
      surgeApplied,
      tier,
    };

    setScoreBursts((currentBursts) => [...currentBursts.slice(-3), burst]);

    const removeTimer = window.setTimeout(() => {
      setScoreBursts((currentBursts) => currentBursts.filter((currentBurst) => currentBurst.id !== id));
    }, tier === "z" ? 1500 : tier === "huge" ? 1400 : tier === "large" ? 1250 : 1050);
    scoreBurstTimersRef.current.push(removeTimer);
  }

  function awardNopeScore(amount, reason = "NOPE", options = {}) {
    if (options.isDev || options.skipScore) {
      return 0;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return 0;
    }

    const baseScoreGain = Math.floor(amount);
    if (baseScoreGain <= 0) {
      return 0;
    }

    const qualifiesForCombo = options.qualifiesForCombo ?? (reason !== "press" && !options.skipCombo);
    const currentCombo = scoreComboRef.current;
    const comboApplied = qualifiesForCombo && currentCombo.activeHitsLeft > 0;
    const qualifiesForSurge = options.qualifiesForSurge ?? (
      reason !== "press" &&
      !options.skipSurge &&
      !options.isDev &&
      !options.skipScore
    );
    const surgeApplied = qualifiesForSurge && nopeSurgeEndsAtRef.current > Date.now();
    const comboScoreGain = comboApplied ? Math.ceil(baseScoreGain * NOPE_COMBO_MULTIPLIER) : baseScoreGain;
    const scoreGain = surgeApplied ? comboScoreGain * NOPE_SURGE_SCORE_MULTIPLIER : comboScoreGain;
    const nextComboHitsLeft = comboApplied ? Math.max(0, currentCombo.activeHitsLeft - 1) : currentCombo.activeHitsLeft;
    const nextScore = nopeScoreRef.current + scoreGain;
    const heatGain = scoreGain >= 100000000 ? 10 : scoreGain >= 1000000 ? 6 : scoreGain >= 100000 ? 3 : comboApplied ? 2 : 1;
    const nextHeat = Math.min(10, scoreHeatRef.current + heatGain);
    scoreHeatRef.current = nextHeat;
    setScoreHeat(nextHeat);
    let comboForState = {
      activeHitsLeft: nextComboHitsLeft,
      bank: currentCombo.bank,
      events: currentCombo.events,
    };

    if (comboApplied) {
      if (nextComboHitsLeft <= 0) {
        comboForState = { activeHitsLeft: 0, bank: 0, events: 0 };
        showComboNotice("expired");
        addInstantNopeLine("combo expired. skill issue restored.");
      }
    } else if (qualifiesForCombo && currentCombo.activeHitsLeft <= 0) {
      const nextBank = currentCombo.bank + baseScoreGain;
      const nextEvents = currentCombo.events + 1;

      if (nextBank >= NOPE_COMBO_TRIGGER_SCORE) {
        comboForState = {
          activeHitsLeft: NOPE_COMBO_ACTIVE_EVENTS,
          bank: 0,
          events: 0,
        };
        showComboNotice("online");
        addInstantNopeLine("NOPE COMBO ONLINE. You accidentally played the game properly.");
        const nextStats = updateAchievementStats({ comboTriggerCount: 1 });
        queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
      } else if (nextEvents >= NOPE_COMBO_WINDOW_EVENTS) {
        comboForState = { activeHitsLeft: 0, bank: 0, events: 0 };
      } else {
        comboForState = {
          activeHitsLeft: 0,
          bank: nextBank,
          events: nextEvents,
        };
      }
    }

    setScoreComboSynced(comboForState);
    nopeScoreRef.current = nextScore;
    window.localStorage.setItem(STORAGE_KEYS.nopeScore, String(nextScore));
    setNopeScore(nextScore);
    const visualTier = options.visualTier ?? getScoreVisualTier(scoreGain);
    const burstContext = options.burstContext ?? (
      activeGoodFindModalRef.current ||
      activeCraftResultRef.current ||
      isZChamberOpenRef.current ||
      activeZRollResultRef.current
        ? "modal"
        : "score"
    );
    addScoreBurst(scoreGain, options.displayLabel ?? reason, visualTier, {
      baseAmount: baseScoreGain,
      context: burstContext,
      comboApplied,
      position: options.burstPosition ?? null,
      surgeApplied,
    });
    const qualifiesForZCharge = options.qualifiesForZCharge ?? (
      qualifiesForCombo &&
      reason !== "press" &&
      reason !== "z-roll-failure" &&
      reason !== "z-nope" &&
      !options.skipZCharge
    );

    if (qualifiesForZCharge) {
      chargeZSignal(scoreGain);
    }

    if (qualifiesForSurge) {
      chargeNopeSurge(scoreGain);
    }

    if (surgeApplied) {
      const nextStats = updateAchievementStats({ nopeSurgeScoreEventCount: 1 });
      queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }), 0, { skipCombo: true, skipScore: true });
    }

    if (scoreGain >= 1000) {
      const nextStats = updateAchievementStats({ comboBigScoreEventCount: 1 });
      queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
    }

    return scoreGain;
  }

  function getDiscoveryScore(entity, alreadyCollected) {
    if (!entity) {
      return 0;
    }

    if (alreadyCollected) {
      return entity.type === "gif" ? NOPE_SCORE_VALUES.duplicateGif : NOPE_SCORE_VALUES.duplicateSticker;
    }

    if (entity.type === "uber") {
      return NOPE_SCORE_VALUES.newUber;
    }

    if (entity.type === "mythic" || entity.rarity === "mythic") {
      return NOPE_SCORE_VALUES.newMythic;
    }

    if (entity.type === "gif") {
      const loopScores = {
        cursed: NOPE_SCORE_VALUES.loopCursed,
        forbidden: NOPE_SCORE_VALUES.loopForbidden,
        glitch: NOPE_SCORE_VALUES.loopGlitch,
        illegal: NOPE_SCORE_VALUES.loopIllegal,
      };

      return loopScores[entity.rarity] ?? NOPE_SCORE_VALUES.loopGlitch;
    }

    const rarityScores = {
      common: NOPE_SCORE_VALUES.newCommon,
      epic: NOPE_SCORE_VALUES.newEpic,
      rare: NOPE_SCORE_VALUES.newRare,
      uncommon: NOPE_SCORE_VALUES.newUncommon,
    };

    return rarityScores[entity.rarity] ?? NOPE_SCORE_VALUES.newCommon;
  }

  function getDiscoveryScoreLabel(entity, alreadyCollected) {
    if (alreadyCollected) {
      return entity.type === "gif" ? "DUPLICATE LOOP" : "DUPLICATE NOPE";
    }

    if (entity.type === "gif") {
      return entity.rarityLabel ?? "LOOP NOPE";
    }

    if (entity.type === "uber") {
      return "UBER NOPE";
    }

    if (entity.type === "mythic" || entity.rarity === "mythic") {
      return "MYTHIC NOPE";
    }

    return entity.rarityLabel ?? "COMMON NOPE";
  }

  function getAchievementScore(achievement) {
    const displayTier = getAchievementDisplayTier(achievement.id);

    if (displayTier.className === "achievement-tier-z") {
      return NOPE_SCORE_VALUES.achievementZ;
    }

    if (displayTier.className === "achievement-tier-cursed") {
      return NOPE_SCORE_VALUES.achievementCursed;
    }

    if (displayTier.className === "achievement-tier-special") {
      return NOPE_SCORE_VALUES.achievementSpecial;
    }

    return NOPE_SCORE_VALUES.achievementBasic;
  }

  function getAchievementScoreReason(achievement) {
    const displayTier = getAchievementDisplayTier(achievement.id);
    const reasonByTier = {
      "achievement-tier-basic": "achievement:basic",
      "achievement-tier-cursed": "achievement:cursed",
      "achievement-tier-special": "achievement:special",
      "achievement-tier-z": "achievement:z",
    };

    return reasonByTier[displayTier.className] ?? "achievement:basic";
  }

  function createAchievementPopupPayload(achievement, { skipCombo = false, skipScore = false } = {}) {
    return {
      ...achievement,
      pendingScoreBonus: skipScore ? 0 : getAchievementScore(achievement),
      pendingScoreReason: getAchievementScoreReason(achievement),
      pendingScoreSkipCombo: skipCombo,
      scoreAwarded: skipScore,
    };
  }

  function awardPendingAchievementScore(achievement) {
    if (!achievement || achievement.scoreAwarded || !Number.isFinite(achievement.pendingScoreBonus) || achievement.pendingScoreBonus <= 0) {
      return 0;
    }

    const scoreGain = awardNopeScore(achievement.pendingScoreBonus, achievement.pendingScoreReason ?? "achievement:basic", {
      displayLabel: "ACHIEVEMENT BONUS",
      skipCombo: achievement.pendingScoreSkipCombo,
    });

    achievement.scoreAwarded = true;
    return scoreGain;
  }

  function getGrinderScore(targetTier) {
    const craftScores = {
      epic: NOPE_SCORE_VALUES.craftEpic,
      mythic: NOPE_SCORE_VALUES.craftMythic,
      rare: NOPE_SCORE_VALUES.craftRare,
      uber: NOPE_SCORE_VALUES.craftUber,
    };

    return NOPE_SCORE_VALUES.grinderCraft + (craftScores[targetTier] ?? 0);
  }

  function getSacrificeScore(entity, isUber = false) {
    if (isUber || entity?.type === "uber") {
      return NOPE_SCORE_VALUES.burnUber;
    }

    if (entity?.type === "mythic" || entity?.rarity === "mythic") {
      return NOPE_SCORE_VALUES.burnMythic;
    }

    const burnScores = {
      common: NOPE_SCORE_VALUES.burnCommon,
      epic: NOPE_SCORE_VALUES.burnEpic,
      rare: NOPE_SCORE_VALUES.burnRare,
      uncommon: NOPE_SCORE_VALUES.burnUncommon,
    };

    return burnScores[entity?.rarity] ?? NOPE_SCORE_VALUES.burnCommon;
  }

  function queueAchievementUnlocks(snapshot, delay = 0, { skipCombo = false, skipScore = false } = {}) {
    const unlockedSet = new Set(unlockedAchievementsRef.current);
    const newAchievements = achievements.filter(
      (achievement) => !unlockedSet.has(achievement.id) && achievement.check(snapshot),
    );

    if (newAchievements.length === 0) {
      return;
    }

    const nextUnlockedIds = [...unlockedAchievementsRef.current, ...newAchievements.map((achievement) => achievement.id)];
    unlockedAchievementsRef.current = nextUnlockedIds;
    setUnlockedAchievements(nextUnlockedIds);
    setAchievementQueueSynced((currentQueue) => [
      ...currentQueue,
      ...newAchievements.map((achievement) => createAchievementPopupPayload(achievement, { skipCombo, skipScore })),
    ]);
    awardZRollTokensForAchievements(newAchievements);

    if (!activeAchievementRef.current) {
      startNextAchievement(delay);
    }
  }

  function awardZRollTokensForAchievements(newAchievements) {
    const claimedSet = new Set(zTokenClaimedAchievementIdsRef.current);
    const zRewardAchievements = newAchievements.filter(
      (achievement) => Z_ROLL_ACHIEVEMENT_IDS.has(achievement.id) && !claimedSet.has(achievement.id),
    );

    if (zRewardAchievements.length === 0) {
      return;
    }

    zRewardAchievements.forEach((achievement) => claimedSet.add(achievement.id));
    const nextClaimedIds = [...claimedSet];
    const nextTokens = zRollTokensRef.current + zRewardAchievements.length;
    zTokenClaimedAchievementIdsRef.current = nextClaimedIds;
    zRollTokensRef.current = nextTokens;
    setZTokenClaimedAchievementIds(nextClaimedIds);
    setZRollTokens(nextTokens);
    setZTokenPopupQueueSynced((currentQueue) => [
      ...currentQueue,
      ...zRewardAchievements.map((achievement, index) => ({
        achievement,
        tokenCount: nextTokens - zRewardAchievements.length + index + 1,
      })),
    ]);
    addInstantNopeLine(`Z Chamber access granted: +${zRewardAchievements.length} roll${zRewardAchievements.length === 1 ? "" : "s"}.`);
    startNextZTokenPopup(700);
  }

  function updateAchievementStats(updates) {
    const nextStats = { ...achievementStatsRef.current };

    Object.entries(updates).forEach(([key, increment]) => {
      nextStats[key] = (nextStats[key] ?? 0) + increment;
    });

    achievementStatsRef.current = nextStats;
    setAchievementStats(nextStats);

    return nextStats;
  }

  function openSignalFragment(fragment) {
    const signalType = fragment.signalType ?? "normal";
    const nextFoundCount = Math.max(
      readStoredNumber(STORAGE_KEYS.signalFragmentsFound),
      readStoredNumber(STORAGE_KEYS.signalFragmentsClicked),
    ) + 1;
    const typeClickCounts = {
      normal: 0,
      ton: 0,
      corrupt: 0,
      danger: 0,
      z: 0,
      ...readStoredObject(STORAGE_KEYS.signalTypeClicks, {}),
    };
    const message = pickRandom(SIGNAL_FRAGMENT_MESSAGES[signalType] ?? SIGNAL_FRAGMENT_MESSAGES.normal);

    setVisibleSignalFragments((currentFragments) =>
      currentFragments.map((visibleFragment) =>
        visibleFragment.instanceId === fragment.instanceId ? { ...visibleFragment, isLeaving: true } : visibleFragment,
      ),
    );
    window.setTimeout(() => {
      setVisibleSignalFragments((currentFragments) =>
        currentFragments.filter((visibleFragment) => visibleFragment.instanceId !== fragment.instanceId),
      );
    }, 420);
    setSignalFragmentsFound(nextFoundCount);
    window.localStorage.setItem(STORAGE_KEYS.signalFragmentsClicked, String(nextFoundCount));
    window.localStorage.setItem(STORAGE_KEYS.signalFragmentsFound, String(nextFoundCount));
    window.localStorage.setItem(
      STORAGE_KEYS.signalTypeClicks,
      JSON.stringify({
        ...typeClickCounts,
        [signalType]: (typeClickCounts[signalType] ?? 0) + 1,
      }),
    );
    const signalScore = awardNopeScore(SIGNAL_FRAGMENT_SCORE_REWARDS[signalType] ?? SIGNAL_FRAGMENT_SCORE_REWARDS.normal, `signal:${signalType}`, {
      burstContext: "fragment",
      burstPosition: { left: fragment.left, top: fragment.top },
    });
    advanceCurrentBadIdea("signal");
    setActiveSignalFragment({
      ...message,
      fragment,
      scoreBonus: signalScore,
    });
    addInstantNopeLine("background static clicked. it noticed.");
    addInstantNopeLine(`SIGNAL DECODED: +${formatScoreAmount(signalScore)} NOPE SCORE.`);

    const statKeyByType = {
      normal: "signalNormalClickCount",
      ton: "signalTonClickCount",
      corrupt: "signalCorruptClickCount",
      danger: "signalDangerClickCount",
      z: "signalZClickCount",
    };
    const nextStats = updateAchievementStats({
      signalFragmentClickCount: 1,
      [statKeyByType[signalType] ?? "signalNormalClickCount"]: 1,
    });
    queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));

    if (signalType === "z" && randomChance(0.01)) {
      const nextTokens = zRollTokensRef.current + 1;
      const nextLeakCount = readStoredNumber(STORAGE_KEYS.zSignalRollsLeaked) + 1;

      zRollTokensRef.current = nextTokens;
      setZRollTokens(nextTokens);
      window.localStorage.setItem(STORAGE_KEYS.zSignalRollsLeaked, String(nextLeakCount));
      addInstantNopeLine("Z signal leaked a roll. probability is annoyed.");
    }

  }

  function shouldShowZChamberTeaser(achievement) {
    return achievement?.id === "mild-regret" && readStoredString(STORAGE_KEYS.zChamberTeaserSeen) !== "true";
  }

  function showZChamberTeaserAfterAchievement(delay = 450) {
    window.setTimeout(() => {
      if (
        activeAchievementRef.current ||
        activeGoodFindModalRef.current ||
        activeCraftResultRef.current ||
        activeZTokenPopupRef.current ||
        showZChamberTeaserPopupRef.current ||
        isZChamberOpenRef.current ||
        activeZRollResultRef.current ||
        achievementQueueRef.current.length > 0
      ) {
        return;
      }

      window.localStorage.setItem(STORAGE_KEYS.zChamberTeaserSeen, "true");
      showZChamberTeaserPopupRef.current = true;
      setShowZChamberTeaserPopup(true);
    }, delay);
  }

  function dismissAchievement() {
    if (!isImportantModalActionReady) {
      return;
    }

    const dismissedAchievement = activeAchievementRef.current;
    const shouldQueueTeaser = shouldShowZChamberTeaser(dismissedAchievement);
    awardPendingAchievementScore(dismissedAchievement);

    if (achievementQueueRef.current.length > 0) {
      if (shouldQueueTeaser) {
        pendingZChamberTeaserRef.current = true;
      }
      setActiveAchievementSynced(null);
      startNextAchievement(350);
      return;
    }

    setActiveAchievementSynced(null);
    if (shouldQueueTeaser || pendingZChamberTeaserRef.current) {
      pendingZChamberTeaserRef.current = false;
      showZChamberTeaserAfterAchievement();
      return;
    }

    startNextZTokenPopup(450);
  }

  function openStickerBook() {
    setIsStickerBookOpen(true);
  }

  function scrollStickerBookToTop() {
    setIsStickerBookTearing(true);
    isStickerBookAutoScrollingRef.current = true;
    stickerBookOverlayRef.current?.classList.remove("stickerbook-scroll-glitching");
    window.clearTimeout(stickerBookTearTimerRef.current);
    window.clearTimeout(stickerBookScrollGlitchTimerRef.current);
    stickerBookTearTimerRef.current = window.setTimeout(() => {
      setIsStickerBookTearing(false);
      isStickerBookAutoScrollingRef.current = false;
    }, 750);

    animateScrollToTop(stickerBookScrollRef.current);
  }

  function switchStickerTab(nextTab) {
    setStickerTab(nextTab);
    isStickerBookAutoScrollingRef.current = true;
    stickerBookOverlayRef.current?.classList.remove("stickerbook-scroll-glitching");
    window.clearTimeout(stickerBookScrollGlitchTimerRef.current);
    stickerBookScrollGlitchTimerRef.current = window.setTimeout(() => {
      isStickerBookAutoScrollingRef.current = false;
    }, 500);
    stickerBookScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openGrinderFromReadyPrompt() {
    showGrinderReadyPromptRef.current = false;
    setShowGrinderReadyPrompt(false);
    setDuplicateStreak(0);
    setIsStickerBookOpen(true);
    setStickerTab("grinder");
    setStickerFilter("all");
    setIsGrinderPromptPulsing(true);
    window.clearTimeout(grinderPromptPulseTimerRef.current);
    grinderPromptPulseTimerRef.current = window.setTimeout(() => {
      duplicateGrinderSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      grinderPromptPulseTimerRef.current = window.setTimeout(() => {
        setIsGrinderPromptPulsing(false);
      }, 1800);
    }, 120);
    startNextAchievement(450);
  }

  function dismissGrinderReadyPromptToButton() {
    showGrinderReadyPromptRef.current = false;
    setShowGrinderReadyPrompt(false);
    setDuplicateStreak(0);
    setIsStickerBookOpen(false);
    startNextAchievement(450);
  }

  function handleStickerBookScroll() {
    if (
      isStickerBookTearing ||
      isStickerBookAutoScrollingRef.current ||
      activeGoodFindModal ||
      activeAchievement ||
      activeCraftResult ||
      activeSacrificeEntity ||
      activeUberSacrificeEntity ||
      activeSacrificeEffect ||
      activeBreachOverlay ||
      activeDiscoveryPopup ||
      highlightedStickerId
    ) {
      return;
    }

    const now = Date.now();

    if (now - lastStickerBookScrollGlitchRef.current < 2000 || stickerBookOverlayRef.current?.classList.contains("stickerbook-scroll-glitching")) {
      return;
    }

    lastStickerBookScrollGlitchRef.current = now;
    stickerBookOverlayRef.current?.classList.add("stickerbook-scroll-glitching");
    window.clearTimeout(stickerBookScrollGlitchTimerRef.current);
    stickerBookScrollGlitchTimerRef.current = window.setTimeout(() => {
      stickerBookOverlayRef.current?.classList.remove("stickerbook-scroll-glitching");
    }, 420);
  }

  function openAchievementsTab() {
    setStickerTab("achievements");
    setStickerFilter("all");
    setIsStickerBookOpen(true);
  }

  function focusStickerInBook(entityId, tab = "all") {
    setStickerTab(tab);
    setStickerFilter("found");
    setHighlightedStickerId(entityId);
    setIsStickerBookOpen(true);

    window.clearTimeout(firstStickerHighlightTimerRef.current);
    firstStickerHighlightTimerRef.current = window.setTimeout(() => {
      setHighlightedStickerId(null);
    }, 4200);
  }

  function openFirstStickerInBook() {
    if (!isImportantModalActionReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.firstStickerPopupSeen, "true");
    setShowFirstStickerPopup(false);
    focusStickerInBook("poornope", "normal");
  }

  function openGoodFindInBook(entityId) {
    if (!isImportantModalActionReady) {
      return;
    }

    window.clearTimeout(discoveryTimerRef.current);
    setActiveDiscoveryPopup(null);
    setActiveGoodFindModalSynced(null);
    focusStickerInBook(entityId, "all");
    startNextAchievement(700);
  }

  function dismissGoodFindToButton() {
    if (!isImportantModalActionReady) {
      return;
    }

    window.clearTimeout(discoveryTimerRef.current);
    window.clearTimeout(breachTimerRef.current);
    setActiveDiscoveryPopup(null);
    setActiveBreachOverlay(null);
    setActiveGoodFindModalSynced(null);
    startNextAchievement(450);
  }

  function dismissCraftResult() {
    const craftResult = activeCraftResultRef.current;

    setActiveCraftResultSynced(null);

    if (craftResult?.shouldOpenGoodFind) {
      setActiveGoodFindModalSynced(craftResult.entity);
      return;
    }

    startNextAchievement(700);
  }

  function requestSacrifice(entity) {
    if (!isSacrificeEligible(entity)) {
      return;
    }

    setActiveSacrificeEntity(entity);
  }

  function requestUberSacrifice(entity) {
    if (!entity || entity.type !== "uber" || !collectedIdsRef.current.includes(entity.id) || sacrificedIdsRef.current.includes(entity.id)) {
      return;
    }

    setActiveUberSacrificeEntity(entity);
    setUberSacrificeStep(1);
  }

  function cancelSacrifice() {
    setActiveSacrificeEntity(null);
  }

  function cancelUberSacrifice() {
    setActiveUberSacrificeEntity(null);
    setUberSacrificeStep(1);
  }

  function continueUberSacrifice() {
    setUberSacrificeStep(2);
  }

  function getSacrificeAchievementUpdates(entity, materialGain) {
    const updates = {
      duplicateMaterialEarnedCount: materialGain,
      sacrificeCount: 1,
    };

    if (entity.type === "mythic" || entity.rarity === "mythic") {
      updates.sacrificedMythicCount = 1;
    }

    if (entity.type === "uber") {
      updates.uberSacrificeCount = 1;
    }

    if (entity.id === "godnope" || entity.id === "godteirnope") {
      updates.godSacrificeCount = 1;
    }

    return updates;
  }

  function completeSacrifice(entity, { isUber = false } = {}) {
    const materialTier = isUber ? "mythic" : getDuplicateMaterialTier(entity);
    const materialGain = isUber ? 5 : SACRIFICE_MATERIAL_GAIN;

    if (!entity || !materialTier || !collectedIdsRef.current.includes(entity.id) || sacrificedIdsRef.current.includes(entity.id)) {
      setActiveSacrificeEntity(null);
      cancelUberSacrifice();
      return;
    }

    const nextSacrificedIds = [...new Set([...sacrificedIdsRef.current, entity.id])];
    const nextCollectedIds = collectedIdsRef.current.filter((id) => id !== entity.id);
    collectedIdsRef.current = nextCollectedIds;
    setCollectedIds(nextCollectedIds);
    setSacrificedIdsSynced(nextSacrificedIds);
    setDuplicateMaterialsSynced((currentMaterials) => ({
      ...DEFAULT_DUPLICATE_MATERIALS,
      ...currentMaterials,
      [materialTier]: (currentMaterials[materialTier] ?? 0) + materialGain,
    }));
    const nextStats = updateAchievementStats(getSacrificeAchievementUpdates(entity, materialGain));

    setActiveSacrificeEntity(null);
    cancelUberSacrifice();
    setActiveSacrificeEffect(entity);
    window.clearTimeout(sacrificeEffectTimerRef.current);
    sacrificeEffectTimerRef.current = window.setTimeout(() => {
      setActiveSacrificeEffect(null);
    }, isUber ? 1300 : 900);

    if (isUber) {
      addInstantNopeLine("active collection damaged successfully.");
    } else {
      addInstantNopeLine("burn pile received another bad idea.");
    }

    const sacrificeScore = awardNopeScore(getSacrificeScore(entity, isUber), "burn", {
      displayLabel: isUber ? "UBER BURN BONUS" : "BURN BONUS",
    });
    advanceCurrentBadIdea("burn");
    addInstantNopeLine(`${isUber ? "UBER BURN" : "BURN"} BONUS: +${formatScoreAmount(sacrificeScore)} NOPE SCORE.`);
    queueAchievementUnlocks(buildAchievementSnapshot({
      achievementStats: nextStats,
      collectedIds: nextCollectedIds,
      sacrificedIds: nextSacrificedIds,
    }));
  }

  function confirmSacrifice() {
    completeSacrifice(activeSacrificeEntity);
  }

  function confirmUberSacrifice() {
    completeSacrifice(activeUberSacrificeEntity, { isUber: true });
  }

  function resetNopeProgress() {
    Object.keys(window.localStorage)
      .filter((key) => key.toLowerCase().includes("nope"))
      .forEach((key) => window.localStorage.removeItem(key));

    window.location.reload();
  }

  function closeBootPopup() {
    bootRunRef.current += 1;
    clearBootPopupTimers();
    window.localStorage.setItem(STORAGE_KEYS.bootPopupSeen, "true");
    setShowBootPopup(false);
    setIsBooting(false);
  }

  function handleModalBackdropClick(event, onBackdropClose, { respectImportantDelay = false } = {}) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (respectImportantDelay && !isImportantModalActionReady) {
      return;
    }

    onBackdropClose();
  }

  function openBadIdeaDetails() {
    setShowBadIdeaDetails(true);
  }

  function handleBadIdeaPanelKeyDown(event) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openBadIdeaDetails();
  }

  function handleNopeSurgeActivateClick(event) {
    event.stopPropagation();
    activateNopeSurge();
  }

  function toggleStatsPanel() {
    setIsStatsExpanded((isExpanded) => !isExpanded);
  }

  function handleStatsPanelKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleStatsPanel();
  }

  function resetNopeIdleTimer() {
    window.clearTimeout(nopeIdleTimerRef.current);
    setIsNopeIdle(false);

    if (showIntro || isBooting) {
      return;
    }

    nopeIdleTimerRef.current = window.setTimeout(() => {
      setIsNopeIdle(true);

      if (randomChance(0.35)) {
        addInstantNopeLine("button awaiting poor decision. again.");
      }
    }, randomBetween(6000, 8000));
  }

  function canDragScoreHud() {
    return typeof window !== "undefined" &&
      window.matchMedia("(min-width: 701px) and (pointer: fine)").matches;
  }

  function handleScoreHudPointerDown(event) {
    if (!canDragScoreHud() || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    scoreHudDragOffsetRef.current = {
      x: event.clientX - scoreHudPositionRef.current.x,
      y: event.clientY - scoreHudPositionRef.current.y,
    };
    setIsScoreHudDragging(true);
  }

  function handleScoreHudPointerMove(event) {
    if (!isScoreHudDragging || !canDragScoreHud()) {
      return;
    }

    const nextPosition = clampScoreHudPosition({
      x: event.clientX - scoreHudDragOffsetRef.current.x,
      y: event.clientY - scoreHudDragOffsetRef.current.y,
    });

    scoreHudPositionRef.current = nextPosition;
    setScoreHudPosition(nextPosition);
  }

  function handleScoreHudPointerUp(event) {
    if (!isScoreHudDragging) {
      return;
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsScoreHudDragging(false);
  }

  function resetScoreHudPosition() {
    window.localStorage.removeItem(LEGACY_SCORE_HUD_POSITION_KEY);
    const defaultPosition = getDefaultScoreHudPosition();
    const nextPosition = clampScoreHudPosition(defaultPosition);

    scoreHudPositionRef.current = nextPosition;
    setScoreHudPosition(nextPosition);
  }

  function triggerTelegramHaptic(style = "light") {
    try {
      telegramWebApp?.HapticFeedback?.impactOccurred?.(style);
    } catch {
      // Haptics are best-effort inside Telegram and absent elsewhere.
    }
  }

  function triggerDiscoveryHaptic(entity, alreadyCollected) {
    if (alreadyCollected || !entity) {
      return;
    }

    const isRareDiscovery = entity.rarity === "rare" || entity.type === "mythic" || entity.type === "uber";

    if (!isRareDiscovery) {
      return;
    }

    if (telegramDiscoveryHapticCooldownRef.current) {
      return;
    }

    telegramDiscoveryHapticCooldownRef.current = true;
    window.clearTimeout(telegramDiscoveryHapticTimerRef.current);
    telegramDiscoveryHapticTimerRef.current = window.setTimeout(() => {
      telegramDiscoveryHapticCooldownRef.current = false;
    }, 1200);
    triggerTelegramHaptic(entity.type === "uber" || entity.type === "mythic" ? "heavy" : "medium");
  }

  function getNextDiscoveryEntity() {
    const shouldForceFirstSticker =
      collectedIdsRef.current.length === 0 &&
      readStoredString(STORAGE_KEYS.firstStickerForced) !== "true" &&
      firstStickerEntity;

    if (shouldForceFirstSticker) {
      window.localStorage.setItem(STORAGE_KEYS.firstStickerForced, "true");
      return firstStickerEntity;
    }

    return pickDiscoveryEntity();
  }

  function processDiscoveryEntity(discoveredEntity, nextCount, options = {}) {
    const alreadyCollected = collectedIdsRef.current.includes(discoveredEntity.id);
    const isRestoringSacrificed = !alreadyCollected && sacrificedIdsRef.current.includes(discoveredEntity.id);
    const visualEvent = getDiscoveryVisualEvent(discoveredEntity, alreadyCollected);
    const breachEvent = visualEvent?.type === "breach" ? null : getBreachVisualEvent(discoveredEntity, alreadyCollected);
    let nextAchievementStats = achievementStatsRef.current;
    let nextCollectedIds = collectedIdsRef.current;

    triggerDiscoveryHaptic(discoveredEntity, alreadyCollected);
    showDiscoveryVisualEvent(visualEvent);
    showBreachOverlay(breachEvent);
    setLatestDiscoveryId(discoveredEntity.id);

    if (!options.suppressGoodFindModal && isForcedStickerBookFind(discoveredEntity, alreadyCollected)) {
      setActiveGoodFindModalSynced(discoveredEntity);
    }

    if (!alreadyCollected) {
      setDuplicateStreak(0);
      nextCollectedIds = [...collectedIdsRef.current, discoveredEntity.id];
      collectedIdsRef.current = nextCollectedIds;
      setCollectedIds(nextCollectedIds);
      recordFoundOrder(discoveredEntity.id);
      if (isRestoringSacrificed) {
        setSacrificedIdsSynced((currentIds) => currentIds.filter((id) => id !== discoveredEntity.id));
        nextAchievementStats = updateAchievementStats({ restoredFromBurnCount: 1 });
        addInstantNopeLine(`${discoveredEntity.name} recovered from the burn pile.`);
      }
    } else {
      if (options.trackDuplicateStreak !== false) {
        setDuplicateStreak((currentStreak) => (
          getDuplicateMaterialTier(discoveredEntity) ? currentStreak + 1 : 0
        ));
      }
      nextAchievementStats = updateAchievementStats({ duplicateCount: 1 });
      addDuplicateCopy(discoveredEntity);
      if (options.awardDuplicateMaterial !== false) {
        nextAchievementStats = addDuplicateMaterial(discoveredEntity);
      }
    }

    if (!options.skipScore && !options.skipDiscoveryScore) {
      awardNopeScore(
        getDiscoveryScore(discoveredEntity, alreadyCollected),
        alreadyCollected ? `duplicate:${discoveredEntity.id}` : `discovery:${discoveredEntity.id}`,
        { displayLabel: getDiscoveryScoreLabel(discoveredEntity, alreadyCollected) },
      );
      if (!alreadyCollected) {
        advanceCurrentBadIdea(discoveredEntity.type === "gif" ? "loop" : "newSticker");
      }
    }
    addInstantNopeLine(getDiscoveryMessage(discoveredEntity, alreadyCollected));

    if (
      !alreadyCollected &&
      discoveredEntity.id === "poornope" &&
      nextCollectedIds.length === 1 &&
      readStoredString(STORAGE_KEYS.firstStickerPopupSeen) !== "true"
    ) {
      setPendingFirstStickerPopup(true);
    }

    queueAchievementUnlocks(
      buildAchievementSnapshot({
        achievementStats: nextAchievementStats,
        collectedIds: nextCollectedIds,
        nopeCount: nextCount,
        sacrificedIds: isRestoringSacrificed
          ? sacrificedIdsRef.current.filter((id) => id !== discoveredEntity.id)
          : sacrificedIdsRef.current,
      }),
      !alreadyCollected ? randomBetween(700, 1000) : 0,
      { skipScore: options.skipScore },
    );
  }

  function forceUberDiscovery() {
    const uncollectedUber = uberNopeRelics.find((entity) => !collectedIdsRef.current.includes(entity.id));
    const forcedUber = uncollectedUber || pickRandom(uberNopeRelics);

    processDiscoveryEntity(forcedUber, nopeCountRef.current, { skipScore: true });
  }

  function forceRareDiscovery() {
    const forcedRarePool = allNopeEntities.filter((entity) => entity.type !== "uber" && entity.dropChance < FORCED_STICKERBOOK_DROP_THRESHOLD);
    const uncollectedRare = forcedRarePool.find((entity) => !collectedIdsRef.current.includes(entity.id));
    const forcedRare = uncollectedRare || pickRandom(forcedRarePool);

    processDiscoveryEntity(forcedRare, nopeCountRef.current, { skipScore: true });
  }

  function getGrinderTargetPool(targetTier) {
    if (targetTier === "uber") {
      return uberNopeRelics;
    }

    if (targetTier === "mythic") {
      return mythicNopeRelics;
    }

    return standardNopeEntities.filter((entity) => entity.rarity === targetTier);
  }

  function getGrinderAchievementUpdates(targetTier) {
    const targetStatMap = {
      epic: "grinderCraftEpicCount",
      mythic: "grinderCraftMythicCount",
      rare: "grinderCraftRareCount",
      uber: "grinderCraftUberCount",
      uncommon: "grinderCraftUncommonCount",
    };
    const updates = { grinderUseCount: 1 };
    const targetStat = targetStatMap[targetTier];

    if (targetStat) {
      updates[targetStat] = 1;
    }

    return updates;
  }

  function grindDuplicateMaterial(recipe) {
    const currentAmount = duplicateMaterialsRef.current[recipe.source] ?? 0;

    if (currentAmount < recipe.cost) {
      return;
    }

    setDuplicateStreak(0);

    const targetPool = getGrinderTargetPool(recipe.target);

    if (targetPool.length === 0) {
      addInstantNopeLine("grinder failed. somehow there was not enough trash.");
      return;
    }

    const activeUnfoundPool = targetPool.filter((entity) => !collectedIdsRef.current.includes(entity.id));
    const resultEntity = pickRandom(activeUnfoundPool.length > 0 ? activeUnfoundPool : targetPool);
    const wasNew = !collectedIdsRef.current.includes(resultEntity.id);
    const nextMaterials = {
      ...DEFAULT_DUPLICATE_MATERIALS,
      ...duplicateMaterialsRef.current,
      [recipe.source]: currentAmount - recipe.cost,
    };

    setDuplicateMaterialsSynced(nextMaterials);
    const nextStats = updateAchievementStats(getGrinderAchievementUpdates(recipe.target));
    const grinderScoreLabel = recipe.target === "uber" ? "GRINDER JACKPOT" : "GRINDER BONUS";
    const grinderScore = awardNopeScore(getGrinderScore(recipe.target), "grinder", {
      displayLabel: grinderScoreLabel,
    });
    advanceCurrentBadIdea("grinder");
    addInstantNopeLine("grinder hunger increasing.");
    addInstantNopeLine("duplicate trash became machine food.");
    addInstantNopeLine(`GRINDER BONUS: +${formatScoreAmount(grinderScore)} NOPE SCORE.`);
    setActiveCraftResultSynced({
      entity: resultEntity,
      scoreLabel: grinderScoreLabel,
      scoreBonus: grinderScore,
      shouldOpenGoodFind: isForcedStickerBookFind(resultEntity, !wasNew),
      wasNew,
    });
    processDiscoveryEntity(resultEntity, nopeCountRef.current, {
      achievementStats: nextStats,
      awardDuplicateMaterial: false,
      skipDiscoveryScore: true,
      suppressGoodFindModal: true,
      trackDuplicateStreak: false,
    });
  }

  function addDevGrinderMaterials() {
    setDuplicateMaterialsSynced((currentMaterials) => ({
      ...DEFAULT_DUPLICATE_MATERIALS,
      ...currentMaterials,
      common: (currentMaterials.common ?? 0) + 10,
      uncommon: (currentMaterials.uncommon ?? 0) + 8,
      rare: (currentMaterials.rare ?? 0) + 6,
      epic: (currentMaterials.epic ?? 0) + 4,
      mythic: (currentMaterials.mythic ?? 0) + 5,
    }));
    addInstantNopeLine("dev material injected. shamefully useful.");
  }

  function addDevZRoll() {
    const nextTokens = zRollTokensRef.current + 1;
    zRollTokensRef.current = nextTokens;
    setZRollTokens(nextTokens);
    addInstantNopeLine("dev Z roll injected. probability is suspicious.");
  }

  function forceZAchievement() {
    const claimedSet = new Set(zTokenClaimedAchievementIdsRef.current);
    const forcedAchievement = achievements.find(
      (achievement) => Z_ROLL_ACHIEVEMENT_IDS.has(achievement.id) && !claimedSet.has(achievement.id),
    );

    if (!forcedAchievement) {
      addInstantNopeLine("dev Z achievement unavailable. reset clears claimed chamber ammo.");
      return;
    }

    if (!unlockedAchievementsRef.current.includes(forcedAchievement.id)) {
      const nextUnlockedIds = [...unlockedAchievementsRef.current, forcedAchievement.id];
      unlockedAchievementsRef.current = nextUnlockedIds;
      setUnlockedAchievements(nextUnlockedIds);
      setAchievementQueueSynced((currentQueue) => [
        ...currentQueue,
        createAchievementPopupPayload(forcedAchievement, { skipScore: true }),
      ]);
    }

    awardZRollTokensForAchievements([forcedAchievement]);
    startNextAchievement(0);
  }

  function closeZChamber() {
    isZChamberOpenRef.current = false;
    activeZRollResultRef.current = null;
    setIsZChamberOpen(false);
    setZChamberMode("real");
    setActiveZRollResult(null);
    startNextAchievement(450);
  }

  function openZChamber() {
    isZChamberOpenRef.current = true;
    setZChamberMode("real");
    setIsZChamberOpen(true);
    addInstantNopeLine("Z Chamber breathing.");
  }

  function enterZChamberTeaser() {
    showZChamberTeaserPopupRef.current = false;
    setShowZChamberTeaserPopup(false);
    activeZRollResultRef.current = null;
    setActiveZRollResult(null);
    setZChamberMode("teaser");
    isZChamberOpenRef.current = true;
    setIsZChamberOpen(true);
  }

  function closeZChamberTeaserPopup() {
    showZChamberTeaserPopupRef.current = false;
    setShowZChamberTeaserPopup(false);
    startNextZTokenPopup(450);
  }

  function closeZTokenPopup() {
    activeZTokenPopupRef.current = null;
    setActiveZTokenPopup(null);
    startNextZTokenPopup(450);
  }

  function enterZChamberFromTokenPopup() {
    activeZTokenPopupRef.current = null;
    setActiveZTokenPopup(null);
    openZChamber();
  }

  function rollZChamberTeaser() {
    const result = randomBetween(2, 100);
    addInstantNopeLine(`fake Z Chamber rolled ${result}. 1 was not invited.`);
    activeZRollResultRef.current = { result, type: "teaser-failure" };
    setActiveZRollResult({ result, type: "teaser-failure" });
    const nextStats = updateAchievementStats({ zChamberTeaserSeen: 1 });
    queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }), 450);
  }

  function openStickerBookFromZTeaserResult() {
    isZChamberOpenRef.current = false;
    activeZRollResultRef.current = null;
    setIsZChamberOpen(false);
    setZChamberMode("real");
    setActiveZRollResult(null);
    setIsStickerBookOpen(true);
    setStickerTab("achievements");
    startNextAchievement(450);
  }

  function openZNopeInBook() {
    isZChamberOpenRef.current = false;
    activeZRollResultRef.current = null;
    setIsZChamberOpen(false);
    setActiveZRollResult(null);
    setIsStickerBookOpen(true);
    setStickerTab("all");
    setStickerFilter("found");
    setHighlightedStickerId("znope");
    window.clearTimeout(firstStickerHighlightTimerRef.current);
    firstStickerHighlightTimerRef.current = window.setTimeout(() => {
      setHighlightedStickerId(null);
    }, 4200);
    startNextAchievement(450);
  }

  function awardZNopeSuccess(result = 1, { countAttempt = true, skipScore = false } = {}) {
    if (!zNopeEntity) {
      return;
    }

    if (znopeAcquiredRef.current) {
      activeZRollResultRef.current = { type: "already" };
      setActiveZRollResult({ type: "already" });
      return;
    }

    const nextAttempts = countAttempt ? zRollAttemptsRef.current + 1 : zRollAttemptsRef.current;
    zRollAttemptsRef.current = nextAttempts;
    if (countAttempt) {
      setZRollAttempts(nextAttempts);
    }
    znopeAcquiredRef.current = true;
    setZnopeAcquired(true);
    const nextCollectedIds = collectedIdsRef.current.includes(zNopeEntity.id)
      ? collectedIdsRef.current
      : [...collectedIdsRef.current, zNopeEntity.id];
    collectedIdsRef.current = nextCollectedIds;
    setCollectedIds(nextCollectedIds);
    recordFoundOrder(zNopeEntity.id);
    setSacrificedIdsSynced((currentIds) => currentIds.filter((id) => id !== zNopeEntity.id));
    const nextStats = updateAchievementStats({ zNopeAcquired: 1, ...(countAttempt ? { zRollAttempts: 1 } : {}) });
    setLatestDiscoveryId(zNopeEntity.id);
    addInstantNopeLine("Z NOPE acquired. probability has stopped taking calls.");
    const scoreBonus = skipScore ? 0 : awardNopeScore(NOPE_SCORE_VALUES.zNope, "z-nope", {
      displayLabel: "Z NOPE JACKPOT",
    });
    if (scoreBonus > 0) {
      addInstantNopeLine(`Z NOPE BONUS: +${formatScoreAmount(scoreBonus)} NOPE SCORE.`);
    }
    activeZRollResultRef.current = { result, scoreBonus, type: "success" };
    setActiveZRollResult({ result, scoreBonus, type: "success" });
    queueAchievementUnlocks(buildAchievementSnapshot({
      achievementStats: nextStats,
      collectedIds: nextCollectedIds,
      zNopeAcquired: 1,
      zRollAttempts: nextAttempts,
    }), 650, { skipScore });
  }

  function forceZSuccess() {
    awardZNopeSuccess(1, { countAttempt: true, skipScore: true });
  }

  function rollZChamber() {
    if (!zNopeEntity) {
      return;
    }

    if (znopeAcquiredRef.current) {
      activeZRollResultRef.current = { type: "already" };
      setActiveZRollResult({ type: "already" });
      return;
    }

    if (zRollTokensRef.current <= 0) {
      activeZRollResultRef.current = { type: "empty" };
      setActiveZRollResult({ type: "empty" });
      return;
    }

    const result = randomBetween(1, 100);
    const nextTokens = zRollTokensRef.current - 1;
    const nextAttempts = zRollAttemptsRef.current + 1;
    zRollTokensRef.current = nextTokens;
    zRollAttemptsRef.current = nextAttempts;
    setZRollTokens(nextTokens);
    setZRollAttempts(nextAttempts);

    if (result === 1) {
      awardZNopeSuccess(result, { countAttempt: false });
      return;
    }

    const nextFailures = zRollFailuresRef.current + 1;
    zRollFailuresRef.current = nextFailures;
    setZRollFailures(nextFailures);
    const nextStats = updateAchievementStats({ zRollAttempts: 1, zRollFailures: 1 });
    addInstantNopeLine(`Z Chamber rolled ${result}. that is not 1.`);
    const scoreBonus = awardNopeScore(NOPE_SCORE_VALUES.zRollFailure, "z-roll-failure");
    advanceCurrentBadIdea("zFail");
    addInstantNopeLine(`Z FAILURE BONUS: +${formatScoreAmount(scoreBonus)} NOPE SCORE. you lost correctly.`);
    addInstantNopeLine("Z said no. statistically rude.");
    activeZRollResultRef.current = { result, scoreBonus, type: "failure" };
    setActiveZRollResult({ result, scoreBonus, type: "failure" });
    queueAchievementUnlocks(buildAchievementSnapshot({
      achievementStats: nextStats,
      zRollAttempts: nextAttempts,
      zRollFailures: nextFailures,
    }), 450);
  }

  function forceCommonDuplicate() {
    const collectedCommon = standardNopeEntities.find((entity) => entity.rarity === "common" && collectedIdsRef.current.includes(entity.id));

    if (collectedCommon) {
      processDiscoveryEntity(collectedCommon, nopeCountRef.current, { skipScore: true });
      return;
    }

    const commonEntity = standardNopeEntities.find((entity) => entity.rarity === "common");

    if (!commonEntity) {
      addInstantNopeLine("common duplicate failed. somehow common trash was missing.");
      return;
    }

    processDiscoveryEntity(commonEntity, nopeCountRef.current, { skipScore: true });
    processDiscoveryEntity(commonEntity, nopeCountRef.current, { skipScore: true });
  }

  function pressNope() {
    triggerTelegramHaptic("light");
    resetNopeIdleTimer();
    addInstantNopeLine("press detected. standards lowered.");

    const nextLabel = pickRandom(nopeLabels);
    const discoveredEntity = getNextDiscoveryEntity();
    const nextCount = nopeCountRef.current + 1;
    const nextRank = getRank(nextCount);
    const rankChanged = nextRank !== getRank(nopeCountRef.current);

    nopeCountRef.current = nextCount;
    setNopeCount(nextCount);
    pendingGlobalNopesRef.current += 1;
    awardNopeScore(NOPE_SCORE_VALUES.press, "press");
    advanceCurrentBadIdea("press");

    if (nextCount === 3) {
      addInstantNopeLine("user continues. concerning.");
    } else if (nextCount === 10) {
      addInstantNopeLine("press velocity increasing.");
    } else if (nextCount > 0 && nextCount % 50 === 0) {
      addInstantNopeLine("button abuse detected.");
    }

    if (globalNopeCountRef.current !== null) {
      const optimisticGlobalCount = globalNopeCountRef.current + 1;
      globalNopeCountRef.current = optimisticGlobalCount;
      setGlobalNopeCount(optimisticGlobalCount);
      setIsGlobalCounterAvailable(true);
    }

    if (discoveredEntity) {
      processDiscoveryEntity(discoveredEntity, nextCount);
    } else {
      setDuplicateStreak(0);
      showBreachOverlay(getCollectedGifChaosEvent());
      addInstantNopeLine(pickRandom([
        "empty pull. emotional damage applied.",
        "nothing happened. impressive.",
        ...noHitMessages,
      ]));

      queueAchievementUnlocks(
        buildAchievementSnapshot({
          achievementStats: achievementStatsRef.current,
          collectedIds: collectedIdsRef.current,
          nopeCount: nextCount,
        }),
        0,
        { skipCombo: true },
      );
    }

    setButtonText(nextLabel);
    setIsGlitching(true);

    window.clearTimeout(glitchTimerRef.current);
    glitchTimerRef.current = window.setTimeout(() => {
      setIsGlitching(false);
      setButtonText("NOPE");
    }, 430);

    if (rankChanged) {
      addInstantNopeLine(`rank updated: ${nextRank}. value still zero.`);
    }
  }

  function getStickerEntities() {
    if (stickerTab === "achievements" || stickerTab === "grinder") {
      return [];
    }

    if (stickerTab === "normal") {
      return standardNopeEntities;
    }

    if (stickerTab === "gif") {
      return forbiddenNopeGifs;
    }

    return stickerGridEntities;
  }

  function getVisibleStickerEntities() {
    return getStickerEntities().filter((entity) => {
      const isCollected = collectedIds.includes(entity.id);

      if (stickerFilter === "found") {
        return isCollected;
      }

      if (stickerFilter === "missing") {
        return !isCollected;
      }

      return true;
    });
  }

  function getVisibleMythicEntities() {
    return mythicNopeRelics.filter((entity) => {
      const isCollected = collectedIds.includes(entity.id);

      if (stickerFilter === "found") {
        return isCollected;
      }

      if (stickerFilter === "missing") {
        return !isCollected;
      }

      return true;
    });
  }

  function getVisibleUberEntities() {
    return uberNopeRelics.filter((entity) => collectedIds.includes(entity.id));
  }

  function getFoundScopeEntities() {
    if (stickerTab === "all") {
      const seenIds = new Set();

      return allNopeEntities.filter((entity) => {
        if (!entity || seenIds.has(entity.id)) {
          return false;
        }

        seenIds.add(entity.id);
        return true;
      });
    }

    return getStickerEntities();
  }

  function getFoundAlbumSections() {
    const activeFoundIds = new Set(collectedIds.filter((id) => !sacrificedIds.includes(id)));
    const scopeIds = new Set(getFoundScopeEntities().map((entity) => entity.id));
    const foundEntities = getFoundScopeEntities().filter((entity) => activeFoundIds.has(entity.id));
    const recentSeenIds = new Set();
    const recentEntities = [...foundOrderIds]
      .reverse()
      .map(getNopeEntity)
      .filter((entity) => {
        if (!entity || recentSeenIds.has(entity.id) || !activeFoundIds.has(entity.id) || !scopeIds.has(entity.id)) {
          return false;
        }

        recentSeenIds.add(entity.id);
        return true;
      })
      .slice(0, 10);
    const sections = [
      {
        emptyBody: "press NOPE and lower your standards.",
        emptyTitle: "NO RECENT TRASH.",
        entities: recentEntities,
        key: "recent",
        subtitle: recentEntities.length > 0 ? "freshly recovered trash. also filed below." : "freshly recovered trash.",
        title: "RECENTLY FOUND",
      },
    ];

    if (stickerTab === "all" || stickerTab === "gif") {
      sections.push({
        entities: foundEntities.filter((entity) => entity.type === "gif"),
        key: "loops",
        subtitle: "animated mistakes, kept near the top.",
        title: "FORBIDDEN LOOPS",
      });
    }

    if (stickerTab === "all" && zNopeEntity && activeFoundIds.has(zNopeEntity.id)) {
      sections.push({
        entities: [zNopeEntity],
        key: "z",
        subtitle: "the final NO has been filed.",
        title: "Z NOPE / Z SIGNAL",
      });
    }

    [
      ["uber", "UBER NOPE", "classified trash. somehow recovered."],
      ["mythic", "MYTHIC NOPE", "rare nonsense with a louder shelf."],
      ["epic", "EPIC NOPE", "premium disappointment."],
      ["rare", "RARE NOPE", "less common, equally useless."],
      ["uncommon", "UNCOMMON NOPE", "minor scarcity event."],
      ["common", "COMMON NOPE", "baseline trash archive."],
    ].forEach(([rarity, title, subtitle]) => {
      if (stickerTab === "gif") {
        return;
      }

      sections.push({
        entities: foundEntities.filter((entity) => {
          if (rarity === "uber") {
            return entity.type === "uber";
          }

          if (rarity === "mythic") {
            return entity.type === "mythic" || entity.rarity === "mythic";
          }

          return entity.rarity === rarity && entity.type !== "gif";
        }),
        key: rarity,
        subtitle,
        title,
      });
    });

    return sections.filter((section) => section.key === "recent" || section.entities.length > 0);
  }

  function getSacrificedEntities() {
    return sacrificedIds.map(getNopeEntity).filter(Boolean);
  }

  function getStickerShareUrl(entity) {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${siteUrl}/share/${encodeURIComponent(entity.id)}`;
  }

  // Vercel serves /share/:id through /api/share so social crawlers get
  // sticker-specific OG tags and a generated /api/og card image.
  function getShareText(entity) {
    const shareUrl = getStickerShareUrl(entity);
    const oddsText = `odds: ${formatDropChance(entity.dropChance)}`;

    if (entity.type === "z" || entity.id === "znope") {
      return `I pulled Z NOPE from the Z CHAMBER.

odds: 1%
source: cursed achievement roll
value: still zero.

$NOPE

${shareUrl}`;
    }

    if (entity.type === "uber") {
      return `UBER NOPE BREACH:
${entity.name}

${oddsText}
probability has been insulted.
value: still zero.

$NOPE

${shareUrl}`;
    }

    if (entity.type === "mythic") {
      return `MYTHIC NOPE BREACH:
${entity.name}

${oddsText}
probability wasted.
value: still zero.

$NOPE

${shareUrl}`;
    }

    if (entity.type === "gif") {
      let warningLine = "";

      if (entity.rarity === "illegal") {
        warningLine = "NOPE OS should not have shown you this.\n";
      } else if (entity.rarity === "cursed") {
        warningLine = "this should not have happened.\n";
      }

      return `${getLoopLeakTitle(entity)}:
${entity.name}

${oddsText}
${warningLine}value: animated zero.

$NOPE

${shareUrl}`;
    }

    return `I pulled ${entity.name} from the NOPEDEX.

${entity.rarityLabel}
${oddsText}
value: emotionally zero.

$NOPE

${shareUrl}`;
  }

  function openShareWindow(entity, destination) {
    const shareText = getShareText(entity);
    const stickerShareUrl = getStickerShareUrl(entity);
    const shareUrl =
      destination === "telegram"
        ? `https://t.me/share/url?url=${encodeURIComponent(stickerShareUrl)}&text=${encodeURIComponent(shareText)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(stickerShareUrl)}`;

    const nextStats = updateAchievementStats({ shareCount: 1 });
    queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  async function copyShareText(entity) {
    try {
      await navigator.clipboard.writeText(getShareText(entity));
      const nextStats = updateAchievementStats({ shareCopyCount: 1, shareCount: 1 });
      queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
      setCopiedShareId(entity.id);
      window.clearTimeout(shareCopyTimerRef.current);
      shareCopyTimerRef.current = window.setTimeout(() => {
        setCopiedShareId(null);
      }, 1200);
      addInstantNopeLine("share text copied. influence not included.");
    } catch {
      addInstantNopeLine("share text refused to copy. very on brand.");
    }
  }

  function getAchievementShareUrl(achievement) {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${siteUrl}/share/achievement/${encodeURIComponent(achievement.id)}`;
  }

  function getAchievementShareText(achievement) {
    const shareUrl = getAchievementShareUrl(achievement);

    return `I unlocked a pointless NOPE achievement:

${achievement.name}

${achievement.description}
reward: ${achievement.reward}
value gained: zero.

$NOPE

${shareUrl}`;
  }

  function openAchievementShareWindow(achievement, destination) {
    const shareText = getAchievementShareText(achievement);
    const achievementShareUrl = getAchievementShareUrl(achievement);
    const shareUrl =
      destination === "telegram"
        ? `https://t.me/share/url?url=${encodeURIComponent(achievementShareUrl)}&text=${encodeURIComponent(shareText)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(achievementShareUrl)}`;

    const nextStats = updateAchievementStats({ shareCount: 1 });
    queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  async function copyAchievementShareText(achievement) {
    try {
      await navigator.clipboard.writeText(getAchievementShareText(achievement));
      const nextStats = updateAchievementStats({ shareCopyCount: 1, shareCount: 1 });
      queueAchievementUnlocks(buildAchievementSnapshot({ achievementStats: nextStats }));
      setCopiedShareId(`achievement:${achievement.id}`);
      window.clearTimeout(shareCopyTimerRef.current);
      shareCopyTimerRef.current = window.setTimeout(() => {
        setCopiedShareId(null);
      }, 1200);
      addInstantNopeLine("achievement share copied. reward still missing.");
    } catch {
      addInstantNopeLine("achievement refused to copy. impressive failure.");
    }
  }

  function openStickerInspect(entity) {
    if (isInspectModalBlocked) {
      return;
    }

    setActiveAchievementInspect(null);
    setActiveStickerInspectEntity(entity);
  }

  function openAchievementInspect(achievement) {
    if (isInspectModalBlocked) {
      return;
    }

    setActiveStickerInspectEntity(null);
    setActiveAchievementInspect(achievement);
  }

  function handleInspectCardKeyDown(event, openInspect) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openInspect();
  }

  function handleCardActionClick(event, action) {
    event.stopPropagation();
    action();
  }

  function getAchievementDisplayTier(achievementId) {
    const zAchievementIds = new Set([
      "five-z-rolls-still-nope",
      "first-try-disgusting",
      "ten-z-rolls-zero-z",
      "the-final-no",
      "z-heard-you",
      "z-nope-failed-once",
    ]);
    const cursedAchievementIds = new Set([
      "absolute-degenerate",
      "ascended-into-nope",
      "both-options-rejected",
      "final-boss-press",
      "god-left-the-chat",
      "mythic-bonfire",
      "mythic-recycling",
      "mythically-useless",
      "nopedex-heretic",
      "nope-or-no-achievement",
      "nope-or-nothing-achievement",
      "probability-launderer",
      "total-nopeification",
      "uberly-pointless",
    ]);
    const specialAchievementIds = new Set([
      "again-really",
      "accidental-skill",
      "ash-collector",
      "ashes-to-nopedex",
      "bad-idea-addict",
      "bad-idea-enjoyer",
      "big-number-still-zero",
      "burn-notice",
      "burn-pile-curator",
      "colour-blind-regret",
      "combo-goblin",
      "common-mistake",
      "duplicate-damage",
      "emotional-recycling",
      "epic-waste-facility",
      "feed-the-machine",
      "found-in-the-ashes",
      "found-the-static",
      "fuel-goblin",
      "fuel-hoarder",
      "industrial-regret",
      "keep-on-rolling",
      "machine-is-hungry",
      "overcharged-nothing",
      "phoenix-nopedex",
      "purple-problem",
      "rarely-worth-it",
      "red-flag-clicker",
      "scorched-earth",
      "save-it-for-what",
      "signal-goblin",
      "signal-battery",
      "static-addict",
      "surge-abuser",
      "the-number-wont-stop",
      "trash-alchemist",
      "upgraded-nothing",
    ]);

    if (zAchievementIds.has(achievementId)) {
      return { className: "achievement-tier-z", label: "FINAL BOSS" };
    }

    if (cursedAchievementIds.has(achievementId)) {
      return { className: "achievement-tier-cursed", label: "CURSED" };
    }

    if (specialAchievementIds.has(achievementId)) {
      return { className: "achievement-tier-special", label: "BAD IDEA" };
    }

    return { className: "achievement-tier-basic", label: "BASIC" };
  }

  function renderAchievementCard(achievement, index) {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    const displayTier = getAchievementDisplayTier(achievement.id);
    const grantsZRoll = Z_ROLL_ACHIEVEMENT_IDS.has(achievement.id);

    return (
      <article
        className={`achievement-card ${displayTier.className} ${isUnlocked ? "achievement-unlocked" : "achievement-locked"}`}
        key={achievement.id}
        role="button"
        tabIndex={0}
        onClick={() => openAchievementInspect(achievement)}
        onKeyDown={(event) => handleInspectCardKeyDown(event, () => openAchievementInspect(achievement))}
        style={{ "--achievement-tilt": `${((index % 5) - 2) * 0.45}deg` }}
      >
        <div className="achievement-card-badges">
          <span className="achievement-status-badge">{isUnlocked ? "UNLOCKED" : "LOCKED"}</span>
          <span className="achievement-tier-badge">{displayTier.label}</span>
          {grantsZRoll && <span className="achievement-z-roll-badge">Z ROLL</span>}
        </div>
        <div className="achievement-card-mark" aria-hidden="true">
          {isUnlocked ? "OWNED" : "???"}
        </div>
        <strong>{achievement.name}</strong>
        <p>{achievement.description}</p>
        <em className="achievement-reward">
          <small>reward:</small>
          {achievement.reward}
        </em>
        {isUnlocked ? (
          <div className="sticker-share-row achievement-share-row" aria-label={`Share ${achievement.name}`}>
            <button type="button" onClick={(event) => handleCardActionClick(event, () => openAchievementShareWindow(achievement, "x"))}>
              X
            </button>
            <button type="button" onClick={(event) => handleCardActionClick(event, () => openAchievementShareWindow(achievement, "telegram"))}>
              TG
            </button>
            <button type="button" onClick={(event) => handleCardActionClick(event, () => copyAchievementShareText(achievement))}>
              {copiedShareId === `achievement:${achievement.id}` ? "COPIED" : "COPY"}
            </button>
          </div>
        ) : null}
      </article>
    );
  }

  function getVisibleAchievements() {
    return achievements.filter((achievement) => {
      const isUnlocked = unlockedAchievements.includes(achievement.id);

      if (stickerFilter === "found") {
        return isUnlocked;
      }

      if (stickerFilter === "missing") {
        return !isUnlocked;
      }

      return true;
    });
  }

  function renderGrinderRecipe(recipe) {
    const currentAmount = duplicateMaterials[recipe.source] ?? 0;
    const neededAmount = Math.max(recipe.cost - currentAmount, 0);
    const canGrind = neededAmount === 0;
    const sourceName = DUPLICATE_MATERIAL_LABELS[recipe.source].replace(" NOPE", "");
    const targetName = (recipe.target === "uber" ? "UBER NOPE" : DUPLICATE_MATERIAL_LABELS[recipe.target]).replace(" NOPE", "");

    return (
      <article className={`grinder-recipe-card ${canGrind ? "ready" : "idle"}`} key={recipe.source}>
        <strong>{sourceName} FUEL</strong>
        <span className="grinder-fuel-count">{currentAmount} / {recipe.cost}</span>
        <span className="grinder-recipe-line">{recipe.cost} {sourceName} &rarr; 1 {targetName}</span>
        <button type="button" onClick={() => grindDuplicateMaterial(recipe)} disabled={!canGrind}>
          {canGrind ? "FEED THE MACHINE" : "NOT ENOUGH TRASH"}
        </button>
        <em>{canGrind ? "ready to upgrade disappointment." : `machine still hungry: ${neededAmount} more fuel`}</em>
      </article>
    );
  }

  function renderSacrificedCard(entity) {
    return (
      <article
        className={`burn-pile-card rarity-${entity.rarity}`}
        key={entity.id}
        role="button"
        tabIndex={0}
        onClick={() => openStickerInspect(entity)}
        onKeyDown={(event) => handleInspectCardKeyDown(event, () => openStickerInspect(entity))}
      >
        <div className="burn-pile-media">
          <img
            src={entity.image}
            alt={entity.name}
            onError={(event) => {
              event.currentTarget.classList.add("image-missing");
            }}
          />
        </div>
        <strong>{entity.name}</strong>
        <span>SACRIFICED</span>
        <p>fed to the grinder.</p>
        <em>find it again, idiot.</em>
      </article>
    );
  }

  function renderFoundAlbumSection(section) {
    return (
      <section className={`found-album-section found-album-section-${section.key}`} key={section.key} aria-label={section.title}>
        <div className="found-album-section-title">
          <strong>{section.title}</strong>
          <span>{section.subtitle}</span>
        </div>
        {section.entities.length > 0 ? (
          <div className="sticker-grid found-album-grid">{section.entities.map(renderStickerCard)}</div>
        ) : (
          <div className="found-album-empty">
            <strong>{section.emptyTitle}</strong>
            <span>{section.emptyBody}</span>
          </div>
        )}
      </section>
    );
  }

  function renderFoundAlbumSections() {
    return <div className="found-album">{getFoundAlbumSections().map(renderFoundAlbumSection)}</div>;
  }

  function renderStickerCard(entity, index) {
    const isCollected = collectedIds.includes(entity.id);
    const isGif = entity.type === "gif";
    const isMythic = entity.type === "mythic";
    const isUber = entity.type === "uber";
    const isZ = entity.type === "z";
    const canSacrifice = isSacrificeEligible(entity);
    const duplicateCount = isCollected && !sacrificedIds.includes(entity.id) ? duplicateCopies[entity.id] ?? 0 : 0;
    const totalCopies = duplicateCount + 1;
    const hasDuplicates = totalCopies > 1;

    return (
      <article
        className={`sticker-card ${isCollected ? "collected" : "locked"} ${hasDuplicates ? "has-duplicates" : ""} ${isGif ? "gif-card" : ""} ${isMythic ? "mythic-card" : ""} ${isUber ? "uber-card" : ""} ${isZ ? "z-card" : ""} rarity-${entity.rarity} ${highlightedStickerId === entity.id ? isZ ? "z-card-highlight" : isUber ? "uber-card-highlight" : "first-sticker-highlight" : ""}`}
        data-sticker-id={entity.id}
        key={entity.id}
        role="button"
        tabIndex={0}
        onClick={() => openStickerInspect(entity)}
        onKeyDown={(event) => handleInspectCardKeyDown(event, () => openStickerInspect(entity))}
        style={{ "--sticker-tilt": `${((index % 5) - 2) * 1.25}deg` }}
      >
        {isCollected ? (
          <>
            {hasDuplicates && <b className="sticker-duplicate-badge">x{totalCopies}</b>}
            <div className="sticker-media">
              <img
                src={entity.image}
                alt={entity.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            </div>
            <strong>{entity.name}</strong>
            <span>{entity.rarityLabel}</span>
            <p>{entity.caption}</p>
            <em>drop: {formatDropChance(entity.dropChance)}</em>
            <em>{isZ ? "value: still zero" : "value: zero"}</em>
            <div className="sticker-share-row" aria-label={`Share ${entity.name}`}>
              <button type="button" onClick={(event) => handleCardActionClick(event, () => openShareWindow(entity, "x"))}>
                X
              </button>
              <button type="button" onClick={(event) => handleCardActionClick(event, () => openShareWindow(entity, "telegram"))}>
                TG
              </button>
              <button type="button" onClick={(event) => handleCardActionClick(event, () => copyShareText(entity))}>
                {copiedShareId === entity.id ? "COPIED" : "COPY"}
              </button>
            </div>
            {canSacrifice && (
              <button className="sticker-sacrifice-button" type="button" onClick={(event) => handleCardActionClick(event, () => requestSacrifice(entity))}>
                BURN FOR FUEL
              </button>
            )}
            {isUber && !sacrificedIds.includes(entity.id) && (
              <button className="sticker-sacrifice-button uber-sacrifice-button" type="button" onClick={(event) => handleCardActionClick(event, () => requestUberSacrifice(entity))}>
                SACRIFICE UBER
              </button>
            )}
          </>
        ) : (
          <>
            <div className="sticker-locked-mark">???</div>
            <strong>{isMythic ? entity.name : isGif ? `${entity.rarityLabel} MISSING` : "NOT FOUND"}</strong>
            <span>{isMythic ? "MYTHIC NOPE" : entity.rarityLabel}</span>
            <p>{isMythic ? "drop chance: 0.5%" : isGif ? "probability: disrespectful" : "press nope harder"}</p>
            <em>drop: {formatDropChance(entity.dropChance)}</em>
          </>
        )}
      </article>
    );
  }

  function renderStickerInspectModal() {
    if (!activeStickerInspectEntity) {
      return null;
    }

    const entity = activeStickerInspectEntity;
    const isCollected = collectedIds.includes(entity.id);
    const isSacrificed = sacrificedIds.includes(entity.id);
    const duplicateCount = isCollected && !isSacrificed ? duplicateCopies[entity.id] ?? 0 : 0;
    const totalCopies = duplicateCount + 1;
    const canShare = isCollected && !isSacrificed;
    const statusText = isSacrificed ? "sacrificed" : isCollected ? "collected" : "not found";
    const valueText = entity.type === "gif"
      ? "value: animated zero."
      : entity.type === "z"
        ? "value: still zero."
        : entity.type === "uber"
          ? "value: probability insulted."
          : "value: emotionally zero.";

    return (
      <section
        className={`inspect-modal-overlay sticker-inspect-overlay rarity-${entity.rarity} ${entity.type === "uber" ? "uber-inspect-overlay" : ""} ${entity.type === "z" ? "z-inspect-overlay" : ""}`}
        aria-modal="true"
        role="dialog"
        onClick={(event) => handleModalBackdropClick(event, closeInspectModals)}
      >
        <div className={`inspect-modal-card sticker-inspect-card rarity-${entity.rarity} ${isSacrificed ? "sacrificed" : ""} ${entity.type === "gif" ? "gif-inspect-card" : ""} ${entity.type === "mythic" ? "mythic-inspect-card" : ""} ${entity.type === "uber" ? "uber-inspect-card" : ""} ${entity.type === "z" ? "z-inspect-card" : ""}`}>
          <button className="inspect-close-button" type="button" onClick={closeInspectModals} aria-label="Close sticker preview">
            X
          </button>
          <div className="inspect-media">
            {isCollected || isSacrificed ? (
              <img
                src={entity.image}
                alt={entity.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            ) : (
              <div className="inspect-missing-mark">???</div>
            )}
          </div>
          <div className="inspect-detail-panel">
            <p>{entity.type === "z" && !isCollected && !isSacrificed ? "Z SIGNAL UNRESOLVED" : isCollected || isSacrificed ? entity.name : "MISSING NOPE"}</p>
            <strong>{entity.rarityLabel}</strong>
            <span>odds: {entity.type === "z" ? "1%" : formatDropChance(entity.dropChance)}</span>
            {entity.type === "z" && <span>source: Z CHAMBER</span>}
            {entity.caption && <em>{entity.type === "z" && isCollected ? "The final NO has been documented. Flex responsibly. Or don't." : isCollected || isSacrificed ? entity.caption : entity.type === "z" ? "source: Z Chamber only." : "hint: press NOPE harder."}</em>}
            <b>{valueText}</b>
            <small>status: {statusText}</small>
            {isCollected && !isSacrificed && <small>copies: x{totalCopies}</small>}
            {isSacrificed && <small>fed to the grinder. find it again, idiot.</small>}
            {!isCollected && !isSacrificed && <small>{entity.type === "z" ? "Earn a Z Roll. Roll 1. Probably don't." : "hint: press NOPE harder."}</small>}
            {entity.type === "uber" && <small>probability has been insulted.</small>}
            {canShare && (
              <div className="inspect-action-row" aria-label={`Share ${entity.name}`}>
                <button type="button" onClick={() => openShareWindow(entity, "x")}>
                  X
                </button>
                <button type="button" onClick={() => openShareWindow(entity, "telegram")}>
                  TG
                </button>
                <button type="button" onClick={() => copyShareText(entity)}>
                  {copiedShareId === entity.id ? "COPIED" : "COPY"}
                </button>
              </div>
            )}
            <button className="inspect-dismiss-button" type="button" onClick={closeInspectModals}>
              close
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderAchievementInspectModal() {
    if (!activeAchievementInspect) {
      return null;
    }

    const achievement = activeAchievementInspect;
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    const displayTier = getAchievementDisplayTier(achievement.id);
    const grantsZRoll = Z_ROLL_ACHIEVEMENT_IDS.has(achievement.id);

    return (
      <section
        className={`inspect-modal-overlay achievement-inspect-overlay ${displayTier.className} ${isUnlocked ? "unlocked" : "locked"}`}
        aria-modal="true"
        role="dialog"
        onClick={(event) => handleModalBackdropClick(event, closeInspectModals)}
      >
        <div className={`inspect-modal-card achievement-inspect-card ${displayTier.className} ${isUnlocked ? "unlocked" : "locked"}`}>
          <button className="inspect-close-button" type="button" onClick={closeInspectModals} aria-label="Close achievement preview">
            X
          </button>
          <p>{isUnlocked ? "ACHIEVEMENT UNLOCKED" : "ACHIEVEMENT LOCKED"}</p>
          <strong>{achievement.name}</strong>
          <span>{displayTier.label}</span>
          {grantsZRoll && <span>Z reward: +1 chamber roll</span>}
          <em>{achievement.description}</em>
          <b>reward: {achievement.reward}</b>
          <small>status: {isUnlocked ? "unlocked" : "thankfully not achieved yet."}</small>
          <small>value gained: zero.</small>
          {isUnlocked && (
            <div className="inspect-action-row" aria-label={`Share ${achievement.name}`}>
              <button type="button" onClick={() => openAchievementShareWindow(achievement, "x")}>
                X
              </button>
              <button type="button" onClick={() => openAchievementShareWindow(achievement, "telegram")}>
                TG
              </button>
              <button type="button" onClick={() => copyAchievementShareText(achievement)}>
                {copiedShareId === `achievement:${achievement.id}` ? "COPIED" : "COPY"}
              </button>
            </div>
          )}
          <button className="inspect-dismiss-button" type="button" onClick={closeInspectModals}>
            close
          </button>
        </div>
      </section>
    );
  }

  function renderZChamberPanel() {
    const isAcquired = znopeAcquired || collectedIds.includes("znope");
    const zSignalStatus = isAcquired ? "acquired" : zRollTokens > 0 ? "ready" : "unresolved";
    const zSignalCopy = isAcquired
      ? "Z NOPE documented. probability remains upset."
      : zRollTokens > 0
        ? "Z Chamber access available. terrible idea."
        : "Z NOPE is not in the normal machine.";

    return (
      <section className={`z-chamber-panel ${isAcquired ? "acquired" : zRollTokens > 0 ? "ready" : "locked"} ${isZSignalExpanded ? "expanded" : "collapsed"}`} aria-label="Z Signal">
        <div className="z-signal-compact">
          <div className="z-signal-compact-main">
            <strong>Z SIGNAL // {zSignalStatus}</strong>
            <span>charge: {zSignalChargePercent}%</span>
            <span>rolls: {zRollTokens}</span>
            <small>source: Z CHAMBER only</small>
          </div>
          <p>{isAcquired ? "Z NOPE acquired. the final refusal has been documented." : zSignalCopy}</p>
          {!isAcquired && (
            <em>
              Earn a Z Roll. Roll 1. Probably don't.
            </em>
          )}
          <button type="button" onClick={() => setIsZSignalExpanded((isExpanded) => !isExpanded)} aria-expanded={isZSignalExpanded}>
            {isZSignalExpanded ? "COLLAPSE Z SIGNAL" : isAcquired ? "VIEW Z SIGNAL" : "OPEN Z SIGNAL"}
          </button>
        </div>
        {isZSignalExpanded && (
          <div className="z-signal-expanded">
            <strong>{isAcquired ? "Z SIGNAL DETECTED" : "Z SIGNAL"}</strong>
            <span>Z Signal Charge: {zSignalChargePercent}%</span>
            <span>Z Rolls: {zRollTokens}</span>
            <em>source: Z CHAMBER only // odds: 1%</em>
            {isAcquired && <em>the rarest refusal has entered the NOPEDEX.</em>}
            {isAcquired && zNopeEntity ? (
              <div className="z-chamber-card-wrap">{renderStickerCard(zNopeEntity, 0)}</div>
            ) : (
              <div className="z-signal-teaser">
                <b>Z SIGNAL</b>
                <small>status: unresolved</small>
                <small>source: Z CHAMBER only</small>
                <small>odds: 1%</small>
                <span>The final NOPE is not in the normal machine.</span>
                <span>Earn a Z Roll.</span>
                <span>Roll 1.</span>
                <span>Probably don't.</span>
              </div>
            )}
            <div className="z-signal-expanded-actions">
              {zRollTokens > 0 && !isAcquired && (
                <button type="button" onClick={openZChamber}>
                  [ ENTER Z CHAMBER ]
                </button>
              )}
              <button type="button" onClick={() => setIsZSignalExpanded(false)}>
                COLLAPSE Z SIGNAL
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderZChamberModal() {
    if (!isZChamberOpen && !activeZRollResult) {
      return null;
    }

    const isSuccess = activeZRollResult?.type === "success";
    const isFailure = activeZRollResult?.type === "failure";
    const isTeaserFailure = activeZRollResult?.type === "teaser-failure";
    const isAlready = activeZRollResult?.type === "already";
    const isEmpty = activeZRollResult?.type === "empty";
    const isTeaser = zChamberMode === "teaser";

    return (
      <section className="z-chamber-modal-overlay" aria-modal="true" role="dialog" onClick={(event) => handleModalBackdropClick(event, closeZChamber)}>
        <div className={`z-chamber-modal-card ${isSuccess ? "success" : isFailure || isTeaserFailure ? "failure" : ""}`}>
          {isSuccess && zNopeEntity ? (
            <>
              <p>THE FINAL NO HAS ARRIVED</p>
              <div className="first-sticker-modal-media z-chamber-media">
                <img
                  src={zNopeEntity.image}
                  alt={zNopeEntity.name}
                  onError={(event) => {
                    event.currentTarget.classList.add("image-missing");
                  }}
                />
              </div>
              <strong>Z NOPE</strong>
              <span>rarity: Z NOPE</span>
              <em>odds: 1%</em>
              <em>source: Z CHAMBER</em>
              {activeZRollResult.scoreBonus > 0 && <b>Z NOPE BONUS: +{formatScoreAmount(activeZRollResult.scoreBonus)} NOPE SCORE</b>}
              <b>value: still zero</b>
              <small>The rarest refusal has entered your NOPEDEX.</small>
              <small>Probability has stopped taking calls.</small>
              <button type="button" onClick={openZNopeInBook}>
                OPEN STICKER BOOK. WORSHIP NOTHING.
              </button>
            </>
          ) : isTeaserFailure ? (
            <>
              <p>Z SAID NOPE</p>
              <strong>ROLL RESULT: {activeZRollResult.result} / 100</strong>
              <span>You needed 1.</span>
              <span>The machine disabled 1.</span>
              <b>That feels important.</b>
              <small>Real Z rolls come from cursed achievements.</small>
              <div className="z-chamber-actions">
                <button type="button" onClick={closeZChamber}>
                  BACK TO THE BUTTON
                </button>
                <button type="button" onClick={openStickerBookFromZTeaserResult}>
                  SHOW ME THE STICKER BOOK
                </button>
              </div>
            </>
          ) : isFailure ? (
            <>
              <p>Z SAID NOPE</p>
              <span>You needed 1.</span>
              <span>You rolled {activeZRollResult.result}.</span>
              <b>That is not 1.</b>
              {activeZRollResult.scoreBonus > 0 && (
                <>
                  <strong>Z FAILURE BONUS</strong>
                  <b>+{formatScoreAmount(activeZRollResult.scoreBonus)} NOPE SCORE</b>
                </>
              )}
              <div className="z-chamber-actions">
                {zRollTokens > 0 ? (
                  <button type="button" onClick={rollZChamber}>
                    ROLL AGAIN IF YOU CAN
                  </button>
                ) : (
                  <button type="button" disabled>
                    NO ROLLS LEFT. BRILLIANT.
                  </button>
                )}
                <button type="button" onClick={closeZChamber}>
                  LEAVE THE CHAMBER
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{isTeaser ? "Z CHAMBER // UNSTABLE ACCESS" : "Z CHAMBER"}</p>
              <strong>{isTeaser ? "TEASER ROLL: 1" : isAlready ? "Z NOPE ALREADY ACQUIRED." : "Z ROLLS: " + zRollTokens}</strong>
              <span>{isTeaser ? "Roll 1-100." : isAlready ? "the machine cannot improve on refusal." : "Roll 1-100."}</span>
              {isTeaser && <span>Roll 1 would receive Z NOPE.</span>}
              {isTeaser && <span>This roll cannot roll 1.</span>}
              {isTeaser && <span>The machine is showing off.</span>}
              {!isTeaser && !isAlready && <span>Roll 1 and receive Z NOPE.</span>}
              {!isTeaser && !isAlready && <span>Roll anything else and receive emotional damage.</span>}
              {isEmpty && <b>NO Z ROLLS REMAIN.</b>}
              {isEmpty && <small>unlock cursed achievements or regret everything.</small>}
              <div className="z-chamber-actions">
                <button type="button" onClick={isTeaser ? rollZChamberTeaser : rollZChamber} disabled={!isTeaser && (zRollTokens <= 0 || znopeAcquired)}>
                  {isTeaser ? "ROLL THE FAKE Z" : zRollTokens <= 0 ? "NO Z ROLLS REMAIN." : "ROLL THE Z"}
                </button>
                <button type="button" onClick={closeZChamber}>
                  LEAVE BEFORE IT GETS WORSE
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  function renderZTokenPopup() {
    if (!activeZTokenPopup) {
      return null;
    }

    return (
      <section className="z-token-modal-overlay" aria-modal="true" role="dialog" onClick={(event) => handleModalBackdropClick(event, closeZTokenPopup)}>
        <div className="z-token-modal-card">
          <p>Z CHAMBER ACCESS GRANTED</p>
          <small>{activeZTokenPopup.achievement.name}</small>
          <strong>A cursed achievement opened the Z Chamber.</strong>
          <span>One roll.</span>
          <span>One percent.</span>
          <b>Probably NOPE.</b>
          <em>Z ROLLS AVAILABLE: {zRollTokens}</em>
          <div className="z-chamber-actions">
            <button type="button" onClick={enterZChamberFromTokenPopup}>
              ENTER THE Z CHAMBER
            </button>
            <button type="button" onClick={closeZTokenPopup}>
              NOT YET. I FEAR SUCCESS.
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderZChamberTeaserPopup() {
    if (!showZChamberTeaserPopup) {
      return null;
    }

    return (
      <section className="z-token-modal-overlay" aria-modal="true" role="dialog" onClick={(event) => handleModalBackdropClick(event, closeZChamberTeaserPopup)}>
        <div className="z-token-modal-card">
          <p>Z CHAMBER SIGNAL LEAKED</p>
          <strong>The machine briefly opened something it should not have.</strong>
          <span>One fake roll has been loaded.</span>
          <span>Winning has been disabled.</span>
          <b>Obviously.</b>
          <div className="z-chamber-actions">
            <button type="button" onClick={enterZChamberTeaser}>
              ENTER THE Z CHAMBER
            </button>
            <button type="button" onClick={closeZChamberTeaserPopup}>
              NOT YET. I FEAR NOTHING.
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderTelegramLeaderboardShell() {
    return (
      <aside className="telegram-leaderboard-shell" aria-label="Leaderboard preview">
        <button className="leaderboard-preview" type="button" onClick={() => setShowLeaderboardModal(true)}>
          <strong>LIVE LEADERBOARD</strong>
          <span>ranked by NOPE SCORE</span>
          <span className="leaderboard-preview-rows" aria-hidden="true">
            <span>
              <b>1.</b>
              <em>anon_nope_001</em>
            </span>
            <span>
              <b>2.</b>
              <em>anon_nope_002</em>
            </span>
            <span className="leaderboard-row-current-user">
              <b>3.</b>
              <em>you?</em>
              <small>not logged in</small>
            </span>
          </span>
        </button>
      </aside>
    );
  }

  function closeTelegramLoginModal() {
    setShowTelegramLoginModal(false);
  }

  function openTelegramBrowserConnectionMessage() {
    setIsTelegramLoginVerifying(false);
    setTelegramLoginModalMode("browser");
    setShowTelegramLoginModal(true);
  }

  function handleTelegramLoginClick() {
    if (isTelegramConnected) {
      return;
    }

    if (!isTelegramMiniApp) {
      openTelegramBrowserConnectionMessage();
      return;
    }

    const nextTelegramPlayer = createTelegramPlayer(telegramUser);

    if (!nextTelegramPlayer) {
      openTelegramMissingUsernameMessage();
      return;
    }

    persistTelegramPlayer(nextTelegramPlayer);
    setShowTelegramLoginModal(false);
  }

  function disconnectTelegramPlayer() {
    setTelegramPlayer(null);

    try {
      window.localStorage.removeItem(STORAGE_KEYS.telegramPlayer);
    } catch {
      // Ignore storage failures; state is already disconnected for this session.
    }
  }

  function renderTelegramLoginModal() {
    if (!showTelegramLoginModal) {
      return null;
    }

    const isMissingUsername = telegramLoginModalMode === "missing-username";
    const isFailure = telegramLoginModalMode === "failure";

    return (
      <section
        className="telegram-placeholder-modal-overlay"
        aria-modal="true"
        role="dialog"
        onClick={(event) => handleModalBackdropClick(event, closeTelegramLoginModal)}
      >
        <div className="telegram-placeholder-modal-card">
          {isMissingUsername ? (
            <>
              <p>NO @USERNAME DETECTED</p>
              <span>set a Telegram username first if you want public NOPE shame.</span>
              <button type="button" onClick={closeTelegramLoginModal}>
                STAY ANONYMOUS
              </button>
            </>
          ) : isFailure ? (
            <>
              <p>TELEGRAM SAID NOPE</p>
              <span>identity not connected.</span>
              <span>probably safer.</span>
              <button type="button" onClick={closeTelegramLoginModal}>
                STAY ANONYMOUS
              </button>
            </>
          ) : (
            <>
              <p>TELEGRAM CONNECTION</p>
              <span>Telegram will ask if you want to let NOPE witness this.</span>
              <div className="telegram-widget-slot" ref={telegramWidgetContainerRef}>
                <span>{isTelegramLoginVerifying ? "verifying Telegram signal..." : "loading Telegram login..."}</span>
              </div>
              <button type="button" onClick={closeTelegramLoginModal}>
                STAY ANONYMOUS
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  function renderLeaderboardModal() {
    if (!showLeaderboardModal) {
      return null;
    }

    return (
      <section
        className="leaderboard-modal"
        aria-modal="true"
        role="dialog"
        onClick={(event) => handleModalBackdropClick(event, () => setShowLeaderboardModal(false))}
      >
        <div className="leaderboard-modal-card">
          <p>LIVE LEADERBOARD</p>
          <span>global rankings by NOPE SCORE.</span>
          <span>button spam helps. playing the game helps more.</span>
          <div className="leaderboard-modal-table" aria-label="Placeholder leaderboard">
            <div>
              <b>RANK</b>
              <b>USER</b>
              <b>SCORE</b>
            </div>
            <div>
              <span>01</span>
              <span>anon_nope_001</span>
              <span>000000</span>
            </div>
            <div>
              <span>02</span>
              <span>anon_nope_002</span>
              <span>000000</span>
            </div>
            <div className="leaderboard-row-current-user">
              <span>03</span>
              <span>you?</span>
              <span>not logged in</span>
            </div>
          </div>
          <small>status: signal not fully decoded</small>
          <button type="button" onClick={() => setShowLeaderboardModal(false)}>
            CLOSE BOARD
          </button>
        </div>
      </section>
    );
  }

  if (shareEntity !== null) {
    const entity = shareEntity || null;

    return (
      <main className={`share-page ${isTelegramMiniApp ? "telegram-mini-app" : ""}`}>
        <div className="crt-noise" />
        <div className="app-code-rain" aria-hidden="true">
          {Array.from({ length: 28 }, (_, index) => (
            <span key={index}>NOPE NON TON 404 REJECT NOTPEPE NOPE 0X00 NON</span>
          ))}
        </div>

        {entity ? (
          <section className={`share-card rarity-${entity.rarity} ${entity.type === "uber" ? "uber-card" : ""} ${entity.type === "mythic" ? "mythic-card" : ""} ${entity.type === "gif" ? "gif-card" : ""} ${entity.type === "z" ? "z-card" : ""}`}>
            <p>NOPEDEX DISCOVERY</p>
            <div className="share-media">
              <img
                src={entity.image}
                alt={entity.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            </div>
            <strong>{entity.name}</strong>
            <span>{entity.rarityLabel}</span>
            <em>odds: {formatDropChance(entity.dropChance)}</em>
            <small>{entity.caption}</small>
            <b>{entity.type === "gif" ? "value: animated zero" : entity.type === "z" ? "value: still zero" : entity.type === "uber" ? "value: still zero" : "value: emotionally zero"}</b>
            <button type="button" onClick={() => { window.location.href = "/"; }}>
              [ ENTER NOPE MACHINE ]
            </button>
          </section>
        ) : (
          <section className="share-card missing-share">
            <p>NOPEDEX DISCOVERY</p>
            <strong>NOPE not found. probably your fault.</strong>
            <button type="button" onClick={() => { window.location.href = "/"; }}>
              [ ENTER NOPE MACHINE ]
            </button>
          </section>
        )}
      </main>
    );
  }

  if (showIntro) {
    const introLines =
      introChoice === "red"
        ? ["> red pill selected", "> truth denied", "> booting NOPE OS..."]
        : introChoice === "blue"
          ? ["> blue pill selected", "> delusion denied", "> booting NOPE OS..."]
          : [];

    return (
      <main className={`intro-screen ${isTelegramMiniApp ? "telegram-mini-app" : ""} ${isIntroExiting ? "intro-exit" : ""}`}>
        <div className="matrix-rain" aria-hidden="true">
          {Array.from({ length: 44 }, (_, index) => (
            <span key={index}>NOPE 0101 TON ??? NOTPEPE NOPE 404 REJECT NON NOPE $NOPE 0X00</span>
          ))}
        </div>

        <section className="intro-window" aria-label="NOPE OS intro">
          <img src="/images/bluepillnope.jpg" alt="Blue pill NOPE" />

          {introChoice ? (
            <div className="intro-terminal">
              {introLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="pill-buttons">
              <button className="red-pill" type="button" onClick={() => enterNopeOs("red")}>
                [ RED PILL ]
              </button>
              <button className="blue-pill" type="button" onClick={() => enterNopeOs("blue")}>
                [ BLUE PILL ]
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main
      className={`nope-page ${isTelegramMiniApp ? "telegram-mini-app" : ""} ${isGlitching ? "is-glitching" : ""} ${isAmbientGlitch ? "ambient-glitch" : ""} ${isNopeIdle ? "nope-idle" : ""} ${isNopeSurgeActive ? "nope-surge-active" : ""}`}
    >
      <div className="crt-noise" />
      <div className="app-code-rain" aria-hidden="true">
        {Array.from({ length: 36 }, (_, index) => (
          <span key={index}>NOPE NON TON 404 REJECT NOTPEPE NOPE 0X00 NON</span>
        ))}
      </div>
      {scoreBursts.some((burst) => burst.context !== "score") && (
        <div className="contextual-score-bursts" aria-live="polite">
          {scoreBursts.filter((burst) => burst.context !== "score").map((burst) => (
            <b
              className={`contextual-score-burst score-delta-${burst.tier} ${burst.comboApplied ? "score-delta-combo" : ""} context-${burst.context}`}
              key={`context-${burst.id}`}
              style={{
                "--context-score-x": burst.position ? `${burst.position.left}%` : "50%",
                "--context-score-y": burst.position ? `${burst.position.top}%` : "44%",
              }}
            >
              <span>+{burst.formattedAmount}</span>
              <small>{burst.reason}{burst.comboApplied ? ` // COMBO x${NOPE_COMBO_MULTIPLIER}` : ""}{burst.surgeApplied ? " // SURGE x2" : ""}</small>
            </b>
          ))}
        </div>
      )}
      {!shouldPauseSignalFragments && (
        <div className="background-signal-fragments" data-signal-context={signalFragmentContext} aria-label="Hidden background signal fragments">
          {visibleSignalFragments.map((fragment) => (
          <button
            className={`background-signal-fragment ${fragment.isLeaving ? "is-leaving" : ""}`}
            data-signal-type={fragment.signalType}
            data-signal-context={fragment.context ?? signalFragmentContext}
            type="button"
            onClick={() => openSignalFragment(fragment)}
            aria-label="Decode hidden signal fragment"
            key={fragment.instanceId}
            style={{ "--signal-x": `${fragment.left}%`, "--signal-y": `${fragment.top}%` }}
          >
            {fragment.displayText}
          </button>
          ))}
        </div>
      )}
      {ambientWarning && <div className="glitch-warning">{ambientWarning}</div>}
      {showBootPopup && (
        <section className="boot-popup-overlay" aria-modal="true" role="dialog" aria-labelledby="boot-popup-title">
          <div className="boot-popup-card">
            <div className="boot-popup-titlebar">
              <span className="terminal-light red" />
              <span className="terminal-light yellow" />
              <span className="terminal-light green" />
              <p id="boot-popup-title">NOPE OS BOOT NOTICE</p>
            </div>
            <div className="boot-popup-text" data-boot-phase={bootPopupPhase}>
              <span>{bootPopupText || " "}</span>
              {bootPopupPhase === "typing" && <span className="terminal-cursor" />}
            </div>
            <button type="button" onClick={closeBootPopup}>
              TAKE ME TO THE FUCKING BUTTON
            </button>
          </div>
        </section>
      )}
      <aside
        className={`nope-score ${isScoreHudDragging ? "is-dragging" : ""}`}
        aria-label="NOPE score"
        onPointerDown={handleScoreHudPointerDown}
        onPointerMove={handleScoreHudPointerMove}
        onPointerUp={handleScoreHudPointerUp}
        onPointerCancel={handleScoreHudPointerUp}
        style={{ "--score-hud-x": `${scoreHudPosition.x}px`, "--score-hud-y": `${scoreHudPosition.y}px` }}
      >
        <div className={`nope-score-visual heat-${scoreHeat >= 9 ? "overload" : scoreHeat >= 6 ? "hot" : scoreHeat >= 3 ? "warm" : "idle"} ${scoreBursts.length > 0 ? "is-updating" : ""} ${isScoreSettled ? "score-settled" : ""} ${scoreBursts.some((burst) => burst.tier === "large" || burst.tier === "huge") ? "score-big" : ""} ${scoreBursts.some((burst) => burst.tier === "z") ? "score-z" : ""}`}>
          <span onDoubleClick={resetScoreHudPosition} title="double click to re-anchor score signal">NOPE SCORE</span>
          <strong>{formattedNopeScore}</strong>
          <em>value: still zero</em>
          <div className={`z-signal-charge-meter ${zSignalChargePercent >= 100 ? "is-full" : ""}`} style={{ "--z-charge": `${zSignalChargePercent}%` }}>
            <span>Z SIGNAL CHARGE</span>
            <b>{zSignalChargePercent}%</b>
          </div>
          {scoreCombo.activeHitsLeft > 0 && (
            <div className={`nope-combo-indicator ${scoreBursts.some((burst) => burst.comboApplied) ? "combo-pulsing" : ""}`}>
              <b>NOPE COMBO x{NOPE_COMBO_MULTIPLIER}</b>
              <small>{scoreCombo.activeHitsLeft} hits left</small>
            </div>
          )}
          {scoreBursts.length > 0 && (
            <div className="nope-score-bursts" aria-live="polite">
              {scoreBursts.map((burst, index) => (
                <b
                  className={`nope-score-delta score-delta-${burst.tier} ${burst.comboApplied ? "score-delta-combo" : ""}`}
                  key={burst.id}
                  style={{ "--burst-index": scoreBursts.length - index - 1 }}
                >
                  <span>+{burst.formattedAmount}</span>
                  <small>{burst.reason}{burst.comboApplied ? ` // COMBO x${NOPE_COMBO_MULTIPLIER}` : ""}{burst.surgeApplied ? " // SURGE x2" : ""}</small>
                </b>
              ))}
            </div>
          )}
        </div>
      </aside>
      <header className="os-header" aria-label="NOPE OS">
        <strong>NOPE OS 0.0.1</strong>
        <span>press NOPE. collect garbage. flex nothing.</span>
      </header>

      <section className="machine-layout" aria-label="NOPE Machine">
        <section className="terminal-shell" aria-label="NOPE Machine terminal">
          <div className="terminal-top">
            <span className="terminal-light red" />
            <span className="terminal-light yellow" />
            <span className="terminal-light green" />
            <p>NOPE OS FEED</p>
          </div>

          <div className="terminal-screen">
            <div className="terminal-log" ref={terminalLogRef} aria-live="polite">
              {lines.map((line) => (
                <p
                  className={`terminal-line ${line.speaker} ${line.important ? "important" : ""}`}
                  key={line.id}
                >
                  {line.speaker === "system" ? (
                    <>
                      <span className="terminal-text">{line.text}</span>
                      {line.isTyping && <span className="terminal-cursor" />}
                    </>
                  ) : (
                    <>
                      <span className="terminal-speaker">
                        {line.speaker === "user" ? "YOU " : "NOPE"}
                      </span>
                      <span className="terminal-prompt">&gt;</span>
                      <span className="terminal-text">{line.text || " "}</span>
                      {line.isTyping && <span className="terminal-cursor" />}
                    </>
                  )}
                </p>
              ))}
            </div>

            <div className="event-feed-footer">&gt; INPUT PORT SEALED FOR NOW... OR MAYBE FOREVER... DUNNO</div>
          </div>

          {activeDiscoveryPopup && (
            <aside
              className={`entity-transmission rarity-${activeDiscoveryPopup.entity.rarity} ${activeDiscoveryPopup.entity.type === "gif" ? "forbidden" : ""} ${activeDiscoveryPopup.entity.type === "mythic" ? "mythic" : ""} ${activeDiscoveryPopup.entity.type === "uber" ? "uber" : ""} ${activeDiscoveryPopup.requiresAction ? "actionable" : ""}`}
              aria-label="NOPE entity transmission"
            >
              <p className="panel-label">
                {activeDiscoveryPopup.entity.type === "gif"
                  ? activeDiscoveryPopup.entity.rarity === "illegal" ? "illegal-loop-breach.gif" : "corrupted-loop-signal.gif"
                  : activeDiscoveryPopup.signalType === "uber"
                    ? "uber-nope-detected.sys"
                  : activeDiscoveryPopup.signalType === "mythic"
                    ? "mythic-relic-found.jpg"
                  : activeDiscoveryPopup.signalType === "new"
                    ? "new-trash-found.jpg"
                    : activeDiscoveryPopup.signalType === "duplicate"
                      ? "duplicate-trash.tmp"
                      : "corrupted-nope-signal.gif"}
              </p>
              <span className="signal-status">
                {activeDiscoveryPopup.entity.type === "gif"
                  ? getLoopFoundTitle(activeDiscoveryPopup.entity)
                  : activeDiscoveryPopup.signalType === "uber"
                    ? "UBER NOPE DETECTED"
                  : activeDiscoveryPopup.signalType === "mythic"
                    ? "MYTHIC NOPE FOUND"
                  : activeDiscoveryPopup.signalType === "new"
                    ? "NEW TRASH DISCOVERED"
                    : activeDiscoveryPopup.signalType === "duplicate"
                      ? "DUPLICATE TRASH"
                      : "NOPE SIGNAL"}
              </span>
              <div className="transmission-media">
                <img
                  src={activeDiscoveryPopup.entity.image}
                  alt={activeDiscoveryPopup.entity.name}
                  onError={(event) => {
                    event.currentTarget.classList.add("image-missing");
                  }}
                />
              </div>
              <h2>{activeDiscoveryPopup.entity.name}</h2>
              <p>{activeDiscoveryPopup.entity.caption}</p>
              <b>
                {activeDiscoveryPopup.signalType === "uber"
                  ? "odds: offensive // probability insulted"
                  : activeDiscoveryPopup.entity.type === "gif"
                    ? `added to NOPEDEX // odds: ${formatDropChance(activeDiscoveryPopup.entity.dropChance)} // value: animated zero`
                    : "value: zero"}
              </b>
            </aside>
          )}
        </section>
      </section>

      <section className="button-zone" aria-label="NOPE button">
        <div className="nope-cta-row">
          <p>PRESS NOPE. COLLECT WORTHLESS TRASH.</p>
          <div className="telegram-login-control">
            <button className="telegram-login-button" type="button" onClick={handleTelegramLoginClick}>
              {isTelegramConnected ? `CONNECTED AS @${telegramUsername}` : "LOG IN WITH TELEGRAM"}
            </button>
            <span>{isTelegramConnected ? "bad decisions may now be public" : "optional public shame layer"}</span>
            {isTelegramConnected && (
              <button className="telegram-disconnect-button" type="button" onClick={disconnectTelegramPlayer}>
                DISCONNECT
              </button>
            )}
          </div>
        </div>
        {renderTelegramLeaderboardShell()}
        {comboNotice && (
          <div className={`nope-combo-notice combo-${comboNotice.type}`} key={comboNotice.id}>
            <strong>{comboNotice.type === "online" ? "NOPE COMBO ONLINE" : "NOPE COMBO EXPIRED"}</strong>
            <span>{comboNotice.type === "online" ? "You accidentally played the game properly." : "normal disappointment resumed."}</span>
            {comboNotice.type === "online" && <b>x{NOPE_COMBO_MULTIPLIER} NOPE SCORE</b>}
          </div>
        )}
        {showFirstPressPrompt && (
          <div className="first-press-prompt" aria-hidden="true">
            <span>PRESS THE BIG STUPID BUTTON</span>
            <b>↓ ↓ ↓</b>
          </div>
        )}
        <button
          className="mega-nope image-nope-button"
          type="button"
          onClick={pressNope}
          aria-label={`Press ${buttonText}`}
        >
          <img src="/images/nopebutton.png" alt="NOPE" />
        </button>
        <aside
          className={`status-panel ${isStatsExpanded ? "expanded" : "collapsed"}`}
          aria-label="NOPE progress stats"
          aria-expanded={isStatsExpanded}
          role="button"
          tabIndex={0}
          onClick={toggleStatsPanel}
          onKeyDown={handleStatsPanelKeyDown}
        >
          <div className="status-row status-counts">
            <span className="stat-chunk">YOUR NOPES: {formattedCount}</span>
            <span className={`stat-chunk worldwide-nopes ${globalCountPulse ? "is-updating" : ""}`}>
              WORLDWIDE NOPES: {formattedGlobalCount}
            </span>
            <span className="status-toggle-hint">{isStatsExpanded ? "hide stats" : "decode stats"}</span>
          </div>
          <div className="status-expanded-rows" aria-hidden={!isStatsExpanded}>
            <div className="status-row status-stats">
              <span className="stat-chunk">GARBAGE: {normalCollectedCount.toString().padStart(3, "0")}/{NORMAL_TOTAL}</span>
              <span className="stat-chunk">LOOPS: {gifCollectedCount.toString().padStart(3, "0")}/{GIF_TOTAL}</span>
              <span className="stat-chunk">MYTHIC: {mythicCollectedCount.toString().padStart(3, "0")}/{MYTHIC_TOTAL.toString().padStart(3, "0")}</span>
              <span className="stat-chunk">UBER: {uberCollectedCount.toString().padStart(3, "0")}/{UBER_TOTAL.toString().padStart(3, "0")}</span>
              <span className="stat-chunk">ACHIEVEMENTS: {unlockedAchievementCount.toString().padStart(3, "0")}/{achievements.length.toString().padStart(3, "0")}</span>
            </div>
            <div className="status-row status-latest">
              <span className="stat-chunk">
                LATEST: {latestDiscovery ? `${latestDiscovery.type === "uber" ? "UBER - " : latestDiscovery.type === "mythic" ? "MYTHIC - " : ""}${latestDiscovery.name}` : "NONE. PRESS THE STUPID BUTTON."}
              </span>
            </div>
          </div>
        </aside>
        <aside
          className={`bad-idea-panel ${isNopeSurgeActive ? "surge-online" : ""}`}
          aria-label="Current Bad Idea"
          role={activeBadIdea ? "button" : undefined}
          tabIndex={activeBadIdea ? 0 : undefined}
          onClick={activeBadIdea ? openBadIdeaDetails : undefined}
          onKeyDown={activeBadIdea ? handleBadIdeaPanelKeyDown : undefined}
        >
          {activeBadIdea ? (
            <>
              <div>
                <span>CURRENT BAD IDEA</span>
                <strong>{activeBadIdea.title}</strong>
              </div>
              <p>
                {currentBadIdeaDisplayProgress} / {activeBadIdea.target}
              </p>
              <small>reward: +{formatScoreAmount(activeBadIdea.reward)} NOPE SCORE</small>
              <div
                className={`nope-surge-meter ${isNopeSurgeReady ? "ready" : ""} ${isNopeSurgeActive ? "active" : ""} ${nopeSurgeChargeFeedback ? `charging ${nopeSurgeChargeFeedback.tier}` : ""}`}
                data-surge-help={NOPE_SURGE_HELP_TEXT}
                style={{ "--surge-charge": isNopeSurgeActive ? "100%" : `${nopeSurgeChargePercent}%` }}
                title={NOPE_SURGE_HELP_TEXT}
              >
                <span>{isNopeSurgeActive ? "NOPE SURGE ACTIVE" : isNopeSurgeReady ? "NOPE SURGE READY" : "NOPE SURGE CHARGE"}</span>
                <strong>{isNopeSurgeActive ? formattedNopeSurgeTime : `${nopeSurgeChargePercent}%`}</strong>
                {nopeSurgeChargeFeedback?.label && !isNopeSurgeActive && (
                  <em className="nope-surge-charge-pop">{nopeSurgeChargeFeedback.label}</em>
                )}
              </div>
              {isNopeSurgeReady && !isNopeSurgeActive && (
                <button className="nope-surge-activate-button" type="button" onClick={handleNopeSurgeActivateClick}>
                  ACTIVATE NOPE SURGE
                </button>
              )}
              {isNopeSurgeReady && !isNopeSurgeActive && (
                <em>purple mode loaded. use it before the machine develops standards.</em>
              )}
              {isNopeSurgeActive && (
                <b>
                  NOPE SURGE ACTIVE // x2 SCORE // {formattedNopeSurgeTime}
                </b>
              )}
            </>
          ) : (
            <>
              <div>
                <span>CURRENT BAD IDEA</span>
                <strong>NO BAD IDEA LOADED</strong>
              </div>
              <small>machine briefly developed standards.</small>
            </>
          )}
        </aside>
        <button className="next-badge-strip" type="button" onClick={openAchievementsTab}>
          {activeNextBadge ? (
            <>
              <span className="next-badge-title">ACHIEVEMENTS IN PROGRESS</span>
              <span className="next-badge-main">
                <strong>{activeNextBadge.achievement.name}</strong>
                <em>
                  {activeNextBadge.progress.current} / {activeNextBadge.progress.target} {activeNextBadge.progress.label}
                </em>
              </span>
            </>
          ) : (
            <>
              <span className="next-badge-title">ACHIEVEMENTS IN PROGRESS</span>
              <span className="next-badge-main">
                <strong>keep pressing NOPE</strong>
                <em>progress: unclear</em>
              </span>
            </>
          )}
        </button>
        <div className="main-actions">
          <button type="button" onClick={openStickerBook}>
            [ OPEN STICKER BOOK ]
          </button>
          <button type="button" onClick={copyContract} disabled={isBooting}>
            [ COPY CONTRACT ]
          </button>
        </div>
        {nopeCount >= 10 && (
          <button
            className="existential-button"
            type="button"
            onClick={() => {
              setShowExistentialPopup(true);
              addInstantNopeLine("existential crisis acknowledged.");
            }}
          >
            why am I pressing this?
          </button>
        )}
      </section>

      <footer className="footer-links">
        <a href="https://t.me/notpepetelegram" target="_blank" rel="noopener noreferrer">
          <svg className="footer-link-icon footer-telegram-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21.9 4.3 18.7 19c-.2 1-1 1.2-1.8.7l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.3L6.1 12.2l-5-1.6c-1-.3-1-1 .2-1.5L20.8 1.6c.9-.3 1.7.2 1.1 2.7Z" />
          </svg>
          <span>Telegram</span>
        </a>
        <a href="https://dexscreener.com/ton/EQApjQK1qpZ3BjECMaK0GkseWS7qfnhA5YXdP-YKUkK2Hnon" target="_blank" rel="noopener noreferrer">
          <svg className="footer-link-icon footer-chart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 19h16" />
            <path d="M7 15V9" />
            <path d="M7 7V5" />
            <path d="M12 17v-4" />
            <path d="M12 11V7" />
            <path d="M17 14V8" />
            <path d="M17 6V4" />
          </svg>
          <span>Chart</span>
        </a>
        <a href="https://t.me/dtrade?start=1Ea1QVDEuW" target="_blank" rel="noopener noreferrer">
          <img className="footer-link-icon footer-dtrade-logo" src="/images/dtradelogo.png" alt="Dtrade" />
          <span>Dtrade</span>
        </a>
        <a href="#" onClick={copyContract}>
          contract
        </a>
        <a href="#" onClick={replayIntro}>
          take another pointless pill
        </a>
        <button className="dev-reset-button" type="button" onClick={() => setShowResetConfirm(true)}>
          [ regret everything ]
        </button>
        <button className="dev-reset-button" type="button" onClick={forceUberDiscovery}>
          [ force uber ]
        </button>
        <button className="dev-reset-button" type="button" onClick={forceRareDiscovery}>
          [ force rare ]
        </button>
        <button className="dev-reset-button" type="button" onClick={addDevGrinderMaterials}>
          [ add grinder mats ]
        </button>
        <button className="dev-reset-button" type="button" onClick={forceCommonDuplicate}>
          [ force common duplicate ]
        </button>
        <button className="dev-reset-button" type="button" onClick={addDevZRoll}>
          [ add z roll ]
        </button>
        <button className="dev-reset-button" type="button" onClick={forceZAchievement}>
          [ force z achievement ]
        </button>
        <button className="dev-reset-button" type="button" onClick={forceZSuccess}>
          [ force z success ]
        </button>
        <button className="dev-reset-button" type="button" onClick={forceNopeSurge}>
          [ force nope surge ]
        </button>
        {zRollTokens > 0 && !znopeAcquired && (
          <button className="dev-reset-button" type="button" onClick={openZChamber}>
            [ enter z chamber ]
          </button>
        )}
      </footer>

      {activeBadIdeaCompletion && (
        <section className="bad-idea-modal-overlay" aria-modal="true" role="dialog">
          <div className="bad-idea-modal-card">
            <p>BAD IDEA COMPLETE</p>
            <strong>{activeBadIdeaCompletion.mission.title}</strong>
            <span>reward:</span>
            <b>+{formatScoreAmount(activeBadIdeaCompletion.mission.reward)} NOPE SCORE</b>
            <button type="button" onClick={acceptBadIdeaCompletion}>
              ACCEPT TERRIBLE PROGRESS
            </button>
          </div>
        </section>
      )}

      {showBadIdeaDetails && activeBadIdea && (
        <section
          className="bad-idea-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, () => setShowBadIdeaDetails(false))}
        >
          <div className="bad-idea-modal-card bad-idea-detail-card">
            <p>CURRENT BAD IDEA</p>
            <strong>{activeBadIdea.title}</strong>
            <span>task:</span>
            <b>{getBadIdeaTaskText(activeBadIdea)}</b>
            <span>progress:</span>
            <b>
              {currentBadIdeaDisplayProgress} / {activeBadIdea.target}
            </b>
            <span>reward:</span>
            <b>+{formatScoreAmount(activeBadIdea.reward)} NOPE SCORE</b>
            <span>NOPE SURGE:</span>
            <b>meaningful score fills it. larger mistakes fill it faster.</b>
            <small>NOPE SURGE fills from meaningful score. Find trash, grind trash, burn trash, click static, fail Z rolls. Button spam barely helps. Obviously.</small>
            <small>The machine has suggested a terrible objective. Following it is optional. Unfortunately, numbers may go up.</small>
            <button type="button" onClick={() => setShowBadIdeaDetails(false)}>
              RETURN TO BAD DECISIONS
            </button>
          </div>
        </section>
      )}

      {showNopeSurgePopup && (
        <section className="nope-surge-modal-overlay" aria-modal="true" role="dialog" onClick={(event) => handleModalBackdropClick(event, () => setShowNopeSurgePopup(false))}>
          <div className="nope-surge-modal-card">
            <p>NOPE SURGE ONLINE</p>
            <strong>The matrix has gone purple.</strong>
            <span>That is probably not good.</span>
            <b>x2 score for 45 seconds.</b>
            <small>Use it badly.</small>
            <button type="button" onClick={() => setShowNopeSurgePopup(false)}>
              ABUSE THE MALFUNCTION
            </button>
          </div>
        </section>
      )}

      {activeSignalFragment && (
        <section
          className="signal-fragment-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, () => setActiveSignalFragment(null))}
        >
          <div className="signal-fragment-modal-card" data-signal-type={activeSignalFragment.fragment.signalType ?? "normal"}>
            <span>{activeSignalFragment.fragment.text}</span>
            <strong>{activeSignalFragment.title}</strong>
            {activeSignalFragment.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {activeSignalFragment.scoreBonus > 0 && <b>SIGNAL DECODED: +{formatScoreAmount(activeSignalFragment.scoreBonus)} NOPE SCORE</b>}
            <small>fragments decoded: {signalFragmentsFound.toString().padStart(3, "0")}</small>
            <button type="button" onClick={() => setActiveSignalFragment(null)}>
              [ {activeSignalFragment.button} ]
            </button>
          </div>
        </section>
      )}

      {activeBreachOverlay && (
        <section className={`breach-overlay ${activeBreachOverlay.intensity || "forbidden"}`} aria-label="Forbidden loop breach">
          <div className="breach-card">
            <p>{activeBreachOverlay.title || "FORBIDDEN LOOP BREACH"}</p>
            <img
              src={activeBreachOverlay.entity.image}
              alt={activeBreachOverlay.entity.name}
              onError={(event) => {
                event.currentTarget.classList.add("image-missing");
              }}
            />
            <strong>{activeBreachOverlay.entity.name}</strong>
            <span>{activeBreachOverlay.entity.rarityLabel} // value: animated zero</span>
          </div>
        </section>
      )}

      {activeSacrificeEffect && (
        <section className={`sacrifice-effect-overlay ${activeSacrificeEffect.type === "uber" ? "uber-sacrifice-effect-overlay" : ""}`} aria-label="NOPE sacrifice effect">
          <div className="sacrifice-effect-card">
            <img
              src={activeSacrificeEffect.image}
              alt={activeSacrificeEffect.name}
              onError={(event) => {
                event.currentTarget.classList.add("image-missing");
              }}
            />
            <strong>{activeSacrificeEffect.name}</strong>
            <span>FED TO THE GRINDER</span>
          </div>
        </section>
      )}

      {renderStickerInspectModal()}
      {renderAchievementInspectModal()}
      {renderZTokenPopup()}
      {renderZChamberTeaserPopup()}
      {activeZSignalChargePopup && (
        <section
          className="achievement-modal-overlay z-signal-charge-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, () => setActiveZSignalChargePopup(false))}
        >
          <div className="achievement-modal-card z-signal-charge-modal-card">
            <p>Z SIGNAL CHARGED</p>
            <strong>The machine coughed up one Z Roll.</strong>
            <span>This was probably not intended.</span>
            <b>Z ROLLS AVAILABLE: {zRollTokens}</b>
            <div className="z-chamber-actions">
              <button
                type="button"
                onClick={() => {
                  setActiveZSignalChargePopup(false);
                  openZChamber();
                }}
              >
                ENTER Z CHAMBER
              </button>
              <button type="button" onClick={() => setActiveZSignalChargePopup(false)}>
                NOT YET. LET IT GET WORSE.
              </button>
            </div>
          </div>
        </section>
      )}
      {renderZChamberModal()}
      {renderTelegramLoginModal()}
      {renderLeaderboardModal()}

      {activeSacrificeEntity && (
        <section
          className="achievement-modal-overlay sacrifice-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, cancelSacrifice)}
        >
          <div className="achievement-modal-card first-sticker-modal-card sacrifice-modal-card">
            <p>SACRIFICE NOPE?</p>
            <div className="first-sticker-modal-media">
              <img
                src={activeSacrificeEntity.image}
                alt={activeSacrificeEntity.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            </div>
            <strong>{activeSacrificeEntity.name}</strong>
            <span>{activeSacrificeEntity.rarityLabel}</span>
            <em>This NOPE will leave your active NOPEDEX.</em>
            <em>It can be found again.</em>
            <b>The grinder gets +{SACRIFICE_MATERIAL_GAIN} {activeSacrificeEntity.rarityLabel} fuel.</b>
            <span>This is probably a terrible idea.</span>
            <div className="sacrifice-modal-actions">
              <button type="button" onClick={cancelSacrifice}>
                [ cancel ]
              </button>
              <button type="button" onClick={confirmSacrifice}>
                [ burn it. obviously. ]
              </button>
            </div>
          </div>
        </section>
      )}

      {activeUberSacrificeEntity && (
        <section
          className="achievement-modal-overlay sacrifice-modal-overlay uber-sacrifice-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, cancelUberSacrifice)}
        >
          <div className="achievement-modal-card first-sticker-modal-card sacrifice-modal-card uber-sacrifice-modal-card">
            {uberSacrificeStep === 1 ? (
              <>
                <p>SACRIFICE UBER NOPE?</p>
                <div className="first-sticker-modal-media">
                  <img
                    src={activeUberSacrificeEntity.image}
                    alt={activeUberSacrificeEntity.name}
                    onError={(event) => {
                      event.currentTarget.classList.add("image-missing");
                    }}
                  />
                </div>
                <strong>{activeUberSacrificeEntity.name}</strong>
                <span>This is an UBER NOPE.</span>
                <em>Burning it removes it from your active NOPEDEX.</em>
                <em>It can be found again.</em>
                <em>Probably.</em>
                <b>This is a terrible idea.</b>
                <div className="sacrifice-modal-actions">
                  <button type="button" onClick={cancelUberSacrifice}>
                    [ cancel ]
                  </button>
                  <button type="button" onClick={continueUberSacrifice}>
                    [ continue terrible idea ]
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>FINAL BAD DECISION</p>
                <div className="first-sticker-modal-media">
                  <img
                    src={activeUberSacrificeEntity.image}
                    alt={activeUberSacrificeEntity.name}
                    onError={(event) => {
                      event.currentTarget.classList.add("image-missing");
                    }}
                  />
                </div>
                <strong>{activeUberSacrificeEntity.name}</strong>
                <span>You are about to burn an UBER NOPE for basically no reason.</span>
                <em>The game will remember this.</em>
                <em>Your collection will suffer.</em>
                <em>Your ego may improve.</em>
                <b>The grinder receives +5 MYTHIC NOPE fuel.</b>
                <div className="sacrifice-modal-actions">
                  <button type="button" onClick={cancelUberSacrifice}>
                    [ no, I like having things ]
                  </button>
                  <button type="button" onClick={confirmUberSacrifice}>
                    [ burn the Uber. obviously. ]
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {activeCraftResult && (
        <section
          className="achievement-modal-overlay grinder-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, dismissCraftResult)}
        >
          <div className="achievement-modal-card first-sticker-modal-card grinder-modal-card">
            <p>DUPLICATE GRINDER ONLINE</p>
            <small>REPEATED NOPES ENTERED THE GRINDER.</small>
            <span>NOPE OS is making a terrible decision.</span>
            <div className="first-sticker-modal-media">
              <img
                src={activeCraftResult.entity.image}
                alt={activeCraftResult.entity.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            </div>
            <strong>CRAFTED NOPE GENERATED</strong>
            <span>{activeCraftResult.entity.name}</span>
            <em>{activeCraftResult.entity.rarityLabel} // odds: {formatDropChance(activeCraftResult.entity.dropChance)}</em>
            <em>value: still zero</em>
            {activeCraftResult.scoreBonus > 0 && (
              <>
                <strong>{activeCraftResult.scoreLabel ?? "GRINDER BONUS"}</strong>
                <b>+{formatScoreAmount(activeCraftResult.scoreBonus)} NOPE SCORE</b>
              </>
            )}
            <b>{activeCraftResult.wasNew ? "NEW NOPE ADDED TO NOPEDEX" : "DUPLICATE GENERATED - you upgraded disappointment."}</b>
            <button type="button" onClick={dismissCraftResult}>
              [ accept recycled disappointment ]
            </button>
          </div>
        </section>
      )}

      {activeGoodFindModal && (
        <section
          className={`first-sticker-modal-overlay good-find-modal-overlay rarity-${activeGoodFindModal.rarity} ${activeGoodFindModal.type === "uber" ? "uber-modal-overlay" : ""}`}
          aria-modal="true"
          role="dialog"
          onClick={(event) => {
            if (activeGoodFindCanSkip) {
              handleModalBackdropClick(event, dismissGoodFindToButton, { respectImportantDelay: true });
            }
          }}
        >
          <div className={`achievement-modal-card first-sticker-modal-card good-find-modal-card rarity-${activeGoodFindModal.rarity} ${activeGoodFindModal.type === "uber" ? "uber-modal-card" : ""}`}>
            <p>{getGoodFindTitle(activeGoodFindModal)}</p>
            <div className="first-sticker-modal-media">
              <img
                src={activeGoodFindModal.image}
                alt={activeGoodFindModal.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            </div>
            <strong>{activeGoodFindModal.name}</strong>
            <span>{activeGoodFindModal.rarityLabel}</span>
            <em>odds: {formatDropChance(activeGoodFindModal.dropChance)}</em>
            {activeGoodFindModal.caption && <span>{activeGoodFindModal.caption}</span>}
            {getGoodFindProbabilityLine(activeGoodFindModal) && <em>{getGoodFindProbabilityLine(activeGoodFindModal)}</em>}
            <b>value: still zero</b>
            {activeGoodFindCanSkip && <small>NOPE OS has noticed you know where the sticker book is.</small>}
            <div className={`good-find-actions ${activeGoodFindCanSkip ? "has-skip" : ""}`}>
              <button type="button" onClick={() => openGoodFindInBook(activeGoodFindModal.id)} disabled={!isImportantModalActionReady}>
                OPEN STICKER BOOK. FLEX NOTHING.
              </button>
              {activeGoodFindCanSkip && (
                <button className="good-find-secondary-button" type="button" onClick={dismissGoodFindToButton} disabled={!isImportantModalActionReady}>
                  BACK TO THE BUTTON
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {showGrinderReadyPrompt && (
        <section
          className="achievement-modal-overlay grinder-ready-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, dismissGrinderReadyPromptToButton)}
        >
          <div className="achievement-modal-card grinder-ready-modal-card">
            <p>DUPLICATE HELL DETECTED</p>
            <small>NOPE OS MACHINE ALERT</small>
            <strong>You keep pulling the same trash.</strong>
            <span>The grinder is hungry.</span>
            <span>This is probably why it exists.</span>
            <b>GRINDER FUEL READY</b>
            <div className="grinder-ready-actions">
              <button type="button" onClick={openGrinderFromReadyPrompt}>
                TAKE ME TO THE FUCKIN GRINDER
              </button>
              <button type="button" onClick={dismissGrinderReadyPromptToButton}>
                TAKE ME BACK TO THE BUTTON
              </button>
            </div>
          </div>
        </section>
      )}

      {activeAchievement && !activeSacrificeEntity && !activeUberSacrificeEntity && !activeCraftResult && !activeGoodFindModal && !activeZSignalChargePopup && !showZChamberTeaserPopup && !isZChamberOpen && !activeZRollResult && !showGrinderReadyPrompt && !activeBadIdeaCompletion && !showBadIdeaDetails && !showNopeSurgePopup && (
        <section
          className="achievement-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, dismissAchievement, { respectImportantDelay: true })}
        >
          <div className="achievement-modal-card">
            <p>NOPE OS REWARD SYSTEM</p>
            <small>ACHIEVEMENT UNLOCKED</small>
            <strong>{activeAchievement.name}</strong>
            <span>{activeAchievement.description}</span>
            <em>reward: {activeAchievement.reward}</em>
            {activeAchievement.pendingScoreBonus > 0 && <b>ACHIEVEMENT BONUS: +{formatScoreAmount(activeAchievement.pendingScoreBonus)} NOPE SCORE</b>}
            <b>value gained: zero</b>
            <button type="button" onClick={dismissAchievement} disabled={!isImportantModalActionReady}>
              [ erm... yea... nope ]
            </button>
          </div>
        </section>
      )}

      {showFirstStickerPopup && firstStickerEntity && (
        <section className="first-sticker-modal-overlay" aria-modal="true" role="dialog">
          <div className="achievement-modal-card first-sticker-modal-card">
            <p>FIRST TRASH ACQUIRED</p>
            <small>NOPEDEX CONTAMINATION EVENT</small>
            <div className="first-sticker-modal-media">
              <img
                src={firstStickerEntity.image}
                alt={firstStickerEntity.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            </div>
            <strong>{firstStickerEntity.name}</strong>
            <span>
              POOR NOPE entered your NOPEDEX.
              <br />
              value: emotionally zero.
              <br />
              feeling proud is a bug.
            </span>
            <b>value gained: zero</b>
            <button type="button" onClick={openFirstStickerInBook} disabled={!isImportantModalActionReady}>
              [ open sticker book. accept shame. ]
            </button>
          </div>
        </section>
      )}

      {showExistentialPopup && (
        <section
          className="existential-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, () => setShowExistentialPopup(false))}
        >
          <div className="existential-modal-card">
            <p>WHY ARE YOU PRESSING THIS?</p>
            <strong>for no fucking reason at all</strong>
            <span>-NOPE</span>
            <button type="button" onClick={() => setShowExistentialPopup(false)}>
              [ erm... yea... nope ]
            </button>
          </div>
        </section>
      )}

      {showResetConfirm && (
        <section
          className="reset-modal-overlay"
          aria-modal="true"
          role="dialog"
          onClick={(event) => handleModalBackdropClick(event, () => setShowResetConfirm(false))}
        >
          <div className="reset-modal-card">
            <strong>WIPE NOPE PROGRESS?</strong>
            <p>This deletes your NOPEDEX, achievements, rank, count, intro state, and collected garbage.</p>
            <div className="reset-modal-actions">
              <button type="button" onClick={() => setShowResetConfirm(false)}>
                [ cancel ]
              </button>
              <button type="button" onClick={resetNopeProgress}>
                [ yes, regret everything ]
              </button>
            </div>
          </div>
        </section>
      )}

      {isStickerBookOpen && (
        <section className={`stickerbook-overlay ${isStickerBookTearing ? "stickerbook-tearing" : ""}`} aria-label="NOPEDEX sticker book" ref={stickerBookOverlayRef}>
          <div className="stickerbook-window">
            <div className="stickerbook-titlebar">
              <div>
                <strong>NOPEDEX STICKER BOOK</strong>
                <span>collect garbage. achieve nothing.</span>
              </div>
              <button type="button" onClick={() => setIsStickerBookOpen(false)}>
                [ CLOSE NOPEDEX ]
              </button>
            </div>

            <div className="stickerbook-scroll" ref={stickerBookScrollRef} onScroll={handleStickerBookScroll}>
              <div className="stickerbook-summary">
                <div className="stickerbook-counter-strip">
                  <span>GARBAGE {normalCollectedCount}/{NORMAL_TOTAL}</span>
                  <span>LOOPS {gifCollectedCount}/{GIF_TOTAL}</span>
                  <span>MYTHIC {mythicCollectedCount}/{MYTHIC_TOTAL}</span>
                  <span>UBER {uberCollectedCount}/{UBER_TOTAL}</span>
                  <span>ACHIEVEMENTS {unlockedAchievementCount}/{achievements.length}</span>
                </div>
                <div className="completion-badges">
                  <span className={`completion-badge ${nopedexComplete ? "unlocked" : "locked"}`}>
                    <strong>NOPEDEX COMPLETE</strong>
                    <em>status: {nopedexComplete ? "UNLOCKED" : "LOCKED"}</em>
                    <small>all non-Uber NOPEs found</small>
                  </span>
                  <span className={`completion-badge ${nopedexAscended ? "unlocked" : "locked"}`}>
                    <strong>NOPEDEX ASCENDED</strong>
                    <em>status: {nopedexAscended ? "UNLOCKED" : "LOCKED"}</em>
                    <small>everything found, including Uber NOPEs</small>
                  </span>
                </div>
              </div>

              {renderZChamberPanel()}

              <div className="stickerbook-controls primary-controls" aria-label="NOPEDEX view controls">
                {stickerBookNavItems.map(([value, label]) => (
                  <button
                    className={`${stickerTab === value ? "active" : ""} ${value === "grinder" ? `grinder-nav-tab ${isGrinderReady ? "ready" : "idle"}` : ""}`}
                    key={value}
                    type="button"
                    onClick={() => switchStickerTab(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {stickerTab !== "grinder" && (
              <div className="stickerbook-controls filter-controls" aria-label="NOPEDEX filters">
                {[
                  ["all", "ALL"],
                  ["found", "FOUND"],
                  ["missing", "MISSING"],
                ].map(([value, label]) => (
                  <button
                    className={stickerFilter === value ? "active" : ""}
                    key={value}
                    type="button"
                    onClick={() => setStickerFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              )}

              {stickerTab === "grinder" ? (
                <section
                  className={`duplicate-grinder-section ${isGrinderPromptPulsing ? "grinder-prompt-pulse" : ""}`}
                  ref={duplicateGrinderSectionRef}
                  aria-label="Duplicate Grinder"
                >
                  <div className="achievement-section-title grinder-section-title">
                    <strong>DUPLICATE GRINDER</strong>
                    <span>feed repeated NOPEs into the machine.</span>
                    <span>receive rarer disappointment.</span>
                  </div>
                  <div className="grinder-recipe-grid">{DUPLICATE_GRINDER_RECIPES.map(renderGrinderRecipe)}</div>
                  <section className="burn-pile-section" aria-label="Sacrificed NOPEs">
                    <div className="achievement-section-title burn-pile-title">
                      <strong>THE BURN PILE</strong>
                      <span>sacrificed NOPEs waiting to be found again.</span>
                    </div>
                    {getSacrificedEntities().length > 0 ? (
                      <div className="burn-pile-grid">{getSacrificedEntities().map(renderSacrificedCard)}</div>
                    ) : (
                      <div className="burn-pile-empty">
                        <strong>THE BURN PILE IS EMPTY.</strong>
                        <span>nothing has been burned yet.</span>
                        <em>coward.</em>
                      </div>
                    )}
                  </section>
                </section>
              ) : stickerTab === "achievements" ? (
                <section className="achievement-section" aria-label="NOPE OS achievements">
                  <div className="achievement-section-title">
                    <strong>ACHIEVEMENTS.dat</strong>
                    <span className="achievement-unlocked-stat">unlocked: {unlockedAchievementCount.toString().padStart(3, "0")} / {achievements.length.toString().padStart(3, "0")}</span>
                    <span className="achievement-zero-stat">reward value: zero</span>
                  </div>
                  <div className="achievement-grid">{getVisibleAchievements().map(renderAchievementCard)}</div>
                </section>
              ) : stickerFilter === "found" ? (
                renderFoundAlbumSections()
              ) : (
                <>
                  {stickerTab === "all" && (
                    <section className="uber-section" aria-label="UBER NOPE SIGNALS">
                      <div className="uber-section-title">
                        <strong>UBER SIGNALS DETECTED</strong>
                        <span>classified finds: {uberCollectedCount} / {UBER_TOTAL}</span>
                        <span>odds: offensive</span>
                      </div>
                      {getVisibleUberEntities().length > 0 && (
                        <>
                          <div className="uber-section-title recovered">
                            <strong>UBER NOPE SIGNALS</strong>
                            <span>impossible NOPEs recovered.</span>
                          </div>
                          <div className="uber-grid">{getVisibleUberEntities().map(renderStickerCard)}</div>
                        </>
                      )}
                    </section>
                  )}

                  {stickerTab === "all" && getVisibleMythicEntities().length > 0 && (
                    <section className="mythic-section" aria-label="MYTHIC NOPE RELICS">
                      <div className="mythic-section-title">
                        <strong>MYTHIC NOPE</strong>
                        <span>known chase NOPE. drop chance: 0.5%.</span>
                      </div>
                      <div className="mythic-grid">{getVisibleMythicEntities().map(renderStickerCard)}</div>
                    </section>
                  )}

                  <div className="sticker-grid">
                    {getVisibleStickerEntities().map(renderStickerCard)}
                  </div>
                </>
              )}
            </div>
            <div className="stickerbook-floating-nav" aria-label="Floating NOPEDEX navigation">
              <div className="stickerbook-floating-tabs">
                {stickerBookNavItems.map(([value, , shortLabel]) => (
                  <button
                    className={`${stickerTab === value ? "active" : ""} ${value === "grinder" ? `grinder-nav-tab ${isGrinderReady ? "ready" : "idle"}` : ""}`}
                    key={value}
                    type="button"
                    onClick={() => switchStickerTab(value)}
                  >
                    {shortLabel}
                  </button>
                ))}
              </div>
              <button className="stickerbook-close-button" type="button" onClick={() => setIsStickerBookOpen(false)}>
                CLOSE BOOK
              </button>
              <button className="stickerbook-top-button" type="button" onClick={scrollStickerBookToTop}>
                Back to Top? Fine...
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
