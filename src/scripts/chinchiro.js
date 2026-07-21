import { readStoredAuth, scopedStorageKey } from "./userScopedStorage.js";

const CASINO_SHARED_BANK_STORAGE_KEY = "neon-casino-shared-bank-v1";
const CHINCHIRO_STATS_STORAGE_KEY = "neon-casino-chinchiro-stats-v1";
const DEFAULT_BANKROLL = 1000;
const MIN_BET = 10;
const BET_STEP = 10;
const MAX_CHINCHIRO_ATTEMPTS = 3;
const DIE_PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const DIE_FACE_LAYOUT = [
  ["front", 1],
  ["back", 6],
  ["right", 3],
  ["left", 4],
  ["top", 5],
  ["bottom", 2],
];

function clampBet(value, bankroll) {
  const max = Math.max(MIN_BET, Math.floor(bankroll / BET_STEP) * BET_STEP || MIN_BET);
  return Math.max(MIN_BET, Math.min(max, Math.floor(value / BET_STEP) * BET_STEP));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function roll3Dice() {
  return [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
}

function evaluateDice(rawDice) {
  const dice = [...rawDice].sort((a, b) => a - b);
  const [a, b, c] = dice;

  if (a === 1 && b === 1 && c === 1) {
    return { key: "pinzoro", rank: 60, eye: 1, multiplier: 5, labelJa: "ピンゾロ", labelKo: "핀조로" };
  }
  if (a === b && b === c) {
    return { key: "arashi", rank: 50 + a, eye: a, multiplier: 3, labelJa: `アラシ(${a}のゾロ目)`, labelKo: `아라시(${a} 트리플)` };
  }
  if (a === 4 && b === 5 && c === 6) {
    return { key: "shigoro", rank: 40, eye: 6, multiplier: 2, labelJa: "シゴロ", labelKo: "시고로" };
  }
  if (a === 1 && b === 2 && c === 3) {
    return { key: "hifumi", rank: 10, eye: 0, multiplier: 2, labelJa: "ヒフミ", labelKo: "히후미" };
  }

  if (a === b) {
    return { key: "point", rank: 30 + c, eye: c, multiplier: 1, labelJa: `${c}の目`, labelKo: `${c} 눈` };
  }
  if (b === c) {
    return { key: "point", rank: 30 + a, eye: a, multiplier: 1, labelJa: `${a}の目`, labelKo: `${a} 눈` };
  }
  if (a === c) {
    return { key: "point", rank: 30 + b, eye: b, multiplier: 1, labelJa: `${b}の目`, labelKo: `${b} 눈` };
  }

  return { key: "noPoint", rank: 20, eye: 0, multiplier: 1, labelJa: "ブタ", labelKo: "부타" };
}

function compareHands(player, dealer) {
  if (player.rank > dealer.rank) return 1;
  if (player.rank < dealer.rank) return -1;
  if (player.eye > dealer.eye) return 1;
  if (player.eye < dealer.eye) return -1;
  return 0;
}

function resolveRound(player, dealer) {
  if (player.key === "hifumi" && dealer.key !== "hifumi") {
    return { winner: "dealer", multiplier: Math.max(2, player.multiplier || 2) };
  }
  if (dealer.key === "hifumi" && player.key !== "hifumi") {
    return { winner: "player", multiplier: Math.max(2, dealer.multiplier || 2) };
  }

  const compared = compareHands(player, dealer);
  if (compared > 0) return { winner: "player", multiplier: Math.max(1, player.multiplier || 1) };
  if (compared < 0) return { winner: "dealer", multiplier: Math.max(1, dealer.multiplier || 1) };
  return { winner: "draw", multiplier: 0 };
}

export function initChinchiro(options = {}) {
  const langSelectEl = document.getElementById("langSelect");
  const dealerDiceEl = document.getElementById("chinchiroDealerDice");
  const playerDiceEl = document.getElementById("chinchiroPlayerDice");
  const bankEl = document.getElementById("chinchiroBankText");
  const betEl = document.getElementById("chinchiroBetText");
  const betRangeEl = document.getElementById("chinchiroBetRangeText");
  const statsEl = document.getElementById("chinchiroStatsText");
  const overlayEl = document.getElementById("chinchiroOverlay");
  const messageEl = document.getElementById("chinchiroMessage");
  const resultEl = document.getElementById("chinchiroResultText");

  const startBtn = document.getElementById("chinchiroStartBtn");
  const remakeBtn = document.getElementById("chinchiroRemakeBtn");
  const rollBtn = document.getElementById("chinchiroRollBtn");
  const betMinusBtn = document.getElementById("chinchiroBetMinusBtn");
  const betPlusBtn = document.getElementById("chinchiroBetPlusBtn");
  const allInBtn = document.getElementById("chinchiroAllInBtn");
  const menuBtn = document.getElementById("chinchiroMenuBtn");

  const state = {
    gameMode: "local",
    roomRole: null,
    roomLocked: false,
    roomLockMessage: "",
    phase: "standby",
    bankroll: loadBankroll(),
    bet: MIN_BET,
    activeBet: 0,
    playerDice: [],
    dealerDice: [],
    playerHand: null,
    dealerHand: null,
    isRolling: false,
    isSettling: false,
    rollActiveIndex: -1,
    rollPose: {
      player: [null, null, null],
      dealer: [null, null, null],
    },
    wallHitAt: {
      player: 0,
      dealer: 0,
    },
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
        bettingStart: "ベットを調整して ROLL で勝負します",
        waitingRoom: "対戦相手を待っています...",
        roomUnsupported: "このゲームはルーム対戦に未対応です",
        noChip: "チップが不足しています",
        allInReady: "オールインを設定しました",
        menuConfirm: "ゲーム一覧に戻りますか？",
        rollFirst: "ROLLでサイコロを振ってください",
        draw: "引き分け",
        win: "あなたの勝ち",
        lose: "ディーラーの勝ち",
        versus: "対",
        rolling: "サイコロを振っています...",
        pigReroll: "ブタのため振り直し ({attempt}/{max})",
      },
      ko: {
        waitingStart: "GAME START를 눌러주세요",
        bettingStart: "베팅을 조정하고 ROLL로 승부합니다",
        waitingRoom: "상대를 기다리는 중...",
        roomUnsupported: "이 게임은 룸 대전을 지원하지 않습니다",
        noChip: "칩이 부족합니다",
        allInReady: "올인 금액으로 설정했습니다",
        menuConfirm: "게임 목록으로 돌아갈까요?",
        rollFirst: "ROLL 버튼으로 주사위를 굴리세요",
        draw: "무승부",
        win: "당신 승리",
        lose: "딜러 승리",
        versus: "vs",
        rolling: "주사위를 굴리는 중...",
        pigReroll: "부타가 나와 다시 굴립니다 ({attempt}/{max})",
      },
    };
    return dict[lang()][key] || dict.ja[key] || key;
  }

  function handLabel(hand) {
    if (!hand) return "-";
    return lang() === "ko" ? hand.labelKo || hand.labelJa || "-" : hand.labelJa || hand.labelKo || "-";
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
      // Use local fallback below.
    }

    const raw = Number(localStorage.getItem(scopedKey(CASINO_SHARED_BANK_STORAGE_KEY)));
    if (!Number.isFinite(raw) || raw < 0) return DEFAULT_BANKROLL;
    return Math.floor(raw);
  }

  function saveBankroll() {
    const normalized = Math.max(0, Math.floor(state.bankroll));
    try {
      if (typeof options.onCasinoBankSave === "function") {
        options.onCasinoBankSave(normalized);
      }
    } catch {
      // Keep local fallback available.
    }
    localStorage.setItem(scopedKey(CASINO_SHARED_BANK_STORAGE_KEY), String(normalized));
  }

  function loadStats() {
    try {
      const parsed = JSON.parse(localStorage.getItem(scopedKey(CHINCHIRO_STATS_STORAGE_KEY)) || "null");
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
    localStorage.setItem(scopedKey(CHINCHIRO_STATS_STORAGE_KEY), JSON.stringify(state.stats));
  }

  function createDieElement(value, { rolling = false } = {}) {
    const dieEl = document.createElement("div");
    dieEl.className = `blackjack-card chinchiro-die${rolling ? " rolling" : ""}`;

    const cubeEl = document.createElement("div");
    cubeEl.className = "chinchiro-cube";

    DIE_FACE_LAYOUT.forEach(([side, faceValue]) => {
      const faceEl = document.createElement("div");
      faceEl.className = `chinchiro-face ${side}`;

      const activePips = value >= 1 && value <= 6 ? new Set(DIE_PIPS[faceValue]) : null;
      for (let i = 0; i < 9; i += 1) {
        const cellEl = document.createElement("span");
        cellEl.className = "chinchiro-pip-cell";
        if (activePips?.has(i)) {
          const pipEl = document.createElement("span");
          pipEl.className = "chinchiro-pip";
          cellEl.append(pipEl);
        }
        faceEl.append(cellEl);
      }

      if (!activePips) {
        faceEl.classList.add("hidden");
        if (side === "front") {
          const unknownEl = document.createElement("span");
          unknownEl.className = "chinchiro-die-unknown";
          unknownEl.textContent = "?";
          faceEl.append(unknownEl);
        }
      }

      cubeEl.append(faceEl);
    });

    dieEl.append(cubeEl);
    return dieEl;
  }

  function settlePosition(index) {
    if (index === 0) return { x: -38, y: -18, rot: -14 };
    if (index === 1) return { x: 36, y: -14, rot: 9 };
    return { x: -2, y: 34, rot: -4 };
  }

  function settleOrientation(value, index) {
    const zBase = index === 0 ? -18 : index === 1 ? 12 : -6;
    if (value === 2) return { x: 90, y: 0, z: zBase };
    if (value === 3) return { x: 0, y: -90, z: zBase };
    if (value === 4) return { x: 0, y: 90, z: zBase };
    if (value === 5) return { x: -90, y: 0, z: zBase };
    if (value === 6) return { x: 0, y: 180, z: zBase };
    return { x: 0, y: 0, z: zBase };
  }

  function rollingOrientation(motion, index) {
    const spinSeed = index * 42;
    return {
      x: (motion.y * 6.4 + spinSeed) % 360,
      y: (motion.x * 7.1 + motion.rot * 1.5 + spinSeed) % 360,
      z: motion.rot % 360,
    };
  }

  function initializeMotion(index) {
    const angle = ((index * 120 + randomInt(-15, 15)) * Math.PI) / 180;
    const radius = 10 + index * 4;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.65,
      vx: randomFloat(-5.4, 5.4),
      vy: randomFloat(-4.2, 4.2),
      rot: randomFloat(-160, 160),
      vrot: randomFloat(16, 34) * (Math.random() > 0.5 ? 1 : -1),
    };
  }

  function resolveDiceCollisions(bucket, { restitution = 0.72 } = {}) {
    const RADIUS = 11;
    const minDistance = RADIUS * 2;

    for (let i = 0; i < bucket.length - 1; i += 1) {
      const a = bucket[i];
      if (!a) continue;
      for (let j = i + 1; j < bucket.length; j += 1) {
        const b = bucket[j];
        if (!b) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        if (dist >= minDistance) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDistance - dist;

        // Positional correction to avoid persistent overlap.
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const relNormalVel = rvx * nx + rvy * ny;
        if (relNormalVel > 0) continue;

        const impulse = (-(1 + restitution) * relNormalVel) / 2;
        const ix = impulse * nx;
        const iy = impulse * ny;

        a.vx -= ix;
        a.vy -= iy;
        b.vx += ix;
        b.vy += iy;
        a.vrot += randomFloat(-2.4, 2.4);
        b.vrot += randomFloat(-2.4, 2.4);
      }
    }
  }

  function stepMotion(bucketName, activeIndex = -1, dtSec = 1 / 30, energy = 1) {
    const bucket = state.rollPose[bucketName];
    if (!Array.isArray(bucket)) return { hitStrength: 0 };

    const X_LIMIT = 42;
    const Y_LIMIT = 30;
    const dt = Math.max(0.01, Math.min(0.06, dtSec));
    const clampedEnergy = Math.max(0.08, Math.min(1, energy));
    const frame = dt * 60;
    const centerSpringX = 0.085;
    const centerSpringY = 0.11;
    const friction = Math.pow(0.97 - (1 - clampedEnergy) * 0.035, frame);
    const angularFriction = Math.pow(0.962 - (1 - clampedEnergy) * 0.04, frame);
    let maxHitStrength = 0;

    bucket.forEach((motion, index) => {
      if (!motion) {
        bucket[index] = initializeMotion(index);
        return;
      }

      const activeFactor = (index === activeIndex ? 1 : 0.32) * clampedEnergy;
      const jitterX = randomFloat(-0.09, 0.09) * activeFactor;
      const jitterY = randomFloat(-0.07, 0.07) * activeFactor;
      const ax = -motion.x * centerSpringX + jitterX;
      const ay = -motion.y * centerSpringY + jitterY;

      motion.vx += ax * frame;
      motion.vy += ay * frame;
      motion.vx *= friction;
      motion.vy *= friction;

      if (index === activeIndex) {
        motion.vrot += randomFloat(-1.5, 1.5);
      }
      motion.vrot *= angularFriction;

      motion.x += motion.vx * frame;
      motion.y += motion.vy * frame;
      motion.rot += motion.vrot * frame;

      const nx = motion.x / X_LIMIT;
      const ny = motion.y / Y_LIMIT;
      const ellipse = nx * nx + ny * ny;

      if (ellipse > 1) {
        const scale = 1 / Math.sqrt(ellipse);
        motion.x *= scale;
        motion.y *= scale;

        const normalX = motion.x / (X_LIMIT * X_LIMIT);
        const normalY = motion.y / (Y_LIMIT * Y_LIMIT);
        const normalLength = Math.hypot(normalX, normalY) || 1;
        const ux = normalX / normalLength;
        const uy = normalY / normalLength;
        const dot = motion.vx * ux + motion.vy * uy;
        maxHitStrength = Math.max(maxHitStrength, Math.abs(dot));

        // Reflect against bowl rim with energy loss and tangent slip.
        const reflect = 0.72 + clampedEnergy * 0.14;
        motion.vx = (motion.vx - 2 * dot * ux) * reflect + randomFloat(-0.16, 0.16);
        motion.vy = (motion.vy - 2 * dot * uy) * reflect + randomFloat(-0.14, 0.14);
        motion.vrot += randomFloat(-4.4, 4.4);
      }

      if (index === activeIndex && clampedEnergy > 0.35 && Math.hypot(motion.vx, motion.vy) < 0.6) {
        motion.vx += randomFloat(-0.44, 0.44);
        motion.vy += randomFloat(-0.34, 0.34);
      }
    });

    resolveDiceCollisions(bucket, { restitution: 0.72 });
    return { hitStrength: maxHitStrength };
  }

  function triggerBowlWallHit(bucketName, strength = 0) {
    const normalized = Number.isFinite(strength) ? strength : 0;
    if (normalized < 0.7) return;

    const now = Date.now();
    const lastAt = state.wallHitAt[bucketName] || 0;
    if (now - lastAt < 70) return;
    state.wallHitAt[bucketName] = now;

    const bowlEl = bucketName === "player" ? playerDiceEl : dealerDiceEl;
    if (!bowlEl) return;
    bowlEl.classList.remove("is-wall-hit");
    // Force restart so consecutive collisions still pulse.
    void bowlEl.offsetWidth;
    bowlEl.classList.add("is-wall-hit");
    window.setTimeout(() => {
      bowlEl.classList.remove("is-wall-hit");
    }, 180);
  }

  function renderDice(target, dice, { rolling = false, rollingIndex = -1, animateMotion = false } = {}) {
    if (!target) return;
    target.innerHTML = "";
    target.classList.toggle("is-rolling", rolling);
    if (!Array.isArray(dice) || dice.length === 0) {
      [0, 0, 0].forEach((value, index) => {
        const pos = settlePosition(index);
        const dieEl = createDieElement(value, { rolling: rolling && index === rollingIndex });
        dieEl.style.setProperty("--die-x", `${pos.x}px`);
        dieEl.style.setProperty("--die-y", `${pos.y}px`);
        dieEl.style.setProperty("--die-rot", `${pos.rot}deg`);
        target.append(dieEl);
      });
      return;
    }

    dice.forEach((value, index) => {
      const motion = animateMotion
        ? state.rollPose[target === playerDiceEl ? "player" : "dealer"]?.[index]
        : null;
      const pos = motion
        ? {
            x: Math.round(motion.x),
            y: Math.round(motion.y),
            rot: Math.round(motion.rot),
          }
        : settlePosition(index);
      const orient = motion
        ? rollingOrientation(motion, index)
        : settleOrientation(value, index);
      const dieEl = createDieElement(value, { rolling: rolling && index === rollingIndex });
      dieEl.style.setProperty("--die-x", `${pos.x}px`);
      dieEl.style.setProperty("--die-y", `${pos.y}px`);
      dieEl.style.setProperty("--die-rot", `${pos.rot}deg`);
      dieEl.style.setProperty("--cube-x", `${orient.x}deg`);
      dieEl.style.setProperty("--cube-y", `${orient.y}deg`);
      dieEl.style.setProperty("--cube-z", `${orient.z}deg`);
      target.append(dieEl);
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

  function updateHud() {
    const maxBet = Math.max(MIN_BET, Math.floor(state.bankroll / BET_STEP) * BET_STEP || MIN_BET);
    const canControl = state.gameMode !== "room";
    const inBetting = state.phase === "standby" || state.phase === "betting";

    if (bankEl) bankEl.textContent = String(state.bankroll);
    if (betEl) betEl.textContent = String(state.bet);
    if (betRangeEl) betRangeEl.textContent = `${MIN_BET} - ${maxBet}`;
    if (statsEl) statsEl.textContent = `W${state.stats.wins} / G${state.stats.games} / ${state.stats.net >= 0 ? "+" : ""}${state.stats.net}`;

    const animateMotion = state.isRolling || state.isSettling;
    renderDice(dealerDiceEl, state.dealerDice, {
      rolling: state.isRolling,
      rollingIndex: state.rollActiveIndex,
      animateMotion,
    });
    renderDice(playerDiceEl, state.playerDice, {
      rolling: state.isRolling,
      rollingIndex: state.rollActiveIndex,
      animateMotion,
    });

    dealerDiceEl?.classList.toggle("is-settling", state.isSettling);
    playerDiceEl?.classList.toggle("is-settling", state.isSettling);

    const disableBet = !inBetting || !canControl || state.roomLocked || state.isRolling || state.isSettling;
    startBtn.disabled = !canControl || state.roomLocked;
    rollBtn.disabled = disableBet;
    betMinusBtn.disabled = disableBet;
    betPlusBtn.disabled = disableBet;
    if (allInBtn) allInBtn.disabled = disableBet;

    if (startBtn) {
      startBtn.textContent = state.phase === "standby" ? "GAME START" : "NEW ROUND";
    }
  }

  function startBetting() {
    state.phase = "betting";
    state.activeBet = 0;
    state.playerDice = [];
    state.dealerDice = [];
    state.isSettling = false;
    state.rollActiveIndex = -1;
    state.rollPose.player = [null, null, null];
    state.rollPose.dealer = [null, null, null];
    state.playerHand = null;
    state.dealerHand = null;
    if (resultEl) resultEl.textContent = "-";
    messageEl.textContent = t("rollFirst");
    setOverlay("");
    updateHud();
  }

  function enterStandby() {
    state.phase = "standby";
    state.activeBet = 0;
    state.playerDice = [];
    state.dealerDice = [];
    state.isSettling = false;
    state.rollActiveIndex = -1;
    state.rollPose.player = [null, null, null];
    state.rollPose.dealer = [null, null, null];
    state.playerHand = null;
    state.dealerHand = null;
    state.roomLocked = false;
    state.roomLockMessage = "";
    if (resultEl) resultEl.textContent = "-";
    messageEl.textContent = t("waitingStart");
    setOverlay("GAME STARTで開始");
    updateHud();
  }

  function adjustBet(delta) {
    const maxBet = Math.max(MIN_BET, Math.floor(state.bankroll / BET_STEP) * BET_STEP || MIN_BET);
    const next = Math.max(MIN_BET, Math.min(maxBet, state.bet + delta));
    state.bet = clampBet(next, state.bankroll);
    updateHud();
  }

  async function playRollAnimation({ rerollPlayer = true, rerollDealer = true } = {}) {
    state.isRolling = true;
    state.isSettling = false;
    state.rollActiveIndex = 0;
    state.rollPose.player = [initializeMotion(0), initializeMotion(1), initializeMotion(2)];
    state.rollPose.dealer = [initializeMotion(0), initializeMotion(1), initializeMotion(2)];
    messageEl.textContent = t("rolling");
    const STEP_MS = 33;
    const PER_DIE_MS = 440;
    const finalPlayer = rerollPlayer ? roll3Dice() : [...state.playerDice];
    const finalDealer = rerollDealer ? roll3Dice() : [...state.dealerDice];
    state.playerDice = rerollPlayer ? [0, 0, 0] : [...state.playerDice];
    state.dealerDice = rerollDealer ? [0, 0, 0] : [...state.dealerDice];
    updateHud();

    for (let index = 0; index < 3; index += 1) {
      state.rollActiveIndex = index;
      const startAt = Date.now();
      let frameCount = 0;

      await new Promise((resolve) => {
        const timerId = window.setInterval(() => {
          const progress = Math.min(1, (Date.now() - startAt) / PER_DIE_MS);
          const energy = 1 - progress * 0.88;
          if (rerollPlayer) {
            const playerHit = stepMotion("player", index, STEP_MS / 1000, energy);
            triggerBowlWallHit("player", playerHit?.hitStrength || 0);
          }
          if (rerollDealer) {
            const dealerHit = stepMotion("dealer", index, STEP_MS / 1000, energy);
            triggerBowlWallHit("dealer", dealerHit?.hitStrength || 0);
          }

          frameCount += 1;
          const updateEvery = 1 + Math.floor(progress * 4);
          if (frameCount % updateEvery === 0) {
            if (rerollPlayer) state.playerDice[index] = Math.floor(Math.random() * 6) + 1;
            if (rerollDealer) state.dealerDice[index] = Math.floor(Math.random() * 6) + 1;
          }
          updateHud();

          if (Date.now() - startAt >= PER_DIE_MS) {
            window.clearInterval(timerId);
            if (rerollPlayer) state.playerDice[index] = finalPlayer[index];
            if (rerollDealer) state.dealerDice[index] = finalDealer[index];
            updateHud();
            resolve();
          }
        }, STEP_MS);
      });
    }

    state.rollActiveIndex = -1;
    state.isRolling = false;
    state.isSettling = true;

    const SETTLE_MS = 280;
    const settleStartAt = Date.now();
    await new Promise((resolve) => {
      const settleId = window.setInterval(() => {
        if (rerollPlayer) {
          const playerHit = stepMotion("player", -1, STEP_MS / 1000, 0.22);
          triggerBowlWallHit("player", playerHit?.hitStrength || 0);
        }
        if (rerollDealer) {
          const dealerHit = stepMotion("dealer", -1, STEP_MS / 1000, 0.22);
          triggerBowlWallHit("dealer", dealerHit?.hitStrength || 0);
        }
        updateHud();

        if (Date.now() - settleStartAt >= SETTLE_MS) {
          window.clearInterval(settleId);
          resolve();
        }
      }, STEP_MS);
    });

    state.isSettling = false;
    state.rollPose.player = [null, null, null];
    state.rollPose.dealer = [null, null, null];
    state.playerDice = finalPlayer;
    state.dealerDice = finalDealer;

    return { playerDice: finalPlayer, dealerDice: finalDealer };
  }

  async function rollRound() {
    if (state.phase !== "betting") return;
    if (state.isRolling) return;
    if (state.bankroll < state.bet) {
      messageEl.textContent = t("noChip");
      return;
    }

    state.activeBet = state.bet;
    state.bankroll -= state.activeBet;

    let playerHand = null;
    let dealerHand = null;

    for (let attempt = 1; attempt <= MAX_CHINCHIRO_ATTEMPTS; attempt += 1) {
      const rerollPlayer = attempt === 1 || playerHand?.key === "noPoint";
      const rerollDealer = attempt === 1 || dealerHand?.key === "noPoint";

      if (!rerollPlayer && !rerollDealer) break;

      await playRollAnimation({ rerollPlayer, rerollDealer });

      playerHand = evaluateDice(state.playerDice);
      dealerHand = evaluateDice(state.dealerDice);

      const playerNeedsReroll = playerHand.key === "noPoint" && attempt < MAX_CHINCHIRO_ATTEMPTS;
      const dealerNeedsReroll = dealerHand.key === "noPoint" && attempt < MAX_CHINCHIRO_ATTEMPTS;
      if (!playerNeedsReroll && !dealerNeedsReroll) break;

      messageEl.textContent = t("pigReroll", { attempt: attempt + 1, max: MAX_CHINCHIRO_ATTEMPTS });
    }

    state.playerHand = playerHand || evaluateDice(state.playerDice);
    state.dealerHand = dealerHand || evaluateDice(state.dealerDice);

    const round = resolveRound(state.playerHand, state.dealerHand);
    state.stats.games += 1;

    if (round.winner === "player") {
      const payout = state.activeBet * (1 + round.multiplier);
      state.bankroll += payout;
      state.stats.wins += 1;
      state.stats.net += state.activeBet * round.multiplier;
      resultEl.textContent = `${t("win")} (${handLabel(state.playerHand)} ${t("versus")} ${handLabel(state.dealerHand)})`;
      messageEl.textContent = t("win");
    } else if (round.winner === "dealer") {
      state.stats.net -= state.activeBet * round.multiplier;
      resultEl.textContent = `${t("lose")} (${handLabel(state.playerHand)} ${t("versus")} ${handLabel(state.dealerHand)})`;
      messageEl.textContent = t("lose");
    } else {
      state.bankroll += state.activeBet;
      resultEl.textContent = `${t("draw")} (${handLabel(state.playerHand)})`;
      messageEl.textContent = t("draw");
    }

    state.phase = "result";
    state.bet = clampBet(state.bet, state.bankroll);
    saveBankroll();
    saveStats();
    setOverlay("");
    updateHud();
  }

  function setAllInBet() {
    const max = Math.max(MIN_BET, Math.floor(state.bankroll / BET_STEP) * BET_STEP || MIN_BET);
    state.bet = max;
    messageEl.textContent = t("allInReady");
    updateHud();
  }

  startBtn?.addEventListener("click", () => {
    if (state.gameMode === "room") return;
    startBetting();
  });

  rollBtn?.addEventListener("click", () => {
    if (state.gameMode === "room") return;
    void rollRound();
  });

  remakeBtn?.addEventListener("click", () => {
    if (state.gameMode === "room") return;
    startBetting();
  });

  betMinusBtn?.addEventListener("click", () => {
    if (state.gameMode === "room") return;
    adjustBet(-BET_STEP);
  });

  betPlusBtn?.addEventListener("click", () => {
    if (state.gameMode === "room") return;
    adjustBet(BET_STEP);
  });

  allInBtn?.addEventListener("click", () => {
    if (state.gameMode === "room") return;
    setAllInBet();
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
    startNewGame: () => {
      if (state.gameMode === "room") return;
      startBetting();
    },
    enterStandby,
    stop: () => {},
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.roomRole = roomRole === "host" ? "host" : roomRole === "guest" ? "guest" : "spectator";
      state.roomLocked = true;
      state.roomLockMessage = t("roomUnsupported");
      options.onRoomStatusChange?.({ roomCode, roomRole });
      messageEl.textContent = t("roomUnsupported");
      setOverlay(t("roomUnsupported"));
      updateHud();
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
      }
      updateHud();
    },
    applyRemoteMove: () => {},
    getSnapshot: () => ({
      gameMode: state.gameMode,
      roomRole: state.roomRole,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      phase: state.phase,
      bankroll: state.bankroll,
      bet: state.bet,
      activeBet: state.activeBet,
      playerDice: [...state.playerDice],
      dealerDice: [...state.dealerDice],
      playerHand: state.playerHand ? { ...state.playerHand } : null,
      dealerHand: state.dealerHand ? { ...state.dealerHand } : null,
      stats: { ...state.stats },
      message: messageEl?.textContent || "",
      resultText: resultEl?.textContent || "-",
      overlay: overlayEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot) return;
      state.gameMode = snapshot.gameMode === "room" ? "room" : "local";
      state.roomRole = snapshot.roomRole || null;
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = snapshot.roomLockMessage || "";
      state.phase = ["standby", "betting", "result"].includes(snapshot.phase) ? snapshot.phase : "standby";
      state.isRolling = false;
      state.isSettling = false;
      state.rollActiveIndex = -1;
      state.rollPose.player = [null, null, null];
      state.rollPose.dealer = [null, null, null];
      state.bankroll = Number.isFinite(Number(snapshot.bankroll)) ? Math.max(0, Math.floor(Number(snapshot.bankroll))) : loadBankroll();
      state.bet = Number.isFinite(Number(snapshot.bet)) ? clampBet(Number(snapshot.bet), state.bankroll) : MIN_BET;
      state.activeBet = Number.isFinite(Number(snapshot.activeBet)) ? Math.max(0, Math.floor(Number(snapshot.activeBet))) : 0;
      state.playerDice = Array.isArray(snapshot.playerDice) ? [...snapshot.playerDice].slice(0, 3) : [];
      state.dealerDice = Array.isArray(snapshot.dealerDice) ? [...snapshot.dealerDice].slice(0, 3) : [];
      state.playerHand = snapshot.playerHand && typeof snapshot.playerHand === "object" ? { ...snapshot.playerHand } : null;
      state.dealerHand = snapshot.dealerHand && typeof snapshot.dealerHand === "object" ? { ...snapshot.dealerHand } : null;
      state.stats = {
        wins: Number.isFinite(Number(snapshot?.stats?.wins)) ? Math.max(0, Math.floor(Number(snapshot.stats.wins))) : 0,
        games: Number.isFinite(Number(snapshot?.stats?.games)) ? Math.max(0, Math.floor(Number(snapshot.stats.games))) : 0,
        net: Number.isFinite(Number(snapshot?.stats?.net)) ? Math.floor(Number(snapshot.stats.net)) : 0,
      };
      if (messageEl) messageEl.textContent = snapshot.message || "";
      if (resultEl) resultEl.textContent = snapshot.resultText || "-";
      if (overlayEl) {
        overlayEl.textContent = snapshot.overlay || "";
        overlayEl.style.opacity = snapshot.overlay ? "1" : "0";
      }
      updateHud();
    },
    onSaveDataScopeChanged: () => {
      state.bankroll = loadBankroll();
      state.stats = loadStats();
      state.bet = clampBet(state.bet, state.bankroll);
      updateHud();
    },
  };
}
