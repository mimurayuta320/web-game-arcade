const PROMPT_POOL = {
  random: [
    { text: "空飛ぶラーメン屋", difficulty: "easy" },
    { text: "筋トレするペンギン", difficulty: "easy" },
    { text: "透明マントを着た忍者", difficulty: "normal" },
    { text: "迷子のロボット", difficulty: "normal" },
    { text: "巨大プリンの城", difficulty: "hard" },
    { text: "スケボーする侍", difficulty: "normal" },
    { text: "温泉に入るドラゴン", difficulty: "hard" },
    { text: "宇宙を泳ぐ金魚", difficulty: "hard" },
  ],
  animals: [
    { text: "サングラスをかけた猫", difficulty: "easy" },
    { text: "サーフィンする柴犬", difficulty: "easy" },
    { text: "ピアノを弾くパンダ", difficulty: "normal" },
    { text: "縄跳びするキリン", difficulty: "normal" },
    { text: "探偵のフクロウ", difficulty: "hard" },
    { text: "ラーメンをすするカバ", difficulty: "hard" },
  ],
  food: [
    { text: "怒っているおにぎり", difficulty: "easy" },
    { text: "ダンスするたこ焼き", difficulty: "easy" },
    { text: "空を飛ぶカレー", difficulty: "normal" },
    { text: "剣を持ったバナナ", difficulty: "normal" },
    { text: "温泉旅行中の寿司", difficulty: "hard" },
    { text: "ロケットに乗るケーキ", difficulty: "hard" },
  ],
  objects: [
    { text: "しゃべる目覚まし時計", difficulty: "easy" },
    { text: "笑っている掃除機", difficulty: "easy" },
    { text: "冒険するランドセル", difficulty: "normal" },
    { text: "雨の日のギター", difficulty: "normal" },
    { text: "怒涛のスピードの洗濯機", difficulty: "hard" },
    { text: "変形する消しゴム", difficulty: "hard" },
  ],
  sports: [
    { text: "バク宙するサッカー選手", difficulty: "easy" },
    { text: "野球バットを持ったロボット", difficulty: "easy" },
    { text: "フィギュアスケートするカバ", difficulty: "normal" },
    { text: "卓球で対決する忍者", difficulty: "normal" },
    { text: "ボクシングする雪だるま", difficulty: "hard" },
    { text: "マラソンするドラゴン", difficulty: "hard" },
  ],
  school: [
    { text: "宿題に追われる宇宙人", difficulty: "easy" },
    { text: "理科室で実験する猫", difficulty: "easy" },
    { text: "黒板アートを描く先生", difficulty: "normal" },
    { text: "給食を運ぶパンダ", difficulty: "normal" },
    { text: "体育館で踊るロボット", difficulty: "hard" },
    { text: "図書室で迷子の恐竜", difficulty: "hard" },
  ],
  fantasy: [
    { text: "ほうきで飛ぶ魔法使い", difficulty: "easy" },
    { text: "宝箱を守るスライム", difficulty: "easy" },
    { text: "虹の橋を渡る騎士", difficulty: "normal" },
    { text: "空に浮かぶお城", difficulty: "normal" },
    { text: "光る剣を持ったエルフ", difficulty: "hard" },
    { text: "ドラゴンと将棋を指す王様", difficulty: "hard" },
  ],
};

const ALLOWED_THEMES = new Set(["random", "animals", "food", "objects", "sports", "school", "fantasy"]);
const ALLOWED_DIFFICULTIES = new Set(["easy", "normal", "hard"]);
const DRAW_TURN_SECONDS = 30;

function randomItem(list) {
  if (!Array.isArray(list) || list.length === 0) return "謎のお題";
  return list[Math.floor(Math.random() * list.length)] || "謎のお題";
}

function sanitizePlayerCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(2, Math.min(8, Math.floor(parsed)));
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text || fallback;
}

function cloneEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      type: entry.type === "drawing" ? "drawing" : entry.type === "guess" ? "guess" : "prompt",
      by: Number.isFinite(Number(entry.by)) ? Math.max(0, Math.floor(Number(entry.by))) : 0,
      text: typeof entry.text === "string" ? entry.text : "",
      image: typeof entry.image === "string" ? entry.image : "",
    }));
}

function cloneParticipants(participants) {
  if (!Array.isArray(participants)) return [];
  return participants
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({ id: item.id, name: typeof item.name === "string" ? item.name : "Player" }));
}

function normalizeDifficulty(value) {
  return ALLOWED_DIFFICULTIES.has(value) ? value : "normal";
}

function selectPromptByDifficulty(theme, difficulty) {
  const selectedTheme = ALLOWED_THEMES.has(theme) ? theme : "random";
  const selectedDifficulty = normalizeDifficulty(difficulty);
  const source = Array.isArray(PROMPT_POOL[selectedTheme]) ? PROMPT_POOL[selectedTheme] : [];
  const fallback = source.filter((item) => item && typeof item.text === "string");
  const filtered = fallback.filter((item) => item.difficulty === selectedDifficulty);
  const chosen = randomItem(filtered.length > 0 ? filtered : fallback);
  if (chosen && typeof chosen === "object") {
    return normalizeText(chosen.text, "謎のお題");
  }
  return "謎のお題";
}

export function initDrawingRelay(options = {}) {
  const modeSelectEl = document.getElementById("drawingRelayModeSelect");
  const playerCountSelectEl = document.getElementById("drawingRelayPlayerCountSelect");
  const themeSelectEl = document.getElementById("drawingRelayThemeSelect");
  const difficultySelectEl = document.getElementById("drawingRelayDifficultySelect");
  const customPromptInputEl = document.getElementById("drawingRelayCustomPromptInput");
  const colorInputEl = document.getElementById("drawingRelayColorInput");
  const eraserBtn = document.getElementById("drawingRelayEraserBtn");
  const autoSaveToggleEl = document.getElementById("drawingRelayAutoSaveToggle");
  const savePngBtn = document.getElementById("drawingRelaySavePngBtn");
  const brushSizeInputEl = document.getElementById("drawingRelayBrushSizeInput");
  const brushSizeValueEl = document.getElementById("drawingRelayBrushSizeValue");
  const eraserSizeInputEl = document.getElementById("drawingRelayEraserSizeInput");
  const eraserSizeValueEl = document.getElementById("drawingRelayEraserSizeValue");
  const turnTextEl = document.getElementById("drawingRelayTurnText");
  const phaseTextEl = document.getElementById("drawingRelayPhaseText");
  const clueLabelEl = document.getElementById("drawingRelayClueLabel");
  const clueTextEl = document.getElementById("drawingRelayClueText");
  const cluePreviewEl = document.getElementById("drawingRelayCluePreview");
  const timerBarEl = document.getElementById("drawingRelayTimerBar");
  const timerFillEl = document.getElementById("drawingRelayTimerFill");
  const timerTextEl = document.getElementById("drawingRelayTimerText");
  const canvasEl = document.getElementById("drawingRelayCanvas");
  const guessWrapEl = document.getElementById("drawingRelayGuessWrap");
  const guessInputEl = document.getElementById("drawingRelayGuessInput");
  const revealListEl = document.getElementById("drawingRelayReveal");
  const overlayEl = document.getElementById("drawingRelayOverlay");
  const passOverlayEl = document.getElementById("drawingRelayPassOverlay");
  const passTextEl = document.getElementById("drawingRelayPassText");
  const readyBtn = document.getElementById("drawingRelayReadyBtn");
  const startBtn = document.getElementById("drawingRelayStartBtn");
  const remakeBtn = document.getElementById("drawingRelayRemakeBtn");
  const submitBtn = document.getElementById("drawingRelaySubmitBtn");
  const clearBtn = document.getElementById("drawingRelayClearBtn");
  const menuBtn = document.getElementById("drawingRelayMenuBtn");
  const messageEl = document.getElementById("drawingRelayMessage");

  if (!(canvasEl instanceof HTMLCanvasElement)) {
    return {
      startNewGame: () => {},
      enterStandby: () => {},
      stop: () => {},
      configureRoomMode: () => {},
      configureStandardMode: () => {},
      setRoomLock: () => {},
      setRoomParticipants: () => {},
      applyRemoteMove: () => {},
      applyRoomRemake: () => {},
      getSnapshot: () => ({}),
      applySnapshot: () => {},
    };
  }

  const ctx = canvasEl.getContext("2d");
  const state = {
    playMode: "local",
    gameMode: "local",
    gameOver: true,
    roomLocked: false,
    roomLockMessage: "",
    roomCode: null,
    roomRole: null,
    localPeerId: typeof options.localPeerId === "function" ? String(options.localPeerId() || "") : "",
    participants: [],
    playerCount: 4,
    theme: "random",
    difficulty: "normal",
    customPrompt: "",
    stepIndex: 0,
    entries: [],
    draftGuess: "",
    awaitingHostSync: false,
    countdownActive: false,
    countdownSeconds: 0,
    countdownWillStart: false,
    countdownTimerId: null,
    countdownStartTimerId: null,
    countdownShowStart: false,
    brushColor: "#000000",
    brushSize: 6,
    eraserSize: 22,
    eraserMode: false,
    isDrawing: false,
    drawnSinceTurnStart: false,
    strokeCount: 0,
    waitingForReady: false,
    drawTimerActive: false,
    drawTimerTotalMs: DRAW_TURN_SECONDS * 1000,
    drawTimerRemainingMs: DRAW_TURN_SECONDS * 1000,
    drawTimerEndAt: 0,
    drawTimerId: null,
    autoSaveDrawing: false,
  };

  function clearCountdownTimer() {
    if (state.countdownTimerId) {
      window.clearInterval(state.countdownTimerId);
      state.countdownTimerId = null;
    }
    if (state.countdownStartTimerId) {
      window.clearTimeout(state.countdownStartTimerId);
      state.countdownStartTimerId = null;
    }
  }

  function cancelCountdown() {
    clearCountdownTimer();
    state.countdownActive = false;
    state.countdownSeconds = 0;
    state.countdownShowStart = false;
    state.countdownWillStart = false;
  }

  function clearDrawTimer() {
    if (state.drawTimerId) {
      window.clearInterval(state.drawTimerId);
      state.drawTimerId = null;
    }
    state.drawTimerActive = false;
    state.drawTimerEndAt = 0;
    state.drawTimerRemainingMs = DRAW_TURN_SECONDS * 1000;
  }

  function updateDrawTimerUi() {
    if (!timerBarEl || !timerFillEl || !timerTextEl) return;
    const shouldShow = state.drawTimerActive && !state.gameOver && currentActionType() === "draw";
    timerBarEl.classList.toggle("hidden", !shouldShow);
    if (!shouldShow) return;
    const remaining = Math.max(0, state.drawTimerRemainingMs);
    const ratio = state.drawTimerTotalMs > 0 ? Math.max(0, Math.min(1, remaining / state.drawTimerTotalMs)) : 0;
    timerFillEl.style.width = `${ratio * 100}%`;
    timerTextEl.textContent = `${Math.ceil(remaining / 1000)}s`;
  }

  function shouldRunDrawTimer() {
    if (state.gameOver || state.roomLocked || state.waitingForReady || state.countdownActive) return false;
    if (currentActionType() !== "draw") return false;
    if (!isLocalPlayersTurn()) return false;
    if (isRoomMode() && state.awaitingHostSync && state.roomRole !== "host") return false;
    return true;
  }

  function submitCurrentTurn({ forceDrawSubmit = false, timedOut = false } = {}) {
    if (state.gameOver || state.roomLocked || state.waitingForReady) return;
    if (!isLocalPlayersTurn()) {
      setMessage("あなたの番ではありません。相手の操作を待ってください。");
      return;
    }

    const action = currentActionType();

    if (action === "draw") {
      if (!forceDrawSubmit && (!state.drawnSinceTurnStart || state.strokeCount < 2)) {
        setMessage("イラストがまだ描かれていません。少しでも描いてから確定してください。");
        return;
      }

      const image = canvasEl.toDataURL("image/png");
      if (state.autoSaveDrawing) {
        downloadPngDataUrl(image, makeDrawingFileName());
      }

      if (isRoomMode() && state.roomRole !== "host") {
        options.onRoomMove?.({ type: "submit-draw", image });
        state.awaitingHostSync = true;
        setOverlay("ホストの同期待ち...");
        setMessage(timedOut ? "30秒経過したため自動送信しました。ホストの同期を待っています..." : "送信しました。ホストの同期を待っています...");
        submitBtn.disabled = true;
        renderAll();
        return;
      }

      const applied = applySubmittedTurn({ type: "submit-draw", image });
      if (applied && timedOut) {
        setMessage("30秒経過したため自動で確定しました。");
      }
      if (applied && isRoomMode() && state.roomRole === "host") {
        options.onRoomSnapshot?.();
      }
      return;
    }

    const answer = normalizeText(state.draftGuess, "");
    if (!answer) {
      setMessage("回答が空です。ひとこと入力してください。");
      return;
    }

    if (isRoomMode() && state.roomRole !== "host") {
      options.onRoomMove?.({ type: "submit-guess", text: answer });
      state.awaitingHostSync = true;
      setOverlay("ホストの同期待ち...");
      setMessage("送信しました。ホストの同期を待っています...");
      submitBtn.disabled = true;
      renderAll();
      return;
    }

    const applied = applySubmittedTurn({ type: "submit-guess", text: answer });
    if (applied && isRoomMode() && state.roomRole === "host") {
      options.onRoomSnapshot?.();
    }
  }

  function onDrawTimerTimeout() {
    if (!shouldRunDrawTimer()) return;
    clearDrawTimer();
    submitCurrentTurn({ forceDrawSubmit: true, timedOut: true });
  }

  function ensureDrawTimerState() {
    const shouldRun = shouldRunDrawTimer();
    if (!shouldRun) {
      if (state.drawTimerActive || state.drawTimerId) {
        clearDrawTimer();
      }
      updateDrawTimerUi();
      return;
    }

    if (!state.drawTimerActive) {
      state.drawTimerActive = true;
      state.drawTimerTotalMs = DRAW_TURN_SECONDS * 1000;
      state.drawTimerRemainingMs = state.drawTimerTotalMs;
      state.drawTimerEndAt = Date.now() + state.drawTimerTotalMs;
      state.drawTimerId = window.setInterval(() => {
        const remaining = Math.max(0, state.drawTimerEndAt - Date.now());
        state.drawTimerRemainingMs = remaining;
        updateDrawTimerUi();
        if (remaining <= 0) {
          onDrawTimerTimeout();
        }
      }, 100);
    }

    state.drawTimerRemainingMs = Math.max(0, state.drawTimerEndAt - Date.now());
    updateDrawTimerUi();
  }

  function beginCountdown(seconds, { willStartMatch = false } = {}) {
    const safeSeconds = Math.max(1, Math.floor(Number(seconds) || 3));
    clearCountdownTimer();
    state.countdownActive = true;
    state.countdownSeconds = safeSeconds;
    state.countdownShowStart = false;
    state.countdownWillStart = Boolean(willStartMatch);
    state.awaitingHostSync = false;
    renderAll();

    state.countdownTimerId = window.setInterval(() => {
      state.countdownSeconds -= 1;
      if (state.countdownSeconds <= 0) {
        clearCountdownTimer();
        state.countdownActive = true;
        state.countdownSeconds = 0;
        state.countdownShowStart = true;
        const shouldStart = state.countdownWillStart;
        state.countdownWillStart = false;
        renderAll();

        state.countdownStartTimerId = window.setTimeout(() => {
          state.countdownStartTimerId = null;
          state.countdownShowStart = false;
          state.countdownActive = false;

          if (shouldStart) {
            beginGame();
            if (isRoomMode() && state.roomRole === "host") {
              options.onRoomNewGame?.();
              options.onRoomSnapshot?.();
            }
          } else {
            setOverlay("ホストから同期中...");
            setMessage("カウントダウン終了。ホストの同期を待っています...");
            renderAll();
          }
        }, 650);
        return;
      }
      renderAll();
    }, 1000);
  }

  function normalizeTheme(value) {
    return ALLOWED_THEMES.has(value) ? value : "random";
  }

  function clearCanvasPixels() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    state.drawnSinceTurnStart = false;
    state.strokeCount = 0;
  }

  function normalizeColor(value) {
    const text = String(value || "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(text)) return text;
    return "#000000";
  }

  function normalizeSize(value, min, max, fallback) {
    const numeric = Math.floor(Number(value));
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function updateSizeValueLabels() {
    if (brushSizeValueEl) brushSizeValueEl.textContent = String(state.brushSize);
    if (eraserSizeValueEl) eraserSizeValueEl.textContent = String(state.eraserSize);
  }

  function applyBrushMode() {
    if (!ctx) return;
    ctx.globalAlpha = 1;
    if (state.eraserMode) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = state.eraserSize;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = state.brushColor;
      ctx.lineWidth = state.brushSize;
    }
  }

  function currentCssCanvasSize() {
    const rect = canvasEl.getBoundingClientRect();
    const width = Math.floor(rect.width || 0);
    const height = Math.floor(rect.height || 0);
    return { width, height };
  }

  function isCanvasResolutionOutOfSync() {
    const { width, height } = currentCssCanvasSize();
    if (width < 8 || height < 8) return false;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const expectedWidth = Math.floor(width * dpr);
    const expectedHeight = Math.floor(height * dpr);
    return Math.abs(canvasEl.width - expectedWidth) > 2 || Math.abs(canvasEl.height - expectedHeight) > 2;
  }

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvasEl.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(rect.width || 0));
    const cssHeight = Math.max(1, Math.floor(rect.height || 0));
    const prevDrawn = state.drawnSinceTurnStart;
    const prevStrokeCount = state.strokeCount;
    const previousDataUrl = prevDrawn && canvasEl.width > 0 && canvasEl.height > 0 ? canvasEl.toDataURL("image/png") : "";

    canvasEl.width = Math.floor(cssWidth * dpr);
    canvasEl.height = Math.floor(cssHeight * dpr);
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    applyBrushMode();
    clearCanvasPixels();

    if (previousDataUrl) {
      const image = new Image();
      image.onload = () => {
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, cssWidth, cssHeight);
        state.drawnSinceTurnStart = prevDrawn;
        state.strokeCount = prevStrokeCount;
      };
      image.src = previousDataUrl;
    }
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function roomPlayerCount() {
    return sanitizePlayerCount(state.participants.length);
  }

  function effectivePlayerCount() {
    return isRoomMode() ? roomPlayerCount() : sanitizePlayerCount(state.playerCount);
  }

  function currentPlayerNumber() {
    return (state.stepIndex % effectivePlayerCount()) + 1;
  }

  function currentActionType() {
    return state.stepIndex % 2 === 0 ? "draw" : "guess";
  }

  function gameFinished() {
    return state.stepIndex >= effectivePlayerCount();
  }

  function turnOwner() {
    if (!isRoomMode() || state.participants.length === 0) return null;
    const idx = state.stepIndex % effectivePlayerCount();
    return state.participants[idx] || null;
  }

  function isLocalPlayersTurn() {
    if (!isRoomMode()) return true;
    const owner = turnOwner();
    if (!owner) return state.roomRole === "host";
    return owner.id === state.localPeerId;
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

  function setPassOverlay(visible, text = "") {
    state.waitingForReady = Boolean(visible);
    if (!passOverlayEl) return;
    passOverlayEl.classList.toggle("hidden", !visible);
    if (passTextEl) passTextEl.textContent = text;
  }

  function setMessage(text) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
  }

  function makeDrawingFileName() {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const step = Math.max(1, state.stepIndex + 1);
    return `drawing-relay-p${currentPlayerNumber()}-step${step}-${stamp}.png`;
  }

  function makeResultFileName(stepIndex, playerNumber) {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const safeStep = Math.max(1, Number(stepIndex) + 1);
    const safePlayer = Math.max(1, Number(playerNumber) || 1);
    return `drawing-relay-result-p${safePlayer}-step${safeStep}-${stamp}.png`;
  }

  function downloadPngDataUrl(dataUrl, filename) {
    if (!dataUrl || typeof dataUrl !== "string") return false;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename || "drawing-relay.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  }

  function sourceEntry() {
    if (state.entries.length === 0) return null;
    return state.entries[state.entries.length - 1];
  }

  function renderReveal() {
    if (!revealListEl) return;
    revealListEl.innerHTML = "";

    state.entries.forEach((entry, index) => {
      const card = document.createElement("article");
      card.className = "drawing-relay-result-item";

      const head = document.createElement("header");
      head.className = "drawing-relay-result-head";
      const step = document.createElement("span");
      step.textContent = `STEP ${index + 1}`;
      const owner = document.createElement("span");
      owner.textContent = entry.by > 0 ? `P${entry.by}` : "SYSTEM";
      head.append(step, owner);
      card.appendChild(head);

      if (entry.type === "drawing" && entry.image) {
        const img = document.createElement("img");
        img.className = "drawing-relay-result-image";
        img.src = entry.image;
        img.alt = `Drawing step ${index + 1}`;
        card.appendChild(img);

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "start-btn ghost drawing-relay-result-save-btn";
        saveBtn.textContent = "この画像をPNG保存";
        saveBtn.addEventListener("click", () => {
          const saved = downloadPngDataUrl(entry.image, makeResultFileName(index, entry.by));
          if (saved) {
            setMessage(`STEP ${index + 1} の画像を保存しました。`);
          }
        });
        card.appendChild(saveBtn);
      } else {
        const text = document.createElement("p");
        text.className = "drawing-relay-result-text";
        text.textContent = entry.text || "-";
        card.appendChild(text);
      }

      revealListEl.appendChild(card);
    });
  }

  function updateTurnView() {
    const action = currentActionType();
    const player = currentPlayerNumber();
    const localTurn = isLocalPlayersTurn();
    const owner = turnOwner();

    if (turnTextEl) turnTextEl.textContent = `P${player}`;
    if (phaseTextEl) phaseTextEl.textContent = action === "draw" ? "DRAW" : "GUESS";

    const src = sourceEntry();
    const sourceIsText = src && (src.type === "prompt" || src.type === "guess");

    if (clueLabelEl) {
      clueLabelEl.textContent = sourceIsText ? "お題テキスト" : "前のイラスト";
    }

    if (action === "draw") {
      guessWrapEl?.classList.add("hidden");
      if (clueTextEl) clueTextEl.textContent = src?.text || "お題なし";
      if (cluePreviewEl) {
        cluePreviewEl.classList.add("hidden");
        cluePreviewEl.removeAttribute("src");
      }
      submitBtn.textContent = "イラストを確定";
    } else {
      guessWrapEl?.classList.remove("hidden");
      if (clueTextEl) clueTextEl.textContent = "見た絵を一言で表現してください";
      if (cluePreviewEl) {
        if (src?.image) {
          cluePreviewEl.classList.remove("hidden");
          cluePreviewEl.src = src.image;
        } else {
          cluePreviewEl.classList.add("hidden");
          cluePreviewEl.removeAttribute("src");
        }
      }
      if (guessInputEl && guessInputEl.value !== state.draftGuess) {
        guessInputEl.value = state.draftGuess;
      }
      submitBtn.textContent = "回答を確定";
    }

    const canvasEnabled = action === "draw" && localTurn && !state.roomLocked;
    canvasEl.classList.toggle("drawing-relay-canvas-disabled", !canvasEnabled);
    clearBtn.disabled = !canvasEnabled;
    if (colorInputEl) {
      colorInputEl.value = normalizeColor(state.brushColor);
      colorInputEl.disabled = !canvasEnabled;
    }
    if (eraserBtn) {
      eraserBtn.disabled = !canvasEnabled;
      eraserBtn.classList.toggle("active", state.eraserMode);
    }
    if (brushSizeInputEl) {
      brushSizeInputEl.value = String(state.brushSize);
      brushSizeInputEl.disabled = !canvasEnabled;
    }
    if (eraserSizeInputEl) {
      eraserSizeInputEl.value = String(state.eraserSize);
      eraserSizeInputEl.disabled = !canvasEnabled;
    }
    if (savePngBtn) {
      savePngBtn.disabled = !canvasEnabled;
    }
    if (autoSaveToggleEl) {
      autoSaveToggleEl.checked = Boolean(state.autoSaveDrawing);
    }
    updateSizeValueLabels();

    if (state.roomLocked) {
      setOverlay(state.roomLockMessage || "待機中");
      setMessage(state.roomLockMessage || "待機中です。");
    } else if (isRoomMode() && state.awaitingHostSync && state.roomRole !== "host") {
      setOverlay("ホストの同期待ち...");
      setMessage("送信済みです。ホストの同期を待っています...");
    } else if (isRoomMode()) {
      if (localTurn) {
        setOverlay(action === "draw" ? "" : "回答してください");
        setMessage(action === "draw" ? "イラストを描いて確定してください。" : "回答を入力して確定してください。");
      } else {
        const ownerText = owner ? `${owner.name || "Player"} (P${player})` : `P${player}`;
        setOverlay(`${ownerText} の操作待ち`);
        setMessage(`${ownerText} の番です。相手の送信を待っています。`);
      }
    } else if (action === "draw") {
      setOverlay(state.waitingForReady ? "次のプレイヤーに交代" : "");
      setMessage(`P${player} がイラストを描いて「確定」を押してください。`);
    } else {
      setOverlay(state.waitingForReady ? "次のプレイヤーに交代" : "回答してください");
      setMessage(`P${player} が絵を見て答えを入力し、「確定」を押してください。`);
    }

    submitBtn.disabled = state.roomLocked || state.waitingForReady || state.countdownActive || !localTurn || (isRoomMode() && state.awaitingHostSync && state.roomRole !== "host");
  }

  function showRevealState() {
    if (turnTextEl) turnTextEl.textContent = "-";
    if (phaseTextEl) phaseTextEl.textContent = "REVEAL";
    if (clueLabelEl) clueLabelEl.textContent = "結果";
    if (clueTextEl) clueTextEl.textContent = "最初のお題がどう変化したかを確認できます。";
    if (cluePreviewEl) {
      cluePreviewEl.classList.add("hidden");
      cluePreviewEl.removeAttribute("src");
    }
    guessWrapEl?.classList.add("hidden");
    clearBtn.disabled = true;
    submitBtn.disabled = true;
    if (savePngBtn) savePngBtn.disabled = true;
    setOverlay("");
    setMessage("伝言リレー終了。下に結果が表示されています。もう一度遊ぶには GAME START を押してください。");
  }

  function queueNextPlayerGate() {
    setPassOverlay(false);
    if (state.roomLocked || state.gameOver || isRoomMode()) {
      return;
    }
  }

  function renderAll() {
    if (isCanvasResolutionOutOfSync()) {
      resizeCanvas();
    }

    if (modeSelectEl) {
      modeSelectEl.value = state.playMode;
      modeSelectEl.disabled = true;
    }

    const effectiveCount = effectivePlayerCount();
    if (playerCountSelectEl) {
      playerCountSelectEl.value = String(effectiveCount);
      playerCountSelectEl.disabled = isRoomMode() || !state.gameOver;
    }

    if (themeSelectEl) {
      themeSelectEl.value = state.theme;
      themeSelectEl.disabled = !state.gameOver || (isRoomMode() && state.roomRole !== "host");
    }

    if (difficultySelectEl) {
      difficultySelectEl.value = state.difficulty;
      difficultySelectEl.disabled = !state.gameOver || (isRoomMode() && state.roomRole !== "host");
    }

    if (customPromptInputEl) {
      if (customPromptInputEl.value !== state.customPrompt) {
        customPromptInputEl.value = state.customPrompt;
      }
      customPromptInputEl.disabled = !state.gameOver || (isRoomMode() && state.roomRole !== "host");
    }

    if (startBtn) {
      startBtn.disabled = state.roomLocked || state.countdownActive || (isRoomMode() && state.roomRole !== "host");
    }
    if (remakeBtn) {
      remakeBtn.disabled = state.roomLocked || state.countdownActive || (isRoomMode() && state.roomRole !== "host");
    }

    renderReveal();

    if (state.countdownActive) {
      clearDrawTimer();
      if (savePngBtn) savePngBtn.disabled = true;
      setPassOverlay(false);
      if (state.countdownShowStart) {
        setOverlay("START!");
        setMessage("START!");
      } else {
        setOverlay(String(state.countdownSeconds));
        setMessage(`開始まで ${state.countdownSeconds}...`);
      }
      submitBtn.disabled = true;
      clearBtn.disabled = true;
      return;
    }

    if (state.gameOver) {
      clearDrawTimer();
      if (savePngBtn) savePngBtn.disabled = true;
      if (state.entries.length > 0) {
        showRevealState();
      } else if (isRoomMode()) {
        setOverlay(state.roomLocked ? state.roomLockMessage || "待機中" : "ホストが開始できます");
        setMessage("ホストが GAME START を押すと開始します。");
      } else {
        setOverlay("GAME STARTで開始");
        setMessage("GAME STARTを押すと、お絵描き伝言ゲームが始まります。");
      }
      return;
    }

    updateTurnView();
    ensureDrawTimerState();
  }

  function beginGame() {
    const nextPlayerCount = isRoomMode() ? effectivePlayerCount() : sanitizePlayerCount(playerCountSelectEl?.value);
    if (nextPlayerCount < 2) {
      setMessage("2人以上で開始してください。");
      return;
    }

    state.playerCount = nextPlayerCount;
    state.theme = normalizeTheme(themeSelectEl?.value);
    state.difficulty = normalizeDifficulty(difficultySelectEl?.value);
    state.customPrompt = normalizeText(customPromptInputEl?.value ?? state.customPrompt, "").slice(0, 64);
    state.stepIndex = 0;
    state.gameOver = false;
    state.entries = [
      {
        type: "prompt",
        by: 0,
        text: state.customPrompt || selectPromptByDifficulty(state.theme, state.difficulty),
        image: "",
      },
    ];
    state.draftGuess = "";
    state.awaitingHostSync = false;
    cancelCountdown();
    clearDrawTimer();
    clearCanvasPixels();
    setPassOverlay(false);
    queueNextPlayerGate();
    renderAll();
  }

  function finishGame() {
    state.gameOver = true;
    clearDrawTimer();
    setPassOverlay(false);
    renderAll();
  }

  function advanceTurn() {
    clearDrawTimer();
    state.stepIndex += 1;
    state.draftGuess = "";
    clearCanvasPixels();

    if (gameFinished()) {
      finishGame();
      return;
    }

    queueNextPlayerGate();
    renderAll();
  }

  function applySubmittedTurn({ type, image = "", text = "" } = {}) {
    if (state.gameOver || state.roomLocked) return false;
    const action = currentActionType();
    const player = currentPlayerNumber();

    if (type === "submit-draw") {
      if (action !== "draw") return false;
      if (!image) return false;
      state.entries.push({
        type: "drawing",
        by: player,
        image,
        text: "",
      });
      advanceTurn();
      return true;
    }

    if (type === "submit-guess") {
      if (action !== "guess") return false;
      const answer = normalizeText(text, "");
      if (!answer) return false;
      state.entries.push({
        type: "guess",
        by: player,
        text: answer,
        image: "",
      });
      advanceTurn();
      return true;
    }

    return false;
  }

  function canvasPoint(event) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function canDrawNow() {
    return !state.gameOver && !state.roomLocked && !state.waitingForReady && currentActionType() === "draw" && isLocalPlayersTurn();
  }

  function startStroke(event) {
    if (!ctx || !canDrawNow()) return;
    state.isDrawing = true;
    const point = canvasPoint(event);
    applyBrushMode();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    event.preventDefault();
  }

  function moveStroke(event) {
    if (!ctx || !state.isDrawing || !canDrawNow()) return;
    const point = canvasPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    state.drawnSinceTurnStart = true;
    state.strokeCount += 1;
    event.preventDefault();
  }

  function endStroke() {
    if (!state.isDrawing) return;
    state.isDrawing = false;
  }

  function clearCanvasByUser() {
    if (!canDrawNow()) return;
    clearCanvasPixels();
    setMessage("キャンバスをクリアしました。");
  }

  function enterStandby() {
    state.playMode = "local";
    if (!isRoomMode()) {
      state.gameMode = "local";
      state.roomRole = null;
      state.roomCode = null;
      state.participants = [];
    }
    state.gameOver = true;
    state.roomLocked = false;
    state.roomLockMessage = "";
    state.entries = [];
    state.stepIndex = 0;
    state.draftGuess = "";
    state.awaitingHostSync = false;
    state.eraserMode = false;
    cancelCountdown();
    clearDrawTimer();
    setPassOverlay(false);
    clearCanvasPixels();
    renderAll();
  }

  startBtn?.addEventListener("click", () => {
    if (state.roomLocked) return;

    if (isRoomMode()) {
      if (state.roomRole !== "host") return;
      if (effectivePlayerCount() < 2) {
        setMessage("2人以上がルームに参加してから開始してください。");
        return;
      }
      beginCountdown(3, { willStartMatch: true });
      options.onRoomCountdownStart?.(3);
      return;
    }

    beginCountdown(3, { willStartMatch: true });
  });

  remakeBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("リメイクします。よろしいですか？");
    if (!confirmed) return;

    if (isRoomMode()) {
      if (state.roomRole !== "host") return;
      options.onRoomRemake?.();
    }

    enterStandby();
  });

  submitBtn?.addEventListener("click", () => {
    submitCurrentTurn();
  });

  clearBtn?.addEventListener("click", () => {
    clearCanvasByUser();
  });

  savePngBtn?.addEventListener("click", () => {
    if (savePngBtn.disabled) return;
    if (!state.drawnSinceTurnStart || state.strokeCount < 1) {
      setMessage("保存する前にイラストを描いてください。");
      return;
    }
    const image = canvasEl.toDataURL("image/png");
    const saved = downloadPngDataUrl(image, makeDrawingFileName());
    if (saved) {
      setMessage("PNGで保存しました。");
    }
  });

  autoSaveToggleEl?.addEventListener("change", () => {
    state.autoSaveDrawing = Boolean(autoSaveToggleEl.checked);
  });

  readyBtn?.addEventListener("click", () => {
    if (isRoomMode()) {
      setPassOverlay(false);
      renderAll();
      return;
    }
    if (state.roomLocked || state.gameOver) {
      setPassOverlay(false);
      return;
    }
    setPassOverlay(false);
    submitBtn.disabled = false;
    setOverlay(currentActionType() === "draw" ? "" : "回答してください");
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });

  playerCountSelectEl?.addEventListener("change", () => {
    if (!state.gameOver || isRoomMode()) return;
    state.playerCount = sanitizePlayerCount(playerCountSelectEl.value);
    renderAll();
  });

  themeSelectEl?.addEventListener("change", () => {
    if (!state.gameOver) return;
    state.theme = normalizeTheme(themeSelectEl.value);
    renderAll();
  });

  difficultySelectEl?.addEventListener("change", () => {
    if (!state.gameOver) return;
    state.difficulty = normalizeDifficulty(difficultySelectEl.value);
    renderAll();
  });

  customPromptInputEl?.addEventListener("input", () => {
    if (!state.gameOver) return;
    state.customPrompt = normalizeText(customPromptInputEl.value, "").slice(0, 64);
  });

  colorInputEl?.addEventListener("input", () => {
    state.brushColor = normalizeColor(colorInputEl.value);
    state.eraserMode = false;
    renderAll();
  });

  brushSizeInputEl?.addEventListener("input", () => {
    state.brushSize = normalizeSize(brushSizeInputEl.value, 1, 24, 6);
    updateSizeValueLabels();
  });

  eraserSizeInputEl?.addEventListener("input", () => {
    state.eraserSize = normalizeSize(eraserSizeInputEl.value, 8, 64, 22);
    updateSizeValueLabels();
  });

  eraserBtn?.addEventListener("click", () => {
    if (eraserBtn.disabled) return;
    state.eraserMode = !state.eraserMode;
    renderAll();
  });

  guessInputEl?.addEventListener("input", () => {
    state.draftGuess = normalizeText(guessInputEl.value, "");
  });

  canvasEl.addEventListener("pointerdown", (event) => {
    canvasEl.setPointerCapture(event.pointerId);
    startStroke(event);
  });
  canvasEl.addEventListener("pointermove", moveStroke);
  canvasEl.addEventListener("pointerup", endStroke);
  canvasEl.addEventListener("pointercancel", endStroke);
  canvasEl.addEventListener("pointerleave", endStroke);

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => {
      if (state.roomLocked && !fromRemote) return;
      if (isRoomMode() && fromRemote && state.roomRole !== "host") {
        state.gameOver = false;
        state.entries = [];
        state.stepIndex = 0;
        state.draftGuess = "";
        state.awaitingHostSync = false;
        state.eraserMode = false;
        cancelCountdown();
        clearCanvasPixels();
        setPassOverlay(false);
        setOverlay("ホストから同期中...");
        setMessage("ホストがゲームを開始しました。同期を待っています...");
        renderAll();
        return;
      }
      beginGame();
    },
    enterStandby,
    stop: () => {
      state.isDrawing = false;
      cancelCountdown();
      clearDrawTimer();
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayerCount }) => {
      state.gameMode = "room";
      state.playMode = "local";
      state.roomCode = roomCode || null;
      state.roomRole = roomRole || null;
      state.playerCount = sanitizePlayerCount(roomPlayerCount || state.playerCount);
      state.gameOver = true;
      state.entries = [];
      state.stepIndex = 0;
      state.draftGuess = "";
      state.awaitingHostSync = false;
      state.eraserMode = false;
      cancelCountdown();
      clearDrawTimer();
      state.difficulty = "normal";
      state.customPrompt = "";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      setPassOverlay(false);
      clearCanvasPixels();
      renderAll();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.playMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.participants = [];
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      if (state.gameOver) {
        renderAll();
      }
    },
    setRoomParticipants: ({ count, participants } = {}) => {
      state.participants = cloneParticipants(participants);
      if (state.participants.length === 0 && Number.isFinite(Number(count)) && Number(count) > 0) {
        const syntheticCount = sanitizePlayerCount(Number(count));
        state.participants = Array.from({ length: syntheticCount }, (_, idx) => ({ id: `player-${idx + 1}`, name: `Player ${idx + 1}` }));
      }
      if (!state.gameOver) {
        renderAll();
      }
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";
      if (state.roomLocked) {
        setPassOverlay(false);
      }
      renderAll();
    },
    applyRemoteMove: (payload) => {
      if (!payload || !isRoomMode() || state.roomRole !== "host") return;
      const applied = applySubmittedTurn(payload);
      if (applied) {
        options.onRoomSnapshot?.();
      }
    },
    applyRoomCountdown: (seconds) => {
      if (!isRoomMode()) return;
      const willStart = state.roomRole === "host";
      beginCountdown(seconds, { willStartMatch: willStart });
    },
    applyRoomRemake: () => {
      enterStandby();
    },
    getSnapshot: () => ({
      playMode: state.playMode,
      gameMode: state.gameMode,
      gameOver: state.gameOver,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      roomCode: state.roomCode,
      roomRole: state.roomRole,
      playerCount: effectivePlayerCount(),
      theme: state.theme,
      difficulty: state.difficulty,
      customPrompt: state.customPrompt,
      stepIndex: state.stepIndex,
      entries: cloneEntries(state.entries),
      participants: cloneParticipants(state.participants),
      message: messageEl?.textContent || "",
      clueText: clueTextEl?.textContent || "",
      overlay: overlayEl?.textContent || "",
      cluePreview: cluePreviewEl?.src || "",
      waitingForReady: state.waitingForReady,
      passText: passTextEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot || typeof snapshot !== "object") return;
      state.playMode = "local";
      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.gameOver = Boolean(snapshot.gameOver);
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = typeof snapshot.roomLockMessage === "string" ? snapshot.roomLockMessage : "";
      state.roomCode = typeof snapshot.roomCode === "string" ? snapshot.roomCode : state.roomCode;
      state.roomRole = typeof snapshot.roomRole === "string" ? snapshot.roomRole : state.roomRole;
      state.playerCount = sanitizePlayerCount(snapshot.playerCount);
      state.theme = normalizeTheme(snapshot.theme);
      state.difficulty = normalizeDifficulty(snapshot.difficulty);
      state.customPrompt = normalizeText(snapshot.customPrompt, "").slice(0, 64);
      state.stepIndex = Number.isFinite(Number(snapshot.stepIndex)) ? Math.max(0, Math.floor(Number(snapshot.stepIndex))) : 0;
      state.entries = cloneEntries(snapshot.entries);
      state.participants = cloneParticipants(snapshot.participants);
      state.waitingForReady = Boolean(snapshot.waitingForReady);
      state.draftGuess = "";
      state.awaitingHostSync = false;
      cancelCountdown();
      clearDrawTimer();

      if (typeof snapshot.message === "string") {
        setMessage(snapshot.message);
      }
      if (typeof snapshot.clueText === "string" && clueTextEl) {
        clueTextEl.textContent = snapshot.clueText;
      }
      if (typeof snapshot.cluePreview === "string" && cluePreviewEl) {
        if (snapshot.cluePreview) {
          cluePreviewEl.classList.remove("hidden");
          cluePreviewEl.src = snapshot.cluePreview;
        } else {
          cluePreviewEl.classList.add("hidden");
          cluePreviewEl.removeAttribute("src");
        }
      }
      if (typeof snapshot.overlay === "string") {
        setOverlay(snapshot.overlay);
      }
      if (typeof snapshot.passText === "string") {
        setPassOverlay(state.waitingForReady, snapshot.passText);
      }

      clearCanvasPixels();
      renderAll();
    },
  };
}
