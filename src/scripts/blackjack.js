import { readStoredAuth, scopedStorageKey } from "./userScopedStorage.js";

const CASINO_SHARED_BANK_STORAGE_KEY = "neon-casino-shared-bank-v1";
const BLACKJACK_LEGACY_BANK_STORAGE_KEY = "neon-casino-blackjack-bank-v1";
const BLACKJACK_STATS_STORAGE_KEY = "neon-casino-blackjack-stats-v1";
const DEFAULT_BANKROLL = 1000;
const MIN_BET = 10;
const BET_STEP = 10;

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

function createDeck() {
  const deck = [];
  let id = 1;
  SUITS.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ id: `b${id}`, suit, rank });
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

function cardLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

function cardBaseValue(rank) {
  if (rank === 1) return 11;
  if (rank >= 10) return 10;
  return rank;
}

function handValue(cards) {
  let total = 0;
  let aces = 0;
  cards.forEach((card) => {
    total += cardBaseValue(card.rank);
    if (card.rank === 1) aces += 1;
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function isBlackjack(cards) {
  return Array.isArray(cards) && cards.length === 2 && handValue(cards) === 21;
}

function clampBet(value, bankroll) {
  const max = Math.max(MIN_BET, Math.floor(bankroll / BET_STEP) * BET_STEP || MIN_BET);
  return Math.max(MIN_BET, Math.min(max, Math.floor(value / BET_STEP) * BET_STEP));
}

export function initBlackjack(options = {}) {
  const langSelectEl = document.getElementById("langSelect");
  const dealerHandEl = document.getElementById("blackjackDealerHand");
  const playerHandEl = document.getElementById("blackjackPlayerHand");
  const dealerTotalEl = document.getElementById("blackjackDealerTotal");
  const playerTotalEl = document.getElementById("blackjackPlayerTotal");
  const bankEl = document.getElementById("blackjackBankText");
  const betEl = document.getElementById("blackjackBetText");
  const wagerEl = document.getElementById("blackjackWagerText");
  const betRangeEl = document.getElementById("blackjackBetRangeText");
  const statsEl = document.getElementById("blackjackStatsText");
  const overlayEl = document.getElementById("blackjackOverlay");
  const messageEl = document.getElementById("blackjackMessage");
  const resultEl = document.getElementById("blackjackResultText");

  const startBtn = document.getElementById("blackjackStartBtn");
  const remakeBtn = document.getElementById("blackjackRemakeBtn");
  const hitBtn = document.getElementById("blackjackHitBtn");
  const standBtn = document.getElementById("blackjackStandBtn");
  const doubleBtn = document.getElementById("blackjackDoubleBtn");
  const betMinusBtn = document.getElementById("blackjackBetMinusBtn");
  const betPlusBtn = document.getElementById("blackjackBetPlusBtn");
  const allInBtn = document.getElementById("blackjackAllInBtn");
  const menuBtn = document.getElementById("blackjackMenuBtn");

  const state = {
    gameMode: "local",
    roomRole: null,
    roomLocked: false,
    roomLockMessage: "",
    deck: [],
    dealer: [],
    player: [],
    phase: "standby",
    bankroll: loadBankroll(),
    bet: MIN_BET,
    activeBet: 0,
    stats: loadStats(),
  };

  state.bet = clampBet(MIN_BET, state.bankroll);

  function lang() {
    return langSelectEl?.value === "ko" ? "ko" : "ja";
  }

  function t(key) {
    const dict = {
      ja: {
        waitingStart: "GAME STARTを押してください",
        bettingStart: "ベット額を調整して GAME START で配札します",
        waitingRoom: "対戦相手を待っています...",
        roomUnsupported: "このゲームはルーム対戦に未対応です",
        playerTurn: "あなたのターンです: HIT / STAND / DOUBLE",
        dealerTurn: "ディーラーのターン...",
        bust: "バースト! あなたの負け",
        win: "あなたの勝ち!",
        lose: "ディーラーの勝ち",
        push: "引き分け (プッシュ)",
        blackjackWin: "ブラックジャック! 1.5倍配当",
        noChip: "チップが不足しています",
        allInReady: "オールインを設定しました",
        doubled: "ダブルダウン!",
        menuConfirm: "ゲーム一覧に戻りますか？",
      },
      ko: {
        waitingStart: "GAME START를 눌러주세요",
        bettingStart: "베팅 금액을 조정하고 GAME START로 배분을 시작하세요",
        waitingRoom: "상대를 기다리는 중...",
        roomUnsupported: "이 게임은 룸 대전을 지원하지 않습니다",
        playerTurn: "당신의 차례입니다: HIT / STAND / DOUBLE",
        dealerTurn: "딜러 턴 진행 중...",
        bust: "버스트! 당신의 패배",
        win: "당신 승리!",
        lose: "딜러 승리",
        push: "무승부 (푸시)",
        blackjackWin: "블랙잭! 1.5배 배당",
        noChip: "칩이 부족합니다",
        allInReady: "올인 금액으로 설정했습니다",
        doubled: "더블다운!",
        menuConfirm: "게임 목록으로 돌아갈까요?",
      },
    };
    return dict[lang()][key] || dict.ja[key] || key;
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

    const scopedBankKey = scopedKey(CASINO_SHARED_BANK_STORAGE_KEY);
    let rawStored = localStorage.getItem(scopedBankKey);
    if (!rawStored) {
      // Migrate old blackjack-only bankroll to new shared bankroll per account.
      const legacy = localStorage.getItem(BLACKJACK_LEGACY_BANK_STORAGE_KEY);
      if (legacy != null) {
        rawStored = legacy;
        localStorage.setItem(scopedBankKey, legacy);
      }
    }
    const raw = Number(rawStored);
    if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_BANKROLL;
    return Math.floor(raw);
  }

  function saveBankroll() {
    const normalized = Math.max(0, Math.floor(state.bankroll));
    try {
      if (typeof options.onCasinoBankSave === "function") {
        options.onCasinoBankSave(normalized);
      }
    } catch {
      // Ignore callback failures and keep local fallback.
    }
    localStorage.setItem(scopedKey(CASINO_SHARED_BANK_STORAGE_KEY), String(normalized));
  }

  function loadStats() {
    try {
      const parsed = JSON.parse(localStorage.getItem(scopedKey(BLACKJACK_STATS_STORAGE_KEY)) || "null");
      return {
        wins: Number.isFinite(Number(parsed?.wins)) ? Math.max(0, Math.floor(Number(parsed.wins))) : 0,
        games: Number.isFinite(Number(parsed?.games)) ? Math.max(0, Math.floor(Number(parsed.games))) : 0,
        net: Number.isFinite(Number(parsed?.net)) ? Math.floor(Number(parsed.net)) : 0,
      };
    } catch {
      return { wins: 0, games: 0, net: 0 };
    }
  }

  function saveStats() {
    localStorage.setItem(scopedKey(BLACKJACK_STATS_STORAGE_KEY), JSON.stringify(state.stats));
  }

  function draw() {
    if (state.deck.length === 0) {
      state.deck = shuffle(createDeck());
    }
    return state.deck.pop();
  }

  function updateHud() {
    const canLocalControl = state.gameMode !== "room" || state.roomRole === "host";
    const maxBet = Math.max(MIN_BET, Math.floor(state.bankroll / BET_STEP) * BET_STEP || MIN_BET);
    bankEl.textContent = String(state.bankroll);
    betEl.textContent = String(state.bet);
    if (wagerEl) wagerEl.textContent = String(state.activeBet);
    if (betRangeEl) betRangeEl.textContent = `${MIN_BET} - ${maxBet}`;
    statsEl.textContent = `W${state.stats.wins} / G${state.stats.games} / ${state.stats.net >= 0 ? "+" : ""}${state.stats.net}`;

    const revealDealer = state.phase === "result";
    const dealerVisibleCards = revealDealer
      ? state.dealer
      : state.dealer.map((card, index) => (index === 0 ? card : { hidden: true, id: "hidden" }));
    renderHand(dealerHandEl, dealerVisibleCards, revealDealer);
    renderHand(playerHandEl, state.player, true);

    dealerTotalEl.textContent = revealDealer
      ? String(handValue(state.dealer))
      : state.dealer.length > 0
        ? `${cardBaseValue(state.dealer[0].rank)}+?`
        : "-";
    playerTotalEl.textContent = state.player.length > 0 ? String(handValue(state.player)) : "-";

    const inRound = state.phase === "player";
    const inBetting = state.phase === "betting";
    const canDouble = inRound && state.player.length === 2 && state.bankroll >= state.activeBet;

    hitBtn.disabled = !inRound || state.roomLocked || !canLocalControl;
    standBtn.disabled = !inRound || state.roomLocked || !canLocalControl;
    doubleBtn.disabled = !canDouble || state.roomLocked || !canLocalControl;
    startBtn.disabled = (state.phase !== "standby" && !inBetting) || state.roomLocked || !canLocalControl;
    if (startBtn) {
      startBtn.textContent = inBetting ? "BET START" : "GAME START";
    }
    betMinusBtn.disabled = (state.phase !== "standby" && !inBetting) || state.roomLocked || !canLocalControl;
    betPlusBtn.disabled = (state.phase !== "standby" && !inBetting) || state.roomLocked || !canLocalControl;
    if (allInBtn) allInBtn.disabled = (state.phase !== "standby" && !inBetting) || state.roomLocked || !canLocalControl;
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

  function renderHand(target, cards, reveal) {
    target.innerHTML = "";
    cards.forEach((card) => {
      const cardEl = document.createElement("div");
      cardEl.className = "blackjack-card";
      if (card.hidden && !reveal) {
        cardEl.classList.add("back");
        cardEl.textContent = "?";
        target.append(cardEl);
        return;
      }
      const rank = cardLabel(card.rank);
      const suit = SUIT_SYMBOL[card.suit] || "";
      cardEl.textContent = `${rank}${suit}`;
      if (card.suit === "H" || card.suit === "D") {
        cardEl.classList.add("red");
      }
      target.append(cardEl);
    });
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

  function endRound(resultType) {
    state.phase = "result";
    const wager = state.activeBet;

    if (resultType === "blackjack") {
      const payout = Math.floor(wager * 2.5);
      state.bankroll += payout;
      state.stats.wins += 1;
      state.stats.games += 1;
      state.stats.net += Math.floor(wager * 1.5);
      resultEl.textContent = t("blackjackWin");
      messageEl.textContent = t("blackjackWin");
    } else if (resultType === "win") {
      state.bankroll += wager * 2;
      state.stats.wins += 1;
      state.stats.games += 1;
      state.stats.net += wager;
      resultEl.textContent = t("win");
      messageEl.textContent = t("win");
    } else if (resultType === "push") {
      state.bankroll += wager;
      state.stats.games += 1;
      resultEl.textContent = t("push");
      messageEl.textContent = t("push");
    } else {
      state.stats.games += 1;
      state.stats.net -= wager;
      resultEl.textContent = state.phase === "result" && handValue(state.player) > 21 ? t("bust") : t("lose");
      messageEl.textContent = resultEl.textContent;
    }

    if (state.bankroll <= 0) {
      state.bankroll = DEFAULT_BANKROLL;
      state.bet = MIN_BET;
    } else {
      state.bet = clampBet(state.bet, state.bankroll);
    }

    saveBankroll();
    saveStats();
    setOverlay(resultEl.textContent);
    updateHud();
  }

  function dealerPlayAndJudge() {
    messageEl.textContent = t("dealerTurn");
    while (handValue(state.dealer) < 17) {
      state.dealer.push(draw());
    }

    const playerScore = handValue(state.player);
    const dealerScore = handValue(state.dealer);

    if (dealerScore > 21) {
      endRound("win");
      return;
    }
    if (playerScore > dealerScore) {
      endRound("win");
      return;
    }
    if (playerScore < dealerScore) {
      endRound("lose");
      return;
    }
    endRound("push");
  }

  function enterBetting() {
    if (state.roomLocked) {
      messageEl.textContent = state.roomLockMessage || t("waitingRoom");
      return;
    }
    state.phase = "betting";
    state.deck = [];
    state.player = [];
    state.dealer = [];
    state.activeBet = 0;
    resultEl.textContent = "-";
    messageEl.textContent = t("bettingStart");
    setOverlay("");
    updateHud();
  }

  function startRound() {
    if (state.roomLocked || state.phase !== "betting") {
      messageEl.textContent = state.roomLockMessage || t("waitingRoom");
      return;
    }
    if (state.bankroll < state.bet) {
      messageEl.textContent = t("noChip");
      return;
    }

    state.activeBet = state.bet;
    state.bankroll -= state.bet;
    state.deck = shuffle(createDeck());
    state.player = [draw(), draw()];
    state.dealer = [draw(), draw()];
    state.phase = "player";
    resultEl.textContent = "-";

    const playerBj = isBlackjack(state.player);
    const dealerBj = isBlackjack(state.dealer);

    if (playerBj && dealerBj) {
      endRound("push");
      return;
    }
    if (playerBj) {
      endRound("blackjack");
      return;
    }
    if (dealerBj) {
      endRound("lose");
      return;
    }

    messageEl.textContent = t("playerTurn");
    setOverlay("");
    updateHud();
  }

  function hit() {
    if (state.phase !== "player") return;
    state.player.push(draw());
    if (handValue(state.player) > 21) {
      endRound("lose");
      return;
    }
    updateHud();
  }

  function stand() {
    if (state.phase !== "player") return;
    dealerPlayAndJudge();
  }

  function doubleDown() {
    if (state.phase !== "player") return;
    if (state.player.length !== 2 || state.bankroll < state.activeBet) {
      messageEl.textContent = t("noChip");
      return;
    }
    state.bankroll -= state.activeBet;
    state.activeBet *= 2;
    state.player.push(draw());
    messageEl.textContent = t("doubled");
    if (handValue(state.player) > 21) {
      endRound("lose");
      return;
    }
    dealerPlayAndJudge();
  }

  function enterStandby() {
    state.phase = "standby";
    state.deck = [];
    state.player = [];
    state.dealer = [];
    state.activeBet = 0;
    resultEl.textContent = "-";
    messageEl.textContent = state.roomLocked ? state.roomLockMessage || t("waitingRoom") : t("waitingStart");
    setOverlay(state.roomLocked ? state.roomLockMessage || t("waitingRoom") : "");
    state.bet = clampBet(state.bet, state.bankroll);
    updateHud();
  }

  betMinusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (state.phase !== "standby" && state.phase !== "betting") return;
      state.bet = clampBet(state.bet - BET_STEP, state.bankroll);
      updateHud();
    });
  });

  betPlusBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (state.phase !== "standby" && state.phase !== "betting") return;
      state.bet = clampBet(state.bet + BET_STEP, state.bankroll);
      updateHud();
    });
  });

  allInBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (state.phase !== "standby" && state.phase !== "betting") return;
      state.bet = clampBet(state.bankroll, state.bankroll);
      messageEl.textContent = t("allInReady");
      updateHud();
    });
  });

  startBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      if (state.phase === "standby") {
        enterBetting();
        if (state.gameMode === "room") {
          options.onRoomNewGame?.();
        }
        return;
      }
      if (state.phase === "betting") {
        startRound();
      }
    });
  });
  hitBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      hit();
    });
  });
  standBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      stand();
    });
  });
  doubleBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      doubleDown();
    });
  });

  remakeBtn?.addEventListener("click", () => {
    runLocalAction(() => {
      enterBetting();
      if (state.gameMode === "room") {
        options.onRoomNewGame?.();
      }
    });
  });

  menuBtn?.addEventListener("click", () => {
    if (!window.confirm(t("menuConfirm"))) return;
    if (state.gameMode === "room") {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => {
      enterBetting();
      if (!fromRemote) {
        broadcastRoomSnapshot();
      }
    },
    enterStandby,
    stop: () => {},
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.roomRole = roomRole === "host" ? "host" : roomRole === "guest" ? "guest" : "spectator";
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      enterStandby();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomRole = null;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      enterStandby();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message || "";
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || t("waitingRoom");
        setOverlay(state.roomLockMessage || t("waitingRoom"));
      } else if (state.phase === "standby" || state.phase === "betting") {
        setOverlay("");
      }
      updateHud();
    },
    applyRemoteMove: () => {},
    getSnapshot: () => ({
      gameMode: state.gameMode,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      deck: [...state.deck],
      dealer: [...state.dealer],
      player: [...state.player],
      phase: state.phase,
      bankroll: state.bankroll,
      bet: state.bet,
      activeBet: state.activeBet,
      stats: { ...state.stats },
      message: messageEl?.textContent || "",
      overlay: overlayEl?.textContent || "",
      resultText: resultEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot) return;
      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = snapshot.roomLockMessage || "";
      state.deck = Array.isArray(snapshot.deck) ? [...snapshot.deck] : [];
      state.dealer = Array.isArray(snapshot.dealer) ? [...snapshot.dealer] : [];
      state.player = Array.isArray(snapshot.player) ? [...snapshot.player] : [];
      state.phase = snapshot.phase === "player" || snapshot.phase === "result" ? snapshot.phase : "standby";
      state.bankroll = Number.isFinite(Number(snapshot.bankroll)) ? Math.max(0, Math.floor(Number(snapshot.bankroll))) : loadBankroll();
      state.bet = Number.isFinite(Number(snapshot.bet)) ? Math.max(MIN_BET, Math.floor(Number(snapshot.bet))) : MIN_BET;
      state.activeBet = Number.isFinite(Number(snapshot.activeBet)) ? Math.max(0, Math.floor(Number(snapshot.activeBet))) : 0;
      state.stats = {
        wins: Number.isFinite(Number(snapshot?.stats?.wins)) ? Math.max(0, Math.floor(Number(snapshot.stats.wins))) : 0,
        games: Number.isFinite(Number(snapshot?.stats?.games)) ? Math.max(0, Math.floor(Number(snapshot.stats.games))) : 0,
        net: Number.isFinite(Number(snapshot?.stats?.net)) ? Math.floor(Number(snapshot.stats.net)) : 0,
      };
      if (messageEl) messageEl.textContent = snapshot.message || "";
      if (overlayEl) overlayEl.textContent = snapshot.overlay || "";
      if (resultEl) resultEl.textContent = snapshot.resultText || "-";
      updateHud();
    },
    onSaveDataScopeChanged: () => {
      state.bankroll = loadBankroll();
      state.stats = loadStats();
      state.bet = clampBet(state.bet, state.bankroll);
      if (state.phase === "standby" || state.phase === "betting") {
        state.activeBet = 0;
      }
      updateHud();
    },
  };
}
