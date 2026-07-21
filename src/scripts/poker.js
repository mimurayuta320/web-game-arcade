import { readStoredAuth, scopedStorageKey } from "./userScopedStorage.js";

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};
const RED_SUITS = new Set(["H", "D"]);
const CASINO_SHARED_BANK_STORAGE_KEY = "neon-casino-shared-bank-v1";
const POKER_LEGACY_BANK_STORAGE_KEY = "neon-casino-poker-bank-v1";
const POKER_STATS_STORAGE_KEY = "neon-casino-poker-stats-v1";
const POKER_SFX_STORAGE_KEY = "neon-casino-poker-sfx-v1";
const DEFAULT_BANKROLL = 1000;
const MIN_BET = 10;
const BET_STEP = 10;

function rankLabel(rank) {
  if (rank === 14) return "A";
  if (rank === 13) return "K";
  if (rank === 12) return "Q";
  if (rank === 11) return "J";
  return String(rank);
}

function createDeck() {
  const deck = [];
  let id = 1;
  SUITS.forEach((suit) => {
    for (let rank = 2; rank <= 14; rank += 1) {
      deck.push({ id: `p${id}`, suit, rank });
      id += 1;
    }
  });
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function toSortedDesc(values) {
  return [...values].sort((a, b) => b - a);
}

function evaluateHand(cards) {
  const ranks = cards.map((card) => card.rank);
  const ranksDesc = toSortedDesc(ranks);
  const rankCountMap = new Map();
  ranks.forEach((rank) => {
    rankCountMap.set(rank, (rankCountMap.get(rank) || 0) + 1);
  });

  const rankCounts = [...rankCountMap.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const isFlush = cards.every((card) => card.suit === cards[0].suit);
  const uniqueAsc = [...new Set(ranks)].sort((a, b) => a - b);
  const isWheel = uniqueAsc.length === 5 && uniqueAsc[0] === 2 && uniqueAsc[1] === 3 && uniqueAsc[2] === 4 && uniqueAsc[3] === 5 && uniqueAsc[4] === 14;
  const isStraight =
    uniqueAsc.length === 5 &&
    ((uniqueAsc[4] - uniqueAsc[0] === 4 && uniqueAsc.every((rank, index) => index === 0 || rank - uniqueAsc[index - 1] === 1)) || isWheel);

  const straightHigh = isWheel ? 5 : uniqueAsc[4];

  if (isStraight && isFlush) return { score: [8, straightHigh], name: "ストレートフラッシュ" };
  if (rankCounts[0][1] === 4) return { score: [7, rankCounts[0][0], rankCounts[1][0]], name: "フォーカード" };
  if (rankCounts[0][1] === 3 && rankCounts[1][1] === 2) return { score: [6, rankCounts[0][0], rankCounts[1][0]], name: "フルハウス" };
  if (isFlush) return { score: [5, ...ranksDesc], name: "フラッシュ" };
  if (isStraight) return { score: [4, straightHigh], name: "ストレート" };

  if (rankCounts[0][1] === 3) {
    const kickers = rankCounts.slice(1).map(([rank]) => rank).sort((a, b) => b - a);
    return { score: [3, rankCounts[0][0], ...kickers], name: "スリーカード" };
  }

  if (rankCounts[0][1] === 2 && rankCounts[1][1] === 2) {
    const highPair = Math.max(rankCounts[0][0], rankCounts[1][0]);
    const lowPair = Math.min(rankCounts[0][0], rankCounts[1][0]);
    const kicker = rankCounts[2][0];
    return { score: [2, highPair, lowPair, kicker], name: "ツーペア" };
  }

  if (rankCounts[0][1] === 2) {
    const pairRank = rankCounts[0][0];
    const kickers = rankCounts.slice(1).map(([rank]) => rank).sort((a, b) => b - a);
    return { score: [1, pairRank, ...kickers], name: "ワンペア" };
  }

  return { score: [0, ...ranksDesc], name: "ハイカード" };
}

function compareEvaluated(a, b) {
  const len = Math.max(a.score.length, b.score.length);
  for (let i = 0; i < len; i += 1) {
    const av = a.score[i] || 0;
    const bv = b.score[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function cloneCards(cards) {
  return cards.map((card) => ({ ...card }));
}

function cpuHeldIndexes(cards) {
  const counts = new Map();
  cards.forEach((card) => {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  });

  const hold = new Set();
  cards.forEach((card, index) => {
    if ((counts.get(card.rank) || 0) >= 2) hold.add(index);
  });
  if (hold.size > 0) return hold;

  cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.rank >= 12)
    .sort((a, b) => b.card.rank - a.card.rank)
    .slice(0, 2)
    .forEach(({ index }) => hold.add(index));

  return hold;
}

function evaluateBestOfSeven(cards) {
  if (!Array.isArray(cards) || cards.length < 5) return { score: [0], name: "-" };

  let best = null;
  const total = cards.length;
  for (let a = 0; a < total - 4; a += 1) {
    for (let b = a + 1; b < total - 3; b += 1) {
      for (let c = b + 1; c < total - 2; c += 1) {
        for (let d = c + 1; d < total - 1; d += 1) {
          for (let e = d + 1; e < total; e += 1) {
            const current = evaluateHand([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || compareEvaluated(current, best) > 0) best = current;
          }
        }
      }
    }
  }
  return best;
}

function phaseLabel(phase) {
  if (phase === "betting") return "BET";
  if (phase === "preflop") return "PREFLOP";
  if (phase === "flop") return "FLOP";
  if (phase === "turn") return "TURN";
  if (phase === "river") return "RIVER";
  if (phase === "showdown") return "SHOWDOWN";
  if (phase === "draw-hold") return "DRAW";
  if (phase === "draw-wait") return "DRAW";
  if (phase === "draw-ready") return "CHECK";
  if (phase === "draw-showdown") return "RESULT";
  return "-";
}

export function initPoker(options = {}) {
  const langSelectEl = document.getElementById("langSelect");
  const ruleSelectEl = document.getElementById("pokerRuleSelect");
  const opponentSelectEl = document.getElementById("pokerOpponentSelect");
  const cpuCountSelectEl = document.getElementById("pokerCpuCountSelect");
  const cpuStyleSelectEl = document.getElementById("pokerCpuStyleSelect");
  const sfxSelectEl = document.getElementById("pokerSfxSelect");
  const communityZoneEl = document.getElementById("pokerCommunityZone");
  const pokerWrapEl = document.querySelector("#pokerScreen .poker-wrap");
  const playerZoneEl = document.getElementById("pokerPlayerZone");
  const opponentZoneEl = document.getElementById("pokerOpponentZone");
  const playerHandEl = document.getElementById("pokerPlayerHand");
  const cpuHandEl = document.getElementById("pokerCpuHand");
  const communityEl = document.getElementById("pokerCommunityCards");
  const resultBannerEl = document.getElementById("pokerResultBanner");
  const resultTitleEl = document.getElementById("pokerResultTitle");
  const resultDetailEl = document.getElementById("pokerResultDetail");
  const overlayEl = document.getElementById("pokerOverlay");
  const messageEl = document.getElementById("pokerMessage");
  const phaseEl = document.getElementById("pokerPhaseText");
  const playerRankEl = document.getElementById("pokerPlayerRankText");
  const cpuRankEl = document.getElementById("pokerCpuRankText");
  const bankTextEl = document.getElementById("pokerBankText");
  const betTextEl = document.getElementById("pokerBetText");
  const opponentBetTextEl = document.getElementById("pokerOpponentBetText");
  const tablePlayerBetTextEl = document.getElementById("pokerTablePlayerBetText");
  const tableOpponentBetTextEl = document.getElementById("pokerTableOpponentBetText");
  const tablePotTextEl = document.getElementById("pokerTablePotText");
  const playerChipStackEl = document.getElementById("pokerPlayerChipStack");
  const opponentChipStackEl = document.getElementById("pokerOpponentChipStack");
  const potChipStackEl = document.getElementById("pokerPotChipStack");
  const playerChipAmountEl = document.getElementById("pokerPlayerChipAmount");
  const opponentChipAmountEl = document.getElementById("pokerOpponentChipAmount");
  const potChipAmountEl = document.getElementById("pokerPotChipAmount");
  const focusBetTextEl = document.getElementById("pokerFocusBetText");
  const focusRaiseTextEl = document.getElementById("pokerFocusRaiseText");
  const betRangeTextEl = document.getElementById("pokerBetRangeText");
  const raiseAmountTextEl = document.getElementById("pokerRaiseAmountText");
  const statsTextEl = document.getElementById("pokerStatsText");
  const opponentRankLabelEl = document.getElementById("pokerOpponentRankLabel");
  const opponentHoleLabelEl = document.getElementById("pokerOpponentHoleLabel");
  const startBtn = document.getElementById("pokerStartBtn");
  const remakeBtn = document.getElementById("pokerRemakeBtn");
  const betMinusBtn = document.getElementById("pokerBetMinusBtn");
  const betPlusBtn = document.getElementById("pokerBetPlusBtn");
  const raiseMinusBtn = document.getElementById("pokerRaiseMinusBtn");
  const raisePlusBtn = document.getElementById("pokerRaisePlusBtn");
  const potPresetMinusBtn = document.getElementById("pokerPotPresetMinusBtn");
  const potPresetPlusBtn = document.getElementById("pokerPotPresetPlusBtn");
  const potPresetTextEl = document.getElementById("pokerPotPresetText");
  const allInBtn = document.getElementById("pokerAllInBtn");
  const changeBtn = document.getElementById("pokerChangeBtn");
  const raiseBtn = document.getElementById("pokerRaiseBtn");
  const standBtn = document.getElementById("pokerStandBtn");
  const callBtn = document.getElementById("pokerCallBtn");
  const foldBtn = document.getElementById("pokerFoldBtn");
  const actionBtn = document.getElementById("pokerDrawBtn");
  const menuBtn = document.getElementById("pokerMenuBtn");
  let chipAudioCtx = null;
  let lastChipSfxAt = 0;
  let didInitialHudRender = false;

  const state = {
    gameMode: "local",
    roomRole: null,
    ruleMode: "tournament",
    opponentMode: "cpu",
    cpuCount: 1,
    activeCpuCount: 1,
    cpuStyle: "normal",
    sfxEnabled: true,
    roomLocked: false,
    roomLockMessage: "",
    deck: [],
    playerCards: [],
    cpuCards: [],
    extraCpuCards: [],
    community: [],
    heldIndexes: new Set(),
    drawUnlockTimerId: null,
    bankroll: DEFAULT_BANKROLL,
    currentBet: MIN_BET,
    raiseAmount: BET_STEP,
    potPresetPercent: 25,
    activeWager: 0,
    cpuWager: 0,
    pendingCallAmount: 0,
    stats: {
      wins: 0,
      games: 0,
      netProfit: 0,
    },
    phase: "standby",
    gameOver: true,
    playerResult: null,
    cpuResult: null,
    showdownResultType: "",
    showdownWinnerSide: "",
    showdownResultDetail: "",
  };

  function lang() {
    return langSelectEl?.value === "ko" ? "ko" : "ja";
  }

  function localize(key) {
    const dict = {
      ja: {
        waitingStart: "ゲーム開始を押してください",
        waitingRoom: "対戦相手を待っています...",
        roomUnsupported: "このゲームはルーム対戦に未対応です",
        bettingStart: "カードはまだ非公開です。ベットを調整して 次へ で開始します",
        holdemStart: "プリフロップ: 次へ でフロップを公開します",
        holdemFlop: "フロップ: 次へ でターンカードを公開します",
        holdemTurn: "ターン: 次へ でリバーカードを公開します",
        holdemRiver: "リバー: 次へ でショーダウンします",
        drawStart: "5枚配り: 交換したいカードを選択して カード交換 を押してください",
        drawSelectRequired: "交換したいカードを1枚以上選んでください",
        drawChanging: "カード交換中...",
        drawChangedNext: "カードを交換しました。次へ で勝敗を判定します",
        betInsufficient: "チップが不足しています。ベット額を下げてください",
        bankrollBroke: "チップがなくなりました。リメイクで初期チップに戻します",
        bankrollRefilled: "チップを初期値に補充しました",
        raiseFailed: "レイズできるチップが不足しています",
        raised: "レイズしました。次へ進行します",
        stood: "スタンドしました。次へ進行します",
        folded: "フォールドしました。ベットは失われます",
        opponentCalled: "がコールしました",
        opponentFolded: "がフォールドしました",
        opponentRaised: "がレイズしました",
        callRequired: "相手のレイズに対してコール・レイズ・フォールドを選んでください",
        callFailed: "コールするチップが不足しています",
        called: "コールしました",
        betAction: "ベット",
        youWin: "あなたの勝ち",
        cpuWin: "CPUの勝ち",
        dealerWin: "ディーラーの勝ち",
        draw: "引き分け",
        cpuLabel: "CPU",
        dealerLabel: "ディーラー",
        cpuHand: "CPUの手札",
        dealerHand: "ディーラーの手札",
        cpuHole: "CPUのホールカード",
        dealerHole: "ディーラーのホールカード",
        next: "次へ",
        drawBtn: "ドロー",
        phaseBet: "ベット",
        phasePreflop: "プリフロップ",
        phaseFlop: "フロップ",
        phaseTurn: "ターン",
        phaseRiver: "リバー",
        phaseShowdown: "ショーダウン",
        phaseDraw: "ドロー",
        phaseCheck: "判定",
        phaseResult: "結果",
        waitingOverlay: "ゲーム開始で開始",
        placeBetOverlay: "ベットしてください",
        youWinOverlay: "あなたの勝ち",
        cpuWinOverlay: "CPUの勝ち",
        dealerWinOverlay: "ディーラーの勝ち",
        drawOverlay: "引き分け",
        foldOverlay: "フォールド",
        dealerFoldOverlay: "ディーラーフォールド",
        cpuFoldOverlay: "CPUフォールド",
        statsPrefix: "戦績",
        drawResultYou: "あなた",
      },
      ko: {
        waitingStart: "게임 시작을 눌러주세요",
        waitingRoom: "상대를 기다리는 중...",
        roomUnsupported: "이 게임은 룸 대전을 지원하지 않습니다",
        bettingStart: "카드는 아직 비공개입니다. 베팅을 조정한 뒤 다음으로 시작하세요",
        holdemStart: "프리플롭: 다음 버튼으로 플롭을 공개하세요",
        holdemFlop: "플롭: 다음 버튼으로 턴 카드를 공개합니다",
        holdemTurn: "턴: 다음 버튼으로 리버 카드를 공개합니다",
        holdemRiver: "리버: 다음 버튼으로 쇼다운합니다",
        drawStart: "5장 드로우: 교체할 카드를 선택하고 카드 교체를 누르세요",
        drawSelectRequired: "교체할 카드를 1장 이상 선택하세요",
        drawChanging: "카드 교체 중...",
        drawChangedNext: "카드를 교체했습니다. 다음 버튼으로 승패를 판정합니다",
        betInsufficient: "칩이 부족합니다. 베팅 금액을 낮춰주세요",
        bankrollBroke: "칩이 모두 소진되었습니다. 리메이크로 초기 칩으로 복구하세요",
        bankrollRefilled: "칩을 초기값으로 보충했습니다",
        raiseFailed: "레이즈할 칩이 부족합니다",
        raised: "레이즈했습니다. 다음 단계로 진행합니다",
        stood: "스탠드했습니다. 다음 단계로 진행합니다",
        folded: "폴드했습니다. 베팅금은 잃게 됩니다",
        opponentCalled: "가 콜했습니다",
        opponentFolded: "가 폴드했습니다",
        opponentRaised: "가 레이즈했습니다",
        callRequired: "상대 레이즈에 대해 콜/레이즈/폴드를 선택하세요",
        callFailed: "콜할 칩이 부족합니다",
        called: "콜했습니다",
        betAction: "베팅",
        youWin: "당신 승리",
        cpuWin: "CPU 승리",
        dealerWin: "딜러 승리",
        draw: "무승부",
        cpuLabel: "CPU",
        dealerLabel: "딜러",
        cpuHand: "CPU 핸드",
        dealerHand: "딜러 핸드",
        cpuHole: "CPU 홀 카드",
        dealerHole: "딜러 홀 카드",
        next: "다음",
        drawBtn: "드로우",
        phaseBet: "베팅",
        phasePreflop: "프리플롭",
        phaseFlop: "플롭",
        phaseTurn: "턴",
        phaseRiver: "리버",
        phaseShowdown: "쇼다운",
        phaseDraw: "드로우",
        phaseCheck: "판정",
        phaseResult: "결과",
        waitingOverlay: "게임 시작으로 시작",
        placeBetOverlay: "베팅하세요",
        youWinOverlay: "당신 승리",
        cpuWinOverlay: "CPU 승리",
        dealerWinOverlay: "딜러 승리",
        drawOverlay: "무승부",
        foldOverlay: "폴드",
        dealerFoldOverlay: "딜러 폴드",
        cpuFoldOverlay: "CPU 폴드",
        statsPrefix: "전적",
        drawResultYou: "당신",
      },
    };
    return dict[lang()][key] || dict.ja[key] || key;
  }

  function isTournamentMode() {
    return state.ruleMode === "tournament";
  }

  function isDrawMode() {
    return state.ruleMode === "draw5";
  }

  function syncModesFromUi() {
    state.ruleMode = ruleSelectEl?.value === "draw5" ? "draw5" : "tournament";
    state.opponentMode = opponentSelectEl?.value === "dealer" ? "dealer" : "cpu";
    const parsedCpuCount = Number(cpuCountSelectEl?.value || "1");
    state.cpuCount = parsedCpuCount === 2 || parsedCpuCount === 3 ? parsedCpuCount : 1;
    state.activeCpuCount = isDealerMode() ? 1 : state.cpuCount;
    const nextStyle = cpuStyleSelectEl?.value;
    state.cpuStyle = nextStyle === "weak" || nextStyle === "aggressive" ? nextStyle : "normal";
  }

  function isDealerMode() {
    return state.opponentMode === "dealer";
  }

  function opponentTitle() {
    if (isDealerMode()) return localize("dealerLabel");
    return state.activeCpuCount > 1 ? `${localize("cpuLabel")} x${state.activeCpuCount}` : localize("cpuLabel");
  }

  function cpuHands() {
    return [state.cpuCards, ...state.extraCpuCards];
  }

  function isTournamentActiveRound() {
    return isTournamentMode() && (state.phase === "preflop" || state.phase === "flop" || state.phase === "turn" || state.phase === "river");
  }

  function canControlLocal() {
    return state.gameMode !== "room" || state.roomRole === "host";
  }

  function shouldBroadcastSnapshot() {
    return state.gameMode === "room" && state.roomRole === "host";
  }

  function broadcastRoomSnapshot() {
    if (!shouldBroadcastSnapshot()) return;
    options.onRoomSnapshot?.();
  }

  function runLocalAction(action) {
    if (!canControlLocal()) return;
    action();
    broadcastRoomSnapshot();
  }

  function setOverlay(text) {
    if (!overlayEl) return;
    if (!text) {
      overlayEl.textContent = "";
      overlayEl.style.opacity = "0";
      return;
    }
    overlayEl.textContent = text;
    overlayEl.style.opacity = "1";
  }

  function scopedKey(baseKey) {
    const auth = readStoredAuth();
    return scopedStorageKey(baseKey, auth?.userId || "");
  }

  function loadBankroll() {
    try {
      const fromSaveData = Number(options.onCasinoBankRequest?.());
      if (Number.isFinite(fromSaveData) && fromSaveData >= 0) {
        return Math.floor(fromSaveData);
      }
    } catch {
      // Fall back to local storage when callback is unavailable.
    }

    try {
      const scopedBankKey = scopedKey(CASINO_SHARED_BANK_STORAGE_KEY);
      let rawStored = localStorage.getItem(scopedBankKey);
      if (!rawStored) {
        // Migrate old poker-only bankroll to new shared bankroll per account.
        const legacy = localStorage.getItem(POKER_LEGACY_BANK_STORAGE_KEY);
        if (legacy != null) {
          rawStored = legacy;
          localStorage.setItem(scopedBankKey, legacy);
        }
      }
      const raw = Number(rawStored);
      if (Number.isFinite(raw) && raw >= 0) {
        return Math.floor(raw);
      }
    } catch {
      // Ignore storage errors and fallback to default.
    }
    return DEFAULT_BANKROLL;
  }

  function saveBankroll() {
    const normalized = Math.max(0, Math.floor(state.bankroll));
    try {
      if (typeof options.onCasinoBankSave === "function") {
        options.onCasinoBankSave(normalized);
      }
    } catch {
      // Keep gameplay available even when callback path fails.
    }

    try {
      localStorage.setItem(scopedKey(CASINO_SHARED_BANK_STORAGE_KEY), String(normalized));
    } catch {
      // Keep gameplay available even when storage is unavailable.
    }
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(scopedKey(POKER_STATS_STORAGE_KEY));
      if (!raw) {
        return { wins: 0, games: 0, netProfit: 0 };
      }
      const parsed = JSON.parse(raw);
      return {
        wins: Number.isFinite(Number(parsed?.wins)) ? Math.max(0, Math.floor(Number(parsed.wins))) : 0,
        games: Number.isFinite(Number(parsed?.games)) ? Math.max(0, Math.floor(Number(parsed.games))) : 0,
        netProfit: Number.isFinite(Number(parsed?.netProfit)) ? Math.floor(Number(parsed.netProfit)) : 0,
      };
    } catch {
      return { wins: 0, games: 0, netProfit: 0 };
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(
        scopedKey(POKER_STATS_STORAGE_KEY),
        JSON.stringify({
          wins: state.stats.wins,
          games: state.stats.games,
          netProfit: state.stats.netProfit,
        }),
      );
    } catch {
      // Ignore storage failures.
    }
  }

  function loadSfxEnabled() {
    try {
      const raw = localStorage.getItem(scopedKey(POKER_SFX_STORAGE_KEY));
      if (raw === "off") return false;
      if (raw === "on") return true;
    } catch {
      // Ignore storage errors.
    }
    return true;
  }

  function saveSfxEnabled() {
    try {
      localStorage.setItem(scopedKey(POKER_SFX_STORAGE_KEY), state.sfxEnabled ? "on" : "off");
    } catch {
      // Ignore storage errors.
    }
  }

  function formatChip(value) {
    return String(Math.max(0, Math.floor(value)));
  }

  function formatSignedChip(value) {
    const v = Math.floor(Number(value) || 0);
    if (v > 0) return `+${v}`;
    if (v < 0) return `${v}`;
    return "0";
  }

  function playChipSfx(volume = 0.06) {
    if (!state.sfxEnabled) return;
    const now = performance.now();
    if (now - lastChipSfxAt < 55) return;
    lastChipSfxAt = now;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!chipAudioCtx) {
        chipAudioCtx = new AudioCtx();
      }
      if (chipAudioCtx.state === "suspended") {
        chipAudioCtx.resume();
      }

      const t0 = chipAudioCtx.currentTime;
      const osc = chipAudioCtx.createOscillator();
      const gain = chipAudioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1160, t0);
      osc.frequency.exponentialRampToValueAtTime(520, t0 + 0.05);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
      osc.connect(gain);
      gain.connect(chipAudioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.065);
    } catch {
      // Ignore sound failures to keep gameplay stable.
    }
  }

  function setChipTextWithFx(el, value, { animate = true } = {}) {
    if (!el) return false;
    const next = formatChip(value);
    const changed = el.textContent !== next;
    el.textContent = next;
    if (changed && animate) {
      el.classList.remove("chip-pop");
      void el.offsetWidth;
      el.classList.add("chip-pop");
    }
    return changed;
  }

  function chipLayersFromValue(value) {
    const normalized = Math.max(0, Math.floor(Number(value) || 0));
    if (normalized <= 0) return 1;
    const layers = Math.floor(Math.log2(normalized / BET_STEP + 1) * 2.4) + 1;
    return Math.max(1, Math.min(14, layers));
  }

  function updateChipStack(el, amountEl, value, { animate = true } = {}) {
    if (el) {
      const layers = chipLayersFromValue(value);
      el.style.setProperty("--chip-layers", String(layers));
      if (animate) {
        el.classList.remove("chip-pop");
        void el.offsetWidth;
        el.classList.add("chip-pop");
      }
    }
    if (amountEl) {
      amountEl.textContent = formatChip(value);
    }
  }

  function clampBet(value) {
    const maxAffordable = Math.max(MIN_BET, Math.floor(state.bankroll / BET_STEP) * BET_STEP);
    const normalized = Math.max(MIN_BET, Math.floor(value / BET_STEP) * BET_STEP);
    return Math.min(normalized, maxAffordable);
  }

  function maxAffordableBet() {
    return Math.max(MIN_BET, Math.floor(state.bankroll / BET_STEP) * BET_STEP);
  }

  function maxAffordableRaise() {
    const reservedForCall = isTournamentActiveRound() ? state.pendingCallAmount : 0;
    const available = Math.max(0, state.bankroll - reservedForCall);
    return Math.floor(available / BET_STEP) * BET_STEP;
  }

  function clampRaiseAmount(value) {
    const affordable = maxAffordableRaise();
    if (affordable < BET_STEP) return 0;
    const normalized = Math.max(BET_STEP, Math.floor(value / BET_STEP) * BET_STEP);
    return Math.min(normalized, affordable);
  }

  function computeRaiseAmount() {
    const affordable = maxAffordableRaise();
    if (affordable < BET_STEP) return 0;
    return Math.min(clampRaiseAmount(state.raiseAmount), affordable);
  }

  function adjustBet(delta) {
    const next = clampBet(state.currentBet + delta);
    const changed = next !== state.currentBet;
    state.currentBet = next;
    if (changed) playChipSfx(0.055);
    render();
  }

  function adjustRaiseAmount(delta) {
    const next = clampRaiseAmount(state.raiseAmount + delta);
    const changed = next !== state.raiseAmount;
    state.raiseAmount = next;
    if (changed) playChipSfx(0.05);
    render();
  }

  function clampPotPresetPercent(value) {
    return Math.max(25, Math.min(100, Math.round(value / 25) * 25));
  }

  function applyCurrentPotPresetRaise() {
    setRaiseAmountFromPotRatio(state.potPresetPercent / 100);
  }

  function adjustPotPresetPercent(delta) {
    state.potPresetPercent = clampPotPresetPercent(state.potPresetPercent + delta);
    if (isTournamentActiveRound()) {
      applyCurrentPotPresetRaise();
      return;
    }
    render();
  }

  function setRaiseAmountFromPotRatio(ratio) {
    const basePot = Math.max(BET_STEP * 2, state.activeWager + state.cpuWager);
    const target = Math.max(BET_STEP, Math.ceil((basePot * ratio) / BET_STEP) * BET_STEP);
    const next = clampRaiseAmount(target);
    const changed = next !== state.raiseAmount;
    state.raiseAmount = next;
    if (changed) playChipSfx(0.052);
    render();
  }

  function applyAllInBet() {
    const next = maxAffordableBet();
    const changed = next !== state.currentBet;
    state.currentBet = next;
    if (changed) playChipSfx(0.07);
    render();
  }

  function applyAllInTournamentAction() {
    if (!isTournamentActiveRound()) return;
    if (state.bankroll < state.pendingCallAmount) {
      messageEl.textContent = localize("callFailed");
      render();
      return;
    }

    const callAmount = state.pendingCallAmount;
    const raiseAmount = maxAffordableRaise();
    const totalNeed = callAmount + raiseAmount;
    if (totalNeed <= 0) {
      messageEl.textContent = localize("raiseFailed");
      render();
      return;
    }

    state.bankroll -= totalNeed;
    state.activeWager += totalNeed;
    state.pendingCallAmount = 0;

    if (raiseAmount >= BET_STEP) {
      const cpuAction = resolveCpuTournamentResponse("raise", raiseAmount);
      if (cpuAction.type === "fold") {
        settleCpuFoldWin();
        return;
      }

      saveBankroll();
      if (cpuAction.type === "raise") {
        state.pendingCallAmount = cpuAction.extra;
        const callText = callAmount > 0 ? ` / ${localize("called")} (+${callAmount})` : "";
        messageEl.textContent = `ALL IN (+${raiseAmount})${callText} / ${opponentTitle()}${localize("opponentRaised")} (+${cpuAction.extra}) / ${localize("callRequired")}`;
        render();
        return;
      }

      messageEl.textContent = `ALL IN (+${raiseAmount}) / ${opponentTitle()}${localize("opponentCalled")}`;
      advanceRound();
      return;
    }

    saveBankroll();
    messageEl.textContent = `${localize("called")} (+${callAmount}) / ALL IN`;
    advanceRound();
  }

  function clearDrawUnlockTimer() {
    if (state.drawUnlockTimerId) {
      window.clearTimeout(state.drawUnlockTimerId);
      state.drawUnlockTimerId = null;
    }
  }

  function drawCard() {
    return state.deck.pop();
  }

  function resetDeck() {
    state.deck = shuffle(createDeck());
  }

  function cardLabel(card) {
    return `${rankLabel(card.rank)}${SUIT_SYMBOL[card.suit]}`;
  }

  function estimateCpuStrength() {
    if (!isTournamentMode()) return 0.5;
    const hands = cpuHands().filter((hand) => Array.isArray(hand) && hand.length > 0);
    if (hands.length === 0) return 0.5;

    const handStrength = (hand) => {
      if (state.phase === "preflop") {
        const [a, b] = hand;
        if (!a || !b) return 0.5;
        if (a.rank === b.rank) return 0.72 + Math.min(0.2, (a.rank - 2) * 0.015);
        const high = Math.max(a.rank, b.rank);
        const low = Math.min(a.rank, b.rank);
        const suited = a.suit === b.suit ? 0.06 : 0;
        const broadway = high >= 11 && low >= 10 ? 0.08 : 0;
        return Math.min(0.9, 0.25 + (high - 2) * 0.03 + (low - 2) * 0.012 + suited + broadway);
      }

      const visible = [...hand, ...state.community];
      if (visible.length < 5) return 0.5;
      const evaluated = evaluateBestOfSeven(visible);
      const tier = Number(evaluated?.score?.[0] || 0);
      const kicker = Number(evaluated?.score?.[1] || 0);
      return Math.min(0.98, tier / 8 + kicker / 100);
    };

    return hands.reduce((best, hand) => Math.max(best, handStrength(hand)), 0.5);
  }

  function settleCpuFoldWin() {
    state.phase = "showdown";
    state.gameOver = true;
    state.playerResult = { score: [9], name: "WIN" };
    state.cpuResult = { score: [0], name: "FOLD" };
    state.showdownResultType = "win";
    state.showdownWinnerSide = "player";
    state.showdownResultDetail = `+${state.cpuWager}`;
    state.stats.wins += 1;
    state.stats.games += 1;
    state.stats.netProfit += state.cpuWager;
    state.bankroll += state.activeWager + state.cpuWager;
    setOverlay(isDealerMode() ? localize("dealerFoldOverlay") : localize("cpuFoldOverlay"));
    messageEl.textContent = `${opponentTitle()}${localize("opponentFolded")} (+${state.cpuWager})`;
    state.activeWager = 0;
    state.cpuWager = 0;
    state.pendingCallAmount = 0;
    saveBankroll();
    saveStats();
    state.currentBet = clampBet(state.currentBet);
    render();
  }

  function resolveCpuTournamentResponse(playerAction, playerRaiseAmount = 0) {
    const strength = estimateCpuStrength();
    const dealerBias = isDealerMode() ? 1 : 0;
    const style = state.cpuStyle;
    const foldStyleBias = style === "weak" ? 0.08 : style === "aggressive" ? -0.05 : 0;
    const raiseStyleBias = style === "weak" ? -0.08 : style === "aggressive" ? 0.12 : 0;
    const raiseScale = style === "aggressive" ? 0.5 : style === "weak" ? 0.2 : 0.25;
    const bluffStyleBias = style === "aggressive" ? 0.08 : style === "weak" ? -0.03 : 0;
    const phaseBluffBase = state.phase === "preflop" ? 0.07 : state.phase === "flop" ? 0.1 : state.phase === "turn" ? 0.06 : 0.04;
    const bluffChance = Math.max(0, Math.min(0.32, phaseBluffBase + bluffStyleBias + (0.52 - strength) * 0.1 - dealerBias * 0.03));
    const isBluffRaise = Math.random() < bluffChance;

    const foldBase = playerAction === "raise" ? (dealerBias ? 0.2 : 0.1) : 0;
    const foldChance = Math.max(0, Math.min(0.6, foldBase + (0.45 - strength) * 0.22 + foldStyleBias));
    if (playerAction === "raise" && !isBluffRaise && Math.random() < foldChance) {
      return { type: "fold" };
    }

    if (playerRaiseAmount > 0) {
      state.cpuWager += playerRaiseAmount * state.activeCpuCount;
    }

    const raiseBase = playerAction === "stand" ? (dealerBias ? 0.04 : 0.1) : dealerBias ? 0.06 : 0.14;
    const raiseChance = Math.max(0, Math.min(0.78, raiseBase + (strength - 0.6) * 0.28 + raiseStyleBias + (isBluffRaise ? 0.22 : 0)));
    if (Math.random() >= raiseChance) {
      return { type: "call", extra: 0 };
    }

    const actualRaiseScale = isBluffRaise ? Math.max(0.18, raiseScale - 0.08) : raiseScale;
    const desired = Math.max(BET_STEP, Math.ceil((state.activeWager * actualRaiseScale) / BET_STEP) * BET_STEP);
    const cap = Math.max(BET_STEP, Math.floor((state.activeWager * 0.5) / BET_STEP) * BET_STEP);
    const extraRaise = Math.min(desired, cap);
    if (extraRaise < BET_STEP) {
      return { type: "call", extra: 0 };
    }

    state.cpuWager += extraRaise * state.activeCpuCount;
    return { type: "raise", extra: extraRaise };
  }

  function callPendingRaiseIfNeeded() {
    if (state.pendingCallAmount <= 0) return true;
    if (state.bankroll < state.pendingCallAmount) {
      messageEl.textContent = localize("callFailed");
      render();
      return false;
    }
    state.bankroll -= state.pendingCallAmount;
    state.activeWager += state.pendingCallAmount;
    state.pendingCallAmount = 0;
    saveBankroll();
    return true;
  }

  function renderCard(container, card, { held = false, faceDown = false, clickable = false, index = -1 } = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "poker-card";
    if (held) button.classList.add("held");
    if (RED_SUITS.has(card.suit)) button.classList.add("red");

    if (faceDown) {
      button.classList.add("back");
      button.textContent = "🂠";
    } else {
      button.textContent = cardLabel(card);
    }

    button.disabled = !clickable;
    if (clickable) {
      button.addEventListener("click", () => {
        if (state.phase !== "draw-hold" || state.roomLocked || !isDrawMode() || !canControlLocal()) return;
        if (state.heldIndexes.has(index)) {
          state.heldIndexes.delete(index);
        } else {
          state.heldIndexes.add(index);
        }
        renderHands();
      });
    }

    container.appendChild(button);
  }

  function renderHands() {
    if (!playerHandEl || !cpuHandEl || !communityEl) return;

    playerHandEl.innerHTML = "";
    cpuHandEl.innerHTML = "";
    communityEl.innerHTML = "";

    if (communityZoneEl) {
      communityZoneEl.classList.toggle("hidden", !isTournamentMode());
    }

    const canToggleHold = isDrawMode() && state.phase === "draw-hold" && !state.roomLocked;

    const hidePlayerCards = state.phase === "betting";

    state.playerCards.forEach((card, index) => {
      renderCard(playerHandEl, card, {
        held: state.heldIndexes.has(index),
        faceDown: hidePlayerCards,
        clickable: canToggleHold,
        index,
      });
    });

    state.cpuCards.forEach((card) => {
      renderCard(cpuHandEl, card, {
        faceDown: state.phase !== "showdown" && state.phase !== "draw-showdown",
      });
    });

    if (isTournamentMode()) {
      state.community.forEach((card) => {
        renderCard(communityEl, card);
      });

      const placeholders = 5 - state.community.length;
      for (let i = 0; i < placeholders; i += 1) {
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = "poker-card back";
        slot.textContent = "?";
        slot.disabled = true;
        communityEl.appendChild(slot);
      }
    }
  }

  function renderHud() {
    const canLocalControl = canControlLocal();
    if (phaseEl) phaseEl.textContent = phaseLabel(state.phase);
    if (startBtn) startBtn.disabled = state.roomLocked || !canLocalControl;
    if (remakeBtn) remakeBtn.disabled = state.roomLocked || !canLocalControl;
    const animateHudChips = didInitialHudRender;
    const plannedWager = Math.max(MIN_BET, clampBet(state.currentBet));
    const playerWagerDisplay = state.activeWager > 0 ? state.activeWager : plannedWager;
    const opponentWagerDisplay = state.cpuWager > 0 ? state.cpuWager : plannedWager;
    const potDisplay = playerWagerDisplay + opponentWagerDisplay;
    if (betTextEl) betTextEl.textContent = formatChip(playerWagerDisplay);
    if (opponentBetTextEl) opponentBetTextEl.textContent = formatChip(opponentWagerDisplay);
    if (focusBetTextEl) {
      setChipTextWithFx(focusBetTextEl, playerWagerDisplay, { animate: animateHudChips });
    }
    setChipTextWithFx(tablePlayerBetTextEl, playerWagerDisplay, { animate: animateHudChips });
    setChipTextWithFx(tableOpponentBetTextEl, opponentWagerDisplay, { animate: animateHudChips });
    setChipTextWithFx(tablePotTextEl, potDisplay, { animate: animateHudChips });
    updateChipStack(playerChipStackEl, playerChipAmountEl, playerWagerDisplay, { animate: animateHudChips });
    updateChipStack(opponentChipStackEl, opponentChipAmountEl, opponentWagerDisplay, { animate: animateHudChips });
    updateChipStack(potChipStackEl, potChipAmountEl, potDisplay, { animate: animateHudChips });
    didInitialHudRender = true;
    if (bankTextEl) bankTextEl.textContent = formatChip(state.bankroll);
    if (betRangeTextEl) {
      betRangeTextEl.textContent = `${MIN_BET} - ${maxAffordableBet()}`;
    }
    state.raiseAmount = clampRaiseAmount(state.raiseAmount);
    if (raiseAmountTextEl) {
      raiseAmountTextEl.textContent = formatChip(state.raiseAmount);
    }
    if (focusRaiseTextEl) {
      setChipTextWithFx(focusRaiseTextEl, state.raiseAmount, { animate: animateHudChips });
    }
    if (statsTextEl) {
      statsTextEl.textContent = `${localize("statsPrefix")}: W${state.stats.wins} / G${state.stats.games} / ${formatSignedChip(state.stats.netProfit)}`;
    }
    if (betMinusBtn) {
      const canAdjustBet = state.gameOver || state.phase === "betting";
      betMinusBtn.disabled = state.roomLocked || !canLocalControl || !canAdjustBet || state.currentBet <= MIN_BET;
    }
    if (betPlusBtn) {
      const canAdjustBet = state.gameOver || state.phase === "betting";
      betPlusBtn.disabled = state.roomLocked || !canLocalControl || !canAdjustBet || state.currentBet >= maxAffordableBet();
    }
    if (allInBtn) {
      const canAdjustBet = state.gameOver || state.phase === "betting";
      if (canAdjustBet) {
        allInBtn.disabled = state.roomLocked || !canLocalControl || state.currentBet >= maxAffordableBet();
      } else {
        const canAllInRound =
          isTournamentActiveRound() &&
          state.bankroll >= state.pendingCallAmount &&
          (maxAffordableRaise() >= BET_STEP || state.pendingCallAmount > 0);
        allInBtn.disabled = state.roomLocked || !canLocalControl || !canAllInRound;
      }
    }
    if (raiseMinusBtn) {
      raiseMinusBtn.disabled = state.roomLocked || !canLocalControl || !isTournamentActiveRound() || state.raiseAmount <= BET_STEP;
    }
    if (raisePlusBtn) {
      const affordableRaise = maxAffordableRaise();
      raisePlusBtn.disabled =
        state.roomLocked || !isTournamentActiveRound() || affordableRaise < BET_STEP || state.raiseAmount >= affordableRaise;
      raisePlusBtn.disabled =
        state.roomLocked || !canLocalControl || !isTournamentActiveRound() || affordableRaise < BET_STEP || state.raiseAmount >= affordableRaise;
    }
    const canUsePotPresets = !state.roomLocked && isTournamentActiveRound();
    if (potPresetMinusBtn) {
      potPresetMinusBtn.disabled = !canUsePotPresets || !canLocalControl || state.potPresetPercent <= 25;
    }
    if (potPresetPlusBtn) {
      potPresetPlusBtn.disabled = !canUsePotPresets || !canLocalControl || state.potPresetPercent >= 100;
    }
    if (potPresetTextEl) {
      potPresetTextEl.textContent = `${state.potPresetPercent}%`;
    }
    if (changeBtn) {
      const enabled = isDrawMode() && state.phase === "draw-hold" && !state.roomLocked;
      changeBtn.disabled = !enabled || !canLocalControl;
      changeBtn.classList.toggle("hidden", !isDrawMode());
    }

    if (raiseBtn) {
      raiseBtn.disabled = state.roomLocked || !canLocalControl || !isTournamentActiveRound() || computeRaiseAmount() < BET_STEP;
    }

    if (standBtn) {
      standBtn.disabled = state.roomLocked || !canLocalControl || !isTournamentActiveRound() || state.pendingCallAmount > 0;
    }

    if (callBtn) {
      callBtn.disabled =
        state.roomLocked ||
        !canLocalControl ||
        !isTournamentActiveRound() ||
        state.pendingCallAmount <= 0 ||
        state.bankroll < state.pendingCallAmount;
      callBtn.classList.toggle("hidden", !isTournamentActiveRound());
    }

    if (foldBtn) {
      foldBtn.disabled = state.roomLocked || !canLocalControl || !isTournamentActiveRound();
    }

    if (actionBtn) {
      if (state.phase === "betting") {
        actionBtn.disabled = state.roomLocked;
        actionBtn.textContent = localize("betAction");
      } else if (isDrawMode()) {
        const canJudge = state.phase === "draw-ready" && !state.roomLocked;
        actionBtn.disabled = !canJudge || !canLocalControl;
        actionBtn.textContent = localize("next");
      } else {
        actionBtn.disabled =
          state.roomLocked ||
          !canLocalControl ||
          state.pendingCallAmount > 0 ||
          state.phase === "standby" ||
          state.phase === "showdown" ||
          state.phase === "draw-showdown";
        actionBtn.textContent = localize("next");
      }
    }

    if (ruleSelectEl) {
      ruleSelectEl.value = state.ruleMode;
      ruleSelectEl.disabled = state.gameMode === "room" || (!state.gameOver && state.phase !== "betting");
    }

    if (opponentSelectEl) {
      opponentSelectEl.value = state.opponentMode;
      opponentSelectEl.disabled = state.gameMode === "room" || (!state.gameOver && state.phase !== "betting");
    }

    if (cpuStyleSelectEl) {
      cpuStyleSelectEl.value = state.cpuStyle;
      cpuStyleSelectEl.disabled = state.gameMode === "room" || (!state.gameOver && state.phase !== "betting");
    }

    if (sfxSelectEl) {
      sfxSelectEl.value = state.sfxEnabled ? "on" : "off";
    }

    if (cpuCountSelectEl) {
      cpuCountSelectEl.value = String(state.cpuCount);
      cpuCountSelectEl.disabled =
        state.gameMode === "room" || state.opponentMode === "dealer" || (!state.gameOver && state.phase !== "betting");
    }

    if (opponentRankLabelEl) {
      const baseLabel = isDealerMode() ? localize("dealerHand") : localize("cpuHand");
      opponentRankLabelEl.textContent = !isDealerMode() && state.activeCpuCount > 1 ? `${baseLabel} x${state.activeCpuCount}` : baseLabel;
    }

    if (opponentHoleLabelEl) {
      const baseLabel = isDealerMode() ? localize("dealerHole") : localize("cpuHole");
      opponentHoleLabelEl.textContent = !isDealerMode() && state.activeCpuCount > 1 ? `${baseLabel} x${state.activeCpuCount}` : baseLabel;
    }

    const inShowdown = state.phase === "showdown" || state.phase === "draw-showdown";
    if (pokerWrapEl) {
      pokerWrapEl.classList.toggle("showdown-focus", inShowdown);
      pokerWrapEl.classList.toggle("showdown-focus-player", inShowdown && state.showdownWinnerSide === "player");
      pokerWrapEl.classList.toggle("showdown-focus-opponent", inShowdown && state.showdownWinnerSide === "opponent");
      pokerWrapEl.classList.toggle("showdown-focus-draw", inShowdown && state.showdownWinnerSide === "draw");
    }
    if (resultBannerEl) {
      resultBannerEl.classList.toggle("hidden", !inShowdown);
      resultBannerEl.classList.toggle("win", inShowdown && state.showdownResultType === "win");
      resultBannerEl.classList.toggle("lose", inShowdown && state.showdownResultType === "lose");
      resultBannerEl.classList.toggle("draw", inShowdown && state.showdownResultType === "draw");
    }
    if (resultTitleEl && inShowdown) {
      if (state.showdownResultType === "win") {
        resultTitleEl.textContent = localize("youWin");
      } else if (state.showdownResultType === "lose") {
        resultTitleEl.textContent = isDealerMode() ? localize("dealerWin") : localize("cpuWin");
      } else {
        resultTitleEl.textContent = localize("draw");
      }
    }
    if (resultDetailEl && inShowdown) {
      resultDetailEl.textContent = state.showdownResultDetail || "-";
    }
    if (playerZoneEl) {
      playerZoneEl.classList.toggle("is-winner", inShowdown && state.showdownWinnerSide === "player");
      playerZoneEl.classList.toggle("is-loser", inShowdown && state.showdownWinnerSide === "opponent");
    }
    if (opponentZoneEl) {
      opponentZoneEl.classList.toggle("is-winner", inShowdown && state.showdownWinnerSide === "opponent");
      opponentZoneEl.classList.toggle("is-loser", inShowdown && state.showdownWinnerSide === "player");
    }

    if (inShowdown) {
      playerRankEl.textContent = state.playerResult?.name || "-";
      cpuRankEl.textContent = state.cpuResult?.name || "-";
      return;
    }

    playerRankEl.textContent = "-";
    cpuRankEl.textContent = "-";
  }

  function render() {
    renderHud();
    renderHands();
  }

  function enterStandby() {
    clearDrawUnlockTimer();
    state.deck = [];
    state.playerCards = [];
    state.cpuCards = [];
    state.extraCpuCards = [];
    state.community = [];
    state.heldIndexes = new Set();
    state.phase = "standby";
    state.gameOver = true;
    state.playerResult = null;
    state.cpuResult = null;
    state.showdownResultType = "";
    state.showdownWinnerSide = "";
    state.showdownResultDetail = "";
    state.activeWager = 0;
    state.cpuWager = 0;
    state.pendingCallAmount = 0;

    messageEl.textContent = state.roomLocked ? state.roomLockMessage || localize("waitingRoom") : localize("waitingStart");
    setOverlay(state.roomLocked ? state.roomLockMessage || localize("waitingRoom") : localize("waitingOverlay"));
    render();
  }

  function startNewGame({ fromRemote = false } = {}) {
    if (state.roomLocked) return;
    // Read the latest selector state at start time to avoid stale mode issues.
    syncModesFromUi();
    clearDrawUnlockTimer();
    let refilledFromBroke = false;

    if (state.bankroll <= 0) {
      state.bankroll = DEFAULT_BANKROLL;
      state.currentBet = MIN_BET;
      saveBankroll();
      refilledFromBroke = true;
    }

    resetDeck();
    state.community = [];
    state.heldIndexes = new Set();
    state.gameOver = false;
    state.playerResult = null;
    state.cpuResult = null;
    state.showdownResultType = "";
    state.showdownWinnerSide = "";
    state.showdownResultDetail = "";
    state.activeWager = 0;
    state.cpuWager = 0;
    state.pendingCallAmount = 0;
    state.activeCpuCount = isDealerMode() ? 1 : state.cpuCount;

    if (isTournamentMode()) {
      state.playerCards = [drawCard(), drawCard()];
      state.cpuCards = [drawCard(), drawCard()];
      state.extraCpuCards = Array.from({ length: Math.max(0, state.activeCpuCount - 1) }, () => [drawCard(), drawCard()]);
    } else {
      state.playerCards = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()];
      state.cpuCards = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()];
      state.extraCpuCards = Array.from({ length: Math.max(0, state.activeCpuCount - 1) }, () => [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()]);
    }

    state.phase = "betting";
    messageEl.textContent = refilledFromBroke ? `${localize("bankrollRefilled")} / ${localize("bettingStart")}` : localize("bettingStart");

    setOverlay(localize("placeBetOverlay"));
    render();

    if (state.gameMode === "room" && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function revealShowdown() {
    const playerCards = isTournamentMode() ? [...state.playerCards, ...state.community] : [...state.playerCards];
    const cpuHandsWithBoard = cpuHands()
      .filter((hand) => Array.isArray(hand) && hand.length > 0)
      .map((hand) => (isTournamentMode() ? [...hand, ...state.community] : [...hand]));

    state.playerResult = isTournamentMode() ? evaluateBestOfSeven(playerCards) : evaluateHand(playerCards);
    let bestCpuResult = { score: [0], name: "-" };
    cpuHandsWithBoard.forEach((handCards) => {
      const result = isTournamentMode() ? evaluateBestOfSeven(handCards) : evaluateHand(handCards);
      if (compareEvaluated(result, bestCpuResult) > 0) {
        bestCpuResult = result;
      }
    });
    state.cpuResult = bestCpuResult;
    state.phase = isTournamentMode() ? "showdown" : "draw-showdown";
    state.gameOver = true;

    const outcome = compareEvaluated(state.playerResult, state.cpuResult);
    const totalPot = state.activeWager + state.cpuWager;
    if (outcome > 0) {
      state.bankroll += totalPot;
      state.stats.wins += 1;
      state.stats.games += 1;
      state.stats.netProfit += state.cpuWager;
      state.showdownResultType = "win";
      state.showdownWinnerSide = "player";
      state.showdownResultDetail = `+${state.cpuWager}`;
      setOverlay(localize("youWinOverlay"));
      messageEl.textContent = `${localize("youWin")}: ${state.playerResult.name} / ${opponentTitle()}: ${state.cpuResult.name} (+${state.cpuWager})`;
    } else if (outcome < 0) {
      state.stats.games += 1;
      state.stats.netProfit -= state.activeWager;
      state.showdownResultType = "lose";
      state.showdownWinnerSide = "opponent";
      state.showdownResultDetail = `-${state.activeWager}`;
      setOverlay(isDealerMode() ? localize("dealerWinOverlay") : localize("cpuWinOverlay"));
      messageEl.textContent = `${isDealerMode() ? localize("dealerWin") : localize("cpuWin")}: ${state.cpuResult.name} / ${localize("drawResultYou")}: ${state.playerResult.name} (-${state.activeWager})`;
    } else {
      if (isDealerMode()) {
        state.stats.games += 1;
        state.stats.netProfit -= state.activeWager;
        state.showdownResultType = "lose";
        state.showdownWinnerSide = "opponent";
        state.showdownResultDetail = `-${state.activeWager}`;
        setOverlay(localize("dealerWinOverlay"));
        messageEl.textContent = `${localize("dealerWin")} (同点優先): ${state.cpuResult.name} (-${state.activeWager})`;
      } else {
        state.stats.games += 1;
        state.bankroll += state.activeWager;
        state.showdownResultType = "draw";
        state.showdownWinnerSide = "draw";
        state.showdownResultDetail = "0";
        setOverlay(localize("drawOverlay"));
        messageEl.textContent = `${localize("draw")}: ${state.playerResult.name}`;
      }
    }

    state.activeWager = 0;
    state.cpuWager = 0;
    state.pendingCallAmount = 0;
    saveBankroll();
    saveStats();
    state.currentBet = clampBet(state.currentBet);
  }

  function settleFoldLoss() {
    if (!isTournamentActiveRound()) return;
    state.phase = "showdown";
    state.gameOver = true;
    state.playerResult = { score: [0], name: localize("foldOverlay") };
    state.cpuResult = { score: [0], name: isDealerMode() ? localize("dealerWin") : localize("cpuWin") };
    state.showdownResultType = "lose";
    state.showdownWinnerSide = "opponent";
    state.showdownResultDetail = `-${state.activeWager}`;
    state.stats.games += 1;
    state.stats.netProfit -= state.activeWager;
    setOverlay(localize("foldOverlay"));
    messageEl.textContent = `${localize("folded")} (-${state.activeWager})`;
    state.activeWager = 0;
    state.cpuWager = 0;
    state.pendingCallAmount = 0;
    saveBankroll();
    saveStats();
    state.currentBet = clampBet(state.currentBet);
    render();
  }

  function executeDrawCardChange() {
    if (!isDrawMode() || state.phase !== "draw-hold" || state.roomLocked) return;
    if (state.heldIndexes.size === 0) {
      messageEl.textContent = localize("drawSelectRequired");
      return;
    }

    for (let i = 0; i < state.playerCards.length; i += 1) {
      if (state.heldIndexes.has(i)) {
        state.playerCards[i] = drawCard();
      }
    }

    const cpuHold = cpuHeldIndexes(state.cpuCards);
    for (let i = 0; i < state.cpuCards.length; i += 1) {
      if (!cpuHold.has(i)) {
        state.cpuCards[i] = drawCard();
      }
    }

    state.extraCpuCards = state.extraCpuCards.map((hand) => {
      const nextHand = Array.isArray(hand) ? [...hand] : [];
      const hold = cpuHeldIndexes(nextHand);
      for (let i = 0; i < nextHand.length; i += 1) {
        if (!hold.has(i)) {
          nextHand[i] = drawCard();
        }
      }
      return nextHand;
    });

    state.heldIndexes = new Set();
    state.phase = "draw-wait";
    messageEl.textContent = localize("drawChanging");
    setOverlay("CHANGING...");
    clearDrawUnlockTimer();
    state.drawUnlockTimerId = window.setTimeout(() => {
      state.drawUnlockTimerId = null;
      if (state.phase !== "draw-wait") return;
      state.phase = "draw-ready";
      setOverlay("");
      messageEl.textContent = localize("drawChangedNext");
      render();
      broadcastRoomSnapshot();
    }, 500);
    render();
  }

  function advanceRound() {
    if (state.roomLocked) return;
    if (state.phase === "standby" || state.phase === "showdown" || state.phase === "draw-showdown") return;

    if (state.phase === "betting") {
      state.currentBet = clampBet(state.currentBet);
      if (state.bankroll < state.currentBet) {
        messageEl.textContent = localize("betInsufficient");
        render();
        return;
      }

      state.activeWager = state.currentBet;
      state.activeCpuCount = isDealerMode() ? 1 : state.cpuCount;
      state.cpuWager = state.currentBet * state.activeCpuCount;
      state.pendingCallAmount = 0;
      state.bankroll = Math.max(0, state.bankroll - state.activeWager);
      saveBankroll();

      if (isDrawMode()) {
        state.phase = "draw-hold";
        messageEl.textContent = localize("drawStart");
      } else {
        state.phase = "preflop";
        messageEl.textContent = localize("holdemStart");
      }

      setOverlay("");
      render();
      return;
    }

    if (isDrawMode()) {
      if (state.phase !== "draw-ready") return;
      revealShowdown();
      render();
      return;
    }

    if (state.phase === "preflop") {
      state.community.push(drawCard(), drawCard(), drawCard());
      state.phase = "flop";
      messageEl.textContent = localize("holdemFlop");
      render();
      return;
    }

    if (state.phase === "flop") {
      state.community.push(drawCard());
      state.phase = "turn";
      messageEl.textContent = localize("holdemTurn");
      render();
      return;
    }

    if (state.phase === "turn") {
      state.community.push(drawCard());
      state.phase = "river";
      messageEl.textContent = localize("holdemRiver");
      render();
      return;
    }

    if (state.phase === "river") {
      revealShowdown();
      render();
    }
  }

  startBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      startNewGame({ fromRemote: false });
    });
  });

  remakeBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      startNewGame({ fromRemote: false });
    });
  });

  betMinusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      adjustBet(-BET_STEP);
    });
  });

  betPlusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      adjustBet(BET_STEP);
    });
  });

  raiseMinusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (!isTournamentActiveRound()) return;
      adjustRaiseAmount(-BET_STEP);
    });
  });

  raisePlusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (!isTournamentActiveRound()) return;
      adjustRaiseAmount(BET_STEP);
    });
  });

  potPresetMinusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (!isTournamentActiveRound()) return;
      adjustPotPresetPercent(-25);
    });
  });

  potPresetPlusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (!isTournamentActiveRound()) return;
      adjustPotPresetPercent(25);
    });
  });

  allInBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (state.gameOver || state.phase === "betting") {
        applyAllInBet();
        return;
      }
      applyAllInTournamentAction();
    });
  });

  changeBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      executeDrawCardChange();
    });
  });

  actionBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      advanceRound();
    });
  });

  raiseBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (!isTournamentActiveRound()) return;
      const raiseAmount = computeRaiseAmount();
      const totalNeed = state.pendingCallAmount + raiseAmount;
      if (raiseAmount < BET_STEP || state.bankroll < totalNeed) {
        messageEl.textContent = localize("raiseFailed");
        return;
      }
      const calledBeforeRaise = state.pendingCallAmount;
      state.bankroll -= totalNeed;
      state.activeWager += totalNeed;
      state.pendingCallAmount = 0;
      playChipSfx(0.075);

      const cpuAction = resolveCpuTournamentResponse("raise", raiseAmount);
      if (cpuAction.type === "fold") {
        settleCpuFoldWin();
        return;
      }

      saveBankroll();
      if (cpuAction.type === "raise") {
        state.pendingCallAmount = cpuAction.extra;
        const callText = calledBeforeRaise > 0 ? ` / ${localize("called")} (+${calledBeforeRaise})` : "";
        messageEl.textContent = `${localize("raised")} (+${raiseAmount})${callText} / ${opponentTitle()}${localize("opponentRaised")} (+${cpuAction.extra}) / ${localize("callRequired")}`;
        render();
        return;
      } else {
        messageEl.textContent = `${localize("raised")} (+${raiseAmount}) / ${opponentTitle()}${localize("opponentCalled")}`;
      }
      advanceRound();
    });
  });

  standBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (!isTournamentActiveRound()) return;
      const cpuAction = resolveCpuTournamentResponse("stand", 0);
      saveBankroll();
      if (cpuAction.type === "raise") {
        state.pendingCallAmount = cpuAction.extra;
        messageEl.textContent = `${localize("stood")} / ${opponentTitle()}${localize("opponentRaised")} (+${cpuAction.extra}) / ${localize("callRequired")}`;
        render();
        return;
      }
      messageEl.textContent = `${localize("stood")} / ${opponentTitle()}${localize("opponentCalled")}`;
      advanceRound();
    });
  });

  callBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (!isTournamentActiveRound() || state.pendingCallAmount <= 0) return;
      const callAmount = state.pendingCallAmount;
      if (!callPendingRaiseIfNeeded()) return;
      messageEl.textContent = `${localize("called")} (+${callAmount})`;
      playChipSfx(0.07);
      advanceRound();
    });
  });

  foldBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      settleFoldLoss();
    });
  });

  ruleSelectEl?.addEventListener("change", () => {
    if (!state.gameOver || state.gameMode === "room") return;
    syncModesFromUi();
    enterStandby();
  });

  opponentSelectEl?.addEventListener("change", () => {
    if (!state.gameOver || state.gameMode === "room") return;
    syncModesFromUi();
    enterStandby();
  });

  cpuCountSelectEl?.addEventListener("change", () => {
    if (!state.gameOver || state.gameMode === "room") return;
    syncModesFromUi();
    enterStandby();
  });

  cpuStyleSelectEl?.addEventListener("change", () => {
    if (!state.gameOver || state.gameMode === "room") return;
    syncModesFromUi();
    enterStandby();
  });

  sfxSelectEl?.addEventListener("change", () => {
    state.sfxEnabled = sfxSelectEl.value !== "off";
    saveSfxEnabled();
    if (state.sfxEnabled) {
      playChipSfx(0.04);
    }
    render();
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    if (state.gameMode === "room") {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });

  enterStandby();
  state.bankroll = loadBankroll();
  state.stats = loadStats();
  state.sfxEnabled = loadSfxEnabled();
  state.currentBet = clampBet(MIN_BET);
  render();

  return {
    startNewGame: ({ fromRemote = false } = {}) => {
      startNewGame({ fromRemote });
    },
    enterStandby,
    stop: () => {},
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.roomRole = roomRole === "host" ? "host" : roomRole === "guest" ? "guest" : "spectator";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      state.roomLocked = false;
      state.roomLockMessage = "";
      enterStandby();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomRole = null;
      state.roomLocked = false;
      state.roomLockMessage = "";
      syncModesFromUi();
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      enterStandby();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message || "";
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || localize("waitingRoom");
        setOverlay(state.roomLockMessage || localize("waitingRoom"));
      } else if (state.phase === "standby") {
        setOverlay("GAME STARTで開始");
      } else {
        setOverlay("");
      }
      render();
    },
    applyRemoteMove: () => {},
    getSnapshot: () => ({
      ruleMode: state.ruleMode,
      opponentMode: state.opponentMode,
      cpuCount: state.cpuCount,
      activeCpuCount: state.activeCpuCount,
      gameMode: state.gameMode,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      deck: cloneCards(state.deck),
      bankroll: state.bankroll,
      currentBet: state.currentBet,
      activeWager: state.activeWager,
      pendingCallAmount: state.pendingCallAmount,
      stats: {
        wins: state.stats.wins,
        games: state.stats.games,
        netProfit: state.stats.netProfit,
      },
      playerCards: cloneCards(state.playerCards),
      cpuCards: cloneCards(state.cpuCards),
      extraCpuCards: state.extraCpuCards.map((hand) => cloneCards(hand)),
      community: cloneCards(state.community),
      heldIndexes: [...state.heldIndexes],
      phase: state.phase,
      gameOver: state.gameOver,
      playerResult: state.playerResult,
      cpuResult: state.cpuResult,
      showdownResultType: state.showdownResultType,
      showdownWinnerSide: state.showdownWinnerSide,
      showdownResultDetail: state.showdownResultDetail,
      message: messageEl?.textContent || "",
      overlay: overlayEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot) return;
      state.ruleMode = snapshot.ruleMode === "draw5" ? "draw5" : "tournament";
      state.opponentMode = snapshot.opponentMode === "dealer" ? "dealer" : "cpu";
      state.cpuCount = Number(snapshot.cpuCount) === 2 || Number(snapshot.cpuCount) === 3 ? Number(snapshot.cpuCount) : 1;
      state.activeCpuCount = Number.isFinite(Number(snapshot.activeCpuCount))
        ? Math.max(1, Math.min(3, Math.floor(Number(snapshot.activeCpuCount))))
        : state.opponentMode === "dealer"
          ? 1
          : state.cpuCount;
      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = snapshot.roomLockMessage || "";
      state.deck = Array.isArray(snapshot.deck) ? cloneCards(snapshot.deck) : [];
      state.bankroll = Number.isFinite(Number(snapshot.bankroll)) ? Math.max(0, Math.floor(Number(snapshot.bankroll))) : loadBankroll();
      state.currentBet = Number.isFinite(Number(snapshot.currentBet)) ? Math.max(MIN_BET, Math.floor(Number(snapshot.currentBet))) : MIN_BET;
      state.activeWager = Number.isFinite(Number(snapshot.activeWager)) ? Math.max(0, Math.floor(Number(snapshot.activeWager))) : 0;
      state.pendingCallAmount = Number.isFinite(Number(snapshot.pendingCallAmount)) ? Math.max(0, Math.floor(Number(snapshot.pendingCallAmount))) : 0;
      state.stats = {
        wins: Number.isFinite(Number(snapshot?.stats?.wins)) ? Math.max(0, Math.floor(Number(snapshot.stats.wins))) : loadStats().wins,
        games: Number.isFinite(Number(snapshot?.stats?.games)) ? Math.max(0, Math.floor(Number(snapshot.stats.games))) : loadStats().games,
        netProfit: Number.isFinite(Number(snapshot?.stats?.netProfit)) ? Math.floor(Number(snapshot.stats.netProfit)) : loadStats().netProfit,
      };
      state.playerCards = Array.isArray(snapshot.playerCards) ? cloneCards(snapshot.playerCards) : [];
      state.cpuCards = Array.isArray(snapshot.cpuCards) ? cloneCards(snapshot.cpuCards) : [];
      state.extraCpuCards = Array.isArray(snapshot.extraCpuCards)
        ? snapshot.extraCpuCards.map((hand) => (Array.isArray(hand) ? cloneCards(hand) : [])).slice(0, 2)
        : [];
      state.community = Array.isArray(snapshot.community) ? cloneCards(snapshot.community) : [];
      state.heldIndexes = new Set(Array.isArray(snapshot.heldIndexes) ? snapshot.heldIndexes : []);
      state.phase =
        snapshot.phase === "betting" ||
        snapshot.phase === "preflop" ||
        snapshot.phase === "flop" ||
        snapshot.phase === "turn" ||
        snapshot.phase === "river" ||
        snapshot.phase === "showdown" ||
        snapshot.phase === "draw-hold" ||
        snapshot.phase === "draw-wait" ||
        snapshot.phase === "draw-ready" ||
        snapshot.phase === "draw-showdown"
          ? snapshot.phase
          : "standby";
      state.gameOver = Boolean(snapshot.gameOver);
      state.playerResult = snapshot.playerResult || null;
      state.cpuResult = snapshot.cpuResult || null;
      state.showdownResultType =
        snapshot.showdownResultType === "win" || snapshot.showdownResultType === "lose" || snapshot.showdownResultType === "draw"
          ? snapshot.showdownResultType
          : "";
      state.showdownWinnerSide =
        snapshot.showdownWinnerSide === "player" || snapshot.showdownWinnerSide === "opponent" || snapshot.showdownWinnerSide === "draw"
          ? snapshot.showdownWinnerSide
          : "";
      state.showdownResultDetail = typeof snapshot.showdownResultDetail === "string" ? snapshot.showdownResultDetail : "";
      if (typeof snapshot.message === "string") {
        messageEl.textContent = snapshot.message;
      }
      if (typeof snapshot.overlay === "string") {
        setOverlay(snapshot.overlay);
      }
      state.currentBet = clampBet(state.currentBet);
      saveBankroll();
      saveStats();
      render();
    },
    onSaveDataScopeChanged: () => {
      state.bankroll = loadBankroll();
      state.stats = loadStats();
      state.currentBet = clampBet(state.currentBet);
      state.raiseAmount = clampRaiseAmount(state.raiseAmount);
      render();
    },
  };
}
