// My Garden: tilling, planting, watering, weeds & bugs, fertilizer, harvest (with ★gold crops),
// decorations, the garden shop, cooking, daily orders, the crop dex and garden levels.
// Everything is decided here; clients only draw what they are sent.
import crypto from "node:crypto";
import {
  CROPS, RECIPES, addAme, bump, dailyOf, dayKey, economy, ensureGarden, gardenLevelOf, gardens, players, scheduleSave,
} from "./town-data.mjs";
import {
  careRatio, gardenSizeFor, isDoorTile, isGuarded, isSprinkled, maxPlotsFor, projectCrop, seasonOf, stageOf,
} from "../apps/web/src/games/town/shared/gardenRules.mjs";

const G = economy.garden;
const FERTS = new Map(G.ferts.map((f) => [f.id, f]));
const TOOLS = new Map(G.tools.map((t) => [t.id, t]));
const ITEMS = new Map(G.items.map((i) => [i.id, i]));
const FREE_DECOS = new Set(G.decos);
const RARE_CROPS = G.crops.filter((c) => c.rare);
const COUNTS = [1, 5, 10];
const nowTs = () => Date.now();

export function gardenIdOfArea(area) {
  const match = /^garden:([0-9a-f]{16})$/.exec(String(area || ""));
  return match ? match[1] : "";
}

function env(garden, plot, now) {
  return { sprinkled: isSprinkled(garden.decos, plot.x, plot.y, G), season: seasonOf(now) };
}

/** Bring a plot's crop up to `at` (growth, care, ripening). */
function applyGrowth(garden, plot, at) {
  const crop = plot.crop;
  if (!crop || crop.ripeAt) return false;
  const cropCfg = CROPS.get(crop.id);
  const p = projectCrop(plot, at, cropCfg, G, env(garden, plot, at));
  crop.growth = p.growth;
  crop.careWet = p.careWet;
  crop.careDry = p.careDry;
  crop.calcAt = at;
  if (p.ripe) {
    crop.ripeAt = p.ripeAt;
    return true;
  }
  return false;
}

/**
 * Advance every plot to `now`: weeds and bugs may appear every pest interval while a crop grows
 * (a weed slows growth from that moment, a bug costs one crop at harvest). Returns true when
 * something visible changed.
 */
export function advanceGarden(garden, now) {
  let changed = false;
  for (const plot of garden.plots) {
    if (!plot.crop) continue;
    let checks = 0;
    while (!plot.crop.ripeAt && plot.pestAt + G.pestIntervalMs <= now && checks < 12) {
      const at = plot.pestAt + G.pestIntervalMs;
      if (applyGrowth(garden, plot, at)) changed = true;
      plot.pestAt = at;
      checks += 1;
      if (plot.crop.ripeAt) break;
      if (!plot.weed && Math.random() < G.weedChance) {
        plot.weed = true;
        changed = true;
      }
      const stage = stageOf(plot.crop.growth / CROPS.get(plot.crop.id).growMs, false);
      if (!plot.bug && stage >= 2 && !isGuarded(garden.decos, plot.x, plot.y, G) && Math.random() < G.bugChance) {
        plot.bug = true;
        changed = true;
      }
    }
    // Far behind (garden unvisited for hours): skip ahead instead of rolling for every missed interval.
    if (plot.pestAt + G.pestIntervalMs <= now) plot.pestAt = now;
    if (applyGrowth(garden, plot, now)) changed = true;
  }
  if (changed) scheduleSave();
  return changed;
}

export function publicGarden(garden, now = nowTs()) {
  const owner = players.get(garden.ownerId);
  const level = owner ? gardenLevelOf(owner) : 1;
  return {
    id: garden.id,
    owner: garden.owner,
    level,
    size: garden.size,
    maxPlots: maxPlotsFor(level, G),
    serverNow: now,
    season: seasonOf(now),
    plots: garden.plots.map((p) => ({
      x: p.x, y: p.y, wetUntil: p.wetUntil, weed: p.weed, bug: p.bug,
      crop: p.crop ? { ...p.crop } : null,
    })),
    decos: garden.decos,
  };
}

export function listGardens(selfId, countIn) {
  return [...gardens.values()]
    .map((g) => {
      const owner = players.get(g.ownerId);
      return {
        id: g.id, owner: g.owner, level: owner ? gardenLevelOf(owner) : 1, plots: g.plots.length,
        growing: g.plots.filter((p) => p.crop).length, count: countIn(`garden:${g.id}`), mine: g.id === selfId, updatedAt: g.updatedAt,
      };
    })
    .filter((g) => g.mine || g.plots > 0 || g.count > 0)
    .sort((a, b) => Number(b.mine) - Number(a.mine) || b.count - a.count || b.level - a.level || b.updatedAt - a.updatedAt)
    .slice(0, 40);
}

// ------------------------------------------------------------ xp & levels

/** Add garden XP; on level-up the garden grows and the player is told what unlocked. */
function gainXp(ctx, ws, player, amount) {
  if (amount <= 0) return;
  const before = gardenLevelOf(player);
  player.gp.xp += Math.round(amount);
  const after = gardenLevelOf(player);
  if (after <= before) return;
  const unlocks = [
    ...G.crops.filter((c) => !c.rare && c.unlock > before && c.unlock <= after).map((c) => `${c.emoji}${c.label}のたね`),
    ...G.recipes.filter((r) => r.unlock > before && r.unlock <= after).map((r) => `${r.emoji}${r.label}のレシピ`),
    ...G.tools.filter((t) => t.unlock > before && t.unlock <= after).map((t) => `${t.emoji}${t.label}`),
    ...G.items.filter((i) => i.unlock > before && i.unlock <= after).map((i) => `${i.emoji}${i.label}`),
    ...G.ferts.filter((f) => f.unlock && f.unlock > before && f.unlock <= after).map((f) => `${f.emoji}${f.label}`),
  ];
  const oldSize = gardenSizeFor(before, G);
  const newSize = gardenSizeFor(after, G);
  if (newSize > oldSize) unlocks.push(`ガーデンが ${newSize}×${newSize} に広がった`);
  const garden = gardens.get(player.id);
  if (garden && garden.size < newSize) {
    garden.size = newSize;
    ctx.broadcastGarden(garden);
  }
  ctx.send(ws, { type: "town-garden-levelup", level: after, unlocks });
}

// ------------------------------------------------------------ helpers

function plotAt(garden, x, y) {
  return garden.plots.find((p) => p.x === x && p.y === y) || null;
}

function decoAt(garden, x, y) {
  return garden.decos.find((d) => d.x === x && d.y === y) || null;
}

function around(garden, x, y) {
  return garden.plots.filter((p) => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1);
}

function tileOf(payload) {
  const x = Math.floor(Number(payload.x));
  const y = Math.floor(Number(payload.y));
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function randInt(lo, hi) {
  return lo + crypto.randomInt(hi - lo + 1);
}

function addGoods(bag, id, n) {
  bag[id] = Math.min(9999, (bag[id] || 0) + n);
}

function takeGoods(bag, id, n) {
  bag[id] -= n;
  if (bag[id] <= 0) delete bag[id];
}

/** Thanks for helping in someone else's garden: a little アメ (capped per day) and garden XP. */
function helpReward(ctx, ws, player, garden, count) {
  if (!player || garden.ownerId === player.id || count <= 0) return;
  const daily = dailyOf(player);
  daily.gardenHelp = daily.gardenHelp || 0;
  const got = Math.min(G.helpAme * count, Math.max(0, G.helpDailyCap - daily.gardenHelp));
  daily.gardenHelp += got;
  player.gp.helped += count;
  gainXp(ctx, ws, player, G.xp.help * count);
  if (got > 0) ctx.earn(ws, player, got, "おてつだいのお礼");
  bump(player, "gardenHelp", count);
  // Tell the owner, if they're around.
  const ownerWs = ctx.socketOf(garden.ownerId);
  if (ownerWs) ctx.send(ownerWs, { type: "town-garden-news", text: `${player.name} さんがガーデンをおてつだいしてくれました` });
}

// ------------------------------------------------------------ actions in a garden

/**
 * `op` in: till, untill, plant, water, weed, fert, harvest, harvestAll, decoPlace, decoRemove.
 * Watering and weeding are open to visitors; the rest is for the owner.
 */
export function handleGardenAct(ctx, ws, player, area, payload, now) {
  const garden = gardens.get(gardenIdOfArea(area));
  if (!garden) return ctx.error(ws, "NO_GARDEN");
  const op = String(payload.op || "");
  const isOwner = garden.ownerId === player.id;
  const ownerOnly = !["water", "weed"].includes(op);
  if (ownerOnly && !isOwner) return ctx.error(ws, "NOT_GARDEN_OWNER");
  advanceGarden(garden, now);
  const tile = tileOf(payload);
  const level = gardenLevelOf(players.get(garden.ownerId) || player);
  const fx = [];
  let reply = "";

  const inside = tile && tile[0] >= 0 && tile[1] >= 0 && tile[0] < garden.size && tile[1] < garden.size;
  const needTile = !["harvestAll"].includes(op);
  if (needTile && !inside) return ctx.error(ws, "BAD_OP");
  const [x, y] = tile || [0, 0];
  const plot = inside ? plotAt(garden, x, y) : null;

  switch (op) {
    case "till": {
      if (plot) return ctx.error(ws, "ALREADY_TILLED");
      if (decoAt(garden, x, y) || isDoorTile(garden.size, x, y)) return ctx.error(ws, "CANT_TILL");
      if (garden.plots.length >= maxPlotsFor(level, G)) return ctx.error(ws, "PLOT_LIMIT");
      garden.plots.push({ x, y, wetUntil: 0, weed: false, bug: false, pestAt: now, crop: null });
      gainXp(ctx, ws, player, G.xp.till);
      fx.push({ x, y, kind: "dust" });
      break;
    }
    case "untill": {
      if (!plot) return ctx.error(ws, "NO_PLOT");
      garden.plots = garden.plots.filter((p) => p !== plot);
      fx.push({ x, y, kind: "dust" });
      break;
    }
    case "plant": {
      if (!plot) return ctx.error(ws, "NO_PLOT");
      if (plot.crop) return ctx.error(ws, "PLOT_BUSY");
      const seed = String(payload.crop || "");
      let cropId = seed;
      if (seed === "mystery") {
        if (player.gp.mystery <= 0) return ctx.error(ws, "NO_SEED");
        player.gp.mystery -= 1;
        cropId = RARE_CROPS[crypto.randomInt(RARE_CROPS.length)].id;
      } else {
        const cfg = CROPS.get(seed);
        if (!cfg || cfg.rare) return ctx.error(ws, "NO_SEED");
        if (cfg.unlock > level) return ctx.error(ws, "LOCKED");
        if ((player.seeds[seed] || 0) <= 0) return ctx.error(ws, "NO_SEED");
        takeGoods(player.seeds, seed, 1);
      }
      plot.crop = { id: cropId, plantedAt: now, growth: 0, calcAt: now, fert: "", careWet: 0, careDry: 0, ripeAt: 0 };
      plot.weed = false;
      plot.bug = false;
      plot.pestAt = now;
      bump(player, "plant");
      gainXp(ctx, ws, player, 1);
      fx.push({ x, y, kind: "seed" });
      reply = seed === "mystery" ? "ふしぎなたね を植えました…なにが育つかな？" : `${CROPS.get(cropId).emoji} ${CROPS.get(cropId).label} を植えました`;
      break;
    }
    case "water": {
      const bigcan = Boolean(payload.area) && player.gp.tools.includes("bigcan");
      const targets = bigcan ? around(garden, x, y) : plot ? [plot] : [];
      let watered = 0;
      for (const p of targets) {
        if (!p.crop || p.crop.ripeAt) continue;
        // Still well soaked: watering again would do nothing.
        if ((p.wetUntil || 0) - now > G.wetMs * 0.5 || isSprinkled(garden.decos, p.x, p.y, G)) continue;
        applyGrowth(garden, p, now);
        p.wetUntil = now + G.wetMs;
        watered += 1;
        fx.push({ x: p.x, y: p.y, kind: "water" });
      }
      if (watered === 0) return ctx.error(ws, targets.some((p) => p.crop && !p.crop.ripeAt) ? "STILL_WET" : "NOTHING_TO_WATER");
      bump(player, "water", watered);
      if (isOwner) gainXp(ctx, ws, player, G.xp.water * Math.min(watered, 3));
      else helpReward(ctx, ws, player, garden, watered);
      break;
    }
    case "weed": {
      const sickle = Boolean(payload.area) && player.gp.tools.includes("sickle");
      const targets = sickle ? around(garden, x, y) : plot ? [plot] : [];
      let cleared = 0;
      for (const p of targets) {
        if (!p.weed && !p.bug) continue;
        applyGrowth(garden, p, now);
        cleared += (p.weed ? 1 : 0) + (p.bug ? 1 : 0);
        p.weed = false;
        p.bug = false;
        fx.push({ x: p.x, y: p.y, kind: "leaf" });
      }
      if (cleared === 0) return ctx.error(ws, "NO_WEED");
      bump(player, "weed", cleared);
      if (isOwner) gainXp(ctx, ws, player, G.xp.weed * cleared);
      else helpReward(ctx, ws, player, garden, cleared);
      break;
    }
    case "fert": {
      const fert = FERTS.get(String(payload.fert || ""));
      if (!plot || !plot.crop) return ctx.error(ws, "PLOT_EMPTY");
      if (!fert) return ctx.error(ws, "BAD_OP");
      if (plot.crop.ripeAt) return ctx.error(ws, "ALREADY_RIPE");
      if (plot.crop.fert) return ctx.error(ws, "ALREADY_FERT");
      if ((player.gp.ferts[fert.id] || 0) <= 0) return ctx.error(ws, "NO_FERT");
      applyGrowth(garden, plot, now);
      takeGoods(player.gp.ferts, fert.id, 1);
      plot.crop.fert = fert.id;
      fx.push({ x, y, kind: "sparkle" });
      reply = `${fert.emoji} ${fert.label} をまきました`;
      break;
    }
    case "harvest":
    case "harvestAll": {
      if (op === "harvestAll" && !player.gp.tools.includes("basket")) return ctx.error(ws, "NEED_BASKET");
      const targets = op === "harvestAll" ? garden.plots.filter((p) => p.crop?.ripeAt) : plot?.crop?.ripeAt ? [plot] : [];
      if (targets.length === 0) return ctx.error(ws, plot?.crop ? "NOT_RIPE" : "PLOT_EMPTY");
      const summary = new Map();
      let goldTotal = 0;
      let seedsBack = 0;
      let mystery = 0;
      let compost = 0;
      let xp = 0;
      for (const p of targets) {
        const crop = p.crop;
        const cfg = CROPS.get(crop.id);
        if (now >= crop.ripeAt + G.witherMs) {
          // Left too long: it withered, but still makes compost.
          addGoods(player.gp.ferts, "compost", 1);
          compost += 1;
          p.crop = null;
          p.weed = false;
          p.bug = false;
          fx.push({ x: p.x, y: p.y, kind: "leaf" });
          continue;
        }
        const fert = crop.fert ? FERTS.get(crop.fert) : null;
        const amount = Math.max(1, randInt(cfg.yield[0], cfg.yield[1]) + (fert?.yieldBonus || 0) - (p.bug ? 1 : 0));
        const goldChance = G.goldBase + (careRatio(crop.careWet || 0, crop.careDry || 0) >= 0.8 ? G.goldCare : 0) + (fert?.goldBonus || 0);
        let gold = 0;
        for (let i = 0; i < amount; i += 1) if (Math.random() < goldChance) gold += 1;
        if (amount - gold > 0) addGoods(player.goods, cfg.id, amount - gold);
        if (gold > 0) addGoods(player.gp.gold, cfg.id, gold);
        goldTotal += gold;
        if (!cfg.rare && Math.random() < G.seedBackChance) {
          addGoods(player.seeds, cfg.id, 1);
          seedsBack += 1;
        }
        if (Math.random() < G.mysteryChance) {
          player.gp.mystery = Math.min(9999, player.gp.mystery + 1);
          mystery += 1;
        }
        const entry = player.gp.dex[cfg.id] || { n: 0, gold: 0 };
        player.gp.dex[cfg.id] = { n: entry.n + amount, gold: entry.gold + gold };
        summary.set(cfg.id, (summary.get(cfg.id) || 0) + amount);
        xp += (cfg.xp || 3) + amount;
        p.crop = null;
        p.weed = false;
        p.bug = false;
        fx.push({ x: p.x, y: p.y, kind: gold ? "gold" : "harvest", text: `${cfg.emoji}+${amount}` });
      }
      const harvested = [...summary.values()].reduce((a, b) => a + b, 0);
      if (harvested > 0) bump(player, "harvest", targets.length - compost);
      gainXp(ctx, ws, player, xp);
      const parts = [...summary.entries()].map(([id, n]) => `${CROPS.get(id).emoji}${CROPS.get(id).label}×${n}`);
      if (goldTotal) parts.push(`★きん×${goldTotal}`);
      if (seedsBack) parts.push(`たね×${seedsBack}`);
      if (mystery) parts.push("ふしぎなたね！");
      if (compost) parts.push(`たいひ×${compost}（かれていた）`);
      reply = `🧺 ${parts.join("・")}`;
      break;
    }
    case "decoPlace": {
      const kind = String(payload.kind || "");
      const isItem = ITEMS.has(kind);
      if (!FREE_DECOS.has(kind) && !isItem) return ctx.error(ws, "BAD_OP");
      if (plot || decoAt(garden, x, y) || isDoorTile(garden.size, x, y)) return ctx.error(ws, "CANT_PLACE");
      if (garden.decos.length >= G.maxDecos) return ctx.error(ws, "DECO_LIMIT");
      if (isItem) {
        if ((player.gp.items[kind] || 0) <= 0) return ctx.error(ws, "NO_ITEM");
        takeGoods(player.gp.items, kind, 1);
      }
      // Plots newly next to a sprinkler: bank their growth first so the change applies from now.
      for (const p of garden.plots) applyGrowth(garden, p, now);
      garden.decos.push({ kind, x, y });
      fx.push({ x, y, kind: "dust" });
      break;
    }
    case "decoRemove": {
      const deco = decoAt(garden, x, y);
      if (!deco) return ctx.error(ws, "NOTHING");
      for (const p of garden.plots) applyGrowth(garden, p, now);
      garden.decos = garden.decos.filter((d) => d !== deco);
      if (ITEMS.has(deco.kind)) addGoods(player.gp.items, deco.kind, 1);
      fx.push({ x, y, kind: "dust" });
      break;
    }
    default:
      return ctx.error(ws, "BAD_OP");
  }
  garden.updatedAt = now;
  scheduleSave();
  ctx.broadcastGarden(garden, fx);
  ctx.send(ws, { type: "town-garden-done", op, label: reply });
  ctx.sendWallet(ws);
}

// ------------------------------------------------------------ shop, selling, cooking

export function handleGardenShop(ctx, ws, player, payload) {
  const what = String(payload.what || "");
  const id = String(payload.id || "");
  const count = COUNTS.includes(Number(payload.count)) ? Number(payload.count) : 1;
  const level = gardenLevelOf(player);
  const pay = (price) => {
    if (player.ame < price) {
      ctx.error(ws, "NOT_ENOUGH_AME");
      return false;
    }
    addAme(player, -price);
    return true;
  };
  let label = "";
  if (what === "seed") {
    const crop = CROPS.get(id);
    if (!crop || crop.rare) return;
    if (crop.unlock > level) return ctx.error(ws, "LOCKED");
    if (crop.season && crop.season !== seasonOf(nowTs())) return ctx.error(ws, "OUT_OF_SEASON");
    if (!pay(crop.seedPrice * count)) return;
    addGoods(player.seeds, id, count);
    label = `${crop.emoji} ${crop.label}のたね ×${count}`;
  } else if (what === "fert") {
    const fert = FERTS.get(id);
    if (!fert || !fert.price) return;
    if ((fert.unlock || 1) > level) return ctx.error(ws, "LOCKED");
    if (!pay(fert.price * count)) return;
    addGoods(player.gp.ferts, id, count);
    label = `${fert.emoji} ${fert.label} ×${count}`;
  } else if (what === "tool") {
    const tool = TOOLS.get(id);
    if (!tool) return;
    if (tool.unlock > level) return ctx.error(ws, "LOCKED");
    if (player.gp.tools.includes(id)) return ctx.error(ws, "ALREADY_OWNED");
    if (!pay(tool.price)) return;
    player.gp.tools.push(id);
    label = `${tool.emoji} ${tool.label}`;
  } else if (what === "item") {
    const item = ITEMS.get(id);
    if (!item) return;
    if (item.unlock > level) return ctx.error(ws, "LOCKED");
    if (!pay(item.price)) return;
    addGoods(player.gp.items, id, 1);
    label = `${item.emoji} ${item.label}`;
  } else {
    return;
  }
  scheduleSave();
  ctx.send(ws, { type: "town-garden-done", op: "buy", label });
  ctx.sendWallet(ws);
}

/** Sell harvested crops (normal or ★gold, which sells for 5×) and dishes. */
export function handleGardenSell(ctx, ws, player, payload) {
  const kind = String(payload.kind || "crop");
  const id = String(payload.id || "");
  const bag = kind === "gold" ? player.gp.gold : kind === "dish" ? player.gp.dishes : player.goods;
  const def = kind === "dish" ? RECIPES.get(id) : CROPS.get(id);
  if (!def) return;
  const have = bag[id] || 0;
  const count = payload.all ? have : Math.min(have, Math.max(0, Math.floor(Number(payload.count) || 0)));
  if (count <= 0) return ctx.error(ws, "NO_GOODS");
  takeGoods(bag, id, count);
  const unit = kind === "gold" ? def.sell * 5 : def.sell;
  const total = unit * count;
  addAme(player, total);
  bump(player, "sell");
  scheduleSave();
  const name = `${kind === "gold" ? "★" : ""}${def.emoji} ${def.label}`;
  ctx.send(ws, { type: "town-ame", delta: total, reason: `${def.label}を売った`, ame: player.ame });
  ctx.send(ws, { type: "town-garden-done", op: "sell", label: `${name} ×${count}`, total });
  ctx.sendWallet(ws);
}

export function handleGardenCook(ctx, ws, player, payload) {
  const recipe = RECIPES.get(String(payload.id || ""));
  if (!recipe) return;
  if (recipe.unlock > gardenLevelOf(player)) return ctx.error(ws, "LOCKED");
  for (const [crop, n] of Object.entries(recipe.ingredients)) {
    if ((player.goods[crop] || 0) < n) return ctx.error(ws, "MISSING_INGREDIENTS");
  }
  for (const [crop, n] of Object.entries(recipe.ingredients)) takeGoods(player.goods, crop, n);
  addGoods(player.gp.dishes, recipe.id, 1);
  player.gp.cooked[recipe.id] = Math.min(9999, (player.gp.cooked[recipe.id] || 0) + 1);
  bump(player, "cook");
  gainXp(ctx, ws, player, G.xp.cook);
  scheduleSave();
  ctx.send(ws, { type: "town-garden-done", op: "cook", label: `${recipe.emoji} ${recipe.label} ができた！` });
  ctx.sendWallet(ws);
}

// ------------------------------------------------------------ daily orders

function seededRandom(seed) {
  let s = crypto.createHash("sha256").update(seed).digest().readUInt32LE(0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeOrder(player, random, index) {
  const level = gardenLevelOf(player);
  const crops = G.crops.filter((c) => !c.rare && c.unlock <= level);
  const dishes = G.recipes.filter((r) => r.unlock <= level);
  const pickFrom = (list) => list[Math.floor(random() * list.length)];
  const needs = {};
  const lines = 1 + Math.floor(random() * Math.min(3, 1 + level / 3));
  for (let i = 0; i < lines; i += 1) {
    const useDish = dishes.length > 0 && random() < 0.3;
    if (useDish) {
      const d = pickFrom(dishes);
      needs[d.id] = (needs[d.id] || 0) + 1 + Math.floor(random() * 2);
    } else {
      const c = pickFrom(crops);
      needs[c.id] = (needs[c.id] || 0) + 2 + Math.floor(random() * 4);
    }
  }
  let value = 0;
  let xp = 0;
  for (const [id, n] of Object.entries(needs)) {
    const def = CROPS.get(id) || RECIPES.get(id);
    value += def.sell * n;
    xp += (CROPS.get(id)?.xp || 6) * n;
  }
  return {
    id: `${dayKey()}-${index}-${Math.floor(random() * 1e6).toString(36)}`,
    needs,
    ame: Math.round(value * G.orders.rewardRate + G.orders.rewardBonus),
    xp: Math.round(xp * G.orders.xpRate) + G.xp.order,
    done: false,
  };
}

export function ordersOf(player) {
  const today = dayKey();
  if (!player.gp.orders || player.gp.orders.day !== today) {
    const random = seededRandom(`orders:${today}:${player.id}`);
    player.gp.orders = { day: today, refreshes: 0, list: Array.from({ length: G.orders.perDay }, (_, i) => makeOrder(player, random, i)) };
    scheduleSave();
  }
  return player.gp.orders;
}

export function handleGardenOrder(ctx, ws, player, payload) {
  const orders = ordersOf(player);
  const order = orders.list.find((o) => o.id === String(payload.id || ""));
  if (!order) return ctx.error(ws, "BAD_OP");
  if (payload.refresh) {
    if (order.done) return ctx.error(ws, "BAD_OP");
    if (player.ame < G.orders.refreshCost) return ctx.error(ws, "NOT_ENOUGH_AME");
    addAme(player, -G.orders.refreshCost);
    orders.refreshes += 1;
    const random = seededRandom(`orders:${orders.day}:${player.id}:r${orders.refreshes}:${crypto.randomBytes(4).toString("hex")}`);
    orders.list = orders.list.map((o) => (o === order ? makeOrder(player, random, orders.refreshes + 10) : o));
    scheduleSave();
    ctx.send(ws, { type: "town-garden-done", op: "order-refresh", label: "ちゅうもんを入れかえました" });
    ctx.sendWallet(ws);
    return;
  }
  if (order.done) return ctx.error(ws, "ALREADY_DONE");
  for (const [id, n] of Object.entries(order.needs)) {
    const bag = RECIPES.has(id) ? player.gp.dishes : player.goods;
    if ((bag[id] || 0) < n) return ctx.error(ws, "MISSING_GOODS");
  }
  for (const [id, n] of Object.entries(order.needs)) takeGoods(RECIPES.has(id) ? player.gp.dishes : player.goods, id, n);
  order.done = true;
  bump(player, "order");
  gainXp(ctx, ws, player, order.xp);
  scheduleSave();
  ctx.earn(ws, player, order.ame, "のうえんのちゅうもん");
  ctx.send(ws, { type: "town-garden-done", op: "order", label: `ちゅうもんをとどけた！ +${order.xp}けいけんち` });
  ctx.sendWallet(ws);
}

// ------------------------------------------------------------ dex rewards

export function dexPercent(player) {
  const found = G.crops.filter((c) => player.gp.dex[c.id]).length;
  return Math.floor((found / G.crops.length) * 100);
}

export function handleGardenDex(ctx, ws, player, payload) {
  const pct = Number(payload.pct);
  const milestone = G.dexMilestones.find((m) => m.pct === pct);
  if (!milestone || player.gp.dexClaimed.includes(pct)) return ctx.error(ws, "NOT_READY");
  if (dexPercent(player) < pct) return ctx.error(ws, "NOT_READY");
  player.gp.dexClaimed.push(pct);
  if (milestone.item) addGoods(player.gp.items, milestone.item, 1);
  if (milestone.fert) addGoods(player.gp.ferts, milestone.fert.id, milestone.fert.count);
  scheduleSave();
  ctx.earn(ws, player, milestone.ame, milestone.label);
  const extra = milestone.item ? ` と ${ITEMS.get(milestone.item).label}` : milestone.fert ? ` と ${FERTS.get(milestone.fert.id).label}×${milestone.fert.count}` : "";
  ctx.send(ws, { type: "town-garden-done", op: "dex", label: `${milestone.label} のごほうび${extra}` });
  ctx.sendWallet(ws);
}

/** Garden-specific parts of the wallet that change daily (orders) or are derived (dex %). */
export function gardenExtras(player) {
  return { orders: ordersOf(player), dexPct: dexPercent(player) };
}

export { ensureGarden };
