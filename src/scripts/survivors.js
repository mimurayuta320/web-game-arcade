import { cloudApiCandidates } from "./cloudApiClient.js";

const VIEW_W = 960;
const VIEW_H = 540;
const WORLD_W = 2880;
const WORLD_H = 1620;
const SURVIVORS_BANK_KEY = "neon-survivors-bank-v1";
const SURVIVORS_GACHA_PITY_KEY = "neon-survivors-gacha-pity-v1";
const SURVIVORS_SKIN_UNLOCKS_KEY = "neon-survivors-skin-unlocks-v1";
const SURVIVORS_SKIN_SELECTED_KEY = "neon-survivors-skin-selected-v1";
const SURVIVORS_CHARACTER_KEY = "neon-survivors-character-v1";
const PLAYER_NAME_KEY = "neon-player-name";
const CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const CLOUD_PASSWORD_KEY = "neon-cloud-password";
const BANK_GACHA_COST = 30;
const BANK_GACHA_10_COST = 270;

const PLAYER_FRAMES = [
  new URL("../motionPng/hammer1.png", import.meta.url).href,
  new URL("../motionPng/hammer2.png", import.meta.url).href,
  new URL("../motionPng/hammer3.png", import.meta.url).href,
];

const FAIRY_IDLE_FRAME = new URL("../motionPng/白菜前面.png", import.meta.url).href;
const FAIRY_ATTACK_FRAME = new URL("../motionPng/白菜攻撃用.png", import.meta.url).href;
const FAIRY_BACK_FRAME = new URL("../motionPng/白菜背面.png", import.meta.url).href;
const ATTACK_BULLET_FRAME = FAIRY_ATTACK_FRAME;

const SKIN_RARITY = {
  common: { label: "COMMON", weight: 58 },
  rare: { label: "RARE", weight: 28 },
  epic: { label: "EPIC", weight: 10 },
  legendary: { label: "LEGENDARY", weight: 4 },
};

const SKINS = [
  {
    id: "hammer_default",
    title: "Default Hammer",
    rarity: "common",
    filter: "none",
  },
  {
    id: "hammer_cobalt",
    title: "Cobalt Pulse",
    rarity: "rare",
    filter: "hue-rotate(165deg) saturate(1.2) brightness(1.06)",
  },
  {
    id: "hammer_violet",
    title: "Violet Arc",
    rarity: "epic",
    filter: "hue-rotate(245deg) saturate(1.45) brightness(1.08)",
  },
  {
    id: "hammer_crimson",
    title: "Crimson Nova",
    rarity: "legendary",
    filter: "hue-rotate(315deg) saturate(1.55) brightness(1.12)",
  },
];

const DEFAULT_SKIN_ID = "hammer_default";
const CHARACTER_PRESETS = {
  default: {
    id: "default",
    label: "BALANCED",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 10,
      rangedMul: 1,
      meleeDamage: 14,
      meleeRadius: 72,
      meleeRate: 1.1,
      explosionRadius: 0,
      explosionDamage: 0,
    },
    passive: {
      label: "Adaptive Shield",
      desc: "一定時間ごとに次の被ダメージを軽減",
      shieldInterval: 11,
      shieldReduce: 0.5,
    },
  },
  ranger: {
    id: "ranger",
    label: "RANGER",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 11,
      rangedMul: 1.28,
      meleeDamage: 8,
      meleeRadius: 64,
      meleeRate: 1.2,
      explosionRadius: 8,
      explosionDamage: 3,
    },
    passive: {
      label: "Deadeye",
      desc: "遠距離攻撃が確率でクリティカル",
      critChance: 0.2,
      critMul: 1.7,
    },
  },
  brawler: {
    id: "brawler",
    label: "BRAWLER",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 9,
      rangedMul: 0.9,
      meleeDamage: 24,
      meleeRadius: 94,
      meleeRate: 0.72,
      explosionRadius: 0,
      explosionDamage: 0,
    },
    passive: {
      label: "Iron Guard",
      desc: "被ダメ軽減 + 近接キルで回復",
      damageTakenMul: 0.88,
      meleeKillHeal: 2.4,
    },
  },
  demolition: {
    id: "demolition",
    label: "DEMOLITION",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 10,
      rangedMul: 0.96,
      meleeDamage: 11,
      meleeRadius: 70,
      meleeRate: 1,
      explosionRadius: 34,
      explosionDamage: 16,
    },
    passive: {
      label: "Aftershock",
      desc: "爆発が確率で追撃爆発",
      aftershockChance: 0.3,
      aftershockDamageMul: 0.55,
      aftershockRadiusMul: 0.75,
    },
  },
  medic: {
    id: "medic",
    label: "MEDIC",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 9,
      rangedMul: 0.95,
      meleeDamage: 10,
      meleeRadius: 68,
      meleeRate: 1.05,
      explosionRadius: 0,
      explosionDamage: 0,
    },
    passive: {
      label: "Field Recovery",
      desc: "敵撃破ごとに回復し、被ダメージを軽減",
      damageTakenMul: 0.92,
      meleeKillHeal: 1.2,
    },
  },
  assassin: {
    id: "assassin",
    label: "ASSASSIN",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 12,
      rangedMul: 1.08,
      meleeDamage: 18,
      meleeRadius: 76,
      meleeRate: 0.88,
      explosionRadius: 0,
      explosionDamage: 0,
    },
    passive: {
      label: "Lethal Focus",
      desc: "高確率クリティカル、ただし防御は低め",
      critChance: 0.28,
      critMul: 1.9,
      damageTakenMul: 1.08,
    },
  },
  engineer: {
    id: "engineer",
    label: "ENGINEER",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 10,
      rangedMul: 1,
      meleeDamage: 12,
      meleeRadius: 72,
      meleeRate: 1.02,
      explosionRadius: 20,
      explosionDamage: 9,
    },
    passive: {
      label: "Pulse Barrier",
      desc: "周期シールド + 小規模追撃爆発",
      shieldInterval: 9,
      shieldReduce: 0.4,
      aftershockChance: 0.18,
      aftershockDamageMul: 0.45,
      aftershockRadiusMul: 0.7,
    },
  },
  fairy: {
    id: "fairy",
    label: "FAIRY",
    weaponSlotMax: 6,
    starterWeapons: ["auto_blaster"],
    baseStats: {
      damage: 11,
      rangedMul: 1.1,
      meleeDamage: 9,
      meleeRadius: 66,
      meleeRate: 1.18,
      explosionRadius: 0,
      explosionDamage: 0,
    },
    passive: {
      label: "Arc Wings",
      desc: "高機動 + クリティカル率上昇",
      critChance: 0.18,
      critMul: 1.6,
    },
    sprite: {
      idleFrames: [FAIRY_IDLE_FRAME],
      attackFrames: [FAIRY_ATTACK_FRAME],
      upFrames: [FAIRY_BACK_FRAME],
      downFrames: [FAIRY_IDLE_FRAME],
      useSkinFilter: false,
    },
  },
};

const ENEMY_FRAMES = {
  1: new URL("../motionPng/enemy.png", import.meta.url).href,
  2: new URL("../motionPng/enemy2.png", import.meta.url).href,
};

const AUGMENT_RARITY = {
  common: { label: "COMMON", weight: 62 },
  rare: { label: "RARE", weight: 28 },
  epic: { label: "EPIC", weight: 10 },
  legendary: { label: "LEGENDARY", weight: 4 },
};

const AUGMENTS = [
  {
    id: "power_core",
    title: "Power Core",
    rarity: "common",
    desc: "弾ダメージ +4",
    apply: (state) => {
      state.player.damage += 4;
    },
  },
  {
    id: "ballistic_lens",
    title: "Ballistic Lens",
    rarity: "common",
    desc: "遠距離ダメージ +12%",
    apply: (state) => {
      state.player.rangedMul = Math.min(3, state.player.rangedMul * 1.12);
    },
  },
  {
    id: "rapid_loader",
    title: "Rapid Loader",
    rarity: "common",
    desc: "攻撃間隔 -15%",
    apply: (state) => {
      state.player.fireRate = Math.max(0.14, state.player.fireRate * 0.85);
    },
  },
  {
    id: "swift_boots",
    title: "Swift Boots",
    rarity: "common",
    desc: "移動速度 +28",
    apply: (state) => {
      state.player.speed += 28;
    },
  },
  {
    id: "magnet_field",
    title: "Magnet Field",
    rarity: "common",
    desc: "XP吸引範囲 +70",
    apply: (state) => {
      state.player.orbMagnetRange += 70;
      state.player.orbPullBase += 26;
    },
  },
  {
    id: "vital_core",
    title: "Vital Core",
    rarity: "common",
    desc: "最大HP +24、即時HP +24",
    apply: (state) => {
      state.player.maxHp += 24;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 24);
    },
  },
  {
    id: "shock_round",
    title: "Shock Round",
    rarity: "rare",
    desc: "弾速 +90、弾ダメージ +2",
    apply: (state) => {
      state.player.projSpeed += 90;
      state.player.damage += 2;
    },
  },
  {
    id: "guard_shell",
    title: "Guard Shell",
    rarity: "rare",
    desc: "被ダメージ -15%",
    apply: (state) => {
      state.player.damageTakenMul = Math.max(0.6, state.player.damageTakenMul * 0.85);
    },
  },
  {
    id: "phase_round",
    title: "Phase Round",
    rarity: "rare",
    desc: "弾が敵を1体貫通、弾ダメージ +1",
    apply: (state) => {
      state.player.pierce += 1;
      state.player.damage += 1;
    },
  },
  {
    id: "close_combat_core",
    title: "Close Combat Core",
    rarity: "rare",
    desc: "近距離ダメージ +8、半径 +18",
    apply: (state) => {
      state.player.meleeDamage += 8;
      state.player.meleeRadius += 18;
    },
  },
  {
    id: "execution_matrix",
    title: "Execution Matrix",
    rarity: "epic",
    desc: "HP35%以下の敵への与ダメージ上昇",
    apply: (state) => {
      state.player.executeThreshold = Math.max(state.player.executeThreshold, 0.35);
      state.player.executeMultiplier = Math.min(3, state.player.executeMultiplier * 1.35);
    },
  },
  {
    id: "overload_burst",
    title: "Overload Burst",
    rarity: "legendary",
    desc: "敵撃破時に衝撃波 (半径+18 / ダメージ+12)",
    apply: (state) => {
      state.player.killNovaRadius += 18;
      state.player.killNovaDamage += 12;
      state.player.explosionRadius += 10;
      state.player.explosionDamage += 8;
    },
  },
  {
    id: "chain_reaction",
    title: "Chain Reaction",
    rarity: "epic",
    desc: "爆発ダメージ +10、爆発半径 +22",
    apply: (state) => {
      state.player.explosionDamage += 10;
      state.player.explosionRadius += 22;
    },
  },
  {
    id: "vampiric_reactor",
    title: "Vampiric Reactor",
    rarity: "rare",
    desc: "敵撃破でHP回復、衝撃波ダメージ+4",
    apply: (state) => {
      state.player.siphonHeal += 1.5;
      state.player.killNovaDamage += 4;
    },
  },
];

const SHOP_ITEMS = [
  {
    id: "shop_damage",
    title: "Brutal Ammo",
    desc: "弾ダメージ +3",
    baseCost: 18,
    apply: (state) => {
      state.player.damage += 3;
    },
  },
  {
    id: "shop_ranged",
    title: "Aiming Suite",
    desc: "遠距離ダメージ +10%",
    baseCost: 20,
    apply: (state) => {
      state.player.rangedMul = Math.min(3, state.player.rangedMul * 1.1);
    },
  },
  {
    id: "shop_firerate",
    title: "Quick Trigger",
    desc: "攻撃間隔 -10%",
    baseCost: 20,
    apply: (state) => {
      state.player.fireRate = Math.max(0.12, state.player.fireRate * 0.9);
    },
  },
  {
    id: "shop_speed",
    title: "Runner Sole",
    desc: "移動速度 +18",
    baseCost: 16,
    apply: (state) => {
      state.player.speed += 18;
    },
  },
  {
    id: "shop_hp",
    title: "Medical Pack",
    desc: "最大HP +12 / HP +18",
    baseCost: 19,
    apply: (state) => {
      state.player.maxHp += 12;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 18);
    },
  },
  {
    id: "shop_magnet",
    title: "Loot Radar",
    desc: "XP吸引範囲 +55",
    baseCost: 15,
    apply: (state) => {
      state.player.orbMagnetRange += 55;
      state.player.orbPullBase += 18;
    },
  },
  {
    id: "shop_armor",
    title: "Nano Coat",
    desc: "被ダメージ -10%",
    baseCost: 22,
    apply: (state) => {
      state.player.damageTakenMul = Math.max(0.55, state.player.damageTakenMul * 0.9);
    },
  },
  {
    id: "shop_proj",
    title: "Rail Chamber",
    desc: "弾速 +85",
    baseCost: 14,
    apply: (state) => {
      state.player.projSpeed += 85;
    },
  },
  {
    id: "shop_melee",
    title: "Shock Knuckle",
    desc: "近距離ダメージ +6 / 半径 +10",
    baseCost: 17,
    apply: (state) => {
      state.player.meleeDamage += 6;
      state.player.meleeRadius += 10;
    },
  },
  {
    id: "shop_explosion",
    title: "Blast Capsule",
    desc: "爆発ダメージ +6 / 半径 +12",
    baseCost: 21,
    apply: (state) => {
      state.player.explosionDamage += 6;
      state.player.explosionRadius += 12;
    },
  },
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function augmentRollWeight(augment, level) {
  const rarity = AUGMENT_RARITY[augment.rarity] ?? AUGMENT_RARITY.common;
  const levelBias = clamp((level - 1) / 12, 0, 1);
  if (augment.rarity === "legendary") {
    return Math.max(1, rarity.weight * (1 + 1.5 * levelBias));
  }
  if (augment.rarity === "epic") {
    return Math.max(1, rarity.weight * (1 + 0.9 * levelBias));
  }
  if (augment.rarity === "rare") {
    return Math.max(1, rarity.weight * (1 + 0.35 * levelBias));
  }
  return Math.max(1, rarity.weight * (1 - 0.4 * levelBias));
}

function getAugmentRarityLabel(rarity) {
  return (AUGMENT_RARITY[rarity] ?? AUGMENT_RARITY.common).label;
}

function getSkinRarityLabel(rarity) {
  return (SKIN_RARITY[rarity] ?? SKIN_RARITY.common).label;
}

function bankStorageScope(auth) {
  const userId = String(auth?.userId || "").trim();
  return userId ? `user:${userId}` : "guest";
}

function bankStorageKey(auth) {
  return `${SURVIVORS_BANK_KEY}:${bankStorageScope(auth)}`;
}

function parseStoredCoins(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

function loadBankCoins(auth = null) {
  try {
    const scopedKey = bankStorageKey(auth);
    const scopedValue = parseStoredCoins(localStorage.getItem(scopedKey));
    if (scopedValue !== null) return scopedValue;

    // Backward compatibility: migrate legacy single-profile value on first read.
    const legacyValue = parseStoredCoins(localStorage.getItem(SURVIVORS_BANK_KEY));
    if (legacyValue === null) return 0;
    localStorage.setItem(scopedKey, String(legacyValue));
    return legacyValue;
  } catch {
    return 0;
  }
}

function saveBankCoins(value, auth = null) {
  try {
    localStorage.setItem(bankStorageKey(auth), String(Math.max(0, Math.floor(value))));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function loadGachaPity() {
  try {
    const raw = localStorage.getItem(SURVIVORS_GACHA_PITY_KEY);
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return clamp(Math.floor(n), 0, 9);
  } catch {
    return 0;
  }
}

function saveGachaPity(value) {
  try {
    localStorage.setItem(SURVIVORS_GACHA_PITY_KEY, String(clamp(Math.floor(value), 0, 9)));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function loadUnlockedSkins() {
  try {
    const raw = localStorage.getItem(SURVIVORS_SKIN_UNLOCKS_KEY);
    if (!raw) return [DEFAULT_SKIN_ID];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [DEFAULT_SKIN_ID];
    const known = new Set(SKINS.map((s) => s.id));
    const filtered = parsed.filter((id) => typeof id === "string" && known.has(id));
    if (!filtered.includes(DEFAULT_SKIN_ID)) filtered.unshift(DEFAULT_SKIN_ID);
    return [...new Set(filtered)];
  } catch {
    return [DEFAULT_SKIN_ID];
  }
}

function saveUnlockedSkins(ids) {
  try {
    localStorage.setItem(SURVIVORS_SKIN_UNLOCKS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function loadSelectedSkin(unlockedIds) {
  try {
    const raw = localStorage.getItem(SURVIVORS_SKIN_SELECTED_KEY);
    const selected = String(raw || "");
    if (unlockedIds.includes(selected)) return selected;
    return DEFAULT_SKIN_ID;
  } catch {
    return DEFAULT_SKIN_ID;
  }
}

function saveSelectedSkin(skinId) {
  try {
    localStorage.setItem(SURVIVORS_SKIN_SELECTED_KEY, skinId);
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function skinById(skinId) {
  return SKINS.find((skin) => skin.id === skinId) ?? SKINS[0];
}

function centerSpawnPoint() {
  return {
    x: WORLD_W / 2,
    y: WORLD_H / 2,
  };
}

function loadProfilePlayerName() {
  const trimmed = String(localStorage.getItem(PLAYER_NAME_KEY) || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Player";
  return trimmed.slice(0, 18);
}

function loadCharacterId() {
  const raw = String(localStorage.getItem(SURVIVORS_CHARACTER_KEY) || "default");
  return CHARACTER_PRESETS[raw] ? raw : "default";
}

function saveCharacterId(characterId) {
  try {
    localStorage.setItem(SURVIVORS_CHARACTER_KEY, characterId);
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function readCloudAuth() {
  try {
    const userId = String(localStorage.getItem(CLOUD_USER_ID_KEY) || "").trim();
    const password = String(localStorage.getItem(CLOUD_PASSWORD_KEY) || "").trim();
    if (!userId || !password) return null;
    return { userId, password };
  } catch {
    return null;
  }
}

async function requestCloudProfile(path, payload) {
  const candidates = cloudApiCandidates();

  let lastError = null;
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        const err = new Error(data?.message || `Cloud request failed (${res.status})`);
        err.code = data?.code || "CLOUD_REQUEST_ERROR";
        lastError = err;
        continue;
      }

      return data;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Cloud request failed");
}

function skinFrames() {
  return PLAYER_FRAMES;
}

function hasFrames(frames) {
  return Array.isArray(frames) && frames.length > 0;
}

const PRELOADED_FRAME_SRC = new Set();

function preloadFrames(frames) {
  if (!Array.isArray(frames)) return;
  frames.forEach((src) => {
    if (typeof src !== "string" || !src || PRELOADED_FRAME_SRC.has(src)) return;
    PRELOADED_FRAME_SRC.add(src);
    const img = new Image();
    img.src = src;
  });
}

function preloadCharacterFrames(character) {
  const sprite = character?.sprite;
  if (!sprite) return;
  preloadFrames(sprite.idleFrames);
  preloadFrames(sprite.attackFrames);
  preloadFrames(sprite.upFrames);
  preloadFrames(sprite.downFrames);
}

function preloadCommonFrames() {
  preloadFrames([ATTACK_BULLET_FRAME]);
}

function movementInput(state) {
  const up = Boolean(state.keys?.has("arrowup") || state.keys?.has("w"));
  const down = Boolean(state.keys?.has("arrowdown") || state.keys?.has("s"));
  const left = Boolean(state.keys?.has("arrowleft") || state.keys?.has("a"));
  const right = Boolean(state.keys?.has("arrowright") || state.keys?.has("d"));

  let mx = 0;
  let my = 0;
  if (left) mx -= 1;
  if (right) mx += 1;
  if (up) my -= 1;
  if (down) my += 1;

  return {
    up,
    down,
    left,
    right,
    mx,
    my,
    movingHorizontal: left || right,
    movingVertical: up || down,
    moving: mx !== 0 || my !== 0,
  };
}

function verticalInput(state) {
  return Math.sign(movementInput(state).my);
}

function hasMoveInput(state) {
  return movementInput(state).moving;
}

function playerFrames(state) {
  const sprite = state.character?.sprite;
  let vertical = Number.isFinite(state.anim.verticalInput) ? state.anim.verticalInput : verticalInput(state);
  if (state.character?.id === "fairy" && vertical === 0 && state.anim.lastVerticalInput < 0) {
    vertical = -1;
  }
  const moving = hasMoveInput(state);
  if (sprite && !state.anim.customSpriteFallback) {
    if (vertical < 0 && hasFrames(sprite.upFrames)) {
      return sprite.upFrames;
    }
    if (vertical > 0 && hasFrames(sprite.downFrames)) {
      return sprite.downFrames;
    }
    if (moving && state.anim.attacking && hasFrames(sprite.attackFrames)) {
      return sprite.attackFrames;
    }
    if (hasFrames(sprite.idleFrames)) {
      return sprite.idleFrames;
    }
  }
  return skinFrames();
}

function currentPlayerFrame(state) {
  const frames = playerFrames(state);
  if (!Array.isArray(frames) || frames.length === 0) {
    return skinFrames()[0];
  }
  const frameIndex = Number.isFinite(state.anim?.frameIndex) ? state.anim.frameIndex : 0;
  return frames[frameIndex % frames.length];
}

function isEditableTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName;
  return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function rarityRank(rarity) {
  if (rarity === "legendary") return 3;
  if (rarity === "epic") return 2;
  if (rarity === "rare") return 1;
  return 0;
}

export function initSurvivors(options = {}) {
  preloadCommonFrames();
  const initialCloudAuth = readCloudAuth();
  const initialUnlockedSkins = loadUnlockedSkins();
  const initialSelectedSkin = loadSelectedSkin(initialUnlockedSkins);
  const initialSpawn = centerSpawnPoint();

  const fieldEl = document.getElementById("survivorsField");
  const hpGaugeEl = document.getElementById("survivorsHpGauge");
  const hpFillEl = document.getElementById("survivorsHpFill");
  const hpTextEl = document.getElementById("survivorsHpText");
  const levelTextEl = document.getElementById("survivorsLevelText");
  const xpTextEl = document.getElementById("survivorsXpText");
  const timeTextEl = document.getElementById("survivorsTimeText");
  const killTextEl = document.getElementById("survivorsKillText");
  const waveTextEl = document.getElementById("survivorsWaveText");
  const coinTextEl = document.getElementById("survivorsCoinText");
  const bankTextEl = document.getElementById("survivorsBankText");
  const pityTextEl = document.getElementById("survivorsPityText");
  const damageTextEl = document.getElementById("survivorsDamageText");
  const rangedTextEl = document.getElementById("survivorsRangedText");
  const meleeTextEl = document.getElementById("survivorsMeleeText");
  const explosionTextEl = document.getElementById("survivorsExplosionText");
  const fireTextEl = document.getElementById("survivorsFireText");
  const speedTextEl = document.getElementById("survivorsSpeedText");
  const armorTextEl = document.getElementById("survivorsArmorText");
  const pierceTextEl = document.getElementById("survivorsPierceText");
  const weaponSlotsTextEl = document.getElementById("survivorsWeaponSlotsText");
  const playersTextEl = document.getElementById("survivorsPlayersText");
  const posTextEl = document.getElementById("survivorsPosText");
  const characterSelectEl = document.getElementById("survivorsCharacterSelect");
  const passiveTextEl = document.getElementById("survivorsPassiveText");
  const messageEl = document.getElementById("survivorsMessage");
  const overlayEl = document.getElementById("survivorsOverlay");
  const augmentPanelEl = document.getElementById("survivorsAugmentPanel");
  const augmentLevelTextEl = document.getElementById("survivorsAugmentLevelText");
  const augmentOptionsEl = document.getElementById("survivorsAugmentOptions");
  const shopPanelEl = document.getElementById("survivorsShopPanel");
  const shopCoinTextEl = document.getElementById("survivorsShopCoinText");
  const shopWaitTextEl = document.getElementById("survivorsShopWaitText");
  const shopOptionsEl = document.getElementById("survivorsShopOptions");
  const shopRerollBtn = document.getElementById("survivorsShopRerollBtn");
  const shopNextBtn = document.getElementById("survivorsShopNextBtn");
  const gachaBtn = document.getElementById("survivorsGachaBtn");
  const gacha10Btn = document.getElementById("survivorsGacha10Btn");
  const startBtn = document.getElementById("survivorsStartBtn");
  const menuBtn = document.getElementById("survivorsMenuBtn");
  const enemySpriteCache = new WeakMap();
  const bulletSpriteCache = new WeakMap();
  const allySpriteCache = new WeakMap();
  const hudTextCache = new WeakMap();

  const state = {
    running: false,
    gameOver: true,
    player: {
      x: initialSpawn.x,
      y: initialSpawn.y,
      hp: 100,
      maxHp: 100,
      speed: 240,
      radius: 14,
      fireRate: 0.6,
      projSpeed: 520,
      damage: 10,
      rangedMul: 1,
      meleeDamage: 14,
      meleeRadius: 72,
      meleeRate: 1.1,
      orbMagnetRange: 180,
      orbPullBase: 80,
      damageTakenMul: 1,
      pierce: 0,
      executeThreshold: 0,
      executeMultiplier: 1,
      killNovaRadius: 0,
      killNovaDamage: 0,
      explosionRadius: 0,
      explosionDamage: 0,
      siphonHeal: 0,
      downed: false,
      reviveProgress: 0,
      reviveNeed: 7,
      reviveAllyRange: 180,
    },
    pausedForAugment: false,
    keys: new Set(),
    enemies: [],
    bullets: [],
    orbs: [],
    particles: [],
    enemySpawnTimer: 0,
    enemySpawnInterval: 1.1,
    wave: 1,
    waveDuration: 22,
    waveRemaining: 22,
    waveMaxEnemies: 8,
    betweenWaves: false,
    waveClearElapsed: 0,
    nextWaveDelay: 2,
    waveOverlayTimerId: null,
    fireTimer: 0,
    meleeTimer: 0,
    hitCooldown: 0,
    elapsed: 0,
    kills: 0,
    coins: 0,
    bankCoins: loadBankCoins(initialCloudAuth),
    coinCarryRate: 0.18,
    level: 1,
    xp: 0,
    xpNeed: 20,
    rafId: null,
    lastTs: 0,
    camera: {
      x: 0,
      y: 0,
    },
    entities: {
      player: null,
      playerSprite: null,
      bullets: new Map(),
      enemies: new Map(),
      orbs: new Map(),
      particles: new Map(),
      allies: new Map(),
    },
    anim: {
      frameIndex: 0,
      timer: 0,
      frameDuration: 0.09,
      attacking: false,
      movingUp: false,
      verticalInput: 0,
      lastVerticalInput: 0,
      customSpriteFallback: false,
    },
    augment: {
      offered: [],
      picked: [],
      renderedFor: null,
      selectedIndex: 0,
    },
    shop: {
      open: false,
      rerollCost: 10,
      offers: [],
      renderedFor: null,
      selectedIndex: 0,
      focusArea: "offers",
      actionIndex: 0,
      localReady: false,
      readyCount: 0,
      readyRequired: 1,
    },
    room: {
      enabled: false,
      role: "solo",
      playerCount: 1,
      maxPlayers: 8,
      locked: false,
      lockMessage: "",
      teammates: new Map(),
      readyVotes: new Map(),
      moveSyncTimer: 0,
      snapshotSyncTimer: 0,
    },
    gacha: {
      pityCounter: loadGachaPity(),
    },
    skin: {
      unlocked: new Set(initialUnlockedSkins),
      selectedId: initialSelectedSkin,
    },
    characterId: loadCharacterId(),
    character: CHARACTER_PRESETS[loadCharacterId()] ?? CHARACTER_PRESETS.default,
    weapons: {
      slotsMax: (CHARACTER_PRESETS[loadCharacterId()] ?? CHARACTER_PRESETS.default).weaponSlotMax,
      equipped: [...(CHARACTER_PRESETS[loadCharacterId()] ?? CHARACTER_PRESETS.default).starterWeapons],
    },
    passive: {
      label: "",
      desc: "",
      critChance: 0,
      critMul: 1,
      damageTakenMul: 1,
      meleeKillHeal: 0,
      aftershockChance: 0,
      aftershockDamageMul: 0,
      aftershockRadiusMul: 1,
      shieldInterval: 0,
      shieldReduce: 0,
      shieldReady: false,
      shieldTimer: 0,
    },
    cloud: {
      auth: initialCloudAuth,
      saving: false,
      dirty: false,
      debounceId: null,
    },
  };

  function buildCloudProfilePayload() {
    return {
      bankCoins: Math.floor(state.bankCoins),
      pityCounter: clamp(Math.floor(state.gacha.pityCounter), 0, 9),
      unlockedSkins: [...state.skin.unlocked],
      selectedSkin: state.skin.selectedId,
      playerName: loadProfilePlayerName(),
    };
  }

  function applyCharacterPresetToPlayer(preset) {
    const stats = preset?.baseStats || CHARACTER_PRESETS.default.baseStats;
    const passive = preset?.passive || {};
    state.player.damage = stats.damage;
    state.player.rangedMul = stats.rangedMul;
    state.player.meleeDamage = stats.meleeDamage;
    state.player.meleeRadius = stats.meleeRadius;
    state.player.meleeRate = stats.meleeRate;
    state.player.explosionRadius = stats.explosionRadius;
    state.player.explosionDamage = stats.explosionDamage;
    state.player.damageTakenMul = passive.damageTakenMul ?? 1;
    state.passive = {
      label: passive.label || "",
      desc: passive.desc || "",
      critChance: passive.critChance ?? 0,
      critMul: passive.critMul ?? 1,
      damageTakenMul: passive.damageTakenMul ?? 1,
      meleeKillHeal: passive.meleeKillHeal ?? 0,
      aftershockChance: passive.aftershockChance ?? 0,
      aftershockDamageMul: passive.aftershockDamageMul ?? 0,
      aftershockRadiusMul: passive.aftershockRadiusMul ?? 1,
      shieldInterval: passive.shieldInterval ?? 0,
      shieldReduce: passive.shieldReduce ?? 0,
      shieldReady: false,
      shieldTimer: 0,
    };
    if (state.passive.shieldInterval > 0) {
      state.passive.shieldReady = true;
    }
  }

  function passiveStatusText() {
    if (state.passive.shieldInterval > 0) {
      if (state.passive.shieldReady) {
        return `${state.passive.label} READY`;
      }
      const remain = Math.max(0, state.passive.shieldInterval - state.passive.shieldTimer);
      return `${state.passive.label} ${remain.toFixed(1)}s`;
    }
    return state.passive.label || "-";
  }

  function setCharacterPreset(characterId) {
    const nextId = CHARACTER_PRESETS[characterId] ? characterId : "default";
    state.characterId = nextId;
    state.character = CHARACTER_PRESETS[nextId];
    preloadCharacterFrames(state.character);
    state.anim.attacking = false;
    state.anim.movingUp = false;
    state.anim.verticalInput = 0;
    state.anim.lastVerticalInput = 0;
    state.anim.frameIndex = 0;
    state.anim.timer = 0;
    state.anim.customSpriteFallback = false;
    saveCharacterId(nextId);
    if (characterSelectEl && characterSelectEl.value !== nextId) {
      characterSelectEl.value = nextId;
    }
    if (state.entities.playerSprite) {
      state.entities.playerSprite.src = playerFrames(state)[0];
    }
    render();
    if (!state.running) {
      applyCharacterPresetToPlayer(state.character);
      resetWeaponSlots();
    }
  }

  function syncCharacterFromSelection() {
    const selected = characterSelectEl?.value || state.characterId;
    setCharacterPreset(selected);
  }

  function resetWeaponSlots() {
    state.weapons.slotsMax = Math.max(1, Math.floor(state.character.weaponSlotMax || 1));
    state.weapons.equipped = [...(state.character.starterWeapons || ["auto_blaster"])].slice(0, state.weapons.slotsMax);
  }

  function applyCloudProfilePayload(payload) {
    if (!payload || typeof payload !== "object") return;
    if (Number.isFinite(payload.bankCoins)) {
      state.bankCoins = Math.max(0, Math.floor(payload.bankCoins));
      saveBankCoins(state.bankCoins, state.cloud.auth);
    }
    if (Number.isFinite(payload.pityCounter)) {
      state.gacha.pityCounter = clamp(Math.floor(payload.pityCounter), 0, 9);
      saveGachaPity(state.gacha.pityCounter);
    }

    const unlocked = Array.isArray(payload.unlockedSkins)
      ? payload.unlockedSkins.filter((id) => typeof id === "string" && SKINS.some((s) => s.id === id))
      : [...state.skin.unlocked];
    if (!unlocked.includes(DEFAULT_SKIN_ID)) unlocked.unshift(DEFAULT_SKIN_ID);
    state.skin.unlocked = new Set(unlocked);

    const selected = typeof payload.selectedSkin === "string" ? payload.selectedSkin : state.skin.selectedId;
    state.skin.selectedId = state.skin.unlocked.has(selected) ? selected : DEFAULT_SKIN_ID;
    persistSkinState();

    if (typeof payload.playerName === "string") {
      const normalized = String(payload.playerName).trim().replace(/\s+/g, " ").slice(0, 18) || "Player";
      localStorage.setItem(PLAYER_NAME_KEY, normalized);
    }
  }

  function markCloudDirty() {
    if (!state.cloud.auth) return;
    state.cloud.dirty = true;
    if (state.cloud.debounceId) {
      window.clearTimeout(state.cloud.debounceId);
    }
    state.cloud.debounceId = window.setTimeout(() => {
      state.cloud.debounceId = null;
      void pushCloudProfile();
    }, 700);
  }

  async function pushCloudProfile() {
    if (!state.cloud.auth || !state.cloud.dirty || state.cloud.saving) return;
    state.cloud.saving = true;
    try {
      await requestCloudProfile("/api/profile/save", {
        userId: state.cloud.auth.userId,
        password: state.cloud.auth.password,
        profile: buildCloudProfilePayload(),
      });
      state.cloud.dirty = false;
    } catch {
      // Keep dirty=true so next change attempts to sync again.
    } finally {
      state.cloud.saving = false;
    }
  }

  async function pullCloudProfile() {
    if (!state.cloud.auth) return;
    try {
      const res = await requestCloudProfile("/api/profile/load", {
        userId: state.cloud.auth.userId,
        password: state.cloud.auth.password,
      });
      if (res?.profile) {
        applyCloudProfilePayload(res.profile);
        messageEl.textContent = `Cloud同期: ${state.cloud.auth.userId}`;
        render();
      }
    } catch {
      // Cloud unavailable or auth mismatch: local profile continues.
    }
  }

  function currentSkin() {
    return skinById(state.skin.selectedId);
  }

  function persistSkinState() {
    const unlockedIds = [...state.skin.unlocked];
    saveUnlockedSkins(unlockedIds);
    saveSelectedSkin(state.skin.selectedId);
    markCloudDirty();
  }

  function equipSkin(skinId) {
    if (!state.skin.unlocked.has(skinId)) return false;
    state.skin.selectedId = skinId;
    persistSkinState();
    return true;
  }

  function effectivePlayerCount() {
    if (!state.room.enabled) return 1;
    return clamp(Math.round(state.room.playerCount || 1), 1, state.room.maxPlayers);
  }

  function visibleTeammates() {
    const now = performance.now();
    return [...state.room.teammates.entries()]
      .filter(([, mate]) => now - mate.seenAt < 3500)
      .map(([id, mate]) => ({ id, ...mate }));
  }

  function nearbyAliveTeammateCount() {
    if (!state.room.enabled) return 0;
    const rangeSq = state.player.reviveAllyRange * state.player.reviveAllyRange;
    let count = 0;
    visibleTeammates().forEach((mate) => {
      if (mate.downed) return;
      const dx = mate.x - state.player.x;
      const dy = mate.y - state.player.y;
      if (dx * dx + dy * dy <= rangeSq) {
        count += 1;
      }
    });
    return count;
  }

  function revivePlayer(reason = "assist") {
    if (!state.player.downed) return;
    state.player.downed = false;
    state.player.reviveProgress = 0;
    state.player.hp = Math.max(24, Math.round(state.player.maxHp * 0.5));
    state.hitCooldown = 1;
    state.fireTimer = 0.2;
    if (!state.pausedForAugment && !state.shop.open) {
      setOverlay("");
    }
    if (reason === "wave") {
      messageEl.textContent = `WAVE ${state.wave} 開始と同時に復活!`;
    } else {
      messageEl.textContent = "味方の救助で復活しました";
    }
  }

  function downPlayer() {
    if (state.player.downed) return;
    state.player.downed = true;
    state.player.hp = 0;
    state.player.reviveProgress = 0;
    state.keys.clear();
    setOverlay("DOWN");
    messageEl.textContent = "ダウン中: 味方が近くにいると復活ゲージ進行 / 次ウェーブで復活";
  }

  function maybeBroadcastRoomMove(dt) {
    if (!state.room.enabled) return;
    state.room.moveSyncTimer -= dt;
    if (state.room.moveSyncTimer <= 0) {
      state.room.moveSyncTimer = 0.15;
      const input = movementInput(state);
      options.onRoomMove?.({
        kind: "survivors-pos",
        x: state.player.x,
        y: state.player.y,
        downed: state.player.downed,
        frameSrc: currentPlayerFrame(state),
        characterId: state.characterId,
        attacking: Boolean(state.anim.attacking),
        movingUp: Boolean(input.up),
        movingDown: Boolean(input.down),
        movingLeft: Boolean(input.left),
        movingRight: Boolean(input.right),
      });
    }

    if (state.room.role === "host") {
      state.room.snapshotSyncTimer -= dt;
      if (state.room.snapshotSyncTimer <= 0) {
        state.room.snapshotSyncTimer = 0.24;
        options.onRoomMove?.({
          kind: "survivors-sync",
          snapshot: buildRoomSnapshot(),
        });
      }
    }
  }

  function buildRoomSnapshot() {
    return {
      wave: state.wave,
      waveRemaining: state.waveRemaining,
      betweenWaves: state.betweenWaves,
      elapsed: state.elapsed,
      enemies: state.enemies.map((e) => ({
        id: e.id,
        x: Number(e.x.toFixed(2)),
        y: Number(e.y.toFixed(2)),
        hp: Number(e.hp.toFixed(2)),
        maxHp: Number(e.maxHp.toFixed(2)),
        speed: Number(e.speed.toFixed(2)),
        radius: Number(e.radius.toFixed(2)),
        damage: Number(e.damage.toFixed(2)),
        stage: Number(e.stage || 1),
      })),
      orbs: state.orbs.map((o) => ({
        id: o.id,
        x: Number(o.x.toFixed(2)),
        y: Number(o.y.toFixed(2)),
        radius: Number(o.radius.toFixed(2)),
        value: Number(o.value || 0),
      })),
    };
  }

  function applyRoomSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;

    if (Number.isFinite(snapshot.wave)) {
      state.wave = Math.max(1, Math.floor(snapshot.wave));
    }
    if (Number.isFinite(snapshot.waveRemaining)) {
      state.waveRemaining = Math.max(0, Number(snapshot.waveRemaining));
    }
    if (Number.isFinite(snapshot.elapsed)) {
      state.elapsed = Math.max(0, Number(snapshot.elapsed));
    }
    state.betweenWaves = Boolean(snapshot.betweenWaves);

    const hostInShop = state.betweenWaves;
    if (hostInShop !== state.shop.open) {
      state.shop.open = hostInShop;
      state.shop.renderedFor = null;
      state.shop.localReady = false;
      state.shop.readyCount = 0;
      state.shop.readyRequired = shopReadyRequired();
      if (hostInShop) {
        state.keys.clear();
        setOverlay("SHOP");
        messageEl.textContent = "ホストのショップ選択を待機中...";
      } else {
        hideShopPanel();
        if (!state.pausedForAugment && !state.gameOver) {
          setOverlay("");
        }
      }
    }

    if (Array.isArray(snapshot.enemies)) {
      state.enemies = snapshot.enemies
        .filter((e) => e && typeof e.id === "string")
        .map((e) => ({
          id: e.id,
          x: Number.isFinite(e.x) ? e.x : 0,
          y: Number.isFinite(e.y) ? e.y : 0,
          hp: Number.isFinite(e.hp) ? e.hp : 1,
          maxHp: Number.isFinite(e.maxHp) ? e.maxHp : 1,
          speed: Number.isFinite(e.speed) ? e.speed : 80,
          radius: Number.isFinite(e.radius) ? e.radius : 13,
          damage: Number.isFinite(e.damage) ? e.damage : 10,
          stage: Number.isFinite(e.stage) ? e.stage : 1,
          lastRenderedHpRatio: undefined,
        }));
    }

    if (Array.isArray(snapshot.orbs)) {
      state.orbs = snapshot.orbs
        .filter((o) => o && typeof o.id === "string")
        .map((o) => ({
          id: o.id,
          x: Number.isFinite(o.x) ? o.x : 0,
          y: Number.isFinite(o.y) ? o.y : 0,
          radius: Number.isFinite(o.radius) ? o.radius : 7,
          value: Number.isFinite(o.value) ? o.value : 0,
        }));
    }

    render();
  }

  function canAffordRun(cost) {
    return Math.floor(state.coins) >= Math.max(0, Math.floor(cost));
  }

  function spendRunCoins(cost) {
    const need = Math.max(0, Math.floor(cost));
    if (!canAffordRun(need)) return false;
    state.coins -= need;
    return true;
  }

  function spendBankCoins(cost) {
    const need = Math.max(0, Math.floor(cost));
    if (Math.floor(state.bankCoins) < need) return false;
    state.bankCoins -= need;
    saveBankCoins(state.bankCoins, state.cloud.auth);
    markCloudDirty();
    return true;
  }

  function pickGachaSkin({ minRank = 0 } = {}) {
    const ranked = SKINS.filter((skin) => rarityRank(skin.rarity) >= minRank);
    const rollSource = ranked.length > 0 ? ranked : SKINS;

    let totalWeight = 0;
    rollSource.forEach((skin) => {
      totalWeight += SKIN_RARITY[skin.rarity]?.weight ?? SKIN_RARITY.common.weight;
    });

    let roll = Math.random() * totalWeight;
    for (let i = 0; i < rollSource.length; i += 1) {
      roll -= SKIN_RARITY[rollSource[i].rarity]?.weight ?? SKIN_RARITY.common.weight;
      if (roll <= 0) {
        return rollSource[i];
      }
    }
    return rollSource[rollSource.length - 1] ?? SKINS[0] ?? null;
  }

  function drawOneFromBankGacha() {
    const guaranteedRare = state.gacha.pityCounter >= 9;
    const rolled = pickGachaSkin({ minRank: guaranteedRare ? 1 : 0 });
    if (!rolled) return null;

    if (rarityRank(rolled.rarity) >= 1) {
      state.gacha.pityCounter = 0;
    } else {
      state.gacha.pityCounter = clamp(state.gacha.pityCounter + 1, 0, 9);
    }
    saveGachaPity(state.gacha.pityCounter);
    markCloudDirty();

    const alreadyUnlocked = state.skin.unlocked.has(rolled.id);
    if (alreadyUnlocked) {
      const duplicateBonus = 8;
      state.bankCoins += duplicateBonus;
      saveBankCoins(state.bankCoins, state.cloud.auth);
      markCloudDirty();
      return { skin: rolled, newUnlock: false, duplicateBonus };
    }

    state.skin.unlocked.add(rolled.id);
    equipSkin(rolled.id);
    return { skin: rolled, newUnlock: true, duplicateBonus: 0 };
  }

  function rollBankGacha(times = 1) {
    if (state.pausedForAugment || state.shop.open || state.betweenWaves || state.player.downed) {
      messageEl.textContent = "SKIN GACHAは現在この画面では使えません";
      return;
    }

    const drawCount = Math.max(1, Math.floor(times));
    const cost = drawCount >= 10 ? BANK_GACHA_10_COST : BANK_GACHA_COST;
    if (!spendBankCoins(cost)) {
      messageEl.textContent = `BANK不足: ${cost}c必要`;
      return;
    }

    const results = [];
    for (let i = 0; i < drawCount; i += 1) {
      const rolled = drawOneFromBankGacha();
      if (rolled) results.push(rolled);
    }
    if (results.length === 0) {
      messageEl.textContent = "ガチャ対象がありません";
      return;
    }

    if (drawCount >= 10) {
      const summary = { common: 0, rare: 0, epic: 0, legendary: 0 };
      let unlockCount = 0;
      let refund = 0;
      results.forEach((r) => {
        summary[r.skin.rarity] += 1;
        if (r.newUnlock) unlockCount += 1;
        refund += r.duplicateBonus;
      });
      messageEl.textContent =
        `SKIN GACHA x${drawCount}: C${summary.common}/R${summary.rare}/E${summary.epic}/L${summary.legendary} ` +
        `NEW ${unlockCount} / DUP+${refund}c (PITY ${state.gacha.pityCounter}/10)`;
    } else {
      const r = results[0];
      if (r.newUnlock) {
        messageEl.textContent =
          `SKIN獲得: [${getSkinRarityLabel(r.skin.rarity)}] ${r.skin.title} を装備 ` +
          `(PITY ${state.gacha.pityCounter}/10)`;
      } else {
        messageEl.textContent =
          `重複: [${getSkinRarityLabel(r.skin.rarity)}] ${r.skin.title} +${r.duplicateBonus}c ` +
          `(PITY ${state.gacha.pityCounter}/10)`;
      }
    }
    persistSkinState();
    render();
  }

  function cycleSkin(direction = 1) {
    const unlocked = [...state.skin.unlocked].map((id) => skinById(id));
    if (unlocked.length <= 1) {
      messageEl.textContent = "スキンが未解放です（ガチャで解放）";
      return;
    }
    const currentIndex = unlocked.findIndex((skin) => skin.id === state.skin.selectedId);
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (baseIndex + direction + unlocked.length) % unlocked.length;
    const nextSkin = unlocked[nextIndex];
    equipSkin(nextSkin.id);
    messageEl.textContent = `スキン切替: [${getSkinRarityLabel(nextSkin.rarity)}] ${nextSkin.title}`;
    render();
  }

  function stashRunCoins(reason = "") {
    const gain = Math.max(0, Math.floor(state.coins));
    if (gain <= 0) return;
    state.bankCoins += gain;
    state.coins = 0;
    saveBankCoins(state.bankCoins, state.cloud.auth);
    markCloudDirty();
    if (reason === "defeat") {
      messageEl.textContent = `敗北: ${gain}cをBANKへ保存 (${Math.floor(state.bankCoins)}c)`;
    } else if (reason === "leave") {
      messageEl.textContent = `終了時に${gain}cをBANKへ保存 (${Math.floor(state.bankCoins)}c)`;
    }
  }

  function triggerAttackAnimation() {
    state.anim.attacking = true;
    state.anim.frameIndex = 0;
    state.anim.timer = 0;
  }

  function updateCamera() {
    state.camera.x = clamp(state.player.x - VIEW_W / 2, 0, Math.max(0, WORLD_W - VIEW_W));
    state.camera.y = clamp(state.player.y - VIEW_H / 2, 0, Math.max(0, WORLD_H - VIEW_H));
  }

  function toViewPos(entity) {
    return {
      x: entity.x - state.camera.x,
      y: entity.y - state.camera.y,
    };
  }

  function applyEnemySprite(el, stage) {
    let img = enemySpriteCache.get(el);
    if (!img) {
      img = document.createElement("img");
      img.className = "sv-enemy-sprite";
      img.alt = "enemy";
      img.draggable = false;
      el.appendChild(img);
      enemySpriteCache.set(el, img);
    }

    const src = ENEMY_FRAMES[stage] ?? ENEMY_FRAMES[1];
    if (img.dataset.frameSrc !== src) {
      img.src = src;
      img.dataset.frameSrc = src;
    }
  }

  function applyBulletSprite(el) {
    let img = bulletSpriteCache.get(el);
    if (!img) {
      img = document.createElement("img");
      img.className = "sv-bullet-sprite";
      img.alt = "";
      img.draggable = false;
      el.appendChild(img);
      bulletSpriteCache.set(el, img);
    }
    if (img.dataset.frameSrc !== ATTACK_BULLET_FRAME) {
      img.src = ATTACK_BULLET_FRAME;
      img.dataset.frameSrc = ATTACK_BULLET_FRAME;
    }
  }

  function applyAllySprite(el, mate) {
    let img = allySpriteCache.get(el);
    if (!img) {
      img = document.createElement("img");
      img.className = "sv-ally-sprite";
      img.alt = "";
      img.draggable = false;
      el.appendChild(img);
      allySpriteCache.set(el, img);
    }
    const src = typeof mate.frameSrc === "string" && mate.frameSrc ? mate.frameSrc : skinFrames()[0];
    if (img.dataset.frameSrc !== src) {
      img.src = src;
      img.dataset.frameSrc = src;
    }
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

  function hideShopPanel() {
    if (!shopPanelEl || !shopOptionsEl) return;
    shopPanelEl.classList.add("hidden");
    shopPanelEl.classList.remove("waiting");
    shopOptionsEl.innerHTML = "";
    shopWaitTextEl?.classList.add("hidden");
    state.shop.renderedFor = null;
  }

  function isShopWaitingForHost() {
    return state.shop.open && state.room.enabled && state.room.role === "guest";
  }

  function shopReadyRequired() {
    return state.room.enabled ? Math.max(1, effectivePlayerCount()) : 1;
  }

  function countRemoteReadyVotes() {
    let count = 0;
    state.room.readyVotes.forEach((ready) => {
      if (ready) count += 1;
    });
    return count;
  }

  function updateLocalShopReadyState() {
    const required = shopReadyRequired();
    const readyCount = state.room.role === "host"
      ? Math.min(required, (state.shop.localReady ? 1 : 0) + countRemoteReadyVotes())
      : Math.min(required, Math.max(0, state.shop.readyCount || 0));
    state.shop.readyRequired = required;
    state.shop.readyCount = readyCount;
    return { readyCount, required };
  }

  function isAllPlayersShopReady() {
    const { readyCount, required } = updateLocalShopReadyState();
    return readyCount >= required;
  }

  function broadcastShopReadyState() {
    if (!state.room.enabled || state.room.role !== "host") return;
    const { readyCount, required } = updateLocalShopReadyState();
    options.onRoomMove?.({
      kind: "survivors-shop-state",
      readyCount,
      readyRequired: required,
      allReady: readyCount >= required,
    });
  }

  function pickShopOffers(count = 3) {
    const pool = [...SHOP_ITEMS];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, Math.min(count, pool.length)).map((item) => {
      const waveScale = 1 + Math.floor((state.wave - 1) / 2) * 0.1;
      return {
        ...item,
        cost: Math.max(8, Math.round(item.baseCost * waveScale)),
      };
    });
  }

  function renderShopPanel() {
    if (!shopPanelEl || !shopOptionsEl || !shopCoinTextEl) return;

    if (!state.shop.open) {
      hideShopPanel();
      return;
    }

    shopPanelEl.classList.remove("hidden");

    if (isShopWaitingForHost()) {
      shopPanelEl.classList.add("waiting");
      shopCoinTextEl.textContent = `WAVE ${state.wave} ショップ`;
      updateLocalShopReadyState();
      if (shopWaitTextEl) {
        shopWaitTextEl.textContent = `他プレイヤー待機中... READY ${state.shop.readyCount}/${state.shop.readyRequired}`;
        shopWaitTextEl.classList.remove("hidden");
      }
      if (shopRerollBtn) shopRerollBtn.disabled = true;
      if (shopNextBtn) {
        shopNextBtn.disabled = state.shop.localReady;
        shopNextBtn.textContent = state.shop.localReady ? "READY完了" : "READY";
      }
      shopOptionsEl.innerHTML = "";
      state.shop.renderedFor = `wait:${state.wave}:${state.shop.readyCount}:${state.shop.readyRequired}:${state.shop.localReady ? 1 : 0}`;
      return;
    }

    shopPanelEl.classList.remove("waiting");
    updateLocalShopReadyState();
    shopWaitTextEl?.classList.add("hidden");
    shopCoinTextEl.textContent = `所持: RUN ${Math.floor(state.coins)}c / リロール ${state.shop.rerollCost}c`;
    if (shopRerollBtn) shopRerollBtn.disabled = state.shop.localReady || !canAffordRun(state.shop.rerollCost);
    if (shopNextBtn) {
      shopNextBtn.disabled = state.shop.localReady;
      shopNextBtn.textContent = state.shop.localReady
        ? `READY ${state.shop.readyCount}/${state.shop.readyRequired}`
        : "NEXT WAVE";
    }
    if (shopWaitTextEl && state.room.enabled) {
      shopWaitTextEl.textContent = `READY ${state.shop.readyCount}/${state.shop.readyRequired}`;
      shopWaitTextEl.classList.remove("hidden");
    }

    const key = state.shop.offers.map((offer) => `${offer.id}:${offer.cost}`).join("|") + `|${Math.floor(state.coins)}`;
    const readyKey = `|r:${state.shop.readyCount}/${state.shop.readyRequired}|l:${state.shop.localReady ? 1 : 0}`;
    if (state.shop.renderedFor === `${key}${readyKey}`) return;

    shopOptionsEl.innerHTML = "";
    state.shop.offers.forEach((offer) => {
      const canBuy = !state.shop.localReady && canAffordRun(offer.cost);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "survivors-shop-option";
      btn.disabled = !canBuy;
      btn.innerHTML = `<strong>${offer.title} - ${offer.cost}c</strong><span>${offer.desc}</span>`;
      btn.addEventListener("click", () => {
        if (!spendRunCoins(offer.cost)) return;
        offer.apply(state);
        messageEl.textContent = `購入: ${offer.title}`;
        state.shop.offers = state.shop.offers.filter((v) => v !== offer);
        state.shop.renderedFor = null;
        renderShopPanel();
        render();
      });
      shopOptionsEl.appendChild(btn);
    });

    state.shop.selectedIndex = clamp(state.shop.selectedIndex, 0, Math.max(0, state.shop.offers.length - 1));
    state.shop.actionIndex = clamp(state.shop.actionIndex, 0, 1);
    if (state.shop.focusArea === "offers") {
      const selectedBtn = shopOptionsEl.querySelector(`.survivors-shop-option:nth-child(${state.shop.selectedIndex + 1})`);
      selectedBtn?.focus();
    } else if (state.shop.actionIndex === 0) {
      shopRerollBtn?.focus();
    } else {
      shopNextBtn?.focus();
    }

    state.shop.renderedFor = `${key}${readyKey}`;
  }

  function focusShopOption(index) {
    if (!shopOptionsEl) return;
    const btn = shopOptionsEl.querySelector(`.survivors-shop-option:nth-child(${index + 1})`);
    btn?.focus();
  }

  function focusShopAction(index) {
    if (index <= 0) {
      shopRerollBtn?.focus();
      return;
    }
    shopNextBtn?.focus();
  }

  function chooseShopByIndex(index) {
    if (isShopWaitingForHost()) return;
    if (state.room.enabled && state.shop.localReady) return;
    const offer = state.shop.offers[index];
    if (!offer) return;
    if (!canAffordRun(offer.cost)) {
      messageEl.textContent = "コイン不足で購入できません";
      return;
    }
    spendRunCoins(offer.cost);
    offer.apply(state);
    messageEl.textContent = `購入: ${offer.title}`;
    state.shop.offers = state.shop.offers.filter((v) => v !== offer);
    state.shop.selectedIndex = clamp(state.shop.selectedIndex, 0, Math.max(0, state.shop.offers.length - 2));
    state.shop.renderedFor = null;
    renderShopPanel();
    render();
  }

  function openShopPanel() {
    state.shop.open = true;
    state.keys.clear();
    state.shop.localReady = false;
    state.shop.readyCount = 0;
    state.shop.readyRequired = shopReadyRequired();
    if (state.room.enabled && state.room.role === "host") {
      state.room.readyVotes.clear();
    }

    if (state.room.enabled && state.room.role === "guest") {
      state.shop.offers = [];
      state.shop.renderedFor = null;
      state.shop.selectedIndex = 0;
      state.shop.focusArea = "actions";
      state.shop.actionIndex = 1;
      setOverlay("SHOP");
      messageEl.textContent = "ホストのショップ選択を待機中...";
      renderShopPanel();
      return;
    }

    state.shop.offers = pickShopOffers(3);
    state.shop.renderedFor = null;
    state.shop.selectedIndex = 0;
    state.shop.focusArea = "offers";
    state.shop.actionIndex = 0;
    setOverlay("SHOP");
    messageEl.textContent = "ショップで装備を整えよう";
    if (state.room.enabled && state.room.role === "host") {
      broadcastShopReadyState();
    }
    renderShopPanel();
  }

  function rerollShop() {
    if (isShopWaitingForHost()) return;
    if (state.room.enabled && state.shop.localReady) return;
    if (!state.shop.open) return;
    if (!canAffordRun(state.shop.rerollCost)) {
      messageEl.textContent = "コイン不足でリロールできません";
      return;
    }
    spendRunCoins(state.shop.rerollCost);
    state.shop.rerollCost = Math.min(40, state.shop.rerollCost + 4);
    state.shop.offers = pickShopOffers(3);
    state.shop.selectedIndex = 0;
    state.shop.focusArea = "offers";
    state.shop.actionIndex = 0;
    state.shop.renderedFor = null;
    messageEl.textContent = "ショップをリロールしました";
    renderShopPanel();
    render();
  }

  function startNextWaveFromShop() {
    state.shop.open = false;
    state.keys.clear();
    state.shop.renderedFor = null;
    state.shop.localReady = false;
    state.shop.readyCount = 0;
    state.shop.readyRequired = 1;
    if (state.room.enabled && state.room.role === "host") {
      state.room.readyVotes.clear();
      broadcastShopReadyState();
    }
    hideShopPanel();
    state.betweenWaves = false;
    state.waveClearElapsed = 0;
    beginWave(state.wave + 1);
    render();
  }

  function closeShopAndStartNextWave() {
    if (!state.shop.open) return;

    if (!state.room.enabled) {
      startNextWaveFromShop();
      return;
    }

    if (!state.shop.localReady) {
      state.shop.localReady = true;
      options.onRoomMove?.({ kind: "survivors-shop-ready", ready: true });
    }

    if (state.room.role === "host") {
      broadcastShopReadyState();
      if (isAllPlayersShopReady()) {
        startNextWaveFromShop();
        return;
      }
      messageEl.textContent = `READY待機中... ${state.shop.readyCount}/${state.shop.readyRequired}`;
    } else {
      messageEl.textContent = `READY送信済み。全員待機中... ${state.shop.readyCount}/${state.shop.readyRequired}`;
    }

    renderShopPanel();
    render();
  }

  function pickRandomAugments(count = 3) {
    const pool = AUGMENTS.filter((aug) => !state.augment.picked.includes(aug.id));
    const source = pool.length >= count ? [...pool] : [...AUGMENTS];
    const picked = [];

    while (picked.length < Math.min(count, source.length)) {
      let totalWeight = 0;
      source.forEach((aug) => {
        totalWeight += augmentRollWeight(aug, state.level);
      });

      let roll = Math.random() * totalWeight;
      let pickedIndex = 0;

      for (let i = 0; i < source.length; i += 1) {
        roll -= augmentRollWeight(source[i], state.level);
        if (roll <= 0) {
          pickedIndex = i;
          break;
        }
      }

      picked.push(source[pickedIndex]);
      source.splice(pickedIndex, 1);
    }

    return picked;
  }

  function renderAugmentPanel() {
    if (!augmentPanelEl || !augmentOptionsEl) return;

    if (!state.pausedForAugment) {
      augmentPanelEl.classList.add("hidden");
      augmentOptionsEl.innerHTML = "";
      state.augment.renderedFor = null;
      return;
    }

    augmentPanelEl.classList.remove("hidden");
    if (augmentLevelTextEl) {
      augmentLevelTextEl.textContent = `LEVEL ${state.level} 報酬: 1つ選択`;
    }

    const renderKey = state.augment.offered.map((aug) => aug.id).join("|");
    if (state.augment.renderedFor === renderKey) return;

    augmentOptionsEl.innerHTML = "";
    state.augment.offered.forEach((aug, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `survivors-augment-option rarity-${aug.rarity ?? "common"}`;
      btn.dataset.augmentId = aug.id;
      btn.dataset.index = String(idx);
      btn.innerHTML = `<span class="survivors-augment-rarity">${getAugmentRarityLabel(aug.rarity)}</span><strong>${aug.title}</strong><span>${aug.desc}</span>`;
      btn.addEventListener("click", () => {
        applyAugment(aug.id);
      });
      augmentOptionsEl.appendChild(btn);
    });
    state.augment.renderedFor = renderKey;
    state.augment.selectedIndex = clamp(state.augment.selectedIndex, 0, Math.max(0, state.augment.offered.length - 1));
    const first = augmentOptionsEl.querySelector("button[data-index='0']");
    first?.focus();
  }

  function focusAugmentOption(index) {
    if (!augmentOptionsEl) return;
    const btn = augmentOptionsEl.querySelector(`button[data-index='${index}']`);
    btn?.focus();
  }

  function chooseAugmentByIndex(index) {
    const chosen = state.augment.offered[index];
    if (!chosen) return;
    applyAugment(chosen.id);
  }

  function openAugmentPanel() {
    state.pausedForAugment = true;
    state.augment.offered = pickRandomAugments(3);
    state.augment.selectedIndex = 0;
    state.augment.renderedFor = null;
    setOverlay("AUGMENT");
    messageEl.textContent = "オーグメントを1つ選択してください";
    renderAugmentPanel();
  }

  function applyAugment(augmentId) {
    if (!state.pausedForAugment) return;
    const chosen = state.augment.offered.find((aug) => aug.id === augmentId);
    if (!chosen) return;

    chosen.apply(state);
    state.augment.picked.push(chosen.id);
    state.augment.offered = [];
    state.augment.renderedFor = null;
    state.augment.selectedIndex = 0;
    state.pausedForAugment = false;
    if (!state.shop.open) {
      setOverlay("");
    }
    messageEl.textContent = `オーグメント獲得: [${getAugmentRarityLabel(chosen.rarity)}] ${chosen.title}`;
    renderAugmentPanel();

    if (state.xp >= state.xpNeed) {
      applyLevelUp();
    }
    render();
  }

  function setHudText(el, text) {
    if (!el) return;
    const next = String(text);
    if (hudTextCache.get(el) === next) return;
    hudTextCache.set(el, next);
    el.textContent = next;
  }

  function updateHud() {
    const hpCurrent = Math.max(0, Math.round(state.player.hp));
    const hpMax = Math.max(1, Math.round(state.player.maxHp));
    const hpRate = clamp(hpCurrent / hpMax, 0, 1);
    setHudText(hpTextEl, `${hpCurrent} / ${hpMax}`);
    if (hpFillEl) {
      hpFillEl.style.width = `${(hpRate * 100).toFixed(1)}%`;
    }
    if (hpGaugeEl) {
      hpGaugeEl.setAttribute("aria-valuemax", String(hpMax));
      hpGaugeEl.setAttribute("aria-valuenow", String(hpCurrent));
    }
    setHudText(levelTextEl, state.level);
    setHudText(xpTextEl, `${state.xp} / ${state.xpNeed}`);
    setHudText(killTextEl, state.kills);
    if (coinTextEl) {
      setHudText(coinTextEl, Math.floor(state.coins));
    }
    if (bankTextEl) {
      setHudText(bankTextEl, Math.floor(state.bankCoins));
    }
    if (pityTextEl) {
      setHudText(pityTextEl, `${state.gacha.pityCounter} / 10`);
    }
    if (damageTextEl) {
      setHudText(damageTextEl, Math.round(state.player.damage));
    }
    if (rangedTextEl) {
      setHudText(rangedTextEl, `${Math.round(state.player.rangedMul * 100)}%`);
    }
    if (meleeTextEl) {
      setHudText(meleeTextEl, Math.round(state.player.meleeDamage));
    }
    if (explosionTextEl) {
      setHudText(explosionTextEl, Math.round(state.player.explosionDamage));
    }
    if (fireTextEl) {
      setHudText(fireTextEl, (1 / Math.max(0.001, state.player.fireRate)).toFixed(2));
    }
    if (speedTextEl) {
      setHudText(speedTextEl, Math.round(state.player.speed));
    }
    if (armorTextEl) {
      const armorRate = clamp(1 - state.player.damageTakenMul, 0, 0.95);
      setHudText(armorTextEl, `${Math.round(armorRate * 100)}%`);
    }
    if (pierceTextEl) {
      setHudText(pierceTextEl, state.player.pierce);
    }
    if (playersTextEl) {
      setHudText(playersTextEl, `${effectivePlayerCount()} / ${state.room.maxPlayers}`);
    }
    if (posTextEl) {
      setHudText(posTextEl, `X: ${Math.round(state.player.x)} Y: ${Math.round(state.player.y)}`);
    }
    if (weaponSlotsTextEl) {
      setHudText(weaponSlotsTextEl, `${state.weapons.equipped.length} / ${state.weapons.slotsMax}`);
    }
    if (passiveTextEl) {
      setHudText(passiveTextEl, passiveStatusText());
    }
    if (waveTextEl) {
      if (state.betweenWaves) {
        setHudText(waveTextEl, `${state.wave} CLEAR`);
      } else {
        setHudText(waveTextEl, `${state.wave} (${Math.max(0, Math.ceil(state.waveRemaining))}s)`);
      }
    }

    const totalSec = Math.floor(state.elapsed);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    setHudText(timeTextEl, `${mm}:${ss}`);
  }

  function waveDurationFor(wave) {
    return clamp(22 - (wave - 1) * 0.5, 14, 22);
  }

  function maxEnemiesForWave(wave) {
    const base = 7 + Math.floor(wave * 1.8);
    const players = effectivePlayerCount();
    const scale = 1 + (players - 1) * 0.65;
    return Math.max(8, Math.round(base * scale));
  }

  function spawnIntervalForWave(wave) {
    const base = clamp(0.9 - wave * 0.04, 0.2, 1.1);
    const players = effectivePlayerCount();
    const pressure = 1 + (players - 1) * 0.22;
    return clamp(base / pressure, 0.12, 1.1);
  }

  function showWaveOverlay(text, durationMs = 900) {
    if (state.waveOverlayTimerId) {
      window.clearTimeout(state.waveOverlayTimerId);
      state.waveOverlayTimerId = null;
    }

    if (startBtn) {
      startBtn.disabled = state.room.enabled && state.room.locked;
    }

    setOverlay(text);
    state.waveOverlayTimerId = window.setTimeout(() => {
      state.waveOverlayTimerId = null;
      if (state.running && !state.gameOver && !state.pausedForAugment && !state.betweenWaves) {
        setOverlay("");
      }
    }, durationMs);
  }

  function beginWave(nextWave) {
    if (state.player.downed) {
      revivePlayer("wave");
    }
    state.wave = nextWave;
    state.waveDuration = waveDurationFor(state.wave);
    state.waveRemaining = state.waveDuration;
    state.waveMaxEnemies = maxEnemiesForWave(state.wave);
    state.enemySpawnInterval = spawnIntervalForWave(state.wave);
    state.enemySpawnTimer = 0.16;
    state.betweenWaves = false;
    state.waveClearElapsed = 0;

    messageEl.textContent = `WAVE ${state.wave} 開始! ${Math.ceil(state.waveDuration)}秒生存 (${effectivePlayerCount()}人)`;
    showWaveOverlay(`WAVE ${state.wave}`, 850);
  }

  function clearDomEntities() {
    fieldEl.querySelectorAll(".sv-bullet,.sv-enemy,.sv-orb,.sv-particle,.sv-level-fx,.sv-ally,.sv-pulse-ring").forEach((el) => el.remove());
    state.entities.bullets.clear();
    state.entities.enemies.clear();
    state.entities.orbs.clear();
    state.entities.particles.clear();
    state.entities.allies.clear();
  }

  function ensurePlayerEl() {
    if (state.entities.player) return state.entities.player;
    const el = document.createElement("div");
    el.className = "sv-player";
    const img = document.createElement("img");
    img.className = "sv-player-sprite";
    img.alt = "";
    img.draggable = false;
    img.onerror = () => {
      // If custom image is missing, keep gameplay alive with built-in frames.
      state.anim.customSpriteFallback = true;
      img.src = skinFrames()[0];
    };
    img.src = playerFrames(state)[0];
    el.appendChild(img);
    state.entities.playerSprite = img;
    fieldEl.appendChild(el);
    state.entities.player = el;
    return el;
  }

  function syncEntityMap(list, map, className) {
    const ids = new Set();
    list.forEach((item) => {
      ids.add(item.id);
      if (!map.has(item.id)) {
        const el = document.createElement("div");
        el.className = className;
        fieldEl.appendChild(el);
        map.set(item.id, el);
      }
    });

    map.forEach((_, id) => {
      if (!ids.has(id)) {
        map.get(id)?.remove();
        map.delete(id);
      }
    });
  }

  function render() {
    updateCamera();
    const activeSkin = currentSkin();
    const activeFrames = playerFrames(state);
    const playerEl = ensurePlayerEl();
    const playerPos = toViewPos(state.player);
    playerEl.style.transform = `translate(${playerPos.x}px, ${playerPos.y}px)`;
    fieldEl.style.backgroundPosition = `center, ${-state.camera.x}px ${-state.camera.y}px, ${-state.camera.x}px ${-state.camera.y}px`;
    if (state.entities.playerSprite) {
      const nextFrame = activeFrames[state.anim.frameIndex % activeFrames.length];
      if (state.entities.playerSprite.dataset.frameSrc !== nextFrame) {
        state.entities.playerSprite.src = nextFrame;
        state.entities.playerSprite.dataset.frameSrc = nextFrame;
      }
      const useSkinFilter = state.character?.sprite?.useSkinFilter !== false || state.anim.customSpriteFallback;
      state.entities.playerSprite.style.filter = useSkinFilter ? activeSkin.filter || "none" : "none";
    }

    syncEntityMap(state.bullets, state.entities.bullets, "sv-bullet");
    syncEntityMap(state.enemies, state.entities.enemies, "sv-enemy");
    syncEntityMap(state.orbs, state.entities.orbs, "sv-orb");
    syncEntityMap(state.particles, state.entities.particles, "sv-particle");
    const mates = visibleTeammates();
    syncEntityMap(mates, state.entities.allies, "sv-ally");

    state.bullets.forEach((b) => {
      const el = state.entities.bullets.get(b.id);
      if (!el) return;
      applyBulletSprite(el);
      const p = toViewPos(b);
      el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${b.rot}rad)`;
    });

    state.enemies.forEach((e) => {
      const el = state.entities.enemies.get(e.id);
      if (!el) return;
      applyEnemySprite(el, e.stage ?? 1);
      const p = toViewPos(e);
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      const hpRatio = clamp(e.hp / e.maxHp, 0, 1);
      if (e.lastRenderedHpRatio !== hpRatio) {
        e.lastRenderedHpRatio = hpRatio;
        el.style.setProperty("--enemy-hp", `${hpRatio}`);
      }
    });

    state.orbs.forEach((o) => {
      const el = state.entities.orbs.get(o.id);
      if (!el) return;
      const p = toViewPos(o);
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });

    state.particles.forEach((p) => {
      const el = state.entities.particles.get(p.id);
      if (!el) return;
      const pos = toViewPos(p);
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      el.style.opacity = `${clamp(p.life / p.maxLife, 0, 1)}`;
    });

    mates.forEach((mate) => {
      const el = state.entities.allies.get(mate.id);
      if (!el) return;
      applyAllySprite(el, mate);
      const p = toViewPos(mate);
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      el.style.opacity = mate.downed ? "0.45" : "0.9";
    });

    renderAugmentPanel();
    renderShopPanel();
    updateHud();
  }

  function newId(prefix) {
    return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`;
  }

  function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    const margin = 18;
    let x = 0;
    let y = 0;

    if (edge === 0) {
      x = state.camera.x + Math.random() * VIEW_W;
      y = state.camera.y - margin;
    } else if (edge === 1) {
      x = state.camera.x + VIEW_W + margin;
      y = state.camera.y + Math.random() * VIEW_H;
    } else if (edge === 2) {
      x = state.camera.x + Math.random() * VIEW_W;
      y = state.camera.y + VIEW_H + margin;
    } else {
      x = state.camera.x - margin;
      y = state.camera.y + Math.random() * VIEW_H;
    }

    x = clamp(x, -margin, WORLD_W + margin);
    y = clamp(y, -margin, WORLD_H + margin);

    const levelScale = 1 + (state.level - 1) * 0.18;
    const hpScale = 1 + state.elapsed / 120;
    const enemyStage = state.level >= 3 ? 2 : 1;
    const baseHp = 20 + state.level * 3 + (enemyStage === 2 ? 10 : 0);
    const baseSpeed = 70 + Math.random() * 22 + state.level * 4 + state.elapsed * 0.18;
    const baseDamage = 8 + Math.floor((state.level - 1) * 1.4) + (enemyStage === 2 ? 3 : 0);
    const maxHp = baseHp * levelScale * hpScale;

    state.enemies.push({
      id: newId("e"),
      x,
      y,
      stage: enemyStage,
      hp: maxHp,
      maxHp,
      speed: baseSpeed,
      radius: enemyStage === 2 ? 14 : 13,
      damage: baseDamage,
    });
  }

  function spawnBullet(target) {
    const dx = target.x - state.player.x;
    const dy = target.y - state.player.y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * state.player.projSpeed;
    const vy = (dy / len) * state.player.projSpeed;

    state.bullets.push({
      id: newId("b"),
      x: state.player.x,
      y: state.player.y,
      vx,
      vy,
      life: 1.6,
      radius: 5,
      damage: state.player.damage,
      pierceLeft: state.player.pierce,
      rot: Math.atan2(vy, vx),
    });

    triggerAttackAnimation();
  }

  function spawnOrb(x, y, amount = 5) {
    state.orbs.push({ id: newId("o"), x, y, radius: 7, value: amount });
  }

  function spawnBurst(x, y, count = 6) {
    for (let i = 0; i < count; i += 1) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = 50 + Math.random() * 100;
      state.particles.push({
        id: newId("p"),
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
      });
    }
  }

  function spawnPulseRing(x, y, diameter, tone = "melee") {
    if (!fieldEl) return;
    const size = clamp(Math.round(diameter), 28, 560);
    const ring = document.createElement("div");
    ring.className = `sv-pulse-ring ${tone}`;
    ring.style.setProperty("--pulse-size", `${size}px`);
    const p = toViewPos({ x, y });
    ring.style.transform = `translate(${p.x}px, ${p.y}px)`;
    fieldEl.appendChild(ring);
    window.setTimeout(() => ring.remove(), 340);
  }

  function grantKillRewards(enemy, source = "generic") {
    state.kills += 1;
    spawnOrb(enemy.x, enemy.y, 5 + Math.floor(state.level / 3));
    spawnBurst(enemy.x, enemy.y, 8);
    if (state.player.siphonHeal > 0) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.player.siphonHeal);
    }
    if (source === "melee" && state.passive.meleeKillHeal > 0) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.passive.meleeKillHeal);
    }
  }

  function triggerKillNova(originX, originY, opts = {}) {
    const allowAftershock = opts.allowAftershock !== false;
    const radius = opts.overrideRadius ?? (state.player.killNovaRadius + state.player.explosionRadius);
    const damage = opts.overrideDamage ?? (state.player.killNovaDamage + state.player.explosionDamage);
    if (radius <= 0 || damage <= 0) return;

    const radiusSq = radius * radius;
    spawnPulseRing(originX, originY, radius * 2, "explosion");
    spawnBurst(originX, originY, 10);
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      const dx = enemy.x - originX;
      const dy = enemy.y - originY;
      if (dx * dx + dy * dy > radiusSq) continue;

      enemy.hp -= damage;
      spawnBurst(enemy.x, enemy.y, 5);
      if (enemy.hp <= 0) {
        grantKillRewards(enemy, "explosion");
        state.enemies.splice(i, 1);
      } else {
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len;
        const ny = dy / len;
        const push = clamp((radius - Math.sqrt(dx * dx + dy * dy)) * 0.18, 6, 40);
        enemy.x = clamp(enemy.x + nx * push, 8, WORLD_W - 8);
        enemy.y = clamp(enemy.y + ny * push, 8, WORLD_H - 8);
      }
    }

    if (allowAftershock && state.passive.aftershockChance > 0 && Math.random() < state.passive.aftershockChance) {
      const nextDamage = damage * Math.max(0, state.passive.aftershockDamageMul);
      const nextRadius = radius * Math.max(0.1, state.passive.aftershockRadiusMul || 1);
      window.setTimeout(() => {
        triggerKillNova(originX, originY, {
          allowAftershock: false,
          overrideDamage: nextDamage,
          overrideRadius: nextRadius,
        });
      }, 70);
    }
  }

  function applyMeleePulse() {
    if (state.player.meleeDamage <= 0 || state.player.meleeRadius <= 0) return;
    const radiusSq = state.player.meleeRadius * state.player.meleeRadius;
    let hitCount = 0;
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      const dx = enemy.x - state.player.x;
      const dy = enemy.y - state.player.y;
      if (dx * dx + dy * dy > radiusSq) continue;
      enemy.hp -= state.player.meleeDamage;
      hitCount += 1;
      spawnBurst(enemy.x, enemy.y, 3);
      if (enemy.hp <= 0) {
        const deadX = enemy.x;
        const deadY = enemy.y;
        grantKillRewards(enemy, "melee");
        state.enemies.splice(i, 1);
        triggerKillNova(deadX, deadY);
      }
    }
    if (hitCount > 0) {
      spawnPulseRing(state.player.x, state.player.y, state.player.meleeRadius * 2, "melee");
      spawnBurst(state.player.x, state.player.y, 6);
    }
  }

  function applyLevelUp() {
    while (state.xp >= state.xpNeed) {
      state.xp -= state.xpNeed;
      state.level += 1;
      state.xpNeed = Math.floor(state.xpNeed * 1.3 + 8);

      state.player.maxHp += 3;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6);
      if (state.level === 3) {
        messageEl.textContent = "LEVEL 3! enemy2 が出現";
      } else {
        messageEl.textContent = `LEVEL ${state.level}! オーグメント選択`;
      }

      const fx = document.createElement("div");
      fx.className = "sv-level-fx";
      fieldEl.appendChild(fx);
      window.setTimeout(() => fx.remove(), 600);

      openAugmentPanel();
      break;
    }
  }

  function nearestEnemy() {
    if (state.enemies.length === 0) return null;
    let best = state.enemies[0];
    let bestD = distanceSq(state.player, best);

    for (let i = 1; i < state.enemies.length; i += 1) {
      const d = distanceSq(state.player, state.enemies[i]);
      if (d < bestD) {
        bestD = d;
        best = state.enemies[i];
      }
    }
    return best;
  }

  function tick(dt) {
    if (state.pausedForAugment) {
      return;
    }

    maybeBroadcastRoomMove(dt);

    if (state.shop.open || state.betweenWaves) {
      render();
      return;
    }

    state.elapsed += dt;

    if (state.passive.shieldInterval > 0 && !state.passive.shieldReady) {
      state.passive.shieldTimer += dt;
      if (state.passive.shieldTimer >= state.passive.shieldInterval) {
        state.passive.shieldReady = true;
        state.passive.shieldTimer = state.passive.shieldInterval;
      }
    }

    if (state.anim.attacking) {
      state.anim.timer += dt;
      if (state.anim.timer >= state.anim.frameDuration) {
        state.anim.timer = 0;
        state.anim.frameIndex += 1;
        if (state.anim.frameIndex >= playerFrames(state).length) {
          state.anim.frameIndex = 0;
          state.anim.attacking = false;
        }
      }
    } else {
      state.anim.frameIndex = 0;
    }

    if (!state.player.downed) {
      const { mx, my } = movementInput(state);
      const wasMovingUp = state.anim.movingUp;
      state.anim.movingUp = my < 0;
      state.anim.verticalInput = Math.sign(my);
      if (state.anim.verticalInput !== 0) {
        state.anim.lastVerticalInput = state.anim.verticalInput;
      }

      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my) || 1;
        state.player.x += (mx / len) * state.player.speed * dt;
        state.player.y += (my / len) * state.player.speed * dt;
        state.player.x = clamp(state.player.x, 8, WORLD_W - 8);
        state.player.y = clamp(state.player.y, 8, WORLD_H - 8);
      }
    } else {
      state.anim.movingUp = false;
      state.anim.verticalInput = 0;
      const helperCount = nearbyAliveTeammateCount();
      if (helperCount > 0) {
        state.player.reviveProgress += dt * helperCount;
        const remain = Math.max(0, state.player.reviveNeed - state.player.reviveProgress);
        messageEl.textContent = `救助中... ${remain.toFixed(1)}s (近くの味方 ${helperCount}人)`;
        if (state.player.reviveProgress >= state.player.reviveNeed) {
          revivePlayer("assist");
        }
      }
    }

    state.enemySpawnTimer -= dt;
    if (!state.betweenWaves) {
      while (state.enemySpawnTimer <= 0 && state.enemies.length < state.waveMaxEnemies) {
        spawnEnemy();
        state.enemySpawnTimer += state.enemySpawnInterval;
      }

      state.waveRemaining -= dt;
      if (state.waveRemaining <= 0) {
        state.waveRemaining = 0;
        state.betweenWaves = true;
        state.waveClearElapsed = 0;
        state.enemies = [];
        const reward = 12 + Math.round(state.wave * 3.2) + Math.round(state.waveRemaining);
        const carryBonus = Math.floor(state.coins * state.coinCarryRate);
        state.coins += reward + carryBonus;
        messageEl.textContent = `WAVE ${state.wave} クリア! +${reward}c (持越し +${carryBonus}c)`;
        showWaveOverlay(`WAVE ${state.wave} CLEAR`, 900);
        openShopPanel();
      }
    } else {
      state.waveClearElapsed += dt;
    }

    state.fireTimer -= dt;
    if (!state.player.downed && state.fireTimer <= 0) {
      const target = nearestEnemy();
      if (target) {
        spawnBullet(target);
      }
      state.fireTimer = state.player.fireRate;
    }

    state.meleeTimer -= dt;
    if (!state.player.downed && state.meleeTimer <= 0) {
      applyMeleePulse();
      state.meleeTimer = Math.max(0.3, state.player.meleeRate);
    }

    state.bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    });
    state.bullets = state.bullets.filter((b) => b.life > 0 && b.x > -24 && b.x < WORLD_W + 24 && b.y > -24 && b.y < WORLD_H + 24);

    state.enemies.forEach((e) => {
      const dx = state.player.x - e.x;
      const dy = state.player.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      e.x += (dx / len) * e.speed * dt;
      e.y += (dy / len) * e.speed * dt;
    });

    state.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
    });
    state.particles = state.particles.filter((p) => p.life > 0);

    for (let bi = state.bullets.length - 1; bi >= 0; bi -= 1) {
      const b = state.bullets[bi];
      let hit = false;
      for (let ei = state.enemies.length - 1; ei >= 0; ei -= 1) {
        const e = state.enemies[ei];
        const rr = (b.radius + e.radius) * (b.radius + e.radius);
        if (distanceSq(b, e) <= rr) {
          const hpRatio = e.maxHp > 0 ? e.hp / e.maxHp : 1;
          const execMul = hpRatio <= state.player.executeThreshold ? state.player.executeMultiplier : 1;
          let damage = b.damage * state.player.rangedMul * execMul;
          if (state.passive.critChance > 0 && Math.random() < state.passive.critChance) {
            damage *= Math.max(1, state.passive.critMul || 1);
            spawnBurst(e.x, e.y, 5);
          }
          e.hp -= damage;
          spawnBurst(b.x, b.y, 4);
          if (e.hp <= 0) {
            const deadX = e.x;
            const deadY = e.y;
            grantKillRewards(e, "ranged");
            state.enemies.splice(ei, 1);
            triggerKillNova(deadX, deadY);
          }

          if (b.pierceLeft > 0) {
            b.pierceLeft -= 1;
            b.damage *= 0.92;
          } else {
            hit = true;
          }
          break;
        }
      }
      if (hit) {
        state.bullets.splice(bi, 1);
      }
    }

    state.hitCooldown -= dt;
    if (!state.player.downed && state.hitCooldown <= 0) {
      let touchDamage = 0;
      state.enemies.forEach((e) => {
        const rr = (state.player.radius + e.radius - 6) * (state.player.radius + e.radius - 6);
        if (distanceSq(state.player, e) <= rr) {
          touchDamage = Math.max(touchDamage, e.damage ?? 10);
        }
      });
      if (touchDamage > 0) {
        let taken = touchDamage * state.player.damageTakenMul;
        if (state.passive.shieldReady && state.passive.shieldReduce > 0) {
          taken *= Math.max(0, 1 - state.passive.shieldReduce);
          state.passive.shieldReady = false;
          state.passive.shieldTimer = 0;
          spawnPulseRing(state.player.x, state.player.y, 84, "melee");
        }
        state.player.hp -= taken;
        state.hitCooldown = 0.45;
        fieldEl.classList.add("hurt");
        window.setTimeout(() => fieldEl.classList.remove("hurt"), 110);
        if (state.player.hp <= 0) {
          if (state.room.enabled && effectivePlayerCount() > 1) {
            downPlayer();
          } else {
            state.player.hp = 0;
            state.running = false;
            state.gameOver = true;
            setOverlay("GAME OVER");
            stashRunCoins("defeat");
          }
        }
      }
    }

    for (let oi = state.orbs.length - 1; oi >= 0; oi -= 1) {
      const o = state.orbs[oi];
      const dx = state.player.x - o.x;
      const dy = state.player.y - o.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < state.player.orbMagnetRange * state.player.orbMagnetRange) {
        const len = Math.hypot(dx, dy) || 1;
        const pull = state.player.orbPullBase + (state.player.orbMagnetRange - Math.sqrt(d2)) * 1.6;
        o.x += (dx / len) * pull * dt;
        o.y += (dy / len) * pull * dt;
      }

      if (!state.player.downed && distanceSq(state.player, o) <= (state.player.radius + o.radius) ** 2) {
        state.xp += o.value;
        state.orbs.splice(oi, 1);
      }
    }

    applyLevelUp();
    render();
  }

  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = clamp((ts - state.lastTs) / 1000, 0, 0.04);
    state.lastTs = ts;

    tick(dt);

    if (state.running) {
      state.rafId = window.requestAnimationFrame(loop);
    }
  }

  function onKeyDown(e) {
    if (e.isComposing || isEditableTarget(e.target)) return;

    const key = e.key.toLowerCase();

    if (state.pausedForAugment) {
      if (key === "1" || key === "2" || key === "3") {
        chooseAugmentByIndex(Number(key) - 1);
        e.preventDefault();
        return;
      }

      if (key === "arrowleft" || key === "a") {
        const max = Math.max(0, state.augment.offered.length - 1);
        state.augment.selectedIndex = clamp(state.augment.selectedIndex - 1, 0, max);
        focusAugmentOption(state.augment.selectedIndex);
        e.preventDefault();
        return;
      }

      if (key === "arrowright" || key === "d") {
        const max = Math.max(0, state.augment.offered.length - 1);
        state.augment.selectedIndex = clamp(state.augment.selectedIndex + 1, 0, max);
        focusAugmentOption(state.augment.selectedIndex);
        e.preventDefault();
        return;
      }

      if (key === "enter" || key === " ") {
        chooseAugmentByIndex(state.augment.selectedIndex);
        e.preventDefault();
        return;
      }
    }

    if (state.shop.open) {
      if (isShopWaitingForHost()) {
        if (key === "enter" || key === " " || key === "n" || key === "4") {
          closeShopAndStartNextWave();
          e.preventDefault();
        } else if (key === "escape") {
          e.preventDefault();
        }
        return;
      }

      if (key === "1" || key === "2" || key === "3") {
        state.shop.focusArea = "offers";
        chooseShopByIndex(Number(key) - 1);
        e.preventDefault();
        return;
      }

      if (key === "arrowup" || key === "w") {
        state.shop.focusArea = "offers";
        focusShopOption(state.shop.selectedIndex);
        e.preventDefault();
        return;
      }

      if (key === "arrowdown" || key === "s") {
        state.shop.focusArea = "actions";
        focusShopAction(state.shop.actionIndex);
        e.preventDefault();
        return;
      }

      if (key === "arrowleft" || key === "a") {
        if (state.shop.focusArea === "offers") {
          const max = Math.max(0, state.shop.offers.length - 1);
          state.shop.selectedIndex = clamp(state.shop.selectedIndex - 1, 0, max);
          focusShopOption(state.shop.selectedIndex);
        } else {
          state.shop.actionIndex = clamp(state.shop.actionIndex - 1, 0, 1);
          focusShopAction(state.shop.actionIndex);
        }
        e.preventDefault();
        return;
      }

      if (key === "arrowright" || key === "d") {
        if (state.shop.focusArea === "offers") {
          const max = Math.max(0, state.shop.offers.length - 1);
          state.shop.selectedIndex = clamp(state.shop.selectedIndex + 1, 0, max);
          focusShopOption(state.shop.selectedIndex);
        } else {
          state.shop.actionIndex = clamp(state.shop.actionIndex + 1, 0, 1);
          focusShopAction(state.shop.actionIndex);
        }
        e.preventDefault();
        return;
      }

      if (key === "enter" || key === " ") {
        if (state.shop.focusArea === "offers") {
          chooseShopByIndex(state.shop.selectedIndex);
        } else if (state.shop.actionIndex === 0) {
          rerollShop();
        } else {
          closeShopAndStartNextWave();
        }
        e.preventDefault();
        return;
      }

      if (key === "r") {
        rerollShop();
        e.preventDefault();
        return;
      }

      if (key === "n") {
        closeShopAndStartNextWave();
        e.preventDefault();
        return;
      }

      if (key === "4") {
        state.shop.focusArea = "actions";
        state.shop.actionIndex = 1;
        closeShopAndStartNextWave();
        e.preventDefault();
        return;
      }
    }

    if (key === "g") {
      rollBankGacha();
      e.preventDefault();
      return;
    }

    if (key === "h") {
      rollBankGacha(10);
      e.preventDefault();
      return;
    }

    if (key === "c") {
      cycleSkin(1);
      e.preventDefault();
      return;
    }

    if (state.shop.open || state.betweenWaves) {
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) {
        e.preventDefault();
      }
      return;
    }

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      state.keys.add(key);
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    if (isEditableTarget(e.target)) return;
    state.keys.delete(e.key.toLowerCase());
  }

  function startGame() {
    if (state.room.enabled && state.room.locked) {
      messageEl.textContent = state.room.lockMessage || "ホストの開始を待っています...";
      return;
    }

    const spawn = centerSpawnPoint();
    state.running = true;
    state.gameOver = false;
    state.pausedForAugment = false;
    resetWeaponSlots();
    state.player = {
      ...state.player,
      x: spawn.x,
      y: spawn.y,
      hp: 100,
      maxHp: 100,
      speed: 240,
      radius: 14,
      fireRate: 0.6,
      projSpeed: 520,
      damage: 10,
      rangedMul: 1,
      meleeDamage: 14,
      meleeRadius: 72,
      meleeRate: 1.1,
      orbMagnetRange: 180,
      orbPullBase: 80,
      damageTakenMul: 1,
      pierce: 0,
      executeThreshold: 0,
      executeMultiplier: 1,
      killNovaRadius: 0,
      killNovaDamage: 0,
      explosionRadius: 0,
      explosionDamage: 0,
      siphonHeal: 0,
      downed: false,
      reviveProgress: 0,
      reviveNeed: 7,
      reviveAllyRange: 180,
    };
    applyCharacterPresetToPlayer(state.character);
    state.enemies = [];
    state.bullets = [];
    state.orbs = [];
    state.particles = [];
    state.enemySpawnTimer = 0.4;
    state.enemySpawnInterval = 1.1;
    state.wave = 1;
    state.waveDuration = 22;
    state.waveRemaining = 22;
    state.waveMaxEnemies = 8;
    state.betweenWaves = false;
    state.waveClearElapsed = 0;
    state.nextWaveDelay = 2;
    state.coins = 28;
    state.shop.open = false;
    state.shop.rerollCost = 10;
    state.shop.offers = [];
    state.shop.renderedFor = null;
    state.shop.selectedIndex = 0;
    state.shop.focusArea = "offers";
    state.shop.actionIndex = 0;
    state.shop.localReady = false;
    state.shop.readyCount = 0;
    state.shop.readyRequired = 1;
    if (state.waveOverlayTimerId) {
      window.clearTimeout(state.waveOverlayTimerId);
      state.waveOverlayTimerId = null;
    }
    state.fireTimer = 0.15;
    state.meleeTimer = 0.35;
    state.hitCooldown = 0;
    state.elapsed = 0;
    state.kills = 0;
    state.level = 1;
    state.xp = 0;
    state.xpNeed = 20;
    state.lastTs = 0;
    state.anim.frameIndex = 0;
    state.anim.timer = 0;
    state.anim.attacking = false;
    state.camera.x = clamp(state.player.x - VIEW_W / 2, 0, Math.max(0, WORLD_W - VIEW_W));
    state.camera.y = clamp(state.player.y - VIEW_H / 2, 0, Math.max(0, WORLD_H - VIEW_H));
    state.augment.offered = [];
    state.augment.picked = [];
    state.augment.renderedFor = null;
    state.augment.selectedIndex = 0;
    state.room.moveSyncTimer = 0;
    state.room.snapshotSyncTimer = 0;
    state.room.teammates.clear();
    state.room.readyVotes.clear();
    hideShopPanel();

    clearDomEntities();
    setOverlay("");
    beginWave(1);
    render();

    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.rafId = window.requestAnimationFrame(loop);
  }

  function enterStandby() {
      const spawn = centerSpawnPoint();
    if (state.running || state.coins > 0) {
      stashRunCoins("leave");
    }
    state.running = false;
    state.gameOver = true;
    state.pausedForAugment = false;
    resetWeaponSlots();
    state.keys.clear();
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    state.player.x = spawn.x;
    state.player.y = spawn.y;
    state.player.hp = 100;
    applyCharacterPresetToPlayer(state.character);
    state.level = 1;
    state.xp = 0;
    state.xpNeed = 20;
    state.elapsed = 0;
    state.kills = 0;
    state.anim.frameIndex = 0;
    state.anim.timer = 0;
    state.anim.attacking = false;
    state.camera.x = clamp(state.player.x - VIEW_W / 2, 0, Math.max(0, WORLD_W - VIEW_W));
    state.camera.y = clamp(state.player.y - VIEW_H / 2, 0, Math.max(0, WORLD_H - VIEW_H));
    state.augment.offered = [];
    state.augment.picked = [];
    state.augment.renderedFor = null;
    state.augment.selectedIndex = 0;
    state.room.moveSyncTimer = 0;
    state.room.snapshotSyncTimer = 0;
    state.room.teammates.clear();
    state.enemies = [];
    state.bullets = [];
    state.orbs = [];
    state.particles = [];
    state.wave = 1;
    state.waveDuration = 22;
    state.waveRemaining = 22;
    state.waveMaxEnemies = 8;
    state.betweenWaves = false;
    state.waveClearElapsed = 0;
    state.nextWaveDelay = 2;
    state.meleeTimer = 0;
    state.coins = 0;
    state.shop.open = false;
    state.shop.rerollCost = 10;
    state.shop.offers = [];
    state.shop.renderedFor = null;
    state.shop.selectedIndex = 0;
    state.shop.focusArea = "offers";
    state.shop.actionIndex = 0;
    state.shop.localReady = false;
    state.shop.readyCount = 0;
    state.shop.readyRequired = 1;
    if (state.waveOverlayTimerId) {
      window.clearTimeout(state.waveOverlayTimerId);
      state.waveOverlayTimerId = null;
    }

    clearDomEntities();
    renderAugmentPanel();
    hideShopPanel();
    setOverlay("GAME STARTで開始");
    if (state.room.enabled) {
      messageEl.textContent = `協力サバイバー: ${effectivePlayerCount()} / ${state.room.maxPlayers}人`;
    } else {
      messageEl.textContent = "敵の波をしのごう";
    }
    render();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  if (characterSelectEl) {
    characterSelectEl.value = state.characterId;
    characterSelectEl.addEventListener("change", () => {
      syncCharacterFromSelection();
      messageEl.textContent = `キャラ変更: ${state.character.label} / ${state.passive.desc}`;
    });
  }

  startBtn?.addEventListener("click", () => startGame());
  gachaBtn?.addEventListener("click", () => rollBankGacha());
  gacha10Btn?.addEventListener("click", () => rollBankGacha(10));
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });
  shopRerollBtn?.addEventListener("click", () => rerollShop());
  shopNextBtn?.addEventListener("click", () => closeShopAndStartNextWave());

  enterStandby();
  syncCharacterFromSelection();
  void pullCloudProfile();

  return {
    startNewGame: () => startGame(),
    enterStandby,
    stop: () => {
      void pushCloudProfile();
      state.running = false;
      if (state.rafId) {
        window.cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
      if (state.waveOverlayTimerId) {
        window.clearTimeout(state.waveOverlayTimerId);
        state.waveOverlayTimerId = null;
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
    configureRoomMode: ({ roomRole = "host", roomPlayerCount = 1, roomMaxPlayers = 8 } = {}) => {
      state.room.enabled = true;
      state.room.role = roomRole === "guest" ? "guest" : "host";
      state.room.maxPlayers = Math.max(2, Math.round(roomMaxPlayers || 8));
      state.room.playerCount = clamp(Math.round(roomPlayerCount || 1), 1, state.room.maxPlayers);
      state.room.locked = false;
      state.room.lockMessage = "";
      state.room.moveSyncTimer = 0;
      state.room.snapshotSyncTimer = 0;
      state.room.teammates.clear();
      state.room.readyVotes.clear();
      state.shop.localReady = false;
      state.shop.readyCount = 0;
      state.shop.readyRequired = shopReadyRequired();
      if (startBtn) startBtn.disabled = false;
      enterStandby();
      setOverlay("ROOM READY");
      messageEl.textContent = `協力サバイバー: ${effectivePlayerCount()} / ${state.room.maxPlayers}人`;
      render();
    },
    configureStandardMode: () => {
      state.room.enabled = false;
      state.room.role = "solo";
      state.room.playerCount = 1;
      state.room.maxPlayers = 8;
      state.room.locked = false;
      state.room.lockMessage = "";
      state.room.moveSyncTimer = 0;
      state.room.snapshotSyncTimer = 0;
      state.room.teammates.clear();
      state.room.readyVotes.clear();
      state.shop.localReady = false;
      state.shop.readyCount = 0;
      state.shop.readyRequired = 1;
      if (startBtn) startBtn.disabled = false;
      setOverlay("GAME STARTで開始");
    },
    setRoomLock: ({ locked, message } = {}) => {
      state.room.locked = Boolean(locked);
      state.room.lockMessage = message || "";
      if (startBtn) {
        startBtn.disabled = state.room.enabled && state.room.locked;
      }

      if (state.room.locked) {
        setOverlay("WAITING");
        messageEl.textContent = state.room.lockMessage || "ホストの開始を待っています...";
      } else if (!state.running) {
        setOverlay("GAME STARTで開始");
        if (state.room.enabled) {
          messageEl.textContent = `協力サバイバー: ${effectivePlayerCount()} / ${state.room.maxPlayers}人`;
        }
      }
      render();
    },
    setRoomParticipants: ({ count, max } = {}) => {
      if (typeof max === "number" && Number.isFinite(max)) {
        state.room.maxPlayers = Math.max(2, Math.round(max));
      }
      if (typeof count === "number" && Number.isFinite(count)) {
        state.room.playerCount = clamp(Math.round(count), 1, state.room.maxPlayers);
      }

      if (state.running) {
        state.waveMaxEnemies = maxEnemiesForWave(state.wave);
        state.enemySpawnInterval = spawnIntervalForWave(state.wave);
      }

      if (!state.running && state.room.enabled) {
        messageEl.textContent = `協力サバイバー: ${effectivePlayerCount()} / ${state.room.maxPlayers}人`;
      }

      if (state.shop.open && state.room.enabled) {
        updateLocalShopReadyState();
        if (state.room.role === "host") {
          broadcastShopReadyState();
          if (isAllPlayersShopReady()) {
            startNextWaveFromShop();
            return;
          }
        }
      }
      render();
    },
    applyRemoteMove: (move) => {
      if (!move || !move.kind || !move.remoteId) return;
      if (move.kind === "survivors-shop-ready") {
        if (!state.room.enabled || state.room.role !== "host") return;
        state.room.readyVotes.set(move.remoteId, Boolean(move.ready));
        if (state.shop.open) {
          broadcastShopReadyState();
          if (isAllPlayersShopReady()) {
            startNextWaveFromShop();
            return;
          }
          renderShopPanel();
          render();
        }
        return;
      }

      if (move.kind === "survivors-shop-state") {
        if (!state.room.enabled || state.room.role !== "guest") return;
        state.shop.readyCount = Math.max(0, Math.floor(Number(move.readyCount) || 0));
        state.shop.readyRequired = Math.max(1, Math.floor(Number(move.readyRequired) || shopReadyRequired()));
        if (state.shop.open) {
          renderShopPanel();
          render();
        }
        return;
      }

      if (move.kind === "survivors-sync") {
        if (state.room.enabled && state.room.role === "guest") {
          applyRoomSnapshot(move.snapshot);
        }
        return;
      }
      if (move.kind !== "survivors-pos") return;
      state.room.teammates.set(move.remoteId, {
        x: Number.isFinite(move.x) ? move.x : state.player.x,
        y: Number.isFinite(move.y) ? move.y : state.player.y,
        downed: Boolean(move.downed),
        frameSrc: typeof move.frameSrc === "string" ? move.frameSrc : "",
        characterId: typeof move.characterId === "string" ? move.characterId : "",
        attacking: Boolean(move.attacking),
        movingUp: Boolean(move.movingUp),
        movingDown: Boolean(move.movingDown),
        movingLeft: Boolean(move.movingLeft),
        movingRight: Boolean(move.movingRight),
        seenAt: performance.now(),
      });
      render();
    },
    getSnapshot: () => ({
      kind: "survivors-sync",
      snapshot: buildRoomSnapshot(),
      x: state.player.x,
      y: state.player.y,
      downed: state.player.downed,
      frameSrc: currentPlayerFrame(state),
      characterId: state.characterId,
      attacking: Boolean(state.anim.attacking),
      movingUp: Boolean(movementInput(state).up),
      movingDown: Boolean(movementInput(state).down),
      movingLeft: Boolean(movementInput(state).left),
      movingRight: Boolean(movementInput(state).right),
    }),
    applySnapshot: (payload) => {
      if (!state.room.enabled || state.room.role !== "guest") return;
      if (payload?.kind === "survivors-sync" && payload?.snapshot) {
        applyRoomSnapshot(payload.snapshot);
      }
    },
  };
}
