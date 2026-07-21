const RANDOM_TITLES = [
  "朝から大事件",
  "宇宙人のアルバイト",
  "猫とロボの休日",
  "伝説のプリン",
  "秒速の告白",
  "温泉でタイムスリップ",
  "おばけと文化祭",
  "秘密基地の夜",
];

function sanitizePlayerCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(2, Math.min(8, Math.floor(parsed)));
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text || fallback;
}

function randomItem(list) {
  if (!Array.isArray(list) || list.length === 0) return "4コマタイトル";
  return list[Math.floor(Math.random() * list.length)] || "4コマタイトル";
}

function clonePanels(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      image: typeof item.image === "string" ? item.image : "",
      by: Number.isFinite(Number(item.by)) ? Math.max(1, Math.floor(Number(item.by))) : 1,
    }));
}

function cloneParticipants(participants) {
  if (!Array.isArray(participants)) return [];
  return participants
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({ id: item.id, name: typeof item.name === "string" ? item.name : "Player" }));
}

export function initFourPanelCollab(options = {}) {
  const modeSelectEl = document.getElementById("fourPanelModeSelect");
  const playerCountSelectEl = document.getElementById("fourPanelPlayerCountSelect");
  const titleModeSelectEl = document.getElementById("fourPanelTitleModeSelect");
  const customTitleWrapEl = document.getElementById("fourPanelCustomTitleWrap");
  const customTitleInputEl = document.getElementById("fourPanelCustomTitleInput");
  const titleTextEl = document.getElementById("fourPanelTitleText");
  const turnTextEl = document.getElementById("fourPanelTurnText");
  const panelTextEl = document.getElementById("fourPanelPanelText");
  const canvasEl = document.getElementById("fourPanelCanvas");
  const overlayEl = document.getElementById("fourPanelOverlay");
  const gridEl = document.getElementById("fourPanelGrid");
  const startBtn = document.getElementById("fourPanelStartBtn");
  const remakeBtn = document.getElementById("fourPanelRemakeBtn");
  const submitBtn = document.getElementById("fourPanelSubmitBtn");
  const clearBtn = document.getElementById("fourPanelClearBtn");
  const menuBtn = document.getElementById("fourPanelMenuBtn");
  const messageEl = document.getElementById("fourPanelMessage");

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
    gameMode: "local",
    roomCode: null,
    roomRole: null,
    roomLocked: false,
    roomLockMessage: "",
    localPeerId: typeof options.localPeerId === "function" ? String(options.localPeerId() || "") : "",
    participants: [],
    playerCount: 4,
    gameOver: true,
    titleMode: "random",
    customTitle: "",
    title: "",
    panels: [],
    panelIndex: 0,
    awaitingHostSync: false,
    isDrawing: false,
    drawnSincePanelStart: false,
    strokeCount: 0,
  };

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function effectivePlayerCount() {
    return isRoomMode() ? sanitizePlayerCount(state.participants.length || state.playerCount) : sanitizePlayerCount(state.playerCount);
  }

  function currentPlayerNumber() {
    return (state.panelIndex % effectivePlayerCount()) + 1;
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

  function setMessage(text) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
  }

  function clearCanvasPixels() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    state.drawnSincePanelStart = false;
    state.strokeCount = 0;
  }

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvasEl.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(rect.width || 0));
    const cssHeight = Math.max(1, Math.floor(rect.height || 0));
    const prev = state.drawnSincePanelStart && canvasEl.width > 0 && canvasEl.height > 0 ? canvasEl.toDataURL("image/png") : "";

    canvasEl.width = Math.floor(cssWidth * dpr);
    canvasEl.height = Math.floor(cssHeight * dpr);
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    clearCanvasPixels();

    if (prev) {
      const image = new Image();
      image.onload = () => {
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, cssWidth, cssHeight);
        state.drawnSincePanelStart = true;
      };
      image.src = prev;
    }
  }

  function turnOwner() {
    if (!isRoomMode() || state.participants.length === 0) return null;
    const idx = state.panelIndex % effectivePlayerCount();
    return state.participants[idx] || null;
  }

  function isLocalPlayersTurn() {
    if (!isRoomMode()) return true;
    const owner = turnOwner();
    if (!owner) return state.roomRole === "host";
    return owner.id === state.localPeerId;
  }

  function canDrawNow() {
    return !state.gameOver && !state.roomLocked && isLocalPlayersTurn() && state.panelIndex < 4;
  }

  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = "";

    for (let i = 0; i < 4; i += 1) {
      const card = document.createElement("article");
      card.className = "four-panel-item";

      const head = document.createElement("header");
      head.className = "four-panel-item-head";
      const panel = document.createElement("span");
      panel.textContent = `PANEL ${i + 1}`;
      const owner = document.createElement("span");
      const data = state.panels[i];
      owner.textContent = data ? `P${data.by}` : "-";
      head.append(panel, owner);
      card.appendChild(head);

      if (data?.image) {
        const img = document.createElement("img");
        img.className = "four-panel-image";
        img.src = data.image;
        img.alt = `Four panel ${i + 1}`;
        card.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.className = "four-panel-placeholder";
        ph.textContent = "未作成";
        card.appendChild(ph);
      }

      gridEl.appendChild(card);
    }
  }

  function updateTitleInputUi() {
    const customMode = state.titleMode === "custom";
    customTitleWrapEl?.classList.toggle("hidden", !customMode);
    if (customTitleInputEl) {
      customTitleInputEl.disabled = !state.gameOver || !customMode || (isRoomMode() && state.roomRole !== "host");
      if (customTitleInputEl.value !== state.customTitle) {
        customTitleInputEl.value = state.customTitle;
      }
    }
  }

  function render() {
    if (modeSelectEl) modeSelectEl.value = "local";
    if (playerCountSelectEl) {
      playerCountSelectEl.value = String(effectivePlayerCount());
      playerCountSelectEl.disabled = !state.gameOver || (isRoomMode() && state.roomRole !== "host");
    }
    if (titleModeSelectEl) {
      titleModeSelectEl.value = state.titleMode;
      titleModeSelectEl.disabled = !state.gameOver || (isRoomMode() && state.roomRole !== "host");
    }
    updateTitleInputUi();

    if (titleTextEl) titleTextEl.textContent = state.title || "-";
    if (turnTextEl) turnTextEl.textContent = state.gameOver ? "-" : `P${currentPlayerNumber()}`;
    if (panelTextEl) panelTextEl.textContent = state.gameOver ? "-" : `${Math.min(4, state.panelIndex + 1)} / 4`;

    const localTurn = isLocalPlayersTurn();
    const canDraw = canDrawNow();
    const owner = turnOwner();
    const ownerName = owner ? `${owner.name || "Player"} (P${currentPlayerNumber()})` : `P${currentPlayerNumber()}`;

    canvasEl.classList.toggle("drawing-relay-canvas-disabled", !canDraw);
    submitBtn.disabled = !canDraw || (isRoomMode() && state.awaitingHostSync && state.roomRole !== "host");
    clearBtn.disabled = !canDraw;
    if (startBtn) startBtn.disabled = state.roomLocked || !state.gameOver || (isRoomMode() && state.roomRole !== "host");
    if (remakeBtn) remakeBtn.disabled = state.roomLocked || (isRoomMode() && state.roomRole !== "host");

    if (state.roomLocked) {
      setOverlay(state.roomLockMessage || "待機中");
      setMessage(state.roomLockMessage || "待機中です。");
    } else if (state.gameOver) {
      if (state.panels.length >= 4) {
        setOverlay("4コマ完成!");
        setMessage("4コマが完成しました。REMAKE か GAME START で次の作品を作れます。");
      } else {
        setOverlay("GAME STARTで開始");
        setMessage("GAME STARTで4コマ制作を開始します。");
      }
    } else if (isRoomMode() && state.awaitingHostSync && state.roomRole !== "host") {
      setOverlay("ホストの同期待ち...");
      setMessage("送信済みです。ホストの同期を待っています...");
    } else if (!localTurn) {
      setOverlay(`${ownerName} の作業中`);
      setMessage(`${ownerName} がコマを描いています。`);
    } else {
      setOverlay("");
      setMessage(`P${currentPlayerNumber()} が PANEL ${state.panelIndex + 1} を描いて確定してください。`);
    }

    renderGrid();
  }

  function canvasPoint(event) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startStroke(event) {
    if (!ctx || !canDrawNow()) return;
    state.isDrawing = true;
    const point = canvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    event.preventDefault();
  }

  function moveStroke(event) {
    if (!ctx || !state.isDrawing || !canDrawNow()) return;
    const point = canvasPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    state.drawnSincePanelStart = true;
    state.strokeCount += 1;
    event.preventDefault();
  }

  function endStroke() {
    if (!state.isDrawing) return;
    state.isDrawing = false;
  }

  function finalizePanel(image) {
    state.panels.push({ image, by: currentPlayerNumber() });
    state.panelIndex += 1;
    state.awaitingHostSync = false;
    clearCanvasPixels();
    if (state.panelIndex >= 4) {
      state.gameOver = true;
    }
    render();
  }

  function applySubmittedPanel(payload) {
    if (!payload || payload.type !== "submit-panel") return false;
    if (state.gameOver || state.roomLocked || state.panelIndex >= 4) return false;
    if (typeof payload.image !== "string" || !payload.image) return false;
    finalizePanel(payload.image);
    return true;
  }

  function submitCurrentPanel() {
    if (!canDrawNow()) return;
    if (!state.drawnSincePanelStart || state.strokeCount < 2) {
      setMessage("コマがまだ描かれていません。描いてから確定してください。");
      return;
    }

    const image = canvasEl.toDataURL("image/png");

    if (isRoomMode() && state.roomRole !== "host") {
      options.onRoomMove?.({ type: "submit-panel", image });
      state.awaitingHostSync = true;
      render();
      return;
    }

    const applied = applySubmittedPanel({ type: "submit-panel", image });
    if (applied && isRoomMode() && state.roomRole === "host") {
      options.onRoomSnapshot?.();
    }
  }

  function startStory() {
    const selectedCount = isRoomMode() ? effectivePlayerCount() : sanitizePlayerCount(playerCountSelectEl?.value);
    if (selectedCount < 2) {
      setMessage("2人以上で開始してください。");
      return;
    }

    state.playerCount = selectedCount;
    state.titleMode = titleModeSelectEl?.value === "custom" ? "custom" : "random";
    state.customTitle = normalizeText(customTitleInputEl?.value, "").slice(0, 40);
    state.title = state.titleMode === "custom" && state.customTitle ? state.customTitle : randomItem(RANDOM_TITLES);
    state.panels = [];
    state.panelIndex = 0;
    state.gameOver = false;
    state.awaitingHostSync = false;
    clearCanvasPixels();
    render();
  }

  function enterStandby() {
    if (!isRoomMode()) {
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.participants = [];
    }
    state.gameOver = true;
    state.roomLocked = false;
    state.roomLockMessage = "";
    state.titleMode = "random";
    state.customTitle = "";
    state.title = "";
    state.panels = [];
    state.panelIndex = 0;
    state.awaitingHostSync = false;
    clearCanvasPixels();
    render();
  }

  startBtn?.addEventListener("click", () => {
    if (state.roomLocked) return;
    if (isRoomMode() && state.roomRole !== "host") return;
    startStory();
    if (isRoomMode() && state.roomRole === "host") {
      options.onRoomNewGame?.();
      options.onRoomSnapshot?.();
    }
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

  submitBtn?.addEventListener("click", submitCurrentPanel);

  clearBtn?.addEventListener("click", () => {
    if (!canDrawNow()) return;
    clearCanvasPixels();
    setMessage("このコマをクリアしました。");
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });

  playerCountSelectEl?.addEventListener("change", () => {
    if (!state.gameOver || isRoomMode()) return;
    state.playerCount = sanitizePlayerCount(playerCountSelectEl.value);
    render();
  });

  titleModeSelectEl?.addEventListener("change", () => {
    if (!state.gameOver) return;
    state.titleMode = titleModeSelectEl.value === "custom" ? "custom" : "random";
    render();
  });

  customTitleInputEl?.addEventListener("input", () => {
    if (!state.gameOver) return;
    state.customTitle = normalizeText(customTitleInputEl.value, "").slice(0, 40);
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
        state.panels = [];
        state.panelIndex = 0;
        state.awaitingHostSync = false;
        clearCanvasPixels();
        setOverlay("ホストから同期中...");
        setMessage("ホストの開始を受信しました。同期を待っています...");
        render();
        return;
      }
      startStory();
    },
    enterStandby,
    stop: () => {
      state.isDrawing = false;
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayerCount }) => {
      state.gameMode = "room";
      state.roomCode = roomCode || null;
      state.roomRole = roomRole || null;
      state.playerCount = sanitizePlayerCount(roomPlayerCount || state.playerCount);
      state.gameOver = true;
      state.panels = [];
      state.panelIndex = 0;
      state.awaitingHostSync = false;
      options.onRoomStatusChange?.({ roomCode, roomRole });
      clearCanvasPixels();
      render();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.participants = [];
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      if (state.gameOver) {
        render();
      }
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";
      render();
    },
    setRoomParticipants: ({ count, participants } = {}) => {
      state.participants = cloneParticipants(participants);
      if (state.participants.length === 0 && Number.isFinite(Number(count)) && Number(count) > 0) {
        const syntheticCount = sanitizePlayerCount(Number(count));
        state.participants = Array.from({ length: syntheticCount }, (_, idx) => ({ id: `player-${idx + 1}`, name: `Player ${idx + 1}` }));
      }
      if (!state.gameOver) render();
    },
    applyRemoteMove: (payload) => {
      if (!payload || !isRoomMode() || state.roomRole !== "host") return;
      const applied = applySubmittedPanel(payload);
      if (applied) {
        options.onRoomSnapshot?.();
      }
    },
    applyRoomRemake: () => {
      enterStandby();
    },
    getSnapshot: () => ({
      gameMode: state.gameMode,
      gameOver: state.gameOver,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      roomCode: state.roomCode,
      roomRole: state.roomRole,
      playerCount: effectivePlayerCount(),
      titleMode: state.titleMode,
      customTitle: state.customTitle,
      title: state.title,
      panels: clonePanels(state.panels),
      panelIndex: state.panelIndex,
      participants: cloneParticipants(state.participants),
      awaitingHostSync: state.awaitingHostSync,
      message: messageEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot || typeof snapshot !== "object") return;
      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.gameOver = Boolean(snapshot.gameOver);
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = typeof snapshot.roomLockMessage === "string" ? snapshot.roomLockMessage : "";
      state.roomCode = typeof snapshot.roomCode === "string" ? snapshot.roomCode : state.roomCode;
      state.roomRole = typeof snapshot.roomRole === "string" ? snapshot.roomRole : state.roomRole;
      state.playerCount = sanitizePlayerCount(snapshot.playerCount);
      state.titleMode = snapshot.titleMode === "custom" ? "custom" : "random";
      state.customTitle = normalizeText(snapshot.customTitle, "").slice(0, 40);
      state.title = normalizeText(snapshot.title, "");
      state.panels = clonePanels(snapshot.panels);
      state.panelIndex = Number.isFinite(Number(snapshot.panelIndex)) ? Math.max(0, Math.floor(Number(snapshot.panelIndex))) : 0;
      state.participants = cloneParticipants(snapshot.participants);
      state.awaitingHostSync = Boolean(snapshot.awaitingHostSync);
      state.isDrawing = false;
      clearCanvasPixels();
      if (typeof snapshot.message === "string") {
        setMessage(snapshot.message);
      }
      render();
    },
  };
}
