// Town client: owns local simulation (walking, actions, bubbles) and the
// WebSocket link to server/town-world.mjs. React only renders UI around it.
import { normalizeAvatar, type AvatarConfig } from "../avatar/parts";
import type { AvatarPose } from "../avatar/drawAvatar";
import { directionOf, type Direction8 } from "../avatar/draw/common";
import { actionDef, actionFromChat, isActionId, type ActionId } from "../avatar/actions";
import { buildGardenArea, emptyGarden, type GardenData } from "../world/garden";
import {
  AREAS, bedAt, buildRoomArea, objectsAt, emptyRoom, findPath, isAreaId, isGardenAreaId, isRoomAreaId, isStaticAreaId, isWalkable,
  movementHeightAt, pickTile, portalAt, seatAt, spotAt, type AreaDef, type AreaId, type SpotGame, type StaticAreaId,
} from "../world/areas";
import type { RoomData } from "../world/furniture";
import {
  avatarHitBox, computeCamera, renderArea, type Camera, type PlacementGhost, type RenderAvatar, type TileEffect,
} from "../world/render";

export type ConnectionStatus = "connecting" | "online" | "offline" | "replaced";
export type ChatLine = { id: string; name: string; text: string; at: number; system?: boolean };
export type RoomListing = {
  id: string; owner: string; title: string; count: number; items: number; goodPigg: number; mine: boolean;
};
export type Wallet = {
  ame: number;
  owned: { parts: string[]; furniture: string[] };
  rooms: Array<{ id: string; title: string; size: number; items: number }>;
  goodPigg: number;
  fishPoints: number;
  fishing: { rod: string; bait: string; rods: string[]; baits: Record<string, number> };
  fishLog: Record<string, { count: number; best: number }>;
  /** Casino items (consumables) by id. */
  items: Record<string, number>;
  seeds: Record<string, number>;
  goods: Record<string, number>;
  petFood: number;
  garden: GardenWallet;
  pets: Array<{ id: string; species: string; name: string; bond: number; level: number; hunger: number }>;
  activePet: string;
  missions: { list: QuestEntry[]; bonus: { reward: number; ready: boolean; claimed: boolean } };
  achievements: AchievementEntry[];
  today: { login: boolean; coinLogin: boolean; dress: boolean; onlineEarned: number; praiseReceived: number; praiseGiven: number; visits: number };
};

export type GardenOrder = { id: string; needs: Record<string, number>; ame: number; xp: number; done: boolean };
export type GardenWallet = {
  xp: number;
  level: number;
  dex: Record<string, { n: number; gold: number }>;
  cooked: Record<string, number>;
  dishes: Record<string, number>;
  /** ★gold crops (sell for 5×). */
  gold: Record<string, number>;
  ferts: Record<string, number>;
  tools: string[];
  items: Record<string, number>;
  mystery: number;
  dexClaimed: number[];
  helped: number;
  hasGarden: boolean;
  orders: { day: string; refreshes: number; list: GardenOrder[] };
  dexPct: number;
};
export type GardenListing = { id: string; owner: string; level: number; plots: number; growing: number; count: number; mine: boolean };

export type ScratchPrize =
  | { type: "ame"; amount: number; symbol: string }
  | { type: "item"; item: { kind: "part" | "furniture"; key?: string; id: string; label: string }; symbol: string };

/** One-off notifications for the UI (toasts, scratch results). */
export type TownEvent =
  | { type: "ame"; delta: number; reason: string; ame: number }
  | { type: "scratch"; cells: string[]; prize: ScratchPrize; ame: number }
  | { type: "bought"; label: string; roomId?: string }
  | { type: "spot"; game: SpotGame }
  | { type: "where"; found: FriendLocation[] }
  | { type: "profile"; name: string; avatar: AvatarConfig }
  | { type: "login-required"; expired: boolean }
  /** Casino coins to add to this browser's bank (the bank itself lives outside the town). */
  | { type: "coins"; delta: number; reason: string }
  | { type: "fish-cast"; castId: string; biteMs: number; rod: string; bait: string; power: number; speed: number; rarity: string; frame: number }
  | { type: "fish-caught"; fish: { id: string; label: string; emoji: string; rarity: string }; cm: number; points: number; perfect: number; isRecord: boolean }
  | { type: "fish-escaped" }
  /** A point-shop purchase went through; for the casino shop the page then takes the coins. */
  | { type: "shop-bought"; id: string; label: string; shop: "fishing" | "casino"; price: number }
  | { type: "pet-done"; op: string; id?: string; label?: string; gain?: number; hungry?: boolean; capped?: boolean }
  | { type: "garden-done"; op: string; label: string; total?: number; amount?: number }
  | { type: "garden-levelup"; level: number; unlocks: string[] }
  | { type: "garden-news"; text: string }
  /** Someone visited one of my rooms today — the "きたよ！" notification. */
  | { type: "room-guest"; roomTitle: string; name: string }
  | { type: "error"; text: string; code?: string };

/** Where a cloud friend currently is in town (best-effort: the friend ID is self-declared). */
export type FriendLocation = { friendId: string; area: string; channel: number };

/** Cloud login sent with `town-join`; the server checks it against the cloud API before linking the account. */
export type CloudAuth = { userId: string; password: string; sessionId: string };

export type TownIdentity = {
  /** Own friend ID (from the login), only used to hide "add friend" on yourself. */
  friendId: string;
  shareLocation: boolean;
  auth: CloudAuth | null;
};

export type MemberInfo = {
  id: string; name: string; avatar: AvatarConfig; goodPigg: number; roomId: string; gardenId: string; friendId: string; isSelf: boolean;
};

export type QuestEntry = { id: string; label: string; target: number; reward: number; progress: number; claimed: boolean };
export type AchievementEntry = QuestEntry & { desc: string };

export type TownSnapshot = {
  areaId: AreaId;
  areaName: string;
  channel: number;
  status: ConnectionStatus;
  memberCount: number;
  areaCounts: Partial<Record<StaticAreaId, number>>;
  chat: ChatLine[];
  selfRoomId: string;
  room: RoomData | null;
  isOwnRoom: boolean;
  rooms: RoomListing[];
  wallet: Wallet | null;
  garden: GardenData | null;
  isOwnGarden: boolean;
  selfGardenId: string;
  gardens: GardenListing[];
  /** Server clock minus local clock, measured when the garden arrived. */
  clockOffset: number;
};

type Member = {
  id: string;
  name: string;
  avatar: AvatarConfig;
  x: number;
  y: number;
  path: Array<[number, number]>;
  facing: AvatarPose["facing"];
  flip: boolean;
  /** Which way it last walked (8 screen directions). */
  dir: Direction8;
  walkPhase: number;
  walking: boolean;
  action: ActionId | null;
  actionStart: number;
  praisedAt: number;
  bubble: RenderAvatar["bubble"];
  roomId: string;
  gardenId: string;
  goodPigg: number;
  friendId: string;
  /** Companion walking with them, and where it currently is. */
  pet: { species: string; name: string; level: number } | null;
  petPos: { x: number; y: number; flip: boolean; phase: number; walking: boolean } | null;
  /** How high it stands, in levels (0 = the floor). */
  z: number;
  seed: number;
};

type RemotePet = { species?: unknown; name?: unknown; level?: unknown } | null;
type RemoteMember = {
  id: string; name: string; avatar: unknown; x: number; y: number; roomId?: string; gardenId?: string; goodPigg?: number; friendId?: string; pet?: RemotePet;
};

function toPet(raw: RemotePet | undefined): Member["pet"] {
  if (!raw || typeof raw !== "object" || !raw.species) return null;
  return { species: String(raw.species), name: String(raw.name || "ペット"), level: Number(raw.level) || 0 };
}

const WALK_SPEED = 3.4; // tiles per second
const RIDE_SPEED = 5.4;
const PET_SPEED = 5.2;
const BUBBLE_MS = 6500;
const CHAT_LOG_LIMIT = 80;
const PING_INTERVAL_MS = 15000;
const CLIENT_KEY_STORAGE_KEY = "neon-town-client-key";

const ERROR_TEXT: Record<string, string> = {
  TOO_FAST: "発言が早すぎます。少し待ってね",
  TOO_MANY: "連続で発言しすぎです。少し待ってね",
  DUPLICATE: "同じ内容は続けて送れません",
  GOOD_PIGG_COOLDOWN: "同じ人へのグッピグは30秒に1回までです",
  NO_ROOM: "そのへやは見つかりませんでした",
  NOT_OWNER: "自分のへやだけ編集できます",
  ROOM_FULL: "このへやに置ける家具の上限です（へやを広げると増えます）",
  CANT_PLACE: "そこには置けません",
  CANT_ROTATE: "そこでは回転できません",
  NOT_OWNED: "まだ持っていない家具です（ショップ・スクラッチで手に入ります）",
  NOT_ENOUGH_AME: "アメがたりません",
  ROOM_LIMIT: "へやはこれ以上ふやせません",
  BUSY: "少し待ってからもう一度どうぞ",
  NOT_FISHING_SPOT: "つり場（岸の光っている場所）に立ってから釣ってね",
  NOT_ENOUGH_FISH: "釣りポイントがたりません",
  ALREADY_OWNED: "もう持っています",
  HAS_ABOVE: "上に何かがのっているので、先にそちらを片づけてね",
  TOO_HIGH: "これ以上は高く積めません",
  NOTHING: "そこには何もありません",
  BAD_OP: "その操作はできません",
  PET_LIMIT: "ペットはこれ以上迎えられません",
  PET_BUSY: "さっきなでたばかりです。少し待ってね",
  NO_FOOD: "そのごはんを持っていません",
  NOT_HUNGRY: "まだおなかがすいていないみたい",
  NO_PLOT: "そこに畑はありません",
  NO_SEED: "そのたねを持っていません",
  NO_GOODS: "売れる収穫物がありません",
  PLOT_BUSY: "この畑にはもう植わっています",
  PLOT_EMPTY: "この畑には何も植わっていません",
  NOT_RIPE: "まだ実っていません",
  ALREADY_RIPE: "もう実っているので水やりは不要です",
  WATER_MAX: "この作物には水やりしきりました",
  WATER_WAIT: "水やりは少し時間をあけてね",
  NOT_READY: "まだ受け取れません",
};

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/** Same resolution rules as the main arcade page (see page.tsx getAutoRoomServerUrl). */
export function resolveRoomServerUrl(): string {
  const fromQuery = new URLSearchParams(window.location.search).get("roomServer");
  if (fromQuery) return fromQuery;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const hostname = window.location.hostname || "127.0.0.1";
  if (isLoopbackHost(hostname)) return `${protocol}://127.0.0.1:8788`;
  if (window.location.port === "3000" || window.location.port === "5173") return `${protocol}://${hostname}:8788`;
  return `${protocol}://${window.location.host}/room`;
}

/** Stable per-browser key: the server keeps only one avatar per key. */
function loadClientKey(): string {
  const fresh = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
  try {
    const saved = localStorage.getItem(CLIENT_KEY_STORAGE_KEY);
    if (saved && /^[a-z0-9-]{8,64}$/i.test(saved)) return saved;
    const key = fresh();
    localStorage.setItem(CLIENT_KEY_STORAGE_KEY, key);
    return key;
  } catch {
    return fresh();
  }
}

function createMember(id: string, name: string, avatar: AvatarConfig, x: number, y: number): Member {
  return {
    id, name, avatar, x, y,
    path: [],
    facing: "front",
    flip: false,
    dir: "down",
    walkPhase: 0,
    walking: false,
    action: null,
    actionStart: 0,
    praisedAt: -1e9,
    bubble: null,
    roomId: "",
    gardenId: "",
    goodPigg: 0,
    friendId: "",
    pet: null,
    petPos: null,
    z: 0,
    seed: Math.random() * 4,
  };
}

function areaFor(id: AreaId): AreaDef {
  if (isStaticAreaId(id)) return AREAS[id];
  if (isGardenAreaId(id)) return buildGardenArea(emptyGarden(id.slice(7)), 0);
  return buildRoomArea(emptyRoom(id.slice(5)));
}

const ERROR_TEXT_GARDEN: Record<string, string> = {
  NO_GARDEN: "そのガーデンは見つかりませんでした",
  NOT_GARDEN_OWNER: "それはガーデンの持ち主だけができます（水やり・草取りはできます）",
  ALREADY_TILLED: "もう畑になっています",
  CANT_TILL: "そこはたがやせません",
  PLOT_LIMIT: "畑の数が上限です（ガーデンレベルを上げると増えます）",
  LOCKED: "まだガーデンレベルが足りません",
  STILL_WET: "まだ土がしめっています",
  NOTHING_TO_WATER: "水やりする作物がありません",
  NO_WEED: "雑草も虫もいません",
  ALREADY_FERT: "この作物にはもうひりょうをまきました",
  NO_FERT: "そのひりょうを持っていません",
  NEED_BASKET: "まとめて収穫には「しゅうかくかご」が必要です",
  DECO_LIMIT: "かざりはこれ以上置けません",
  NO_ITEM: "そのアイテムを持っていません",
  OUT_OF_SEASON: "そのたねは今の季節には売っていません",
  MISSING_INGREDIENTS: "材料が足りません",
  MISSING_GOODS: "とどける物が足りません",
  ALREADY_DONE: "もう完了しています",
};

export class TownGame {
  private area: AreaDef;
  private channel = 0;
  private status: ConnectionStatus = "connecting";
  private areaCounts: TownSnapshot["areaCounts"] = {};
  private chat: ChatLine[] = [];
  private rooms: RoomListing[] = [];
  private selfRoomId = "";
  private self: Member;
  private members = new Map<string, Member>();
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private reconnectDelay = 1000;
  private disposed = false;
  private camera: Camera = { offsetX: 0, offsetY: 0, zoom: 1 };
  private viewSize = { width: 1, height: 1 };
  private hoverTile: [number, number] | null = null;
  private ghost: PlacementGhost | null = null;
  private listeners = new Set<(s: TownSnapshot) => void>();
  private eventListeners = new Set<(e: TownEvent) => void>();
  private wallet: Wallet | null = null;
  private gardens: GardenListing[] = [];
  private selfGardenId = "";
  private clockOffset = 0;
  private effects: TileEffect[] = [];
  private readonly clientKey = loadClientKey();
  private readonly handlePageHide = () => {
    // Tell the server right away instead of waiting for the socket to time out.
    this.send({ type: "town-leave" });
    this.ws?.close();
  };

  private identity: TownIdentity;
  /** Channel to ask for on the next join (set when warping to a friend). */
  private wantedChannel = 0;
  /** Casino item uses waiting for the server (request id -> resolve). */
  private itemRequests = new Map<string, (ok: boolean) => void>();
  private itemSeq = 0;

  /** Until the first welcome arrives, ask the server to put us in our own room. */
  private startHome: boolean;

  constructor(
    name: string, avatar: AvatarConfig, areaId: AreaId = "plaza",
    identity: TownIdentity = { friendId: "", shareLocation: true, auth: null }, startHome = false,
  ) {
    this.identity = identity;
    this.startHome = startHome;
    this.area = areaFor(areaId);
    const [sx, sy] = this.area.spawn;
    this.self = createMember("self", name, avatar, sx, sy);
  }

  // ------------------------------------------------------------ lifecycle

  start() {
    window.addEventListener("pagehide", this.handlePageHide);
    this.connect();
  }

  /** Re-enter after being replaced by another tab (kicks that tab instead). */
  reconnect() {
    if (this.disposed || this.status !== "replaced") return;
    this.reconnectDelay = 1000;
    this.connect();
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("pagehide", this.handlePageHide);
    this.send({ type: "town-leave" });
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
    this.ws?.close();
    this.listeners.clear();
    this.eventListeners.clear();
  }

  onEvent(listener: (e: TownEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private fire(event: TownEvent) {
    for (const l of this.eventListeners) l(event);
  }

  subscribe(listener: (s: TownSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  private snapshot(): TownSnapshot {
    const room = this.area.room ?? null;
    return {
      areaId: this.area.id,
      areaName: this.area.name,
      channel: this.channel,
      status: this.status,
      memberCount: this.members.size + 1,
      areaCounts: this.areaCounts,
      chat: this.chat,
      selfRoomId: this.selfRoomId,
      room,
      isOwnRoom: Boolean(room && this.wallet?.rooms.some((r) => r.id === room.id)),
      rooms: this.rooms,
      wallet: this.wallet,
      garden: this.area.garden ?? null,
      isOwnGarden: Boolean(this.area.garden && this.selfGardenId && this.area.garden.id === this.selfGardenId),
      selfGardenId: this.selfGardenId,
      gardens: this.gardens,
      clockOffset: this.clockOffset,
    };
  }

  private emit() {
    const snap = this.snapshot();
    for (const l of this.listeners) l(snap);
  }

  // ------------------------------------------------------------ network

  private connect() {
    if (this.disposed) return;
    this.status = "connecting";
    this.emit();
    let ws: WebSocket;
    try {
      ws = new WebSocket(resolveRoomServerUrl());
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.sendJoin([Math.round(this.self.x), Math.round(this.self.y)]);
      if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => this.send({ type: "town-ping" }), PING_INTERVAL_MS);
    };
    ws.onmessage = (event) => {
      try {
        this.handleMessage(JSON.parse(String(event.data)));
      } catch {
        // ignore malformed frames
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
      this.members.clear();
      if (this.status === "replaced") {
        this.emit();
        return;
      }
      this.status = "offline";
      this.emit();
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.disposed) return;
    this.status = "offline";
    this.emit();
    this.reconnectTimer = window.setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(15000, this.reconnectDelay * 2);
  }

  private send(payload: Record<string, unknown>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  private sendJoin(spawn: [number, number]) {
    this.send({
      type: "town-join", area: this.startHome ? "home" : this.area.id, name: this.self.name, avatar: this.self.avatar, spawn, clientKey: this.clientKey,
      auth: this.identity.auth ?? undefined, shareLocation: this.identity.shareLocation, channel: this.wantedChannel || undefined,
    });
    this.wantedChannel = 0;
  }

  private system(text: string) {
    this.pushChat({ id: "", name: "", text, at: Date.now(), system: true });
  }

  private handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case "town-welcome": {
        // Ignore welcomes for an area we've already left.
        if (msg.requestedArea !== undefined && msg.requestedArea !== (this.startHome ? "home" : this.area.id)) return;
        if (!isAreaId(msg.area)) return;
        this.startHome = false;
        if (msg.area !== this.area.id) {
          // Server redirected us (e.g. the room doesn't exist).
          this.area = areaFor(msg.area);
        }
        const room = msg.room as RoomData | null;
        if (room && isRoomAreaId(msg.area)) this.area = buildRoomArea(room);
        const garden = msg.garden as GardenData | null;
        if (garden && isGardenAreaId(msg.area)) this.setGarden(garden);
        this.selfGardenId = String(msg.selfGardenId || this.selfGardenId);
        this.status = "online";
        this.channel = Number(msg.channel) || 1;
        this.self.id = String(msg.selfId || "self");
        this.selfRoomId = String(msg.selfRoomId || "");
        const selfInfo = msg.self as RemoteMember | undefined;
        if (selfInfo) {
          this.self.roomId = String(selfInfo.roomId || "");
          this.self.gardenId = String(selfInfo.gardenId || "");
          this.self.goodPigg = Number(selfInfo.goodPigg) || 0;
          this.self.x = Number(selfInfo.x);
          this.self.y = Number(selfInfo.y);
          this.self.path = [];
        }
        this.members.clear();
        for (const m of (msg.members as RemoteMember[]) || []) this.addRemote(m);
        this.areaCounts = (msg.areaCounts as TownSnapshot["areaCounts"]) || {};
        if (msg.wallet) this.wallet = msg.wallet as Wallet;
        this.syncSelfPet();
        // Logged-in accounts keep their look on the server; adopt it if this device differs.
        const saved = msg.profile as { name?: unknown; avatar?: unknown } | null | undefined;
        if (saved) {
          const name = String(saved.name || this.self.name);
          const avatar = normalizeAvatar(saved.avatar);
          if (name !== this.self.name || JSON.stringify(avatar) !== JSON.stringify(this.self.avatar)) {
            this.self.name = name;
            this.self.avatar = avatar;
            this.fire({ type: "profile", name, avatar });
          }
        }
        this.system(`${this.area.name}（${this.channel}）に入りました`);
        break;
      }
      case "town-areas":
        this.areaCounts = (msg.areaCounts as TownSnapshot["areaCounts"]) || {};
        break;
      case "town-rooms":
        this.rooms = (msg.rooms as RoomListing[]) || [];
        break;
      case "town-room": {
        const room = msg.room as RoomData;
        if (!room || this.area.id !== `room:${room.id}`) return;
        this.area = buildRoomArea(room);
        // Anyone now standing inside new furniture hops back to the spawn.
        for (const m of [this.self, ...this.members.values()]) {
          if (!isWalkable(this.area, Math.round(m.x), Math.round(m.y))) {
            [m.x, m.y] = this.area.spawn;
            m.path = [];
          }
        }
        break;
      }
      case "town-member-joined":
        this.addRemote(msg.member as RemoteMember);
        break;
      case "town-member-left":
        this.members.delete(String(msg.id));
        break;
      case "town-member-updated": {
        const r = msg.member as RemoteMember;
        const m = this.members.get(r.id);
        if (m) {
          m.name = String(r.name || m.name);
          m.avatar = normalizeAvatar(r.avatar);
          m.pet = toPet(r.pet);
          if (!m.pet) m.petPos = null;
        }
        break;
      }
      case "town-member-moved": {
        const m = this.members.get(String(msg.id));
        if (m) this.walkTo(m, [Number(msg.x), Number(msg.y)]);
        break;
      }
      case "town-chat": {
        const id = String(msg.id);
        const text = String(msg.text || "");
        const target = id === this.self.id ? this.self : this.members.get(id);
        if (target) {
          target.bubble = { text, until: performance.now() + BUBBLE_MS };
          const auto = actionFromChat(text);
          if (auto && target.path.length === 0) this.applyAction(target, auto, true);
        }
        this.pushChat({ id, name: String(msg.name || target?.name || "?"), text, at: Number(msg.at) || Date.now() });
        break;
      }
      case "town-action": {
        const m = this.members.get(String(msg.id));
        if (m && isActionId(msg.action)) this.applyAction(m, msg.action);
        break;
      }
      case "town-goodpigg": {
        const to = String(msg.to);
        const target = to === this.self.id ? this.self : this.members.get(to);
        if (target) {
          target.praisedAt = performance.now();
          target.goodPigg = Number(msg.count) || target.goodPigg + 1;
          // Praise counts belong to the person's room, so refresh it if we're in it.
          if (this.area.room && target.roomId === this.area.room.id) this.area.room.goodPigg = target.goodPigg;
        }
        const toName = to === this.self.id ? "あなた" : String(msg.toName || "");
        this.system(`${String(msg.fromName || "だれか")} が ${toName} にグッピグしました！`);
        break;
      }
      case "town-where":
        this.fire({ type: "where", found: Array.isArray(msg.found) ? (msg.found as FriendLocation[]) : [] });
        break;
      case "town-wallet":
        this.wallet = msg.wallet as Wallet;
        this.syncSelfPet();
        break;
      case "town-pet-done":
        this.fire({
          type: "pet-done", op: String(msg.op || ""), id: msg.id ? String(msg.id) : undefined, label: msg.label ? String(msg.label) : undefined,
          gain: Number(msg.gain) || 0, hungry: Boolean(msg.hungry), capped: Boolean(msg.capped),
        });
        break;
      case "town-garden-done":
        this.fire({ type: "garden-done", op: String(msg.op || ""), label: String(msg.label || ""), total: Number(msg.total) || 0, amount: Number(msg.amount) || 0 });
        break;
      case "town-ame": {
        const delta = Number(msg.delta) || 0;
        const reason = String(msg.reason || "");
        this.system(`🍬 ${reason} +${delta} アメ`);
        this.fire({ type: "ame", delta, reason, ame: Number(msg.ame) || 0 });
        break;
      }
      case "town-coins": {
        const delta = Math.floor(Number(msg.delta) || 0);
        const reason = String(msg.reason || "");
        if (delta > 0) {
          this.system(`🪙 ${reason} +${delta} カジノコイン`);
          this.fire({ type: "coins", delta, reason });
        }
        break;
      }
      case "town-scratch":
        this.fire({ type: "scratch", cells: msg.cells as string[], prize: msg.prize as ScratchPrize, ame: Number(msg.ame) || 0 });
        break;
      case "town-bought":
        this.system(`🛍 ${String(msg.label || "")} を手に入れました`);
        this.fire({ type: "bought", label: String(msg.label || ""), roomId: msg.roomId ? String(msg.roomId) : undefined });
        break;
      case "town-replaced":
        this.status = "replaced";
        this.members.clear();
        this.system("別のタブ・ウィンドウでタウンに入ったため、こちらは退出しました");
        this.ws?.close();
        break;
      case "town-error": {
        // The town only admits verified accounts; the page sends the player back to the login screen.
        if (msg.code === "LOGIN_REQUIRED" || msg.code === "AUTH_FAILED") {
          this.fire({ type: "login-required", expired: msg.code === "AUTH_FAILED" });
          break;
        }
        const text = ERROR_TEXT[String(msg.code)] || ERROR_TEXT_GARDEN[String(msg.code)] || "エラーが発生しました";
        this.system(text);
        this.fire({ type: "error", text, code: String(msg.code || "") });
        break;
      }
      case "town-fish-cast":
        this.fire({
          type: "fish-cast", castId: String(msg.castId), biteMs: Number(msg.biteMs) || 3000, rod: String(msg.rod || "bamboo"),
          bait: String(msg.bait || "none"), power: Number(msg.power) || 0.5, speed: Number(msg.speed) || 1, rarity: String(msg.rarity || "common"),
          frame: Number(msg.frame) || 1,
        });
        break;
      case "town-fish-caught": {
        const fish = msg.fish as { id: string; label: string; emoji: string; rarity: string };
        const cm = Number(msg.cm) || 0;
        const points = Number(msg.points) || 0;
        this.system(`🎣 ${fish.emoji} ${fish.label}（${cm}cm）を釣り上げた！ +${points} 釣りポイント`);
        this.fire({ type: "fish-caught", fish, cm, points, perfect: Number(msg.perfect) || 0, isRecord: Boolean(msg.isRecord) });
        break;
      }
      case "town-fish-escaped":
        this.fire({ type: "fish-escaped" });
        break;
      case "town-fish-news":
        this.system(`🎣 ${String(msg.name || "だれか")} が ${String(msg.emoji || "")}${String(msg.label || "")}（${Number(msg.cm) || 0}cm）を釣り上げた！`);
        break;
      case "town-shop-bought":
        this.system(`🛍 ${String(msg.label || "")} を手に入れました`);
        this.fire({ type: "shop-bought", id: String(msg.id), label: String(msg.label || ""), shop: msg.shop === "casino" ? "casino" : "fishing", price: Number(msg.price) || 0 });
        break;
      case "town-item-used": {
        const pending = this.itemRequests.get(String(msg.req || ""));
        if (pending) {
          this.itemRequests.delete(String(msg.req || ""));
          pending(Boolean(msg.ok));
        }
        break;
      }
      case "town-garden": {
        const garden = msg.garden as GardenData;
        if (!garden || this.area.id !== `garden:${garden.id}`) return;
        this.setGarden(garden);
        const born = performance.now();
        for (const fx of (Array.isArray(msg.fx) ? msg.fx : []) as Array<Omit<TileEffect, "born">>) this.effects.push({ ...fx, born });
        break;
      }
      case "town-gardens":
        this.gardens = (msg.gardens as GardenListing[]) || [];
        break;
      case "town-garden-levelup": {
        const level = Number(msg.level) || 1;
        const unlocks = Array.isArray(msg.unlocks) ? (msg.unlocks as string[]) : [];
        this.system(`🌱 ガーデンレベル ${level} になった！${unlocks.length ? ` ${unlocks.join("・")}` : ""}`);
        this.fire({ type: "garden-levelup", level, unlocks });
        break;
      }
      case "town-garden-news":
        this.system(`🌱 ${String(msg.text || "")}`);
        this.fire({ type: "garden-news", text: String(msg.text || "") });
        break;
      case "town-room-guest": {
        const name = String(msg.name || "");
        const roomTitle = String(msg.roomTitle || "");
        this.system(`🚪 ${name}さんが「${roomTitle}」に遊びに来たよ！`);
        this.fire({ type: "room-guest", roomTitle, name });
        break;
      }
      default:
        return;
    }
    this.emit();
  }

  /** Rebuild the garden area from server data, keeping everyone where they are. */
  private setGarden(garden: GardenData) {
    this.clockOffset = garden.serverNow - Date.now();
    this.area = buildGardenArea(garden, this.clockOffset);
  }

  private addRemote(r: RemoteMember) {
    if (!r || !r.id || r.id === this.self.id) return;
    const m = createMember(r.id, String(r.name || "ゲスト"), normalizeAvatar(r.avatar), Number(r.x) || 0, Number(r.y) || 0);
    m.roomId = String(r.roomId || "");
    m.gardenId = String(r.gardenId || "");
    m.goodPigg = Number(r.goodPigg) || 0;
    m.friendId = String(r.friendId || "");
    m.pet = toPet(r.pet);
    if (seatAt(this.area, m.x, m.y)) m.action = "sit";
    else if (bedAt(this.area, m.x, m.y)) this.lieOnBed(m, m.x, m.y);
    this.members.set(r.id, m);
  }

  private pushChat(line: ChatLine) {
    this.chat = [...this.chat, line].slice(-CHAT_LOG_LIMIT);
  }

  // ------------------------------------------------------------ actions

  moveTo(tile: [number, number]) {
    if (!isWalkable(this.area, tile[0], tile[1])) return;
    if (this.walkTo(this.self, tile)) {
      this.send({ type: "town-move", x: tile[0], y: tile[1] });
      return;
    }
    // Already standing on a game spot: tapping it again reopens the game.
    const spot = this.self.path.length === 0 ? spotAt(this.area, tile[0], tile[1]) : undefined;
    if (spot) this.fire({ type: "spot", game: spot.game });
  }

  say(textRaw: string) {
    const text = textRaw.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!text) return;
    if (!this.send({ type: "town-chat", text })) {
      // Offline: still show it locally so the town is usable without a server.
      this.self.bubble = { text, until: performance.now() + BUBBLE_MS };
      const auto = actionFromChat(text);
      if (auto) this.applyAction(this.self, auto, true);
      this.pushChat({ id: this.self.id, name: this.self.name, text, at: Date.now() });
      this.emit();
    }
  }

  act(action: ActionId) {
    this.applyAction(this.self, action);
    this.send({ type: "town-action", action });
  }

  praise(targetId: string) {
    if (!this.send({ type: "town-goodpigg", to: targetId })) {
      this.system("グッピグはオンラインのときに使えます");
      this.emit();
    }
  }

  updateProfile(name: string, avatar: AvatarConfig) {
    this.self.name = name;
    this.self.avatar = avatar;
    this.send({ type: "town-update", name, avatar });
  }

  // ------------------------------------------------------------ fishing & point shops

  /** Throw the line (you must be standing on a fishing spot). The server answers with `fish-cast`. */
  fishCast(): boolean {
    if (!this.send({ type: "town-fish-cast" })) {
      this.fire({ type: "error", text: "釣りはオンラインのときにできます" });
      return false;
    }
    // "fish" is a held pose: sending it again would toggle it off, so only the first cast raises the rod.
    if (this.self.action !== "fish") {
      this.applyAction(this.self, "fish");
      this.send({ type: "town-action", action: "fish" });
    }
    return true;
  }

  fishResult(castId: string, caught: boolean, perfect: number) {
    this.send({ type: "town-fish-result", castId, caught, perfect });
  }

  /** Put the rod away (stand up from the fishing pose). */
  stopFishing() {
    if (this.self.action !== "fish") return;
    this.self.action = null;
    this.send({ type: "town-action", action: "fish" });
  }

  setFishGear(gear: { rod?: string; bait?: string }) {
    this.send({ type: "town-fish-gear", ...gear });
  }

  shopBuy(id: string) {
    if (!this.send({ type: "town-shop-buy", id })) this.fire({ type: "error", text: "ショップはオンラインのときに使えます" });
  }

  /** Spend one casino item; resolves false when there is none left or the server is unreachable. */
  useItem(id: string): Promise<boolean> {
    if ((this.wallet?.items[id] ?? 0) <= 0) return Promise.resolve(false);
    const req = `i${++this.itemSeq}`;
    return new Promise((resolve) => {
      if (!this.send({ type: "town-item-use", id, req })) {
        resolve(false);
        return;
      }
      this.itemRequests.set(req, resolve);
      window.setTimeout(() => {
        if (!this.itemRequests.has(req)) return;
        this.itemRequests.delete(req);
        resolve(false);
      }, 5000);
    });
  }

  getWallet(): Wallet | null {
    return this.wallet;
  }

  // ------------------------------------------------------------ pets & garden

  /** The companion shown next to me is whichever pet is active in my wallet. */
  private syncSelfPet() {
    const w = this.wallet;
    const pet = w?.activePet ? w.pets.find((p) => p.id === w.activePet) : null;
    this.self.pet = pet ? { species: pet.species, name: pet.name, level: pet.level } : null;
    if (!pet) this.self.petPos = null;
  }

  private command(payload: Record<string, unknown>) {
    if (!this.send(payload)) this.fire({ type: "error", text: "オンラインのときに使えます" });
  }

  claimMission(id: string) { this.command({ type: "town-mission-claim", id }); }
  claimMissionBonus() { this.command({ type: "town-mission-bonus" }); }
  claimAchievement(id: string) { this.command({ type: "town-ach-claim", id }); }
  petBuy(species: string, name?: string) { this.command({ type: "town-pet-buy", species, name }); }
  petActive(id: string) { this.command({ type: "town-pet-active", id }); }
  petRename(id: string, name: string) { this.command({ type: "town-pet-rename", id, name }); }
  petPat(id: string) { this.command({ type: "town-pet-pat", id }); }
  petFeed(id: string, food: string) { this.command({ type: "town-pet-feed", id, food }); }
  buySeed(id: string, count: number) { this.command({ type: "town-garden-seed", id, count }); }
  buyPetFood(count: number) { this.command({ type: "town-garden-food", count }); }
  sellGoods(id: string, all = true, count = 0) { this.command({ type: "town-garden-sell", id, all, count }); }
  plant(x: number, y: number, crop: string) { this.command({ type: "town-garden-plant", x, y, crop }); }
  water(x: number, y: number) { this.command({ type: "town-garden-water", x, y }); }
  harvest(x: number, y: number) { this.command({ type: "town-garden-harvest", x, y }); }
  /** My Garden: till, untill, plant, water, weed, fert, harvest, harvestAll, decoPlace, decoRemove. */
  gardenAct(op: string, params: Record<string, unknown> = {}) { this.command({ type: "town-garden-act", op, ...params }); }
  gardenShop(what: "seed" | "fert" | "tool" | "item", id: string, count = 1) { this.command({ type: "town-garden-shop", what, id, count }); }
  gardenSell(kind: "crop" | "gold" | "dish", id: string) { this.command({ type: "town-garden-sell", kind, id, all: true }); }
  cook(id: string) { this.command({ type: "town-garden-cook", id }); }
  deliverOrder(id: string) { this.command({ type: "town-garden-order", id }); }
  refreshOrder(id: string) { this.command({ type: "town-garden-order", id, refresh: true }); }
  claimDex(pct: number) { this.command({ type: "town-garden-dex", pct }); }
  requestGardens() { this.send({ type: "town-gardens" }); }

  goMyGarden() {
    if (!this.selfGardenId) {
      this.system("マイガーデンはオンラインのときに入れます");
      this.emit();
      return;
    }
    this.changeArea(`garden:${this.selfGardenId}`);
  }

  visitGarden(gardenId: string) {
    if (/^[0-9a-f]{16}$/.test(gardenId)) this.changeArea(`garden:${gardenId}`);
  }

  /** Pets trot after their owner, keeping about a tile away. */
  private stepPet(m: Member, dt: number) {
    if (!m.pet) return;
    let pp = m.petPos;
    if (!pp) {
      pp = { x: m.x - 0.9, y: m.y + 0.3, flip: false, phase: 0, walking: false };
      m.petPos = pp;
      if (!isWalkable(this.area, Math.round(pp.x), Math.round(pp.y))) [pp.x, pp.y] = [m.x, m.y];
    }
    const dx = m.x - pp.x;
    const dy = m.y - pp.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) {
      [pp.x, pp.y] = [m.x, m.y];
      pp.walking = false;
      return;
    }
    if (dist > 1.1) {
      const step = Math.min(dist - 0.9, PET_SPEED * dt);
      const nx = pp.x + (dx / dist) * step;
      const ny = pp.y + (dy / dist) * step;
      if (isWalkable(this.area, Math.round(nx), Math.round(ny))) {
        pp.x = nx;
        pp.y = ny;
      }
      // Screen-space: moving right on screen faces right.
      if (Math.abs(dx - dy) > 0.05) pp.flip = dx - dy < 0;
      pp.phase += dt * 14;
      pp.walking = true;
    } else {
      pp.walking = false;
    }
  }

  setShareLocation(shareLocation: boolean) {
    this.identity = { ...this.identity, shareLocation };
    this.send({ type: "town-update", name: this.self.name, avatar: this.self.avatar, shareLocation });
  }

  /** Ask the server where these cloud friends are (only friends who allow it are reported). */
  whereFriends(ids: string[]) {
    if (ids.length === 0) return;
    this.send({ type: "town-where", ids });
  }

  warpToFriend(location: FriendLocation) {
    if (!isAreaId(location.area)) return;
    this.changeArea(location.area, undefined, location.channel);
  }

  changeArea(areaId: AreaId, spawn?: [number, number], channel = 0) {
    this.wantedChannel = channel;
    this.startHome = false;
    this.area = areaFor(areaId);
    const [sx, sy] = spawn ?? this.area.spawn;
    Object.assign(this.self, { x: sx, y: sy, path: [], walking: false, action: null, facing: "front", dir: "down" });
    this.members.clear();
    this.self.petPos = null;
    this.channel = 0;
    this.ghost = null;
    this.sendJoin([sx, sy]);
    this.emit();
  }

  goMyRoom() {
    if (!this.selfRoomId) {
      this.system("マイルームはオンラインのときに入れます");
      this.emit();
      return;
    }
    this.changeArea(`room:${this.selfRoomId}`);
  }

  visitRoom(roomId: string) {
    if (/^[0-9a-f]{16}$/.test(roomId)) this.changeArea(`room:${roomId}`);
  }

  scratch() {
    if (!this.send({ type: "town-scratch" })) this.fire({ type: "error", text: "スクラッチはオンラインのときに使えます" });
  }

  buy(what: "part" | "furniture" | "expand" | "room", params: Record<string, unknown> = {}) {
    if (!this.send({ type: "town-buy", what, ...params })) this.fire({ type: "error", text: "ショップはオンラインのときに使えます" });
  }

  refreshAreaCounts() {
    this.send({ type: "town-areas" });
  }

  requestRooms() {
    this.send({ type: "town-rooms" });
  }

  roomEdit(payload: Record<string, unknown>) {
    this.send({ type: "town-room-edit", ...payload });
  }

  setGhost(ghost: PlacementGhost | null) {
    this.ghost = ghost;
  }

  getArea(): AreaDef {
    return this.area;
  }

  memberInfo(id: string): MemberInfo | null {
    const m = id === this.self.id ? this.self : this.members.get(id);
    if (!m) return null;
    return {
      id: m.id, name: m.name, avatar: m.avatar, goodPigg: m.goodPigg, roomId: m.roomId, gardenId: m.gardenId,
      friendId: m === this.self ? this.identity.friendId : m.friendId, isSelf: m === this.self,
    };
  }

  // ------------------------------------------------------------ simulation

  private walkTo(m: Member, tile: [number, number]): boolean {
    const from: [number, number] = [Math.round(m.x), Math.round(m.y)];
    if (from[0] === tile[0] && from[1] === tile[1]) return false;
    const path = findPath(this.area, from, tile);
    // No continuous route means the destination is unreachable. Never snap across missing stairs or walls.
    if (path.length === 0) return false;
    m.path = path;
    m.action = null;
    return true;
  }

  private applyAction(m: Member, action: ActionId, fromChat = false) {
    const def = actionDef(action);
    if (!def) return;
    const persistent = def.durationMs === 0;
    if (persistent) {
      if (m.path.length > 0) return;
      // Chat can put you to sleep, but only buttons toggle a held pose off.
      if (m.action === action && !fromChat) {
        m.action = null;
        return;
      }
    }
    // Don't interrupt sitting/lying with a chat-triggered face.
    if (fromChat && (m.action === "sit" || m.action === "lie") && !persistent) return;
    m.action = action;
    m.actionStart = performance.now();
  }

  private stepMember(m: Member, dt: number, now: number) {
    if (m.path.length > 0) {
      const [tx, ty] = m.path[0];
      const dx = tx - m.x;
      const dy = ty - m.y;
      const dist = Math.hypot(dx, dy);
      const riding = Boolean(m.avatar.ride && m.avatar.ride !== "none");
      const step = (riding ? RIDE_SPEED : WALK_SPEED) * dt;
      // Screen-space direction decides which way the avatar faces.
      const sdx = dx - dy;
      const sdy = dx + dy;
      if (Math.abs(sdx) > 0.01 || Math.abs(sdy) > 0.01) {
        m.dir = directionOf(sdx, sdy);
        m.facing = sdy >= -0.01 ? "front" : "back";
        m.flip = sdx < -0.01;
      }
      if (dist <= step) {
        m.x = tx;
        m.y = ty;
        m.path.shift();
      } else {
        m.x += (dx / dist) * step;
        m.y += (dy / dist) * step;
      }
      m.walking = true;
      m.walkPhase += dt * 13;
      if (m.path.length === 0) {
        m.walking = false;
        if (seatAt(this.area, tx, ty)) this.applyAction(m, "sit");
        else if (bedAt(this.area, tx, ty)) this.lieOnBed(m, tx, ty);
        if (m === this.self) this.onSelfArrived(tx, ty);
      }
    }
    if (m.action) {
      const def = actionDef(m.action);
      if (def && def.durationMs > 0 && now - m.actionStart > def.durationMs) m.action = null;
    }
    if (m.bubble && m.bubble.until < now) m.bubble = null;
  }

  /** Lie down centred on the bed under (x, y). */
  private lieOnBed(m: Member, x: number, y: number) {
    const bed = objectsAt(this.area, x, y).find((o) => o.bed);
    if (bed) {
      m.x = bed.x + ((bed.w ?? 1) - 1) / 2;
      m.y = bed.y + ((bed.h ?? 1) - 1) / 2;
    }
    this.applyAction(m, "lie");
  }

  private onSelfArrived(x: number, y: number) {
    const portal = portalAt(this.area, x, y);
    if (portal) {
      this.changeArea(portal.to, portal.spawn);
      return;
    }
    const spot = spotAt(this.area, x, y);
    if (spot) this.fire({ type: "spot", game: spot.game });
  }

  private toRender(m: Member, now: number, isSelf: boolean): RenderAvatar {
    return {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      x: m.x,
      y: m.y,
      z: m.z,
      isSelf,
      bubble: m.bubble,
      praisedAt: m.praisedAt,
      pet: m.pet && m.petPos ? { ...m.pet, ...m.petPos, z: m.z } : null,
      pose: {
        facing: m.facing,
        flip: m.flip,
        dir: m.dir,
        walkPhase: m.walking ? m.walkPhase : null,
        action: m.action,
        actionTime: (now - m.actionStart) / 1000,
        clock: now / 1000,
        seed: m.seed,
      },
    };
  }

  // ------------------------------------------------------------ view

  resize(width: number, height: number) {
    this.viewSize = { width, height };
    this.camera = computeCamera(this.area, width, height);
  }

  tileAt(px: number, py: number): [number, number] | null {
    const { offsetX, offsetY, zoom } = this.camera;
    return pickTile(this.area, (px - offsetX) / zoom, (py - offsetY) / zoom);
  }

  /** Everyone glides up and down to the height of the tile they stand on (blocks, stairs). */
  private settleHeight(m: Member, dt: number) {
    const target = movementHeightAt(this.area, m.x, m.y, m.path[0]);
    const diff = target - m.z;
    if (Math.abs(diff) < 0.001) return;
    m.z += Math.sign(diff) * Math.min(Math.abs(diff), dt * 4);
  }

  /** Front-most avatar under the pointer, if any. */
  avatarAt(px: number, py: number): string | null {
    const all = [this.self, ...this.members.values()].sort((a, b) => b.x + b.y - (a.x + a.y));
    for (const m of all) {
      const box = avatarHitBox(this.camera, m);
      if (px >= box.x0 && px <= box.x1 && py >= box.y0 && py <= box.y1) return m.id;
    }
    return null;
  }

  setHover(tile: [number, number] | null) {
    this.hoverTile = tile && isWalkable(this.area, tile[0], tile[1]) ? tile : null;
  }

  frame(ctx: CanvasRenderingContext2D, dt: number) {
    const now = performance.now();
    this.camera = computeCamera(this.area, this.viewSize.width, this.viewSize.height);
    this.stepMember(this.self, dt, now);
    for (const m of this.members.values()) this.stepMember(m, dt, now);
    this.settleHeight(this.self, dt);
    for (const m of this.members.values()) this.settleHeight(m, dt);
    this.stepPet(this.self, dt);
    for (const m of this.members.values()) this.stepPet(m, dt);
    const avatars = [this.toRender(this.self, now, true), ...[...this.members.values()].map((m) => this.toRender(m, now, false))];
    if (this.effects.length) this.effects = this.effects.filter((fx) => now - fx.born < 1400);
    renderArea(ctx, this.area, avatars, this.camera, this.viewSize.width, this.viewSize.height, now, this.hoverTile, this.ghost, this.effects);
  }
}
