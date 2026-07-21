const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};
const RED_SUITS = new Set(["H", "D"]);
const CPU_THINK_MS = 420;

function rankLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

function appendCardFace(container, card, { compact = false, variant = "hand" } = {}) {
  const rank = rankLabel(card.rank);
  const suit = SUIT_SYMBOL[card.suit];

  container.classList.add("sevens-playing-card", RED_SUITS.has(card.suit) ? "red" : "black");
  if (compact) container.classList.add("compact");
  if (variant === "board") {
    container.classList.add("sevens-board-card");
  } else {
    container.classList.add("sevens-hand-face");
  }

  const cornerTop = document.createElement("span");
  cornerTop.className = "sevens-card-corner top";
  cornerTop.textContent = `${rank}${suit}`;

  const center = document.createElement("span");
  center.className = "sevens-card-center";
  center.textContent = suit;

  const cornerBottom = document.createElement("span");
  cornerBottom.className = "sevens-card-corner bottom";
  cornerBottom.textContent = `${rank}${suit}`;

  container.append(cornerTop, center, cornerBottom);
}

function createDeck() {
  const deck = [];
  let id = 1;
  SUITS.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ id: `s${id}`, suit, rank });
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

function suitOrder(suit) {
  if (suit === "S") return 0;
  if (suit === "H") return 1;
  if (suit === "D") return 2;
  return 3;
}

function sortHand(hand) {
  hand.sort((a, b) => {
    const suitDiff = suitOrder(a.suit) - suitOrder(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return a.rank - b.rank;
  });
}

function cloneCard(card) {
  return { ...card };
}

function cloneHands(hands) {
  return hands.map((hand) => hand.map((card) => cloneCard(card)));
}

function cloneTable(table) {
  return {
    S: { ...table.S },
    H: { ...table.H },
    D: { ...table.D },
    C: { ...table.C },
  };
}

export function initSevens(options = {}) {
  const modeSelectEl = document.getElementById("sevensModeSelect");
  const turnTextEl = document.getElementById("sevensTurnText");
  const p1CountEl = document.getElementById("sevensP1Count");
  const p2CountEl = document.getElementById("sevensP2Count");
  const passTextEl = document.getElementById("sevensPassText");
  const boardEl = document.getElementById("sevensBoard");
  const handTitleEl = document.getElementById("sevensHandTitle");
  const opponentHandEl = document.getElementById("sevensOpponentHand");
  const playerHandEl = document.getElementById("sevensPlayerHand");
  const overlayEl = document.getElementById("sevensOverlay");
  const messageEl = document.getElementById("sevensMessage");
  const startBtn = document.getElementById("sevensStartBtn");
  const passBtn = document.getElementById("sevensPassBtn");
  const menuBtn = document.getElementById("sevensMenuBtn");

  const state = {
    hands: [[], []],
    table: {
      S: { low: null, high: null },
      H: { low: null, high: null },
      D: { low: null, high: null },
      C: { low: null, high: null },
    },
    currentPlayer: 0,
    playMode: "cpu",
    gameMode: "local",
    cpuPlayer: 1,
    gameOver: true,
    passCount: [0, 0],
    passStreak: 0,
    cpuTimerId: null,
    roomLocked: false,
    roomLockMessage: "",
  };

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

  function isPlayable(card) {
    const range = state.table[card.suit];
    if (range.low === null || range.high === null) {
      return card.rank === 7;
    }
    return card.rank === range.low - 1 || card.rank === range.high + 1;
  }

  function playableCardsFor(playerIndex) {
    const hand = state.hands[playerIndex] || [];
    return hand.filter((card) => isPlayable(card));
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

  function updateHud() {
    turnTextEl.textContent = currentTurnLabel();
    p1CountEl.textContent = String(state.hands[0].length);
    p2CountEl.textContent = String(state.hands[1].length);
    passTextEl.textContent = `${state.passCount[0]} / ${state.passCount[1]}`;

    if (modeSelectEl) {
      modeSelectEl.value = state.playMode;
      modeSelectEl.disabled = state.gameMode === "room" || !state.gameOver;
    }

    if (startBtn) {
      startBtn.disabled = state.gameMode === "room";
    }
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    SUITS.forEach((suit) => {
      const row = document.createElement("div");
      row.className = "sevens-suit-row";

      const suitLabel = document.createElement("div");
      suitLabel.className = `sevens-suit-label ${RED_SUITS.has(suit) ? "red" : ""}`;
      suitLabel.textContent = SUIT_SYMBOL[suit];
      row.appendChild(suitLabel);

      for (let rank = 1; rank <= 13; rank += 1) {
        const slot = document.createElement("div");
        slot.className = "sevens-slot";

        const range = state.table[suit];
        const isOpen = range.low !== null && range.high !== null;
        const played = isOpen && rank >= range.low && rank <= range.high;

        if (played) {
          slot.classList.add("played");
          const cardFace = document.createElement("div");
          appendCardFace(cardFace, { suit, rank }, { compact: true, variant: "board" });
          slot.appendChild(cardFace);
        } else if (rank === 7 && !isOpen) {
          slot.classList.add("anchor");
          const rankText = document.createElement("span");
          rankText.className = "sevens-anchor-rank";
          rankText.textContent = "7";
          slot.appendChild(rankText);
        } else {
          slot.textContent = "-";
        }

        row.appendChild(slot);
      }

      boardEl.appendChild(row);
    });
  }

  function renderOpponentHand() {
    opponentHandEl.innerHTML = "";
    const count = state.hands[1 - state.currentPlayer].length;

    const summary = document.createElement("div");
    summary.className = "sevens-opponent-summary";
    if (isCpuMode()) {
      summary.textContent = `CPU HAND: ${count}`;
    } else {
      summary.textContent = `P${((state.currentPlayer + 1) % 2) + 1} HAND: ${count}`;
    }

    const stack = document.createElement("div");
    stack.className = "sevens-opponent-stack";

    const stackCards = Math.max(1, Math.min(5, count));
    for (let i = 0; i < stackCards; i += 1) {
      const card = document.createElement("div");
      card.className = "sevens-opponent-card";
      card.style.setProperty("--stack-index", String(i));
      stack.appendChild(card);
    }

    if (count > stackCards) {
      const more = document.createElement("span");
      more.className = "sevens-opponent-more";
      more.textContent = `+${count - stackCards}`;
      stack.appendChild(more);
    }

    opponentHandEl.append(summary, stack);
  }

  function renderPlayerHand() {
    playerHandEl.innerHTML = "";

    const hand = state.hands[state.currentPlayer] || [];
    const totalCards = hand.length;
    const canControl = !state.gameOver && !state.roomLocked && isLocalPlayersTurn();
    const centerIndex = (totalCards - 1) / 2;

    const fanStrength = totalCards <= 8 ? 1.28 : Math.max(0.56, 10 / Math.max(11, totalCards));
    const overlap = totalCards <= 8 ? 0 : Math.min(12, (totalCards - 8) * 2);
    const mobileOverlap = Math.max(0, overlap - 2);
    playerHandEl.style.setProperty("--sevens-fan-strength", fanStrength.toFixed(3));
    playerHandEl.style.setProperty("--sevens-overlap", `${overlap.toFixed(1)}px`);
    playerHandEl.style.setProperty("--sevens-overlap-mobile", `${mobileOverlap.toFixed(1)}px`);

    hand.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sevens-hand-card";
      if (RED_SUITS.has(card.suit)) button.classList.add("red");
      const distance = Math.abs(index - centerIndex);
      const lift = Math.round(-distance * 1.8);
      button.style.setProperty("--fan-distance", distance.toFixed(2));
      button.style.setProperty("--fan-lift", `${lift}px`);
      button.style.setProperty("--card-index", String(index));
      button.style.setProperty("--card-total", String(totalCards));

      const playable = isPlayable(card) && canControl;
      if (playable) button.classList.add("playable");

      appendCardFace(button, card, { variant: "hand" });
      button.disabled = !playable;
      button.addEventListener("click", () => playCardById(card.id, { isRemote: false }));
      playerHandEl.appendChild(button);
    });

    if (passBtn) {
      passBtn.disabled = !canControl || playableCardsFor(state.currentPlayer).length > 0;
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
    renderBoard();
    renderOpponentHand();
    renderPlayerHand();
  }

  function endGame(winnerIndex) {
    state.gameOver = true;
    clearCpuTimer();

    const outcomeText = outcomeTextForWinner(winnerIndex);
    messageEl.textContent = outcomeText;
    setOverlay(outcomeText);

    render();
  }

  function canAnyPlayerMove() {
    return playableCardsFor(0).length > 0 || playableCardsFor(1).length > 0;
  }

  function advanceTurn() {
    if (state.hands[state.currentPlayer].length === 0) {
      endGame(state.currentPlayer);
      return;
    }

    state.currentPlayer = (state.currentPlayer + 1) % 2;

    if (state.hands[state.currentPlayer].length === 0) {
      endGame(state.currentPlayer);
      return;
    }

    if (state.passStreak >= 2 && !canAnyPlayerMove()) {
      state.gameOver = true;
      messageEl.textContent = "引き分けです";
      setOverlay("DRAW");
      render();
      return;
    }

    if (isCpuMode()) {
      messageEl.textContent = state.currentPlayer === 0 ? "あなたの手番です" : "CPUの手番です";
    } else {
      messageEl.textContent = `PLAYER ${state.currentPlayer + 1} の手番です`;
    }

    render();
    maybeRunCpu();
  }

  function applyCardToTable(card) {
    const range = state.table[card.suit];

    if (range.low === null || range.high === null) {
      range.low = 7;
      range.high = 7;
      return;
    }

    if (card.rank < range.low) {
      range.low = card.rank;
    } else if (card.rank > range.high) {
      range.high = card.rank;
    }
  }

  function removeCardFromHand(playerIndex, cardId) {
    const hand = state.hands[playerIndex];
    const cardIndex = hand.findIndex((item) => item.id === cardId);
    if (cardIndex < 0) return null;
    return hand.splice(cardIndex, 1)[0] || null;
  }

  function playCardById(cardId, { isRemote = false, isCpu = false } = {}) {
    if (state.gameOver || state.roomLocked) return;
    if (!isRemote && !isCpu && !isLocalPlayersTurn()) return;

    const card = removeCardFromHand(state.currentPlayer, cardId);
    if (!card) return;

    if (!isPlayable(card)) {
      state.hands[state.currentPlayer].push(card);
      sortHand(state.hands[state.currentPlayer]);
      return;
    }

    applyCardToTable(card);
    state.passStreak = 0;

    if (state.gameMode === "room" && !isRemote) {
      options.onRoomMove?.({ type: "play", cardId });
    }

    advanceTurn();
  }

  function passTurn({ isRemote = false, isCpu = false } = {}) {
    if (state.gameOver || state.roomLocked) return;
    if (!isRemote && !isCpu && !isLocalPlayersTurn()) return;

    const playable = playableCardsFor(state.currentPlayer);
    if (playable.length > 0) return;

    state.passCount[state.currentPlayer] += 1;
    state.passStreak += 1;

    if (state.gameMode === "room" && !isRemote) {
      options.onRoomMove?.({ type: "pass" });
    }

    advanceTurn();
  }

  function chooseCpuCard() {
    const playable = playableCardsFor(state.cpuPlayer);
    if (playable.length === 0) return null;

    playable.sort((a, b) => {
      const openA = a.rank === 7 ? 1 : 0;
      const openB = b.rank === 7 ? 1 : 0;
      if (openA !== openB) return openB - openA;

      const edgeA = a.rank === 1 || a.rank === 13 ? 1 : 0;
      const edgeB = b.rank === 1 || b.rank === 13 ? 1 : 0;
      if (edgeA !== edgeB) return edgeB - edgeA;

      const suitDiff = suitOrder(a.suit) - suitOrder(b.suit);
      if (suitDiff !== 0) return suitDiff;
      return a.rank - b.rank;
    });

    return playable[0];
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

    const deck = shuffle(createDeck());
    state.hands = [[], []];

    deck.forEach((card, index) => {
      state.hands[index % 2].push(card);
    });

    sortHand(state.hands[0]);
    sortHand(state.hands[1]);

    state.table = {
      S: { low: null, high: null },
      H: { low: null, high: null },
      D: { low: null, high: null },
      C: { low: null, high: null },
    };
    state.passCount = [0, 0];
    state.passStreak = 0;
    state.gameOver = false;
    state.roomLocked = false;
    state.roomLockMessage = "";

    const startPlayer = state.hands[0].some((card) => card.suit === "D" && card.rank === 7) ? 0 : 1;
    state.currentPlayer = startPlayer;

    const starterCard = state.hands[startPlayer].find((card) => card.suit === "D" && card.rank === 7);
    if (starterCard) {
      playCardById(starterCard.id, { isRemote: true });
    }

    if (!state.gameOver) {
      setOverlay("");
      messageEl.textContent = isCpuMode()
        ? state.currentPlayer === 0
          ? "あなたの手番です"
          : "CPUの手番です"
        : `PLAYER ${state.currentPlayer + 1} の手番です`;
      render();
      maybeRunCpu();
    }
  }

  function enterStandby() {
    clearCpuTimer();
    state.hands = [[], []];
    state.table = {
      S: { low: null, high: null },
      H: { low: null, high: null },
      D: { low: null, high: null },
      C: { low: null, high: null },
    };
    state.currentPlayer = 0;
    state.passCount = [0, 0];
    state.passStreak = 0;
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

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => {
      if (!fromRemote) {
        setupNewGame();
        return;
      }
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
      table: cloneTable(state.table),
      currentPlayer: state.currentPlayer,
      playMode: state.playMode,
      gameMode: state.gameMode,
      gameOver: state.gameOver,
      passCount: [...state.passCount],
      passStreak: state.passStreak,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      message: messageEl.textContent,
      overlay: overlayEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot) return;
      clearCpuTimer();

      state.hands = Array.isArray(snapshot.hands) ? cloneHands(snapshot.hands) : [[], []];
      state.table = snapshot.table ? cloneTable(snapshot.table) : cloneTable({
        S: { low: null, high: null },
        H: { low: null, high: null },
        D: { low: null, high: null },
        C: { low: null, high: null },
      });
      state.currentPlayer = snapshot.currentPlayer === 1 ? 1 : 0;
      state.playMode = snapshot.playMode === "local" ? "local" : "cpu";
      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.gameOver = Boolean(snapshot.gameOver);
      state.passCount = Array.isArray(snapshot.passCount) ? [snapshot.passCount[0] || 0, snapshot.passCount[1] || 0] : [0, 0];
      state.passStreak = Number.isFinite(snapshot.passStreak) ? snapshot.passStreak : 0;
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

      render();
      maybeRunCpu();
    },
  };
}
