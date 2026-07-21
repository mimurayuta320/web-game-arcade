function createAllCodes(codeLength) {
  const length = Number.isFinite(codeLength) ? Math.max(3, Math.min(4, Math.floor(codeLength))) : 3;
  const result = [];
  const used = new Set();

  function backtrack(digits) {
    if (digits.length === length) {
      result.push(digits.join(""));
      return;
    }

    for (let digit = 0; digit <= 9; digit += 1) {
      if (used.has(digit)) continue;
      used.add(digit);
      digits.push(String(digit));
      backtrack(digits);
      digits.pop();
      used.delete(digit);
    }
  }

  backtrack([]);
  return result;
}

const ALL_CODES_CACHE = new Map();

function getAllCodes(codeLength) {
  const length = Number.isFinite(codeLength) ? Math.max(3, Math.min(4, Math.floor(codeLength))) : 3;
  if (!ALL_CODES_CACHE.has(length)) {
    ALL_CODES_CACHE.set(length, createAllCodes(length));
  }
  return ALL_CODES_CACHE.get(length);
}

function randomCode(codeLength) {
  const codes = getAllCodes(codeLength);
  return codes[Math.floor(Math.random() * codes.length)];
}

function evaluateGuess(secret, guess) {
  let hits = 0;
  let blows = 0;
  const length = Math.min(secret.length, guess.length);
  for (let i = 0; i < length; i += 1) {
    if (guess[i] === secret[i]) {
      hits += 1;
    } else if (secret.includes(guess[i])) {
      blows += 1;
    }
  }
  return { hits, blows };
}

function isValidCode(value, codeLength = 3) {
  const length = Number.isFinite(codeLength) ? Math.max(3, Math.min(4, Math.floor(codeLength))) : 3;
  if (!new RegExp(`^\\d{${length}}$`).test(value)) return false;
  return new Set(value.split("")).size === length;
}

function cloneHistory(history) {
  return history.map((entry) => ({ ...entry }));
}

function buildCandidatesFromHistory(history, codeLength) {
  let candidates = [...getAllCodes(codeLength)];
  history.forEach((entry) => {
    if (!entry || typeof entry.guess !== "string") return;
    const target = { hits: Number(entry.hits) || 0, blows: Number(entry.blows) || 0 };
    candidates = candidates.filter((code) => {
      const score = evaluateGuess(code, entry.guess);
      return score.hits === target.hits && score.blows === target.blows;
    });
  });
  return candidates;
}

function pickCandidate(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return "";
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function createDigitCards(container, onPick, className) {
  if (!container) return;
  container.textContent = "";
  for (let digit = 0; digit <= 9; digit += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.digit = String(digit);
    button.textContent = String(digit);
    button.addEventListener("click", () => onPick(String(digit)));
    container.append(button);
  }
}

function setSlots(container, draft, slotCount, mode = "plain") {
  if (!container) return;
  container.textContent = "";

  const length = Number.isFinite(slotCount) ? Math.max(3, Math.min(4, Math.floor(slotCount))) : 3;
  for (let i = 0; i < length; i += 1) {
    const card = document.createElement("div");
    card.className = "numeron-slot-card";
    const value = draft[i] || "";

    if (mode === "hidden") {
      card.textContent = value ? "?" : "-";
    } else {
      card.textContent = value || "-";
    }

    container.append(card);
  }
}

function addDigitToDraft(draft, digit, limit) {
  if (!/^\d$/.test(digit)) return draft;
  const maxLength = Number.isFinite(limit) ? Math.max(3, Math.min(4, Math.floor(limit))) : 3;
  if (draft.length >= maxLength) return draft;
  if (draft.includes(digit)) return draft;
  return [...draft, digit];
}

function createDefaultItems() {
  return {
    double: 1,
    highlow: 1,
    shuffle: 1,
  };
}

function shuffleSecretCode(secret) {
  const digits = secret.split("");
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  const shuffled = digits.join("");
  if (shuffled !== secret) return shuffled;

  if (digits.length <= 1) return secret;
  return [...digits.slice(1), digits[0]].join("");
}

function toHalfWidthText(value) {
  if (typeof value !== "string" || value.length === 0) return "";
  return value
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}

export function initNumeron(options = {}) {
  const turnTextEl = document.getElementById("numeronTurnText");
  const p1TryCountEl = document.getElementById("numeronP1TryCount");
  const p2TryCountEl = document.getElementById("numeronP2TryCount");
  const p1ItemsEl = document.getElementById("numeronP1Items");
  const p2ItemsEl = document.getElementById("numeronP2Items");
  const statusTextEl = document.getElementById("numeronStatusText");
  const selfHistoryEl = document.getElementById("numeronSelfHistory");
  const opponentHistoryEl = document.getElementById("numeronOpponentHistory");
  const memoPadEl = document.getElementById("numeronMemoPad");
  const memoClearBtn = document.getElementById("numeronMemoClearBtn");
  const messageEl = document.getElementById("numeronMessage");
  const overlayEl = document.getElementById("numeronOverlay");
  const startBtn = document.getElementById("numeronStartBtn");
  const remakeBtn = document.getElementById("numeronRemakeBtn");
  const menuBtn = document.getElementById("numeronMenuBtn");
  const modeSelectEl = document.getElementById("numeronModeSelect");
  const openingSelectEl = document.getElementById("numeronOpeningSelect");
  const digitCountSelectEl = document.getElementById("numeronDigitCountSelect");

  const secretStageTextEl = document.getElementById("numeronSecretStageText");
  const opponentSecretBlockEl = document.getElementById("numeronOpponentSecretBlock");
  const opponentSecretSlotsEl = document.getElementById("numeronOpponentSecretSlots");
  const secretSlotsEl = document.getElementById("numeronSecretSlots");
  const secretDeckEl = document.getElementById("numeronSecretDeck");
  const secretSetBtn = document.getElementById("numeronSecretSetBtn");
  const secretClearBtn = document.getElementById("numeronSecretClearBtn");

  const guessSlotsEl = document.getElementById("numeronGuessSlots");
  const guessDeckEl = document.getElementById("numeronGuessDeck");
  const guessBtn = document.getElementById("numeronGuessBtn");
  const guessClearBtn = document.getElementById("numeronGuessClearBtn");

  const itemDoubleBtn = document.getElementById("numeronItemDoubleBtn");
  const itemShuffleBtn = document.getElementById("numeronItemShuffleBtn");
  const itemHighLowBtn = document.getElementById("numeronItemHighLowBtn");
  const highLowDigitSelect = document.getElementById("numeronHighLowDigitSelect");
  const itemResultTextEl = document.getElementById("numeronItemResultText");

  const state = {
    gameMode: "local",
    playMode: "cpu",
    roomPlayerIndex: 0,
    roomLocked: false,
    roomLockMessage: "",
    setupPhase: "idle",
    gameOver: true,
    currentPlayer: 0,
    winnerIndex: null,
    turnActionsLeft: 1,
    secrets: ["", ""],
    history: [[], []],
    cpuTimerId: null,
    cpuCandidates: [[], []],
    secretDraft: [],
    guessDraft: [],
    items: [createDefaultItems(), createDefaultItems()],
    itemResultText: "-",
    openingChoice: "first",
    openingPlayer: 0,
    codeLength: 3,
  };

  function normalizeCodeLength(value) {
    return String(value) === "4" ? 4 : 3;
  }

  function normalizeOpeningChoice(value) {
    return value === "second" || value === "random" ? value : "first";
  }

  function resolveOpeningPlayer(choice) {
    const normalized = normalizeOpeningChoice(choice);
    if (normalized === "first") return 0;
    if (normalized === "second") return 1;
    return Math.random() < 0.5 ? 0 : 1;
  }

  createDigitCards(
    secretDeckEl,
    (digit) => {
      if (!canEditSecret()) return;
      state.secretDraft = addDigitToDraft(state.secretDraft, digit, state.codeLength);
      render();
    },
    "numeron-digit-card secret"
  );

  createDigitCards(
    guessDeckEl,
    (digit) => {
      if (!canEditGuess()) return;
      state.guessDraft = addDigitToDraft(state.guessDraft, digit, state.codeLength);
      render();
    },
    "numeron-digit-card guess"
  );

  function clearCpuTimer() {
    if (!state.cpuTimerId) return;
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isCpuMode() {
    return state.playMode === "cpu";
  }

  function isCpuTurn() {
    if (isRoomMode()) return false;
    return isCpuMode() && state.currentPlayer === 1;
  }

  function isSetupPhase() {
    return state.setupPhase === "p1-secret" || state.setupPhase === "p2-secret" || state.setupPhase === "room-secret";
  }

  function peerPlayerIndex() {
    return state.roomPlayerIndex === 0 ? 1 : 0;
  }

  function getRoomReadyCount() {
    const ownReady = isValidCode(state.secrets[state.roomPlayerIndex], state.codeLength);
    const peerReady = isValidCode(state.secrets[peerPlayerIndex()], state.codeLength);
    return (ownReady ? 1 : 0) + (peerReady ? 1 : 0);
  }

  function digitsLabel() {
    return `${state.codeLength}枚`;
  }

  function codeLabel() {
    return `${state.codeLength}桁`;
  }

  function canLocalInput() {
    if (state.gameOver) return false;
    if (state.roomLocked) return false;
    if (isSetupPhase()) return false;
    if (isRoomMode()) return state.currentPlayer === state.roomPlayerIndex;
    return !isCpuTurn();
  }

  function canEditSecret() {
    if (!isSetupPhase()) return false;
    return true;
  }

  function canEditGuess() {
    return canLocalInput();
  }

  function canUseItems() {
    if (!canLocalInput()) return false;
    return true;
  }

  function playerLabel(index) {
    if (index === 0) return "PLAYER 1";
    if (isRoomMode()) return "PLAYER 2";
    if (isCpuMode()) return "CPU";
    return "PLAYER 2";
  }

  function formatItems(itemState) {
    return `D:${itemState.double} H:${itemState.highlow} S:${itemState.shuffle}`;
  }

  function updateOverlay(text) {
    if (!overlayEl) return;
    overlayEl.textContent = text || "";
    overlayEl.classList.toggle("hidden", !text);
  }

  function renderHistoryList(target, entries) {
    if (!target) return;
    target.textContent = "";
    if (!Array.isArray(entries) || entries.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "-";
      target.append(empty);
      return;
    }

    entries.forEach((entry, idx) => {
      const item = document.createElement("li");
      item.textContent = `${idx + 1}. ${entry.guess}  ${entry.hits} EAT / ${entry.blows} BITE`;
      target.append(item);
    });
  }

  function setDigitCardsEnabled(container, enabled) {
    if (!container) return;
    const buttons = container.querySelectorAll("button[data-digit]");
    buttons.forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function switchTurn() {
    state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
    state.turnActionsLeft = 1;
    state.guessDraft = [];
  }

  function consumeAction() {
    state.turnActionsLeft -= 1;
    if (state.turnActionsLeft <= 0) {
      switchTurn();
    }
  }

  function render() {
    if (p1TryCountEl) p1TryCountEl.textContent = String(state.history[0].length);
    if (p2TryCountEl) p2TryCountEl.textContent = String(state.history[1].length);
    if (p1ItemsEl) p1ItemsEl.textContent = formatItems(state.items[0]);
    if (p2ItemsEl) p2ItemsEl.textContent = formatItems(state.items[1]);

    if (turnTextEl) {
      if (isSetupPhase()) {
        turnTextEl.textContent = "SETUP";
      } else if (state.gameOver) {
        turnTextEl.textContent = state.winnerIndex == null ? "-" : `${playerLabel(state.winnerIndex)} WIN`;
      } else {
        turnTextEl.textContent = `${playerLabel(state.currentPlayer)} (${state.turnActionsLeft} ACTION)`;
      }
    }

    const localIndex = isRoomMode() ? state.roomPlayerIndex : 0;
    const rivalIndex = localIndex === 0 ? 1 : 0;
    renderHistoryList(selfHistoryEl, state.history[localIndex]);
    renderHistoryList(opponentHistoryEl, state.history[rivalIndex]);

    if (opponentSecretBlockEl) {
      opponentSecretBlockEl.classList.toggle("hidden", isSetupPhase());
    }

    const rivalSecret = state.secrets[rivalIndex];
    const rivalCards = isValidCode(rivalSecret, state.codeLength) ? rivalSecret.split("") : [];
    const revealBothSecrets = !isSetupPhase() && state.gameOver && state.winnerIndex != null;
    setSlots(opponentSecretSlotsEl, rivalCards, state.codeLength, revealBothSecrets ? "plain" : "hidden");

    let secretCards = [];
    if (state.setupPhase === "p1-secret" || state.setupPhase === "p2-secret") {
      secretCards = [...state.secretDraft];
    } else if (state.setupPhase === "room-secret") {
      const ownSecret = state.secrets[localIndex];
      secretCards = isValidCode(ownSecret, state.codeLength) ? ownSecret.split("") : [...state.secretDraft];
    } else {
      const ownSecret = state.secrets[localIndex];
      secretCards = isValidCode(ownSecret, state.codeLength) ? ownSecret.split("") : [];
    }
    setSlots(secretSlotsEl, secretCards, state.codeLength, "plain");
    setSlots(guessSlotsEl, state.guessDraft, state.codeLength);

    if (modeSelectEl) {
      const roomGuestLocked = isRoomMode() && state.roomPlayerIndex !== 0;
      const roomHostInMatchLocked = isRoomMode() && (!state.gameOver || isSetupPhase());
      modeSelectEl.disabled = roomGuestLocked || roomHostInMatchLocked;
      modeSelectEl.value = isCpuMode() ? "cpu" : "local";
    }

    if (openingSelectEl) {
      openingSelectEl.disabled = isRoomMode();
      openingSelectEl.value = state.openingChoice;
    }

    if (digitCountSelectEl) {
      const roomGuestLocked = isRoomMode() && state.roomPlayerIndex !== 0;
      digitCountSelectEl.disabled = roomGuestLocked || !state.gameOver || isSetupPhase();
      digitCountSelectEl.value = String(state.codeLength);
    }

    if (remakeBtn) {
      remakeBtn.disabled = state.roomLocked;
    }

    const secretEnabled = canEditSecret();
    const guessEnabled = canEditGuess();
    const itemEnabled = canUseItems();

    setDigitCardsEnabled(secretDeckEl, secretEnabled);
    setDigitCardsEnabled(guessDeckEl, guessEnabled);

    if (secretSetBtn) secretSetBtn.disabled = !secretEnabled || state.secretDraft.length !== state.codeLength;
    if (secretClearBtn) secretClearBtn.disabled = !secretEnabled || state.secretDraft.length === 0;

    if (guessBtn) guessBtn.disabled = !guessEnabled || state.guessDraft.length !== state.codeLength;
    if (guessClearBtn) guessClearBtn.disabled = !guessEnabled || state.guessDraft.length === 0;

    if (itemDoubleBtn) itemDoubleBtn.disabled = !itemEnabled || state.items[state.currentPlayer].double <= 0 || state.turnActionsLeft !== 1;
    if (itemShuffleBtn) itemShuffleBtn.disabled = !itemEnabled || state.items[state.currentPlayer].shuffle <= 0;
    if (itemHighLowBtn) itemHighLowBtn.disabled = !itemEnabled || state.items[state.currentPlayer].highlow <= 0;
    if (highLowDigitSelect) highLowDigitSelect.disabled = !itemEnabled || state.items[state.currentPlayer].highlow <= 0;

    if (itemResultTextEl) {
      itemResultTextEl.textContent = `アイテム結果: ${state.itemResultText || "-"}`;
    }

    if (secretStageTextEl) {
      if (state.setupPhase === "p1-secret") {
        secretStageTextEl.textContent = "PLAYER 1 の秘密数字をカードで選んで確定";
      } else if (state.setupPhase === "p2-secret") {
        secretStageTextEl.textContent = "PLAYER 2 の秘密数字をカードで選んで確定";
      } else if (state.setupPhase === "room-secret") {
        secretStageTextEl.textContent = `あなたの秘密数字をカードで選んで確定（${playerLabel(state.roomPlayerIndex)}） 選択完了 ${getRoomReadyCount()}/2`;
      } else {
        secretStageTextEl.textContent = "秘密数字は設定済み";
      }
    }

    if (statusTextEl) {
      if (isSetupPhase()) {
        if (state.setupPhase === "room-secret") {
          const ownReady = isValidCode(state.secrets[state.roomPlayerIndex], state.codeLength);
          const peerReady = isValidCode(state.secrets[peerPlayerIndex()], state.codeLength);
          const readyCount = (ownReady ? 1 : 0) + (peerReady ? 1 : 0);
          if (!ownReady) {
            statusTextEl.textContent = `あなたの秘密数字を${digitsLabel()}選んで確定してください（選択完了 ${readyCount}/2）`;
          } else if (!peerReady) {
            statusTextEl.textContent = `相手の秘密数字確定を待っています...（選択完了 ${readyCount}/2）`;
          } else {
            statusTextEl.textContent = "選択完了 2/2。ゲームを開始します...";
          }
        } else {
          statusTextEl.textContent = `秘密数字を${digitsLabel()}選んで確定してください`;
        }
      } else if (state.gameOver) {
        statusTextEl.textContent = state.winnerIndex == null ? "待機中" : `${playerLabel(state.winnerIndex)} が勝利しました`;
      } else if (state.roomLocked) {
        statusTextEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
      } else if (canLocalInput()) {
        statusTextEl.textContent = `推理カードを${digitsLabel()}選んで確定（またはアイテム使用）`;
      } else {
        statusTextEl.textContent = `${playerLabel(state.currentPlayer)} が行動中`;
      }
    }
  }

  function pushMessage(text) {
    if (messageEl) messageEl.textContent = text;
  }

  function startBattle() {
    state.setupPhase = "battle";
    state.gameOver = false;
    state.currentPlayer = state.openingPlayer;
    state.winnerIndex = null;
    state.turnActionsLeft = 1;
    state.guessDraft = [];
    state.itemResultText = "-";
    state.items = [createDefaultItems(), createDefaultItems()];
    state.cpuCandidates = [buildCandidatesFromHistory(state.history[0], state.codeLength), buildCandidatesFromHistory(state.history[1], state.codeLength)];

    updateOverlay("");
    pushMessage(`推理カードを${digitsLabel()}選んで確定。${state.codeLength} EAT で勝利です。アイテムは各1回まで使えます。`);
    render();
    options.onRoomSnapshot?.();
    maybeRunCpu();
  }

  function setupNewGame() {
    clearCpuTimer();
    state.history = [[], []];
    state.winnerIndex = null;
    state.guessDraft = [];
    state.secretDraft = [];
    state.itemResultText = "-";
    state.openingPlayer = resolveOpeningPlayer(state.openingChoice);

    if (isRoomMode()) {
      state.roomLocked = false;
      state.roomLockMessage = "";
      state.setupPhase = "room-secret";
      state.gameOver = true;
      state.currentPlayer = 0;
      state.turnActionsLeft = 1;
      state.secrets = ["", ""];
      state.items = [createDefaultItems(), createDefaultItems()];
      state.cpuCandidates = [buildCandidatesFromHistory(state.history[0], state.codeLength), buildCandidatesFromHistory(state.history[1], state.codeLength)];
      updateOverlay("ROOM SECRET SETUP");
      pushMessage(`ルーム対戦: まずあなたの秘密数字を${digitsLabel()}選んで確定してください`);
      render();
      return;
    }

    state.secrets = ["", ""];
    state.setupPhase = "p1-secret";
    state.gameOver = true;
    state.currentPlayer = 0;
    state.turnActionsLeft = 1;

    updateOverlay("SECRET SETUP");
    pushMessage(`PLAYER 1 の秘密数字をカードで${digitsLabel()}選んで確定してください`);
    render();
  }

  function confirmSecret() {
    if (!canEditSecret()) return;
    if (state.secretDraft.length !== state.codeLength) {
      pushMessage(`秘密数字は${codeLabel()}選んでください`);
      return;
    }

    const secret = state.secretDraft.join("");
    if (!isValidCode(secret, state.codeLength)) {
      pushMessage(`重複なしの${codeLabel()}にしてください`);
      return;
    }

    if (isRoomMode() && state.setupPhase === "room-secret") {
      state.secrets[state.roomPlayerIndex] = secret;
      state.secretDraft = [];
      options.onRoomMove?.({ type: "room-secret", secret });

      if (isValidCode(state.secrets[peerPlayerIndex()], state.codeLength)) {
        pushMessage("選択完了 2/2。ゲームを開始します...");
        startBattle();
      } else {
        pushMessage(`秘密数字を確定しました。選択完了 ${getRoomReadyCount()}/2。相手の準備を待っています...`);
        render();
      }
      return;
    }

    if (state.setupPhase === "p1-secret") {
      state.secrets[0] = secret;
      state.secretDraft = [];

      if (isCpuMode()) {
        state.secrets[1] = randomCode(state.codeLength);
        startBattle();
        return;
      }

      state.setupPhase = "p2-secret";
      updateOverlay("PASS DEVICE TO PLAYER 2");
      pushMessage(`PLAYER 2 の秘密数字をカードで${digitsLabel()}選んで確定してください`);
      render();
      return;
    }

    if (state.setupPhase === "p2-secret") {
      state.secrets[1] = secret;
      state.secretDraft = [];
      startBattle();
    }
  }

  function finishGame(winnerIndex, guess) {
    state.gameOver = true;
    state.winnerIndex = winnerIndex;
    clearCpuTimer();

    const loserIndex = winnerIndex === 0 ? 1 : 0;
    const winnerLabel = playerLabel(winnerIndex);
    const loserLabel = playerLabel(loserIndex);
    const loserSecret = state.secrets[loserIndex];

    pushMessage(`${winnerLabel} が ${guess} で正解しました。${loserLabel} のコードは ${loserSecret} でした。`);
    updateOverlay("GAME SET");
    render();
    options.onRoomSnapshot?.();
  }

  function applyGuess(guess, { isRemote = false, isCpu = false } = {}) {
    if (state.gameOver || state.roomLocked || isSetupPhase()) return;
    if (!isValidCode(guess, state.codeLength)) {
      if (!isRemote) pushMessage(`${codeLabel()}・重複なしで選んでください`);
      return;
    }

    const actor = state.currentPlayer;
    const target = actor === 0 ? 1 : 0;
    const score = evaluateGuess(state.secrets[target], guess);
    state.history[actor].push({ guess, hits: score.hits, blows: score.blows });
    state.cpuCandidates[actor] = state.cpuCandidates[actor].filter((code) => code !== guess);

    if (isRoomMode() && !isRemote && actor === state.roomPlayerIndex) {
      options.onRoomMove?.({ type: "guess", guess });
    }

    if (score.hits === state.codeLength) {
      finishGame(actor, guess);
      return;
    }

    if (!isRemote || !isCpu) {
      const actorLabel = playerLabel(actor);
      pushMessage(`${actorLabel}: ${guess} -> ${score.hits} EAT / ${score.blows} BITE`);
    }

    state.guessDraft = [];
    consumeAction();
    render();
    options.onRoomSnapshot?.();
    maybeRunCpu();
  }

  function useDoubleItem() {
    if (!canUseItems()) return;
    const actor = state.currentPlayer;
    const currentItems = state.items[actor];
    if (currentItems.double <= 0) {
      pushMessage("ダブルはもう使用済みです");
      return;
    }
    if (state.turnActionsLeft !== 1) {
      pushMessage("ダブルはターン開始時にのみ使用できます");
      return;
    }

    currentItems.double -= 1;
    state.turnActionsLeft = 2;
    state.itemResultText = `${playerLabel(actor)} がダブルを使用（このターン2回行動）`;
    pushMessage(state.itemResultText);
    render();
    options.onRoomSnapshot?.();
  }

  function useHighLowItem() {
    if (!canUseItems()) return;
    const actor = state.currentPlayer;
    const currentItems = state.items[actor];
    if (currentItems.highlow <= 0) {
      pushMessage("HIGH&LOW はもう使用済みです");
      return;
    }

    const digit = String(highLowDigitSelect?.value ?? "");
    if (!/^\d$/.test(digit)) {
      pushMessage("HIGH&LOW 用の数字を選んでください");
      return;
    }

    currentItems.highlow -= 1;

    const target = actor === 0 ? 1 : 0;
    const targetSecret = state.secrets[target] || "";
    let resultText = "NONE（相手の秘密数字に含まれない）";

    if (targetSecret.includes(digit)) {
      resultText = Number(digit) >= 5 ? "HIGH" : "LOW";
    }

    state.itemResultText = `${playerLabel(actor)} HIGH&LOW [${digit}] -> ${resultText}`;
    pushMessage(state.itemResultText);

    consumeAction();
    render();
    options.onRoomSnapshot?.();
    maybeRunCpu();
  }

  function useShuffleItem() {
    if (!canUseItems()) return;
    const actor = state.currentPlayer;
    const currentItems = state.items[actor];
    if (currentItems.shuffle <= 0) {
      pushMessage("シャッフルはもう使用済みです");
      return;
    }

    const ownSecret = state.secrets[actor];
    if (!isValidCode(ownSecret, state.codeLength)) {
      pushMessage("このタイミングではシャッフルできません");
      return;
    }

    currentItems.shuffle -= 1;
    state.secrets[actor] = shuffleSecretCode(ownSecret);
    state.itemResultText = `${playerLabel(actor)} が秘密数字をシャッフルしました`;
    pushMessage(state.itemResultText);

    consumeAction();
    render();
    options.onRoomSnapshot?.();
    maybeRunCpu();
  }

  function cpuGuess() {
    const actor = state.currentPlayer;
    const history = state.history[actor];
    state.cpuCandidates[actor] = buildCandidatesFromHistory(history, state.codeLength);
    const guess = pickCandidate(state.cpuCandidates[actor]) || randomCode(state.codeLength);
    applyGuess(guess, { isCpu: true });
  }

  function maybeRunCpu() {
    clearCpuTimer();
    if (state.gameOver || state.roomLocked || isSetupPhase()) return;
    if (!isCpuTurn()) return;

    state.cpuTimerId = setTimeout(() => {
      state.cpuTimerId = null;
      cpuGuess();
    }, 430);
  }

  function submitGuess() {
    if (!canEditGuess()) return;
    const guess = state.guessDraft.join("");
    applyGuess(guess);
  }

  function beginGame({ fromRemote = false, announceNewGame = true } = {}) {
    if (state.roomLocked && !fromRemote) return;
    if (fromRemote) {
      state.roomLocked = false;
      state.roomLockMessage = "";
    }
    setupNewGame();
    if (isRoomMode() && !fromRemote && announceNewGame) {
      options.onRoomNewGame?.();
    }
  }

  function requestRemake() {
    if (state.roomLocked) return;
    enterStandby();
    if (isRoomMode()) {
      options.onRoomRemake?.();
      options.onRoomSnapshot?.();
    }
  }

  function enterStandby() {
    clearCpuTimer();
    state.setupPhase = "idle";
    state.gameOver = true;
    state.currentPlayer = 0;
    state.winnerIndex = null;
    state.turnActionsLeft = 1;
    state.secrets = ["", ""];
    state.history = [[], []];
    state.cpuCandidates = [[], []];
    state.secretDraft = [];
    state.guessDraft = [];
    state.items = [createDefaultItems(), createDefaultItems()];
    state.itemResultText = "-";
    state.roomLocked = false;
    state.roomLockMessage = "";

    pushMessage("GAME STARTを押してください");
    updateOverlay("GAME STARTで開始");
    render();
  }

  startBtn?.addEventListener("click", () => {
    beginGame({ fromRemote: false });
  });

  remakeBtn?.addEventListener("click", requestRemake);

  modeSelectEl?.addEventListener("change", () => {
    if (state.gameMode === "room" && state.roomPlayerIndex !== 0) return;
    state.playMode = modeSelectEl.value === "local" ? "local" : "cpu";
    enterStandby();
    if (isRoomMode()) {
      options.onRoomSnapshot?.();
    }
  });

  openingSelectEl?.addEventListener("change", () => {
    if (state.gameMode === "room") return;
    state.openingChoice = normalizeOpeningChoice(openingSelectEl.value);
    render();
  });

  digitCountSelectEl?.addEventListener("change", () => {
    if (state.gameMode === "room" && state.roomPlayerIndex !== 0) return;
    state.codeLength = normalizeCodeLength(digitCountSelectEl.value);
    state.secretDraft = [];
    state.guessDraft = [];
    state.secrets = ["", ""];
    state.cpuCandidates = [[], []];
    render();
    if (isRoomMode()) {
      options.onRoomSnapshot?.();
    }
  });

  secretSetBtn?.addEventListener("click", confirmSecret);

  secretClearBtn?.addEventListener("click", () => {
    if (!canEditSecret()) return;
    state.secretDraft = [];
    render();
  });

  guessBtn?.addEventListener("click", submitGuess);

  guessClearBtn?.addEventListener("click", () => {
    if (!canEditGuess()) return;
    state.guessDraft = [];
    render();
  });

  itemDoubleBtn?.addEventListener("click", useDoubleItem);
  itemHighLowBtn?.addEventListener("click", useHighLowItem);
  itemShuffleBtn?.addEventListener("click", useShuffleItem);

  memoClearBtn?.addEventListener("click", () => {
    if (!memoPadEl) return;
    memoPadEl.value = "";
    memoPadEl.focus();
  });

  memoPadEl?.addEventListener("input", () => {
    const before = memoPadEl.value;
    const after = toHalfWidthText(before);
    if (before === after) return;

    const start = memoPadEl.selectionStart ?? after.length;
    const end = memoPadEl.selectionEnd ?? after.length;
    memoPadEl.value = after;
    memoPadEl.setSelectionRange(Math.min(start, after.length), Math.min(end, after.length));
  });

  memoPadEl?.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

  memoPadEl?.addEventListener("keyup", (event) => {
    event.stopPropagation();
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => {
      beginGame({ fromRemote });
    },
    applyRoomRemake: () => {
      enterStandby();
    },
    enterStandby,
    stop: () => {
      clearCpuTimer();
    },
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.playMode = "local";
      state.roomPlayerIndex = roomRole === "guest" ? 1 : 0;
      options.onRoomStatusChange?.({ roomCode, roomRole });
      enterStandby();
    },
    configureStandardMode: (mode) => {
      state.gameMode = "local";
      state.playMode = mode === "local" ? "local" : "cpu";
      state.roomPlayerIndex = 0;
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      enterStandby();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";
      if (state.roomLocked) {
        updateOverlay(state.roomLockMessage || "対戦相手を待っています...");
        pushMessage(state.roomLockMessage || "対戦相手を待っています...");
      } else if (!state.gameOver || isSetupPhase()) {
        updateOverlay(isSetupPhase() ? "SECRET SETUP" : "");
      }
      render();
    },
    applyRemoteMove: (payload) => {
      if (!payload || typeof payload.type !== "string") return;

      if (payload.type === "room-secret") {
        if (!isRoomMode()) return;
        if (!isValidCode(payload.secret, state.codeLength)) return;
        state.secrets[peerPlayerIndex()] = payload.secret;
        if (state.setupPhase === "room-secret" && isValidCode(state.secrets[state.roomPlayerIndex], state.codeLength) && isValidCode(state.secrets[peerPlayerIndex()], state.codeLength)) {
          pushMessage("選択完了 2/2。ゲームを開始します...");
          startBattle();
          return;
        }
        render();
        return;
      }

      if (payload.type === "guess") {
        if (typeof payload.guess !== "string") return;
        applyGuess(payload.guess, { isRemote: true });
      }
    },
    getSnapshot: () => ({
      gameMode: state.gameMode,
      playMode: state.playMode,
      roomPlayerIndex: state.roomPlayerIndex,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      setupPhase: state.setupPhase,
      gameOver: state.gameOver,
      currentPlayer: state.currentPlayer,
      winnerIndex: state.winnerIndex,
      turnActionsLeft: state.turnActionsLeft,
      openingChoice: state.openingChoice,
      openingPlayer: state.openingPlayer,
      codeLength: state.codeLength,
      secrets: [...state.secrets],
      history: [cloneHistory(state.history[0]), cloneHistory(state.history[1])],
      secretDraft: isRoomMode() ? [] : [...state.secretDraft],
      guessDraft: isRoomMode() ? [] : [...state.guessDraft],
      items: [{ ...state.items[0] }, { ...state.items[1] }],
      itemResultText: state.itemResultText,
      message: messageEl?.textContent || "",
      overlay: overlayEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot) return;
      clearCpuTimer();

      const localRoomPlayerIndex = state.roomPlayerIndex;

      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.playMode = snapshot.playMode === "local" ? "local" : "cpu";
      state.roomPlayerIndex = state.gameMode === "room" ? localRoomPlayerIndex : snapshot.roomPlayerIndex === 1 ? 1 : 0;
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = typeof snapshot.roomLockMessage === "string" ? snapshot.roomLockMessage : "";
      state.setupPhase =
        snapshot.setupPhase === "p1-secret" ||
        snapshot.setupPhase === "p2-secret" ||
        snapshot.setupPhase === "room-secret" ||
        snapshot.setupPhase === "battle"
          ? snapshot.setupPhase
          : "idle";
      state.gameOver = Boolean(snapshot.gameOver);
      state.currentPlayer = snapshot.currentPlayer === 1 ? 1 : 0;
      state.winnerIndex = snapshot.winnerIndex === 0 || snapshot.winnerIndex === 1 ? snapshot.winnerIndex : null;
      state.turnActionsLeft = Number.isFinite(snapshot.turnActionsLeft) ? Math.max(1, Math.floor(snapshot.turnActionsLeft)) : 1;
      state.openingChoice = normalizeOpeningChoice(snapshot.openingChoice);
      state.openingPlayer = snapshot.openingPlayer === 1 ? 1 : 0;
      state.codeLength = normalizeCodeLength(snapshot.codeLength);

      const secret0 = String(snapshot.secrets?.[0] || "");
      const secret1 = String(snapshot.secrets?.[1] || "");
      state.secrets = [isValidCode(secret0, state.codeLength) ? secret0 : "", isValidCode(secret1, state.codeLength) ? secret1 : ""];

      const history0 = Array.isArray(snapshot.history?.[0]) ? snapshot.history[0] : [];
      const history1 = Array.isArray(snapshot.history?.[1]) ? snapshot.history[1] : [];
      state.history = [cloneHistory(history0), cloneHistory(history1)];
      state.cpuCandidates = [buildCandidatesFromHistory(state.history[0], state.codeLength), buildCandidatesFromHistory(state.history[1], state.codeLength)];

      if (state.gameMode === "room") {
        state.secretDraft = state.secretDraft.filter((digit) => /^\d$/.test(String(digit))).slice(0, state.codeLength).map(String);
        state.guessDraft = state.guessDraft.filter((digit) => /^\d$/.test(String(digit))).slice(0, state.codeLength).map(String);
      } else {
        state.secretDraft = Array.isArray(snapshot.secretDraft)
          ? snapshot.secretDraft.filter((digit) => /^\d$/.test(String(digit))).slice(0, state.codeLength).map(String)
          : [];
        state.guessDraft = Array.isArray(snapshot.guessDraft)
          ? snapshot.guessDraft.filter((digit) => /^\d$/.test(String(digit))).slice(0, state.codeLength).map(String)
          : [];
      }

      const item0 = snapshot.items?.[0] || {};
      const item1 = snapshot.items?.[1] || {};
      state.items = [
        {
          double: Math.max(0, Number(item0.double) || 0),
          highlow: Math.max(0, Number(item0.highlow) || 0),
          shuffle: Math.max(0, Number(item0.shuffle) || 0),
        },
        {
          double: Math.max(0, Number(item1.double) || 0),
          highlow: Math.max(0, Number(item1.highlow) || 0),
          shuffle: Math.max(0, Number(item1.shuffle) || 0),
        },
      ];

      state.itemResultText = typeof snapshot.itemResultText === "string" ? snapshot.itemResultText : "-";

      if (typeof snapshot.message === "string" && messageEl) {
        messageEl.textContent = snapshot.message;
      }

      if (typeof snapshot.overlay === "string") {
        updateOverlay(snapshot.overlay);
      } else if (state.roomLocked) {
        updateOverlay(state.roomLockMessage || "対戦相手を待っています...");
      } else if (isSetupPhase()) {
        updateOverlay("SECRET SETUP");
      } else if (state.gameOver) {
        updateOverlay("GAME SET");
      } else {
        updateOverlay("");
      }

      render();
      maybeRunCpu();
    },
  };
}
