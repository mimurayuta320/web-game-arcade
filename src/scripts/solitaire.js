const SUITS = ["H", "D", "C", "S"];
const RED_SUITS = new Set(["H", "D"]);
const STALEMATE_CONFIRM_MS = 7000;
const STALEMATE_REQUIRED_PROBES = 3;
const STALEMATE_FORCE_MS = 20000;

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function makeDeck() {
  const deck = [];
  let id = 1;
  SUITS.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ id: `c${id}`, suit, rank, faceUp: false });
      id += 1;
    }
  });
  return shuffle(deck);
}

function makeGuaranteedRoomLayout() {
  const tableau = Array.from({ length: 7 }, () => []);
  const foundations = { H: [], D: [], C: [], S: [] };
  let id = 1;

  // Room mode uses a deterministic, always-clearable start so race outcome depends on play quality.
  SUITS.forEach((suit, colIndex) => {
    for (let rank = 13; rank >= 1; rank -= 1) {
      tableau[colIndex].push({ id: `r${id}`, suit, rank, faceUp: rank === 1 });
      id += 1;
    }
  });

  return {
    stock: [],
    waste: [],
    foundations,
    tableau,
  };
}

function rankLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

function suitSymbol(suit) {
  if (suit === "H") return "♥";
  if (suit === "D") return "♦";
  if (suit === "C") return "♣";
  return "♠";
}
function isRed(suit) {
  return RED_SUITS.has(suit);
}

function cardText(card) {
  return `${rankLabel(card.rank)}${suitSymbol(card.suit)}`;
}

export function initSolitaire(options = {}) {
  const solitaireScreenEl = document.getElementById("solitaireScreen");
  const stockEl = document.getElementById("solitaireStock");
  const wasteEl = document.getElementById("solitaireWaste");
  const foundationEls = {
    H: document.getElementById("solitaireFoundationH"),
    D: document.getElementById("solitaireFoundationD"),
    C: document.getElementById("solitaireFoundationC"),
    S: document.getElementById("solitaireFoundationS"),
  };
  const tableauEl = document.getElementById("solitaireTableau");
  const foundationCountTextEl = document.getElementById("solitaireFoundationCountText");
  const raceStatusEl = document.getElementById("solitaireRaceStatusText");
  const messageEl = document.getElementById("solitaireMessage");
  const resultModalEl = document.getElementById("solitaireResultModal");
  const resultTitleEl = document.getElementById("solitaireResultTitle");
  const resultSummaryEl = document.getElementById("solitaireResultSummary");
  const resultDetailEl = document.getElementById("solitaireResultDetail");
  const resultRetryBtn = document.getElementById("solitaireResultRetryBtn");
  const resultLobbyBtn = document.getElementById("solitaireResultLobbyBtn");

  // RESULTモーダルは使用しないため、初期化時にDOMから外して表示経路を完全に遮断する。
  resultModalEl?.remove();

  const startBtn = document.getElementById("solitaireStartBtn");
  const resetBtn = document.getElementById("solitaireResetBtn");
  const undoBtn = document.getElementById("solitaireUndoBtn");
  const autoClearBtn = document.getElementById("solitaireAutoClearBtn");
  const stalemateShuffleBtn = document.getElementById("solitaireStalemateShuffleBtn");
  const menuBtn = document.getElementById("solitaireMenuBtn");

  const state = {
    stock: [],
    waste: [],
    foundations: { H: [], D: [], C: [], S: [] },
    tableau: Array.from({ length: 7 }, () => []),
    started: false,
    gameMode: "local",
    roomCode: null,
    roomRole: null,
    roomLocked: false,
    roomLockMessage: "",
    roomRace: {
      matchId: null,
      startAt: null,
      local: { foundation: 0, moves: 0, elapsedMs: 0, finished: false, result: "playing" },
      peer: { foundation: 0, moves: 0, elapsedMs: 0, finished: false, result: "playing" },
      resultShownForMatch: null,
    },
    undoStack: [],
    stalemateShuffleMode: false,
    autoClearing: false,
    selected: null,
    dragRef: null,
    lastTapRef: null,
    lastTapAt: 0,
    lastBoardSignature: null,
    stalematePromptedSignature: null,
    stalemateProbeCount: 0,
    stalemateSince: null,
  };

  function sameRef(a, b) {
    return Boolean(
      a &&
        b &&
        a.from === b.from &&
        a.col === b.col &&
        a.index === b.index &&
        a.suit === b.suit
    );
  }

  function clearSelection() {
    state.selected = null;
  }

  function clearDragRef() {
    state.dragRef = null;
  }

  function resetTapHistory() {
    state.lastTapRef = null;
    state.lastTapAt = 0;
  }

  function isCoarsePointerDevice() {
    return window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  }

  function consumeMobileDoubleTap(ref) {
    if (!isCoarsePointerDevice()) return false;

    const now = Date.now();
    const isDoubleTap = sameRef(state.lastTapRef, ref) && now - state.lastTapAt <= 360;
    state.lastTapRef = ref;
    state.lastTapAt = now;

    if (isDoubleTap) {
      resetTapHistory();
      return true;
    }
    return false;
  }

  function canSelectRef(ref) {
    if (!ref) return false;
    if (ref.from === "waste") {
      return Boolean(state.waste[state.waste.length - 1]);
    }
    if (ref.from === "foundation") {
      if (!SUITS.includes(ref.suit)) return false;
      return Boolean(state.foundations[ref.suit][state.foundations[ref.suit].length - 1]);
    }
    if (ref.from === "tableau") {
      const col = state.tableau[ref.col];
      if (!col || col.length === 0) return false;
      const startIndex = Number.isInteger(ref.index) ? ref.index : col.length - 1;
      return isMovableTableauStack(ref.col, startIndex);
    }
    return false;
  }

  function selectRef(ref) {
    if (!canSelectRef(ref)) {
      messageEl.textContent = "このカードは移動できません";
      return false;
    }
    state.selected = ref;
    messageEl.textContent = "移動先をタップしてください";
    return true;
  }

  function toggleSelectedRef(ref) {
    if (sameRef(state.selected, ref)) {
      clearSelection();
      messageEl.textContent = "選択を解除しました";
      return false;
    }
    return selectRef(ref);
  }

  function cloneCard(card) {
    return { ...card };
  }

  function clonePile(pile) {
    return pile.map((card) => cloneCard(card));
  }

  function cloneFoundations(foundations) {
    return {
      H: clonePile(foundations.H ?? []),
      D: clonePile(foundations.D ?? []),
      C: clonePile(foundations.C ?? []),
      S: clonePile(foundations.S ?? []),
    };
  }

  function cloneTableau(tableau) {
    return tableau.map((col) => clonePile(col));
  }

  function clearUndoStack() {
    state.undoStack = [];
  }

  function updateStalemateShuffleButton() {
    if (!stalemateShuffleBtn) return;
    const enabled = state.stalemateShuffleMode;
    stalemateShuffleBtn.textContent = enabled ? "詰み時シャッフル: ON" : "詰み時シャッフル: OFF";
    stalemateShuffleBtn.classList.toggle("active", enabled);
    stalemateShuffleBtn.setAttribute("aria-pressed", enabled ? "true" : "false");
  }

  function triggerClearPartyEffect() {
    const host = solitaireScreenEl || document.body;
    const layer = document.createElement("div");
    layer.className = "solitaire-party-layer";

    const burst = document.createElement("div");
    burst.className = "solitaire-party-burst";
    burst.textContent = "CLEAR!";
    layer.appendChild(burst);

    const colors = ["#ffd166", "#ff6b35", "#16db93", "#6de2ff", "#ff8fab", "#fff1a8"];
    for (let i = 0; i < 56; i += 1) {
      const piece = document.createElement("span");
      piece.className = "solitaire-party-piece";
      const left = Math.random() * 100;
      const delay = Math.random() * 0.22;
      const duration = 1.25 + Math.random() * 0.95;
      const drift = (Math.random() - 0.5) * 34;
      const spin = (Math.random() - 0.5) * 340;
      const size = 7 + Math.random() * 7;
      piece.style.left = `${left}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = `${size}px`;
      piece.style.height = `${Math.max(4, size * 0.55)}px`;
      piece.style.animationDelay = `${delay}s`;
      piece.style.animationDuration = `${duration}s`;
      piece.style.setProperty("--party-drift", `${drift}vw`);
      piece.style.setProperty("--party-spin", `${spin}deg`);
      layer.appendChild(piece);
    }

    host.appendChild(layer);
    setTimeout(() => {
      layer.remove();
    }, 2600);
  }

  function hasAnyFaceDownInTableau() {
    for (let col = 0; col < state.tableau.length; col += 1) {
      const cards = state.tableau[col];
      for (let idx = 0; idx < cards.length; idx += 1) {
        if (!cards[idx].faceUp) return true;
      }
    }
    return false;
  }

  function canOfferAutoClear() {
    if (!state.started || state.roomLocked || state.autoClearing) return false;
    if (foundationTotal() >= 52) return false;
    if (state.stock.length > 0 || state.waste.length > 0) return false;
    return !hasAnyFaceDownInTableau();
  }

  function findTableauCardElement(col, idx) {
    return tableauEl.querySelector(`.solitaire-tableau-card[data-col="${col}"][data-idx="${idx}"]`);
  }

  function waitMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function animateAutoMoveToFoundation(ref, suit) {
    const targetEl = foundationEls[suit];
    const movingCard = cardFromRef(ref);
    if (!targetEl || !movingCard) return Promise.resolve();

    let sourceEl = null;
    if (ref.from === "tableau") {
      sourceEl = findTableauCardElement(ref.col, ref.index);
    } else if (ref.from === "waste") {
      sourceEl = wasteEl;
    } else if (ref.from === "foundation") {
      sourceEl = foundationEls[ref.suit];
    }
    if (!sourceEl) return Promise.resolve();

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
      return Promise.resolve();
    }

    const ghost = document.createElement("div");
    ghost.className = "solitaire-auto-motion-card";
    ghost.textContent = cardText(movingCard);
    if (isRed(movingCard.suit)) ghost.classList.add("red");
    ghost.style.left = `${sourceRect.left}px`;
    ghost.style.top = `${sourceRect.top}px`;
    ghost.style.width = `${sourceRect.width}px`;
    ghost.style.height = `${sourceRect.height}px`;

    document.body.appendChild(ghost);

    const dx = targetRect.left - sourceRect.left;
    const dy = targetRect.top - sourceRect.top;

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        ghost.remove();
        resolve();
      };

      requestAnimationFrame(() => {
        ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.92)`;
        ghost.style.opacity = "0.78";
      });

      ghost.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 320);
    });
  }

  async function performAutoClear() {
    if (state.autoClearing) return false;
    if (!canOfferAutoClear()) {
      messageEl.textContent = "まだCLEARは使えません";
      return false;
    }

    state.autoClearing = true;
    render();

    const undoPoint = snapshotState();
    let movedAny = false;
    let guard = 0;

    try {
      while (guard < 300) {
        guard += 1;
        let movedThisRound = false;

        for (let col = 0; col < 7; col += 1) {
          const cards = state.tableau[col];
          const topIndex = cards.length - 1;
          if (topIndex < 0) continue;

          const ref = { from: "tableau", col, index: topIndex };
          const suit = findFoundationSuit(ref);
          if (!suit) continue;

          await animateAutoMoveToFoundation(ref, suit);
          if (moveRefToFoundation(ref, suit, { isRemote: false })) {
            movedThisRound = true;
            movedAny = true;
            render();
            await waitMs(30);
          }
        }

        if (!movedThisRound) break;
        if (!state.started || foundationTotal() >= 52) break;
      }
    } finally {
      state.autoClearing = false;
    }

    if (movedAny && canUseUndo()) {
      state.undoStack.push(undoPoint);
    }

    if (foundationTotal() >= 52) {
      messageEl.textContent = "CLEARで土台へ自動移動しました";
      return true;
    }

    if (movedAny) {
      messageEl.textContent = "自動移動できるカードを土台へ送りました";
      return true;
    }

    messageEl.textContent = "土台に送れるカードがありません";
    return false;
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function canUseUndo() {
    return !isRoomMode();
  }

  function snapshotState() {
    return {
      stock: clonePile(state.stock),
      waste: clonePile(state.waste),
      foundations: cloneFoundations(state.foundations),
      tableau: cloneTableau(state.tableau),
      started: state.started,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      stalemateSince: state.stalemateSince,
      roomRace: {
        matchId: state.roomRace.matchId,
        startAt: state.roomRace.startAt,
        local: { ...state.roomRace.local },
        peer: { ...state.roomRace.peer },
        resultShownForMatch: state.roomRace.resultShownForMatch,
      },
      message: messageEl.textContent,
    };
  }

  function sendRoomMove(move) {
    if (!isRoomMode() || !move) return;
    options.onRoomMove?.(move);
  }

  function resetRaceRecords() {
    state.roomRace.local = { foundation: 0, moves: 0, elapsedMs: 0, finished: false, result: "playing" };
    state.roomRace.peer = { foundation: 0, moves: 0, elapsedMs: 0, finished: false, result: "playing" };
  }

  function setResultModalVisible(visible) {
    if (!resultModalEl) return;
    resultModalEl.classList.toggle("hidden", !visible);
  }

  function hideResultModal() {
    setResultModalVisible(false);
  }

  function syncResultActionButtons() {
    if (!resultLobbyBtn || !resultRetryBtn) return;

    if (isRoomMode()) {
      resultRetryBtn.style.display = "none";
      resultLobbyBtn.textContent = "ロビーへ戻る";
    } else {
      resultRetryBtn.style.display = "";
      resultRetryBtn.textContent = "もう一回";
      resultLobbyBtn.textContent = "メニューへ";
    }
  }

  function raceElapsedMs() {
    if (!state.roomRace.startAt) return 0;
    return Math.max(0, Date.now() - state.roomRace.startAt);
  }

  function updateLocalRaceRecord({ finished = false, result = null } = {}) {
    if (!isRoomMode()) return;
    state.roomRace.local.foundation = foundationTotal();
    state.roomRace.local.elapsedMs = raceElapsedMs();
    if (finished) state.roomRace.local.finished = true;
    if (result) state.roomRace.local.result = result;
  }

  function raceRecordLabel(record) {
    const sec = Math.floor((record.elapsedMs || 0) / 1000);
    return `${record.foundation}/52 | ${sec}s | ${record.moves}手`;
  }

  function compareRace(local, peer) {
    const localClear = local.result === "clear";
    const peerClear = peer.result === "clear";
    if (localClear !== peerClear) return localClear ? 1 : -1;
    if (localClear && peerClear) {
      if (local.elapsedMs !== peer.elapsedMs) return local.elapsedMs < peer.elapsedMs ? 1 : -1;
      if (local.moves !== peer.moves) return local.moves < peer.moves ? 1 : -1;
      return 0;
    }

    if (local.foundation !== peer.foundation) return local.foundation > peer.foundation ? 1 : -1;
    if (local.elapsedMs !== peer.elapsedMs) return local.elapsedMs < peer.elapsedMs ? 1 : -1;
    if (local.moves !== peer.moves) return local.moves < peer.moves ? 1 : -1;
    return 0;
  }

  function roomDuelSummaryText() {
    if (!isRoomMode()) return "-";
    const local = raceRecordLabel(state.roomRace.local);
    const peer = raceRecordLabel(state.roomRace.peer);
    return `YOU ${local} / PEER ${peer}`;
  }

  function reportRaceProgress({ force = false } = {}) {
    if (!isRoomMode()) return;

    updateLocalRaceRecord();
    const payload = {
      type: "race-progress",
      matchId: state.roomRace.matchId,
      foundation: state.roomRace.local.foundation,
      moves: state.roomRace.local.moves,
      elapsedMs: state.roomRace.local.elapsedMs,
      finished: state.roomRace.local.finished,
      result: state.roomRace.local.result,
    };

    if (force || state.started || payload.finished) {
      sendRoomMove(payload);
    }
  }

  function updateRoomRaceMessage() {
    if (!isRoomMode()) return;
    if (!state.roomRace.local.finished || !state.roomRace.peer.finished) return;

    const cmp = compareRace(state.roomRace.local, state.roomRace.peer);

    if (cmp > 0) {
      messageEl.textContent = "対戦結果: あなた: 勝ち / 相手: 負け";
    } else if (cmp < 0) {
      messageEl.textContent = "対戦結果: 相手: 勝ち / あなた: 負け";
    } else {
      messageEl.textContent = "対戦結果: 引き分けです";
    }

    state.roomRace.resultShownForMatch = state.roomRace.matchId || "no-match";
  }

  function cardFromRef(ref) {
    if (!ref) return null;
    if (ref.from === "waste") return state.waste[state.waste.length - 1] || null;
    if (ref.from === "foundation") {
      const pile = state.foundations[ref.suit];
      return pile?.[pile.length - 1] || null;
    }
    if (ref.from === "tableau") {
      const col = state.tableau[ref.col];
      if (!col || col.length === 0) return null;
      const startIndex = Number.isInteger(ref.index) ? ref.index : col.length - 1;
      return col[startIndex] || null;
    }
    return null;
  }

  function isMovableTableauStack(colIndex, startIndex) {
    const col = state.tableau[colIndex];
    if (!col || startIndex < 0 || startIndex >= col.length) return false;
    if (!col[startIndex].faceUp) return false;

    for (let i = startIndex; i < col.length - 1; i += 1) {
      const a = col[i];
      const b = col[i + 1];
      if (!a.faceUp || !b.faceUp) return false;
      if (isRed(a.suit) === isRed(b.suit)) return false;
      if (a.rank !== b.rank + 1) return false;
    }

    return true;
  }

  function movingCardsFromRef(ref) {
    if (!ref) return [];
    if (ref.from === "waste") {
      const top = state.waste[state.waste.length - 1];
      return top ? [top] : [];
    }
    if (ref.from === "foundation") {
      const pile = state.foundations[ref.suit];
      const top = pile?.[pile.length - 1] || null;
      return top ? [top] : [];
    }
    if (ref.from === "tableau") {
      const col = state.tableau[ref.col];
      if (!col || col.length === 0) return [];
      const startIndex = Number.isInteger(ref.index) ? ref.index : col.length - 1;
      if (!isMovableTableauStack(ref.col, startIndex)) return [];
      return col.slice(startIndex);
    }
    return [];
  }

  function canMoveToFoundation(card, suit) {
    if (!card || card.suit !== suit) return false;
    const pile = state.foundations[suit];
    if (pile.length === 0) return card.rank === 1;
    return pile[pile.length - 1].rank + 1 === card.rank;
  }

  function canMoveToTableau(card, colIndex) {
    if (!card) return false;
    const col = state.tableau[colIndex];
    const top = col[col.length - 1];

    if (!top) return card.rank === 13;
    if (!top.faceUp) return false;

    const oppositeColor = isRed(top.suit) !== isRed(card.suit);
    return oppositeColor && top.rank === card.rank + 1;
  }

  function removeCardsFromRef(ref) {
    if (!ref) return null;

    if (ref.from === "waste") {
      const card = state.waste.pop() || null;
      return card ? [card] : [];
    }

    if (ref.from === "foundation") {
      const pile = state.foundations[ref.suit];
      if (!pile || pile.length === 0) return [];
      const card = pile.pop() || null;
      return card ? [card] : [];
    }

    if (ref.from === "tableau") {
      const col = state.tableau[ref.col];
      if (!col || col.length === 0) return [];
      const startIndex = Number.isInteger(ref.index) ? ref.index : col.length - 1;
      const cards = col.splice(startIndex);
      const newTop = col[col.length - 1];
      if (newTop && !newTop.faceUp) newTop.faceUp = true;
      return cards;
    }

    return [];
  }

  function tryMoveRefToFoundation(ref, suit) {
    const movingCards = movingCardsFromRef(ref);
    const card = movingCards[0] || null;
    if (movingCards.length !== 1) {
      messageEl.textContent = "土台には1枚ずつのみ移動できます";
      return false;
    }
    if (!canMoveToFoundation(card, suit)) {
      messageEl.textContent = "ここには置けません";
      return false;
    }

    const removed = removeCardsFromRef(ref);
    const moving = removed[0] || null;
    if (!moving) return false;

    state.foundations[suit].push(moving);
    if (sameRef(state.selected, ref)) {
      clearSelection();
    }
    messageEl.textContent = "土台へ移動しました";
    return true;
  }

  function tryMoveRefToTableau(ref, colIndex) {
    const movingCards = movingCardsFromRef(ref);
    const card = movingCards[0] || null;
    if (!canMoveToTableau(card, colIndex)) {
      messageEl.textContent = "ここには置けません";
      return false;
    }

    const removed = removeCardsFromRef(ref);
    if (!removed || removed.length === 0) return false;

    removed.forEach((c) => {
      c.faceUp = true;
      state.tableau[colIndex].push(c);
    });
    if (sameRef(state.selected, ref)) {
      clearSelection();
    }
    messageEl.textContent = "移動しました";
    return true;
  }

  function tryAutoMoveToFoundation(ref) {
    const card = cardFromRef(ref);
    if (!card) return false;

    for (const suit of SUITS) {
      if (canMoveToFoundation(card, suit)) {
        const moved = tryMoveRefToFoundation(ref, suit);
        return moved;
      }
    }
    return false;
  }

  function findFoundationSuit(ref) {
    const card = cardFromRef(ref);
    if (!card) return null;
    for (const suit of SUITS) {
      if (canMoveToFoundation(card, suit)) return suit;
    }
    return null;
  }

  function moveRefToFoundation(ref, suit, { isRemote = false } = {}) {
    if (!isRemote && state.roomLocked) return false;
    const undoPoint = !isRemote ? snapshotState() : null;
    const moved = tryMoveRefToFoundation(ref, suit);
    if (!moved) return false;

    if (undoPoint && canUseUndo()) {
      state.undoStack.push(undoPoint);
    }

    if (!isRemote && isRoomMode()) {
      state.roomRace.local.moves += 1;
    }
    checkClear();
    if (!isRemote && isRoomMode()) {
      reportRaceProgress();
    }
    return true;
  }

  function moveRefToTableau(ref, colIndex, { isRemote = false } = {}) {
    if (!isRemote && state.roomLocked) return false;
    const undoPoint = !isRemote ? snapshotState() : null;
    const moved = tryMoveRefToTableau(ref, colIndex);
    if (!moved) return false;

    if (undoPoint && canUseUndo()) {
      state.undoStack.push(undoPoint);
    }

    if (!isRemote && isRoomMode()) {
      state.roomRace.local.moves += 1;
    }
    checkClear();
    if (!isRemote && isRoomMode()) {
      reportRaceProgress();
    }
    return true;
  }

  function tryAutoPlaceRef(ref, { isRemote = false } = {}) {
    const movingCards = movingCardsFromRef(ref);
    if (!movingCards || movingCards.length === 0) return false;

    if (movingCards.length === 1) {
      const suit = findFoundationSuit(ref);
      if (suit && moveRefToFoundation(ref, suit, { isRemote })) {
        return true;
      }
    }

    const head = movingCards[0];
    for (let col = 0; col < 7; col += 1) {
      if (ref.from === "tableau" && ref.col === col) continue;
      if (!canMoveToTableau(head, col)) continue;
      if (moveRefToTableau(ref, col, { isRemote })) {
        return true;
      }
    }

    return false;
  }

  function moveDrawFromStock({ isRemote = false } = {}) {
    if (!state.started || (!isRemote && state.roomLocked)) return false;
    const undoPoint = !isRemote ? snapshotState() : null;
    clearSelection();

    if (state.stock.length > 0) {
      const card = state.stock.pop();
      card.faceUp = true;
      state.waste.push(card);
      messageEl.textContent = "1枚めくりました";
      if (!isRemote && isRoomMode()) {
        state.roomRace.local.moves += 1;
      }
    } else if (state.waste.length > 0) {
      while (state.waste.length > 0) {
        const card = state.waste.pop();
        card.faceUp = false;
        state.stock.push(card);
      }
      messageEl.textContent = "ストックを戻しました";
      if (!isRemote && isRoomMode()) {
        state.roomRace.local.moves += 1;
      }
    } else {
      messageEl.textContent = "めくれるカードがありません";
      return false;
    }

    if (!isRemote && isRoomMode()) {
      reportRaceProgress();
    }

    if (undoPoint && canUseUndo()) {
      state.undoStack.push(undoPoint);
    }
    return true;
  }

  function flipTableauTop(colIndex, { isRemote = false } = {}) {
    const col = state.tableau[colIndex];
    if (!col || col.length === 0) return false;
    const top = col[col.length - 1];
    if (top.faceUp) return false;
    if (!state.started || (!isRemote && state.roomLocked)) return false;

    const undoPoint = !isRemote ? snapshotState() : null;

    top.faceUp = true;
    messageEl.textContent = "カードをめくりました";
    if (!isRemote && isRoomMode()) {
      state.roomRace.local.moves += 1;
      reportRaceProgress();
    }

    if (undoPoint && canUseUndo()) {
      state.undoStack.push(undoPoint);
    }
    return true;
  }

  function applySnapshotState(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;

    state.stock = clonePile(Array.isArray(snapshot.stock) ? snapshot.stock : []);
    state.waste = clonePile(Array.isArray(snapshot.waste) ? snapshot.waste : []);
    state.foundations = cloneFoundations(snapshot.foundations ?? {});
    state.tableau = cloneTableau(Array.isArray(snapshot.tableau) ? snapshot.tableau : Array.from({ length: 7 }, () => []));
    state.started = Boolean(snapshot.started);
    state.roomLocked = Boolean(snapshot.roomLocked);
    state.roomLockMessage = snapshot.roomLockMessage ?? "";
    state.stalemateSince = Number.isFinite(snapshot.stalemateSince) ? snapshot.stalemateSince : null;
    state.roomRace.matchId = snapshot.roomRace?.matchId ?? null;
    state.roomRace.startAt = Number.isFinite(snapshot.roomRace?.startAt) ? snapshot.roomRace.startAt : null;
    state.roomRace.resultShownForMatch = snapshot.roomRace?.resultShownForMatch ?? null;
    state.roomRace.local = {
      foundation: Number.isFinite(snapshot.roomRace?.local?.foundation) ? snapshot.roomRace.local.foundation : foundationTotal(),
      moves: Number.isFinite(snapshot.roomRace?.local?.moves) ? snapshot.roomRace.local.moves : 0,
      elapsedMs: Number.isFinite(snapshot.roomRace?.local?.elapsedMs) ? snapshot.roomRace.local.elapsedMs : 0,
      finished: Boolean(snapshot.roomRace?.local?.finished),
      result: typeof snapshot.roomRace?.local?.result === "string" ? snapshot.roomRace.local.result : "playing",
    };
    state.roomRace.peer = {
      foundation: Number.isFinite(snapshot.roomRace?.peer?.foundation) ? snapshot.roomRace.peer.foundation : 0,
      moves: Number.isFinite(snapshot.roomRace?.peer?.moves) ? snapshot.roomRace.peer.moves : 0,
      elapsedMs: Number.isFinite(snapshot.roomRace?.peer?.elapsedMs) ? snapshot.roomRace.peer.elapsedMs : 0,
      finished: Boolean(snapshot.roomRace?.peer?.finished),
      result: typeof snapshot.roomRace?.peer?.result === "string" ? snapshot.roomRace.peer.result : "playing",
    };
    clearSelection();
    clearDragRef();

    if (typeof snapshot.message === "string" && snapshot.message) {
      messageEl.textContent = snapshot.message;
    } else if (state.roomLocked) {
      messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
    } else if (!state.started) {
      messageEl.textContent = "GAME STARTで開始";
    } else {
      messageEl.textContent = "カードを並べ替えて土台を完成させよう";
    }

    updateRoomRaceMessage();
    syncResultActionButtons();

    render();
  }

  function handleUndo() {
    if (!canUseUndo()) return;
    const snapshot = state.undoStack.pop();
    if (!snapshot) {
      messageEl.textContent = "これ以上取り消せません";
      render();
      return;
    }
    applySnapshotState(snapshot);
  }

  function parseRefFromDataTransfer(e) {
    try {
      const raw = e.dataTransfer?.getData("text/plain");
      if (!raw) return null;
      const ref = JSON.parse(raw);
      if (!ref || (ref.from !== "waste" && ref.from !== "tableau" && ref.from !== "foundation")) return null;
      if (ref.from === "foundation" && !SUITS.includes(ref.suit)) return null;
      if (ref.from === "tableau" && !Number.isInteger(ref.index)) {
        ref.index = 0;
      }
      return ref;
    } catch {
      return null;
    }
  }

  function getActiveMoveRef(e) {
    if (state.dragRef) return state.dragRef;
    if (state.selected) return state.selected;
    return parseRefFromDataTransfer(e);
  }

  function handleDragStart(e, ref) {
    if (!state.started || state.roomLocked || state.autoClearing) {
      e.preventDefault();
      return;
    }

    const card = cardFromRef(ref);
    if (!card) {
      e.preventDefault();
      return;
    }

    if (ref.from === "tableau") {
      const startIndex = Number.isInteger(ref.index) ? ref.index : 0;
      if (!isMovableTableauStack(ref.col, startIndex)) {
        e.preventDefault();
        return;
      }
    }

    state.dragRef = ref;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(ref));
  }

  function handleDragEnd() {
    clearDragRef();
  }

  function handleDropToFoundation(e, suit) {
    e.preventDefault();
    if (!state.started || state.roomLocked) return;
    const ref = getActiveMoveRef(e);
    if (!ref) return;

    moveRefToFoundation(ref, suit, { isRemote: false });
    clearDragRef();
    render();
  }

  function handleDropToTableau(e, colIndex) {
    e.preventDefault();
    if (!state.started || state.roomLocked) return;
    const ref = getActiveMoveRef(e);
    if (!ref) return;

    moveRefToTableau(ref, colIndex, { isRemote: false });
    clearDragRef();
    render();
  }

  function foundationTotal() {
    return SUITS.reduce((sum, suit) => sum + state.foundations[suit].length, 0);
  }

  function canCardMoveSomewhere(card) {
    if (!card) return false;
    for (const suit of SUITS) {
      if (canMoveToFoundation(card, suit)) return true;
    }
    for (let col = 0; col < 7; col += 1) {
      if (canMoveToTableau(card, col)) return true;
    }
    return false;
  }

  function canCardMoveToAnyFoundation(card) {
    if (!card) return false;
    for (const suit of SUITS) {
      if (canMoveToFoundation(card, suit)) return true;
    }
    return false;
  }

  function isProgressTableauMove(colCards, startIndex, toCol) {
    const beneath = colCards[startIndex - 1];
    if (beneath && !beneath.faceUp) return true;
    return false;
  }

  function hasAnyProgressMove() {
    if (state.waste.length > 0) {
      const wasteTop = state.waste[state.waste.length - 1];
      if (canCardMoveToAnyFoundation(wasteTop)) return true;
    }

    for (let col = 0; col < 7; col += 1) {
      const cards = state.tableau[col];
      const top = cards[cards.length - 1];

      // Exposed facedown top cards are immediately flippable and count as a legal move.
      if (top && !top.faceUp) return true;

      for (let idx = 0; idx < cards.length; idx += 1) {
        if (!isMovableTableauStack(col, idx)) continue;
        const head = cards[idx];

        if (idx === cards.length - 1 && canCardMoveToAnyFoundation(head)) return true;

        for (let toCol = 0; toCol < 7; toCol += 1) {
          if (toCol === col) continue;
          if (!canMoveToTableau(head, toCol)) continue;
          if (isProgressTableauMove(cards, idx, toCol)) return true;
        }
      }
    }

    return false;
  }

  function hasPotentialProgressAfterWasteRecycle() {
    // While stock still has cards, player has not exhausted draw options yet.
    if (state.stock.length > 0) return true;

    const cycleCards = [...state.stock, ...state.waste];
    if (cycleCards.length === 0) return false;

    // Recycle is useful only when it can advance foundations from stock/waste.
    for (let i = 0; i < cycleCards.length; i += 1) {
      if (canCardMoveToAnyFoundation(cycleCards[i])) return true;
    }
    return false;
  }

  function shuffleCandidateCardCount() {
    let count = state.stock.length + state.waste.length;
    for (let col = 0; col < state.tableau.length; col += 1) {
      count += state.tableau[col].length;
    }
    return count;
  }

  function shuffleNonFoundationCardsInPlace() {
    const pool = [];
    const stockPositions = [];
    const wastePositions = [];
    const tableauPositions = [];

    for (let i = 0; i < state.stock.length; i += 1) {
      stockPositions.push({ idx: i, faceUp: state.stock[i].faceUp });
      pool.push(state.stock[i]);
    }

    for (let i = 0; i < state.waste.length; i += 1) {
      wastePositions.push({ idx: i, faceUp: state.waste[i].faceUp });
      pool.push(state.waste[i]);
    }

    for (let col = 0; col < state.tableau.length; col += 1) {
      const cards = state.tableau[col];
      for (let idx = 0; idx < cards.length; idx += 1) {
        tableauPositions.push({ col, idx, faceUp: cards[idx].faceUp });
        pool.push(cards[idx]);
      }
    }

    if (pool.length < 2) return false;

    shuffle(pool);

    let cursor = 0;
    for (let i = 0; i < stockPositions.length; i += 1) {
      const pos = stockPositions[i];
      const card = pool[cursor++];
      card.faceUp = pos.faceUp;
      state.stock[pos.idx] = card;
    }

    for (let i = 0; i < wastePositions.length; i += 1) {
      const pos = wastePositions[i];
      const card = pool[cursor++];
      card.faceUp = pos.faceUp;
      state.waste[pos.idx] = card;
    }

    for (let i = 0; i < tableauPositions.length; i += 1) {
      const pos = tableauPositions[i];
      const card = pool[cursor++];
      card.faceUp = pos.faceUp;
      state.tableau[pos.col][pos.idx] = card;
    }

    return true;
  }

  function isStalemateState() {
    if (!state.started) return false;
    if (foundationTotal() === 52) return false;
    if (hasAnyProgressMove()) return false;
    return !hasPotentialProgressAfterWasteRecycle();
  }

  function boardSignature() {
    const tableau = state.tableau
      .map((col) => col.map((card) => `${card.id}:${card.faceUp ? 1 : 0}`).join(","))
      .join("|");
    const stock = state.stock.map((card) => `${card.id}:${card.faceUp ? 1 : 0}`).join(",");
    const waste = state.waste.map((card) => `${card.id}:${card.faceUp ? 1 : 0}`).join(",");
    const foundations = SUITS.map((suit) => state.foundations[suit].map((card) => card.id).join(",")).join("|");
    return `${stock}#${waste}#${foundations}#${tableau}`;
  }

  function gameOverFromStalemate({ isRemote = false } = {}) {
    if (!isRemote && !isRoomMode() && state.stalemateShuffleMode) {
      const signature = boardSignature();
      if (state.stalematePromptedSignature === signature) {
        return;
      }

      const candidateCount = shuffleCandidateCardCount();
      if (candidateCount >= 2) {
        state.stalematePromptedSignature = signature;
        const confirmed = window.confirm(`詰み状態です。右上の山札以外をシャッフルして続行しますか？\n対象: ${candidateCount}枚`);
        if (confirmed) {
          const undoPoint = snapshotState();
          if (shuffleNonFoundationCardsInPlace()) {
            if (canUseUndo()) {
              state.undoStack.push(undoPoint);
            }
            state.lastBoardSignature = boardSignature();
            state.stalematePromptedSignature = state.lastBoardSignature;
            state.stalemateSince = null;
            state.stalemateProbeCount = 0;
            clearSelection();
            clearDragRef();
            resetTapHistory();
            messageEl.textContent = "カードをシャッフルしました。続行します";

            // Stalemate checks can run from the timer path; schedule a repaint so the shuffled layout is visible immediately.
            setTimeout(() => {
              render();
            }, 0);
            return;
          }
        }
      }
    }

    state.started = false;
    state.stalemateSince = null;
    clearSelection();
    clearDragRef();
    if (isRoomMode()) {
      state.roomRace.local.finished = true;
      state.roomRace.local.result = "stalemate";
      updateLocalRaceRecord({ finished: true, result: "stalemate" });
      messageEl.textContent = "あなたは詰みで終了しました。相手の結果待ちです";
      if (!isRemote) {
        reportRaceProgress({ force: true });
      }
      updateRoomRaceMessage();
    } else {
      messageEl.textContent = "ゲームオーバー: 詰み状態です";
    }
  }

  function updateStalemateStatus() {
    if (!state.started) {
      state.lastBoardSignature = null;
      state.stalematePromptedSignature = null;
      state.stalemateProbeCount = 0;
      state.stalemateSince = null;
      return;
    }

    const currentSignature = boardSignature();
    const boardChanged = state.lastBoardSignature !== currentSignature;
    if (boardChanged) {
      state.lastBoardSignature = currentSignature;
      state.stalematePromptedSignature = null;
      state.stalemateProbeCount = 0;
      state.stalemateSince = null;
    }

    if (!isStalemateState()) {
      state.stalemateProbeCount = 0;
      state.stalemateSince = null;
      return;
    }

    if (boardChanged || !Number.isFinite(state.stalemateSince)) {
      state.stalemateSince = Date.now();
      state.stalemateProbeCount = 0;
      return;
    }

    const elapsed = Date.now() - state.stalemateSince;
    if (elapsed < STALEMATE_CONFIRM_MS) {
      return;
    }

    if (state.stalemateProbeCount < STALEMATE_REQUIRED_PROBES && elapsed < STALEMATE_FORCE_MS) {
      return;
    }

    gameOverFromStalemate({ isRemote: false });
  }

  function checkClear() {
    if (foundationTotal() === 52) {
      state.started = false;
      state.stalemateSince = null;
      clearSelection();
      triggerClearPartyEffect();
      if (isRoomMode()) {
        state.roomRace.local.finished = true;
        state.roomRace.local.result = "clear";
        updateLocalRaceRecord({ finished: true, result: "clear" });
        messageEl.textContent = "クリア! 相手の結果待ちです";
        reportRaceProgress({ force: true });
        updateRoomRaceMessage();
      } else {
        messageEl.textContent = "クリア! すべてそろいました";
      }
    }
  }

  function renderCard(slotEl, card, { emptyText = "", selectable = false, selected = false, backStyle = false, draggable = false } = {}) {
    slotEl.className = "solitaire-slot";
    if (selectable) slotEl.classList.add("selectable");
    if (selected) slotEl.classList.add("selected");
    slotEl.draggable = draggable;

    if (!card) {
      slotEl.textContent = emptyText;
      if (backStyle) slotEl.classList.add("card-back");
      return;
    }

    slotEl.classList.add("card-face");
    slotEl.textContent = cardText(card);
    if (isRed(card.suit)) slotEl.classList.add("red");
  }

  function renderTopRow() {
    renderCard(stockEl, null, {
      emptyText: "↺",
      backStyle: state.stock.length > 0,
    });

    const wasteTop = state.waste[state.waste.length - 1] || null;
    const wasteSelected = state.selected?.from === "waste";
    renderCard(wasteEl, wasteTop, {
      emptyText: "W",
      selectable: Boolean(wasteTop),
      selected: wasteSelected,
      draggable: Boolean(state.started && !state.roomLocked && wasteTop),
    });

    wasteEl.ondragstart = wasteTop ? (e) => handleDragStart(e, { from: "waste" }) : null;
    wasteEl.ondragend = handleDragEnd;

    SUITS.forEach((suit) => {
      const top = state.foundations[suit][state.foundations[suit].length - 1] || null;
      const foundationRef = { from: "foundation", suit };
      renderCard(foundationEls[suit], top, {
        emptyText: suitSymbol(suit),
        selectable: Boolean(top),
        selected: sameRef(state.selected, foundationRef),
        draggable: Boolean(state.started && !state.roomLocked && top),
      });

      foundationEls[suit].onclick = () => {
        if (!state.started || state.roomLocked || state.autoClearing) return;

        if (!state.selected) {
          if (!top) {
            messageEl.textContent = "移動するカードを先に選択してください";
            render();
            return;
          }
          toggleSelectedRef(foundationRef);
          render();
          return;
        }

        if (sameRef(state.selected, foundationRef)) {
          clearSelection();
          messageEl.textContent = "選択を解除しました";
          render();
          return;
        }

        moveRefToFoundation(state.selected, suit, { isRemote: false });
        render();
      };

      foundationEls[suit].ondragstart = top ? (e) => handleDragStart(e, foundationRef) : null;
      foundationEls[suit].ondragend = handleDragEnd;

      foundationEls[suit].ondragover = (e) => {
        e.preventDefault();
      };
      foundationEls[suit].ondrop = (e) => handleDropToFoundation(e, suit);
    });
  }

  function renderTableau() {
    tableauEl.innerHTML = "";

    for (let colIndex = 0; colIndex < 7; colIndex += 1) {
      const colWrap = document.createElement("div");
      colWrap.className = "solitaire-col";

      const col = state.tableau[colIndex];
      if (col.length === 0) {
        const placeholder = document.createElement("button");
        placeholder.type = "button";
        placeholder.className = "solitaire-tableau-card empty";
        placeholder.textContent = "";
        placeholder.addEventListener("click", () => {
          if (!state.started || state.roomLocked || state.autoClearing) return;
          if (!state.selected) {
            messageEl.textContent = "移動するカードを先に選択してください";
            render();
            return;
          }
          moveRefToTableau(state.selected, colIndex, { isRemote: false });
          render();
        });
        placeholder.addEventListener("dragover", (e) => {
          e.preventDefault();
        });
        placeholder.addEventListener("drop", (e) => {
          handleDropToTableau(e, colIndex);
        });
        colWrap.appendChild(placeholder);
      } else {
        col.forEach((card, idx) => {
          const cardBtn = document.createElement("button");
          cardBtn.type = "button";
          cardBtn.className = "solitaire-tableau-card";
          cardBtn.dataset.col = String(colIndex);
          cardBtn.dataset.idx = String(idx);
          const isTop = idx === col.length - 1;
          const showFace = card.faceUp && (!isRoomMode() || isTop);

          // Keep visual stacking deterministic: cards later in the column are always above earlier cards.
          cardBtn.style.zIndex = String(idx + 1);

          if (!showFace) {
            cardBtn.classList.add("card-back");
            cardBtn.textContent = "";
          } else {
            cardBtn.classList.add("card-face");
            if (!isTop) cardBtn.classList.add("stack-peek");
            cardBtn.textContent = cardText(card);
            if (isRed(card.suit)) cardBtn.classList.add("red");
          }

          if (
            showFace &&
            state.selected?.from === "tableau" &&
            state.selected.col === colIndex &&
            idx >= (state.selected.index ?? col.length - 1)
          ) {
            cardBtn.classList.add("selected");
          }

          const canDragStack = state.started && !state.roomLocked && showFace && isMovableTableauStack(colIndex, idx);
          cardBtn.draggable = Boolean(canDragStack);
          cardBtn.ondragstart = canDragStack ? (e) => handleDragStart(e, { from: "tableau", col: colIndex, index: idx }) : null;
          cardBtn.ondragend = handleDragEnd;
          cardBtn.addEventListener("dragover", (e) => {
            e.preventDefault();
          });
          cardBtn.addEventListener("drop", (e) => {
            handleDropToTableau(e, colIndex);
          });

          // Tune overlap for a finer stack while keeping enough card peek visible.
          cardBtn.style.marginTop = idx === 0 ? "0" : showFace ? "var(--solitaire-overlap-face)" : "var(--solitaire-overlap-back)";

          cardBtn.addEventListener("click", () => {
            if (!state.started || state.roomLocked || state.autoClearing) return;

            if (!showFace && isTop && !card.faceUp) {
              flipTableauTop(colIndex, { isRemote: false });
              render();
              return;
            }

            if (!showFace) return;

            const ref = { from: "tableau", col: colIndex, index: idx };

            if (consumeMobileDoubleTap(ref)) {
              if (canSelectRef(ref) && !tryAutoPlaceRef(ref, { isRemote: false })) {
                messageEl.textContent = "置ける場所がありません";
              }
              render();
              return;
            }

            if (state.selected && !sameRef(state.selected, ref)) {
              moveRefToTableau(state.selected, colIndex, { isRemote: false });
              render();
              return;
            }

            toggleSelectedRef(ref);

            render();
          });

          cardBtn.addEventListener("dblclick", () => {
            if (!state.started || state.roomLocked || state.autoClearing || !showFace) return;

            const ref = { from: "tableau", col: colIndex, index: idx };
            if (!canSelectRef(ref)) return;

            if (!tryAutoPlaceRef(ref, { isRemote: false })) {
              messageEl.textContent = "置ける場所がありません";
            }
            render();
          });

          colWrap.appendChild(cardBtn);
        });
      }

      tableauEl.appendChild(colWrap);
    }
  }

  function render() {
    hideResultModal();
    updateStalemateStatus();
    if (isRoomMode() && state.started && !state.roomRace.local.finished) {
      updateLocalRaceRecord();
    }
    foundationCountTextEl.textContent = `${foundationTotal()} / 52`;
    if (raceStatusEl) {
      raceStatusEl.textContent = roomDuelSummaryText();
    }
    renderTopRow();
    renderTableau();

    const active = state.started && !state.roomLocked && !state.autoClearing;
    stockEl.disabled = !active;
    wasteEl.disabled = !active;
    SUITS.forEach((suit) => {
      foundationEls[suit].disabled = !active;
    });
    resetBtn.disabled = !active || (isRoomMode() && state.roomRole !== "host");
    if (undoBtn) {
      const showUndo = canUseUndo();
      undoBtn.style.display = showUndo ? "" : "none";
      undoBtn.disabled = !showUndo || state.undoStack.length === 0;
    }
    if (autoClearBtn) {
      const canUse = canOfferAutoClear();
      autoClearBtn.disabled = !canUse;
      autoClearBtn.classList.toggle("active", canUse);
    }
    if (stalemateShuffleBtn) {
      const showShuffleToggle = !isRoomMode();
      stalemateShuffleBtn.style.display = showShuffleToggle ? "" : "none";
      stalemateShuffleBtn.disabled = !showShuffleToggle || state.started;
    }
    updateStalemateShuffleButton();
    startBtn.disabled = false;
  }

  function handleWasteClick() {
    if (!state.started || state.roomLocked || state.autoClearing) return;
    const top = state.waste[state.waste.length - 1];
    if (!top) return;

    const ref = { from: "waste" };
    if (consumeMobileDoubleTap(ref)) {
      if (!tryAutoPlaceRef(ref, { isRemote: false })) {
        messageEl.textContent = "置ける場所がありません";
      }
      render();
      return;
    }

    toggleSelectedRef(ref);
    render();
  }

  function handleWasteDoubleClick() {
    if (!state.started || state.roomLocked || state.autoClearing) return;
    const top = state.waste[state.waste.length - 1];
    if (!top) return;

    if (!tryAutoPlaceRef({ from: "waste" }, { isRemote: false })) {
      messageEl.textContent = "置ける場所がありません";
    }
    render();
  }

  function newGame({ fromRemote = false } = {}) {
    hideResultModal();

    if (isRoomMode()) {
      const layout = makeGuaranteedRoomLayout();
      state.stock = layout.stock;
      state.waste = layout.waste;
      state.foundations = layout.foundations;
      state.tableau = layout.tableau;
    } else {
      const deck = makeDeck();
      state.stock = deck;
      state.waste = [];
      state.foundations = { H: [], D: [], C: [], S: [] };
      state.tableau = Array.from({ length: 7 }, () => []);

      for (let col = 0; col < 7; col += 1) {
        for (let i = 0; i <= col; i += 1) {
          const card = state.stock.pop();
          card.faceUp = i === col;
          state.tableau[col].push(card);
        }
      }
    }
    state.started = true;
    state.stalemateSince = null;
    clearUndoStack();
    clearSelection();

    if (isRoomMode()) {
      if (!fromRemote) {
        state.roomRace.matchId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        state.roomRace.startAt = Date.now();
      }
      state.roomRace.resultShownForMatch = null;
      resetRaceRecords();
      updateLocalRaceRecord();
      reportRaceProgress({ force: true });
    }

    messageEl.textContent = isRoomMode()
      ? "対戦開始: クリア速度と手数で記録を競おう"
      : "カードを並べ替えて土台を完成させよう";
    render();

    if (isRoomMode() && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function resetCurrent() {
    if (!state.started || (isRoomMode() && state.roomRole !== "host")) return;
    const confirmed = window.confirm("RESETすると現在の進行は破棄されます。開始前に戻しますか？");
    if (!confirmed) {
      messageEl.textContent = "RESETをキャンセルしました";
      return;
    }
    enterStandby();
    messageEl.textContent = "開始前の状態に戻しました";
  }

  function applyRemoteMove(move) {
    if (!move || typeof move !== "object") return;
    if (move.type !== "race-progress") return;
    if (state.roomRace.matchId && move.matchId && move.matchId !== state.roomRace.matchId) return;

    state.roomRace.peer.foundation = Number.isFinite(move.foundation) ? move.foundation : 0;
    state.roomRace.peer.moves = Number.isFinite(move.moves) ? move.moves : 0;
    state.roomRace.peer.elapsedMs = Number.isFinite(move.elapsedMs) ? move.elapsedMs : 0;
    state.roomRace.peer.finished = Boolean(move.finished);
    state.roomRace.peer.result = typeof move.result === "string" ? move.result : "playing";

    updateRoomRaceMessage();
    if (raceStatusEl) {
      raceStatusEl.textContent = roomDuelSummaryText();
    }
  }

  function enterStandby() {
    hideResultModal();

    state.started = false;
    state.stalemateSince = null;
    state.roomLocked = false;
    state.roomLockMessage = "";
    state.roomRace.matchId = null;
    state.roomRace.startAt = null;
    state.roomRace.resultShownForMatch = null;
    resetRaceRecords();
    state.stock = [];
    state.waste = [];
    state.foundations = { H: [], D: [], C: [], S: [] };
    state.tableau = Array.from({ length: 7 }, () => []);
    clearUndoStack();
    clearSelection();
    messageEl.textContent = "GAME STARTで開始";
    render();
  }

  stockEl?.addEventListener("click", () => {
    if (moveDrawFromStock({ isRemote: false })) {
      render();
    }
  });
  wasteEl?.addEventListener("click", () => handleWasteClick());
  wasteEl?.addEventListener("dblclick", () => handleWasteDoubleClick());

  solitaireScreenEl?.addEventListener("pointerdown", () => {
    if (!state.started) return;
    if (!Number.isFinite(state.stalemateSince)) return;
    state.stalemateProbeCount += 1;
  });

  startBtn?.addEventListener("click", () => {
    if (state.started) {
      const confirmed = window.confirm("GAME STARTで再スタートします。現在の進行は破棄されます。続けますか？");
      if (!confirmed) {
        messageEl.textContent = "再スタートをキャンセルしました";
        return;
      }
    }
    newGame({ fromRemote: false });
  });
  resetBtn?.addEventListener("click", () => resetCurrent());
  undoBtn?.addEventListener("click", () => handleUndo());
  autoClearBtn?.addEventListener("click", async () => {
    await performAutoClear();
    render();
  });
  stalemateShuffleBtn?.addEventListener("click", () => {
    if (isRoomMode() || state.started) {
      messageEl.textContent = "詰み時シャッフル設定はゲーム開始前のみ変更できます";
      return;
    }
    state.stalemateShuffleMode = !state.stalemateShuffleMode;
    updateStalemateShuffleButton();
    messageEl.textContent = state.stalemateShuffleMode
      ? "詰み時シャッフルモードを有効にしました"
      : "詰み時シャッフルモードを無効にしました";
  });
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    if (isRoomMode()) {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });
  resultRetryBtn?.addEventListener("click", () => {
    hideResultModal();
    newGame({ fromRemote: false });
  });
  resultLobbyBtn?.addEventListener("click", () => {
    hideResultModal();
    if (isRoomMode()) {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });

  const stalemateTimerId = setInterval(() => {
    if (!state.started) return;
    const wasStarted = state.started;
    updateStalemateStatus();
    if (isRoomMode() && state.started && !state.roomRace.local.finished) {
      reportRaceProgress();
    }
    if (wasStarted && !state.started) {
      render();
    }
  }, 1000);

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => newGame({ fromRemote }),
    enterStandby,
    stop: () => {
      clearInterval(stalemateTimerId);
    },
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.roomCode = roomCode ?? null;
      state.roomRole = roomRole ?? null;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: state.roomCode, roomRole: state.roomRole });
      enterStandby();
      messageEl.textContent = "ホストの開始を待っています...";
      syncResultActionButtons();
      render();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.roomLocked = false;
      state.roomLockMessage = "";
      clearUndoStack();
      hideResultModal();
      syncResultActionButtons();
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      render();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
      } else if (isRoomMode() && state.started && !state.roomRace.local.finished) {
        messageEl.textContent = "対戦中: 記録を伸ばして相手を上回ろう";
      }
      render();
    },
    applyRemoteMove,
    getSnapshot: () => snapshotState(),
    applySnapshot: (snapshot) => {
      applySnapshotState(snapshot);
    },
  };
}
