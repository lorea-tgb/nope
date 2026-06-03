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
  bootLines,
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
  forcedStickerBookPopupCount: "nope_forced_stickerbook_popup_count",
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
};

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

function formatDropChance(chance) {
  return `${Number(chance).toFixed(chance < 1 ? 2 : 1).replace(/\.?0+$/, "")}%`;
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - ((-2 * progress + 2) ** 3) / 2;
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
  const [znopeAcquired, setZnopeAcquired] = useState(() =>
    readStoredString(STORAGE_KEYS.zNopeAcquired) === "true" || readStoredArray(STORAGE_KEYS.collectedIds).includes("znope"),
  );
  const [zTokenClaimedAchievementIds, setZTokenClaimedAchievementIds] = useState(() =>
    readStoredArray(STORAGE_KEYS.zTokenClaimedAchievementIds),
  );
  const [zTokenPopupQueue, setZTokenPopupQueue] = useState([]);
  const [activeZTokenPopup, setActiveZTokenPopup] = useState(null);
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
  const [isZChamberOpen, setIsZChamberOpen] = useState(false);
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
  const [sacrificedIds, setSacrificedIds] = useState(() =>
    readStoredArray(STORAGE_KEYS.sacrificedIds),
  );
  const [latestDiscoveryId, setLatestDiscoveryId] = useState(() =>
    readStoredString(STORAGE_KEYS.latestDiscoveryId),
  );
  const [isBooting, setIsBooting] = useState(true);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isAmbientGlitch, setIsAmbientGlitch] = useState(false);
  const [ambientWarning, setAmbientWarning] = useState(null);
  const [isNopeIdle, setIsNopeIdle] = useState(false);
  const [isStickerBookOpen, setIsStickerBookOpen] = useState(false);
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
  const nopeCountRef = useRef(nopeCount);
  const collectedIdsRef = useRef(collectedIds);
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
  const unlockedAchievementsRef = useRef(unlockedAchievements);
  const achievementQueueRef = useRef(achievementQueue);
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
  const telegramDiscoveryHapticCooldownRef = useRef(false);
  const telegramDiscoveryHapticTimerRef = useRef(null);
  const telegramSignalLineRef = useRef(false);
  const isTelegramMiniApp = Boolean(telegramWebApp);
  const telegramUser = telegramWebApp?.initDataUnsafe?.user ?? null;

  const formattedCount = useMemo(
    () => nopeCount.toString().padStart(6, "0"),
    [nopeCount],
  );
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
    activeZTokenPopup,
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
      `Telegram signal detected${telegramUser?.first_name ? `: ${telegramUser.first_name}` : ""}. suspicious.`,
    ));
  }, [telegramUser?.first_name, telegramWebApp]);

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
    window.localStorage.setItem(STORAGE_KEYS.collectedIds, JSON.stringify(collectedIds));
    collectedIdsRef.current = collectedIds;
  }, [collectedIds]);

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
    if (!pendingFirstStickerPopup || activeAchievement || activeStickerInspectEntity || activeAchievementInspect || activeZTokenPopup || isZChamberOpen || activeZRollResult || showGrinderReadyPrompt || achievementQueue.length > 0) {
      return undefined;
    }

    const popupTimer = window.setTimeout(() => {
      setPendingFirstStickerPopup(false);
      armImportantModalActionDelay();
      setShowFirstStickerPopup(true);
    }, 0);

    return () => window.clearTimeout(popupTimer);
  }, [activeAchievement, activeAchievementInspect, activeStickerInspectEntity, activeZRollResult, activeZTokenPopup, achievementQueue.length, isZChamberOpen, pendingFirstStickerPopup, showGrinderReadyPrompt]);

  useEffect(() => {
    if (showIntro) {
      return undefined;
    }

    let isCancelled = false;
    const runId = bootRunRef.current + 1;
    bootRunRef.current = runId;

    async function typeBootLine(bootLine) {
      const lineId = lineIdRef.current;
      lineIdRef.current += 1;

      setLines((currentLines) => [
        ...currentLines,
        {
          id: lineId,
          speaker: "system",
          text: "",
          isTyping: true,
          important: Boolean(bootLine.important),
        },
      ]);

      for (let index = 1; index <= bootLine.text.length; index += 1) {
        if (isCancelled || bootRunRef.current !== runId) {
          return;
        }

        await sleep(bootLine.important ? randomBetween(18, 34) : randomBetween(3, 9));

        setLines((currentLines) =>
          currentLines.map((line) =>
            line.id === lineId ? { ...line, text: bootLine.text.slice(0, index) } : line,
          ),
        );
      }

      setLines((currentLines) =>
        currentLines.map((line) =>
          line.id === lineId ? { ...line, isTyping: false } : line,
        ),
      );
    }

    async function runBootSequence() {
      setLines([]);
      setIsBooting(true);

      await sleep(280);

      for (const bootLine of bootLines) {
        if (isCancelled || bootRunRef.current !== runId) {
          return;
        }

        await typeBootLine(bootLine);

        await sleep(bootLine.pause ?? randomBetween(35, 105));
      }

      if (!isCancelled && bootRunRef.current === runId) {
        setIsBooting(false);
      }
    }

    runBootSequence();

    return () => {
      isCancelled = true;
    };
  }, [showIntro]);

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

  function setSacrificedIdsSynced(nextIds) {
    const ids = typeof nextIds === "function" ? nextIds(sacrificedIdsRef.current) : nextIds;
    sacrificedIdsRef.current = ids;
    setSacrificedIds(ids);
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
      return `duplicate UBER NOPE detected: ${entity.name}. probability wasted harder.`;
    }

    if (alreadyCollected && entity.type === "mythic") {
      return `duplicate MYTHIC NOPE detected: ${entity.name}. probability wasted.`;
    }

    if (alreadyCollected) {
      return `duplicate: ${entity.name}. disappointment increased.`;
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

    return `new trash discovered: ${entity.name}. value gained: zero.`;
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
    addInstantNopeLine(`duplicate ${DUPLICATE_MATERIAL_LABELS[materialTier]} converted into grinder fuel. probably legal.`);

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
      "animated-regret": [snapshot.gifCollectedCount, 10, "loops"],
      "ashes-to-nopedex": [snapshot.restoredFromBurnCount, 10, "restored NOPEs"],
      "ascended-into-nope": [snapshot.uberCollectedCount, UBER_TOTAL, "Uber NOPEs"],
      "ash-collector": [snapshot.sacrificeCount, 10, "sacrifices"],
      "absolute-degenerate": [snapshot.uberSacrificeCount, 1, "Uber sacrifices"],
      "burn-notice": [snapshot.sacrificeCount, 1, "sacrifices"],
      "burn-pile-curator": [snapshot.burnPileCount, 10, "burn pile NOPEs"],
      "common-sense-lost": [snapshot.commonCollectedCount, 25, "common trash stickers"],
      "contract-said-non": [snapshot.contractCopyCount, 1, "contract copies"],
      "copypasta-contagion": [snapshot.shareCopyCount, 10, "share copies"],
      "duplicate-damage": [snapshot.duplicateCount, 10, "duplicates"],
      "emotional-recycling": [snapshot.duplicateCount, 50, "duplicates"],
      "feed-the-machine": [snapshot.sacrificeCount, 5, "sacrifices"],
      "five-z-rolls-still-nope": [snapshot.zRollFailures, 5, "failed Z rolls"],
      "final-boss-press": [snapshot.nopeCount, 500, "NOPE presses"],
      "first-try-disgusting": [snapshot.zNopeAcquired && snapshot.zRollAttempts === 1 ? 1 : 0, 1, "first-try Z"],
      "found-in-the-ashes": [snapshot.restoredFromBurnCount, 1, "restored NOPEs"],
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
      "phoenix-nopedex": [snapshot.restoredFromBurnCount, 5, "restored NOPEs"],
      "public-embarrassment": [snapshot.shareCount, 5, "shares"],
      "rubbish-with-range": [snapshot.uncommonCollectedCount, 10, "uncommon trash stickers"],
      "scorched-earth": [snapshot.sacrificeCount, 25, "sacrifices"],
      "spread-the-disease": [snapshot.shareCount, 1, "shares"],
      "sticker-gremlin": [snapshot.normalCollectedCount, 50, "stickers"],
      "ten-z-rolls-zero-z": [snapshot.zRollFailures, 10, "failed Z rolls"],
      "terminal-idiot-press": [snapshot.nopeCount, 25, "NOPE presses"],
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

  function queueAchievementUnlocks(snapshot, delay = 0) {
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
    setAchievementQueueSynced((currentQueue) => [...currentQueue, ...newAchievements]);
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

  function dismissAchievement() {
    if (!isImportantModalActionReady) {
      return;
    }

    if (achievementQueueRef.current.length > 0) {
      const [nextAchievement, ...remainingAchievements] = achievementQueueRef.current;
      setActiveAchievementSynced(nextAchievement);
      setAchievementQueueSynced(remainingAchievements);
      return;
    }

    setActiveAchievementSynced(null);
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
      addInstantNopeLine("UBER NOPE sacrificed. probability is filing a complaint.");
    } else {
      addInstantNopeLine(`${entity.name} fed to the grinder.`);
    }

    addInstantNopeLine("active collection decreased. brilliant work.");
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

  function handleModalBackdropClick(event, onBackdropClose, { respectImportantDelay = false } = {}) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (respectImportantDelay && !isImportantModalActionReady) {
      return;
    }

    onBackdropClose();
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
    );
  }

  function forceUberDiscovery() {
    const uncollectedUber = uberNopeRelics.find((entity) => !collectedIdsRef.current.includes(entity.id));
    const forcedUber = uncollectedUber || pickRandom(uberNopeRelics);

    processDiscoveryEntity(forcedUber, nopeCountRef.current);
  }

  function forceRareDiscovery() {
    const forcedRarePool = allNopeEntities.filter((entity) => entity.type !== "uber" && entity.dropChance < FORCED_STICKERBOOK_DROP_THRESHOLD);
    const uncollectedRare = forcedRarePool.find((entity) => !collectedIdsRef.current.includes(entity.id));
    const forcedRare = uncollectedRare || pickRandom(forcedRarePool);

    processDiscoveryEntity(forcedRare, nopeCountRef.current);
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
    addInstantNopeLine(`duplicate grinder consumed ${recipe.cost} ${DUPLICATE_MATERIAL_LABELS[recipe.source]} fuel.`);
    addInstantNopeLine(`recycled output generated: ${resultEntity.name}.`);
    setActiveCraftResultSynced({
      entity: resultEntity,
      shouldOpenGoodFind: isForcedStickerBookFind(resultEntity, !wasNew),
      wasNew,
    });
    processDiscoveryEntity(resultEntity, nopeCountRef.current, {
      achievementStats: nextStats,
      awardDuplicateMaterial: false,
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
      setAchievementQueueSynced((currentQueue) => [...currentQueue, forcedAchievement]);
    }

    awardZRollTokensForAchievements([forcedAchievement]);
    startNextAchievement(0);
  }

  function closeZChamber() {
    isZChamberOpenRef.current = false;
    activeZRollResultRef.current = null;
    setIsZChamberOpen(false);
    setActiveZRollResult(null);
    startNextAchievement(450);
  }

  function openZChamber() {
    isZChamberOpenRef.current = true;
    setIsZChamberOpen(true);
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

  function awardZNopeSuccess(result = 1, { countAttempt = true } = {}) {
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
    setSacrificedIdsSynced((currentIds) => currentIds.filter((id) => id !== zNopeEntity.id));
    const nextStats = updateAchievementStats({ zNopeAcquired: 1, ...(countAttempt ? { zRollAttempts: 1 } : {}) });
    setLatestDiscoveryId(zNopeEntity.id);
    addInstantNopeLine("Z NOPE acquired. probability has stopped taking calls.");
    activeZRollResultRef.current = { result, type: "success" };
    setActiveZRollResult({ result, type: "success" });
    queueAchievementUnlocks(buildAchievementSnapshot({
      achievementStats: nextStats,
      collectedIds: nextCollectedIds,
      zNopeAcquired: 1,
      zRollAttempts: nextAttempts,
    }), 650);
  }

  function forceZSuccess() {
    awardZNopeSuccess(1, { countAttempt: true });
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
    activeZRollResultRef.current = { result, type: "failure" };
    setActiveZRollResult({ result, type: "failure" });
    queueAchievementUnlocks(buildAchievementSnapshot({
      achievementStats: nextStats,
      zRollAttempts: nextAttempts,
      zRollFailures: nextFailures,
    }), 450);
  }

  function forceCommonDuplicate() {
    const collectedCommon = standardNopeEntities.find((entity) => entity.rarity === "common" && collectedIdsRef.current.includes(entity.id));

    if (collectedCommon) {
      processDiscoveryEntity(collectedCommon, nopeCountRef.current);
      return;
    }

    const commonEntity = standardNopeEntities.find((entity) => entity.rarity === "common");

    if (!commonEntity) {
      addInstantNopeLine("common duplicate failed. somehow common trash was missing.");
      return;
    }

    processDiscoveryEntity(commonEntity, nopeCountRef.current);
    processDiscoveryEntity(commonEntity, nopeCountRef.current);
  }

  function pressNope() {
    triggerTelegramHaptic("light");
    resetNopeIdleTimer();

    const nextLabel = pickRandom(nopeLabels);
    const discoveredEntity = getNextDiscoveryEntity();
    const nextCount = nopeCountRef.current + 1;
    const nextRank = getRank(nextCount);
    const rankChanged = nextRank !== getRank(nopeCountRef.current);

    nopeCountRef.current = nextCount;
    setNopeCount(nextCount);
    pendingGlobalNopesRef.current += 1;

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
      addInstantNopeLine(pickRandom(noHitMessages));

      queueAchievementUnlocks(
        buildAchievementSnapshot({
          achievementStats: achievementStatsRef.current,
          collectedIds: collectedIdsRef.current,
          nopeCount: nextCount,
        }),
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

  function getVisibleFoundLoopEntities() {
    return getVisibleStickerEntities().filter((entity) => entity.type === "gif");
  }

  function getVisibleFoundNormalEntities() {
    return getVisibleStickerEntities().filter((entity) => entity.type !== "gif");
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
      "ash-collector",
      "ashes-to-nopedex",
      "burn-notice",
      "burn-pile-curator",
      "common-mistake",
      "duplicate-damage",
      "emotional-recycling",
      "epic-waste-facility",
      "feed-the-machine",
      "found-in-the-ashes",
      "fuel-goblin",
      "fuel-hoarder",
      "industrial-regret",
      "machine-is-hungry",
      "phoenix-nopedex",
      "rarely-worth-it",
      "scorched-earth",
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

    return (
      <section className={`z-chamber-panel ${isAcquired ? "acquired" : zRollTokens > 0 ? "ready" : "locked"}`} aria-label="Z Chamber">
        <strong>{isAcquired ? "Z SIGNAL DETECTED" : "Z SIGNAL"}</strong>
        <span>
          {isAcquired
            ? "Z NOPE ACQUIRED"
            : zRollTokens > 0
              ? `rolls available: ${zRollTokens}`
              : "status: unresolved"}
        </span>
        {isAcquired && <em>the rarest refusal has entered the NOPEDEX.</em>}
        {!isAcquired && <em>source: Z CHAMBER only // odds: 1%</em>}
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
        {zRollTokens > 0 && !isAcquired && (
          <button type="button" onClick={openZChamber}>
            [ ENTER Z CHAMBER ]
          </button>
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
    const isAlready = activeZRollResult?.type === "already";
    const isEmpty = activeZRollResult?.type === "empty";

    return (
      <section className="z-chamber-modal-overlay" aria-modal="true" role="dialog" onClick={(event) => handleModalBackdropClick(event, closeZChamber)}>
        <div className={`z-chamber-modal-card ${isSuccess ? "success" : isFailure ? "failure" : ""}`}>
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
              <b>value: still zero</b>
              <small>The rarest refusal has entered your NOPEDEX.</small>
              <small>Probability has stopped taking calls.</small>
              <button type="button" onClick={openZNopeInBook}>
                OPEN STICKER BOOK. WORSHIP NOTHING.
              </button>
            </>
          ) : isFailure ? (
            <>
              <p>Z SAID NOPE</p>
              <strong>ROLL RESULT: {activeZRollResult.result} / 100</strong>
              <span>You needed 1.</span>
              <span>You got {activeZRollResult.result}.</span>
              <b>That is not 1.</b>
              {zRollTokens <= 0 && (
                <>
                  <small>The chamber is empty.</small>
                  <small>The machine suggests regret everything.</small>
                  <small>This is not financial advice. It is worse.</small>
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
              <p>Z CHAMBER</p>
              <strong>{isAlready ? "Z NOPE ALREADY ACQUIRED." : "Z ROLLS: " + zRollTokens}</strong>
              <span>{isAlready ? "the machine cannot improve on refusal." : "Roll 1-100."}</span>
              {!isAlready && <span>Roll 1 and receive Z NOPE.</span>}
              {!isAlready && <span>Roll anything else and receive emotional damage.</span>}
              {isEmpty && <b>NO Z ROLLS REMAIN.</b>}
              {isEmpty && <small>unlock cursed achievements or regret everything.</small>}
              <div className="z-chamber-actions">
                <button type="button" onClick={rollZChamber} disabled={zRollTokens <= 0 || znopeAcquired}>
                  {zRollTokens <= 0 ? "NO Z ROLLS REMAIN." : "ROLL THE Z"}
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
      className={`nope-page ${isTelegramMiniApp ? "telegram-mini-app" : ""} ${isGlitching ? "is-glitching" : ""} ${isAmbientGlitch ? "ambient-glitch" : ""} ${isNopeIdle ? "nope-idle" : ""}`}
    >
      <div className="crt-noise" />
      <div className="app-code-rain" aria-hidden="true">
        {Array.from({ length: 36 }, (_, index) => (
          <span key={index}>NOPE NON TON 404 REJECT NOTPEPE NOPE 0X00 NON</span>
        ))}
      </div>
      {ambientWarning && <div className="glitch-warning">{ambientWarning}</div>}
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
            <p>NOPE MACHINE.exe</p>
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
        <p>PRESS NOPE. COLLECT WORTHLESS TRASH.</p>
        <button
          className="mega-nope image-nope-button"
          type="button"
          onClick={pressNope}
          aria-label={`Press ${buttonText}`}
        >
          <img src="/images/nopebutton.png" alt="NOPE" />
        </button>
        <div className="status-panel">
          <div className="status-row status-counts">
            <span className="stat-chunk">YOUR NOPES: {formattedCount}</span>
            <span className={`stat-chunk worldwide-nopes ${globalCountPulse ? "is-updating" : ""}`}>
              WORLDWIDE NOPES: {formattedGlobalCount}
            </span>
          </div>
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
        <a href="#" onClick={(event) => event.preventDefault()}>
          Telegram
        </a>
        <a href="#" onClick={(event) => event.preventDefault()}>
          Chart
        </a>
        <a href="#" onClick={(event) => event.preventDefault()}>
          Buy? lol
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
        {zRollTokens > 0 && !znopeAcquired && (
          <button className="dev-reset-button" type="button" onClick={openZChamber}>
            [ enter z chamber ]
          </button>
        )}
      </footer>

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
      {renderZChamberModal()}

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

      {activeAchievement && !activeSacrificeEntity && !activeUberSacrificeEntity && !activeCraftResult && !activeGoodFindModal && !isZChamberOpen && !activeZRollResult && !showGrinderReadyPrompt && (
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
            <strong>for no good reason. obviously.</strong>
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
              ) : (
                <>
                  {stickerTab === "all" && stickerFilter === "found" && getVisibleFoundLoopEntities().length > 0 && (
                    <div className="sticker-grid">{getVisibleFoundLoopEntities().map(renderStickerCard)}</div>
                  )}

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
                    {(stickerTab === "all" && stickerFilter === "found"
                      ? getVisibleFoundNormalEntities()
                      : getVisibleStickerEntities()
                    ).map(renderStickerCard)}
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
