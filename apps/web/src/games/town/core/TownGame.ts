// Town client: owns local simulation (walking, actions, bubbles) and the
// WebSocket link to server/town-world.mjs. React only renders UI around it.
import { normalizeAvatar, type AvatarConfig } from "../avatar/parts";
import type { AvatarPose } from "../avatar/drawAvatar";
import { actionDef, actionFromChat, isActionId, type ActionId } from "../avatar/actions";
import {
  AREAS, bedAt, buildRoomArea, objectsAt, emptyRoom, findPath, isAreaId, isRoomAreaId, isStaticAreaId, isWalkable,
  portalAt, seatAt, toGrid, type AreaDef, type AreaId, type StaticAreaId,
} from "../world/areas";
import type { RoomData } from "../world/furniture";
import {
  avatarHitBox, computeCamera, renderArea, type Camera, type PlacementGhost, type RenderAvatar,
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
  today: { login: boolean; dress: boolean; onlineEarned: number; praiseReceived: number; praiseGiven: number; visits: number };
};

export type ScratchPrize =
  | { type: "ame"; amount: number; symbol: string }
  | { type: "item"; item: { kind: "part" | "furniture"; key?: string; id: string; label: string }; symbol: string };

/** One-off notifications for the UI (toasts, scratch results). */
export type TownEvent =
  | { type: "ame"; delta: number; reason: string; ame: number }
  | { type: "scratch"; cells: string[]; prize: ScratchPrize; ame: number }
  | { type: "bought"; label: string; roomId?: string }
  | { type: "error"; text: string };

export type MemberInfo = {
  id: string; name: string; avatar: AvatarConfig; goodPigg: number; roomId: string; isSelf: boolean;
};

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
  walkPhase: number;
  walking: boolean;
  action: ActionId | null;
  actionStart: number;
  praisedAt: number;
  bubble: RenderAvatar["bubble"];
  roomId: string;
  goodPigg: number;
  seed: number;
};

type RemoteMember = { id: string; name: string; avatar: unknown; x: number; y: number; roomId?: string; goodPigg?: number };

const WALK_SPEED = 3.4; // tiles per second
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
    walkPhase: 0,
    walking: false,
    action: null,
    actionStart: 0,
    praisedAt: -1e9,
    bubble: null,
    roomId: "",
    goodPigg: 0,
    seed: Math.random() * 4,
  };
}

function areaFor(id: AreaId): AreaDef {
  return isStaticAreaId(id) ? AREAS[id] : buildRoomArea(emptyRoom(id.slice(5)));
}

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
  private readonly clientKey = loadClientKey();
  private readonly handlePageHide = () => {
    // Tell the server right away instead of waiting for the socket to time out.
    this.send({ type: "town-leave" });
    this.ws?.close();
  };

  constructor(name: string, avatar: AvatarConfig, areaId: AreaId = "plaza") {
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
      type: "town-join", area: this.area.id, name: this.self.name, avatar: this.self.avatar, spawn, clientKey: this.clientKey,
    });
  }

  private system(text: string) {
    this.pushChat({ id: "", name: "", text, at: Date.now(), system: true });
  }

  private handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case "town-welcome": {
        // Ignore welcomes for an area we've already left.
        if (msg.requestedArea !== undefined && msg.requestedArea !== this.area.id) return;
        if (!isAreaId(msg.area)) return;
        if (msg.area !== this.area.id) {
          // Server redirected us (e.g. the room doesn't exist).
          this.area = areaFor(msg.area);
        }
        const room = msg.room as RoomData | null;
        if (room && isRoomAreaId(msg.area)) this.area = buildRoomArea(room);
        this.status = "online";
        this.channel = Number(msg.channel) || 1;
        this.self.id = String(msg.selfId || "self");
        this.selfRoomId = String(msg.selfRoomId || "");
        const selfInfo = msg.self as RemoteMember | undefined;
        if (selfInfo) {
          this.self.roomId = String(selfInfo.roomId || "");
          this.self.goodPigg = Number(selfInfo.goodPigg) || 0;
          this.self.x = Number(selfInfo.x);
          this.self.y = Number(selfInfo.y);
          this.self.path = [];
        }
        this.members.clear();
        for (const m of (msg.members as RemoteMember[]) || []) this.addRemote(m);
        this.areaCounts = (msg.areaCounts as TownSnapshot["areaCounts"]) || {};
        if (msg.wallet) this.wallet = msg.wallet as Wallet;
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
      case "town-wallet":
        this.wallet = msg.wallet as Wallet;
        break;
      case "town-ame": {
        const delta = Number(msg.delta) || 0;
        const reason = String(msg.reason || "");
        this.system(`🍬 ${reason} +${delta} アメ`);
        this.fire({ type: "ame", delta, reason, ame: Number(msg.ame) || 0 });
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
        const text = ERROR_TEXT[String(msg.code)] || "エラーが発生しました";
        this.system(text);
        this.fire({ type: "error", text });
        break;
      }
      default:
        return;
    }
    this.emit();
  }

  private addRemote(r: RemoteMember) {
    if (!r || !r.id || r.id === this.self.id) return;
    const m = createMember(r.id, String(r.name || "ゲスト"), normalizeAvatar(r.avatar), Number(r.x) || 0, Number(r.y) || 0);
    m.roomId = String(r.roomId || "");
    m.goodPigg = Number(r.goodPigg) || 0;
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
    if (this.walkTo(this.self, tile)) this.send({ type: "town-move", x: tile[0], y: tile[1] });
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

  changeArea(areaId: AreaId, spawn?: [number, number]) {
    this.area = areaFor(areaId);
    const [sx, sy] = spawn ?? this.area.spawn;
    Object.assign(this.self, { x: sx, y: sy, path: [], walking: false, action: null, facing: "front" });
    this.members.clear();
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
    return { id: m.id, name: m.name, avatar: m.avatar, goodPigg: m.goodPigg, roomId: m.roomId, isSelf: m === this.self };
  }

  // ------------------------------------------------------------ simulation

  private walkTo(m: Member, tile: [number, number]): boolean {
    const from: [number, number] = [Math.round(m.x), Math.round(m.y)];
    if (from[0] === tile[0] && from[1] === tile[1]) return false;
    const path = findPath(this.area, from, tile);
    if (path.length === 0) {
      // Unknown route (e.g. desynced position): snap instead of walking through walls.
      m.x = tile[0];
      m.y = tile[1];
      m.path = [];
      return true;
    }
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
      const step = WALK_SPEED * dt;
      // Screen-space direction decides which way the avatar faces.
      const sdx = dx - dy;
      const sdy = dx + dy;
      if (Math.abs(sdx) > 0.01 || Math.abs(sdy) > 0.01) {
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
    if (portal) this.changeArea(portal.to, portal.spawn);
  }

  private toRender(m: Member, now: number, isSelf: boolean): RenderAvatar {
    return {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      x: m.x,
      y: m.y,
      isSelf,
      bubble: m.bubble,
      praisedAt: m.praisedAt,
      pose: {
        facing: m.facing,
        flip: m.flip,
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
    const [gx, gy] = toGrid((px - offsetX) / zoom, (py - offsetY) / zoom);
    if (gx < 0 || gy < 0 || gx >= this.area.width || gy >= this.area.height) return null;
    return [gx, gy];
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
    const avatars = [this.toRender(this.self, now, true), ...[...this.members.values()].map((m) => this.toRender(m, now, false))];
    renderArea(ctx, this.area, avatars, this.camera, this.viewSize.width, this.viewSize.height, now, this.hoverTile, this.ghost);
  }
}
