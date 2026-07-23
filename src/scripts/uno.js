const COLORS = ["red", "yellow", "green", "blue"];

function unoLang() {
  const langSelectEl = document.getElementById("langSelect");
  return langSelectEl?.value === "ko" ? "ko" : "ja";
}

function unoText(key, vars = {}) {
  const dict = {
    ja: {
      player: "PLAYER",
      turn: "TURN",
      yourTurn: "あなたの手番です",
      opponentTurn: "相手の手番です",
      cpuTurn: "CPUの手番です",
      playable: "出せる枚数",
      select: "選択",
      startHint: "ゲーム開始で開始します。",
      restartHint: "ゲーム終了。次はゲーム開始で再開できます。",
      pickWild: "WILDの色を選んで確定してください。",
      waitingPeer: "対戦相手を待機中です。",
      multiPlayHint: "複数枚出し中: 同じ値のカードを選び、プレイ。終了はターン終了。",
      selectedHint: "選択中のカードを出すにはプレイ、変更は別カードを選択してください。",
      noPlayableHint: "出せるカードがありません。ドローを押してください。",
      pickCardHint: "出すカードを選択してプレイを押してください。",
      pickWildShort: "WILDの色を選んでください",
      turnEnd: "ターン終了",
      draw: "ドロー",
      unoCall: "{player}: UNO!",
      noNumberFinish: "{player} は数字カード以外で上がれないため2枚ドロー",
      chainPossible: "同じカードを連続で出せます",
      chainPossibleWithUno: "{uno} / 同じカードを連続で出せます",
      drewOne: "{player} が1枚引きました",
      noDeck: "山札がありません",
      cpuDrewAndPlayed: "CPUが1枚引いて出しました",
      cpuDrewOne: "CPUが1枚引きました",
      standby: "ゲーム開始を押してください",
      backConfirm: "ゲーム一覧に戻りますか？",
      roomWaitingLocked: "対戦相手を待機中...",
      win: "勝ち",
      lose: "負け",
    },
    ko: {
      player: "플레이어",
      turn: "턴",
      yourTurn: "당신의 턴입니다",
      opponentTurn: "상대 턴입니다",
      cpuTurn: "CPU 턴입니다",
      playable: "플레이 가능",
      select: "선택",
      startHint: "게임 시작 버튼으로 시작합니다.",
      restartHint: "게임 종료. 다음 게임 시작으로 다시 시작할 수 있습니다.",
      pickWild: "WILD 색상을 선택해 확정하세요.",
      waitingPeer: "상대를 기다리는 중입니다.",
      multiPlayHint: "연속 출중: 같은 숫자 카드를 선택해 플레이, 종료는 턴 종료.",
      selectedHint: "선택한 카드를 내려면 플레이, 변경하려면 다른 카드를 선택하세요.",
      noPlayableHint: "낼 수 있는 카드가 없습니다. 드로우를 누르세요.",
      pickCardHint: "낼 카드를 고르고 플레이를 누르세요.",
      pickWildShort: "WILD 색상을 선택하세요",
      turnEnd: "턴 종료",
      draw: "드로우",
      unoCall: "{player}: UNO!",
      noNumberFinish: "{player} 는 숫자 카드가 아니라서 2장을 드로우합니다",
      chainPossible: "같은 카드를 연속으로 낼 수 있습니다",
      chainPossibleWithUno: "{uno} / 같은 카드를 연속으로 낼 수 있습니다",
      drewOne: "{player} 가 1장을 뽑았습니다",
      noDeck: "덱이 비었습니다",
      cpuDrewAndPlayed: "CPU가 1장을 뽑아 바로 냈습니다",
      cpuDrewOne: "CPU가 1장을 뽑았습니다",
      standby: "게임 시작을 눌러주세요",
      backConfirm: "게임 목록으로 돌아갈까요?",
      roomWaitingLocked: "상대를 기다리는 중...",
      win: "승리",
      lose: "패배",
    },
  };

  let text = dict[unoLang()][key] || dict.ja[key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replaceAll(`{${k}}`, String(v));
  });
  return text;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function makeDeck(options = {}) {
  const numberMin = Number.isInteger(options.numberMin) ? options.numberMin : 0;
  const numberMax = Number.isInteger(options.numberMax) ? options.numberMax : 9;
  const hasZero = numberMin <= 0 && numberMax >= 0;
  const startNumber = Math.max(1, numberMin);
  const endNumber = Math.min(9, numberMax);

  const deck = [];

  COLORS.forEach((color) => {
    if (hasZero) {
      deck.push({ color, kind: "number", value: 0 });
    }

    for (let n = startNumber; n <= endNumber; n += 1) {
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
  if (color === "red") return unoLang() === "ko" ? "빨강" : "赤";
  if (color === "yellow") return unoLang() === "ko" ? "노랑" : "黄";
  if (color === "green") return unoLang() === "ko" ? "초록" : "緑";
  if (color === "blue") return unoLang() === "ko" ? "파랑" : "青";
  return "-";
}

function nextPlayerIndex(current, direction, playerCount) {
  if (!Number.isInteger(playerCount) || playerCount <= 0) return 0;
  return (current + direction + playerCount) % playerCount;
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
  const playBtn = document.getElementById("unoPlayBtn");
  const drawBtn = document.getElementById("unoDrawBtn");
  const playableCountEl = document.getElementById("unoPlayableCount");
  const selectedTextEl = document.getElementById("unoSelectedText");
  const actionHintEl = document.getElementById("unoActionHint");
  const menuBtn = document.getElementById("unoMenuBtn");
  const modeSelect = document.getElementById("unoModeSelect");
  const humanCountSelect = document.getElementById("unoHumanCountSelect");
  const cpuCountSelect = document.getElementById("unoCpuCountSelect");
  const turnBannerEl = document.getElementById("unoTurnBanner");
  const colorPickerEl = document.getElementById("unoColorPicker");
  const colorCancelBtn = document.getElementById("unoColorCancelBtn");
  const colorChipEls = colorPickerEl ? [...colorPickerEl.querySelectorAll("[data-uno-color]")] : [];

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
    pendingWildPick: null,
    turnBannerTimeoutId: null,
    multiPlayValue: null,
    multiPlayPlayer: null,
    selectedHandIndices: [],
    humanCount: 1,
    cpuCount: 1,
    viewerPlayerIndex: 0,
  };

  function getPlayerCount() {
    if (isRoomMode()) return 2;
    const human = Math.max(1, state.humanCount);
    const cpu = Math.max(0, state.cpuCount);
    return Math.max(2, Math.min(8, human + cpu));
  }

  function isCpuPlayer(playerIndex) {
    if (isRoomMode()) return false;
    return playerIndex >= state.humanCount;
  }

  function normalizeStandardSettings(humanCount, cpuCount) {
    let humans = Number.isInteger(humanCount) ? humanCount : Number.parseInt(String(humanCount || ""), 10);
    let cpus = Number.isInteger(cpuCount) ? cpuCount : Number.parseInt(String(cpuCount || ""), 10);

    if (!Number.isFinite(humans)) humans = 1;
    if (!Number.isFinite(cpus)) cpus = 1;

    humans = Math.max(1, Math.min(8, humans));
    cpus = Math.max(0, Math.min(7, cpus));

    if (state.mode === "cpu") {
      humans = Math.max(1, Math.min(7, humans));
      cpus = Math.max(1, cpus);
    } else {
      cpus = 0;
      humans = Math.max(2, humans);
    }

    while (humans + cpus > 8) {
      if (cpus > 0) {
        cpus -= 1;
      } else {
        humans -= 1;
      }
    }

    while (humans + cpus < 2) {
      cpus += 1;
    }

    return { humans, cpus };
  }

  function syncStandardSelects() {
    if (humanCountSelect) {
      humanCountSelect.value = String(state.humanCount);
      humanCountSelect.disabled = isRoomMode();
    }
    if (cpuCountSelect) {
      cpuCountSelect.value = String(state.cpuCount);
      cpuCountSelect.disabled = isRoomMode() || state.mode === "local";
    }
  }

  function isCpuMode() {
    return state.mode === "cpu";
  }

  function isRoomMode() {
    return state.mode === "room";
  }

  function isCpuTurn() {
    return !isRoomMode() && isCpuPlayer(state.currentPlayer);
  }

  function isLocalPlayersTurn() {
    if (isRoomMode()) return state.currentPlayer === state.roomPlayerIndex;
    return !isCpuTurn();
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

  function getViewerIndex() {
    if (isRoomMode()) return state.roomPlayerIndex;
    return Math.max(0, Math.min(getPlayerCount() - 1, state.viewerPlayerIndex));
  }

  function playerNameFor(playerIndex) {
    if (isRoomMode()) {
      return playerIndex === state.roomPlayerIndex ? (unoLang() === "ko" ? "당신" : "あなた") : (unoLang() === "ko" ? "상대" : "相手");
    }
    if (isCpuPlayer(playerIndex)) {
      return "CPU";
    }
    if (state.humanCount === 1 && getPlayerCount() === 2) {
      return playerIndex === 0 ? (unoLang() === "ko" ? "당신" : "あなた") : "CPU";
    }
    return `${unoText("player")} ${playerIndex + 1}`;
  }

  function outcomeTextForWinner(winnerIndex) {
    const playerCount = getPlayerCount();
    if (playerCount === 2) {
      const loserIndex = winnerIndex === 0 ? 1 : 0;
      return `${playerNameFor(winnerIndex)}: ${unoText("win")} / ${playerNameFor(loserIndex)}: ${unoText("lose")}`;
    }
    return `${playerNameFor(winnerIndex)}: ${unoText("win")}`;
  }

  function canPlayCard(card) {
    if (!state.started || state.gameOver) return false;

    const top = state.discard[state.discard.length - 1];
    if (!top) return false;

    if (state.multiPlayValue !== null) {
      if (state.currentPlayer !== state.multiPlayPlayer) return false;
      if (card.kind === "wild") return false;
      return card.value === state.multiPlayValue;
    }

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
    turnTextEl.textContent = `${unoText("player")} ${state.currentPlayer + 1}`;
    colorTextEl.textContent = colorText(state.currentColor);
    colorTextEl.className = "uno-color-value";
    if (state.currentColor && COLORS.includes(state.currentColor)) {
      colorTextEl.classList.add(state.currentColor);
    }
    deckCountEl.textContent = String(state.deck.length);
    p1CountEl.textContent = String(state.hands[0]?.length ?? 0);
    p2CountEl.textContent = String(state.hands[1]?.length ?? 0);
    if (resultTextEl) resultTextEl.textContent = state.resultText;
  }

  function setResultText(text) {
    state.resultText = text;
    if (resultTextEl) resultTextEl.textContent = text;
  }

  function showTurnBanner(playerIndex) {
    if (!turnBannerEl) return;
    turnBannerEl.textContent = `${unoText("player")} ${playerIndex + 1} ${unoText("turn")}`;
    turnBannerEl.classList.remove("active");
    void turnBannerEl.offsetWidth;
    turnBannerEl.classList.add("active");

    if (state.turnBannerTimeoutId) {
      clearTimeout(state.turnBannerTimeoutId);
    }
    state.turnBannerTimeoutId = window.setTimeout(() => {
      turnBannerEl.classList.remove("active");
      state.turnBannerTimeoutId = null;
    }, 900);
  }

  function closeWildColorPicker({ keepMessage = false, renderAfter = true } = {}) {
    state.pendingWildPick = null;
    if (colorPickerEl) {
      colorPickerEl.classList.remove("active");
      colorPickerEl.classList.add("hidden");
    }
    if (!keepMessage && state.started && !state.gameOver && !state.roomLocked) {
      messageEl.textContent = `${unoText("player")} ${state.currentPlayer + 1} ${unoLang() === "ko" ? "턴" : "の手番"}`;
    }
    if (renderAfter) render();
  }

  function clearMultiPlay() {
    state.multiPlayValue = null;
    state.multiPlayPlayer = null;
  }

  function clearSelectedCard() {
    state.selectedHandIndices = [];
  }

  function updateActionPanel(viewerIndex, canControlHand) {
    const viewerHand = state.hands[viewerIndex] || [];
    const playableCount = canControlHand ? viewerHand.filter((card) => canPlayCard(card)).length : 0;
    if (playableCountEl) {
      playableCountEl.textContent = `${unoText("playable")}: ${playableCount}`;
    }

    const selectedCards = state.selectedHandIndices
      .map((index) => viewerHand[index])
      .filter(Boolean);
    if (selectedTextEl) {
      selectedTextEl.textContent = selectedCards.length > 0
        ? `${unoText("select")}: ${selectedCards.length}${unoLang() === "ko" ? "장" : "枚"}`
        : `${unoText("select")}: -`;
    }

    if (!actionHintEl) return;
    if (!state.started) {
      actionHintEl.textContent = unoText("startHint");
      return;
    }
    if (state.gameOver) {
      actionHintEl.textContent = unoText("restartHint");
      return;
    }
    if (state.pendingWildPick) {
      actionHintEl.textContent = unoText("pickWild");
      return;
    }
    if (state.roomLocked) {
      actionHintEl.textContent = state.roomLockMessage || unoText("waitingPeer");
      return;
    }
    if (isCpuTurn() || !isLocalPlayersTurn()) {
      actionHintEl.textContent = unoLang() === "ko" ? "상대 턴입니다. 잠시만 기다려주세요." : "相手の手番です。しばらくお待ちください。";
      return;
    }
    if (state.multiPlayValue !== null && state.currentPlayer === state.multiPlayPlayer) {
      actionHintEl.textContent = unoText("multiPlayHint");
      return;
    }
    if (selectedCards.length > 0) {
      actionHintEl.textContent = unoText("selectedHint");
      return;
    }
    if (playableCount <= 0) {
      actionHintEl.textContent = unoText("noPlayableHint");
      return;
    }
    actionHintEl.textContent = unoText("pickCardHint");
  }

  function openWildColorPicker(handIndex, playerIndex) {
    if (!colorPickerEl) return false;
    state.pendingWildPick = { handIndex, playerIndex };
    colorPickerEl.classList.remove("hidden");
    window.requestAnimationFrame(() => colorPickerEl.classList.add("active"));
    messageEl.textContent = unoText("pickWildShort");
    render();
    return true;
  }

  function resultByMode(winnerIndex) {
    return outcomeTextForWinner(winnerIndex);
  }

  function renderHands() {
    opponentHandEl.innerHTML = "";
    playerHandEl.innerHTML = "";

    const viewerIndex = getViewerIndex();
    const canControlHand = !state.roomLocked && !isCpuTurn() && isLocalPlayersTurn() && !state.pendingWildPick;
    if (!canControlHand) {
      clearSelectedCard();
    }

    state.selectedHandIndices = state.selectedHandIndices
      .filter((index) => Number.isInteger(index) && index >= 0 && index < state.hands[viewerIndex].length)
      .filter((index) => canPlayCard(state.hands[viewerIndex][index]));
    if (!(state.multiPlayValue !== null && state.currentPlayer === state.multiPlayPlayer) && state.selectedHandIndices.length > 1) {
      state.selectedHandIndices = [state.selectedHandIndices[0]];
    }

    const playerCount = getPlayerCount();
    for (let p = 0; p < playerCount; p += 1) {
      if (p === viewerIndex) continue;

      const stack = document.createElement("div");
      stack.className = "uno-opponent-stack";

      const stackLabel = document.createElement("span");
      stackLabel.className = "uno-opponent-label";
      stackLabel.textContent = `P${p + 1} (${state.hands[p]?.length ?? 0})`;
      if (p === state.currentPlayer) {
        stackLabel.classList.add("active");
      }
      stack.appendChild(stackLabel);

      const backWrap = document.createElement("div");
      backWrap.className = "uno-opponent-cards";
      const oppCount = state.hands[p]?.length ?? 0;
      const displayCount = Math.min(oppCount, 12);
      backWrap.style.setProperty("--hand-count", String(displayCount));
      for (let i = 0; i < displayCount; i += 1) {
        const back = document.createElement("span");
        back.className = "uno-card-mini back";
        back.textContent = "UNO";
        back.style.setProperty("--tilt", `${(i % 7) * 2 - 6}deg`);
        back.style.setProperty("--fan-x", `${(i - (displayCount - 1) / 2) * 7}px`);
        back.setAttribute("aria-hidden", "true");
        backWrap.appendChild(back);
      }
      stack.appendChild(backWrap);
      opponentHandEl.appendChild(stack);
    }

    const viewerHandCount = state.hands[viewerIndex].length;
    playerHandEl.style.setProperty("--hand-count", String(viewerHandCount));
    state.hands[viewerIndex].forEach((card, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      const baseClass = card.kind === "wild" ? "wild" : card.color;
      const playable = canControlHand && canPlayCard(card);
      const selected = state.selectedHandIndices.includes(index);
      const firstSelectedIndex = state.selectedHandIndices[0];
      const firstSelectedCard = Number.isInteger(firstSelectedIndex) ? state.hands[viewerIndex][firstSelectedIndex] : null;
      const chainSelectable =
        canControlHand &&
        !playable &&
        !selected &&
        state.multiPlayValue === null &&
        firstSelectedCard?.kind === "number" &&
        card.kind === "number" &&
        firstSelectedCard.value === card.value;
      btn.className = `uno-card ${baseClass}${playable ? " playable" : ""}${chainSelectable ? " chain-selectable" : ""}${selected ? " selected" : ""}`;
      btn.textContent = cardLabel(card);
      btn.dataset.rank = cardLabel(card);
      btn.title = `${card.kind === "wild" ? "WILD" : colorText(card.color)} ${cardLabel(card)}`;
      btn.setAttribute("aria-label", btn.title);
      btn.style.setProperty("--card-index", String(index));
      btn.style.setProperty("--card-total", String(viewerHandCount));
      const centerOffset = index - (viewerHandCount - 1) / 2;
      const fanAngle = centerOffset * 3.2;
      const fanLift = Math.abs(centerOffset) * 2.2 + 2;
      btn.style.setProperty("--fan-angle", `${fanAngle}deg`);
      btn.style.setProperty("--fan-lift", `${fanLift}px`);
      btn.disabled = !(playable || chainSelectable);
      btn.addEventListener("click", () => {
        if (!(playable || chainSelectable)) return;

        // Current HTML has no explicit play button, so playable cards are committed on click.
        if (!playBtn && playable) {
          clearSelectedCard();
          playCard(index);
          return;
        }

        const exists = state.selectedHandIndices.includes(index);
        const allowMultiSelect = state.multiPlayValue !== null && state.currentPlayer === state.multiPlayPlayer;
        if (allowMultiSelect) {
          state.selectedHandIndices = exists
            ? state.selectedHandIndices.filter((entry) => entry !== index)
            : [...state.selectedHandIndices, index].sort((a, b) => a - b);
        } else {
          if (exists) {
            state.selectedHandIndices = [];
          } else if (state.selectedHandIndices.length <= 0) {
            state.selectedHandIndices = [index];
          } else {
            const anchor = state.hands[viewerIndex][state.selectedHandIndices[0]];
            const canPairWithAnchor =
              anchor?.kind === "number" && card.kind === "number" && anchor.value === card.value;
            if (canPairWithAnchor) {
              state.selectedHandIndices = [...state.selectedHandIndices, index].sort((a, b) => a - b);
            } else {
              state.selectedHandIndices = [index];
            }
          }
        }
        render();
      });
      playerHandEl.appendChild(btn);
    });

    updateActionPanel(viewerIndex, canControlHand);
  }

  function playSelectedCard() {
    if (!Array.isArray(state.selectedHandIndices) || state.selectedHandIndices.length <= 0) return;

    const actorIndex = state.currentPlayer;
    const selectedRefs = state.selectedHandIndices
      .map((index) => state.hands[actorIndex]?.[index])
      .filter(Boolean);
    clearSelectedCard();
    if (selectedRefs.length <= 0) return;

    for (let i = 0; i < selectedRefs.length; i += 1) {
      const card = selectedRefs[i];
      if (state.gameOver || !state.started) break;
      if (state.currentPlayer !== actorIndex) break;
      if (i > 0 && (state.multiPlayValue === null || state.multiPlayPlayer !== actorIndex)) break;
      const index = state.hands[actorIndex].indexOf(card);
      if (index < 0) continue;
      playCard(index);
    }
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

    drawBtn.disabled = !state.started || state.gameOver || state.roomLocked || isCpuTurn() || !isLocalPlayersTurn() || Boolean(state.pendingWildPick);
    if (playBtn) {
      const viewerIndex = getViewerIndex();
      const leadIndex = state.selectedHandIndices[0];
      const leadCard = Number.isInteger(leadIndex) ? state.hands[viewerIndex]?.[leadIndex] : null;
      const canPlaySelected =
        state.started &&
        !state.gameOver &&
        !state.roomLocked &&
        !isCpuTurn() &&
        isLocalPlayersTurn() &&
        !state.pendingWildPick &&
        state.selectedHandIndices.length > 0 &&
        Boolean(leadCard) &&
        canPlayCard(leadCard);
      playBtn.disabled = !canPlaySelected;
    }
    if (drawBtn) {
      drawBtn.textContent = state.multiPlayValue !== null && state.currentPlayer === state.multiPlayPlayer ? unoText("turnEnd") : unoText("draw");
    }
    if (modeSelect) {
      modeSelect.disabled = isRoomMode();
    }
    syncStandardSelects();
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

  function advanceTurn(skip = false) {
    const steps = skip ? 2 : 1;
    const playerCount = getPlayerCount();
    for (let i = 0; i < steps; i += 1) {
      state.currentPlayer = nextPlayerIndex(state.currentPlayer, state.direction, playerCount);
    }
    if (!isRoomMode() && !isCpuPlayer(state.currentPlayer)) {
      state.viewerPlayerIndex = state.currentPlayer;
    }
  }

  function endAsWinner(playerIndex) {
    state.gameOver = true;
    closeWildColorPicker({ keepMessage: true, renderAfter: false });
    clearMultiPlay();
    clearSelectedCard();
    const outcomeText = outcomeTextForWinner(playerIndex);
    setResultText(resultByMode(playerIndex));
    messageEl.textContent = outcomeText;
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
    if (!isRemote && isRoomMode() && !isLocalPlayersTurn()) return;

    const actorIndex = state.currentPlayer;
    clearSelectedCard();

    const hand = state.hands[actorIndex];
    const card = hand[handIndex];
    if (!card || !canPlayCard(card)) return;

    if (
      card.kind === "wild" &&
      !(selectedColor && COLORS.includes(selectedColor)) &&
      !isCpuPlayer(actorIndex)
    ) {
      if (!isRemote && openWildColorPicker(handIndex, actorIndex)) return;
    }

    closeWildColorPicker({ keepMessage: true, renderAfter: false });

    hand.splice(handIndex, 1);
    state.discard.push(card);
    const unoCall = hand.length === 1 ? unoText("unoCall", { player: `${unoText("player")} ${actorIndex + 1}` }) : "";

    if (card.kind === "wild") {
      if (selectedColor && COLORS.includes(selectedColor)) {
        state.currentColor = selectedColor;
      } else if (isCpuPlayer(actorIndex)) {
        state.currentColor = chooseBestColorForPlayer(actorIndex);
      } else {
        state.currentColor = "red";
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
      if (card.kind === "number") {
        endAsWinner(actorIndex);
        return;
      }

      for (let i = 0; i < 2; i += 1) {
        const drawn = drawFromDeck();
        if (drawn) hand.push(drawn);
      }
      sortHand(hand);
      messageEl.textContent = unoText("noNumberFinish", { player: `${unoText("player")} ${actorIndex + 1}` });
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
        const target = nextPlayerIndex(actorIndex, state.direction, getPlayerCount());
        for (let i = 0; i < 2; i += 1) {
          const drawn = drawFromDeck();
          if (drawn) state.hands[target].push(drawn);
        }
        sortHand(state.hands[target]);
        skipNext = true;
      }
    }

    if (card.kind === "wild" && card.value === "wild4") {
      const target = nextPlayerIndex(actorIndex, state.direction, getPlayerCount());
      for (let i = 0; i < 4; i += 1) {
        const drawn = drawFromDeck();
        if (drawn) state.hands[target].push(drawn);
      }
      sortHand(state.hands[target]);
      skipNext = true;
    }

    const hasSameValueChain = hand.some((nextCard) => nextCard.kind !== "wild" && nextCard.value === card.value);
    if (!skipNext && hasSameValueChain) {
      state.multiPlayValue = card.value;
      state.multiPlayPlayer = actorIndex;
      messageEl.textContent = unoCall
        ? unoText("chainPossibleWithUno", { uno: unoCall })
        : unoText("chainPossible");
      render();
      if (isCpuPlayer(actorIndex)) {
        scheduleCpuTurn();
      }
      return;
    }

    clearMultiPlay();
    clearSelectedCard();

    advanceTurn(skipNext);
    messageEl.textContent = unoCall
      ? `${unoCall} / ${unoText("player")} ${state.currentPlayer + 1} ${unoLang() === "ko" ? "턴" : "の手番"}`
      : `${unoText("player")} ${state.currentPlayer + 1} ${unoLang() === "ko" ? "턴" : "の手番"}`;
    render();
    showTurnBanner(state.currentPlayer);

    scheduleCpuTurn();
  }

  function drawCardAndPass(opts = {}) {
    const isRemote = Boolean(opts.isRemote);

    if (!state.started || state.gameOver) return;
    if (state.roomLocked) return;
    if (state.pendingWildPick) return;
    if (!isRemote && !isLocalPlayersTurn()) return;
    if (isCpuTurn()) return;

    if (state.multiPlayValue !== null && state.currentPlayer === state.multiPlayPlayer) {
      clearMultiPlay();
      clearSelectedCard();
      advanceTurn(false);
      messageEl.textContent = `${unoText("player")} ${state.currentPlayer + 1} ${unoLang() === "ko" ? "턴" : "の手番"}`;
      render();
      showTurnBanner(state.currentPlayer);

      if (isRoomMode() && !isRemote) {
        options.onRoomMove?.({ type: "draw-pass" });
      }

      scheduleCpuTurn();
      return;
    }

    const drawn = drawFromDeck();
    if (drawn) {
      state.hands[state.currentPlayer].push(drawn);
      sortHand(state.hands[state.currentPlayer]);
      messageEl.textContent = unoText("drewOne", { player: `${unoText("player")} ${state.currentPlayer + 1}` });
    } else {
      messageEl.textContent = unoText("noDeck");
    }

    clearMultiPlay();
    clearSelectedCard();
    advanceTurn(false);
    render();
    showTurnBanner(state.currentPlayer);

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ type: "draw-pass" });
    }

    scheduleCpuTurn();
  }

  function runCpuTurn() {
    if (!isCpuTurn() || !state.started || state.gameOver) return;

    const cpuIndex = state.currentPlayer;
    const cpuHand = state.hands[cpuIndex];
    if (!Array.isArray(cpuHand)) return;
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
        messageEl.textContent = unoText("cpuDrewAndPlayed");
        playCard(drawnIndex);
        return;
      }
      messageEl.textContent = unoText("cpuDrewOne");
    } else {
      messageEl.textContent = unoText("noDeck");
    }

    advanceTurn(false);
    render();
    showTurnBanner(state.currentPlayer);
    scheduleCpuTurn();
  }

  function buildInitialState({ fromRemote = false } = {}) {
    const totalPlayers = getPlayerCount();
    const useLocalTwoPlayerNumbers = state.mode === "local" && state.humanCount === 2 && state.cpuCount === 0;
    state.deck = makeDeck(
      useLocalTwoPlayerNumbers
        ? {
            numberMin: 1,
            numberMax: 5,
          }
        : undefined
    );
    state.discard = [];
    state.hands = Array.from({ length: totalPlayers }, () => []);
    state.currentPlayer = 0;
    state.direction = 1;
    state.currentColor = null;
    state.started = true;
    state.gameOver = false;
    state.viewerPlayerIndex = 0;
    clearMultiPlay();
    clearSelectedCard();
    closeWildColorPicker({ keepMessage: true, renderAfter: false });
    setResultText("-");

    for (let p = 0; p < totalPlayers; p += 1) {
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

    messageEl.textContent = `${unoText("player")} 1 ${unoLang() === "ko" ? "턴" : "の手番"}`;
    render();
    showTurnBanner(state.currentPlayer);
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
    if (state.turnBannerTimeoutId) {
      clearTimeout(state.turnBannerTimeoutId);
      state.turnBannerTimeoutId = null;
    }
    if (turnBannerEl) {
      turnBannerEl.classList.remove("active");
    }
    state.started = false;
    state.gameOver = true;
    state.deck = [];
    state.discard = [];
    state.hands = Array.from({ length: getPlayerCount() }, () => []);
    state.currentPlayer = 0;
    state.direction = 1;
    state.currentColor = null;
    state.viewerPlayerIndex = 0;
    state.roomLocked = false;
    state.roomLockMessage = "";
    clearMultiPlay();
    clearSelectedCard();
    closeWildColorPicker({ keepMessage: true, renderAfter: false });
    setResultText("-");
    messageEl.textContent = unoText("standby");
    render();
  }

  colorChipEls.forEach((chipEl) => {
    chipEl.addEventListener("click", () => {
      const picked = chipEl.dataset.unoColor;
      if (!picked || !COLORS.includes(picked)) return;
      const pending = state.pendingWildPick;
      if (!pending) return;
      if (pending.playerIndex !== state.currentPlayer) return;
      closeWildColorPicker({ keepMessage: true, renderAfter: false });
      playCard(pending.handIndex, { selectedColor: picked });
    });
  });

  colorCancelBtn?.addEventListener("click", () => {
    if (!state.pendingWildPick) return;
    const pendingIndex = state.pendingWildPick.handIndex;
    closeWildColorPicker({ keepMessage: false, renderAfter: true });
    state.selectedHandIndices = Number.isInteger(pendingIndex) ? [pendingIndex] : [];
    render();
  });

  startBtn?.addEventListener("click", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    buildInitialState({ fromRemote: false });
  });
  playBtn?.addEventListener("click", () => playSelectedCard());
  drawBtn?.addEventListener("click", () => drawCardAndPass());
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm(unoText("backConfirm"));
    if (!confirmed) return;
    if (isRoomMode()) {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });
  modeSelect?.addEventListener("change", () => {
    const nextMode = modeSelect.value === "local" ? "local" : "cpu";

    if (nextMode === "local") {
      state.humanCount = Math.max(2, Math.min(8, state.humanCount + state.cpuCount));
      state.cpuCount = 0;
    } else if (state.cpuCount < 1) {
      state.cpuCount = 1;
      state.humanCount = Math.max(1, Math.min(7, state.humanCount));
    }

    state.mode = nextMode;
    const normalized = normalizeStandardSettings(state.humanCount, state.cpuCount);
    state.humanCount = normalized.humans;
    state.cpuCount = normalized.cpus;
    enterStandby();
  });
  humanCountSelect?.addEventListener("change", () => {
    const normalized = normalizeStandardSettings(humanCountSelect.value, state.cpuCount);
    state.humanCount = normalized.humans;
    state.cpuCount = normalized.cpus;
    enterStandby();
  });
  cpuCountSelect?.addEventListener("change", () => {
    const normalized = normalizeStandardSettings(state.humanCount, cpuCountSelect.value);
    state.humanCount = normalized.humans;
    state.cpuCount = normalized.cpus;
    enterStandby();
  });

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => buildInitialState({ fromRemote }),
    enterStandby,
    stop: () => {
      closeWildColorPicker({ keepMessage: true, renderAfter: false });
      if (state.turnBannerTimeoutId) {
        clearTimeout(state.turnBannerTimeoutId);
        state.turnBannerTimeoutId = null;
      }
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      state.mode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayerIndex = roomPlayer === 2 ? 1 : 0;
      state.viewerPlayerIndex = state.roomPlayerIndex;
      state.roomLocked = false;
      state.roomLockMessage = "";
      clearSelectedCard();
      options.onRoomStatusChange?.({ roomCode, roomRole });
      render();
    },
    configureStandardMode: (mode) => {
      const nextMode = mode === "local" ? "local" : "cpu";
      state.mode = nextMode;
      const normalized = normalizeStandardSettings(state.humanCount, state.cpuCount);
      state.humanCount = normalized.humans;
      state.cpuCount = normalized.cpus;
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayerIndex = 0;
      state.viewerPlayerIndex = 0;
      state.roomLocked = false;
      state.roomLockMessage = "";
      clearSelectedCard();
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      if (modeSelect) modeSelect.value = nextMode;
      render();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";
      if (state.roomLocked) clearSelectedCard();

      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || unoText("roomWaitingLocked");
      } else if (!state.gameOver) {
        messageEl.textContent = `${unoText("player")} ${state.currentPlayer + 1} ${unoLang() === "ko" ? "턴" : "の手番"}`;
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
      multiPlayValue: state.multiPlayValue,
      multiPlayPlayer: state.multiPlayPlayer,
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
      clearSelectedCard();
      if (isRoomMode()) {
        state.roomLocked = Boolean(snapshot.roomLocked);
        state.roomLockMessage = snapshot.roomLockMessage ?? "";
      }
      if (snapshot.multiPlayValue === null || snapshot.multiPlayValue === undefined) {
        clearMultiPlay();
      } else {
        state.multiPlayValue = snapshot.multiPlayValue;
        state.multiPlayPlayer = Number.isInteger(snapshot.multiPlayPlayer) ? snapshot.multiPlayPlayer : state.currentPlayer;
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
