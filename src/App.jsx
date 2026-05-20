import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
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
} from "./nopeData";


const STORAGE_KEYS = {
  achievementStats: "nopeMachine.achievementStats",
  collectedIds: "nopeMachine.collectedIds",
  introSeen: "nopeIntroSeen",
  latestDiscoveryId: "nopeMachine.latestDiscoveryId",
  nopeCount: "nopeMachine.nopeCount",
  unlockedAchievements: "nopeMachine.unlockedAchievements",
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

function formatDropChance(chance) {
  return `${Number(chance).toFixed(chance < 1 ? 2 : 1).replace(/\.?0+$/, "")}%`;
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

export default function App() {
  const [showIntro, setShowIntro] = useState(() => readStoredString(STORAGE_KEYS.introSeen) !== "true");
  const [introChoice, setIntroChoice] = useState(null);
  const [isIntroExiting, setIsIntroExiting] = useState(false);
  const [lines, setLines] = useState([]);
  const [nopeCount, setNopeCount] = useState(() => readStoredNumber(STORAGE_KEYS.nopeCount));
  const [achievementStats, setAchievementStats] = useState(() =>
    readStoredObject(STORAGE_KEYS.achievementStats, defaultAchievementStats),
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState(() =>
    readStoredArray(STORAGE_KEYS.unlockedAchievements),
  );
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [activeAchievement, setActiveAchievement] = useState(null);
  const [activeDiscoveryPopup, setActiveDiscoveryPopup] = useState(null);
  const [activeBreachOverlay, setActiveBreachOverlay] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExistentialPopup, setShowExistentialPopup] = useState(false);
  const [collectedIds, setCollectedIds] = useState(() =>
    readStoredArray(STORAGE_KEYS.collectedIds),
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
  const [buttonText, setButtonText] = useState("NOPE");
  const glitchTimerRef = useRef(null);
  const discoveryTimerRef = useRef(null);
  const breachTimerRef = useRef(null);
  const achievementDelayTimerRef = useRef(null);
  const shareCopyTimerRef = useRef(null);
  const ambientTimerRef = useRef(null);
  const ambientClearTimerRef = useRef(null);
  const nopeIdleTimerRef = useRef(null);
  const terminalLogRef = useRef(null);
  const lineIdRef = useRef(0);
  const nopeCountRef = useRef(nopeCount);
  const collectedIdsRef = useRef(collectedIds);
  const achievementStatsRef = useRef(achievementStats);
  const unlockedAchievementsRef = useRef(unlockedAchievements);
  const achievementQueueRef = useRef(achievementQueue);
  const activeAchievementRef = useRef(activeAchievement);
  const bootRunRef = useRef(0);

  const formattedCount = useMemo(
    () => nopeCount.toString().padStart(6, "0"),
    [nopeCount],
  );
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
  const shareEntity = useMemo(() => {
    if (typeof window === "undefined" || !window.location.pathname.startsWith("/share/")) {
      return null;
    }

    const id = decodeURIComponent(window.location.pathname.replace("/share/", "").split("/")[0]);
    return getNopeEntityById(id) ?? false;
  }, []);

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
      window.clearTimeout(ambientTimerRef.current);
      window.clearTimeout(ambientClearTimerRef.current);
      window.clearTimeout(nopeIdleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.nopeCount, String(nopeCount));
    nopeCountRef.current = nopeCount;
  }, [nopeCount]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.collectedIds, JSON.stringify(collectedIds));
    collectedIdsRef.current = collectedIds;
  }, [collectedIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.achievementStats, JSON.stringify(achievementStats));
    achievementStatsRef.current = achievementStats;
  }, [achievementStats]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.unlockedAchievements, JSON.stringify(unlockedAchievements));
    unlockedAchievementsRef.current = unlockedAchievements;
  }, [unlockedAchievements]);

  useEffect(() => {
    if (latestDiscoveryId) {
      window.localStorage.setItem(STORAGE_KEYS.latestDiscoveryId, latestDiscoveryId);
    }
  }, [latestDiscoveryId]);

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

        await sleep(bootLine.important ? randomBetween(18, 34) : randomBetween(7, 18));

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

        await sleep(bootLine.pause ?? randomBetween(80, 230));
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

  function setActiveAchievementSynced(nextAchievement) {
    activeAchievementRef.current = nextAchievement;
    setActiveAchievement(nextAchievement);
  }

  function startNextAchievement(delay = 0) {
    window.clearTimeout(achievementDelayTimerRef.current);

    achievementDelayTimerRef.current = window.setTimeout(() => {
      if (activeAchievementRef.current || achievementQueueRef.current.length === 0) {
        return;
      }

      const [nextAchievement, ...remainingAchievements] = achievementQueueRef.current;
      setAchievementQueueSynced(remainingAchievements);
      setActiveAchievementSynced(nextAchievement);
    }, delay);
  }

  function showDiscoveryPopup(event) {
    if (!event) {
      return;
    }

    setActiveDiscoveryPopup(event);
    window.clearTimeout(discoveryTimerRef.current);
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

  function getDiscoveryVisualEvent(entity, alreadyCollected) {
    if (!alreadyCollected && entity.type === "uber") {
      return {
        duration: randomBetween(4200, 4800),
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
        duration: randomBetween(900, 1400),
        entity,
        type: "breach",
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
        signalType: entity.type === "uber" ? "uber" : entity.type === "mythic" ? "mythic" : entity.type === "gif" ? "forbidden" : "duplicate",
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
        return {
          duration: randomBetween(900, 1400),
          entity,
          type: "breach",
        };
      }

      return null;
    }

    if ((!alreadyCollected && randomChance(0.2)) || (alreadyCollected && randomChance(0.03))) {
      return {
        duration: randomBetween(900, 1400),
        entity: pickRandom(forbiddenNopeGifs),
        type: "breach",
      };
    }

    return null;
  }

  function getDiscoveryMessage(entity, alreadyCollected) {
    if (alreadyCollected && entity.type === "uber") {
      return `duplicate Uber NOPE detected: ${entity.name}. probability wasted harder.`;
    }

    if (alreadyCollected && entity.type === "mythic") {
      return `duplicate mythic waste detected: ${entity.name}. probability wasted.`;
    }

    if (alreadyCollected) {
      return `duplicate: ${entity.name}. disappointment increased.`;
    }

    if (entity.type === "uber") {
      return `UBER NOPE DISCOVERED: ${entity.name}. probability has been insulted.`;
    }

    if (entity.type === "mythic") {
      return `MYTHIC WASTE DISCOVERED: ${entity.name}. value gained: somehow still zero.`;
    }

    if (entity.type === "gif") {
      return `FORBIDDEN GIF BREACH: ${entity.name}. this should not have happened.`;
    }

    return `new trash discovered: ${entity.name}. value gained: zero.`;
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

  function buildAchievementSnapshot(overrides = {}) {
    const ids = overrides.collectedIds ?? collectedIdsRef.current;
    const stats = { ...achievementStatsRef.current, ...(overrides.achievementStats ?? {}) };

    return {
      ...stats,
      ...getCollectionCounts(ids),
      collectedIds: ids,
      nopeCount: overrides.nopeCount ?? nopeCountRef.current,
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

    if (!activeAchievementRef.current) {
      startNextAchievement(delay);
    }
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
    if (achievementQueueRef.current.length > 0) {
      const [nextAchievement, ...remainingAchievements] = achievementQueueRef.current;
      setActiveAchievementSynced(nextAchievement);
      setAchievementQueueSynced(remainingAchievements);
      return;
    }

    setActiveAchievementSynced(null);
  }

  function resetNopeProgress() {
    Object.keys(window.localStorage)
      .filter((key) => key.toLowerCase().includes("nope"))
      .forEach((key) => window.localStorage.removeItem(key));

    window.location.reload();
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
        addInstantNopeLine("button awaiting poor decision.");
      }
    }, randomBetween(6000, 8000));
  }

  function pressNope() {
    if (isBooting) {
      return;
    }

    resetNopeIdleTimer();

    const nextLabel = pickRandom(nopeLabels);
    const discoveredEntity = pickDiscoveryEntity();
    const nextCount = nopeCountRef.current + 1;
    const nextRank = getRank(nextCount);
    const rankChanged = nextRank !== getRank(nopeCountRef.current);
    let nextAchievementStats = achievementStatsRef.current;
    let nextCollectedIds = collectedIdsRef.current;

    nopeCountRef.current = nextCount;
    setNopeCount(nextCount);

    if (discoveredEntity) {
      const alreadyCollected = collectedIdsRef.current.includes(discoveredEntity.id);
      const visualEvent = getDiscoveryVisualEvent(discoveredEntity, alreadyCollected);
      const breachEvent = visualEvent?.type === "breach" ? null : getBreachVisualEvent(discoveredEntity, alreadyCollected);

      showDiscoveryVisualEvent(visualEvent);
      showBreachOverlay(breachEvent);
      setLatestDiscoveryId(discoveredEntity.id);

      if (!alreadyCollected) {
        nextCollectedIds = [...collectedIdsRef.current, discoveredEntity.id];
        collectedIdsRef.current = nextCollectedIds;
        setCollectedIds(nextCollectedIds);
      } else {
        nextAchievementStats = updateAchievementStats({ duplicateCount: 1 });
      }

      addInstantNopeLine(getDiscoveryMessage(discoveredEntity, alreadyCollected));

      queueAchievementUnlocks(
        buildAchievementSnapshot({
          achievementStats: nextAchievementStats,
          collectedIds: nextCollectedIds,
          nopeCount: nextCount,
        }),
        !alreadyCollected ? randomBetween(700, 1000) : 0,
      );
    } else {
      addInstantNopeLine(pickRandom(noHitMessages));

      queueAchievementUnlocks(
        buildAchievementSnapshot({
          achievementStats: nextAchievementStats,
          collectedIds: nextCollectedIds,
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
      addInstantNopeLine(`rank updated: ${nextRank}. achievement value: zero.`);
    }
  }

  function getStickerEntities() {
    if (stickerTab === "achievements") {
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

  function getStickerShareUrl(entity) {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${siteUrl}/share/${encodeURIComponent(entity.id)}`;
  }

  // Vercel serves /share/:id through /api/share so social crawlers get
  // sticker-specific OG tags and a generated /api/og card image.
  function getShareText(entity) {
    const shareUrl = getStickerShareUrl(entity);
    const dropText = `drop: ${formatDropChance(entity.dropChance)}`;

    if (entity.type === "uber") {
      return `UBER NOPE FOUND:
${entity.name}

${dropText}
probability has been insulted.
value gained: zero.

$NOPE

${shareUrl}`;
    }

    if (entity.type === "mythic") {
      return `MYTHIC WASTE FOUND:
${entity.name}

${dropText}
somehow still worth zero.

$NOPE

${shareUrl}`;
    }

    if (entity.type === "gif") {
      return `FORBIDDEN NOPE LOOP DISCOVERED:
${entity.name}

${dropText}
this should not have happened.
value gained: zero.

$NOPE

${shareUrl}`;
    }

    return `NOPEDEX discovery:
${entity.name}

${entity.rarityLabel}
${dropText}
value gained: zero.

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

  function renderAchievementCard(achievement) {
    const isUnlocked = unlockedAchievements.includes(achievement.id);

    return (
      <article
        className={`achievement-card ${isUnlocked ? "achievement-unlocked" : "achievement-locked"}`}
        key={achievement.id}
      >
        <span>{isUnlocked ? "UNLOCKED" : "LOCKED"}</span>
        <strong>{achievement.name}</strong>
        <p>{achievement.description}</p>
        <em>reward: {achievement.reward}</em>
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

  function renderStickerCard(entity, index) {
    const isCollected = collectedIds.includes(entity.id);
    const isGif = entity.type === "gif";
    const isMythic = entity.type === "mythic";
    const isUber = entity.type === "uber";

    return (
      <article
        className={`sticker-card ${isCollected ? "collected" : "locked"} ${isGif ? "gif-card" : ""} ${isMythic ? "mythic-card" : ""} ${isUber ? "uber-card" : ""} rarity-${entity.rarity}`}
        key={entity.id}
        style={{ "--sticker-tilt": `${((index % 5) - 2) * 1.25}deg` }}
      >
        {isCollected ? (
          <>
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
            <em>value: zero</em>
            <div className="sticker-share-row" aria-label={`Share ${entity.name}`}>
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
          </>
        ) : (
          <>
            <div className="sticker-locked-mark">???</div>
            <strong>{isMythic ? entity.name : isGif ? "FORBIDDEN LOOP MISSING" : "NOT FOUND"}</strong>
            <span>{isMythic ? "MYTHIC WASTE" : isGif ? "FORBIDDEN LOOP MISSING" : entity.rarityLabel}</span>
            <p>{isMythic ? "drop chance: 0.5%" : isGif ? "probability: disrespectful" : "press nope harder"}</p>
            <em>drop: {formatDropChance(entity.dropChance)}</em>
          </>
        )}
      </article>
    );
  }

  if (shareEntity !== null) {
    const entity = shareEntity || null;

    return (
      <main className="share-page">
        <div className="crt-noise" />
        <div className="app-code-rain" aria-hidden="true">
          {Array.from({ length: 28 }, (_, index) => (
            <span key={index}>NOPE NON TON 404 REJECT NOTPEPE NOPE 0X00 NON</span>
          ))}
        </div>

        {entity ? (
          <section className={`share-card rarity-${entity.rarity} ${entity.type === "uber" ? "uber-card" : ""} ${entity.type === "mythic" ? "mythic-card" : ""} ${entity.type === "gif" ? "gif-card" : ""}`}>
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
            <em>drop: {formatDropChance(entity.dropChance)}</em>
            <small>{entity.caption}</small>
            <b>value: zero</b>
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
      <main className={`intro-screen ${isIntroExiting ? "intro-exit" : ""}`}>
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
      className={`nope-page ${isGlitching ? "is-glitching" : ""} ${isAmbientGlitch ? "ambient-glitch" : ""} ${isNopeIdle ? "nope-idle" : ""}`}
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
        <span>press nope. collect garbage. close nothing.</span>
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

            <div className="event-feed-footer">NOPE OS event feed // input port sealed</div>
          </div>

          {activeDiscoveryPopup && (
            <aside
              className={`entity-transmission ${activeDiscoveryPopup.entity.type === "gif" ? "forbidden" : ""} ${activeDiscoveryPopup.entity.type === "mythic" ? "mythic" : ""} ${activeDiscoveryPopup.entity.type === "uber" ? "uber" : ""}`}
              aria-label="NOPE entity transmission"
            >
              <p className="panel-label">
                {activeDiscoveryPopup.signalType === "forbidden"
                  ? "corrupted-nope-signal.gif"
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
                {activeDiscoveryPopup.signalType === "forbidden"
                  ? "FORBIDDEN LOOP FOUND"
                  : activeDiscoveryPopup.signalType === "uber"
                    ? "UBER NOPE DETECTED"
                  : activeDiscoveryPopup.signalType === "mythic"
                    ? "MYTHIC WASTE FOUND"
                  : activeDiscoveryPopup.signalType === "new"
                    ? "NEW TRASH ACQUIRED"
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
              <b>{activeDiscoveryPopup.signalType === "uber" ? "odds: offensive // value: zero" : "value: zero"}</b>
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
          disabled={isBooting}
          aria-label={isBooting ? "NOPE machine booting" : `Press ${buttonText}`}
        >
          <img src="/images/nopebutton.png" alt="NOPE" />
          {isBooting && <span>BOOTING...</span>}
        </button>
        <div className="status-panel">
          <span>nopes: {formattedCount}</span>
          <span>
            garbage: {normalCollectedCount.toString().padStart(3, "0")}/{NORMAL_TOTAL} · loops: {gifCollectedCount.toString().padStart(3, "0")}/{GIF_TOTAL} · mythic: {mythicCollectedCount.toString().padStart(3, "0")}/{MYTHIC_TOTAL.toString().padStart(3, "0")} · uber: {uberCollectedCount.toString().padStart(3, "0")}/{UBER_TOTAL.toString().padStart(3, "0")} · achievements: {unlockedAchievementCount.toString().padStart(3, "0")}/{achievements.length.toString().padStart(3, "0")}
          </span>
          <span>
            latest: {latestDiscovery ? `${latestDiscovery.type === "uber" ? "UBER - " : latestDiscovery.type === "mythic" ? "MYTHIC - " : ""}${latestDiscovery.name}` : "none. press the stupid button."}
          </span>
        </div>
        <div className="main-actions">
          <button type="button" onClick={() => setIsStickerBookOpen(true)}>
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
            why the hell am I pressing this?
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
          dev: [ regret everything ]
        </button>
      </footer>

      {activeBreachOverlay && (
        <section className="breach-overlay" aria-label="Forbidden loop breach">
          <div className="breach-card">
            <p>FORBIDDEN LOOP BREACH</p>
            <img
              src={activeBreachOverlay.entity.image}
              alt={activeBreachOverlay.entity.name}
              onError={(event) => {
                event.currentTarget.classList.add("image-missing");
              }}
            />
            <strong>{activeBreachOverlay.entity.name}</strong>
            <span>value gained: zero</span>
          </div>
        </section>
      )}

      {activeAchievement && (
        <section className="achievement-modal-overlay" aria-modal="true" role="dialog">
          <div className="achievement-modal-card">
            <p>NOPE OS REWARD SYSTEM</p>
            <small>ACHIEVEMENT UNLOCKED</small>
            <strong>{activeAchievement.name}</strong>
            <span>{activeAchievement.description}</span>
            <em>reward: {activeAchievement.reward}</em>
            <b>value gained: zero</b>
            <button type="button" onClick={dismissAchievement}>
              [ erm... yea... nope ]
            </button>
          </div>
        </section>
      )}

      {showExistentialPopup && (
        <section className="existential-modal-overlay" aria-modal="true" role="dialog">
          <div className="existential-modal-card">
            <p>WHY ARE YOU PRESSING THIS?</p>
            <strong>for no fucking reason at all.</strong>
            <span>-NOPE</span>
            <button type="button" onClick={() => setShowExistentialPopup(false)}>
              [ erm... yea... nope ]
            </button>
          </div>
        </section>
      )}

      {showResetConfirm && (
        <section className="reset-modal-overlay" aria-modal="true" role="dialog">
          <div className="reset-modal-card">
            <strong>WIPE NOPE PROGRESS?</strong>
            <p>This deletes your NOPEDEX, achievements, rank, count, intro state, and all collected trash.</p>
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
        <section className="stickerbook-overlay" aria-label="NOPEDEX sticker book">
          <div className="stickerbook-window">
            <div className="stickerbook-titlebar">
              <div>
                <strong>NOPEDEX STICKER BOOK</strong>
                <span>collect them all. achieve nothing.</span>
              </div>
              <button type="button" onClick={() => setIsStickerBookOpen(false)}>
                [ CLOSE NOPEDEX ]
              </button>
            </div>

            <div className="stickerbook-scroll">
              <div className="stickerbook-summary">
                <span>garbage: {normalCollectedCount} / {NORMAL_TOTAL}</span>
                <span>loops: {gifCollectedCount} / {GIF_TOTAL}</span>
                <span>mythic waste: {mythicCollectedCount} / {MYTHIC_TOTAL}</span>
                <span>uber nope: {uberCollectedCount} / {UBER_TOTAL}</span>
                <span>achievements: {unlockedAchievementCount} / {achievements.length}</span>
                <span>NOPEDEX COMPLETE = all non-Uber trash found</span>
                <span>NOPEDEX ASCENDED = everything found, including Uber NOPEs</span>
              </div>

              <div className="stickerbook-controls primary-controls" aria-label="NOPEDEX view controls">
                {[
                  ["all", "ALL TRASH"],
                  ["normal", "WORTHLESS NOPES"],
                  ["gif", "FORBIDDEN LOOPS"],
                  ["achievements", "ACHIEVEMENTS"],
                ].map(([value, label]) => (
                  <button
                    className={stickerTab === value ? "active" : ""}
                    key={value}
                    type="button"
                    onClick={() => setStickerTab(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

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

              {stickerTab === "achievements" ? (
                <section className="achievement-section" aria-label="NOPE OS achievements">
                  <div className="achievement-section-title">
                    <strong>ACHIEVEMENTS.dat</strong>
                    <span>unlocked: {unlockedAchievementCount.toString().padStart(3, "0")} / {achievements.length.toString().padStart(3, "0")}</span>
                    <span>reward value: zero</span>
                  </div>
                  <div className="achievement-grid">{getVisibleAchievements().map(renderAchievementCard)}</div>
                </section>
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
                            <span>impossible trash recovered.</span>
                          </div>
                          <div className="uber-grid">{getVisibleUberEntities().map(renderStickerCard)}</div>
                        </>
                      )}
                    </section>
                  )}

                  {stickerTab === "all" && getVisibleMythicEntities().length > 0 && (
                    <section className="mythic-section" aria-label="MYTHIC NOPE RELICS">
                      <div className="mythic-section-title">
                        <strong>MYTHIC WASTE</strong>
                        <span>known chase trash. drop chance: 0.5%.</span>
                      </div>
                      <div className="mythic-grid">{getVisibleMythicEntities().map(renderStickerCard)}</div>
                    </section>
                  )}

                  <div className="sticker-grid">{getVisibleStickerEntities().map(renderStickerCard)}</div>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
