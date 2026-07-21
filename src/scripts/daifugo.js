const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};
const RED_SUITS = new Set(["H", "D"]);
const CPU_THINK_MS = 420;
const RULE_PRESETS_STORAGE_KEY = "neon-daifugo-rule-presets-v1";

const DEFAULT_RULE_CONFIG = Object.freeze({
  reverseStrength: false,
  eightCut: true,
  twoCut: false,
  jokerEnabled: false,
  spadeThreeReturn: false,
  sixReverse: false,
  fourStop: false,
  nineReverse: false,
  queenBomber: false,
  aceClear: false,
  kingReverse: false,
  threeSkip: false,
  winnerStartsNext: false,
  rankExchange: false,
  doinaka: false,
  jackClear: false,
  queenReverse: false,
  noPass: false,
  doublePlay: false,
  doublePlayMax: 2,
  colorLock: false,
  fiveSkip: false,
  sevenPass: false,
  tenDump: false,
  elevenBack: false,
  forbiddenFinish: false,
  jokerForbiddenFinish: false,
  forbiddenFinishRanks: [],
  suitLock: false,
  strictSuitLock: false,
  startWithDiamondThree: true,
  customClearRanks: [],
  customNextOnlyRules: [],
});

function rankLabel(rank) {
  if (rank === 0) return "JK";
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

function rankPower(rank) {
  if (rank === 0) return 16;
  if (rank === 1) return 14;
  if (rank === 2) return 15;
  return rank;
}

function cloneRuleConfig(ruleConfig) {
  return {
    reverseStrength: Boolean(ruleConfig?.reverseStrength),
    eightCut: Boolean(ruleConfig?.eightCut),
    twoCut: Boolean(ruleConfig?.twoCut),
    jokerEnabled: Boolean(ruleConfig?.jokerEnabled),
    spadeThreeReturn: Boolean(ruleConfig?.spadeThreeReturn),
    sixReverse: Boolean(ruleConfig?.sixReverse),
    fourStop: Boolean(ruleConfig?.fourStop),
    nineReverse: Boolean(ruleConfig?.nineReverse),
    queenBomber: Boolean(ruleConfig?.queenBomber),
    aceClear: Boolean(ruleConfig?.aceClear),
    kingReverse: Boolean(ruleConfig?.kingReverse),
    threeSkip: Boolean(ruleConfig?.threeSkip),
    winnerStartsNext: Boolean(ruleConfig?.winnerStartsNext),
    rankExchange: Boolean(ruleConfig?.rankExchange),
    doinaka: Boolean(ruleConfig?.doinaka),
    jackClear: Boolean(ruleConfig?.jackClear),
    queenReverse: Boolean(ruleConfig?.queenReverse),
    noPass: Boolean(ruleConfig?.noPass),
    doublePlay: Boolean(ruleConfig?.doublePlay),
    doublePlayMax: Number.isInteger(ruleConfig?.doublePlayMax)
      ? Math.max(2, Math.min(4, Number(ruleConfig.doublePlayMax)))
      : 2,
    colorLock: Boolean(ruleConfig?.colorLock),
    fiveSkip: Boolean(ruleConfig?.fiveSkip),
    sevenPass: Boolean(ruleConfig?.sevenPass),
    tenDump: Boolean(ruleConfig?.tenDump),
    elevenBack: Boolean(ruleConfig?.elevenBack),
    forbiddenFinish: Boolean(ruleConfig?.forbiddenFinish),
    jokerForbiddenFinish: Boolean(ruleConfig?.jokerForbiddenFinish),
    forbiddenFinishRanks: Array.isArray(ruleConfig?.forbiddenFinishRanks) ? [...ruleConfig.forbiddenFinishRanks] : [],
    suitLock: Boolean(ruleConfig?.suitLock),
    strictSuitLock: Boolean(ruleConfig?.strictSuitLock),
    startWithDiamondThree: Boolean(ruleConfig?.startWithDiamondThree),
    customClearRanks: Array.isArray(ruleConfig?.customClearRanks) ? [...ruleConfig.customClearRanks] : [],
    customNextOnlyRules: Array.isArray(ruleConfig?.customNextOnlyRules)
      ? ruleConfig.customNextOnlyRules.map((rule) => ({
          triggerRank: Number(rule?.triggerRank),
          allowedRanks: Array.isArray(rule?.allowedRanks) ? [...rule.allowedRanks] : [],
        }))
      : [],
  };
}

function normalizeCustomClearRanks(raw) {
  if (!Array.isArray(raw)) return [];
  const unique = new Set();
  raw.forEach((value) => {
    const rank = Number(value);
    if (!Number.isInteger(rank)) return;
    if (rank < 1 || rank > 13) return;
    unique.add(rank);
  });
  return [...unique].sort((a, b) => a - b);
}

function normalizeNextOnlyRules(raw) {
  if (!Array.isArray(raw)) return [];
  const dedup = new Set();
  const normalized = [];

  raw.forEach((entry) => {
    const triggerRank = Number(entry?.triggerRank);
    if (!Number.isInteger(triggerRank) || triggerRank < 1 || triggerRank > 13) return;
    const allowedRanks = normalizeCustomClearRanks(entry?.allowedRanks);
    if (allowedRanks.length === 0) return;
    const key = `${triggerRank}:${allowedRanks.join("-")}`;
    if (dedup.has(key)) return;
    dedup.add(key);
    normalized.push({ triggerRank, allowedRanks });
  });

  normalized.sort((a, b) => {
    if (a.triggerRank !== b.triggerRank) return a.triggerRank - b.triggerRank;
    return a.allowedRanks.join("-").localeCompare(b.allowedRanks.join("-"));
  });

  return normalized;
}

function parseAllowedRanksText(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  const pieces = text.split(/[\s,、，]+/).filter(Boolean);
  return normalizeCustomClearRanks(pieces.map((value) => Number(value)));
}

function normalizeForbiddenFinishRanks(raw) {
  if (!Array.isArray(raw)) return [];
  const unique = new Set();
  raw.forEach((value) => {
    if (value === null || value === undefined) return;
    const text = String(value).trim().toUpperCase();
    if (!text) return;
    if (text === "JK" || text === "JOKER") {
      unique.add(0);
      return;
    }
    const rank = Number(text);
    if (Number.isInteger(rank) && rank >= 1 && rank <= 13) {
      unique.add(rank);
    }
  });
  return [...unique].sort((a, b) => a - b);
}

function parseForbiddenFinishRanksText(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  const pieces = text.split(/[\s,、，]+/).filter(Boolean);
  const mapped = pieces.map((piece) => {
    const token = String(piece).trim().toUpperCase();
    if (token === "JK" || token === "JOKER") return 0;
    if (token === "A") return 1;
    if (token === "J") return 11;
    if (token === "Q") return 12;
    if (token === "K") return 13;
    return Number(token);
  });
  return normalizeForbiddenFinishRanks(mapped);
}

function normalizeRuleConfig(raw) {
  return {
    reverseStrength: raw?.reverseStrength === true,
    eightCut: raw?.eightCut !== false,
    twoCut: raw?.twoCut === true,
    jokerEnabled: raw?.jokerEnabled === true,
    spadeThreeReturn: raw?.spadeThreeReturn === true,
    sixReverse: raw?.sixReverse === true,
    fourStop: raw?.fourStop === true,
    nineReverse: raw?.nineReverse === true,
    queenBomber: raw?.queenBomber === true,
    aceClear: raw?.aceClear === true,
    kingReverse: raw?.kingReverse === true,
    threeSkip: raw?.threeSkip === true,
    winnerStartsNext: raw?.winnerStartsNext === true,
    rankExchange: raw?.rankExchange === true,
    doinaka: raw?.doinaka === true,
    jackClear: raw?.jackClear === true,
    queenReverse: raw?.queenReverse === true,
    noPass: raw?.noPass === true,
    doublePlay: raw?.doublePlay === true,
    doublePlayMax: Number.isInteger(raw?.doublePlayMax)
      ? Math.max(2, Math.min(4, Number(raw.doublePlayMax)))
      : 2,
    colorLock: raw?.colorLock === true,
    fiveSkip: raw?.fiveSkip === true,
    sevenPass: raw?.sevenPass === true,
    tenDump: raw?.tenDump === true,
    elevenBack: raw?.elevenBack === true,
    forbiddenFinish: raw?.forbiddenFinish === true,
    jokerForbiddenFinish: raw?.jokerForbiddenFinish === true,
    forbiddenFinishRanks: normalizeForbiddenFinishRanks(raw?.forbiddenFinishRanks),
    suitLock: raw?.suitLock === true,
    strictSuitLock: raw?.strictSuitLock === true,
    startWithDiamondThree: raw?.startWithDiamondThree !== false,
    customClearRanks: normalizeCustomClearRanks(raw?.customClearRanks),
    customNextOnlyRules: normalizeNextOnlyRules(raw?.customNextOnlyRules),
  };
}

function createRulePresetId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `rule-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createDefaultRulePreset() {
  return {
    id: "classic",
    name: "クラシック",
    config: cloneRuleConfig(DEFAULT_RULE_CONFIG),
    updatedAt: Date.now(),
  };
}

function loadRulePresets() {
  try {
    const raw = localStorage.getItem(RULE_PRESETS_STORAGE_KEY);
    if (!raw) return [createDefaultRulePreset()];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createDefaultRulePreset()];
    }

    const presets = parsed
      .map((preset, index) => {
        const id = String(preset?.id || `preset-${index + 1}`).trim();
        const name = String(preset?.name || "カスタムルール").trim().slice(0, 24) || "カスタムルール";
        return {
          id,
          name,
          config: normalizeRuleConfig(preset?.config),
          updatedAt: Number.isFinite(preset?.updatedAt) ? Number(preset.updatedAt) : Date.now(),
        };
      })
      .filter((preset) => preset.id.length > 0);

    if (presets.length === 0) {
      return [createDefaultRulePreset()];
    }

    return presets;
  } catch {
    return [createDefaultRulePreset()];
  }
}

function saveRulePresets(presets) {
  try {
    localStorage.setItem(RULE_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function suitOrder(suit) {
  if (suit === "S") return 0;
  if (suit === "H") return 1;
  if (suit === "D") return 2;
  return 3;
}

function cardColor(card) {
  if (!card || card.suit === "J") return null;
  return RED_SUITS.has(card.suit) ? "red" : "black";
}

function sortHand(hand, ruleConfig) {
  const reversed = Boolean(ruleConfig?.reverseStrength);
  hand.sort((a, b) => {
    const rankDiff = rankPower(a.rank) - rankPower(b.rank);
    if (rankDiff !== 0) return rankDiff;
    return suitOrder(a.suit) - suitOrder(b.suit);
  });
  if (reversed) {
    hand.reverse();
  }
}

function createDeck(ruleConfig) {
  const deck = [];
  let id = 1;
  SUITS.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ id: `d${id}`, suit, rank });
      id += 1;
    }
  });
  if (ruleConfig?.jokerEnabled) {
    deck.push({ id: `d${id}`, suit: "J", rank: 0 });
  }
  return deck;
}

function cloneCard(card) {
  return { ...card };
}

function cloneHands(hands) {
  return hands.map((hand) => hand.map((card) => cloneCard(card)));
}

function appendCardFace(container, card, { compact = false } = {}) {
  const rank = rankLabel(card.rank);
  const suit = SUIT_SYMBOL[card.suit] || "★";
  container.classList.add("daifugo-playing-card", RED_SUITS.has(card.suit) ? "red" : "black");
  if (compact) container.classList.add("compact");

  const top = document.createElement("span");
  top.className = "daifugo-card-corner top";
  top.textContent = `${rank}${suit}`;

  const center = document.createElement("span");
  center.className = "daifugo-card-center";
  center.textContent = suit;

  const bottom = document.createElement("span");
  bottom.className = "daifugo-card-corner bottom";
  bottom.textContent = `${rank}${suit}`;

  container.append(top, center, bottom);
}

export function initDaifugo(options = {}) {
  const modeSelectEl = document.getElementById("daifugoModeSelect");
  const turnTextEl = document.getElementById("daifugoTurnText");
  const fieldTextEl = document.getElementById("daifugoFieldText");
  const p1CountEl = document.getElementById("daifugoP1Count");
  const p2CountEl = document.getElementById("daifugoP2Count");
  const fieldCardEl = document.getElementById("daifugoFieldCard");
  const handTitleEl = document.getElementById("daifugoHandTitle");
  const opponentHandEl = document.getElementById("daifugoOpponentHand");
  const playerHandEl = document.getElementById("daifugoPlayerHand");
  const overlayEl = document.getElementById("daifugoOverlay");
  const messageEl = document.getElementById("daifugoMessage");
  const startBtn = document.getElementById("daifugoStartBtn");
  const passBtn = document.getElementById("daifugoPassBtn");
  const menuBtn = document.getElementById("daifugoMenuBtn");
  const ruleActiveTextEl = document.getElementById("daifugoRuleActiveText");
  const ruleNameInputEl = document.getElementById("daifugoRuleNameInput");
  const presetSelectEl = document.getElementById("daifugoPresetSelect");
  const ruleSaveBtn = document.getElementById("daifugoRuleSaveBtn");
  const ruleDeleteBtn = document.getElementById("daifugoRuleDeleteBtn");
  const ruleApplyBtn = document.getElementById("daifugoRuleApplyBtn");
  const ruleMessageEl = document.getElementById("daifugoRuleMessage");
  const ruleReverseEl = document.getElementById("daifugoRuleReverse");
  const ruleEightCutEl = document.getElementById("daifugoRuleEightCut");
  const ruleTwoCutEl = document.getElementById("daifugoRuleTwoCut");
  const ruleJokerEnabledEl = document.getElementById("daifugoRuleJokerEnabled");
  const ruleSpadeThreeReturnEl = document.getElementById("daifugoRuleSpadeThreeReturn");
  const ruleSixReverseEl = document.getElementById("daifugoRuleSixReverse");
  const ruleFourStopEl = document.getElementById("daifugoRuleFourStop");
  const ruleNineReverseEl = document.getElementById("daifugoRuleNineReverse");
  const ruleQueenBomberEl = document.getElementById("daifugoRuleQueenBomber");
  const ruleAceClearEl = document.getElementById("daifugoRuleAceClear");
  const ruleKingReverseEl = document.getElementById("daifugoRuleKingReverse");
  const ruleThreeSkipEl = document.getElementById("daifugoRuleThreeSkip");
  const ruleWinnerStartsNextEl = document.getElementById("daifugoRuleWinnerStartsNext");
  const ruleRankExchangeEl = document.getElementById("daifugoRuleRankExchange");
  const ruleDoinakaEl = document.getElementById("daifugoRuleDoinaka");
  const ruleJackClearEl = document.getElementById("daifugoRuleJackClear");
  const ruleQueenReverseEl = document.getElementById("daifugoRuleQueenReverse");
  const ruleNoPassEl = document.getElementById("daifugoRuleNoPass");
  const ruleDoublePlayEl = document.getElementById("daifugoRuleDoublePlay");
  const ruleDoublePlayMaxEl = document.getElementById("daifugoRuleDoublePlayMax");
  const ruleColorLockEl = document.getElementById("daifugoRuleColorLock");
  const ruleFiveSkipEl = document.getElementById("daifugoRuleFiveSkip");
  const ruleSevenPassEl = document.getElementById("daifugoRuleSevenPass");
  const ruleTenDumpEl = document.getElementById("daifugoRuleTenDump");
  const ruleElevenBackEl = document.getElementById("daifugoRuleElevenBack");
  const ruleForbiddenFinishEl = document.getElementById("daifugoRuleForbiddenFinish");
  const ruleJokerForbiddenFinishEl = document.getElementById("daifugoRuleJokerForbiddenFinish");
  const ruleForbiddenRanksEl = document.getElementById("daifugoRuleForbiddenRanks");
  const ruleSuitLockEl = document.getElementById("daifugoRuleSuitLock");
  const ruleStrictSuitLockEl = document.getElementById("daifugoRuleStrictSuitLock");
  const ruleStartD3El = document.getElementById("daifugoRuleStartD3");
  const customRuleTypeEl = document.getElementById("daifugoCustomRuleType");
  const customRuleRankEl = document.getElementById("daifugoCustomRuleRank");
  const customRuleAllowedRanksEl = document.getElementById("daifugoCustomRuleAllowedRanks");
  const customRuleAddBtn = document.getElementById("daifugoCustomRuleAddBtn");
  const customRuleListEl = document.getElementById("daifugoCustomRuleList");
  const ruleMenuRoot = document.querySelector(".daifugo-rule-builder");

  const loadedPresets = loadRulePresets();
  const initialPreset = loadedPresets[0] || createDefaultRulePreset();

  const state = {
    hands: [[], []],
    currentPlayer: 0,
    fieldCard: null,
    lastPlayPlayer: null,
    gameMode: "local",
    playMode: "cpu",
    cpuPlayer: 1,
    gameOver: true,
    roomLocked: false,
    roomLockMessage: "",
    cpuTimerId: null,
    rulePresets: loadedPresets,
    selectedRulePresetId: initialPreset.id,
    activeRuleName: initialPreset.name,
    ruleConfig: cloneRuleConfig(initialPreset.config),
    pendingRuleConfig: null,
    pendingRuleName: null,
    customClearRanksEditor: normalizeCustomClearRanks(initialPreset.config?.customClearRanks),
    customNextOnlyRulesEditor: normalizeNextOnlyRules(initialPreset.config?.customNextOnlyRules),
    nextTurnRestriction: null,
    pendingTurnSkips: [0, 0],
    elevenBackActive: false,
    lockedSuit: null,
    lockedColor: null,
    turnDirection: 1,
    previousWinner: null,
  };

  function setRuleMessage(text) {
    if (!ruleMessageEl) return;
    ruleMessageEl.textContent = text || "";
  }

  function isPvpLocalMode() {
    return state.gameMode === "local" && state.playMode === "local";
  }

  function isCpuLocalMode() {
    return state.gameMode === "local" && state.playMode === "cpu";
  }

  function hasCustomRules(ruleConfig) {
    return (
      Array.isArray(ruleConfig?.customClearRanks) && ruleConfig.customClearRanks.length > 0
    ) || (
      Array.isArray(ruleConfig?.customNextOnlyRules) && ruleConfig.customNextOnlyRules.length > 0
    );
  }

  function toClassicRuleConfig(ruleConfig) {
    const normalized = normalizeRuleConfig(ruleConfig);
    return {
      ...normalized,
      customClearRanks: [],
      customNextOnlyRules: [],
    };
  }

  function activeRules() {
    if (isPvpLocalMode()) return state.ruleConfig;
    if (isCpuLocalMode()) return toClassicRuleConfig(state.ruleConfig);
    return DEFAULT_RULE_CONFIG;
  }

  function updateRuleMenuAvailability() {
    if (!ruleMenuRoot) return;
    const inRoom = state.gameMode === "room";
    const inCpuLocal = isCpuLocalMode();
    const inPvpLocal = isPvpLocalMode();

    [
      ruleNameInputEl,
      presetSelectEl,
      ruleSaveBtn,
      ruleDeleteBtn,
      ruleApplyBtn,
      ruleReverseEl,
      ruleEightCutEl,
      ruleTwoCutEl,
      ruleJokerEnabledEl,
      ruleSpadeThreeReturnEl,
      ruleSixReverseEl,
      ruleFourStopEl,
      ruleNineReverseEl,
      ruleQueenBomberEl,
      ruleAceClearEl,
      ruleKingReverseEl,
      ruleThreeSkipEl,
      ruleWinnerStartsNextEl,
      ruleRankExchangeEl,
      ruleDoinakaEl,
      ruleJackClearEl,
      ruleQueenReverseEl,
      ruleNoPassEl,
      ruleDoublePlayEl,
      ruleDoublePlayMaxEl,
      ruleColorLockEl,
      ruleFiveSkipEl,
      ruleSevenPassEl,
      ruleTenDumpEl,
      ruleElevenBackEl,
      ruleForbiddenFinishEl,
      ruleJokerForbiddenFinishEl,
      ruleForbiddenRanksEl,
      ruleSuitLockEl,
      ruleStrictSuitLockEl,
      ruleStartD3El,
    ].forEach((control) => {
      if (!control) return;
      control.disabled = inRoom;
    });

    [customRuleTypeEl, customRuleRankEl, customRuleAllowedRanksEl, customRuleAddBtn].forEach((control) => {
      if (!control) return;
      control.disabled = inRoom || !inPvpLocal;
    });
    ruleMenuRoot.querySelectorAll(".daifugo-custom-rule-remove").forEach((control) => {
      control.disabled = inRoom || !inPvpLocal;
    });

    if (inRoom) {
      setRuleMessage("ルーム対戦ではクラシックルール固定です");
      return;
    }
    if (inCpuLocal) {
      setRuleMessage("CPU戦ではクラシックルールのみ適用されます");
      return;
    }
    if (inPvpLocal) setRuleMessage("");
  }

  function updateRuleActiveHud() {
    if (ruleActiveTextEl) {
      ruleActiveTextEl.textContent = state.activeRuleName || "クラシック";
    }
  }

  function selectedPreset() {
    return state.rulePresets.find((preset) => preset.id === state.selectedRulePresetId) || null;
  }

  function readRuleConfigFromControls() {
    return normalizeRuleConfig({
      reverseStrength: Boolean(ruleReverseEl?.checked),
      eightCut: Boolean(ruleEightCutEl?.checked),
      twoCut: Boolean(ruleTwoCutEl?.checked),
      jokerEnabled: Boolean(ruleJokerEnabledEl?.checked),
      spadeThreeReturn: Boolean(ruleSpadeThreeReturnEl?.checked),
      sixReverse: Boolean(ruleSixReverseEl?.checked),
      fourStop: Boolean(ruleFourStopEl?.checked),
      nineReverse: Boolean(ruleNineReverseEl?.checked),
      queenBomber: Boolean(ruleQueenBomberEl?.checked),
      aceClear: Boolean(ruleAceClearEl?.checked),
      kingReverse: Boolean(ruleKingReverseEl?.checked),
      threeSkip: Boolean(ruleThreeSkipEl?.checked),
      winnerStartsNext: Boolean(ruleWinnerStartsNextEl?.checked),
      rankExchange: Boolean(ruleRankExchangeEl?.checked),
      doinaka: Boolean(ruleDoinakaEl?.checked),
      jackClear: Boolean(ruleJackClearEl?.checked),
      queenReverse: Boolean(ruleQueenReverseEl?.checked),
      noPass: Boolean(ruleNoPassEl?.checked),
      doublePlay: Boolean(ruleDoublePlayEl?.checked),
      doublePlayMax: Number(ruleDoublePlayMaxEl?.value),
      colorLock: Boolean(ruleColorLockEl?.checked),
      fiveSkip: Boolean(ruleFiveSkipEl?.checked),
      sevenPass: Boolean(ruleSevenPassEl?.checked),
      tenDump: Boolean(ruleTenDumpEl?.checked),
      elevenBack: Boolean(ruleElevenBackEl?.checked),
      forbiddenFinish: Boolean(ruleForbiddenFinishEl?.checked),
      jokerForbiddenFinish: Boolean(ruleJokerForbiddenFinishEl?.checked),
      forbiddenFinishRanks: parseForbiddenFinishRanksText(ruleForbiddenRanksEl?.value),
      suitLock: Boolean(ruleSuitLockEl?.checked),
      strictSuitLock: Boolean(ruleStrictSuitLockEl?.checked),
      startWithDiamondThree: Boolean(ruleStartD3El?.checked),
      customClearRanks: [...state.customClearRanksEditor],
      customNextOnlyRules: state.customNextOnlyRulesEditor.map((rule) => ({
        triggerRank: rule.triggerRank,
        allowedRanks: [...rule.allowedRanks],
      })),
    });
  }

  function writeRuleConfigToControls(ruleConfig) {
    const normalized = normalizeRuleConfig(ruleConfig);
    if (ruleReverseEl) ruleReverseEl.checked = normalized.reverseStrength;
    if (ruleEightCutEl) ruleEightCutEl.checked = normalized.eightCut;
    if (ruleTwoCutEl) ruleTwoCutEl.checked = normalized.twoCut;
    if (ruleJokerEnabledEl) ruleJokerEnabledEl.checked = normalized.jokerEnabled;
    if (ruleSpadeThreeReturnEl) ruleSpadeThreeReturnEl.checked = normalized.spadeThreeReturn;
    if (ruleSixReverseEl) ruleSixReverseEl.checked = normalized.sixReverse;
    if (ruleFourStopEl) ruleFourStopEl.checked = normalized.fourStop;
    if (ruleNineReverseEl) ruleNineReverseEl.checked = normalized.nineReverse;
    if (ruleQueenBomberEl) ruleQueenBomberEl.checked = normalized.queenBomber;
    if (ruleAceClearEl) ruleAceClearEl.checked = normalized.aceClear;
    if (ruleKingReverseEl) ruleKingReverseEl.checked = normalized.kingReverse;
    if (ruleThreeSkipEl) ruleThreeSkipEl.checked = normalized.threeSkip;
    if (ruleWinnerStartsNextEl) ruleWinnerStartsNextEl.checked = normalized.winnerStartsNext;
    if (ruleRankExchangeEl) ruleRankExchangeEl.checked = normalized.rankExchange;
    if (ruleDoinakaEl) ruleDoinakaEl.checked = normalized.doinaka;
    if (ruleJackClearEl) ruleJackClearEl.checked = normalized.jackClear;
    if (ruleQueenReverseEl) ruleQueenReverseEl.checked = normalized.queenReverse;
    if (ruleNoPassEl) ruleNoPassEl.checked = normalized.noPass;
    if (ruleDoublePlayEl) ruleDoublePlayEl.checked = normalized.doublePlay;
    if (ruleDoublePlayMaxEl) ruleDoublePlayMaxEl.value = String(normalized.doublePlayMax);
    if (ruleColorLockEl) ruleColorLockEl.checked = normalized.colorLock;
    if (ruleFiveSkipEl) ruleFiveSkipEl.checked = normalized.fiveSkip;
    if (ruleSevenPassEl) ruleSevenPassEl.checked = normalized.sevenPass;
    if (ruleTenDumpEl) ruleTenDumpEl.checked = normalized.tenDump;
    if (ruleElevenBackEl) ruleElevenBackEl.checked = normalized.elevenBack;
    if (ruleForbiddenFinishEl) ruleForbiddenFinishEl.checked = normalized.forbiddenFinish;
    if (ruleJokerForbiddenFinishEl) ruleJokerForbiddenFinishEl.checked = normalized.jokerForbiddenFinish;
    if (ruleForbiddenRanksEl) {
      ruleForbiddenRanksEl.value = normalized.forbiddenFinishRanks
        .map((rank) => {
          if (rank === 0) return "JK";
          return rankLabel(rank);
        })
        .join(",");
    }
    if (ruleSuitLockEl) ruleSuitLockEl.checked = normalized.suitLock;
    if (ruleStrictSuitLockEl) ruleStrictSuitLockEl.checked = normalized.strictSuitLock;
    if (ruleStartD3El) ruleStartD3El.checked = normalized.startWithDiamondThree;
    state.customClearRanksEditor = [...normalized.customClearRanks];
    state.customNextOnlyRulesEditor = normalizeNextOnlyRules(normalized.customNextOnlyRules);
    renderCustomRuleList();
  }

  function renderCustomRuleList() {
    if (!customRuleListEl) return;
    customRuleListEl.innerHTML = "";
    if (state.customClearRanksEditor.length === 0 && state.customNextOnlyRulesEditor.length === 0) {
      const empty = document.createElement("li");
      empty.className = "daifugo-custom-rule-item";
      const text = document.createElement("span");
      text.className = "daifugo-custom-rule-text";
      text.textContent = "追加ルールなし";
      empty.appendChild(text);
      customRuleListEl.appendChild(empty);
      return;
    }

    state.customClearRanksEditor.forEach((rank) => {
      const item = document.createElement("li");
      item.className = "daifugo-custom-rule-item";

      const text = document.createElement("span");
      text.className = "daifugo-custom-rule-text";
      text.textContent = `${rankLabel(rank)} を出したら場流し`;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "daifugo-custom-rule-remove";
      removeBtn.textContent = "削除";
      removeBtn.disabled = !isPvpLocalMode();
      removeBtn.addEventListener("click", () => {
        state.customClearRanksEditor = state.customClearRanksEditor.filter((value) => value !== rank);
        renderCustomRuleList();
        setRuleMessage(`${rankLabel(rank)} ルールを削除しました`);
      });

      item.append(text, removeBtn);
      customRuleListEl.appendChild(item);
    });

    state.customNextOnlyRulesEditor.forEach((rule) => {
      const item = document.createElement("li");
      item.className = "daifugo-custom-rule-item";

      const text = document.createElement("span");
      text.className = "daifugo-custom-rule-text";
      const allowedText = rule.allowedRanks.map((rank) => rankLabel(rank)).join(", ");
      text.textContent = `${rankLabel(rule.triggerRank)} の次は ${allowedText} のみ`;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "daifugo-custom-rule-remove";
      removeBtn.textContent = "削除";
      removeBtn.disabled = !isPvpLocalMode();
      removeBtn.addEventListener("click", () => {
        state.customNextOnlyRulesEditor = state.customNextOnlyRulesEditor.filter(
          (value) =>
            !(value.triggerRank === rule.triggerRank && value.allowedRanks.join("-") === rule.allowedRanks.join("-"))
        );
        renderCustomRuleList();
        setRuleMessage(`${rankLabel(rule.triggerRank)} の次ルールを削除しました`);
      });

      item.append(text, removeBtn);
      customRuleListEl.appendChild(item);
    });
  }

  function addCustomRuleFromControls() {
    const type = String(customRuleTypeEl?.value || "");
    const rank = Number(customRuleRankEl?.value);
    if (!Number.isInteger(rank) || rank < 1 || rank > 13) {
      setRuleMessage("ランクは1〜13で指定してください");
      return;
    }

    if (type === "clear-rank") {
      if (state.customClearRanksEditor.includes(rank)) {
        setRuleMessage(`${rankLabel(rank)} ルールは既に追加済みです`);
        return;
      }
      state.customClearRanksEditor.push(rank);
      state.customClearRanksEditor.sort((a, b) => a - b);
      renderCustomRuleList();
      setRuleMessage(`${rankLabel(rank)} で場流しルールを追加しました`);
      return;
    }

    if (type === "next-only-ranks") {
      const allowedRanks = parseAllowedRanksText(customRuleAllowedRanksEl?.value);
      if (allowedRanks.length === 0) {
        setRuleMessage("次に出せるランクを1〜13で入力してください（例: 3,5,7）");
        return;
      }

      const key = `${rank}:${allowedRanks.join("-")}`;
      const exists = state.customNextOnlyRulesEditor.some(
        (rule) => `${rule.triggerRank}:${rule.allowedRanks.join("-")}` === key
      );
      if (exists) {
        setRuleMessage(`${rankLabel(rank)} の次ルールは既に追加済みです`);
        return;
      }

      state.customNextOnlyRulesEditor.push({ triggerRank: rank, allowedRanks });
      state.customNextOnlyRulesEditor = normalizeNextOnlyRules(state.customNextOnlyRulesEditor);
      renderCustomRuleList();
      setRuleMessage(`${rankLabel(rank)} の次は ${allowedRanks.map((v) => rankLabel(v)).join(", ")} のみ を追加しました`);
      return;
    }

    setRuleMessage("この追加ルール種別はまだ未対応です");
  }

  function refreshPresetSelect() {
    if (!presetSelectEl) return;
    presetSelectEl.innerHTML = "";
    state.rulePresets.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.name;
      presetSelectEl.appendChild(option);
    });
    presetSelectEl.value = state.selectedRulePresetId;
    if (ruleDeleteBtn) {
      ruleDeleteBtn.disabled = state.rulePresets.length <= 1;
    }
  }

  function selectPresetById(presetId) {
    const preset = state.rulePresets.find((item) => item.id === presetId);
    if (!preset) return;
    state.selectedRulePresetId = preset.id;
    if (presetSelectEl) presetSelectEl.value = preset.id;
    if (ruleNameInputEl) ruleNameInputEl.value = preset.name;
    writeRuleConfigToControls(preset.config);
  }

  function currentRuleNameFromUi() {
    const raw = String(ruleNameInputEl?.value || "").trim();
    if (raw) return raw.slice(0, 24);
    const preset = selectedPreset();
    if (preset) return preset.name;
    return "カスタムルール";
  }

  function saveCurrentPreset() {
    const name = currentRuleNameFromUi();
    const rawConfig = readRuleConfigFromControls();
    const config = isPvpLocalMode() ? rawConfig : toClassicRuleConfig(rawConfig);
    const current = selectedPreset();

    if (current && current.name === name) {
      current.config = cloneRuleConfig(config);
      current.updatedAt = Date.now();
      saveRulePresets(state.rulePresets);
      refreshPresetSelect();
      selectPresetById(current.id);
      setRuleMessage(`「${name}」を更新しました`);
      return;
    }

    const created = {
      id: createRulePresetId(),
      name,
      config: cloneRuleConfig(config),
      updatedAt: Date.now(),
    };
    state.rulePresets.push(created);
    state.selectedRulePresetId = created.id;
    saveRulePresets(state.rulePresets);
    refreshPresetSelect();
    selectPresetById(created.id);
    setRuleMessage(`「${name}」を保存しました`);
  }

  function deleteSelectedPreset() {
    if (!state.selectedRulePresetId) return;
    if (state.rulePresets.length <= 1) {
      setRuleMessage("最低1つはルールを残す必要があります");
      return;
    }

    const removing = selectedPreset();
    const confirmed = window.confirm(`「${removing?.name || "選択中ルール"}」を削除しますか？`);
    if (!confirmed) {
      setRuleMessage("削除をキャンセルしました");
      return;
    }

    state.rulePresets = state.rulePresets.filter((preset) => preset.id !== state.selectedRulePresetId);
    const fallback = state.rulePresets[0];
    state.selectedRulePresetId = fallback?.id || "";
    saveRulePresets(state.rulePresets);
    refreshPresetSelect();
    if (fallback) selectPresetById(fallback.id);
    setRuleMessage(`「${removing?.name || "選択中ルール"}」を削除しました`);
  }

  function applyRuleConfig(ruleConfig, ruleName) {
    state.ruleConfig = cloneRuleConfig(ruleConfig);
    state.activeRuleName = String(ruleName || "カスタムルール").trim() || "カスタムルール";
    updateRuleActiveHud();
  }

  function applyCurrentRulesFromUi() {
    const canApply = state.gameMode === "local";
    if (!canApply) {
      setRuleMessage("ルーム対戦ではルール適用できません");
      return;
    }

    const rawConfig = readRuleConfigFromControls();
    const config = isPvpLocalMode() ? rawConfig : toClassicRuleConfig(rawConfig);
    const name = currentRuleNameFromUi();

    if (isCpuLocalMode() && hasCustomRules(rawConfig)) {
      setRuleMessage("CPU戦では追加ルールを除いたクラシックルールだけ適用されます");
    }

    if (!state.gameOver) {
      state.pendingRuleConfig = cloneRuleConfig(config);
      state.pendingRuleName = name;
      setRuleMessage("進行中のため、次のGAME STARTから適用されます");
      return;
    }

    applyRuleConfig(config, name);
    setRuleMessage(`「${name}」を適用しました`);
    render();
  }

  function consumePendingRuleConfig() {
    if (!state.pendingRuleConfig) return;
    applyRuleConfig(state.pendingRuleConfig, state.pendingRuleName || "カスタムルール");
    state.pendingRuleConfig = null;
    state.pendingRuleName = null;
  }

  function clearCpuTimer() {
    if (state.cpuTimerId) {
      window.clearTimeout(state.cpuTimerId);
      state.cpuTimerId = null;
    }
  }

  function isCpuMode() {
    return state.gameMode !== "room" && state.playMode === "cpu";
  }

  function isLocalPlayersTurn() {
    if (state.gameMode === "room") return state.currentPlayer === 0;
    if (!isCpuMode()) return true;
    return state.currentPlayer !== state.cpuPlayer;
  }

  function beatsField(card, fieldCard) {
    const rules = activeRules();
    if (!fieldCard) return true;
    if (isJokerCard(card)) return !isJokerCard(fieldCard);
    if (isJokerCard(fieldCard)) return false;
    const currentPower = rankPower(card.rank);
    const fieldPower = rankPower(fieldCard.rank);
    if (isStrengthReversed(rules)) {
      return currentPower < fieldPower;
    }
    return currentPower > fieldPower;
  }

  function isStrengthReversed(rules = activeRules()) {
    return Boolean(rules.reverseStrength) !== Boolean(state.elevenBackActive);
  }

  function activeNextTurnRestriction() {
    if (!state.nextTurnRestriction) return null;
    if (state.currentPlayer !== state.nextTurnRestriction.targetPlayer) return null;
    return state.nextTurnRestriction;
  }

  function findNextOnlyRule(triggerRank) {
    const rules = activeRules();
    return rules.customNextOnlyRules.find((rule) => rule.triggerRank === triggerRank) || null;
  }

  function canPlay(card) {
    const rules = activeRules();
    const restriction = activeNextTurnRestriction();
    if (restriction && !restriction.allowedRanks.includes(card.rank)) {
      return false;
    }
    if (!state.fieldCard) return true;
    if (rules.spadeThreeReturn && isSpadeThree(card) && isJokerCard(state.fieldCard)) {
      return true;
    }
    if (rules.suitLock && state.lockedSuit && card.suit !== state.lockedSuit) {
      return false;
    }
    if (rules.colorLock && state.lockedColor && cardColor(card) !== state.lockedColor) {
      return false;
    }
    if (rules.suitLock && !rules.strictSuitLock && card.suit !== state.fieldCard.suit) {
      return false;
    }
    return beatsField(card, state.fieldCard);
  }

  function pickWeakestCardIndexFromHand(playerIndex) {
    const hand = state.hands[playerIndex] || [];
    if (hand.length === 0) return -1;
    const rules = activeRules();
    const reversed = isStrengthReversed(rules);

    let targetIndex = 0;
    for (let i = 1; i < hand.length; i += 1) {
      const current = hand[i];
      const target = hand[targetIndex];
      const currentPower = rankPower(current.rank);
      const targetPower = rankPower(target.rank);
      const shouldReplace = reversed
        ? currentPower > targetPower || (currentPower === targetPower && suitOrder(current.suit) > suitOrder(target.suit))
        : currentPower < targetPower || (currentPower === targetPower && suitOrder(current.suit) < suitOrder(target.suit));
      if (shouldReplace) targetIndex = i;
    }

    return targetIndex;
  }

  function pickStrongestCardIndexFromHand(playerIndex) {
    const hand = state.hands[playerIndex] || [];
    if (hand.length === 0) return -1;
    const rules = activeRules();
    const reversed = isStrengthReversed(rules);

    let targetIndex = 0;
    for (let i = 1; i < hand.length; i += 1) {
      const current = hand[i];
      const target = hand[targetIndex];
      const currentPower = rankPower(current.rank);
      const targetPower = rankPower(target.rank);
      const shouldReplace = reversed
        ? currentPower < targetPower || (currentPower === targetPower && suitOrder(current.suit) < suitOrder(target.suit))
        : currentPower > targetPower || (currentPower === targetPower && suitOrder(current.suit) > suitOrder(target.suit));
      if (shouldReplace) targetIndex = i;
    }

    return targetIndex;
  }

  function cardText(card) {
    return `${rankLabel(card.rank)}${SUIT_SYMBOL[card.suit] || "★"}`;
  }

  function isJokerCard(card) {
    return Boolean(card) && card.suit === "J";
  }

  function isSpadeThree(card) {
    return Boolean(card) && card.suit === "S" && card.rank === 3;
  }

  function chooseCardIndexForSpecialAction(playerIndex, actionName, { isRemote = false, isCpu = false } = {}) {
    const hand = state.hands[playerIndex] || [];
    if (hand.length === 0) return -1;

    if (isCpu || isRemote) {
      return pickWeakestCardIndexFromHand(playerIndex);
    }

    const lines = hand.map((card, index) => `${index + 1}: ${cardText(card)}`);
    const promptText = `${actionName}でカードを選んでください（番号入力）\n${lines.join("\n")}`;
    const input = window.prompt(promptText, "1");
    const selected = Number(input);
    if (Number.isInteger(selected) && selected >= 1 && selected <= hand.length) {
      return selected - 1;
    }

    setRuleMessage("入力が無効だったため、最弱札を選択しました");
    return pickWeakestCardIndexFromHand(playerIndex);
  }

  function chooseAdditionalCardIndexesForDoublePlay(
    playerIndex,
    rank,
    maxAdditional,
    { isRemote = false, isCpu = false } = {}
  ) {
    const hand = state.hands[playerIndex] || [];
    const candidates = [];
    hand.forEach((card, index) => {
      if (card.rank === rank) candidates.push({ card, index });
    });
    if (candidates.length === 0 || maxAdditional <= 0) return [];

    const limit = Math.max(0, Math.min(maxAdditional, candidates.length));
    if (limit === 0) return [];

    if (isRemote || isCpu) {
      return candidates.slice(0, limit).map((entry) => entry.index);
    }

    const lines = candidates.map((entry, idx) => `${idx + 1}: ${cardText(entry.card)}`);
    const countInput = window.prompt(`連続出しの追加枚数を入力してください（0-${limit}）`, String(limit));
    if (countInput === null) return [];
    const desiredCount = Number(countInput);
    if (!Number.isInteger(desiredCount) || desiredCount < 0 || desiredCount > limit) {
      setRuleMessage("入力が無効だったため、連続出しは1枚のみになりました");
      return [];
    }
    if (desiredCount === 0) return [];

    const promptText = `連続出しするカードを${desiredCount}枚選んでください（番号をカンマ区切り）\n${lines.join("\n")}`;
    const input = window.prompt(promptText, Array.from({ length: desiredCount }, (_, i) => String(i + 1)).join(","));
    if (!input) {
      return candidates.slice(0, desiredCount).map((entry) => entry.index);
    }

    const selected = input
      .split(/[\s,、，]+/)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= candidates.length);
    const unique = [...new Set(selected)].slice(0, desiredCount);
    if (unique.length < desiredCount) {
      setRuleMessage("入力が不足していたため、先頭から選択しました");
      return candidates.slice(0, desiredCount).map((entry) => entry.index);
    }

    return unique.map((pos) => candidates[pos - 1].index);
  }

  function isForbiddenFinishCard(card, rules) {
    let forbidden = false;
    if (rules.forbiddenFinish) {
      if (card.rank === 8) forbidden = true;
      if (card.rank === 2 && !isStrengthReversed(rules)) forbidden = true;
    }
    if (rules.jokerForbiddenFinish && isJokerCard(card)) forbidden = true;
    if (Array.isArray(rules.forbiddenFinishRanks) && rules.forbiddenFinishRanks.includes(card.rank)) {
      forbidden = true;
    }
    return forbidden;
  }

  function playableCardsFor(playerIndex) {
    return (state.hands[playerIndex] || []).filter((card) => canPlay(card));
  }

  function currentTurnLabel() {
    if (isCpuMode()) {
      return state.currentPlayer === 0 ? "PLAYER" : "CPU";
    }
    return `P${state.currentPlayer + 1}`;
  }

  function playerNameFor(playerIndex) {
    if (state.gameMode === "room") {
      return playerIndex === 0 ? "あなた" : "相手";
    }
    if (isCpuMode()) {
      return playerIndex === 0 ? "あなた" : "CPU";
    }
    return `PLAYER ${playerIndex + 1}`;
  }

  function outcomeTextForWinner(winnerIndex) {
    const loserIndex = winnerIndex === 0 ? 1 : 0;
    return `${playerNameFor(winnerIndex)}: 勝ち / ${playerNameFor(loserIndex)}: 負け`;
  }

  function fieldLabel() {
    if (!state.fieldCard) return "-";
    const base = `${rankLabel(state.fieldCard.rank)}${SUIT_SYMBOL[state.fieldCard.suit] || "★"}`;
    if (state.lockedSuit) {
      return `${base} / しばり:${SUIT_SYMBOL[state.lockedSuit]}`;
    }
    return base;
  }

  function setOverlay(text) {
    if (!overlayEl) return;
    if (!text) {
      overlayEl.style.opacity = "0";
      overlayEl.textContent = "";
      return;
    }
    overlayEl.style.opacity = "1";
    overlayEl.textContent = text;
  }

  function updateHud() {
    turnTextEl.textContent = currentTurnLabel();
    fieldTextEl.textContent = fieldLabel();
    p1CountEl.textContent = String(state.hands[0].length);
    p2CountEl.textContent = String(state.hands[1].length);

    if (modeSelectEl) {
      modeSelectEl.value = state.playMode;
      modeSelectEl.disabled = state.gameMode === "room" || !state.gameOver;
    }
    if (startBtn) {
      startBtn.disabled = state.gameMode === "room";
    }
    updateRuleMenuAvailability();
    updateRuleActiveHud();
  }

  function renderFieldCard() {
    if (!fieldCardEl) return;
    fieldCardEl.innerHTML = "";
    if (!state.fieldCard) {
      fieldCardEl.textContent = "-";
      fieldCardEl.classList.remove("has-card");
      return;
    }

    fieldCardEl.classList.add("has-card");
    const face = document.createElement("div");
    appendCardFace(face, state.fieldCard, { compact: true });
    fieldCardEl.appendChild(face);
  }

  function renderOpponentHand() {
    opponentHandEl.innerHTML = "";
    const count = state.hands[1 - state.currentPlayer].length;

    const summary = document.createElement("div");
    summary.className = "daifugo-opponent-summary";
    summary.textContent = isCpuMode() ? `CPU HAND: ${count}` : `P${((state.currentPlayer + 1) % 2) + 1} HAND: ${count}`;

    const stack = document.createElement("div");
    stack.className = "daifugo-opponent-stack";

    const stackCards = Math.max(1, Math.min(5, count));
    for (let i = 0; i < stackCards; i += 1) {
      const card = document.createElement("div");
      card.className = "daifugo-opponent-card";
      card.style.setProperty("--stack-index", String(i));
      stack.appendChild(card);
    }

    if (count > stackCards) {
      const more = document.createElement("span");
      more.className = "daifugo-opponent-more";
      more.textContent = `+${count - stackCards}`;
      stack.appendChild(more);
    }

    opponentHandEl.append(summary, stack);
  }

  function renderPlayerHand() {
    playerHandEl.innerHTML = "";

    const hand = state.hands[state.currentPlayer] || [];
    const canControl = !state.gameOver && !state.roomLocked && isLocalPlayersTurn();

    hand.forEach((card) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "daifugo-hand-card";
      if (RED_SUITS.has(card.suit)) button.classList.add("red");

      const playable = canControl && canPlay(card);
      if (playable) button.classList.add("playable");

      appendCardFace(button, card);
      button.disabled = !playable;
      button.addEventListener("click", () => playCardById(card.id, { isRemote: false }));
      playerHandEl.appendChild(button);
    });

    if (passBtn) {
      const canPass = canControl && state.fieldCard !== null;
      const rules = activeRules();
      const blockedByNoPass = rules.noPass && playableCardsFor(state.currentPlayer).length > 0;
      passBtn.disabled = !canPass || blockedByNoPass;
    }

    if (handTitleEl) {
      if (isCpuMode()) {
        handTitleEl.textContent = state.currentPlayer === 0 ? "あなたの手札" : "CPUの手札";
      } else {
        handTitleEl.textContent = `PLAYER ${state.currentPlayer + 1} の手札`;
      }
    }
  }

  function render() {
    updateHud();
    renderFieldCard();
    renderOpponentHand();
    renderPlayerHand();
  }

  function endGame(winnerIndex) {
    state.gameOver = true;
    state.previousWinner = winnerIndex;
    clearCpuTimer();

    const outcomeText = outcomeTextForWinner(winnerIndex);
    messageEl.textContent = outcomeText;
    setOverlay(outcomeText);

    render();
  }

  function removeCardFromHand(playerIndex, cardId) {
    const hand = state.hands[playerIndex];
    const cardIndex = hand.findIndex((card) => card.id === cardId);
    if (cardIndex < 0) return null;
    return hand.splice(cardIndex, 1)[0] || null;
  }

  function advanceTurn(step = 1) {
    if (state.nextTurnRestriction && state.nextTurnRestriction.targetPlayer === state.currentPlayer) {
      state.nextTurnRestriction = null;
    }

    if (state.hands[state.currentPlayer].length === 0) {
      endGame(state.currentPlayer);
      return;
    }

    const playerCount = state.hands.length;
    const offset = ((step * state.turnDirection) % playerCount + playerCount) % playerCount;
    state.currentPlayer = (state.currentPlayer + offset) % playerCount;

    const skippedPlayers = [];
    let guard = 0;
    while (guard < playerCount && Number(state.pendingTurnSkips[state.currentPlayer] || 0) > 0) {
      state.pendingTurnSkips[state.currentPlayer] -= 1;
      skippedPlayers.push(state.currentPlayer);
      state.currentPlayer = (state.currentPlayer + offset) % playerCount;
      guard += 1;
    }

    if (state.hands[state.currentPlayer].length === 0) {
      endGame(state.currentPlayer);
      return;
    }

    if (isCpuMode()) {
      messageEl.textContent = state.currentPlayer === 0 ? "あなたの手番です" : "CPUの手番です";
    } else {
      messageEl.textContent = `PLAYER ${state.currentPlayer + 1} の手番です`;
    }

    const restriction = activeNextTurnRestriction();
    if (restriction) {
      const allowedText = restriction.allowedRanks.map((rank) => rankLabel(rank)).join(", ");
      messageEl.textContent += `（${allowedText} のみ）`;
    }
    if (skippedPlayers.length > 0) {
      const skippedText = skippedPlayers.map((playerIndex) => playerNameFor(playerIndex)).join(" / ");
      messageEl.textContent += `（${skippedText} をスキップ）`;
    }

    render();
    maybeRunCpu();
  }

  function clearFieldAndGiveLead(playerIndex) {
    state.fieldCard = null;
    state.lastPlayPlayer = null;
    state.nextTurnRestriction = null;
    state.elevenBackActive = false;
    state.lockedSuit = null;
    state.lockedColor = null;
    state.currentPlayer = playerIndex;
    messageEl.textContent = "場が流れました";
    render();
    maybeRunCpu();
  }

  function playCardById(cardId, { isRemote = false, isCpu = false } = {}) {
    const rules = activeRules();
    if (state.gameOver || state.roomLocked) return;
    if (!isRemote && !isCpu && !isLocalPlayersTurn()) return;

    const card = removeCardFromHand(state.currentPlayer, cardId);
    if (!card) return;

    if (!canPlay(card)) {
      state.hands[state.currentPlayer].push(card);
      sortHand(state.hands[state.currentPlayer], rules);
      return;
    }

    const previousFieldCard = state.fieldCard ? { ...state.fieldCard } : null;

    state.fieldCard = { ...card };
    state.lastPlayPlayer = state.currentPlayer;

    if (rules.doublePlay) {
      const maxAdditional = Math.max(0, Math.min(3, Number(rules.doublePlayMax || 2) - 1));
      const indexes = chooseAdditionalCardIndexesForDoublePlay(state.currentPlayer, card.rank, maxAdditional, { isRemote, isCpu })
        .sort((a, b) => b - a);
      const played = [];
      indexes.forEach((index) => {
        const removed = state.hands[state.currentPlayer].splice(index, 1)[0];
        if (removed) played.push(removed);
      });
      if (played.length > 0) {
        messageEl.textContent = `連続出し: ${played.map((entry) => cardText(entry)).join(", ")}`;
      }
    }

    if (rules.elevenBack && card.rank === 11) {
      state.elevenBackActive = !state.elevenBackActive;
    }

    if (rules.sixReverse && card.rank === 6) {
      state.turnDirection *= -1;
      messageEl.textContent = "6リバースで手番方向が反転しました";
    }

    if (rules.nineReverse && card.rank === 9) {
      state.turnDirection *= -1;
      messageEl.textContent = "9リバースで手番方向が反転しました";
    }

    if (rules.kingReverse && card.rank === 13) {
      state.turnDirection *= -1;
      messageEl.textContent = "Kリバースで手番方向が反転しました";
    }

    if (rules.queenReverse && card.rank === 12) {
      state.turnDirection *= -1;
      messageEl.textContent = "Qリバースで手番方向が反転しました";
    }

    if (state.gameMode === "room" && !isRemote) {
      options.onRoomMove?.({ type: "play", cardId });
    }

    if (state.hands[state.currentPlayer].length === 0 && isForbiddenFinishCard(card, rules)) {
      endGame((state.currentPlayer + 1) % 2);
      return;
    }

    if (rules.eightCut && card.rank === 8) {
      messageEl.textContent = "8切りで場を流しました";
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }

    if (rules.twoCut && card.rank === 2) {
      messageEl.textContent = "2切りで場を流しました";
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }

    if (rules.fourStop && card.rank === 4) {
      messageEl.textContent = "4止めで場を流しました";
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }

    if (rules.queenBomber && card.rank === 12) {
      messageEl.textContent = "12ボンバーで場を流しました";
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }

    if (rules.aceClear && card.rank === 1) {
      messageEl.textContent = "A流しで場を流しました";
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }

    if (rules.spadeThreeReturn && isSpadeThree(card) && isJokerCard(previousFieldCard)) {
      const jokerPlayer = (state.currentPlayer + 1) % state.hands.length;
      state.pendingTurnSkips[jokerPlayer] = Number(state.pendingTurnSkips[jokerPlayer] || 0) + 1;
      messageEl.textContent = "スペ3返しで場を流しました（ジョーカー側は次回スキップ）";
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }
    if (rules.jackClear && card.rank === 11) {
      messageEl.textContent = "J流しで場を流しました";
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }

    if (rules.sevenPass && card.rank === 7) {
      const selectedIndex = chooseCardIndexForSpecialAction(state.currentPlayer, "7渡し", { isRemote, isCpu });
      if (selectedIndex >= 0) {
        const [giveCard] = state.hands[state.currentPlayer].splice(selectedIndex, 1);
        const targetPlayer = (state.currentPlayer + 1) % 2;
        state.hands[targetPlayer].push(giveCard);
        sortHand(state.hands[targetPlayer], rules);
        messageEl.textContent = `${cardText(giveCard)} を相手に渡しました`;
      }
    }

    if (rules.tenDump && card.rank === 10) {
      const selectedIndex = chooseCardIndexForSpecialAction(state.currentPlayer, "10捨て", { isRemote, isCpu });
      if (selectedIndex >= 0) {
        const [discarded] = state.hands[state.currentPlayer].splice(selectedIndex, 1);
        messageEl.textContent = `${cardText(discarded)} を10捨てしました`;
      }
    }

    if (rules.customClearRanks.includes(card.rank)) {
      messageEl.textContent = `${rankLabel(card.rank)} 追加ルールで場を流しました`;
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      clearFieldAndGiveLead(state.currentPlayer);
      return;
    }

    if (rules.suitLock) {
      if (state.lockedSuit) {
        state.lockedSuit = card.suit;
      } else if (rules.strictSuitLock && previousFieldCard && previousFieldCard.suit === card.suit) {
        state.lockedSuit = card.suit;
      }
    } else {
      state.lockedSuit = null;
    }

    if (rules.colorLock) {
      const currentColor = cardColor(card);
      if (state.lockedColor && currentColor) {
        state.lockedColor = currentColor;
      } else if (!state.lockedColor && previousFieldCard && cardColor(previousFieldCard) === currentColor && currentColor) {
        state.lockedColor = currentColor;
      }
    } else {
      state.lockedColor = null;
    }

    if (rules.fiveSkip && card.rank === 5) {
      state.nextTurnRestriction = null;
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      messageEl.textContent = "5スキップが発動しました";
      advanceTurn(2);
      return;
    }

    if (rules.threeSkip && card.rank === 3) {
      state.nextTurnRestriction = null;
      if (state.hands[state.currentPlayer].length === 0) {
        endGame(state.currentPlayer);
        return;
      }
      messageEl.textContent = "3スキップが発動しました";
      advanceTurn(2);
      return;
    }

    const nextOnlyRule = findNextOnlyRule(card.rank);
    if (nextOnlyRule) {
      state.nextTurnRestriction = {
        targetPlayer: (state.currentPlayer + 1) % 2,
        triggerRank: card.rank,
        allowedRanks: [...nextOnlyRule.allowedRanks],
      };
    } else {
      state.nextTurnRestriction = null;
    }

    advanceTurn();
  }

  function passTurn({ isRemote = false, isCpu = false } = {}) {
    const rules = activeRules();
    if (state.gameOver || state.roomLocked) return;
    if (!isRemote && !isCpu && !isLocalPlayersTurn()) return;
    if (!state.fieldCard) return;
    if (rules.noPass && playableCardsFor(state.currentPlayer).length > 0) return;

    if (state.gameMode === "room" && !isRemote) {
      options.onRoomMove?.({ type: "pass" });
    }

    const leader = state.lastPlayPlayer;
    if (leader !== null && leader !== state.currentPlayer) {
      clearFieldAndGiveLead(leader);
      return;
    }

    advanceTurn();
  }

  function chooseCpuCard() {
    const rules = activeRules();
    const playable = playableCardsFor(state.cpuPlayer);
    if (playable.length === 0) return null;

    playable.sort((a, b) => {
      const powerDiff = rankPower(a.rank) - rankPower(b.rank);
      if (powerDiff !== 0) return powerDiff;
      return suitOrder(a.suit) - suitOrder(b.suit);
    });

    const almostWin = state.hands[state.cpuPlayer].length <= 4;
    if (isStrengthReversed(rules)) {
      return almostWin ? playable[0] : playable[playable.length - 1];
    }
    return almostWin ? playable[playable.length - 1] : playable[0];
  }

  function maybeRunCpu() {
    clearCpuTimer();

    if (!isCpuMode() || state.gameOver || state.roomLocked) return;
    if (state.currentPlayer !== state.cpuPlayer) return;

    state.cpuTimerId = window.setTimeout(() => {
      state.cpuTimerId = null;
      if (state.gameOver || state.roomLocked || state.currentPlayer !== state.cpuPlayer) return;

      const selected = chooseCpuCard();
      if (!selected) {
        passTurn({ isRemote: false, isCpu: true });
        return;
      }
      playCardById(selected.id, { isRemote: false, isCpu: true });
    }, CPU_THINK_MS);
  }

  function setupNewGame() {
    clearCpuTimer();
    consumePendingRuleConfig();
    const rules = activeRules();

    const deck = shuffle(createDeck(rules));
    state.hands = [[], []];

    deck.forEach((card, index) => {
      state.hands[index % 2].push(card);
    });

    sortHand(state.hands[0], rules);
    sortHand(state.hands[1], rules);

    if (rules.rankExchange && (state.previousWinner === 0 || state.previousWinner === 1)) {
      const winner = state.previousWinner;
      const loser = winner === 0 ? 1 : 0;
      const winnerWeakestIndex = pickWeakestCardIndexFromHand(winner);
      const loserStrongestIndex = pickStrongestCardIndexFromHand(loser);
      if (winnerWeakestIndex >= 0 && loserStrongestIndex >= 0) {
        const winnerCard = state.hands[winner][winnerWeakestIndex];
        const loserCard = state.hands[loser][loserStrongestIndex];
        state.hands[winner][winnerWeakestIndex] = loserCard;
        state.hands[loser][loserStrongestIndex] = winnerCard;
        sortHand(state.hands[winner], rules);
        sortHand(state.hands[loser], rules);
      }
    }

    state.fieldCard = null;
    state.lastPlayPlayer = null;
    state.nextTurnRestriction = null;
    state.pendingTurnSkips = [0, 0];
    state.elevenBackActive = false;
    state.lockedSuit = null;
    state.lockedColor = null;
    state.turnDirection = 1;
    state.gameOver = false;
    state.roomLocked = false;
    state.roomLockMessage = "";

    if (rules.winnerStartsNext && (state.previousWinner === 0 || state.previousWinner === 1)) {
      state.currentPlayer = state.previousWinner;
    } else if (rules.startWithDiamondThree) {
      state.currentPlayer = state.hands[0].some((card) => card.suit === "D" && card.rank === 3) ? 0 : 1;
    } else {
      state.currentPlayer = Math.random() < 0.5 ? 0 : 1;
    }

    setOverlay("");
    messageEl.textContent = isCpuMode()
      ? state.currentPlayer === 0
        ? "あなたの手番です"
        : "CPUの手番です"
      : `PLAYER ${state.currentPlayer + 1} の手番です`;
    render();
    maybeRunCpu();
  }

  function enterStandby() {
    clearCpuTimer();
    state.hands = [[], []];
    state.currentPlayer = 0;
    state.fieldCard = null;
    state.lastPlayPlayer = null;
    state.nextTurnRestriction = null;
    state.pendingTurnSkips = [0, 0];
    state.elevenBackActive = false;
    state.lockedSuit = null;
    state.lockedColor = null;
    state.turnDirection = 1;
    state.gameOver = true;
    state.roomLocked = false;
    state.roomLockMessage = "";
    messageEl.textContent = "GAME STARTを押してください";
    setOverlay("GAME STARTで開始");
    render();
  }

  startBtn?.addEventListener("click", () => {
    if (state.roomLocked) return;
    setupNewGame();
  });

  modeSelectEl?.addEventListener("change", () => {
    if (state.gameMode === "room") return;
    state.playMode = modeSelectEl.value === "local" ? "local" : "cpu";
    enterStandby();
  });

  passBtn?.addEventListener("click", () => {
    passTurn({ isRemote: false });
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });

  presetSelectEl?.addEventListener("change", () => {
    selectPresetById(presetSelectEl.value);
    setRuleMessage("");
  });

  ruleSaveBtn?.addEventListener("click", () => {
    saveCurrentPreset();
  });

  ruleDeleteBtn?.addEventListener("click", () => {
    deleteSelectedPreset();
  });

  ruleApplyBtn?.addEventListener("click", () => {
    applyCurrentRulesFromUi();
  });

  customRuleAddBtn?.addEventListener("click", () => {
    addCustomRuleFromControls();
  });

  refreshPresetSelect();
  selectPresetById(state.selectedRulePresetId);
  renderCustomRuleList();
  updateRuleActiveHud();
  enterStandby();

  return {
    startNewGame: () => {
      setupNewGame();
    },
    enterStandby,
    stop: () => {
      clearCpuTimer();
    },
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.playMode = "local";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      enterStandby();
    },
    configureStandardMode: (mode) => {
      state.gameMode = "local";
      state.playMode = mode === "local" ? "local" : "cpu";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      enterStandby();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
        setOverlay(state.roomLockMessage || "対戦相手を待っています...");
      } else if (!state.gameOver) {
        setOverlay("");
      }
      render();
    },
    applyRemoteMove: (payload) => {
      if (!payload) return;
      if (payload.type === "pass") {
        passTurn({ isRemote: true });
        return;
      }
      if (payload.type === "play") {
        playCardById(payload.cardId, { isRemote: true });
      }
    },
    getSnapshot: () => ({
      hands: cloneHands(state.hands),
      currentPlayer: state.currentPlayer,
      fieldCard: state.fieldCard ? { ...state.fieldCard } : null,
      lastPlayPlayer: state.lastPlayPlayer,
      ruleConfig: cloneRuleConfig(state.ruleConfig),
      activeRuleName: state.activeRuleName,
      elevenBackActive: state.elevenBackActive,
      lockedSuit: state.lockedSuit,
      lockedColor: state.lockedColor,
      turnDirection: state.turnDirection,
      previousWinner: state.previousWinner,
      nextTurnRestriction: state.nextTurnRestriction
        ? {
            targetPlayer: state.nextTurnRestriction.targetPlayer,
            triggerRank: state.nextTurnRestriction.triggerRank,
            allowedRanks: [...state.nextTurnRestriction.allowedRanks],
          }
        : null,
      pendingTurnSkips: Array.isArray(state.pendingTurnSkips)
        ? state.pendingTurnSkips.map((value) => Math.max(0, Number(value) || 0))
        : [0, 0],
      gameMode: state.gameMode,
      playMode: state.playMode,
      gameOver: state.gameOver,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      message: messageEl.textContent,
      overlay: overlayEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot) return;
      clearCpuTimer();

      state.hands = Array.isArray(snapshot.hands) ? cloneHands(snapshot.hands) : [[], []];
      state.currentPlayer = snapshot.currentPlayer === 1 ? 1 : 0;
      state.fieldCard = snapshot.fieldCard ? { ...snapshot.fieldCard } : null;
      state.lastPlayPlayer = snapshot.lastPlayPlayer === 1 ? 1 : snapshot.lastPlayPlayer === 0 ? 0 : null;
      state.ruleConfig = normalizeRuleConfig(snapshot.ruleConfig || DEFAULT_RULE_CONFIG);
      state.activeRuleName = String(snapshot.activeRuleName || state.activeRuleName || "クラシック");
      state.elevenBackActive = Boolean(snapshot.elevenBackActive);
      state.lockedSuit = typeof snapshot.lockedSuit === "string" && SUITS.includes(snapshot.lockedSuit) ? snapshot.lockedSuit : null;
      state.lockedColor = snapshot.lockedColor === "red" || snapshot.lockedColor === "black" ? snapshot.lockedColor : null;
      state.turnDirection = snapshot.turnDirection === -1 ? -1 : 1;
      state.previousWinner = snapshot.previousWinner === 1 ? 1 : snapshot.previousWinner === 0 ? 0 : null;
      state.nextTurnRestriction = snapshot.nextTurnRestriction
        ? {
            targetPlayer: snapshot.nextTurnRestriction.targetPlayer === 1 ? 1 : 0,
            triggerRank: Number(snapshot.nextTurnRestriction.triggerRank) || 0,
            allowedRanks: normalizeCustomClearRanks(snapshot.nextTurnRestriction.allowedRanks),
          }
        : null;
      state.pendingTurnSkips = Array.isArray(snapshot.pendingTurnSkips)
        ? [0, 1].map((index) => Math.max(0, Number(snapshot.pendingTurnSkips[index]) || 0))
        : [0, 0];
      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.playMode = snapshot.playMode === "local" ? "local" : "cpu";
      state.gameOver = Boolean(snapshot.gameOver);
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = snapshot.roomLockMessage ?? "";

      if (typeof snapshot.message === "string") {
        messageEl.textContent = snapshot.message;
      }

      if (state.roomLocked || state.gameOver) {
        setOverlay(snapshot.overlay || state.roomLockMessage || "対局終了");
      } else {
        setOverlay("");
      }

      writeRuleConfigToControls(state.ruleConfig);
      updateRuleActiveHud();
      render();
      maybeRunCpu();
    },
  };
}
