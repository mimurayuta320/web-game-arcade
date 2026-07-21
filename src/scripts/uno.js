import { bindBackToMenuButton } from "./uiButtonHelpers.js";

const COLORS = ["red", "yellow", "green", "blue"];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function makeDeck() {
  const deck = [];

  COLORS.forEach((color) => {
    deck.push({ color, kind: "number", value: 0 });

    for (let n = 1; n <= 9; n += 1) {
      deck.push({ color, kind: "number", value: n });
      deck.push({ color, kind: "number", value: n });
    }

    ["skip", "reverse", "draw2"].forEach((action) => {
      deck.push({ color, kind: "action", value: action });
      deck.push({ color, kind: "action", value: action });
    });
  });

  for (let i = 0; i < 4; i += 1) {
    deck.push({ color: null, kind: "wild", value: "wild" });
    deck.push({ color: null, kind: "wild", value: "wild4" });
  }

  return shuffle(deck);
}

function cardLabel(card) {
  if (card.kind === "number") return String(card.value);
  if (card.value === "skip") return "SKIP";
  if (card.value === "reverse") return "REV";
  if (card.value === "draw2") return "+2";
  if (card.value === "wild") return "WILD";
  return "W+4";
}

function colorText(color) {
  if (color === "red") return "RED";
  if (color === "yellow") return "YELLOW";
  if (color === "green") return "GREEN";
  if (color === "blue") return "BLUE";
  return "-";
}

function nextPlayerIndex(current, direction) {
  return (current + direction + 2) % 2;
}

const COLOR_RANK = {
  red: 0,
  yellow: 1,
  green: 2,
  blue: 3,
  wild: 4,
};

const VALUE_RANK = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  skip: 10,
  reverse: 11,
  draw2: 12,
  wild: 13,
  wild4: 14,
};

function sortHand(hand) {
  hand.sort((a, b) => {
    const colorA = a.kind === "wild" ? "wild" : a.color;
    const colorB = b.kind === "wild" ? "wild" : b.color;
    const colorRankA = COLOR_RANK[colorA] ?? 99;
    const colorRankB = COLOR_RANK[colorB] ?? 99;
    if (colorRankA !== colorRankB) return colorRankA - colorRankB;

    const valueRankA = VALUE_RANK[a.value] ?? 99;
    const valueRankB = VALUE_RANK[b.value] ?? 99;
    return valueRankA - valueRankB;
  });
}

export function initUno(options = {}) {
  const turnTextEl = document.getElementById("unoTurnText");
  const colorTextEl = document.getElementById("unoColorText");
  const deckCountEl = document.getElementById("unoDeckCount");
  const p1CountEl = document.getElementById("unoP1Count");
  const p2CountEl = document.getElementById("unoP2Count");
  const resultTextEl = document.getElementById("unoResultText");
  const opponentHandEl = document.getElementById("unoOpponentHand");
  const playerHandEl = document.getElementById("unoPlayerHand");
  const discardTopEl = document.getElementById("unoDiscardTop");
  const messageEl = document.getElementById("unoMessage");
  const startBtn = document.getElementById("unoStartBtn");
  const drawBtn = document.getElementById("unoDrawBtn");
  const menuBtn = document.getElementById("unoMenuBtn");
  const modeSelect = document.getElementById("unoModeSelect");

  const state = {
    deck: [],
    discard: [],
    hands: [[], []],
    currentPlayer: 0,
    direction: 1,
    currentColor: null,
    started: false,
    gameOver: false,
    mode: "cpu",
    cpuTimeoutId: null,
    roomCode: null,
    roomRole: null,
    roomPlayerIndex: 0,
    roomLocked: false,
    roomLockMessage: "",
    resultText: "-",
  };

  function isCpuMode() {
    return state.mode === "cpu";
  }

  function isRoomMode() {
    return state.mode === "room";
  }

  function isCpuTurn() {
    return isCpuMode() && state.currentPlayer === 1;
  }

  function isLocalPlayersTurn() {
    if (isRoomMode()) return state.currentPlayer === state.roomPlayerIndex;
    return true;
  }

  function drawFromDeck() {
    if (state.deck.length > 0) return state.deck.pop();

    const top = state.discard.pop();
    if (!top || state.discard.length === 0) {
      if (top) state.discard.push(top);
      return null;
    }

    state.deck = shuffle([...state.discard]);
    state.discard = [top];
    return state.deck.pop() || null;
  }

  function canPlayCard(card) {
    if (!state.started || state.gameOver) return false;

    const top = state.discard[state.discard.length - 1];
    if (!top) return false;

    if (card.kind === "wild") return true;
    if (card.color === state.currentColor) return true;
    if (card.value === top.value) return true;
    return false;
  }

  function setDiscardVisual(card) {
    discardTopEl.textContent = cardLabel(card);
    discardTopEl.className = "uno-card-display";

    if (card.kind === "wild") {
      discardTopEl.classList.add("wild");
    } else if (state.currentColor) {
      discardTopEl.classList.add(state.currentColor);
    }
  }

  function updateHud() {
    turnTextEl.textContent = `PLAYER ${state.currentPlayer + 1}`;
    colorTextEl.textContent = colorText(state.currentColor);
    deckCountEl.textContent = String(state.deck.length);
    p1CountEl.textContent = String(state.hands[0].length);
    p2CountEl.textContent = String(state.hands[1].length);
    if (resultTextEl) resultTextEl.textContent = state.resultText;
  }

  function setResultText(text) {
    state.resultText = text;
    if (resultTextEl) resultTextEl.textContent = text;
  }

  function resultByMode(winnerIndex) {
    if (isRoomMode()) {
      return winnerIndex === state.roomPlayerIndex ? "WIN" : "LOSE";
    }
    if (isCpuMode()) {
      return winnerIndex === 0 ? "WIN" : "LOSE";
    }
    return winnerIndex === 0 ? "P1 WIN / P2 LOSE" : "P2 WIN / P1 LOSE";
  }

  function renderHands() {
    opponentHandEl.innerHTML = "";
    playerHandEl.innerHTML = "";

    const viewerIndex = isRoomMode() ? state.roomPlayerIndex : isCpuMode() ? 0 : state.currentPlayer;
    const oppIndex = nextPlayerIndex(viewerIndex, 1);
    const oppCount = state.hands[oppIndex].length;
    for (let i = 0; i < oppCount; i += 1) {
      const back = document.createElement("span");
      back.className = "uno-card-mini back";
      back.textContent = "UNO";
      opponentHandEl.appendChild(back);
    }

    state.hands[viewerIndex].forEach((card, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `uno-card ${card.kind === "wild" ? "wild" : card.color}`;
      btn.textContent = cardLabel(card);
      const canControl = !state.roomLocked && !isCpuTurn() && isLocalPlayersTurn();
      btn.disabled = !canControl || !canPlayCard(card);
      btn.addEventListener("click", () => playCard(index));
      playerHandEl.appendChild(btn);
    });
  }

  function render() {
    updateHud();

    const top = state.discard[state.discard.length - 1];
    if (top) {
      setDiscardVisual(top);
    } else {
      discardTopEl.textContent = "-";
      discardTopEl.className = "uno-card-display";
    }

    drawBtn.disabled = !state.started || state.gameOver || state.roomLocked || isCpuTurn() || !isLocalPlayersTurn();
    if (modeSelect) {
      modeSelect.disabled = isRoomMode();
    }
    renderHands();
  }

  function chooseBestColorForPlayer(playerIndex) {
    const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
    state.hands[playerIndex].forEach((card) => {
      if (card.color && counts[card.color] !== undefined) {
        counts[card.color] += 1;
      }
    });

    let best = "red";
    let max = -1;
    COLORS.forEach((color) => {
      if (counts[color] > max) {
        best = color;
        max = counts[color];
      }
    });
    return best;
  }

  function chooseColor(playerIndex) {
    if (isCpuMode() && playerIndex === 1) {
      return chooseBestColorForPlayer(playerIndex);
    }

    const raw = window.prompt("色を選択してください: red / yellow / green / blue", "red");
    const picked = String(raw || "red").trim().toLowerCase();
    if (COLORS.includes(picked)) return picked;
    return "red";
  }

  function advanceTurn(skip = false) {
    const steps = skip ? 2 : 1;
    for (let i = 0; i < steps; i += 1) {
      state.currentPlayer = nextPlayerIndex(state.currentPlayer, state.direction);
    }
  }

  function endAsWinner(playerIndex) {
    state.gameOver = true;
    setResultText(resultByMode(playerIndex));
    messageEl.textContent = `PLAYER ${playerIndex + 1} の勝ち!`;
    render();
  }

  function scheduleCpuTurn() {
    if (!isCpuTurn() || !state.started || state.gameOver) return;

    if (state.cpuTimeoutId) {
      clearTimeout(state.cpuTimeoutId);
      state.cpuTimeoutId = null;
    }

    state.cpuTimeoutId = window.setTimeout(() => {
      state.cpuTimeoutId = null;
      runCpuTurn();
    }, 480);
  }

  function playCard(handIndex, opts = {}) {
    const isRemote = Boolean(opts.isRemote);
    const selectedColor = opts.selectedColor ?? null;

    if (!state.started || state.gameOver) return;
    if (state.roomLocked) return;
    if (!isRemote && !isLocalPlayersTurn()) return;

    const actorIndex = state.currentPlayer;
    if (isCpuMode() && actorIndex === 0 && isCpuTurn()) return;

    const hand = state.hands[actorIndex];
    const card = hand[handIndex];
    if (!card || !canPlayCard(card)) return;

    hand.splice(handIndex, 1);
    state.discard.push(card);

    if (card.kind === "wild") {
      if (selectedColor && COLORS.includes(selectedColor)) {
        state.currentColor = selectedColor;
      } else {
        state.currentColor = chooseColor(actorIndex);
      }
    } else {
      state.currentColor = card.color;
    }

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({
        type: "play",
        handIndex,
        selectedColor: card.kind === "wild" ? state.currentColor : null,
      });
    }

    if (hand.length === 0) {
      endAsWinner(actorIndex);
      return;
    }

    let skipNext = false;

    if (card.kind === "action") {
      if (card.value === "skip") {
        skipNext = true;
      }
      if (card.value === "reverse") {
        state.direction *= -1;
        skipNext = true;
      }
      if (card.value === "draw2") {
        const target = nextPlayerIndex(actorIndex, state.direction);
        for (let i = 0; i < 2; i += 1) {
          const drawn = drawFromDeck();
          if (drawn) state.hands[target].push(drawn);
        }
        sortHand(state.hands[target]);
        skipNext = true;
      }
    }

    if (card.kind === "wild" && card.value === "wild4") {
      const target = nextPlayerIndex(actorIndex, state.direction);
      for (let i = 0; i < 4; i += 1) {
        const drawn = drawFromDeck();
        if (drawn) state.hands[target].push(drawn);
      }
      sortHand(state.hands[target]);
      skipNext = true;
    }

    advanceTurn(skipNext);
    messageEl.textContent = `PLAYER ${state.currentPlayer + 1} の手番`;
    render();

    scheduleCpuTurn();
  }

  function drawCardAndPass(opts = {}) {
    const isRemote = Boolean(opts.isRemote);

    if (!state.started || state.gameOver) return;
    if (state.roomLocked) return;
    if (!isRemote && !isLocalPlayersTurn()) return;
    if (isCpuTurn()) return;

    const drawn = drawFromDeck();
    if (drawn) {
      state.hands[state.currentPlayer].push(drawn);
      sortHand(state.hands[state.currentPlayer]);
      messageEl.textContent = `PLAYER ${state.currentPlayer + 1} が1枚引きました`;
    } else {
      messageEl.textContent = "山札がありません";
    }

    advanceTurn(false);
    render();

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ type: "draw-pass" });
    }

    scheduleCpuTurn();
  }

  function runCpuTurn() {
    if (!isCpuTurn() || !state.started || state.gameOver) return;

    const cpuHand = state.hands[1];
    const playableIndex = cpuHand.findIndex((card) => canPlayCard(card));
    if (playableIndex >= 0) {
      playCard(playableIndex);
      return;
    }

    const drawn = drawFromDeck();
    if (drawn) {
      cpuHand.push(drawn);
      sortHand(cpuHand);
      const drawnIndex = cpuHand.findIndex((card) => card === drawn);
      if (drawnIndex >= 0 && canPlayCard(cpuHand[drawnIndex])) {
        messageEl.textContent = "CPUが1枚引いて出しました";
        playCard(drawnIndex);
        return;
      }
      messageEl.textContent = "CPUが1枚引きました";
    } else {
      messageEl.textContent = "山札がありません";
    }

    advanceTurn(false);
    render();
  }

  function buildInitialState({ fromRemote = false } = {}) {
    state.deck = makeDeck();
    state.discard = [];
    state.hands = [[], []];
    state.currentPlayer = 0;
    state.direction = 1;
    state.currentColor = null;
    state.started = true;
    state.gameOver = false;
    setResultText("-");

    for (let p = 0; p < 2; p += 1) {
      for (let i = 0; i < 7; i += 1) {
        const card = drawFromDeck();
        if (card) state.hands[p].push(card);
      }
      sortHand(state.hands[p]);
    }

    let first = drawFromDeck();
    while (first && first.kind === "wild") {
      state.deck.unshift(first);
      first = drawFromDeck();
    }

    if (!first) {
      first = { color: "red", kind: "number", value: 0 };
    }

    state.discard.push(first);
    state.currentColor = first.color;

    messageEl.textContent = "PLAYER 1 の手番";
    render();
    scheduleCpuTurn();

    if (isRoomMode() && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function enterStandby() {
    if (state.cpuTimeoutId) {
      clearTimeout(state.cpuTimeoutId);
      state.cpuTimeoutId = null;
    }
    state.started = false;
    state.gameOver = true;
    state.deck = [];
    state.discard = [];
    state.hands = [[], []];
    state.currentPlayer = 0;
    state.direction = 1;
    state.currentColor = null;
    state.roomLocked = false;
    state.roomLockMessage = "";
    setResultText("-");
    messageEl.textContent = "GAME STARTを押してください";
    render();
  }

  startBtn?.addEventListener("click", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    buildInitialState({ fromRemote: false });
  });
  drawBtn?.addEventListener("click", () => drawCardAndPass());
  bindBackToMenuButton(menuBtn, () => {
    options.onBackToMenu?.();
  });
  modeSelect?.addEventListener("change", () => {
    const nextMode = modeSelect.value === "local" ? "local" : "cpu";
    state.mode = nextMode;
    enterStandby();
  });

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => buildInitialState({ fromRemote }),
    enterStandby,
    stop: () => {},
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      state.mode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayerIndex = roomPlayer === 2 ? 1 : 0;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      render();
    },
    configureStandardMode: (mode) => {
      const nextMode = mode === "local" ? "local" : "cpu";
      state.mode = nextMode;
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayerIndex = 0;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      if (modeSelect) modeSelect.value = nextMode;
      render();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";

      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
      } else if (!state.gameOver) {
        messageEl.textContent = `PLAYER ${state.currentPlayer + 1} の手番`;
      }

      render();
    },
    applyRemoteMove: (payload) => {
      if (!payload) return;
      if (payload.type === "play") {
        playCard(payload.handIndex, {
          isRemote: true,
          selectedColor: payload.selectedColor,
        });
      }
      if (payload.type === "draw-pass") {
        drawCardAndPass({ isRemote: true });
      }
    },
    getSnapshot: () => ({
      deck: state.deck.map((card) => ({ ...card })),
      discard: state.discard.map((card) => ({ ...card })),
      hands: state.hands.map((hand) => hand.map((card) => ({ ...card }))),
      currentPlayer: state.currentPlayer,
      direction: state.direction,
      currentColor: state.currentColor,
      started: state.started,
      gameOver: state.gameOver,
      mode: state.mode,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      message: messageEl.textContent,
      resultText: state.resultText,
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot || typeof snapshot !== "object") return;

      state.deck = Array.isArray(snapshot.deck) ? snapshot.deck.map((card) => ({ ...card })) : [];
      state.discard = Array.isArray(snapshot.discard) ? snapshot.discard.map((card) => ({ ...card })) : [];
      state.hands = Array.isArray(snapshot.hands)
        ? snapshot.hands.map((hand) => (Array.isArray(hand) ? hand.map((card) => ({ ...card })) : []))
        : [[], []];
      state.currentPlayer = Number.isInteger(snapshot.currentPlayer) ? snapshot.currentPlayer : 0;
      state.direction = snapshot.direction === -1 ? -1 : 1;
      state.currentColor = snapshot.currentColor ?? null;
      state.started = Boolean(snapshot.started);
      state.gameOver = Boolean(snapshot.gameOver);
      state.resultText = typeof snapshot.resultText === "string" ? snapshot.resultText : "-";
      if (isRoomMode()) {
        state.roomLocked = Boolean(snapshot.roomLocked);
        state.roomLockMessage = snapshot.roomLockMessage ?? "";
      }
      if (typeof snapshot.message === "string" && snapshot.message) {
        messageEl.textContent = snapshot.message;
      } else if (state.roomLocked && state.roomLockMessage) {
        messageEl.textContent = state.roomLockMessage;
      } else if (!state.gameOver) {
        messageEl.textContent = `PLAYER ${state.currentPlayer + 1} の手番`;
      }

      if (resultTextEl) resultTextEl.textContent = state.resultText;

      render();
    },
  };
}
