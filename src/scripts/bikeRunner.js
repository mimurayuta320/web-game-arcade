const CANVAS_W = 960;
const CANVAS_H = 360;
const GROUND_H = 62;
const GRAVITY = 1880;
const BASE_SPEED = 210;
const MAX_SPEED = 560;
const AUTO_ACCEL_PER_SEC = 4.4;
const DASH_SCROLL_BONUS = 120;
const LATERAL_SPEED = 220;
const START_LIVES = 3;
const BEST_SCORE_KEY = "neon-bike-runner-best-v1";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function initBikeRunner(options = {}) {
  const screenEl = document.getElementById("bikeRunnerScreen");
  const canvas = document.getElementById("bikeRunnerCanvas");
  const overlayEl = document.getElementById("bikeRunnerOverlay");
  const messageEl = document.getElementById("bikeRunnerMessage");
  const speedTextEl = document.getElementById("bikeRunnerSpeedText");
  const distanceTextEl = document.getElementById("bikeRunnerDistanceText");
  const lifeTextEl = document.getElementById("bikeRunnerLifeText");
  const coinTextEl = document.getElementById("bikeRunnerCoinText");
  const bestTextEl = document.getElementById("bikeRunnerBestText");

  const startBtn = document.getElementById("bikeRunnerStartBtn");
  const remakeBtn = document.getElementById("bikeRunnerRemakeBtn");
  const menuBtn = document.getElementById("bikeRunnerMenuBtn");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return {
      enterStandby: () => {},
      configureStandardMode: () => {},
      configureRoomMode: () => {},
      setRoomLock: () => {},
      startNewGame: () => {},
      applySnapshot: () => {},
      getSnapshot: () => null,
      applyRemoteMove: () => {},
    };
  }

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      enterStandby: () => {},
      configureStandardMode: () => {},
      configureRoomMode: () => {},
      setRoomLock: () => {},
      startNewGame: () => {},
      applySnapshot: () => {},
      getSnapshot: () => null,
      applyRemoteMove: () => {},
    };
  }

  const state = {
    running: false,
    rafId: 0,
    lastTs: 0,
    gameMode: "local",
    roomLocked: false,
    roomLockMessage: "",
    groundY: CANVAS_H - GROUND_H,
    speed: BASE_SPEED,
    distance: 0,
    coins: 0,
    lives: START_LIVES,
    bestDistance: Number(localStorage.getItem(BEST_SCORE_KEY) || 0),
    obstacles: [],
    pickups: [],
    spawnObstacleIn: 0.9,
    spawnPickupIn: 1.2,
    invincible: 0,
    worldPhase: 0,
    player: {
      x: 140,
      y: 0,
      w: 56,
      h: 28,
      vy: 0,
      onGround: true,
      jumpsLeft: 2,
      dashTimer: 0,
      lean: 0,
    },
    keys: {
      left: false,
      right: false,
    },
  };

  state.player.y = state.groundY - state.player.h;

  function setOverlay(text) {
    if (!overlayEl) return;
    if (text) {
      overlayEl.textContent = text;
      overlayEl.style.opacity = "1";
    } else {
      overlayEl.textContent = "";
      overlayEl.style.opacity = "0";
    }
  }

  function setMessage(text) {
    if (messageEl) messageEl.textContent = text;
  }

  function updateHud() {
    if (speedTextEl) speedTextEl.textContent = `${Math.round(Math.max(0, state.speed))} km/h`;
    if (distanceTextEl) distanceTextEl.textContent = `${Math.floor(state.distance)} m`;
    if (lifeTextEl) lifeTextEl.textContent = String(state.lives);
    if (coinTextEl) coinTextEl.textContent = String(state.coins);
    if (bestTextEl) bestTextEl.textContent = `${Math.floor(state.bestDistance)} m`;
  }

  function saveBestIfNeeded() {
    if (state.distance <= state.bestDistance) return;
    state.bestDistance = state.distance;
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(Math.floor(state.bestDistance)));
    } catch {
      // Ignore storage errors and continue gameplay.
    }
  }

  function jump() {
    if (!state.running || state.roomLocked) return;
    if (state.player.jumpsLeft <= 0) return;

    state.player.vy = state.player.jumpsLeft === 2 ? -720 : -630;
    state.player.onGround = false;
    state.player.jumpsLeft -= 1;
    state.player.lean = -1;
  }

  function dash() {
    if (!state.running || state.roomLocked) return;
    if (state.player.dashTimer > 0) return;
    state.player.dashTimer = 0.26;
  }

  function handleKeyDown(event) {
    if (event.repeat) return;

    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      state.keys.left = true;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      state.keys.right = true;
    }
    if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space") {
      event.preventDefault();
      jump();
    }
    if (event.code === "KeyX" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
      dash();
    }
  }

  function handleKeyUp(event) {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      state.keys.left = false;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      state.keys.right = false;
    }
  }

  function spawnObstacle() {
    const typeRoll = Math.random();
    const obstacle = {
      x: CANVAS_W + randomRange(24, 170),
      w: 0,
      h: 0,
      y: 0,
      kind: "barrier",
    };

    if (typeRoll < 0.58) {
      obstacle.kind = "barrier";
      obstacle.w = randomRange(24, 52);
      obstacle.h = randomRange(34, 86);
      obstacle.y = state.groundY - obstacle.h;
    } else if (typeRoll < 0.9) {
      obstacle.kind = "cone";
      obstacle.w = randomRange(34, 60);
      obstacle.h = randomRange(26, 46);
      obstacle.y = state.groundY - obstacle.h;
    } else {
      obstacle.kind = "gate";
      obstacle.w = randomRange(44, 80);
      obstacle.h = randomRange(60, 86);
      obstacle.y = state.groundY - obstacle.h;
    }

    state.obstacles.push(obstacle);
    state.spawnObstacleIn = randomRange(0.68, 1.32) * clamp(520 / state.speed, 0.6, 1.1);
  }

  function spawnPickup() {
    const pickup = {
      x: CANVAS_W + randomRange(10, 120),
      y: state.groundY - randomRange(70, 150),
      r: 11,
      pulse: Math.random() * Math.PI * 2,
    };
    state.pickups.push(pickup);
    state.spawnPickupIn = randomRange(0.95, 1.75);
  }

  function hitObstacle() {
    if (state.invincible > 0) return;
    state.lives -= 1;
    state.invincible = 1.35;
    state.player.dashTimer = 0;

    if (state.lives <= 0) {
      state.running = false;
      saveBestIfNeeded();
      setOverlay("GAME OVER");
      setMessage(`クラッシュ... 距離 ${Math.floor(state.distance)}m / [R] でもう一度`);
    } else {
      setMessage(`ぶつかった! 残りライフ ${state.lives}`);
    }
  }

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    if (!state.running) return;

    state.speed = Math.min(MAX_SPEED, state.speed + AUTO_ACCEL_PER_SEC * dt);
    const scrollSpeed = state.speed + (state.player.dashTimer > 0 ? DASH_SCROLL_BONUS : 0);
    const worldScroll = scrollSpeed * dt;
    state.distance += worldScroll * 0.18;
    state.worldPhase += worldScroll * 0.032;
    state.invincible = Math.max(0, state.invincible - dt);
    state.player.dashTimer = Math.max(0, state.player.dashTimer - dt);

    if (state.keys.left && !state.keys.right) {
      state.player.x -= dt * LATERAL_SPEED;
      state.player.lean = clamp(state.player.lean - dt * 2.8, -1, 1);
    } else if (state.keys.right && !state.keys.left) {
      state.player.x += dt * LATERAL_SPEED;
      state.player.lean = clamp(state.player.lean + dt * 2.8, -1, 1);
    } else {
      state.player.lean *= 0.86;
    }
    state.player.x = clamp(state.player.x, 70, CANVAS_W - 140);

    state.player.vy += GRAVITY * dt;
    state.player.y += state.player.vy * dt;

    const floorY = state.groundY - state.player.h;
    if (state.player.y >= floorY) {
      state.player.y = floorY;
      state.player.vy = 0;
      state.player.onGround = true;
      state.player.jumpsLeft = 2;
    } else {
      state.player.onGround = false;
    }

    if (scrollSpeed > 20) {
      const pace = clamp(scrollSpeed / MAX_SPEED, 0.1, 1.25);
      state.spawnObstacleIn -= dt * (0.35 + pace);
      if (state.spawnObstacleIn <= 0) {
        spawnObstacle();
      }

      state.spawnPickupIn -= dt * (0.28 + pace * 0.82);
      if (state.spawnPickupIn <= 0) {
        spawnPickup();
      }
    }

    state.obstacles.forEach((obstacle) => {
      obstacle.x -= worldScroll;
    });
    state.pickups.forEach((pickup) => {
      pickup.x -= worldScroll;
      pickup.pulse += dt * 7;
    });

    state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -80);
    state.pickups = state.pickups.filter((pickup) => pickup.x + pickup.r > -30);

    const playerHitBox = {
      x: state.player.x + 6,
      y: state.player.y + 2,
      w: state.player.w - 10,
      h: state.player.h - 2,
    };

    for (const obstacle of state.obstacles) {
      if (state.player.dashTimer > 0) {
        continue;
      }
      const obstacleBox = {
        x: obstacle.x,
        y: obstacle.y,
        w: obstacle.w,
        h: obstacle.h,
      };
      if (intersects(playerHitBox, obstacleBox)) {
        hitObstacle();
        break;
      }
    }

    for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = state.pickups[i];
      const px = state.player.x + state.player.w * 0.5;
      const py = state.player.y + state.player.h * 0.42;
      const dx = px - pickup.x;
      const dy = py - pickup.y;
      if (dx * dx + dy * dy <= (pickup.r + 16) * (pickup.r + 16)) {
        state.coins += 1;
        state.pickups.splice(i, 1);
      }
    }

    saveBestIfNeeded();
    updateHud();
  }

  function renderBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, "#0e2746");
    sky.addColorStop(0.52, "#224a66");
    sky.addColorStop(1, "#5d6d46");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const cloudShift = state.worldPhase * 0.35;
    for (let i = 0; i < 8; i += 1) {
      const cx = ((i * 190 - cloudShift) % (CANVAS_W + 260)) - 130;
      const cy = 34 + (i % 3) * 30;
      ctx.fillStyle = "rgba(240, 252, 255, 0.13)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52, 17, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const hillShift = state.worldPhase * 0.58;
    ctx.fillStyle = "rgba(22, 54, 70, 0.62)";
    for (let i = 0; i < 7; i += 1) {
      const baseX = ((i * 220 - hillShift) % (CANVAS_W + 320)) - 160;
      ctx.beginPath();
      ctx.moveTo(baseX, state.groundY + 16);
      ctx.quadraticCurveTo(baseX + 110, state.groundY - 84, baseX + 220, state.groundY + 16);
      ctx.closePath();
      ctx.fill();
    }

    const canyonTop = state.groundY + 4;
    const canyonBottom = CANVAS_H;
    const rockShift = state.worldPhase * 2.1;

    // Draw the ravine body first so the passable path can sit above it.
    const canyonGrad = ctx.createLinearGradient(0, canyonTop, 0, canyonBottom);
    canyonGrad.addColorStop(0, "#5b3b2e");
    canyonGrad.addColorStop(0.4, "#3d251f");
    canyonGrad.addColorStop(1, "#1d1111");
    ctx.fillStyle = canyonGrad;
    ctx.fillRect(0, canyonTop, CANVAS_W, canyonBottom - canyonTop);

    // Add repeating rock spires to sell a cliffside track.
    ctx.fillStyle = "rgba(95, 59, 41, 0.65)";
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 118 - rockShift) % (CANVAS_W + 180)) - 90;
      const top = canyonTop + 12 + (i % 3) * 8;
      ctx.beginPath();
      ctx.moveTo(x, canyonBottom);
      ctx.lineTo(x + 18, top + 50);
      ctx.lineTo(x + 42, top + 10);
      ctx.lineTo(x + 72, canyonBottom);
      ctx.closePath();
      ctx.fill();
    }

    // Playable path at cliff edge.
    const pathY = state.groundY;
    ctx.fillStyle = "#6d4c35";
    ctx.fillRect(0, pathY, CANVAS_W, GROUND_H);
    ctx.fillStyle = "#7f5a3f";
    ctx.fillRect(0, pathY, CANVAS_W, 9);

    // Cracked chalk line on the path to preserve speed readability.
    ctx.fillStyle = "#e4c889";
    const laneShift = state.worldPhase * 2.1;
    for (let i = 0; i < 16; i += 1) {
      const dashX = ((i * 90 - laneShift) % (CANVAS_W + 110)) - 55;
      ctx.fillRect(dashX, pathY + GROUND_H * 0.47, 36, 3);
    }
  }

  function renderObstacle(obstacle) {
    if (obstacle.kind === "barrier") {
      ctx.fillStyle = "#7d4f32";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
      ctx.fillStyle = "#d38f57";
      ctx.fillRect(obstacle.x + 5, obstacle.y + 6, obstacle.w - 10, 10);
      return;
    }

    if (obstacle.kind === "gate") {
      ctx.fillStyle = "#505f73";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
      ctx.clearRect(obstacle.x + 8, obstacle.y + 14, obstacle.w - 16, obstacle.h - 14);
      ctx.fillStyle = "#fcbf49";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, 7);
      return;
    }

    ctx.fillStyle = "#d86d34";
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y + obstacle.h);
    ctx.lineTo(obstacle.x + obstacle.w * 0.5, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.w, obstacle.y + obstacle.h);
    ctx.closePath();
    ctx.fill();
  }

  function renderPickups() {
    state.pickups.forEach((pickup) => {
      const pulse = 1 + Math.sin(pickup.pulse) * 0.12;
      ctx.fillStyle = "rgba(255, 220, 84, 0.2)";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.r * 1.8 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffd24d";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.r * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(pickup.x - 2, pickup.y - 5, 4, 10);
    });
  }

  function renderPlayer() {
    const alpha = state.invincible > 0 ? 0.55 + Math.sin(performance.now() * 0.03) * 0.25 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    const centerX = state.player.x + state.player.w * 0.52;
    const centerY = state.player.y + state.player.h * 0.56;
    const tilt = state.player.lean * 0.17;

    ctx.translate(centerX, centerY);
    ctx.rotate(tilt);
    ctx.translate(-centerX, -centerY);

    const wheelY = state.player.y + state.player.h;
    const frontX = state.player.x + 42;
    const rearX = state.player.x + 11;

    ctx.fillStyle = "#1d232d";
    ctx.beginPath();
    ctx.arc(frontX, wheelY, 11, 0, Math.PI * 2);
    ctx.arc(rearX, wheelY, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rearX, wheelY);
    ctx.lineTo(state.player.x + 26, state.player.y + 14);
    ctx.lineTo(frontX, wheelY);
    ctx.lineTo(rearX, wheelY);
    ctx.stroke();

    ctx.strokeStyle = "#8ecae6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(state.player.x + 26, state.player.y + 14);
    ctx.lineTo(state.player.x + 32, state.player.y + 4);
    ctx.lineTo(state.player.x + 46, state.player.y + 2);
    ctx.stroke();

    ctx.fillStyle = state.player.dashTimer > 0 ? "#f94144" : "#ff7f51";
    ctx.fillRect(state.player.x + 20, state.player.y - 2, 14, 15);

    ctx.fillStyle = "#ffe8cc";
    ctx.beginPath();
    ctx.arc(state.player.x + 28, state.player.y - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    if (state.player.dashTimer > 0) {
      ctx.fillStyle = "rgba(255, 189, 99, 0.6)";
      for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(state.player.x - 10 - i * 12, state.player.y + 6 + i * 3, 14 - i * 2, 3);
      }
    }

    ctx.restore();
  }

  function render() {
    renderBackground();

    state.obstacles.forEach((obstacle) => {
      renderObstacle(obstacle);
    });

    renderPickups();
    renderPlayer();
  }

  function tick(ts) {
    const dtRaw = state.lastTs ? (ts - state.lastTs) / 1000 : 0;
    state.lastTs = ts;
    const dt = clamp(dtRaw, 0, 1 / 24);

    update(dt);
    render();

    if (state.running) {
      state.rafId = window.requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    state.running = false;
  }

  function startLoop() {
    stopLoop();
    state.running = true;
    state.lastTs = 0;
    state.rafId = window.requestAnimationFrame(tick);
  }

  function resetGame() {
    state.speed = BASE_SPEED;
    state.distance = 0;
    state.coins = 0;
    state.lives = START_LIVES;
    state.invincible = 0;
    state.worldPhase = 0;
    state.obstacles = [];
    state.pickups = [];
    state.spawnObstacleIn = 0.85;
    state.spawnPickupIn = 1.15;

    state.player.x = 140;
    state.player.y = state.groundY - state.player.h;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.jumpsLeft = 2;
    state.player.dashTimer = 0;

    setOverlay("");
    setMessage("自動スクロール中 | ←/A と →/D で回避移動 | Space/↑でジャンプ(2段) | Shift/Xでダッシュ");
    updateHud();
    startLoop();
  }

  function enterStandby() {
    stopLoop();
    state.obstacles = [];
    state.pickups = [];
    state.player.x = 140;
    state.player.y = state.groundY - state.player.h;
    state.player.vy = 0;
    state.player.jumpsLeft = 2;
    state.player.dashTimer = 0;
    state.speed = BASE_SPEED;
    setOverlay("GAME START");
    setMessage("自動横スクロール。左右移動で障害物を避けて距離を伸ばせ。");
    updateHud();
    render();
  }

  function handleStart() {
    if (state.roomLocked) return;
    resetGame();
    options.onRoomNewGame?.();
  }

  startBtn?.addEventListener("click", handleStart);
  remakeBtn?.addEventListener("click", handleStart);

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    stopLoop();
    if (state.gameMode === "room") {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => {
      if (fromRemote) {
        // Host broadcasts remote starts for room games.
        setMessage("ホストがゲームを開始しました");
      }
      resetGame();
    },
    enterStandby,
    stop: () => {
      stopLoop();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    },
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      enterStandby();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      enterStandby();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message || "";
      if (state.roomLocked) {
        stopLoop();
        setOverlay(state.roomLockMessage || "対戦相手を待っています...");
      } else if (!state.running) {
        setOverlay("GAME START");
      }
    },
    applyRemoteMove: () => {},
    getSnapshot: () => ({
      speed: state.speed,
      distance: state.distance,
      coins: state.coins,
      lives: state.lives,
      obstacles: state.obstacles,
      pickups: state.pickups,
      player: state.player,
      running: state.running,
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot) return;
      state.speed = Number(snapshot.speed) || BASE_SPEED;
      state.distance = Number(snapshot.distance) || 0;
      state.coins = Number(snapshot.coins) || 0;
      state.lives = Number(snapshot.lives) || START_LIVES;
      state.obstacles = Array.isArray(snapshot.obstacles) ? snapshot.obstacles : [];
      state.pickups = Array.isArray(snapshot.pickups) ? snapshot.pickups : [];
      if (snapshot.player && typeof snapshot.player === "object") {
        state.player = { ...state.player, ...snapshot.player };
      }
      updateHud();
      render();
    },
  };
}
