const SUITS = ["H", "D", "C", "S"];
const RED_SUITS = new Set(["H", "D"]);
const STALEMATE_LIMIT_MS = 3 * 60 * 1000;

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
    selected: null,
    dragRef: null,
    stalemateSince: null,
  };

  function sameRef(a, b) {
    return Boolean(a && b && a.from === b.from && a.col === b.col && a.index === b.index);
  }

  function clearSelection() {
    state.selected = null;
  }

  function clearDragRef() {
    state.dragRef = null;
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

  function isRoomMode() {
    return state.gameMode === "room";
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
      messageEl.textContent = "対戦結果: あなたの勝ちです";
    } else if (cmp < 0) {
      messageEl.textContent = "対戦結果: 相手の勝ちです";
    } else {
      messageEl.textContent = "対戦結果: 引き分けです";
    }

    state.roomRace.resultShownForMatch = state.roomRace.matchId || "no-match";
  }

  function cardFromRef(ref) {
    if (!ref) return null;
    if (ref.from === "waste") return state.waste[state.waste.length - 1] || null;
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
    const moved = tryMoveRefToFoundation(ref, suit);
    if (!moved) return false;

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
    const moved = tryMoveRefToTableau(ref, colIndex);
    if (!moved) return false;

    if (!isRemote && isRoomMode()) {
      state.roomRace.local.moves += 1;
    }
    checkClear();
    if (!isRemote && isRoomMode()) {
      reportRaceProgress();
    }
    return true;
  }

  function moveDrawFromStock({ isRemote = false } = {}) {
    if (!state.started || (!isRemote && state.roomLocked)) return false;
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
    return true;
  }

  function flipTableauTop(colIndex, { isRemote = false } = {}) {
    const col = state.tableau[colIndex];
    if (!col || col.length === 0) return false;
    const top = col[col.length - 1];
    if (top.faceUp) return false;
    if (!state.started || (!isRemote && state.roomLocked)) return false;

    top.faceUp = true;
    messageEl.textContent = "カードをめくりました";
    if (!isRemote && isRoomMode()) {
      state.roomRace.local.moves += 1;
      reportRaceProgress();
    }
    return true;
  }

  function parseRefFromDataTransfer(e) {
    try {
      const raw = e.dataTransfer?.getData("text/plain");
      if (!raw) return null;
      const ref = JSON.parse(raw);
      if (!ref || (ref.from !== "waste" && ref.from !== "tableau")) return null;
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
    if (!state.started || state.roomLocked) {
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

  function hasAnyPlayableMove() {
    if (state.waste.length > 0) {
      const wasteTop = state.waste[state.waste.length - 1];
      if (canCardMoveSomewhere(wasteTop)) return true;
    }

    for (let col = 0; col < 7; col += 1) {
      const cards = state.tableau[col];
      for (let idx = 0; idx < cards.length; idx += 1) {
        if (!isMovableTableauStack(col, idx)) continue;
        const head = cards[idx];

        for (const suit of SUITS) {
          if (idx === cards.length - 1 && canMoveToFoundation(head, suit)) return true;
        }

        for (let toCol = 0; toCol < 7; toCol += 1) {
          if (toCol === col) continue;
          if (canMoveToTableau(head, toCol)) return true;
        }
      }
    }

    return false;
  }

  function hasPotentialMoveAfterWasteRecycle() {
    if (state.stock.length > 0) return true;
    if (state.waste.length === 0) return false;

    for (let i = 0; i < state.waste.length; i += 1) {
      if (canCardMoveSomewhere(state.waste[i])) return true;
    }
    return false;
  }

  function isStalemateState() {
    if (!state.started) return false;
    if (foundationTotal() === 52) return false;
    if (hasAnyPlayableMove()) return false;
    return !hasPotentialMoveAfterWasteRecycle();
  }

  function gameOverFromStalemate({ isRemote = false } = {}) {
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
      messageEl.textContent = "ゲームオーバー: 3分以上詰み状態が続きました";
    }
  }

  function updateStalemateStatus() {
    if (!state.started) {
      state.stalemateSince = null;
      return;
    }

    if (!isStalemateState()) {
      state.stalemateSince = null;
      return;
    }

    const now = Date.now();
    if (!state.stalemateSince) {
      state.stalemateSince = now;
      messageEl.textContent = "詰み状態です。3分でゲームオーバーになります";
      return;
    }

    if (now - state.stalemateSince >= STALEMATE_LIMIT_MS) {
      gameOverFromStalemate({ isRemote: false });
    }
  }

  function checkClear() {
    if (foundationTotal() === 52) {
      state.started = false;
      state.stalemateSince = null;
      clearSelection();
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
    renderCard(stockEl, state.stock[state.stock.length - 1], {
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
      renderCard(foundationEls[suit], top, {
        emptyText: suitSymbol(suit),
      });

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
          if (!state.started || state.roomLocked) return;
          messageEl.textContent = "ドラッグして移動してください";
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

          if (!card.faceUp) {
            cardBtn.classList.add("card-back");
            cardBtn.textContent = "";
          } else {
            cardBtn.classList.add("card-face");
            cardBtn.textContent = cardText(card);
            if (isRed(card.suit)) cardBtn.classList.add("red");
          }

          if (
            card.faceUp &&
            state.selected?.from === "tableau" &&
            state.selected.col === colIndex &&
            idx >= (state.selected.index ?? col.length - 1)
          ) {
            cardBtn.classList.add("selected");
          }

          const canDragStack = state.started && !state.roomLocked && card.faceUp && isMovableTableauStack(colIndex, idx);
          cardBtn.draggable = Boolean(canDragStack);
          cardBtn.ondragstart = canDragStack ? (e) => handleDragStart(e, { from: "tableau", col: colIndex, index: idx }) : null;
          cardBtn.ondragend = handleDragEnd;
          cardBtn.addEventListener("dragover", (e) => {
            e.preventDefault();
          });
          cardBtn.addEventListener("drop", (e) => {
            handleDropToTableau(e, colIndex);
          });

          cardBtn.style.marginTop = idx === 0 ? "0" : card.faceUp ? "-76px" : "-88px";

          cardBtn.addEventListener("click", () => {
            if (!state.started || state.roomLocked) return;

            const isTop = idx === col.length - 1;

            if (!card.faceUp && isTop) {
              flipTableauTop(colIndex, { isRemote: false });
              render();
              return;
            }

            if (!card.faceUp) return;

            const ref = { from: "tableau", col: colIndex, index: idx };
            const suit = isTop ? findFoundationSuit(ref) : null;
            if (isTop && suit) {
              moveRefToFoundation(ref, suit, { isRemote: false });
            } else {
              messageEl.textContent = "ドラッグして移動してください";
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

    const active = state.started && !state.roomLocked;
    stockEl.disabled = !active;
    wasteEl.disabled = !active;
    SUITS.forEach((suit) => {
      foundationEls[suit].disabled = !active;
    });
    resetBtn.disabled = !active || (isRoomMode() && state.roomRole !== "host");
    startBtn.disabled = false;
  }

  function handleWasteClick() {
    if (!state.started || state.roomLocked) return;
    const top = state.waste[state.waste.length - 1];
    if (!top) return;

    const suit = findFoundationSuit({ from: "waste" });
    if (suit) {
      moveRefToFoundation({ from: "waste" }, suit, { isRemote: false });
    } else {
      messageEl.textContent = "ドラッグして移動してください";
    }
    render();
  }

  function newGame({ fromRemote = false } = {}) {
    hideResultModal();

    const deck = makeDeck();
    state.stock = deck;
    state.waste = [];
    state.foundations = { H: [], D: [], C: [], S: [] };
    state.tableau = Array.from({ length: 7 }, () => []);
    state.started = true;
    state.stalemateSince = null;
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

    for (let col = 0; col < 7; col += 1) {
      for (let i = 0; i <= col; i += 1) {
        const card = state.stock.pop();
        card.faceUp = i === col;
        state.tableau[col].push(card);
      }
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
    newGame({ fromRemote: false });
    messageEl.textContent = "リセットしました";
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
    render();
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

  startBtn?.addEventListener("click", () => {
    newGame({ fromRemote: false });
  });
  resetBtn?.addEventListener("click", () => resetCurrent());
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
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
    getSnapshot: () => ({
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
    }),
    applySnapshot: (snapshot) => {
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
    },
  };
}
