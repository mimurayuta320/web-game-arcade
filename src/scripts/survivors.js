import { readStoredAuth, scopedStorageKey } from "./userScopedStorage.js";

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
const CLOUD_API_PRIMARY_BASE = window.location.origin;
const CLOUD_API_HOST_FALLBACK_BASE = `${window.location.protocol}//${window.location.hostname || "localhost"}:8787`;
const CLOUD_API_LOCALHOST_FALLBACK_BASE = "http://localhost:8787";
const BANK_GACHA_COST = 30;
const BANK_GACHA_10_COST = 270;
const SHOP_OFFER_COUNT = 5;

const PLAYER_FRAMES = [
  new URL("../motionPng/hammer1.png", import.meta.url).href,
  new URL("../motionPng/hammer2.png", import.meta.url).href,
  new URL("../motionPng/hammer3.png", import.meta.url).href,
];

const FAIRY_IDLE_FRAME = new URL("../motionPng/白菜前面.png", import.meta.url).href;
const FAIRY_ATTACK_FRAME = new URL("../motionPng/白菜攻撃用.png", import.meta.url).href;
const FAIRY_BACK_FRAME = new URL("../motionPng/白菜背面.png", import.meta.url).href;
const HANDGUN_STOP_FRAME = new URL("../weponPng/ハンドガン/stopMotion.png", import.meta.url).href;
const HANDGUN_ATTACK_FRAME = new URL("../weponPng/ハンドガン/attackMotion.png", import.meta.url).href;
const ATTACK_BULLET_FRAME = FAIRY_ATTACK_FRAME;
const INVINCIBLE_AFTER_HIT_SEC = 0.7;
const DEFAULT_BLAST_MP_COST = 15;
const FAIRY_HOLD_SKILL_FIRE_INTERVAL = 0.12;
const FAIRY_HOLD_SKILL_MP_DRAIN_PER_SEC = 14;
const FAIRY_SKILL_MP_REDUCTION_BY_RARITY = {
  common: 0,
  rare: 0.08,
  epic: 0.16,
  legendary: 0.24,
};
const FAIRY_SKILL_MP_REDUCTION_PER_CABBAGE = 0.04;
const FAIRY_SKILL_MP_REDUCTION_MAX = 0.7;
const FAIRY_ORBIT_BASE_COUNT = 3;
const FAIRY_ORBIT_MAX_COUNT = 24;
const ROOM_REMOTE_POSITION_SMOOTHING = 12;
const ROOM_REMOTE_SNAP_DISTANCE = 220;

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
const WEAPON_DEFS = {
  auto_blaster: {
    id: "auto_blaster",
    title: "Auto Blaster",
    type: "ranged",
  },
  shock_knuckle: {
    id: "shock_knuckle",
    title: "Shock Knuckle",
    type: "magic",
  },
  arc_wand: {
    id: "arc_wand",
    title: "Arc Wand",
    type: "magic",
  },
};

const WEAPON_IMAGE_BY_ID = {
  auto_blaster: HANDGUN_STOP_FRAME,
  shock_knuckle: FAIRY_ATTACK_FRAME,
  arc_wand: FAIRY_BACK_FRAME,
};

const WEAPON_RARITY_ORDER = ["common", "rare", "epic", "legendary"];

const MAX_WEAPON_SLOTS = 6;

const CHARACTER_PRESETS = {
  default: {
    id: "default",
    label: "BALANCED",
    weaponSlotMax: 6,
    starterWeapons: ["shock_knuckle"],
    baseStats: {
      damage: 10,
      rangedMul: 1,
      meleeDamage: 16,
      meleeRadius: 88,
      meleeRate: 0.82,
      mpMax: 100,
      mpRegen: 1,
      hpRegen: 0.25,
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
    starterWeapons: ["shock_knuckle"],
    baseStats: {
      damage: 7,
      rangedMul: 1.34,
      meleeDamage: 5,
      meleeRadius: 54,
      meleeRate: 1.24,
      mpMax: 120,
      mpRegen: 1,
      hpRegen: 0.15,
      explosionRadius: 0,
      explosionDamage: 0,
    },
    passive: {
      label: "Arc Wings",
      desc: "遠距離特化。単発威力は低めだが機動力と精度が高い",
      critChance: 0.16,
      critMul: 1.45,
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

const AVAILABLE_CHARACTER_IDS = ["default", "fairy"];

function selectableCharacterIds() {
  const ids = AVAILABLE_CHARACTER_IDS.filter((id) => Boolean(CHARACTER_PRESETS[id]));
  return ids.length > 0 ? ids : ["default"];
}

function resolveCharacterId(raw) {
  const ids = selectableCharacterIds();
  const candidate = String(raw || "").trim();
  if (ids.includes(candidate)) return candidate;
  return ids[0];
}

function normalizeEquippedWeapons(weaponIds, slotsMax = 1) {
  const knownIds = new Set(Object.keys(WEAPON_DEFS));
  const normalized = Array.isArray(weaponIds)
    ? weaponIds.filter((id) => typeof id === "string" && knownIds.has(id))
    : [];
  const fallback = ["shock_knuckle"];
  return (normalized.length > 0 ? normalized : fallback).slice(0, Math.max(1, Math.floor(slotsMax || 1)));
}

function normalizeWeaponRaritySlots(state) {
  if (!state?.weapons) return;
  const equipped = Array.isArray(state.weapons.equipped) ? state.weapons.equipped : [];
  const slots = Array.isArray(state.weapons.rarityBySlot) ? state.weapons.rarityBySlot.slice() : [];
  while (slots.length < equipped.length) {
    const weaponId = equipped[slots.length];
    const seeded = state.weapons.rarityById?.[weaponId] || "common";
    slots.push(WEAPON_RARITY_ORDER.includes(seeded) ? seeded : "common");
  }
  while (slots.length > equipped.length) {
    slots.pop();
  }

  state.weapons.rarityBySlot = slots.map((rarity) => (WEAPON_RARITY_ORDER.includes(rarity) ? rarity : "common"));

  const rarityById = {};
  equipped.forEach((weaponId, idx) => {
    const rarity = state.weapons.rarityBySlot[idx] || "common";
    const current = rarityById[weaponId] || "common";
    if (weaponRarityRank(rarity) >= weaponRarityRank(current)) {
      rarityById[weaponId] = rarity;
    }
  });
  state.weapons.rarityById = rarityById;
}

function getWeaponSlotRarity(state, slotIndex) {
  normalizeWeaponRaritySlots(state);
  return state.weapons.rarityBySlot?.[slotIndex] || "common";
}

function setWeaponSlotRarity(state, slotIndex, rarity) {
  normalizeWeaponRaritySlots(state);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.weapons.rarityBySlot.length) return;
  state.weapons.rarityBySlot[slotIndex] = WEAPON_RARITY_ORDER.includes(rarity) ? rarity : "common";
  normalizeWeaponRaritySlots(state);
}

function removeWeaponSlot(state, slotIndex) {
  if (!Array.isArray(state?.weapons?.equipped)) return false;
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.weapons.equipped.length) return false;
  state.weapons.equipped.splice(slotIndex, 1);
  normalizeWeaponRaritySlots(state);
  return true;
}

function ensureWeaponEquippedState(state, weaponId) {
  if (!state || !state.weapons || !WEAPON_DEFS[weaponId]) return false;

  const currentSlots = Math.max(1, Math.floor(state.weapons.slotsMax || 1));
  state.weapons.slotsMax = Math.min(MAX_WEAPON_SLOTS, currentSlots);
  state.weapons.equipped = normalizeEquippedWeapons(state.weapons.equipped, state.weapons.slotsMax);

  if (state.weapons.equipped.length >= state.weapons.slotsMax) {
    state.weapons.slotsMax = Math.min(MAX_WEAPON_SLOTS, state.weapons.slotsMax + 1);
  }
  if (state.weapons.equipped.length >= state.weapons.slotsMax) return false;

  state.weapons.equipped.push(weaponId);
  state.weapons.equipped = normalizeEquippedWeapons(state.weapons.equipped, state.weapons.slotsMax);
  normalizeWeaponRaritySlots(state);
  return true;
}

function weaponRarityRank(rarity) {
  const idx = WEAPON_RARITY_ORDER.indexOf(rarity);
  return idx >= 0 ? idx : 0;
}

function getWeaponRarityLabel(rarity) {
  return String((SKIN_RARITY[rarity] ?? SKIN_RARITY.common).label || "COMMON");
}

function ensureWeaponRarityState(state) {
  normalizeWeaponRaritySlots(state);
}

function hasMatchingWeaponRarity(state, weaponId, rarityOverride = null) {
  ensureWeaponRarityState(state);
  const equipped = Array.isArray(state.weapons?.equipped) ? state.weapons.equipped : [];
  const rarityBySlot = Array.isArray(state.weapons?.rarityBySlot) ? state.weapons.rarityBySlot : [];
  const rarity = rarityOverride || state.weapons.rarityById?.[weaponId] || "common";
  const matchingCount = equipped.filter((id, idx) => id === weaponId && (rarityBySlot[idx] || "common") === rarity).length;
  return matchingCount >= 2;
}

function applyWeaponFusionBonus(state, weaponId, rarity) {
  const rank = weaponRarityRank(rarity);
  if (weaponId === "auto_blaster") {
    state.player.damage += 1;
    state.player.rangedMul = Math.min(3, state.player.rangedMul + 0.06 + rank * 0.01);
    return;
  }
  if (weaponId === "shock_knuckle") {
    state.player.meleeDamage += 4 + rank;
    state.player.meleeRadius += 6 + rank * 2;
    return;
  }
  if (weaponId === "arc_wand") {
    state.player.magicDamage += 4 + rank;
    state.player.magicRadius += 6 + rank * 2;
    state.player.magicRate = Math.max(0.22, state.player.magicRate * (0.96 - rank * 0.01));
  }
}

function fuseWeaponRarity(state, weaponId, options = {}) {
  const { allowCommonUpgrade = true, requireMatchingRarity = false } = options;
  ensureWeaponRarityState(state);
  const before = state.weapons.rarityById[weaponId] || "common";
  if (!allowCommonUpgrade && before === "common") {
    return { upgraded: false, before, after: before };
  }
  if (requireMatchingRarity && !hasMatchingWeaponRarity(state, weaponId)) {
    return { upgraded: false, before, after: before };
  }
  const beforeRank = weaponRarityRank(before);
  if (beforeRank >= WEAPON_RARITY_ORDER.length - 1) {
    return { upgraded: false, before, after: before };
  }

  const after = WEAPON_RARITY_ORDER[beforeRank + 1];
  state.weapons.rarityById[weaponId] = after;
  applyWeaponFusionBonus(state, weaponId, after);
  normalizeWeaponRaritySlots(state);
  return { upgraded: true, before, after };
}

function fuseWeaponRarityAtSlot(state, slotIndex, options = {}) {
  const { allowCommonUpgrade = true, requireMatchingRarity = false } = options;
  ensureWeaponRarityState(state);
  const equipped = Array.isArray(state.weapons?.equipped) ? state.weapons.equipped : [];
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= equipped.length) {
    return { upgraded: false, before: "common", after: "common", weaponId: "" };
  }
  const weaponId = equipped[slotIndex];
  const before = getWeaponSlotRarity(state, slotIndex);
  if (!allowCommonUpgrade && before === "common") {
    return { upgraded: false, before, after: before, weaponId };
  }
  if (requireMatchingRarity && !hasMatchingWeaponRarity(state, weaponId, before)) {
    return { upgraded: false, before, after: before, weaponId };
  }
  const beforeRank = weaponRarityRank(before);
  if (beforeRank >= WEAPON_RARITY_ORDER.length - 1) {
    return { upgraded: false, before, after: before, weaponId };
  }
  const after = WEAPON_RARITY_ORDER[beforeRank + 1];
  setWeaponSlotRarity(state, slotIndex, after);
  applyWeaponFusionBonus(state, weaponId, after);
  return { upgraded: true, before, after, weaponId };
}

function applyWeaponRarityFloor(state, weaponId, targetRarity) {
  ensureWeaponRarityState(state);
  const before = state.weapons.rarityById?.[weaponId] || "common";
  const beforeRank = weaponRarityRank(before);
  const targetRank = weaponRarityRank(targetRarity);
  if (targetRank <= beforeRank) {
    return { upgraded: false, before, after: before };
  }
  for (let rank = beforeRank + 1; rank <= targetRank; rank += 1) {
    const nextRarity = WEAPON_RARITY_ORDER[rank] || before;
    state.weapons.rarityById[weaponId] = nextRarity;
    applyWeaponFusionBonus(state, weaponId, nextRarity);
  }
  return { upgraded: true, before, after: state.weapons.rarityById[weaponId] || before };
}

function rollWeaponShopRarity(state) {
  const wave = Math.max(1, Math.floor(Number(state?.wave) || 1));
  const luck = Math.max(0, Number(state?.player?.luck) || 0);
  const legendaryChance = clamp(0.004 + Math.max(0, wave - 8) * 0.004 + luck * 0.003, 0, 0.18);
  const epicChance = clamp(0.03 + Math.max(0, wave - 4) * 0.011 + luck * 0.008, 0, 0.38);
  const rareChance = clamp(0.12 + wave * 0.018 + luck * 0.015, 0, 0.72);
  const r = Math.random();
  if (r < legendaryChance) return "legendary";
  if (r < legendaryChance + epicChance) return "epic";
  if (r < legendaryChance + epicChance + rareChance) return "rare";
  return "common";
}

const SHOP_WEAPON_ITEM_TO_WEAPON_ID = {
  shop_weapon_auto: "auto_blaster",
  shop_weapon_knuckle: "shock_knuckle",
  shop_weapon_wand: "arc_wand",
};

function applyWeaponShopOffer(state, weaponId, offeredRarity, fallback) {
  const targetRarity = WEAPON_RARITY_ORDER.includes(offeredRarity) ? offeredRarity : "common";
  const alreadyEquipped = hasWeaponEquipped(state, weaponId);
  const added = ensureWeaponEquippedState(state, weaponId);
  if (added) {
    if (!alreadyEquipped) {
      const slotIndex = state.weapons.equipped.lastIndexOf(weaponId);
      setWeaponSlotRarity(state, slotIndex, targetRarity);
    }
    return;
  }
  if (typeof fallback === "function") {
    fallback();
  }
}

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
    id: "mana_cell",
    title: "Mana Cell",
    rarity: "common",
    desc: "最大MP +20、即時MP +20",
    apply: (state) => {
      state.player.maxMp += 20;
      state.player.mp = Math.min(state.player.maxMp, state.player.mp + 20);
    },
  },
  {
    id: "nano_repair",
    title: "Nano Repair",
    rarity: "common",
    desc: "毎秒HP自動回復 +0.25",
    apply: (state) => {
      state.player.hpRegen += 0.25;
    },
  },
  {
    id: "mana_reactor",
    title: "Mana Reactor",
    rarity: "rare",
    desc: "毎秒MP自動回復 +1.0",
    apply: (state) => {
      state.player.mpRegen += 1;
    },
  },
  {
    id: "xp_optimizer",
    title: "XP Optimizer",
    rarity: "rare",
    desc: "経験値獲得量 +15%",
    apply: (state) => {
      state.player.xpGainMul = Math.min(5, (state.player.xpGainMul || 1) * 1.15);
    },
  },
  {
    id: "merchant_contract",
    title: "Merchant Contract",
    rarity: "rare",
    desc: "アイテム価格 -8%",
    apply: (state) => {
      state.player.shopPriceMul = Math.max(0.35, (state.player.shopPriceMul || 1) * 0.92);
    },
  },
  {
    id: "blast_amplifier",
    title: "Blast Amplifier",
    rarity: "rare",
    desc: "爆発ダメージ +15%",
    apply: (state) => {
      state.player.explosionMul = Math.min(8, (state.player.explosionMul || 1) * 1.15);
    },
  },
  {
    id: "healing_mastery",
    title: "Healing Mastery",
    rarity: "rare",
    desc: "回復アイテム効果 +20%",
    apply: (state) => {
      state.player.healItemMul = Math.min(8, (state.player.healItemMul || 1) * 1.2);
    },
  },
  {
    id: "pierce_tuning",
    title: "Pierce Tuning",
    rarity: "rare",
    desc: "貫通 +1",
    apply: (state) => {
      state.player.pierce += 1;
    },
  },
  {
    id: "lucky_charm",
    title: "Lucky Charm",
    rarity: "rare",
    desc: "運 +1（高レア出現率アップ）",
    apply: (state) => {
      state.player.luck += 1;
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
    id: "rangefinder_core",
    title: "Rangefinder Core",
    rarity: "rare",
    desc: "射程 +90",
    apply: (state) => {
      state.player.rangeBonus += 90;
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
    id: "arcane_amplifier",
    title: "Arcane Amplifier",
    rarity: "rare",
    desc: "魔法ダメージ +10、範囲 +14、詠唱間隔 -10%",
    apply: (state) => {
      state.player.magicDamage += 10;
      state.player.magicRadius += 14;
      state.player.magicRate = Math.max(0.2, state.player.magicRate * 0.9);
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
    id: "shop_mp",
    title: "Mana Battery",
    desc: "最大MP +15 / MP +20",
    baseCost: 16,
    apply: (state) => {
      state.player.maxMp += 15;
      state.player.mp = Math.min(state.player.maxMp, state.player.mp + 20);
    },
  },
  {
    id: "shop_regen",
    title: "Regen Module",
    desc: "毎秒HP自動回復 +0.2",
    baseCost: 18,
    apply: (state) => {
      state.player.hpRegen += 0.2;
    },
  },
  {
    id: "shop_mp_regen",
    title: "Flux Core",
    desc: "毎秒MP自動回復 +0.8",
    baseCost: 18,
    apply: (state) => {
      state.player.mpRegen += 0.8;
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
    desc: "白菜魔法ダメージ +6 / 効果半径 +10",
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
  {
    id: "shop_weapon_auto",
    title: "Handgun",
    desc: "ハンドガンを装備。販売レアリティが現在より高ければ更新",
    baseCost: 23,
    apply: (state, offer) => {
      applyWeaponShopOffer(state, "auto_blaster", offer?.weaponRarity, () => {
        state.player.rangedMul = Math.min(3, state.player.rangedMul * 1.05);
      });
    },
  },
  {
    id: "shop_weapon_knuckle",
    title: "Shock Knuckle License",
    desc: "白菜装備(魔法)を強化。販売レアリティが現在より高ければ更新",
    baseCost: 23,
    apply: (state, offer) => {
      applyWeaponShopOffer(state, "shock_knuckle", offer?.weaponRarity, () => {
        state.player.meleeDamage += 5;
        state.player.meleeRadius += 6;
      });
    },
  },
  {
    id: "shop_weapon_wand",
    title: "Arc Wand",
    desc: "魔法杖を装備。販売レアリティが現在より高ければ更新",
    baseCost: 24,
    apply: (state, offer) => {
      applyWeaponShopOffer(state, "arc_wand", offer?.weaponRarity, () => {
        state.player.magicDamage += 4;
        state.player.magicRadius += 5;
      });
    },
  },
  {
    id: "shop_magic",
    title: "Rune Catalyst",
    desc: "魔法威力 +6 / 範囲 +10 / 詠唱間隔 -8%",
    baseCost: 22,
    apply: (state) => {
      state.player.magicDamage += 6;
      state.player.magicRadius += 10;
      state.player.magicRate = Math.max(0.22, state.player.magicRate * 0.92);
    },
  },
  {
    id: "shop_weapon_hybrid",
    title: "Hybrid Arsenal",
    desc: "遠近魔の武器を整備、攻撃間隔を少し短縮",
    baseCost: 29,
    apply: (state) => {
      state.weapons.slotsMax = Math.max(3, Math.min(MAX_WEAPON_SLOTS, Math.floor(state.weapons.slotsMax || 1)));
      ensureWeaponEquippedState(state, "auto_blaster");
      ensureWeaponEquippedState(state, "shock_knuckle");
      ensureWeaponEquippedState(state, "arc_wand");
      state.player.fireRate = Math.max(0.12, state.player.fireRate * 0.95);
      state.player.meleeRate = Math.max(0.2, state.player.meleeRate * 0.95);
      state.player.magicRate = Math.max(0.22, state.player.magicRate * 0.95);
    },
  },
  {
    id: "shop_pierce",
    title: "Penetration Lens",
    desc: "弾の貫通 +1 / 弾ダメージ +1",
    baseCost: 21,
    apply: (state) => {
      state.player.pierce += 1;
      state.player.damage += 1;
    },
  },
  {
    id: "shop_crit",
    title: "Precision Module",
    desc: "クリティカル率 +6% / クリ倍率 +0.15",
    baseCost: 24,
    apply: (state) => {
      state.passive.critChance = Math.min(0.8, (state.passive.critChance || 0) + 0.06);
      state.passive.critMul = Math.min(3.2, (state.passive.critMul || 1) + 0.15);
    },
  },
  {
    id: "shop_execute",
    title: "Execution Scope",
    desc: "処刑ライン +8% / 処刑倍率 +0.15",
    baseCost: 26,
    apply: (state) => {
      state.player.executeThreshold = Math.max(state.player.executeThreshold || 0, 0.18) + 0.08;
      state.player.executeThreshold = Math.min(0.65, state.player.executeThreshold);
      state.player.executeMultiplier = Math.min(3.2, (state.player.executeMultiplier || 1) + 0.15);
    },
  },
  {
    id: "shop_magburst",
    title: "Mag Burst Core",
    desc: "XP吸引 +40 / MP回復 +0.6",
    baseCost: 19,
    apply: (state) => {
      state.player.orbMagnetRange += 40;
      state.player.orbPullBase += 12;
      state.player.mpRegen += 0.6;
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

function augmentRollWeight(augment, level, luck = 0) {
  const rarity = AUGMENT_RARITY[augment.rarity] ?? AUGMENT_RARITY.common;
  const levelBias = clamp((level - 1) / 12, 0, 1);
  const luckBias = clamp((Number(luck) || 0) * 0.08, 0, 1.2);
  if (augment.rarity === "legendary") {
    return Math.max(1, rarity.weight * (1 + 1.5 * levelBias + 1.2 * luckBias));
  }
  if (augment.rarity === "epic") {
    return Math.max(1, rarity.weight * (1 + 0.9 * levelBias + 0.72 * luckBias));
  }
  if (augment.rarity === "rare") {
    return Math.max(1, rarity.weight * (1 + 0.35 * levelBias + 0.45 * luckBias));
  }
  return Math.max(1, rarity.weight * (1 - 0.4 * levelBias - 0.6 * luckBias));
}

function getAugmentRarityLabel(rarity) {
  return (AUGMENT_RARITY[rarity] ?? AUGMENT_RARITY.common).label;
}

function getSkinRarityLabel(rarity) {
  return (SKIN_RARITY[rarity] ?? SKIN_RARITY.common).label;
}

function bankStorageKey(auth) {
  return scopedStorageKey(SURVIVORS_BANK_KEY, auth?.userId || "");
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

function loadGachaPity(auth = null) {
  try {
    const scopedKey = scopedStorageKey(SURVIVORS_GACHA_PITY_KEY, auth?.userId || "");
    const raw = localStorage.getItem(scopedKey);
    if (!raw) {
      const legacy = localStorage.getItem(SURVIVORS_GACHA_PITY_KEY);
      if (legacy) {
        localStorage.setItem(scopedKey, legacy);
      }
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return clamp(Math.floor(n), 0, 9);
  } catch {
    return 0;
  }
}

function saveGachaPity(value, auth = null) {
  try {
    localStorage.setItem(scopedStorageKey(SURVIVORS_GACHA_PITY_KEY, auth?.userId || ""), String(clamp(Math.floor(value), 0, 9)));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function loadUnlockedSkins(auth = null) {
  try {
    const scopedKey = scopedStorageKey(SURVIVORS_SKIN_UNLOCKS_KEY, auth?.userId || "");
    let raw = localStorage.getItem(scopedKey);
    if (!raw) {
      const legacy = localStorage.getItem(SURVIVORS_SKIN_UNLOCKS_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(scopedKey, legacy);
      }
    }
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

function saveUnlockedSkins(ids, auth = null) {
  try {
    localStorage.setItem(scopedStorageKey(SURVIVORS_SKIN_UNLOCKS_KEY, auth?.userId || ""), JSON.stringify(ids));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function loadSelectedSkin(unlockedIds, auth = null) {
  try {
    const scopedKey = scopedStorageKey(SURVIVORS_SKIN_SELECTED_KEY, auth?.userId || "");
    let raw = localStorage.getItem(scopedKey);
    if (!raw) {
      const legacy = localStorage.getItem(SURVIVORS_SKIN_SELECTED_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(scopedKey, legacy);
      }
    }
    const selected = String(raw || "");
    if (unlockedIds.includes(selected)) return selected;
    return DEFAULT_SKIN_ID;
  } catch {
    return DEFAULT_SKIN_ID;
  }
}

function saveSelectedSkin(skinId, auth = null) {
  try {
    localStorage.setItem(scopedStorageKey(SURVIVORS_SKIN_SELECTED_KEY, auth?.userId || ""), skinId);
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

function loadCharacterId(auth = null) {
  const scopedKey = scopedStorageKey(SURVIVORS_CHARACTER_KEY, auth?.userId || "");
  let raw = "default";
  try {
    raw = String(localStorage.getItem(scopedKey) || "");
    if (!raw) {
      const legacy = String(localStorage.getItem(SURVIVORS_CHARACTER_KEY) || "");
      if (legacy) {
        raw = legacy;
        localStorage.setItem(scopedKey, legacy);
      }
    }
  } catch {
    raw = "default";
  }
  return resolveCharacterId(raw);
}

function saveCharacterId(characterId, auth = null) {
  try {
    localStorage.setItem(scopedStorageKey(SURVIVORS_CHARACTER_KEY, auth?.userId || ""), resolveCharacterId(characterId));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function readCloudAuth() {
  return readStoredAuth();
}

async function requestCloudProfile(path, payload) {
  const candidates = [CLOUD_API_PRIMARY_BASE];

  if (CLOUD_API_HOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE) {
    candidates.push(CLOUD_API_HOST_FALLBACK_BASE);
  }

  if (CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE && CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_HOST_FALLBACK_BASE) {
    candidates.push(CLOUD_API_LOCALHOST_FALLBACK_BASE);
  }

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

function hasWeaponEquipped(state, weaponId) {
  const equipped = Array.isArray(state?.weapons?.equipped) ? state.weapons.equipped : [];
  return equipped.includes(weaponId);
}

function weaponCountById(state, weaponId) {
  const equipped = Array.isArray(state?.weapons?.equipped) ? state.weapons.equipped : [];
  return equipped.reduce((count, id) => count + (id === weaponId ? 1 : 0), 0);
}

function playerFrames(state) {
  const sprite = state.character?.sprite;
  let vertical = Number.isFinite(state.anim.verticalInput) ? state.anim.verticalInput : verticalInput(state);
  if (state.character?.id === "fairy" && vertical === 0 && state.anim.lastVerticalInput < 0) {
    vertical = -1;
  }
  const moving = hasMoveInput(state);
  if (sprite && !state.anim.customSpriteFallback) {
    if (state.character?.id === "fairy") {
      if (vertical < 0 && hasFrames(sprite.upFrames)) {
        return sprite.upFrames;
      }
      if (vertical > 0 && hasFrames(sprite.downFrames)) {
        return sprite.downFrames;
      }
      if (hasFrames(sprite.idleFrames)) {
        return sprite.idleFrames;
      }
    }
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
  const initialUnlockedSkins = loadUnlockedSkins(initialCloudAuth);
  const initialSelectedSkin = loadSelectedSkin(initialUnlockedSkins, initialCloudAuth);
  const initialCharacterId = loadCharacterId(initialCloudAuth);
  const initialSpawn = centerSpawnPoint();

  const fieldEl = document.getElementById("survivorsField");
  const hpGaugeEl = document.getElementById("survivorsHpGauge");
  const hpFillEl = document.getElementById("survivorsHpFill");
  const hpTextEl = document.getElementById("survivorsHpText");
  const mpGaugeEl = document.getElementById("survivorsMpGauge");
  const mpFillEl = document.getElementById("survivorsMpFill");
  const mpTextEl = document.getElementById("survivorsMpText");
  const levelTextEl = document.getElementById("survivorsLevelText");
  const xpGaugeEl = document.getElementById("survivorsXpGauge");
  const xpFillEl = document.getElementById("survivorsXpFill");
  const xpTextEl = document.getElementById("survivorsXpText");
  const timeTextEl = document.getElementById("survivorsTimeText");
  const killTextEl = document.getElementById("survivorsKillText");
  const waveTextEl = document.getElementById("survivorsWaveText");
  const waveTimerEl = document.getElementById("survivorsWaveTimer");
  const waveTimerTextEl = document.getElementById("survivorsWaveTimerText");
  const bankMetricEl = document.getElementById("survivorsBankMetric");
  const coinTextEl = document.getElementById("survivorsCoinText");
  const bankTextEl = document.getElementById("survivorsBankText");
  const pityTextEl = document.getElementById("survivorsPityText");
  const damageTextEl = document.getElementById("survivorsDamageText");
  const rangedTextEl = document.getElementById("survivorsRangedText");
  const meleeTextEl = document.getElementById("survivorsMeleeText");
  const explosionTextEl = document.getElementById("survivorsExplosionText");
  const fireTextEl = document.getElementById("survivorsFireText");
  const speedTextEl = document.getElementById("survivorsSpeedText");
  const regenTextEl = document.getElementById("survivorsRegenText");
  const mpRegenTextEl = document.getElementById("survivorsMpRegenText");
  const luckTextEl = document.getElementById("survivorsLuckText");
  const armorTextEl = document.getElementById("survivorsArmorText");
  const xpGainTextEl = document.getElementById("survivorsXpGainText");
  const itemPriceTextEl = document.getElementById("survivorsItemPriceText");
  const explosionRateTextEl = document.getElementById("survivorsExplosionRateText");
  const healItemTextEl = document.getElementById("survivorsHealItemText");
  const pierceTextEl = document.getElementById("survivorsPierceText");
  const weaponSlotsTextEl = document.getElementById("survivorsWeaponSlotsText");
  const equippedWeaponsTextEl = document.getElementById("survivorsEquippedWeaponsText");
  const playersTextEl = document.getElementById("survivorsPlayersText");
  const posTextEl = document.getElementById("survivorsPosText");
  const topSummaryTextEl = document.getElementById("survivorsTopSummaryText");
  const characterSelectEl = document.getElementById("survivorsCharacterSelect");
  const passiveTextEl = document.getElementById("survivorsPassiveText");
  const messageEl = document.getElementById("survivorsMessage");
  const overlayEl = document.getElementById("survivorsOverlay");
  const augmentPanelEl = document.getElementById("survivorsAugmentPanel");
  const augmentLevelTextEl = document.getElementById("survivorsAugmentLevelText");
  const augmentOptionsEl = document.getElementById("survivorsAugmentOptions");
  const statsPanelEl = document.getElementById("survivorsStatsPanel");
  const statsToggleBtn = document.getElementById("survivorsStatsToggleBtn");
  const shopPanelEl = document.getElementById("survivorsShopPanel");
  const shopCoinTextEl = document.getElementById("survivorsShopCoinText");
  const shopWaitTextEl = document.getElementById("survivorsShopWaitText");
  const shopOptionsEl = document.getElementById("survivorsShopOptions");
  const shopRerollBtn = document.getElementById("survivorsShopRerollBtn");
  const shopNextBtn = document.getElementById("survivorsShopNextBtn");
  const weaponFusionPanelEl = document.getElementById("survivorsWeaponFusionPanel");
  const weaponFusionListEl = document.getElementById("survivorsWeaponFusionList");
  const gachaPanelEl = document.getElementById("survivorsGachaPanel");
  const gachaBankTextEl = document.getElementById("survivorsGachaBankText");
  const gachaPityTextEl = document.getElementById("survivorsGachaPityText");
  const gachaUnlockTextEl = document.getElementById("survivorsGachaUnlockText");
  const gachaCostTextEl = document.getElementById("survivorsGachaCostText");
  const gachaDraw1Btn = document.getElementById("survivorsGachaDraw1Btn");
  const gachaDraw10Btn = document.getElementById("survivorsGachaDraw10Btn");
  const gachaCloseBtn = document.getElementById("survivorsGachaCloseBtn");
  const gachaBtn = document.getElementById("survivorsGachaBtn");
  const startBtn = document.getElementById("survivorsStartBtn");
  const pauseBtn = document.getElementById("survivorsPauseBtn");
  const remakeBtn = document.getElementById("survivorsRemakeBtn");
  const menuBtn = document.getElementById("survivorsMenuBtn");
  const enemySpriteCache = new WeakMap();
  const bulletSpriteCache = new WeakMap();
  const allySpriteCache = new WeakMap();
  const hudTextCache = new WeakMap();
  let orbitSpriteSeed = 0;
  const i18nLang = () => (document.documentElement.getAttribute("lang") || "ja").toLowerCase();
  const t = (ja, ko) => (i18nLang().startsWith("ko") ? ko : ja);

  function syncCharacterSelectOptions(selectedId = initialCharacterId) {
    if (!characterSelectEl) return;
    const ids = selectableCharacterIds();
    characterSelectEl.innerHTML = "";
    ids.forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id === "default"
        ? t("バランス", "밸런스")
        : id === "fairy"
          ? t("フェアリー", "페어리")
          : CHARACTER_PRESETS[id]?.label || id.toUpperCase();
      characterSelectEl.appendChild(option);
    });
    characterSelectEl.value = resolveCharacterId(selectedId);
  }

  syncCharacterSelectOptions(initialCharacterId);

  const state = {
    running: false,
    gameOver: true,
    player: {
      x: initialSpawn.x,
      y: initialSpawn.y,
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      speed: 240,
      radius: 14,
      fireRate: 0.6,
      projSpeed: 520,
      damage: 10,
      rangedMul: 1,
      meleeDamage: 14,
      meleeRadius: 72,
      meleeRate: 1.1,
      magicDamage: 12,
      magicRadius: 82,
      magicRate: 0.86,
      xpGainMul: 1,
      shopPriceMul: 1,
      explosionMul: 1,
      healItemMul: 1,
      rangeBonus: 0,
      mpRegen: 0,
      luck: 0,
      hpRegen: 0,
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
      invincibleTimer: 0,
      hpRegenTick: 0,
      mpRegenTick: 0,
    },
    pausedForAugment: false,
    manualPaused: false,
    statsPanelVisible: true,
    statsPanelMode: "main",
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
    magicTimer: 0,
    fairySkillHeld: false,
    fairySkillTimer: 0,
    healPickupTimer: 0,
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
      playerWeaponSprite: null,
      playerCabbageOrbitEl: null,
      playerCabbageOrbitCount: 0,
      playerCabbageShots: [],
      playerCabbageShotIndex: 0,
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
      horizontalInput: 0,
      lastHorizontalInput: -1,
      customSpriteFallback: false,
    },
    augment: {
      offered: [],
      picked: [],
      renderedFor: null,
      selectedIndex: 0,
      pendingRewards: 0,
    },
    shop: {
      open: false,
      openedWave: 0,
      rerollCost: 10,
      offers: [],
      carryLockedOffers: [],
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
      pityCounter: loadGachaPity(initialCloudAuth),
      open: false,
    },
    skin: {
      unlocked: new Set(initialUnlockedSkins),
      selectedId: initialSelectedSkin,
    },
    characterId: initialCharacterId,
    character: CHARACTER_PRESETS[initialCharacterId] ?? CHARACTER_PRESETS.default,
    weapons: {
      slotsMax: (CHARACTER_PRESETS[initialCharacterId] ?? CHARACTER_PRESETS.default).weaponSlotMax,
      equipped: [...(CHARACTER_PRESETS[initialCharacterId] ?? CHARACTER_PRESETS.default).starterWeapons],
      shockKnuckleTimers: [],
      rarityBySlot: [],
      rarityById: {},
    },
    selectedFusionWeaponIndex: null,
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
      characterId: state.characterId,
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
    state.player.magicDamage = Number.isFinite(stats.magicDamage) ? stats.magicDamage : 12;
    state.player.magicRadius = Number.isFinite(stats.magicRadius) ? stats.magicRadius : 82;
    state.player.magicRate = Number.isFinite(stats.magicRate) ? stats.magicRate : 0.86;
    state.player.xpGainMul = Number.isFinite(stats.xpGainMul) ? Math.max(0.1, stats.xpGainMul) : 1;
    state.player.shopPriceMul = Number.isFinite(stats.shopPriceMul) ? Math.max(0.35, stats.shopPriceMul) : 1;
    state.player.explosionMul = Number.isFinite(stats.explosionMul) ? Math.max(0.1, stats.explosionMul) : 1;
    state.player.healItemMul = Number.isFinite(stats.healItemMul) ? Math.max(0.1, stats.healItemMul) : 1;
    state.player.rangeBonus = Number.isFinite(stats.rangeBonus) ? Math.max(0, stats.rangeBonus) : 0;
    state.player.luck = Number.isFinite(stats.luck) ? Math.max(0, stats.luck) : 0;
    state.player.maxMp = Number.isFinite(stats.mpMax) ? Math.max(0, stats.mpMax) : 100;
    state.player.mpRegen = Number.isFinite(stats.mpRegen) ? Math.max(0, stats.mpRegen) : 0;
    state.player.mp = clamp(state.player.mp, 0, state.player.maxMp);
    state.player.hpRegen = Number.isFinite(stats.hpRegen) ? Math.max(0, stats.hpRegen) : 0;
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
    const nextId = resolveCharacterId(characterId);
    state.characterId = nextId;
    state.character = CHARACTER_PRESETS[nextId];
    preloadCharacterFrames(state.character);
    state.anim.attacking = false;
    state.anim.movingUp = false;
    state.anim.verticalInput = 0;
    state.anim.lastVerticalInput = 0;
    state.anim.horizontalInput = 0;
    state.anim.lastHorizontalInput = -1;
    state.anim.frameIndex = 0;
    state.anim.timer = 0;
    state.anim.customSpriteFallback = false;
    saveCharacterId(nextId, state.cloud.auth);
    if (characterSelectEl && characterSelectEl.value !== nextId) {
      syncCharacterSelectOptions(nextId);
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
    state.weapons.equipped = normalizeEquippedWeapons(state.character.starterWeapons, state.weapons.slotsMax);
    state.weapons.shockKnuckleTimers = [];
    state.weapons.rarityBySlot = state.weapons.equipped.map(() => "common");
    state.selectedFusionWeaponIndex = null;
    normalizeWeaponRaritySlots(state);
  }

  function resetPlayerBaseStats(spawn) {
    state.player = {
      ...state.player,
      x: spawn.x,
      y: spawn.y,
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      speed: 240,
      radius: 14,
      fireRate: 0.6,
      projSpeed: 520,
      damage: 10,
      rangedMul: 1,
      meleeDamage: 14,
      meleeRadius: 72,
      meleeRate: 1.1,
      magicDamage: 12,
      magicRadius: 82,
      magicRate: 0.86,
      xpGainMul: 1,
      shopPriceMul: 1,
      explosionMul: 1,
      healItemMul: 1,
      rangeBonus: 0,
      mpRegen: 0,
      luck: 0,
      hpRegen: 0,
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
      invincibleTimer: 0,
      hpRegenTick: 0,
      mpRegenTick: 0,
    };
    applyCharacterPresetToPlayer(state.character);
    state.player.mp = state.player.maxMp;
  }

  function spendMp(cost) {
    const need = Math.max(0, Number(cost) || 0);
    if (need <= 0) return true;
    if (state.player.mp < need) return false;
    state.player.mp -= need;
    return true;
  }

  function hasWeaponType(type) {
    return state.weapons.equipped.some((weaponId) => WEAPON_DEFS[weaponId]?.type === type);
  }

  function weaponTypeCount(type) {
    return state.weapons.equipped.filter((weaponId) => WEAPON_DEFS[weaponId]?.type === type).length;
  }

  function weaponTypeSummaryText() {
    return t("武器を選択", "무기 선택");
  }

  function fairySkillMpReductionRate(cabbageCount) {
    ensureWeaponRarityState(state);
    const count = Math.max(1, Math.floor(cabbageCount || 1));
    const rarity = state.weapons.rarityById?.shock_knuckle || "common";
    const rarityReduction = FAIRY_SKILL_MP_REDUCTION_BY_RARITY[rarity] ?? 0;
    const countReduction = Math.max(0, count - 1) * FAIRY_SKILL_MP_REDUCTION_PER_CABBAGE;
    return clamp(rarityReduction + countReduction, 0, FAIRY_SKILL_MP_REDUCTION_MAX);
  }

  function equippedWeaponsDisplayText() {
    const equipped = Array.isArray(state.weapons?.equipped) ? state.weapons.equipped : [];
    if (equipped.length === 0) return "-";
    return equipped.map((weaponId) => WEAPON_DEFS[weaponId]?.title || weaponId).join(" / ");
  }

  function renderOwnedWeaponList() {
    if (!equippedWeaponsTextEl) return;
    const equipped = Array.isArray(state.weapons?.equipped) ? state.weapons.equipped : [];
    const selected = Number.isInteger(state.selectedFusionWeaponIndex) ? state.selectedFusionWeaponIndex : -1;
    const rarityKey = (state.weapons.rarityBySlot || []).join("|");
    const renderKey = `${equipped.join("|")}|r:${rarityKey}|sel:${selected}`;
    if (equippedWeaponsTextEl.dataset.renderKey === renderKey) return;

    equippedWeaponsTextEl.innerHTML = "";
    if (equipped.length === 0) {
      equippedWeaponsTextEl.textContent = "-";
      equippedWeaponsTextEl.dataset.renderKey = renderKey;
      return;
    }

    equipped.forEach((weaponId, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "survivors-owned-weapon-btn";
      if (index === selected) {
        btn.classList.add("is-selected");
      }
      btn.dataset.weaponId = weaponId;
      btn.dataset.slotIndex = String(index);
      btn.textContent = WEAPON_DEFS[weaponId]?.title || weaponId;
      equippedWeaponsTextEl.appendChild(btn);
    });

    equippedWeaponsTextEl.dataset.renderKey = renderKey;
  }

  function applyCloudProfilePayload(payload) {
    if (!payload || typeof payload !== "object") return;
    if (Number.isFinite(payload.bankCoins)) {
      state.bankCoins = Math.max(0, Math.floor(payload.bankCoins));
      saveBankCoins(state.bankCoins, state.cloud.auth);
    }
    if (Number.isFinite(payload.pityCounter)) {
      state.gacha.pityCounter = clamp(Math.floor(payload.pityCounter), 0, 9);
      saveGachaPity(state.gacha.pityCounter, state.cloud.auth);
    }

    const unlocked = Array.isArray(payload.unlockedSkins)
      ? payload.unlockedSkins.filter((id) => typeof id === "string" && SKINS.some((s) => s.id === id))
      : [...state.skin.unlocked];
    if (!unlocked.includes(DEFAULT_SKIN_ID)) unlocked.unshift(DEFAULT_SKIN_ID);
    state.skin.unlocked = new Set(unlocked);

    const selected = typeof payload.selectedSkin === "string" ? payload.selectedSkin : state.skin.selectedId;
    state.skin.selectedId = state.skin.unlocked.has(selected) ? selected : DEFAULT_SKIN_ID;

    if (typeof payload.characterId === "string") {
      setCharacterPreset(payload.characterId);
    }

    persistSkinState();

    if (typeof payload.playerName === "string") {
      const normalized = String(payload.playerName).trim().replace(/\s+/g, " ").slice(0, 18) || "Player";
      localStorage.setItem(PLAYER_NAME_KEY, normalized);
    }
  }

  function setCloudAuthScope(auth = null, cloudProfile = null) {
    const nextAuth = auth && typeof auth === "object" && auth.userId && auth.password
      ? { userId: String(auth.userId), password: String(auth.password) }
      : null;

    state.cloud.auth = nextAuth;
    state.cloud.dirty = false;

    if (state.cloud.debounceId) {
      window.clearTimeout(state.cloud.debounceId);
      state.cloud.debounceId = null;
    }

    state.bankCoins = loadBankCoins(state.cloud.auth);
    if (!state.cloud.auth) {
      state.bankCoins = 0;
      saveBankCoins(0, null);
    }
    state.gacha.pityCounter = loadGachaPity(state.cloud.auth);

    const unlocked = loadUnlockedSkins(state.cloud.auth);
    state.skin.unlocked = new Set(unlocked);
    state.skin.selectedId = loadSelectedSkin(unlocked, state.cloud.auth);

    const scopedCharacterId = loadCharacterId(state.cloud.auth);
    setCharacterPreset(scopedCharacterId);

    if (nextAuth && cloudProfile && typeof cloudProfile === "object") {
      applyCloudProfilePayload(cloudProfile);
    }

    render();
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
    saveUnlockedSkins(unlockedIds, state.cloud.auth);
    saveSelectedSkin(state.skin.selectedId, state.cloud.auth);
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
    state.player.hp = Math.max(24, Math.round(state.player.maxHp * 0.6));
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
    setOverlay(t("ダウン", "다운"));
    messageEl.textContent = "ダウン中: 味方が近くにいると復活ゲージ進行 / 次ウェーブで復活";
  }

  function triggerGameOver(reason = "defeat") {
    if (state.gameOver) return;
    state.running = false;
    state.gameOver = true;
    state.player.hp = Math.max(0, state.player.hp);
    setOverlay(t("ゲームオーバー", "게임 오버"));
    if (reason === "party-wipe") {
      messageEl.textContent = t("全滅しました", "전멸했습니다");
    }
    stashRunCoins("defeat");
    if (state.room.enabled && state.room.role === "host") {
      options.onRoomMove?.({
        kind: "survivors-sync",
        snapshot: buildRoomSnapshot(),
      });
    }
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
      running: Boolean(state.running),
      gameOver: Boolean(state.gameOver),
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
        kind: typeof o.kind === "string" ? o.kind : "xp",
      })),
    };
  }

  function applyRoomSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;

    const prevEnemies = new Map(state.enemies.map((e) => [e.id, e]));
    const prevOrbs = new Map(state.orbs.map((o) => [o.id, o]));
    const wasBetweenWaves = state.betweenWaves;

    if (Number.isFinite(snapshot.wave)) {
      state.wave = Math.max(1, Math.floor(snapshot.wave));
    }
    if (Number.isFinite(snapshot.waveRemaining)) {
      state.waveRemaining = Math.max(0, Number(snapshot.waveRemaining));
    }
    if (Number.isFinite(snapshot.elapsed)) {
      state.elapsed = Math.max(0, Number(snapshot.elapsed));
    }
    if (typeof snapshot.running === "boolean") {
      state.running = Boolean(snapshot.running);
    }
    if (typeof snapshot.gameOver === "boolean") {
      state.gameOver = Boolean(snapshot.gameOver);
      if (state.gameOver) {
        setOverlay(t("ゲームオーバー", "게임 오버"));
      }
    }
    state.betweenWaves = Boolean(snapshot.betweenWaves);

    if (
      !wasBetweenWaves
      && state.betweenWaves
      && state.room.enabled
      && state.room.role === "guest"
    ) {
      const reward = 12 + Math.round(state.wave * 3.2) + Math.round(state.waveRemaining);
      const carryBonus = Math.floor(state.coins * state.coinCarryRate);
      state.coins += reward + carryBonus;
    }

    const hostInShop = state.betweenWaves;
    if (hostInShop !== state.shop.open) {
      state.shop.open = hostInShop;
      state.shop.renderedFor = null;
      state.shop.localReady = false;
      state.shop.readyCount = 0;
      state.shop.readyRequired = shopReadyRequired();
      if (hostInShop) {
        state.keys.clear();
        if (state.room.enabled && state.room.role === "guest") {
          if ((state.augment.pendingRewards || 0) > 0) {
            openAugmentPanel();
          } else {
            openShopPanel();
          }
        } else {
          setOverlay(t("ショップ", "상점"));
          messageEl.textContent = "ホストのショップ選択を待機中...";
        }
      } else {
        state.shop.openedWave = 0;
        state.shop.offers = [];
        hideShopPanel();
        if (!state.pausedForAugment && !state.gameOver) {
          setOverlay("");
        }
      }
    }

    if (
      hostInShop
      && state.room.enabled
      && state.room.role === "guest"
      && (state.augment.pendingRewards || 0) <= 0
      && !state.pausedForAugment
      && state.shop.openedWave !== state.wave
    ) {
      openShopPanel();
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
          renderX: Number.isFinite(prevEnemies.get(e.id)?.renderX)
            ? prevEnemies.get(e.id).renderX
            : (Number.isFinite(prevEnemies.get(e.id)?.x) ? prevEnemies.get(e.id).x : (Number.isFinite(e.x) ? e.x : 0)),
          renderY: Number.isFinite(prevEnemies.get(e.id)?.renderY)
            ? prevEnemies.get(e.id).renderY
            : (Number.isFinite(prevEnemies.get(e.id)?.y) ? prevEnemies.get(e.id).y : (Number.isFinite(e.y) ? e.y : 0)),
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
          kind: typeof o.kind === "string" ? o.kind : "xp",
          renderX: Number.isFinite(prevOrbs.get(o.id)?.renderX)
            ? prevOrbs.get(o.id).renderX
            : (Number.isFinite(prevOrbs.get(o.id)?.x) ? prevOrbs.get(o.id).x : (Number.isFinite(o.x) ? o.x : 0)),
          renderY: Number.isFinite(prevOrbs.get(o.id)?.renderY)
            ? prevOrbs.get(o.id).renderY
            : (Number.isFinite(prevOrbs.get(o.id)?.y) ? prevOrbs.get(o.id).y : (Number.isFinite(o.y) ? o.y : 0)),
        }));
    }

    if (!state.running || state.shop.open || state.betweenWaves) {
      render();
    }
  }

  function smoothRemoteEntities(dt) {
    if (!state.room.enabled) return;

    const alpha = 1 - Math.exp(-ROOM_REMOTE_POSITION_SMOOTHING * clamp(dt, 0, 0.1));
    const snapDistSq = ROOM_REMOTE_SNAP_DISTANCE * ROOM_REMOTE_SNAP_DISTANCE;

    if (state.room.role === "guest") {
      state.enemies.forEach((enemy) => {
        if (!Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) return;
        if (!Number.isFinite(enemy.renderX) || !Number.isFinite(enemy.renderY)) {
          enemy.renderX = enemy.x;
          enemy.renderY = enemy.y;
          return;
        }
        const dx = enemy.x - enemy.renderX;
        const dy = enemy.y - enemy.renderY;
        if (dx * dx + dy * dy > snapDistSq) {
          enemy.renderX = enemy.x;
          enemy.renderY = enemy.y;
          return;
        }
        enemy.renderX += dx * alpha;
        enemy.renderY += dy * alpha;
      });

      state.orbs.forEach((orb) => {
        if (!Number.isFinite(orb.x) || !Number.isFinite(orb.y)) return;
        if (!Number.isFinite(orb.renderX) || !Number.isFinite(orb.renderY)) {
          orb.renderX = orb.x;
          orb.renderY = orb.y;
          return;
        }
        const dx = orb.x - orb.renderX;
        const dy = orb.y - orb.renderY;
        if (dx * dx + dy * dy > snapDistSq) {
          orb.renderX = orb.x;
          orb.renderY = orb.y;
          return;
        }
        orb.renderX += dx * alpha;
        orb.renderY += dy * alpha;
      });
    }

    state.room.teammates.forEach((mate) => {
      if (!Number.isFinite(mate.x) || !Number.isFinite(mate.y)) return;
      if (!Number.isFinite(mate.renderX) || !Number.isFinite(mate.renderY)) {
        mate.renderX = mate.x;
        mate.renderY = mate.y;
        return;
      }
      const dx = mate.x - mate.renderX;
      const dy = mate.y - mate.renderY;
      if (dx * dx + dy * dy > snapDistSq) {
        mate.renderX = mate.x;
        mate.renderY = mate.y;
        return;
      }
      mate.renderX += dx * alpha;
      mate.renderY += dy * alpha;
    });
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
    saveGachaPity(state.gacha.pityCounter, state.cloud.auth);
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
      messageEl.textContent = t("スキンガチャは現在この画面では使えません", "스킨 가챠는 현재 이 화면에서 사용할 수 없습니다");
      return;
    }

    const drawCount = Math.max(1, Math.floor(times));
    const cost = drawCount >= 10 ? BANK_GACHA_10_COST : BANK_GACHA_COST;
    if (!spendBankCoins(cost)) {
      messageEl.textContent = t(`BANK不足: ${cost}c必要`, `BANK 부족: ${cost}c 필요`);
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
    if (!state.cloud.auth) {
      state.coins = 0;
      state.bankCoins = 0;
      saveBankCoins(0, null);
      if (reason === "defeat") {
        messageEl.textContent = "敗北: ゲストのためBANKは保存されません (0c)";
      } else if (reason === "leave") {
        messageEl.textContent = "終了: ゲストのためBANKは保存されません (0c)";
      }
      return;
    }
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

  function triggerBlastCastEffect(radius) {
    if (fieldEl) {
      fieldEl.classList.remove("blast-cast");
      void fieldEl.offsetWidth;
      fieldEl.classList.add("blast-cast");
      window.setTimeout(() => fieldEl.classList.remove("blast-cast"), 280);
    }

    spawnPulseRing(state.player.x, state.player.y, radius * 1.6, "explosion");
    window.setTimeout(() => {
      spawnPulseRing(state.player.x, state.player.y, radius * 2.0, "explosion");
    }, 70);
    window.setTimeout(() => {
      spawnPulseRing(state.player.x, state.player.y, radius * 2.35, "explosion");
    }, 140);
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

  function hideGachaPanel() {
    if (!gachaPanelEl) return;
    gachaPanelEl.classList.add("hidden");
    state.gacha.open = false;
  }

  function renderGachaPanel() {
    if (!gachaPanelEl) return;
    if (!state.gacha.open) {
      gachaPanelEl.classList.add("hidden");
      return;
    }

    gachaPanelEl.classList.remove("hidden");
    if (gachaBankTextEl) {
      gachaBankTextEl.textContent = `BANK: ${Math.floor(state.bankCoins)}c`;
    }
    if (gachaPityTextEl) {
      gachaPityTextEl.textContent = `${t("天井", "천장")}: ${state.gacha.pityCounter} / 10`;
    }
    if (gachaUnlockTextEl) {
      gachaUnlockTextEl.textContent = `${t("解放", "해금")}: ${state.skin.unlocked.size} / ${SKINS.length}`;
    }
    if (gachaCostTextEl) {
      gachaCostTextEl.textContent = t(
        `コスト: 1回 ${BANK_GACHA_COST}c / 10回 ${BANK_GACHA_10_COST}c`,
        `비용: 1회 ${BANK_GACHA_COST}c / 10회 ${BANK_GACHA_10_COST}c`,
      );
    }
  }

  function openGachaPanel() {
    state.gacha.open = true;
    state.keys.clear();
    renderGachaPanel();
  }

  function isShopWaitingForHost() {
    return state.shop.open && state.room.enabled && state.room.role === "guest" && state.shop.offers.length === 0;
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

  function pickShopOffers(count = SHOP_OFFER_COUNT) {
    const pool = [...SHOP_ITEMS];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, Math.min(count, pool.length)).map((item) => {
      const waveScale = 1 + Math.floor((state.wave - 1) / 2) * 0.1;
      const offer = {
        ...item,
        cost: Math.max(8, Math.round(item.baseCost * waveScale)),
        locked: false,
      };
      const weaponId = SHOP_WEAPON_ITEM_TO_WEAPON_ID[item.id];
      if (weaponId) {
        const weaponRarity = rollWeaponShopRarity(state);
        const rarityRank = weaponRarityRank(weaponRarity);
        offer.weaponId = weaponId;
        offer.weaponRarity = weaponRarity;
        offer.cost = Math.max(offer.cost, Math.round(offer.cost * (1 + rarityRank * 0.45)));
      }
      return offer;
    });
  }

  function cloneShopOffer(offer, forceLocked = null) {
    if (!offer || typeof offer !== "object") return null;
    return {
      ...offer,
      locked: forceLocked == null ? Boolean(offer.locked) : Boolean(forceLocked),
    };
  }

  function composeShopOffersWithCarry() {
    const carried = Array.isArray(state.shop.carryLockedOffers)
      ? state.shop.carryLockedOffers
        .map((offer) => cloneShopOffer(offer, true))
        .filter(Boolean)
        .slice(0, SHOP_OFFER_COUNT)
      : [];
    const needed = Math.max(0, SHOP_OFFER_COUNT - carried.length);
    const fresh = needed > 0 ? pickShopOffers(needed) : [];
    return [...carried, ...fresh].slice(0, SHOP_OFFER_COUNT);
  }

  function shopOfferCost(offer) {
    const baseCost = Math.max(1, Math.floor(Number(offer?.cost) || 1));
    const mul = clamp(Number(state.player.shopPriceMul) || 1, 0.35, 2);
    return Math.max(1, Math.round(baseCost * mul));
  }

  function toggleShopOfferLock(index) {
    if (isShopWaitingForHost()) return;
    if (state.room.enabled && state.shop.localReady) return;
    const offer = state.shop.offers[index];
    if (!offer) return;
    offer.locked = !offer.locked;
    messageEl.textContent = offer.locked
      ? t(`ロック: ${offer.title}`, `잠금: ${offer.title}`)
      : t(`ロック解除: ${offer.title}`, `잠금 해제: ${offer.title}`);
    state.shop.renderedFor = null;
    renderShopPanel();
    render();
  }

  function renderShopPanel() {
    if (!shopPanelEl || !shopOptionsEl || !shopCoinTextEl) return;

    if (!state.shop.open) {
      hideShopPanel();
      return;
    }

    if (state.pausedForAugment) {
      hideShopPanel();
      return;
    }

    if ((state.augment.pendingRewards || 0) > 0 && !state.pausedForAugment) {
      openAugmentPanel();
      return;
    }

    if (state.room.enabled && state.room.role === "guest" && state.shop.offers.length === 0) {
      state.shop.offers = composeShopOffersWithCarry();
      state.shop.selectedIndex = 0;
      state.shop.focusArea = "offers";
      state.shop.actionIndex = 0;
      state.shop.renderedFor = null;
    }

    shopPanelEl.classList.remove("hidden");

    if (isShopWaitingForHost()) {
      shopPanelEl.classList.add("waiting");
      shopCoinTextEl.textContent = `${t("ウェーブ", "웨이브")} ${state.wave} ${t("ショップ", "상점")}`;
      updateLocalShopReadyState();
      const selectingAugment = state.pausedForAugment;
      if (shopWaitTextEl) {
        shopWaitTextEl.textContent = `他プレイヤー待機中... READY ${state.shop.readyCount}/${state.shop.readyRequired}`;
        shopWaitTextEl.classList.remove("hidden");
      }
      if (shopRerollBtn) shopRerollBtn.disabled = true;
      if (shopNextBtn) {
        shopNextBtn.disabled = false;
        shopNextBtn.textContent = state.shop.localReady
          ? t("準備解除", "준비 해제")
          : "READY";
      }
      const waitOffersKey = state.shop.offers.map((offer) => `${offer.id}:${shopOfferCost(offer)}`).join("|");
      const waitKey = `wait:${state.wave}:${state.shop.readyCount}:${state.shop.readyRequired}:${state.shop.localReady ? 1 : 0}:${waitOffersKey}`;
      if (state.shop.renderedFor !== waitKey) {
        shopOptionsEl.innerHTML = "";
        const weaponOfferToId = SHOP_WEAPON_ITEM_TO_WEAPON_ID;
        state.shop.offers.forEach((offer) => {
          const card = document.createElement("div");
          card.className = "survivors-shop-card";
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "survivors-shop-option";
          btn.disabled = true;
          const shownCost = shopOfferCost(offer);
          const weaponId = offer.weaponId || weaponOfferToId[offer.id];
          const weaponImgSrc = weaponId ? WEAPON_IMAGE_BY_ID[weaponId] : "";
          const weaponImage = weaponImgSrc
            ? `<img class="survivors-shop-weapon-photo" src="${weaponImgSrc}" alt="${WEAPON_DEFS[weaponId]?.title || "weapon"}" draggable="false">`
            : "";
          const saleRarityText = offer.weaponRarity ? ` / ${t("販売", "판매")}: ${getWeaponRarityLabel(offer.weaponRarity)}` : "";
          btn.innerHTML = `${weaponImage}<strong>${offer.title} - ${shownCost}c</strong><span>${offer.desc}${saleRarityText}</span>`;
          card.appendChild(btn);
          shopOptionsEl.appendChild(card);
        });
      }
      state.shop.renderedFor = waitKey;
      return;
    }

    shopPanelEl.classList.remove("waiting");
    updateLocalShopReadyState();
    const selectingAugment = state.pausedForAugment;
    shopWaitTextEl?.classList.add("hidden");
    const lockedCount = state.shop.offers.filter((offer) => offer.locked).length;
    shopCoinTextEl.textContent = `所持: RUN ${Math.floor(state.coins)}c / リロール ${state.shop.rerollCost}c / ${t("ロック", "잠금")} ${lockedCount}`;
    if (shopRerollBtn) shopRerollBtn.disabled = state.shop.localReady || !canAffordRun(state.shop.rerollCost);
    if (shopNextBtn) {
      shopNextBtn.disabled = false;
      shopNextBtn.textContent = state.room.enabled
        ? (state.shop.localReady ? t("準備解除", "준비 해제") : "READY")
        : t("次のウェーブ", "다음 웨이브");
    }
    if (shopWaitTextEl && state.room.enabled) {
      shopWaitTextEl.textContent = `READY ${state.shop.readyCount}/${state.shop.readyRequired}`;
      shopWaitTextEl.classList.remove("hidden");
    }

    const key = state.shop.offers.map((offer) => `${offer.id}:${shopOfferCost(offer)}:${offer.locked ? 1 : 0}`).join("|") + `|${Math.floor(state.coins)}`;
    const readyKey = `|r:${state.shop.readyCount}/${state.shop.readyRequired}|l:${state.shop.localReady ? 1 : 0}`;
    if (state.shop.renderedFor === `${key}${readyKey}`) return;

    shopOptionsEl.innerHTML = "";
    const weaponOfferToId = SHOP_WEAPON_ITEM_TO_WEAPON_ID;
    state.shop.offers.forEach((offer, index) => {
      const shownCost = shopOfferCost(offer);
      const canBuy = !state.shop.localReady && canAffordRun(shownCost);
      const card = document.createElement("div");
      card.className = "survivors-shop-card";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "survivors-shop-option";
      btn.disabled = !canBuy;
      const weaponId = offer.weaponId || weaponOfferToId[offer.id];
      const weaponImgSrc = weaponId ? WEAPON_IMAGE_BY_ID[weaponId] : "";
      const weaponImage = weaponImgSrc
        ? `<img class="survivors-shop-weapon-photo" src="${weaponImgSrc}" alt="${WEAPON_DEFS[weaponId]?.title || "weapon"}" draggable="false">`
        : "";
      const rarityText = weaponId
        ? `<span class="survivors-shop-rarity">${t("現在", "현재")}: ${getWeaponRarityLabel(state.weapons.rarityById?.[weaponId] || "common")} / ${t("販売", "판매")}: ${getWeaponRarityLabel(offer.weaponRarity || "common")}</span>`
        : "";
      btn.innerHTML = `${weaponImage}<strong>${offer.title} - ${shownCost}c</strong><span>${offer.desc}</span>${rarityText}`;
      btn.dataset.offerIndex = String(index);
      btn.addEventListener("mouseenter", () => {
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = index;
      });
      btn.addEventListener("focus", () => {
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = index;
      });
      btn.addEventListener("click", () => {
        const idx = Number.parseInt(btn.dataset.offerIndex || "-1", 10);
        if (!Number.isFinite(idx) || idx < 0) return;
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = idx;
        chooseShopByIndex(idx);
      });

      const lockBtn = document.createElement("button");
      lockBtn.type = "button";
      lockBtn.className = "survivors-shop-item-lock start-btn ghost";
      lockBtn.disabled = state.shop.localReady;
      lockBtn.textContent = offer.locked ? t("UNLOCK", "해제") : "LOCK";
      lockBtn.setAttribute("aria-label", offer.locked ? t("この商品ロック解除", "이 상품 잠금 해제") : t("この商品ロック", "이 상품 잠금"));
      lockBtn.addEventListener("mouseenter", () => {
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = index;
      });
      lockBtn.addEventListener("focus", () => {
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = index;
      });
      lockBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = index;
        toggleShopOfferLock(index);
      });

      card.appendChild(btn);
      card.appendChild(lockBtn);
      shopOptionsEl.appendChild(card);
    });

    state.shop.selectedIndex = clamp(state.shop.selectedIndex, 0, Math.max(0, state.shop.offers.length - 1));
    state.shop.actionIndex = clamp(state.shop.actionIndex, 0, 1);
    if (state.shop.focusArea === "offers") {
      const selectedBtn = shopOptionsEl.querySelector(`.survivors-shop-card:nth-child(${state.shop.selectedIndex + 1}) .survivors-shop-option`);
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
    state.shop.selectedIndex = clamp(index, 0, Math.max(0, state.shop.offers.length - 1));
    const btn = shopOptionsEl.querySelector(`.survivors-shop-card:nth-child(${index + 1}) .survivors-shop-option`);
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
    const resolvedIndex = Math.floor(Number(index));
    if (!Number.isFinite(resolvedIndex) || resolvedIndex < 0) return;
    const offer = state.shop.offers[resolvedIndex];
    if (!offer) return;
    const spendCost = shopOfferCost(offer);
    if (!canAffordRun(spendCost)) {
      messageEl.textContent = "コイン不足で購入できません";
      return;
    }
    spendRunCoins(spendCost);
    offer.apply(state, offer);
    messageEl.textContent = `購入: ${offer.title}`;
    state.shop.offers = state.shop.offers.filter((v) => v !== offer);
    state.shop.selectedIndex = clamp(resolvedIndex, 0, Math.max(0, state.shop.offers.length - 2));
    state.shop.renderedFor = null;
    renderShopPanel();
    render();
  }

  function openShopPanel() {
    hideGachaPanel();
    state.shop.open = true;
    state.shop.openedWave = state.wave;
    state.shop.rerollCost = 10;
    state.keys.clear();
    state.fairySkillHeld = false;
    state.fairySkillTimer = 0;
    state.shop.localReady = false;
    state.shop.readyCount = 0;
    state.shop.readyRequired = shopReadyRequired();
    if (state.room.enabled && state.room.role === "host") {
      state.room.readyVotes.clear();
    }

    if (state.room.enabled && state.room.role === "guest") {
      state.shop.offers = composeShopOffersWithCarry();
      state.shop.renderedFor = null;
      state.shop.selectedIndex = 0;
      state.shop.focusArea = "offers";
      state.shop.actionIndex = 0;
      setOverlay(t("ショップ", "상점"));
      messageEl.textContent = "ショップで装備を整えよう";
      renderShopPanel();
      return;
    }

    state.shop.offers = composeShopOffersWithCarry();
    state.shop.renderedFor = null;
    state.shop.selectedIndex = 0;
    state.shop.focusArea = "offers";
    state.shop.actionIndex = 0;
    setOverlay(t("ショップ", "상점"));
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
    const currentOffers = Array.isArray(state.shop.offers)
      ? state.shop.offers.slice(0, SHOP_OFFER_COUNT)
      : [];
    const lockedCount = currentOffers.filter((offer) => offer?.locked).length;
    const refreshCount = Math.max(0, SHOP_OFFER_COUNT - lockedCount);
    if (refreshCount <= 0) {
      messageEl.textContent = t("全商品がロック中です", "모든 상품이 잠겨 있습니다");
      renderShopPanel();
      render();
      return;
    }
    spendRunCoins(state.shop.rerollCost);
    state.shop.rerollCost = Math.min(40, state.shop.rerollCost + 4);
    const freshOffers = pickShopOffers(refreshCount);
    let freshIndex = 0;
    state.shop.offers = Array.from({ length: SHOP_OFFER_COUNT }, (_, slotIndex) => {
      const offer = currentOffers[slotIndex];
      if (offer?.locked) return offer;
      const nextOffer = freshOffers[freshIndex];
      freshIndex += 1;
      return nextOffer || offer || pickShopOffers(1)[0];
    }).filter(Boolean);
    state.shop.selectedIndex = 0;
    state.shop.focusArea = "offers";
    state.shop.actionIndex = 0;
    state.shop.renderedFor = null;
    messageEl.textContent = "ショップをリロールしました";
    renderShopPanel();
    render();
  }

  function startNextWaveFromShop() {
    state.shop.carryLockedOffers = (Array.isArray(state.shop.offers) ? state.shop.offers : [])
      .filter((offer) => offer?.locked)
      .map((offer) => cloneShopOffer(offer, true))
      .slice(0, SHOP_OFFER_COUNT);
    state.shop.open = false;
    state.shop.openedWave = 0;
    state.keys.clear();
    state.shop.renderedFor = null;
    state.shop.offers = [];
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
      if ((state.augment.pendingRewards || 0) > 0 || state.pausedForAugment) {
        if (!state.pausedForAugment && (state.augment.pendingRewards || 0) > 0) {
          openAugmentPanel();
        }
        messageEl.textContent = t("先にステータスを選択してください", "먼저 스탯을 선택하세요");
        renderShopPanel();
        render();
        return;
      }
      startNextWaveFromShop();
      return;
    }

    if (!state.pausedForAugment && (state.augment.pendingRewards || 0) > 0) {
      openAugmentPanel();
    }

    const nextReady = !state.shop.localReady;
    state.shop.localReady = nextReady;
    options.onRoomMove?.({ kind: "survivors-shop-ready", ready: nextReady });

    if (state.room.role === "host") {
      broadcastShopReadyState();
      if (nextReady && isAllPlayersShopReady()) {
        if ((state.augment.pendingRewards || 0) > 0 || state.pausedForAugment) {
          messageEl.textContent = t("全員READY。先にステータスを選択してください", "모두 READY. 먼저 스탯을 선택하세요");
        } else {
          startNextWaveFromShop();
          return;
        }
      }
      if (nextReady) {
        messageEl.textContent = t(
          `準備待機中... ${state.shop.readyCount}/${state.shop.readyRequired}`,
          `준비 대기 중... ${state.shop.readyCount}/${state.shop.readyRequired}`,
        );
      } else {
        messageEl.textContent = t("準備を解除しました", "준비를 해제했습니다");
      }
    } else {
      if (nextReady) {
        messageEl.textContent = t(
          `準備送信済み。全員待機中... ${state.shop.readyCount}/${state.shop.readyRequired}`,
          `준비 전송됨. 모두 대기 중... ${state.shop.readyCount}/${state.shop.readyRequired}`,
        );
      } else {
        messageEl.textContent = t("準備を解除しました", "준비를 해제했습니다");
      }
    }

    renderShopPanel();
    render();
  }

  function tryStartNextWaveWhenAllReady() {
    if (!state.room.enabled || state.room.role !== "host") return false;
    if (!isAllPlayersShopReady()) return false;
    if ((state.augment.pendingRewards || 0) > 0 || state.pausedForAugment) {
      messageEl.textContent = t("全員READY。先にステータスを選択してください", "모두 READY. 먼저 스탯을 선택하세요");
      renderShopPanel();
      render();
      return false;
    }
    startNextWaveFromShop();
    return true;
  }

  function pickRandomAugments(count = 3) {
    const pool = AUGMENTS.filter((aug) => !state.augment.picked.includes(aug.id));
    const source = pool.length >= count ? [...pool] : [...AUGMENTS];
    const picked = [];

    while (picked.length < Math.min(count, source.length)) {
      let totalWeight = 0;
      source.forEach((aug) => {
        totalWeight += augmentRollWeight(aug, state.level, state.player.luck);
      });

      let roll = Math.random() * totalWeight;
      let pickedIndex = 0;

      for (let i = 0; i < source.length; i += 1) {
        roll -= augmentRollWeight(source[i], state.level, state.player.luck);
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
      const remain = Math.max(1, Math.floor(state.augment.pendingRewards || 1));
      augmentLevelTextEl.textContent = t(
        `レベル ${state.level} 報酬: 1つ選択 (残り ${remain})`,
        `레벨 ${state.level} 보상: 1개 선택 (남은 ${remain})`,
      );
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

  function renderWeaponFusionPanel() {
    if (!weaponFusionPanelEl || !weaponFusionListEl) return;
    ensureWeaponRarityState(state);

    const equipped = Array.isArray(state.weapons?.equipped) ? state.weapons.equipped : [];
    const rarityBySlot = Array.isArray(state.weapons?.rarityBySlot) ? state.weapons.rarityBySlot : [];
    const selectedIndex = Number.isInteger(state.selectedFusionWeaponIndex) ? state.selectedFusionWeaponIndex : -1;
    const selectedWeaponId = selectedIndex >= 0 && selectedIndex < equipped.length ? equipped[selectedIndex] : "";
    const selectedRarity = selectedIndex >= 0 && selectedIndex < rarityBySlot.length ? (rarityBySlot[selectedIndex] || "common") : "common";
    const count = selectedWeaponId ? equipped.filter((id) => id === selectedWeaponId).length : 0;
    const duplicateReady = count >= 2;
    const rarityReady = selectedWeaponId ? hasMatchingWeaponRarity(state, selectedWeaponId, selectedRarity) : false;
    const maxed = weaponRarityRank(selectedRarity) >= WEAPON_RARITY_ORDER.length - 1;
    const renderKey = `${equipped.join("|")}|rarity:${rarityBySlot.join("|")}|sel:${selectedIndex}|dup:${duplicateReady ? 1 : 0}|rr:${rarityReady ? 1 : 0}`;
    if (weaponFusionListEl.dataset.renderKey === renderKey) return;

    weaponFusionListEl.innerHTML = "";
    if (!selectedWeaponId) {
      state.selectedFusionWeaponIndex = null;
      weaponFusionPanelEl.classList.add("hidden");
      weaponFusionListEl.dataset.renderKey = renderKey;
      return;
    }
    weaponFusionPanelEl.classList.remove("hidden");

    const title = WEAPON_DEFS[selectedWeaponId]?.title || selectedWeaponId;
    const canFuse = state.shop.open && !maxed && (duplicateReady || rarityReady);

    const row = document.createElement("div");
    row.className = "survivors-weapon-fusion-item";
    const rarityLabel = getWeaponRarityLabel(selectedRarity);
    const imgSrc = WEAPON_IMAGE_BY_ID[selectedWeaponId] || "";
    const photo = imgSrc
      ? `<img class="survivors-weapon-fusion-photo" src="${imgSrc}" alt="${title}" draggable="false">`
      : "";
    row.innerHTML = `${photo}<strong>${title}</strong><span class="survivors-weapon-fusion-meta">${t("所持", "보유")}: ${count} / ${t("レア", "등급")}: ${rarityLabel}</span>`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "start-btn ghost";
    btn.dataset.weaponId = selectedWeaponId;
    btn.dataset.slotIndex = String(selectedIndex);
    btn.disabled = !canFuse;
    if (maxed) {
      btn.textContent = t("最大レア", "최대 등급");
    } else if (canFuse) {
      btn.textContent = t("合成", "합성");
    } else {
      btn.textContent = t("条件不足", "조건 부족");
    }
    row.appendChild(btn);
    weaponFusionListEl.appendChild(row);

    weaponFusionListEl.dataset.renderKey = renderKey;
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
    if ((state.augment.pendingRewards || 0) <= 0) {
      state.pausedForAugment = false;
      state.augment.offered = [];
      state.augment.renderedFor = null;
      renderAugmentPanel();
      return;
    }
    hideGachaPanel();
    state.pausedForAugment = true;
    state.augment.offered = pickRandomAugments(3);
    state.augment.selectedIndex = 0;
    state.augment.renderedFor = null;
    setOverlay(t("強化選択", "강화 선택"));
    messageEl.textContent = "オーグメントを1つ選択してください";
    renderAugmentPanel();
  }

  function applyAugment(augmentId) {
    if (!state.pausedForAugment) return;
    const chosen = state.augment.offered.find((aug) => aug.id === augmentId);
    if (!chosen) return;

    chosen.apply(state);
    state.augment.picked.push(chosen.id);
    state.augment.pendingRewards = Math.max(0, Math.floor(state.augment.pendingRewards || 0) - 1);
    messageEl.textContent = `オーグメント獲得: [${getAugmentRarityLabel(chosen.rarity)}] ${chosen.title}`;

    if (state.xp >= state.xpNeed) {
      applyLevelUp();
    }

    if ((state.augment.pendingRewards || 0) > 0) {
      state.augment.offered = pickRandomAugments(3);
      state.augment.renderedFor = null;
      state.augment.selectedIndex = 0;
      state.pausedForAugment = true;
      setOverlay(t("強化選択", "강화 선택"));
      renderAugmentPanel();
      render();
      return;
    }

    state.augment.offered = [];
    state.augment.renderedFor = null;
    state.augment.selectedIndex = 0;
    state.pausedForAugment = false;
    renderAugmentPanel();

    if (state.betweenWaves) {
      openShopPanel();
    } else if (!state.shop.open) {
      setOverlay("");
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

  function assignStatLineGroup(valueEl, group) {
    const line = valueEl?.closest(".survivors-stat-line");
    if (!line) return;
    line.dataset.statGroup = group;
  }

  function configureStatsPanelGroups() {
    assignStatLineGroup(pityTextEl, "sub");
    assignStatLineGroup(damageTextEl, "main");
    assignStatLineGroup(rangedTextEl, "main");
    assignStatLineGroup(meleeTextEl, "main");
    assignStatLineGroup(explosionTextEl, "main");
    assignStatLineGroup(fireTextEl, "main");
    assignStatLineGroup(speedTextEl, "main");
    assignStatLineGroup(regenTextEl, "main");
    assignStatLineGroup(mpRegenTextEl, "main");
    assignStatLineGroup(luckTextEl, "sub");
    assignStatLineGroup(armorTextEl, "main");
    assignStatLineGroup(xpGainTextEl, "sub");
    assignStatLineGroup(itemPriceTextEl, "sub");
    assignStatLineGroup(explosionRateTextEl, "sub");
    assignStatLineGroup(healItemTextEl, "sub");
    assignStatLineGroup(pierceTextEl, "sub");
    assignStatLineGroup(weaponSlotsTextEl, "main");
    assignStatLineGroup(equippedWeaponsTextEl, "main");
  }

  function applyStatsPanelMode() {
    if (!statsPanelEl) return;
    const mode = state.statsPanelMode === "sub" ? "sub" : "main";
    const statLines = statsPanelEl.querySelectorAll(".survivors-stat-line");
    statLines.forEach((line) => {
      const group = line.dataset.statGroup || "main";
      line.classList.toggle("is-hidden-by-mode", group !== mode);
    });
  }

  function applyStatsPanelVisibility() {
    const canInspectStats = state.manualPaused || state.shop.open || !state.running || state.gameOver;
    const visible = state.statsPanelVisible && canInspectStats;
    if (statsPanelEl) {
      statsPanelEl.classList.toggle("is-collapsed", !visible);
    }
    if (visible) {
      applyStatsPanelMode();
    }
    if (statsToggleBtn) {
      statsToggleBtn.disabled = !canInspectStats;
      statsToggleBtn.textContent = state.statsPanelMode === "sub"
        ? t("ステータス: サブ", "상태: 서브")
        : t("ステータス: メイン", "상태: 메인");
    }
  }

  function updateHud() {
    const hpCurrent = Math.max(0, Math.round(state.player.hp));
    const hpMax = Math.max(1, Math.round(state.player.maxHp));
    const mpCurrent = Math.max(0, Math.round(state.player.mp));
    const mpMax = Math.max(1, Math.round(state.player.maxMp));
    const xpCurrent = Math.max(0, Math.round(state.xp));
    const xpNeed = Math.max(1, Math.round(state.xpNeed));
    const hpRate = clamp(hpCurrent / hpMax, 0, 1);
    const mpRate = clamp(mpCurrent / mpMax, 0, 1);
    const xpRate = clamp(xpCurrent / xpNeed, 0, 1);
    setHudText(hpTextEl, `${hpCurrent} / ${hpMax}`);
    setHudText(mpTextEl, `${mpCurrent} / ${mpMax}`);
    if (hpFillEl) {
      hpFillEl.style.width = `${(hpRate * 100).toFixed(1)}%`;
    }
    if (hpGaugeEl) {
      hpGaugeEl.setAttribute("aria-valuemax", String(hpMax));
      hpGaugeEl.setAttribute("aria-valuenow", String(hpCurrent));
    }
    if (mpFillEl) {
      mpFillEl.style.width = `${(mpRate * 100).toFixed(1)}%`;
    }
    if (mpGaugeEl) {
      mpGaugeEl.setAttribute("aria-valuemax", String(mpMax));
      mpGaugeEl.setAttribute("aria-valuenow", String(mpCurrent));
    }
    setHudText(levelTextEl, state.level);
    if (xpFillEl) {
      xpFillEl.style.width = `${(xpRate * 100).toFixed(1)}%`;
    }
    if (xpGaugeEl) {
      xpGaugeEl.setAttribute("aria-valuemax", String(xpNeed));
      xpGaugeEl.setAttribute("aria-valuenow", String(xpCurrent));
    }
    setHudText(xpTextEl, `EXP ${xpCurrent} / ${xpNeed}`);
    setHudText(killTextEl, state.kills);
    if (coinTextEl) {
      setHudText(coinTextEl, Math.floor(state.coins));
    }
    if (bankTextEl) {
      setHudText(bankTextEl, Math.floor(state.bankCoins));
    }
    if (bankMetricEl) {
      bankMetricEl.classList.toggle("is-muted", state.running && !state.gameOver);
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
    if (regenTextEl) {
      setHudText(regenTextEl, `${state.player.hpRegen.toFixed(2)}/s`);
    }
    if (mpRegenTextEl) {
      setHudText(mpRegenTextEl, `${state.player.mpRegen.toFixed(2)}/s`);
    }
    if (luckTextEl) {
      setHudText(luckTextEl, Math.round(state.player.luck));
    }
    if (armorTextEl) {
      const armorRate = clamp(1 - state.player.damageTakenMul, 0, 0.95);
      setHudText(armorTextEl, `${Math.round(armorRate * 100)}%`);
    }
    if (xpGainTextEl) {
      setHudText(xpGainTextEl, `${Math.round((Number(state.player.xpGainMul) || 1) * 100)}%`);
    }
    if (itemPriceTextEl) {
      setHudText(itemPriceTextEl, `${Math.round((Number(state.player.shopPriceMul) || 1) * 100)}%`);
    }
    if (explosionRateTextEl) {
      setHudText(explosionRateTextEl, `${Math.round((Number(state.player.explosionMul) || 1) * 100)}%`);
    }
    if (healItemTextEl) {
      setHudText(healItemTextEl, `${Math.round((Number(state.player.healItemMul) || 1) * 100)}%`);
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
      setHudText(weaponSlotsTextEl, weaponTypeSummaryText());
    }
    renderOwnedWeaponList();
    if (passiveTextEl) {
      setHudText(passiveTextEl, passiveStatusText());
    }
    if (waveTextEl) {
      if (state.betweenWaves) {
        setHudText(waveTextEl, `${state.wave} ${t("クリア", "클리어")}`);
      } else {
        setHudText(waveTextEl, `${state.wave} (${Math.max(0, Math.ceil(state.waveRemaining))}s)`);
      }
    }
    if (waveTimerTextEl) {
      if (state.betweenWaves) {
        setHudText(waveTimerTextEl, `${t("ウェーブ", "웨이브")} ${state.wave} ${t("クリア", "클리어")}`);
      } else {
        setHudText(waveTimerTextEl, `${t("ウェーブ", "웨이브")} ${state.wave} · ${Math.max(0, Math.ceil(state.waveRemaining))}s`);
      }
    }
    if (waveTimerEl) {
      const remainSec = Math.max(0, Math.ceil(state.waveRemaining));
      const critical = !state.betweenWaves && remainSec <= 5;
      const warning = !state.betweenWaves && remainSec <= 10;
      waveTimerEl.classList.toggle("critical", critical);
      waveTimerEl.classList.toggle("warning", warning && !critical);
    }
    if (remakeBtn) {
      remakeBtn.disabled = !(state.gameOver || state.manualPaused);
    }
    if (pauseBtn) {
      pauseBtn.textContent = state.manualPaused ? t("再開", "재개") : t("一時停止", "일시정지");
    }
    renderWeaponFusionPanel();
    applyStatsPanelVisibility();
    renderGachaPanel();

    const totalSec = Math.floor(state.elapsed);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    const waveSummary = state.betweenWaves
      ? `${state.wave} ${t("クリア", "클리어")}`
      : `${state.wave} (${Math.max(0, Math.ceil(state.waveRemaining))}s)`;
    const playersSummary = `${effectivePlayerCount()} / ${state.room.maxPlayers}`;
    if (topSummaryTextEl) {
      setHudText(topSummaryTextEl, `${t("時間", "시간")} ${mm}:${ss} | ${t("撃破", "처치")} ${state.kills} | ${t("ウェーブ", "웨이브")} ${waveSummary} | ${t("人数", "인원")} ${playersSummary}`);
    }
    setHudText(timeTextEl, `${mm}:${ss}`);
  }

  function waveDurationFor(wave) {
    return clamp(22 + (wave - 1) * 1, 22, 30);
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
      if (state.running && !state.gameOver && !state.manualPaused && !state.pausedForAugment && !state.betweenWaves) {
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

    messageEl.textContent = t(
      `ウェーブ ${state.wave} 開始! ${Math.ceil(state.waveDuration)}秒生存 (${effectivePlayerCount()}人)`,
      `웨이브 ${state.wave} 시작! ${Math.ceil(state.waveDuration)}초 생존 (${effectivePlayerCount()}명)`,
    );
    showWaveOverlay(`${t("ウェーブ", "웨이브")} ${state.wave}`, 850);
  }

  function clearDomEntities() {
    fieldEl.querySelectorAll(".sv-bullet,.sv-enemy,.sv-orb,.sv-particle,.sv-level-fx,.sv-ally,.sv-pulse-ring").forEach((el) => el.remove());
    state.entities.playerCabbageOrbitCount = 0;
    state.entities.bullets.clear();
    state.entities.enemies.clear();
    state.entities.orbs.clear();
    state.entities.particles.clear();
    state.entities.allies.clear();
  }

  function orbitPresetForIndex(index, total) {
    const safeTotal = Math.max(1, Math.floor(total || 1));
    const ringSize = 3;
    const ring = Math.floor(index / ringSize);
    const ringOffset = index % ringSize;
    const radius = 30 + ring * 14 + ringOffset * 3;
    const duration = 2.45 + ring * 0.24 + ringOffset * 0.1;
    const delay = -((index / safeTotal) * duration);
    return { radius, duration, delay };
  }

  function applyOrbitSpritePreset(cabbageEl, index, total) {
    if (!cabbageEl) return;
    const preset = orbitPresetForIndex(index, total);
    cabbageEl.style.setProperty("--orbit-radius", `${preset.radius}px`);
    cabbageEl.style.setProperty("--orbit-delay", `${preset.delay.toFixed(3)}s`);
    cabbageEl.style.setProperty("--orbit-duration", `${preset.duration.toFixed(3)}s`);
  }

  function refreshCabbageOrbitSprites(orbitEl, targetCount) {
    if (!orbitEl) return;
    const count = Math.max(1, targetCount || orbitEl.children.length || 1);
    for (let i = 0; i < orbitEl.children.length; i += 1) {
      const child = orbitEl.children[i];
      if (!(child instanceof HTMLElement)) continue;
      applyOrbitSpritePreset(child, i, count);
    }
  }

  function appendCabbageOrbitSprite(orbitEl, index = 0, total = 1) {
    if (!orbitEl) return;
    orbitSpriteSeed += 1;

    const cabbage = document.createElement("img");
    cabbage.className = "sv-player-cabbage";
    cabbage.alt = "";
    cabbage.draggable = false;
    cabbage.src = FAIRY_ATTACK_FRAME;
    applyOrbitSpritePreset(cabbage, index, total);
    cabbage.onerror = () => {
      cabbage.style.display = "none";
    };
    orbitEl.appendChild(cabbage);
  }

  function ensureCabbageOrbitCount() {
    const orbitEl = state.entities.playerCabbageOrbitEl;
    if (!orbitEl) return;
    const knuckleCount = Math.max(1, weaponCountById(state, "shock_knuckle"));
    const targetCount = clamp(
      FAIRY_ORBIT_BASE_COUNT + (knuckleCount - 1) * 3,
      FAIRY_ORBIT_BASE_COUNT,
      FAIRY_ORBIT_MAX_COUNT,
    );
    if (orbitEl.children.length === targetCount && state.entities.playerCabbageOrbitCount === targetCount) {
      return;
    }
    while (orbitEl.children.length < targetCount) {
      appendCabbageOrbitSprite(orbitEl, orbitEl.children.length, targetCount);
    }
    while (orbitEl.children.length > targetCount) {
      orbitEl.lastElementChild?.remove();
    }
    refreshCabbageOrbitSprites(orbitEl, targetCount);
    state.entities.playerCabbageOrbitCount = targetCount;
  }

  function ensureCabbageShotPoolSize(minSize, playerEl = state.entities.player) {
    if (!playerEl) return;
    const shots = state.entities.playerCabbageShots || [];
    while (shots.length < minSize) {
      const shot = document.createElement("img");
      shot.className = "sv-player-cabbage-shot";
      shot.alt = "";
      shot.draggable = false;
      shot.src = FAIRY_ATTACK_FRAME;
      shot.onerror = () => {
        shot.style.display = "none";
      };
      playerEl.appendChild(shot);
      shots.push(shot);
    }
    state.entities.playerCabbageShots = shots;
  }

  function launchFrontOrbitCabbage(target = null) {
    if (state.characterId !== "fairy") return;
    const orbitEl = state.entities.playerCabbageOrbitEl;
    if (!orbitEl) return;

    ensureCabbageOrbitCount();
    const front = orbitEl.firstElementChild;
    if (!(front instanceof HTMLElement)) return;
    front.classList.add("launching");

    const shots = state.entities.playerCabbageShots || [];
    if (shots.length === 0) return;
    const shot = shots[state.entities.playerCabbageShotIndex % shots.length];
    state.entities.playerCabbageShotIndex = (state.entities.playerCabbageShotIndex + 1) % shots.length;

    let dx = state.anim.lastHorizontalInput > 0 ? 1 : -1;
    let dy = 0;
    if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
      const vx = target.x - state.player.x;
      const vy = target.y - state.player.y;
      const len = Math.hypot(vx, vy) || 1;
      dx = vx / len;
      dy = vy / len;
    }
    shot.style.setProperty("--shot-x", `${(dx * 84).toFixed(1)}px`);
    shot.style.setProperty("--shot-y", `${(dy * 84).toFixed(1)}px`);
    shot.style.setProperty("--shot-rot", `${Math.atan2(dy, dx).toFixed(3)}rad`);
    shot.classList.remove("active");
    void shot.offsetWidth;
    shot.classList.add("active");

    window.setTimeout(() => {
      front.classList.remove("launching");
      orbitEl.appendChild(front);
    }, 80);
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
      // Keep fairy visuals stable even if one frame fails to decode/load.
      if (state.characterId === "fairy") {
        img.src = FAIRY_IDLE_FRAME;
        img.dataset.frameSrc = FAIRY_IDLE_FRAME;
        return;
      }
      // If custom image is missing, keep gameplay alive with built-in frames.
      state.anim.customSpriteFallback = true;
      img.src = skinFrames()[0];
    };
    img.src = playerFrames(state)[0];
    el.appendChild(img);

    const weaponImg = document.createElement("img");
    weaponImg.className = "sv-player-weapon";
    weaponImg.alt = "";
    weaponImg.draggable = false;
    weaponImg.src = HANDGUN_STOP_FRAME;
    weaponImg.onerror = () => {
      weaponImg.style.display = "none";
    };
    el.appendChild(weaponImg);

    const orbitEl = document.createElement("div");
    orbitEl.className = "sv-player-cabbage-orbit";
    while (orbitEl.children.length < FAIRY_ORBIT_BASE_COUNT) {
      appendCabbageOrbitSprite(orbitEl, orbitEl.children.length, FAIRY_ORBIT_BASE_COUNT);
    }
    refreshCabbageOrbitSprites(orbitEl, FAIRY_ORBIT_BASE_COUNT);
    el.appendChild(orbitEl);

    const shotPool = [];
    for (let i = 0; i < 4; i += 1) {
      const shot = document.createElement("img");
      shot.className = "sv-player-cabbage-shot";
      shot.alt = "";
      shot.draggable = false;
      shot.src = FAIRY_ATTACK_FRAME;
      shot.onerror = () => {
        shot.style.display = "none";
      };
      el.appendChild(shot);
      shotPool.push(shot);
    }

    state.entities.playerSprite = img;
    state.entities.playerWeaponSprite = weaponImg;
    state.entities.playerCabbageOrbitEl = orbitEl;
    state.entities.playerCabbageOrbitCount = FAIRY_ORBIT_BASE_COUNT;
    state.entities.playerCabbageShots = shotPool;
    state.entities.playerCabbageShotIndex = 0;
    ensureCabbageShotPoolSize(6, el);
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

    if (state.entities.playerWeaponSprite) {
      const hasHandgun = hasWeaponEquipped(state, "auto_blaster");
      const weaponEl = state.entities.playerWeaponSprite;
      if (!hasHandgun) {
        weaponEl.classList.remove("visible", "attacking", "facing-right");
      } else {
        const weaponFrame = state.anim.attacking ? HANDGUN_ATTACK_FRAME : HANDGUN_STOP_FRAME;
        if (weaponEl.dataset.frameSrc !== weaponFrame) {
          weaponEl.src = weaponFrame;
          weaponEl.dataset.frameSrc = weaponFrame;
        }
        weaponEl.classList.add("visible");
        weaponEl.classList.toggle("attacking", state.anim.attacking);
        weaponEl.classList.toggle("facing-right", state.anim.lastHorizontalInput > 0);
      }
    }

    if (state.entities.playerCabbageOrbitEl) {
      const showCabbageOrbit = state.running
        && !state.manualPaused
        && !state.gameOver
        && state.characterId === "fairy"
        && !state.player.downed;
      if (showCabbageOrbit) {
        ensureCabbageOrbitCount();
        const rangedShots = Math.max(1, weaponCountById(state, "auto_blaster"));
        ensureCabbageShotPoolSize(Math.max(6, rangedShots * 2));
      }
      state.entities.playerCabbageOrbitEl.classList.toggle("visible", showCabbageOrbit);
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
      const p = toViewPos({
        x: Number.isFinite(e.renderX) ? e.renderX : e.x,
        y: Number.isFinite(e.renderY) ? e.renderY : e.y,
      });
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
      el.classList.toggle("heal", o.kind === "heal");
      const p = toViewPos({
        x: Number.isFinite(o.renderX) ? o.renderX : o.x,
        y: Number.isFinite(o.renderY) ? o.renderY : o.y,
      });
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
      const p = toViewPos({
        x: Number.isFinite(mate.renderX) ? mate.renderX : mate.x,
        y: Number.isFinite(mate.renderY) ? mate.renderY : mate.y,
      });
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

  function spawnBullet(target, options = {}) {
    const spreadIndex = Number.isFinite(options.spreadIndex) ? options.spreadIndex : 0;
    const spreadCount = Number.isFinite(options.spreadCount) ? Math.max(1, options.spreadCount) : 1;
    const dx = target.x - state.player.x;
    const dy = target.y - state.player.y;
    const len = Math.hypot(dx, dy) || 1;
    const baseVx = dx / len;
    const baseVy = dy / len;
    const spreadStep = spreadCount > 1 ? 0.11 : 0;
    const spreadOffset = (spreadIndex - (spreadCount - 1) / 2) * spreadStep;
    const cos = Math.cos(spreadOffset);
    const sin = Math.sin(spreadOffset);
    const dirX = baseVx * cos - baseVy * sin;
    const dirY = baseVx * sin + baseVy * cos;
    const vx = dirX * state.player.projSpeed;
    const vy = dirY * state.player.projSpeed;

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
    if (state.characterId === "fairy") {
      launchFrontOrbitCabbage(target);
    }
  }

  function spawnOrb(x, y, amount = 5, kind = "xp") {
    const value = Number(amount) || 0;
    const radius = kind === "heal"
      ? 11
      : clamp(8 + value * 1.2, 8, 14);
    state.orbs.push({
      id: newId("o"),
      x,
      y,
      radius,
      value,
      kind,
      pickupDelay: 0.2,
    });
  }

  function nextHealPickupDelay() {
    return 8 + Math.random() * 9;
  }

  function spawnHealPickup() {
    const margin = 42;
    const x = margin + Math.random() * (WORLD_W - margin * 2);
    const y = margin + Math.random() * (WORLD_H - margin * 2);
    spawnOrb(x, y, 0.2, "heal");
  }

  function dropXpOrbs(enemy) {
    const totalXp = 5 + Math.floor(state.level / 3);
    const dropCount = Math.max(1, Math.min(4, 1 + Math.floor(totalXp / 4)));
    const baseValue = Math.max(1, Math.floor(totalXp / dropCount));
    let remain = totalXp;

    for (let i = 0; i < dropCount; i += 1) {
      const value = i === dropCount - 1 ? remain : Math.min(remain, baseValue);
      remain -= value;
      const angle = (Math.PI * 2 * i) / dropCount + (Math.random() - 0.5) * 0.6;
      const spread = 8 + Math.random() * 16;
      spawnOrb(
        enemy.x + Math.cos(angle) * spread,
        enemy.y + Math.sin(angle) * spread,
        Math.max(1, value),
      );
    }

    spawnXpPopup(totalXp, enemy, { mode: "drop" });
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

  function spawnXpPopup(amount, origin = state.player, options = {}) {
    if (!fieldEl || !origin) return;
    const shown = Math.max(1, Math.round(Number(amount) || 0));
    const mode = options.mode === "drop" ? "drop" : "gain";
    const popup = document.createElement("div");
    popup.className = mode === "drop" ? "sv-xp-pop drop" : "sv-xp-pop";
    popup.textContent = mode === "drop"
      ? t(`EXPドロップ +${shown}`, `EXP 드롭 +${shown}`)
      : `+${shown} EXP`;
    const pos = toViewPos(origin);
    popup.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    popup.style.setProperty("--xp-dx", `${(Math.random() - 0.5) * 28}px`);
    popup.style.setProperty("--xp-rise", `${mode === "drop" ? 44 : 32 + Math.random() * 14}px`);
    fieldEl.appendChild(popup);
    window.setTimeout(() => popup.remove(), 760);
  }

  function spawnAllyAttackFx(mate) {
    if (!mate || !Number.isFinite(mate.x) || !Number.isFinite(mate.y)) return;

    const dirX = (mate.movingRight ? 1 : 0) - (mate.movingLeft ? 1 : 0);
    const dirY = (mate.movingDown ? 1 : 0) - (mate.movingUp ? 1 : 0);
    const hasDir = dirX !== 0 || dirY !== 0;
    const len = hasDir ? Math.hypot(dirX, dirY) || 1 : 1;
    const nx = hasDir ? dirX / len : 1;
    const ny = hasDir ? dirY / len : 0;

    for (let i = 0; i < 3; i += 1) {
      const spread = (Math.random() - 0.5) * 0.34;
      const cs = Math.cos(spread);
      const sn = Math.sin(spread);
      const vx = (nx * cs - ny * sn) * (240 + Math.random() * 120);
      const vy = (nx * sn + ny * cs) * (240 + Math.random() * 120);
      state.particles.push({
        id: newId("pa"),
        x: mate.x,
        y: mate.y,
        vx,
        vy,
        life: 0.16 + Math.random() * 0.07,
        maxLife: 0.24,
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
    dropXpOrbs(enemy);
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
    const damage = opts.overrideDamage
      ?? ((state.player.killNovaDamage + state.player.explosionDamage) * clamp(state.player.explosionMul || 1, 0.1, 8));
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

  function applyMeleePulse(strikeCount = 1) {
    if (state.player.meleeDamage <= 0 || state.player.meleeRadius <= 0) return;
    const hitDamage = state.player.meleeDamage * Math.max(1, Math.floor(strikeCount));
    triggerAttackAnimation();
    const radiusSq = state.player.meleeRadius * state.player.meleeRadius;
    let hitCount = 0;
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      const dx = enemy.x - state.player.x;
      const dy = enemy.y - state.player.y;
      if (dx * dx + dy * dy > radiusSq) continue;
      enemy.hp -= hitDamage;
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
    spawnPulseRing(state.player.x, state.player.y, state.player.meleeRadius * 2, "melee");
    if (hitCount > 0) {
      spawnBurst(state.player.x, state.player.y, 6);
    }
  }

  function syncShockKnuckleTimers(reset = false) {
    const count = weaponCountById(state, "shock_knuckle");
    const cooldown = Math.max(0.3, state.player.meleeRate);
    if (count <= 0) {
      state.weapons.shockKnuckleTimers = [];
      return;
    }

    const timers = Array.isArray(state.weapons.shockKnuckleTimers)
      ? state.weapons.shockKnuckleTimers.slice()
      : [];

    while (timers.length < count) {
      const phase = timers.length / Math.max(1, count);
      timers.push(reset ? cooldown * (0.2 + phase * 0.8) : cooldown * phase);
    }
    while (timers.length > count) {
      timers.pop();
    }

    state.weapons.shockKnuckleTimers = timers;
  }

  function castDefaultBlastSkill() {
    if (!state.running || state.gameOver) return;
    if (state.characterId !== "default") return;
    if (state.player.downed || state.pausedForAugment || state.shop.open || state.betweenWaves) return;
    if (!spendMp(DEFAULT_BLAST_MP_COST)) {
      messageEl.textContent = `MP不足: ${DEFAULT_BLAST_MP_COST}必要`;
      return;
    }

    const radius = Math.max(72, 132 + state.player.explosionRadius * 0.6);
    const damage = Math.max(8, (24 + state.level * 0.8 + state.player.explosionDamage * 0.8) * clamp(state.player.explosionMul || 1, 0.1, 8));
    const radiusSq = radius * radius;
    let hitCount = 0;

    triggerAttackAnimation();
    triggerBlastCastEffect(radius);
    spawnBurst(state.player.x, state.player.y, 14);

    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      const dx = enemy.x - state.player.x;
      const dy = enemy.y - state.player.y;
      if (dx * dx + dy * dy > radiusSq) continue;
      hitCount += 1;
      enemy.hp -= damage;
      spawnBurst(enemy.x, enemy.y, 5);
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const push = clamp((radius - len) * 0.24, 10, 68);
      enemy.x = clamp(enemy.x + nx * push, 10, WORLD_W - 10);
      enemy.y = clamp(enemy.y + ny * push, 10, WORLD_H - 10);
      if (enemy.hp <= 0) {
        grantKillRewards(enemy, "explosion");
        state.enemies.splice(i, 1);
      }
    }

    if (hitCount > 0) {
      messageEl.textContent = `BLAST: ${hitCount}体に ${Math.round(damage)} ダメージ`;
    } else {
      messageEl.textContent = "BLAST発動: 範囲内に敵なし";
    }
  }

  function castMagicPulse(dt) {
    if (!state.running || state.gameOver) return;
    if (state.player.downed || state.pausedForAugment || state.shop.open || state.betweenWaves) return;
    const wandCount = weaponCountById(state, "arc_wand");
    if (wandCount <= 0) return;

    state.magicTimer = Math.max(0, state.magicTimer - Math.max(0, Number(dt) || 0));
    if (state.magicTimer > 0) return;

    const target = nearestEnemyWithin(420 + Math.max(0, state.player.rangeBonus) * 0.8);
    if (!target) {
      state.magicTimer = Math.max(0.22, state.player.magicRate);
      return;
    }

    const magicCopies = Math.max(1, wandCount);

    const radius = Math.max(36, state.player.magicRadius + magicCopies * 5);
    const radiusSq = radius * radius;
    const baseDamage = (state.player.magicDamage + state.player.damage * 0.6) * (1 + (magicCopies - 1) * 0.14);
    let hitCount = 0;

    spawnPulseRing(target.x, target.y, radius * 2, "explosion");
    spawnBurst(target.x, target.y, 8 + magicCopies);
    triggerAttackAnimation();

    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      const dx = enemy.x - target.x;
      const dy = enemy.y - target.y;
      if (dx * dx + dy * dy > radiusSq) continue;
      hitCount += 1;
      enemy.hp -= baseDamage;
      spawnBurst(enemy.x, enemy.y, 3);
      if (enemy.hp <= 0) {
        const deadX = enemy.x;
        const deadY = enemy.y;
        grantKillRewards(enemy, "explosion");
        state.enemies.splice(i, 1);
        triggerKillNova(deadX, deadY, { allowAftershock: false });
      }
    }

    state.magicTimer = Math.max(0.22, state.player.magicRate);
    if (hitCount > 0) {
      messageEl.textContent = t(`魔法波動: ${hitCount}体に ${Math.round(baseDamage)} ダメージ`, `마법 파동: ${hitCount}체에 ${Math.round(baseDamage)} 피해`);
    }
  }

  function updateFairyHoldSkill(dt) {
    if (state.characterId !== "fairy") {
      state.fairySkillHeld = false;
      state.fairySkillTimer = 0;
      return;
    }

    const canChannel = state.running
      && !state.gameOver
      && !state.player.downed
      && !state.pausedForAugment
      && !state.shop.open
      && !state.betweenWaves;
    if (!canChannel || !state.fairySkillHeld) {
      state.fairySkillTimer = 0;
      return;
    }

    state.fairySkillTimer -= dt;
    while (state.fairySkillTimer <= 0) {
      const target = nearestEnemyWithin(rangedAttackSenseRange());
      if (target) {
        const cabbageCount = weaponCountById(state, "shock_knuckle");
        if (cabbageCount <= 0) {
          state.fairySkillHeld = false;
          state.fairySkillTimer = 0;
          return;
        }
        const skillShotCount = Math.max(1, cabbageCount);
        const reductionRate = fairySkillMpReductionRate(skillShotCount);
        const shotMpCost = FAIRY_HOLD_SKILL_MP_DRAIN_PER_SEC
          * FAIRY_HOLD_SKILL_FIRE_INTERVAL
          * skillShotCount
          * (1 - reductionRate);
        if (!spendMp(shotMpCost)) {
          state.fairySkillHeld = false;
          state.fairySkillTimer = 0;
          messageEl.textContent = t("MP不足: フェアリースキル停止", "MP 부족: 페어리 스킬 중지");
          return;
        }
        for (let shotIndex = 0; shotIndex < skillShotCount; shotIndex += 1) {
          spawnBullet(target, { spreadIndex: shotIndex, spreadCount: skillShotCount });
        }
      }
      state.fairySkillTimer += FAIRY_HOLD_SKILL_FIRE_INTERVAL;
    }
  }

  function gainSharedXp(amount, { fromRemote = false } = {}) {
    const baseGain = Math.max(0, Number(amount) || 0);
    const gain = fromRemote
      ? baseGain
      : baseGain * clamp(Number(state.player.xpGainMul) || 1, 0.1, 5);
    if (gain <= 0) return;
    if (!state.running || state.gameOver) return;

    state.xp += gain;
    spawnXpPopup(gain, state.player);
    applyLevelUp();

    if (state.room.enabled && !fromRemote) {
      options.onRoomMove?.({
        kind: "survivors-xp-gain",
        amount: gain,
      });
    }
  }

  function applyLevelUp() {
    let leveledCount = 0;
    while (state.xp >= state.xpNeed) {
      state.xp -= state.xpNeed;
      state.level += 1;
      leveledCount += 1;
      state.xpNeed = Math.floor(state.xpNeed * 1.3 + 8);

      state.player.maxHp += 3;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6);
      state.player.mpRegen += 1;
      if (state.level === 3) {
        messageEl.textContent = t("レベル3! 強敵が出現", "레벨 3! 강적 출현");
      } else {
        messageEl.textContent = t(`レベル ${state.level}! 強化を選択`, `레벨 ${state.level}! 강화를 선택하세요`);
      }

      const fx = document.createElement("div");
      fx.className = "sv-level-fx";
      fieldEl.appendChild(fx);
      window.setTimeout(() => fx.remove(), 600);
    }

    if (leveledCount > 0) {
      state.augment.pendingRewards = Math.max(0, Math.floor(state.augment.pendingRewards || 0)) + leveledCount;
      if (!state.betweenWaves) {
        messageEl.textContent = t(
          `レベルアップ報酬 ${state.augment.pendingRewards}件をウェーブクリア後に取得`,
          `레벨업 보상 ${state.augment.pendingRewards}개를 웨이브 클리어 후 획득`,
        );
      }
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

  function nearestEnemyWithin(range) {
    const maxSq = Math.max(0, range) * Math.max(0, range);
    let best = null;
    let bestSq = Infinity;
    for (let i = 0; i < state.enemies.length; i += 1) {
      const enemy = state.enemies[i];
      const dSq = distanceSq(state.player, enemy);
      if (dSq > maxSq || dSq >= bestSq) continue;
      best = enemy;
      bestSq = dSq;
    }
    return best;
  }

  function rangedAttackSenseRange() {
    return clamp(state.player.projSpeed * 0.65 + Math.max(0, state.player.rangeBonus), 260, 980);
  }

  function meleeAttackSenseRange() {
    return Math.max(0, state.player.meleeRadius + 14);
  }

  function tick(dt) {
    if (state.manualPaused) {
      render();
      return;
    }

    // Keep room state sync flowing even while host is paused on augment choices.
    maybeBroadcastRoomMove(dt);
    smoothRemoteEntities(dt);

    if (state.pausedForAugment) {
      return;
    }
    const hostAuthority = !state.room.enabled || state.room.role === "host";

    // Queue level-up rewards even during wave/shop transitions.
    if (state.xp >= state.xpNeed) {
      applyLevelUp();
    }

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

    if (state.player.invincibleTimer > 0) {
      state.player.invincibleTimer = Math.max(0, state.player.invincibleTimer - dt);
    }

    if (!state.player.downed && state.player.hpRegen > 0 && state.player.hp < state.player.maxHp) {
      state.player.hpRegenTick += dt;
      if (state.player.hpRegenTick >= 1) {
        const ticks = Math.floor(state.player.hpRegenTick);
        state.player.hpRegenTick -= ticks;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.player.hpRegen * ticks);
      }
    } else {
      state.player.hpRegenTick = 0;
    }

    const skillActiveForMpRegenBlock = state.fairySkillHeld;
    if (!state.player.downed && !skillActiveForMpRegenBlock && state.player.mpRegen > 0 && state.player.mp < state.player.maxMp) {
      state.player.mp = Math.min(state.player.maxMp, state.player.mp + state.player.mpRegen * dt);
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
      state.anim.horizontalInput = Math.sign(mx);
      if (state.anim.verticalInput !== 0) {
        state.anim.lastVerticalInput = state.anim.verticalInput;
      }
      if (state.anim.horizontalInput !== 0) {
        state.anim.lastHorizontalInput = state.anim.horizontalInput;
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
      state.anim.horizontalInput = 0;
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

    if (hostAuthority) {
      state.enemySpawnTimer -= dt;
      if (!state.betweenWaves) {
        const anyAliveSurvivor = !state.player.downed
          || (state.room.enabled && visibleTeammates().some((mate) => !mate.downed));

        state.healPickupTimer -= dt;
        if (anyAliveSurvivor && state.healPickupTimer <= 0) {
          state.healPickupTimer = nextHealPickupDelay();
          if (state.orbs.length < 140) {
            spawnHealPickup();
          }
        }

        while (state.enemySpawnTimer <= 0 && state.enemies.length < state.waveMaxEnemies) {
          spawnEnemy();
          state.enemySpawnTimer += state.enemySpawnInterval;
        }

        if (!anyAliveSurvivor) {
          state.waveRemaining = Math.max(0, state.waveRemaining);
        } else {
          state.waveRemaining -= dt;
        }
        if (state.waveRemaining <= 0) {
          state.waveRemaining = 0;
          state.betweenWaves = true;
          state.waveClearElapsed = 0;
          state.enemies = [];
          const hpRecover = state.player.maxHp * 0.6;
          const mpRecover = state.player.maxMp * 0.6;
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + hpRecover);
          state.player.mp = Math.min(state.player.maxMp, state.player.mp + mpRecover);
          const reward = 12 + Math.round(state.wave * 3.2) + Math.round(state.waveRemaining);
          const carryBonus = Math.floor(state.coins * state.coinCarryRate);
          state.coins += reward + carryBonus;
          const pendingRewards = Math.max(0, Math.floor(state.augment.pendingRewards || 0));
          messageEl.textContent = pendingRewards > 0
            ? t(
              `ウェーブ ${state.wave} クリア! +${reward}c (持越し +${carryBonus}c) / HP・MP 60%回復 / 報酬${pendingRewards}件`,
              `웨이브 ${state.wave} 클리어! +${reward}c (이월 +${carryBonus}c) / HP·MP 60% 회복 / 보상 ${pendingRewards}개`,
            )
            : t(
              `ウェーブ ${state.wave} クリア! +${reward}c (持越し +${carryBonus}c) / HP・MP 60%回復`,
              `웨이브 ${state.wave} 클리어! +${reward}c (이월 +${carryBonus}c) / HP·MP 60% 회복`,
            );
          showWaveOverlay(`${t("ウェーブ", "웨이브")} ${state.wave} ${t("クリア", "클리어")}`, 900);
          if (pendingRewards > 0) {
            openAugmentPanel();
          } else {
            openShopPanel();
          }
        }
      } else {
        state.waveClearElapsed += dt;
      }
    }

    state.fireTimer -= dt;
    const canAutoRanged = hasWeaponType("ranged") || state.characterId === "fairy";
    if (!state.player.downed && canAutoRanged && state.fireTimer <= 0) {
      const target = nearestEnemyWithin(rangedAttackSenseRange());
      if (target) {
        const rangedCopies = state.characterId === "fairy"
          ? Math.max(1, weaponCountById(state, "auto_blaster"))
          : Math.max(1, weaponTypeCount("ranged"));
        for (let shotIndex = 0; shotIndex < rangedCopies; shotIndex += 1) {
          spawnBullet(target, { spreadIndex: shotIndex, spreadCount: rangedCopies });
        }
        state.fireTimer = state.player.fireRate;
      }
    }

    syncShockKnuckleTimers(false);
    if (!state.player.downed && hasWeaponEquipped(state, "shock_knuckle")) {
      const timers = state.weapons.shockKnuckleTimers;
      for (let i = 0; i < timers.length; i += 1) {
        timers[i] -= dt;
      }
      if (nearestEnemyWithin(meleeAttackSenseRange())) {
        const cooldown = Math.max(0.3, state.player.meleeRate);
        for (let i = 0; i < timers.length; i += 1) {
          if (timers[i] <= 0) {
            applyMeleePulse(1);
            timers[i] += cooldown;
          }
        }
      }
    }

    updateFairyHoldSkill(dt);
    castMagicPulse(dt);

    state.bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    });
    state.bullets = state.bullets.filter((b) => b.life > 0 && b.x > -24 && b.x < WORLD_W + 24 && b.y > -24 && b.y < WORLD_H + 24);

    if (hostAuthority) {
      const teammateTargets = state.room.enabled
        ? visibleTeammates().filter((mate) => !mate.downed && Number.isFinite(mate.x) && Number.isFinite(mate.y))
        : [];
      state.enemies.forEach((e) => {
        let targetX = state.player.x;
        let targetY = state.player.y;
        let bestDistSq = Number.POSITIVE_INFINITY;

        if (!state.player.downed) {
          const pdx = targetX - e.x;
          const pdy = targetY - e.y;
          bestDistSq = pdx * pdx + pdy * pdy;
        }

        teammateTargets.forEach((mate) => {
          const dx = mate.x - e.x;
          const dy = mate.y - e.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            targetX = mate.x;
            targetY = mate.y;
          }
        });

        if (!Number.isFinite(bestDistSq)) return;
        const dx = targetX - e.x;
        const dy = targetY - e.y;
        const len = Math.hypot(dx, dy) || 1;
        e.x += (dx / len) * e.speed * dt;
        e.y += (dy / len) * e.speed * dt;
      });
    }

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
    if (!state.player.downed && state.hitCooldown <= 0 && state.player.invincibleTimer <= 0) {
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
        state.player.invincibleTimer = INVINCIBLE_AFTER_HIT_SEC;
        state.hitCooldown = 0.45;
        fieldEl.classList.add("hurt");
        window.setTimeout(() => fieldEl.classList.remove("hurt"), 110);
        if (state.player.hp <= 0) {
          if (state.room.enabled) {
            downPlayer();
          } else {
            state.player.hp = 0;
            triggerGameOver("defeat");
          }
        }
      }
    }

    if (state.room.enabled && hostAuthority && !state.gameOver) {
      const teammates = visibleTeammates();
      const expectedRemote = Math.max(0, effectivePlayerCount() - 1);
      const remoteStatusReady = teammates.length >= expectedRemote;
      const allRemoteDowned = teammates.every((mate) => mate.downed);
      if (state.player.downed && remoteStatusReady && allRemoteDowned) {
        triggerGameOver("party-wipe");
        render();
        return;
      }
    }

    for (let oi = state.orbs.length - 1; oi >= 0; oi -= 1) {
      const o = state.orbs[oi];
      o.pickupDelay = Math.max(0, Number(o.pickupDelay || 0) - dt);
      const dx = state.player.x - o.x;
      const dy = state.player.y - o.y;
      const d2 = dx * dx + dy * dy;

      if (o.pickupDelay <= 0 && d2 < state.player.orbMagnetRange * state.player.orbMagnetRange) {
        const len = Math.hypot(dx, dy) || 1;
        const pull = state.player.orbPullBase + (state.player.orbMagnetRange - Math.sqrt(d2)) * 1.6;
        o.x += (dx / len) * pull * dt;
        o.y += (dy / len) * pull * dt;
      }

      if (o.pickupDelay <= 0 && !state.player.downed && distanceSq(state.player, o) <= (state.player.radius + o.radius) ** 2) {
        if (o.kind === "heal") {
          const healAmount = Math.max(16, state.player.maxHp * (Number(o.value) || 0.2) * clamp(state.player.healItemMul || 1, 0.1, 8));
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
          messageEl.textContent = t(`回復アイテム取得 +${Math.round(healAmount)}HP`, `회복 아이템 획득 +${Math.round(healAmount)}HP`);
        } else {
          gainSharedXp(o.value);
        }
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

  function toggleSoloPause() {
    if (!state.running || state.gameOver) return;
    if (state.room.enabled) {
      messageEl.textContent = "ポーズはソロ時のみ使用できます";
      return;
    }
    if (state.pausedForAugment || state.shop.open || state.betweenWaves) return;

    state.manualPaused = !state.manualPaused;
    state.keys.clear();
    state.fairySkillHeld = false;
    state.fairySkillTimer = 0;

    if (state.manualPaused) {
      setOverlay(t("一時停止", "일시정지"));
      messageEl.textContent = t("一時停止中 (Pで再開)", "일시정지 중 (P로 재개)");
    } else {
      setOverlay("");
      messageEl.textContent = "再開しました";
    }
    render();
  }

  function onKeyDown(e) {
    if (e.isComposing || isEditableTarget(e.target)) return;

    const key = e.key.toLowerCase();
    const isSkillKey = e.code === "Space";

    if (key === "p") {
      toggleSoloPause();
      e.preventDefault();
      return;
    }

    if (state.manualPaused) {
      e.preventDefault();
      return;
    }

    if (state.gacha.open) {
      if (key === "escape") {
        hideGachaPanel();
      } else if (key === "1" || key === "enter") {
        rollBankGacha();
      } else if (key === "2") {
        rollBankGacha(10);
      }
      e.preventDefault();
      return;
    }

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
      if ((key === " " || key === "enter") && e.repeat) {
        e.preventDefault();
        return;
      }

      if (isShopWaitingForHost()) {
        if (key === "enter" || key === " " || key === "n" || key === "4") {
          closeShopAndStartNextWave();
          e.preventDefault();
        } else if (key === "escape") {
          e.preventDefault();
        }
        return;
      }

      if (/^[1-9]$/.test(key) && e.shiftKey) {
        const lockIndex = Number(key) - 1;
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = clamp(lockIndex, 0, Math.max(0, state.shop.offers.length - 1));
        toggleShopOfferLock(lockIndex);
        e.preventDefault();
        return;
      }

      if (/^[1-9]$/.test(key)) {
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
        } else {
          if (state.shop.actionIndex === 0) {
            rerollShop();
          } else {
            closeShopAndStartNextWave();
          }
        }
        e.preventDefault();
        return;
      }

      if (key === "l" || key === "f") {
        state.shop.focusArea = "offers";
        state.shop.selectedIndex = clamp(state.shop.selectedIndex, 0, Math.max(0, state.shop.offers.length - 1));
        toggleShopOfferLock(state.shop.selectedIndex);
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

    if (isSkillKey) {
      if (state.characterId === "fairy") {
        if (!e.repeat) {
          state.fairySkillHeld = true;
          state.fairySkillTimer = 0;
        }
      } else if (!e.repeat) {
        castDefaultBlastSkill();
      }
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
    const key = e.key.toLowerCase();
    if (e.code === "Space") {
      state.fairySkillHeld = false;
      state.fairySkillTimer = 0;
    }
    state.keys.delete(key);
  }

  function startGame({ fromRemote = false } = {}) {
    if (state.room.enabled && state.room.locked && !fromRemote) {
      messageEl.textContent = state.room.lockMessage || "ホストの開始を待っています...";
      return;
    }

    if (state.room.enabled && fromRemote) {
      state.room.locked = false;
      state.room.lockMessage = "";
      if (startBtn) {
        startBtn.disabled = false;
      }
    }

    const spawn = centerSpawnPoint();
    state.running = true;
    state.gameOver = false;
    state.gacha.open = false;
    state.pausedForAugment = false;
    state.manualPaused = false;
    resetWeaponSlots();
    resetPlayerBaseStats(spawn);
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
    state.shop.openedWave = 0;
    state.shop.rerollCost = 10;
    state.shop.offers = [];
    state.shop.carryLockedOffers = [];
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
    state.magicTimer = 0.25;
    syncShockKnuckleTimers(true);
    state.fairySkillHeld = false;
    state.fairySkillTimer = 0;
    state.healPickupTimer = nextHealPickupDelay();
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
    state.augment.pendingRewards = 0;
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

    if (state.room.enabled && state.room.role === "host" && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function enterStandby() {
    const spawn = centerSpawnPoint();
    if (state.running || state.coins > 0) {
      stashRunCoins("leave");
    }
    state.running = false;
    state.gameOver = true;
    state.gacha.open = false;
    state.pausedForAugment = false;
    state.manualPaused = false;
    resetWeaponSlots();
    state.keys.clear();
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    resetPlayerBaseStats(spawn);
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
    state.augment.pendingRewards = 0;
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
    state.fireTimer = 0;
    state.meleeTimer = 0;
    state.magicTimer = 0;
    state.weapons.shockKnuckleTimers = [];
    state.fairySkillHeld = false;
    state.fairySkillTimer = 0;
    state.healPickupTimer = 0;
    state.hitCooldown = 0;
    state.coins = 0;
    state.shop.open = false;
    state.shop.openedWave = 0;
    state.shop.rerollCost = 10;
    state.shop.offers = [];
    state.shop.carryLockedOffers = [];
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
  pauseBtn?.addEventListener("click", () => {
    toggleSoloPause();
  });
  statsToggleBtn?.addEventListener("click", () => {
    const canInspectStats = state.manualPaused || state.shop.open || !state.running || state.gameOver;
    if (!canInspectStats) {
      messageEl.textContent = "ステータス表示はポーズ中かショップ中のみ切替できます";
      return;
    }
    state.statsPanelMode = state.statsPanelMode === "main" ? "sub" : "main";
    applyStatsPanelVisibility();
  });
  remakeBtn?.addEventListener("click", () => {
    if (!state.gameOver && !state.manualPaused) {
      messageEl.textContent = "リスタートはポーズ中かゲームオーバー時に使用できます";
      return;
    }
    enterStandby();
    messageEl.textContent = "リスタート準備完了: GAME STARTで開始";
  });
  gachaBtn?.addEventListener("click", () => openGachaPanel());
  gachaDraw1Btn?.addEventListener("click", () => {
    rollBankGacha();
    renderGachaPanel();
  });
  gachaDraw10Btn?.addEventListener("click", () => {
    rollBankGacha(10);
    renderGachaPanel();
  });
  gachaCloseBtn?.addEventListener("click", () => {
    hideGachaPanel();
    render();
  });
  equippedWeaponsTextEl?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const slotIndex = Number.parseInt(target.dataset.slotIndex || "-1", 10);
    if (!Number.isFinite(slotIndex) || slotIndex < 0) return;
    if (!state.weapons.equipped[slotIndex]) return;
    state.selectedFusionWeaponIndex = state.selectedFusionWeaponIndex === slotIndex ? null : slotIndex;
    weaponFusionListEl.dataset.renderKey = "";
    render();
  });
  weaponFusionListEl?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (!state.shop.open) {
      messageEl.textContent = t("合成はショップ中のみ可能です", "합성은 상점에서만 가능합니다");
      renderWeaponFusionPanel();
      return;
    }
    const weaponId = target.dataset.weaponId;
    const slotIndex = Number.parseInt(target.dataset.slotIndex || "-1", 10);
    if (!weaponId || !WEAPON_DEFS[weaponId] || !Number.isFinite(slotIndex) || slotIndex < 0) return;
    ensureWeaponRarityState(state);
    const beforeRarity = getWeaponSlotRarity(state, slotIndex);
    const maxed = weaponRarityRank(beforeRarity) >= WEAPON_RARITY_ORDER.length - 1;
    if (maxed) {
      messageEl.textContent = t("これ以上は合成できません", "더 이상 합성할 수 없습니다");
      renderWeaponFusionPanel();
      return;
    }

    const duplicateReady = weaponCountById(state, weaponId) >= 2;
    const rarityReady = hasMatchingWeaponRarity(state, weaponId, beforeRarity);
    if (!duplicateReady && !rarityReady) {
      messageEl.textContent = t("同武器2本または同レア条件が必要です", "동일 무기 2개 또는 동급 조건이 필요합니다");
      renderWeaponFusionPanel();
      return;
    }

    const fused = fuseWeaponRarityAtSlot(state, slotIndex, { requireMatchingRarity: !duplicateReady });
    if (!fused.upgraded) {
      messageEl.textContent = t("合成条件を満たしていません", "합성 조건을 만족하지 않습니다");
      renderWeaponFusionPanel();
      return;
    }

    if (duplicateReady) {
      let removeAt = -1;
      for (let i = 0; i < state.weapons.equipped.length; i += 1) {
        if (i === slotIndex) continue;
        if (state.weapons.equipped[i] === weaponId) {
          removeAt = i;
          break;
        }
      }
      if (removeAt >= 0) {
        removeWeaponSlot(state, removeAt);
      }
      if (removeAt >= 0 && removeAt < slotIndex) {
        state.selectedFusionWeaponIndex = slotIndex - 1;
      } else {
        state.selectedFusionWeaponIndex = slotIndex;
      }
    }

    messageEl.textContent = `${WEAPON_DEFS[weaponId].title} ${t("合成成功", "합성 성공")}: ${getWeaponRarityLabel(fused.before)} -> ${getWeaponRarityLabel(fused.after)}`;
    weaponFusionListEl.dataset.renderKey = "";
    render();
  });
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    if (state.room.enabled) {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });
  shopRerollBtn?.addEventListener("click", () => rerollShop());
  shopNextBtn?.addEventListener("click", () => closeShopAndStartNextWave());

  enterStandby();
  configureStatsPanelGroups();
  applyStatsPanelVisibility();
  syncCharacterFromSelection();
  void pullCloudProfile();

  return {
    startNewGame: ({ fromRemote = false } = {}) => startGame({ fromRemote }),
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
          if (tryStartNextWaveWhenAllReady()) {
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
          if (tryStartNextWaveWhenAllReady()) {
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

      if (move.kind === "survivors-xp-gain") {
        if (!state.room.enabled) return;
        gainSharedXp(move.amount, { fromRemote: true });
        if (!state.running) {
          render();
        }
        return;
      }

      if (move.kind !== "survivors-pos") return;
      const prevMate = state.room.teammates.get(move.remoteId);
      const nextX = Number.isFinite(move.x) ? move.x : state.player.x;
      const nextY = Number.isFinite(move.y) ? move.y : state.player.y;
      const nextMate = {
        x: nextX,
        y: nextY,
        renderX: Number.isFinite(prevMate?.renderX) ? prevMate.renderX : (Number.isFinite(prevMate?.x) ? prevMate.x : nextX),
        renderY: Number.isFinite(prevMate?.renderY) ? prevMate.renderY : (Number.isFinite(prevMate?.y) ? prevMate.y : nextY),
        downed: Boolean(move.downed),
        frameSrc: typeof move.frameSrc === "string" ? move.frameSrc : "",
        characterId: typeof move.characterId === "string" ? move.characterId : "",
        attacking: Boolean(move.attacking),
        movingUp: Boolean(move.movingUp),
        movingDown: Boolean(move.movingDown),
        movingLeft: Boolean(move.movingLeft),
        movingRight: Boolean(move.movingRight),
        seenAt: performance.now(),
      };
      state.room.teammates.set(move.remoteId, nextMate);
      const startedAttack = !Boolean(prevMate?.attacking) && Boolean(nextMate.attacking);
      if (startedAttack && !nextMate.downed) {
        spawnAllyAttackFx(nextMate);
      }
      if (!state.running) {
        render();
      }
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
    setCloudAuth: (auth = null, cloudProfile = null) => {
      setCloudAuthScope(auth, cloudProfile);
    },
  };
}
