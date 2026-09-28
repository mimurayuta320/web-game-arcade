"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./town.module.css";
import { AvatarEditor } from "@/games/town/components/AvatarEditor";
import { AvatarCanvas } from "@/games/town/components/AvatarCanvas";
import { ActionPalette } from "@/games/town/components/ActionPalette";
import { ProfileCard } from "@/games/town/components/ProfileCard";
import { RoomEditorPanel } from "@/games/town/components/RoomEditorPanel";
import { useRoomEditor } from "@/games/town/components/useRoomEditor";
import { AmeShop } from "@/games/town/components/AmeShop";
import { CasinoOverlay, type OverlayGame } from "@/games/casino/components/CasinoOverlay";
import { addCoins } from "@/games/casino/bank";
import { CasinoItemsContext, type CasinoItemsApi } from "@/games/casino/items";
import { useCasinoBank } from "@/games/casino/useCasinoBank";
import { FishingPanel } from "@/games/town/components/FishingPanel";
import { PointShop } from "@/games/town/components/PointShop";
import { PetPanel } from "@/games/town/components/PetPanel";
import { GardenBook, type GardenBookTab } from "@/games/town/components/GardenBook";
import { GardenToolbar, gardenHint, type GardenToolState } from "@/games/town/components/GardenToolbar";
import { GardenPlotCard } from "@/games/town/components/GardenPlotCard";
import { gardenDecoAt, gardenPlotAt } from "@/games/town/world/garden";
import { PlotPopup } from "@/games/town/components/PlotPopup";
import { MissionPanel, claimableCount } from "@/games/town/components/MissionPanel";
import type { ShopId } from "@/games/town/shared/shop";
import { FriendsPanel } from "@/games/town/components/FriendsPanel";
import { friendErrorText, friendsApi, loadCloudSession, type CloudSession } from "@/games/town/friends/cloudFriends";
import { fetchCloudProfile } from "@/games/town/friends/cloudProfile";
import { DEFAULT_AVATAR, normalizeAvatar, type AvatarConfig } from "@/games/town/avatar/parts";
import type { ActionId } from "@/games/town/avatar/actions";
import { AREAS, AREA_ORDER, isStaticAreaId } from "@/games/town/world/areas";
import { itemAt } from "@/games/town/world/furniture";
import { TownGame, type TownEvent, type TownSnapshot } from "@/games/town/core/TownGame";

const PROFILE_STORAGE_KEY = "neon-town-profile-v1";
const SHARE_LOCATION_STORAGE_KEY = "neon-town-share-location";

function loadShareLocation(): boolean {
  try {
    return localStorage.getItem(SHARE_LOCATION_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}
const CLOUD_USER_ID_STORAGE_KEY = "neon-cloud-user-id";

type Profile = { name: string; avatar: AvatarConfig };

/** The arcade hall is a separate page; every casino game is played inside the town. */
const ARCADE_URL = "/arcade?from=town";

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    const name = String(parsed.name || "").trim().slice(0, 12);
    if (!name) return null;
    return { name, avatar: normalizeAvatar(parsed.avatar) };
  } catch {
    return null;
  }
}

function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage unavailable (private mode) – profile lasts for this visit only
  }
}

function defaultName(): string {
  try {
    return (localStorage.getItem(CLOUD_USER_ID_STORAGE_KEY) || "").trim().slice(0, 12);
  } catch {
    return "";
  }
}

const QUICK_ACTIONS: Array<{ action: ActionId; label: string; icon: string }> = [
  { action: "wave", label: "手をふる", icon: "👋" },
  { action: "laugh", label: "大笑い", icon: "😆" },
  { action: "clap", label: "はくしゅ", icon: "👏" },
  { action: "jump", label: "ジャンプ", icon: "⤴️" },
];

const STATUS_LABEL: Record<TownSnapshot["status"], string> = {
  connecting: "接続中…",
  online: "オンライン",
  offline: "オフライン（ひとりで遊べます）",
  replaced: "別のタブで入室中",
};

function photoFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `neon-town-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
}

export default function TownPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<TownSnapshot | null>(null);
  const [draft, setDraft] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [shopTab, setShopTab] = useState<"scratch" | "shop" | "earn" | null>(null);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [casinoGame, setCasinoGame] = useState<OverlayGame | null>(null);
  const [fishingOpen, setFishingOpen] = useState(false);
  const [pointShop, setPointShop] = useState<ShopId | null>(null);
  const [petPanel, setPetPanel] = useState<"mine" | "shop" | null>(null);
  const [gardenBook, setGardenBook] = useState<GardenBookTab | null>(null);
  const [gardenTools, setGardenTools] = useState<GardenToolState>({ tool: "hand", seed: "", fert: "", deco: "fence", wide: true });
  const [gardenPlotPos, setGardenPlotPos] = useState<{ x: number; y: number } | null>(null);
  const [gardensOpen, setGardensOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [plotPos, setPlotPos] = useState<{ x: number; y: number } | null>(null);
  const casinoBank = useCasinoBank();
  const [cloudSession, setCloudSession] = useState<CloudSession | null>(null);
  const [shareLocation, setShareLocation] = useState(true);
  const [heldAme, setHeldAme] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; kind: "ame" | "info" | "error" }>>([]);
  const toastSeq = useRef(0);
  const gameRef = useRef<TownGame | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // The town is for logged-in accounts only; everyone else starts at the arcade's login screen.
    const session = loadCloudSession();
    if (!session) {
      window.location.replace("/arcade?reason=town-login");
      return undefined;
    }
    const saved = loadProfile();
    setCloudSession(session);
    setShareLocation(loadShareLocation());
    if (saved) {
      setProfile(saved);
      setEditorOpen(false);
      setProfileLoaded(true);
      return undefined;
    }
    // A logged-in account on a device with no look yet: use the one saved on the server, if any.
    let cancelled = false;
    void fetchCloudProfile(session).then((remote) => {
      if (cancelled) return;
      if (remote) {
        saveProfile(remote);
        setProfile(remote);
      }
      setEditorOpen(!remote);
      setProfileLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (text: string, kind: "ame" | "info" | "error" = "info") => {
    const id = ++toastSeq.current;
    setToasts((list) => [...list.slice(-3), { id, text, kind }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  };

  // Room decorating: tools, preview, undo/redo, layouts.
  const editor = useRoomEditor({ game: gameRef, room: snapshot?.room ?? null, editing, notify: (text) => showToast(text, "error") });

  const handleShareLocation = (value: boolean) => {
    setShareLocation(value);
    try {
      localStorage.setItem(SHARE_LOCATION_STORAGE_KEY, value ? "1" : "0");
    } catch {
      // storage unavailable – applies to this visit only
    }
    gameRef.current?.setShareLocation(value);
  };

  const addFriend = async (friendId: string) => {
    if (!cloudSession) return;
    try {
      await friendsApi.sendRequest(cloudSession, friendId);
      showToast("ピグとも申請をおくりました");
    } catch (error) {
      showToast(friendErrorText(error), "error");
    }
  };

  // Start the town once a profile exists. The game instance lives for the page.
  const hasProfile = profile !== null;
  useEffect(() => {
    if (!hasProfile || !profile) return;
    // Coming back from a casino game lands in the casino (?area=casino), not the plaza.
    const query = new URLSearchParams(window.location.search);
    const areaParam = query.get("area");
    // Entering the town always starts in your own room; only an explicit ?area= (e.g. back from the casino) overrides it.
    const startHome = !isStaticAreaId(areaParam);
    const session = loadCloudSession();
    const identity = {
      friendId: session?.friendId ?? "",
      shareLocation: loadShareLocation(),
      auth: session ? { userId: session.userId, password: session.password, sessionId: session.sessionId } : null,
    };
    const game = new TownGame(profile.name, profile.avatar, isStaticAreaId(areaParam) ? areaParam : undefined, identity, startHome);
    gameRef.current = game;
    const unsubscribe = game.subscribe(setSnapshot);
    const unsubscribeEvents = game.onEvent((event: TownEvent) => {
      if (event.type === "scratch" || event.type === "where") return;
      if (event.type === "coins") {
        addCoins(event.delta);
        const id = ++toastSeq.current;
        setToasts((list) => [...list.slice(-3), { id, text: `🪙 ${event.reason} +${event.delta} カジノコイン`, kind: "info" }]);
        window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
        return;
      }
      if (event.type === "login-required") {
        window.location.replace(`/arcade?reason=${event.expired ? "town-expired" : "town-login"}`);
        return;
      }
      if (event.type === "profile") {
        // The server's saved look for this account (e.g. set on another device).
        const next = { name: event.name, avatar: event.avatar };
        saveProfile(next);
        setProfile(next);
        return;
      }
      if (event.type === "spot") {
        const spot = event.game;
        if (spot === "arcade") window.location.href = ARCADE_URL;
        else if (spot === "fishing") setFishingOpen(true);
        else if (spot === "fishshop") setPointShop("fishing");
        else if (spot === "prizeshop") setPointShop("casino");
        else if (spot === "petshop") setPetPanel("shop");
        else if (spot === "gardenshop") setGardenBook("shop");
        else setCasinoGame(spot);
        return;
      }
      if (event.type === "fish-cast" || event.type === "fish-caught" || event.type === "fish-escaped") return;
      if (event.type === "shop-bought") {
        // Casino coins live in the browser: the prize counter takes them once the server has handed over the item.
        if (event.shop === "casino") addCoins(-event.price);
        const id = ++toastSeq.current;
        setToasts((list) => [...list.slice(-3), { id, text: `🛍 ${event.label} を手に入れました`, kind: "info" }]);
        window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
        return;
      }
      if (event.type === "pet-done") {
        let text = "";
        if (event.op === "buy") text = `🐾 ${event.label} をむかえました！`;
        else if (event.op === "rename") text = `なまえを「${event.label}」にしました`;
        else if (event.op === "pat") {
          text = event.hungry ? "おなかがすいているみたい…ごはんをあげよう" : event.gain ? `💗 なかよし度 +${event.gain}` : event.capped ? "今日はもう十分なかよし！（また明日）" : "すりすり";
        } else if (event.op === "feed") text = `🍖 もぐもぐ… なかよし度 +${event.gain ?? 0}`;
        else return;
        const id = ++toastSeq.current;
        setToasts((list) => [...list.slice(-3), { id, text, kind: "info" }]);
        window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
        return;
      }
      if (event.type === "garden-levelup") {
        const id = ++toastSeq.current;
        const text = `🌱 ガーデンレベル ${event.level}！${event.unlocks.length ? ` ${event.unlocks.slice(0, 3).join("・")}${event.unlocks.length > 3 ? " ほか" : ""}` : ""}`;
        setToasts((list) => [...list.slice(-3), { id, text, kind: "ame" }]);
        window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 5000);
        return;
      }
      if (event.type === "garden-news") {
        const id = ++toastSeq.current;
        setToasts((list) => [...list.slice(-3), { id, text: `🌱 ${event.text}`, kind: "info" }]);
        window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
        return;
      }
      if (event.type === "garden-done") {
        // Quick field work (till, water, weed, decorate) shows up in the garden itself, not as toasts.
        if (!event.label) return;
        const text = event.op === "sell" ? `${event.label} を売って 🍬+${event.total ?? 0}`
          : event.op === "harvest" || event.op === "harvestAll" ? event.label
          : event.op === "plant" ? (event.label.includes("植えました") ? `🌱 ${event.label}` : `🌱 ${event.label} を植えました`)
          : event.op === "water" ? `💧 ${event.label}`
          : event.op === "buy" ? `🛍 ${event.label} を手に入れました`
          : event.label;
        const id = ++toastSeq.current;
        setToasts((list) => [...list.slice(-3), { id, text, kind: "info" }]);
        window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
        return;
      }
      const text = event.type === "ame"
        ? `🍬 +${event.delta} ${event.reason}`
        : event.type === "bought" ? `🛍 ${event.label} を手に入れました` : event.text;
      const id = ++toastSeq.current;
      setToasts((list) => [...list.slice(-3), { id, text, kind: event.type === "ame" ? "ame" : event.type === "error" ? "error" : "info" }]);
      window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
      // A freshly bought room: go there right away.
      if (event.type === "bought" && event.roomId) game.visitRoom(event.roomId);
    });
    game.start();
    return () => {
      unsubscribe();
      unsubscribeEvents();
      game.dispose();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile edits go through updateProfile
  }, [hasProfile]);

  // Canvas sizing + render loop.
  useEffect(() => {
    const game = gameRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!game || !stage || !canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      game.resize(width, height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      game.frame(ctx, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [hasProfile]);

  useEffect(() => {
    const log = chatLogRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [snapshot?.chat.length]);

  // Keep the per-area online counts (and the room list, when open) fresh.
  useEffect(() => {
    if (!hasProfile) return;
    const tick = () => {
      gameRef.current?.refreshAreaCounts();
      if (roomsOpen) gameRef.current?.requestRooms();
      if (gardensOpen) gameRef.current?.requestGardens();
    };
    tick();
    const timer = window.setInterval(tick, 10000);
    return () => window.clearInterval(timer);
  }, [hasProfile, roomsOpen, gardensOpen]);

  // Leave edit mode whenever we're not in our own room.
  const isOwnRoom = Boolean(snapshot?.isOwnRoom);
  useEffect(() => {
    if (!isOwnRoom) setEditing(false);
  }, [isOwnRoom]);
  useEffect(() => {
    if (!editing) gameRef.current?.setGhost(null);
  }, [editing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPaletteOpen(false);
      setProfileId(null);
      setGardenPlotPos(null);
      setGardenBook(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const game = gameRef.current;
    if (!game) return;
    const [px, py] = pointerPos(e);
    const tile = game.tileAt(px, py);
    if (editing && snapshot?.room) {
      editor.pointerDown(tile);
      return;
    }
    const garden = snapshot?.garden;
    if (garden && tile && gardenTools.tool !== "hand") {
      handleGardenTool(tile[0], tile[1]);
      return;
    }
    const hit = game.avatarAt(px, py);
    if (hit) {
      setProfileId(hit);
      return;
    }
    if (garden && tile && gardenPlotAt(garden, tile[0], tile[1])) {
      setGardenPlotPos({ x: tile[0], y: tile[1] });
      return;
    }
    // Garden plots are not walkable: clicking one opens its card instead.
    if (tile && snapshot?.room) {
      const plot = itemAt(snapshot.room, tile[0], tile[1]);
      if (plot?.kind === "plot") {
        setPlotPos({ x: plot.x, y: plot.y });
        return;
      }
    }
    if (tile) game.moveTo(tile);
  };

  /** Use the selected garden tool on a tile. The server checks everything; errors come back as toasts. */
  const handleGardenTool = (x: number, y: number) => {
    const game = gameRef.current;
    const garden = snapshot?.garden;
    if (!game || !garden) return;
    const t = gardenTools;
    switch (t.tool) {
      case "till":
        game.gardenAct("till", { x, y });
        break;
      case "plant":
        if (!t.seed) {
          showToast("うえるたねを下からえらんでね", "error");
          return;
        }
        game.gardenAct("plant", { x, y, crop: t.seed });
        break;
      case "water":
        game.gardenAct("water", { x, y, area: t.wide });
        break;
      case "weed":
        game.gardenAct("weed", { x, y, area: t.wide });
        break;
      case "fert":
        if (!t.fert) {
          showToast("まくひりょうを下からえらんでね", "error");
          return;
        }
        game.gardenAct("fert", { x, y, fert: t.fert });
        break;
      case "harvest":
        game.gardenAct("harvest", { x, y });
        break;
      case "deco":
        game.gardenAct("decoPlace", { x, y, kind: t.deco });
        break;
      case "remove": {
        if (gardenDecoAt(garden, x, y)) {
          game.gardenAct("decoRemove", { x, y });
          break;
        }
        const plot = gardenPlotAt(garden, x, y);
        if (!plot) return;
        if (plot.crop && !window.confirm("育っている作物ごと畑を片づけます。いいですか？")) return;
        game.gardenAct("untill", { x, y });
        break;
      }
      default:
        break;
    }
  };

  const handleSaveProfile = (name: string, avatar: AvatarConfig) => {
    const next = { name, avatar };
    saveProfile(next);
    setProfile(next);
    setEditorOpen(false);
    gameRef.current?.updateProfile(name, avatar);
  };

  const sendChat = () => {
    if (!draft.trim()) return;
    gameRef.current?.say(draft);
    setDraft("");
  };

  const takePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 250);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = photoFileName();
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  // Games and panels belong to the place you opened them in.
  const areaId = snapshot?.areaId;
  useEffect(() => {
    setFishingOpen(false);
    setCasinoGame(null);
    setPlotPos(null);
    setGardenPlotPos(null);
    setGardenTools((t) => ({ ...t, tool: "hand" }));
  }, [areaId]);

  const walletItems = snapshot?.wallet?.items;
  const casinoItems = useMemo<CasinoItemsApi>(() => ({
    count: (id) => walletItems?.[id] ?? 0,
    use: (id) => gameRef.current?.useItem(id) ?? Promise.resolve(false),
  }), [walletItems]);

  const act = (action: ActionId) => gameRef.current?.act(action);
  const member = profileId ? gameRef.current?.memberInfo(profileId) ?? null : null;
  const inRoom = Boolean(snapshot?.room);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="ゲームセンターへ" onClick={() => { window.location.href = "/arcade?from=town"; }}>
          🎮<span className={styles.wideOnly}> ゲームセンター</span>
        </button>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>ネオンタウン</h1>
          <span className={styles.areaLabel}>
            {snapshot?.areaName ?? AREAS.plaza.name}
            {snapshot && snapshot.channel > 0 ? ` ・ ${snapshot.channel}` : ""}
          </span>
        </div>
        <div className={styles.headerRight}>
          {snapshot ? (
            <span className={styles.status} data-status={snapshot.status}>
              <span className={styles.statusDot} />
              {STATUS_LABEL[snapshot.status]}
              {snapshot.status === "online" ? ` ・ ${snapshot.memberCount}人` : ""}
            </span>
          ) : null}
          {profile ? (
            <>
              {snapshot?.wallet ? (
                <button type="button" className={styles.ameBadge} title="アメ（スクラッチ・ショップ）" onClick={() => setShopTab("scratch")}>
                  🍬 {(heldAme ?? snapshot.wallet.ame).toLocaleString()}
                </button>
              ) : null}
              {snapshot?.wallet ? (
                <button type="button" className={styles.pointBadge} title="釣りポイント（釣り具屋）" onClick={() => setPointShop("fishing")}>
                  🎣 {snapshot.wallet.fishPoints.toLocaleString()}
                </button>
              ) : null}
              <button type="button" className={styles.pointBadge} title="カジノコイン（景品交換所）" onClick={() => setPointShop("casino")}>
                🪙 {casinoBank.ready ? casinoBank.bank.toLocaleString() : "…"}
              </button>
              {snapshot?.wallet ? (
                <>
                  <button type="button" className={styles.iconButton} title="ミッション・じっせき" aria-label="ミッション" onClick={() => setMissionsOpen(true)}>
                    📋
                    {claimableCount(snapshot.wallet) > 0 ? <span className={styles.badgeDot}>{claimableCount(snapshot.wallet)}</span> : null}
                  </button>
                  <button type="button" className={styles.iconButton} title="ペット" aria-label="ペット" onClick={() => setPetPanel("mine")}>
                    🐾
                  </button>
                  <button type="button" className={styles.iconButton} title="ガーデン手帳（たね・りょうり・ちゅうもん・ずかん）" aria-label="ガーデン手帳" onClick={() => setGardenBook("shop")}>
                    🌱
                  </button>
                </>
              ) : null}
              <button type="button" className={styles.iconButton} title="ピグとも" aria-label="ピグとも" onClick={() => setFriendsOpen(true)}>
                👥
              </button>
              <button type="button" className={styles.iconButton} title="写真をとる" aria-label="写真をとる" onClick={takePhoto}>
                📷
              </button>
              <button type="button" className={styles.dressButton} onClick={() => setEditorOpen(true)}>
                <AvatarCanvas avatar={profile.avatar} width={28} height={28} focus="head" />
                <span className={styles.wideOnly}>着せかえ</span>
              </button>
            </>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.stageColumn}>
          <div ref={stageRef} className={styles.stage} data-editing={editing}>
            {profile ? (
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                onPointerMove={(e) => {
                  const game = gameRef.current;
                  if (!game) return;
                  const [px, py] = pointerPos(e);
                  const tile = game.tileAt(px, py);
                  if (editing) editor.pointerMove(tile);
                  else game.setHover(tile);
                }}
                onPointerLeave={() => {
                  gameRef.current?.setHover(null);
                  gameRef.current?.setGhost(null);
                }}
                onPointerDown={handlePointerDown}
              />
            ) : null}
            {flash ? <div className={styles.flash} /> : null}
            <div className={styles.toasts} aria-live="polite">
              {toasts.map((t) => (
                <div key={t.id} className={styles.toast} data-kind={t.kind}>{t.text}</div>
              ))}
            </div>
            {casinoGame ? (
              <CasinoItemsContext.Provider value={casinoItems}>
                <CasinoOverlay game={casinoGame} onClose={() => setCasinoGame(null)} />
              </CasinoItemsContext.Provider>
            ) : null}
            {fishingOpen && gameRef.current ? (
              <FishingPanel
                game={gameRef.current}
                wallet={snapshot?.wallet ?? null}
                onOpenShop={() => setPointShop("fishing")}
                onClose={() => setFishingOpen(false)}
              />
            ) : null}
            {snapshot?.garden && snapshot.wallet ? (
              <GardenToolbar
                garden={snapshot.garden}
                wallet={snapshot.wallet}
                isOwner={snapshot.isOwnGarden}
                clockOffset={snapshot.clockOffset}
                state={gardenTools}
                onChange={(next) => setGardenTools((t) => ({ ...t, ...next }))}
                onOpenBook={() => setGardenBook("shop")}
                onHarvestAll={() => gameRef.current?.gardenAct("harvestAll")}
              />
            ) : null}
            <p className={styles.hint} data-garden={Boolean(snapshot?.garden)}>
              {editing
                ? editor.pending || "ブロックを積んで、かいだんで2階へ ・ Ctrl+Z でもどす ・ Rキーで向き"
                : snapshot?.garden
                  ? gardenHint(gardenTools.tool, snapshot.isOwnGarden)
                  : "床をクリックで移動 ・ 人をクリックでプロフィール ・ 光っている場所から別のエリアへ"}
            </p>
            {snapshot?.status === "replaced" ? (
              <div className={styles.replacedOverlay}>
                <p>別のタブ・ウィンドウでタウンに入ったため、こちらは退出しました。</p>
                <button type="button" className={styles.primaryButton} onClick={() => gameRef.current?.reconnect()}>
                  こちらで入り直す
                </button>
              </div>
            ) : null}
          </div>

          <div className={styles.chatBarWrap}>
            {paletteOpen ? (
              <ActionPalette
                onAct={(a) => {
                  act(a);
                  setPaletteOpen(false);
                }}
                onClose={() => setPaletteOpen(false)}
              />
            ) : null}
            <form
              className={styles.chatBar}
              onSubmit={(e) => {
                e.preventDefault();
                sendChat();
              }}
            >
              <input
                className={styles.chatInput}
                value={draft}
                maxLength={80}
                placeholder="話しかけてみよう（Enterで送信）"
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className={styles.primaryButton} disabled={!draft.trim()}>
                送信
              </button>
              <div className={styles.emotes}>
                {QUICK_ACTIONS.map((b) => (
                  <button
                    key={b.action}
                    type="button"
                    className={styles.emoteButton}
                    title={b.label}
                    aria-label={b.label}
                    onClick={() => act(b.action)}
                  >
                    {b.icon}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.actionMenuButton}
                  aria-expanded={paletteOpen}
                  onClick={() => setPaletteOpen(!paletteOpen)}
                >
                  アクション
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className={styles.side}>
          {editing && snapshot?.room ? (
            <RoomEditorPanel
              key={snapshot.room.id}
              room={snapshot.room}
              ame={snapshot.wallet?.ame ?? 0}
              ownedFurniture={new Set(snapshot.wallet?.owned.furniture ?? [])}
              tool={editor.tool}
              kind={editor.kind}
              color={editor.color}
              turned={editor.turned}
              dir={editor.dir}
              pending={editor.pending}
              canUndo={editor.canUndo}
              canRedo={editor.canRedo}
              onTool={editor.setTool}
              onKind={editor.setKind}
              onColor={editor.setColor}
              onTurned={editor.setTurned}
              onDir={editor.setDir}
              onUndo={editor.undo}
              onRedo={editor.redo}
              onLayout={editor.layout}
              onStyle={(style) => editor.send({ op: "style", ...style })}
              onClear={() => editor.send({ op: "clear" })}
              onExpand={() => gameRef.current?.buy("expand", { roomId: snapshot.room?.id })}
              onOpenShop={() => setShopTab("shop")}
              onOpenPointShop={(shop) => setPointShop(shop)}
              onDone={() => setEditing(false)}
            />
          ) : (
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>エリア</h2>
              <ul className={styles.areaList}>
                {AREA_ORDER.map((id) => {
                  const current = snapshot?.areaId === id;
                  const count = snapshot?.areaCounts[id];
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={styles.areaButton}
                        aria-current={current ? "location" : undefined}
                        disabled={current}
                        onClick={() => gameRef.current?.changeArea(id)}
                      >
                        <span>{AREAS[id].name}</span>
                        <span className={styles.areaCount}>{typeof count === "number" ? `${count}人` : "—"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.roomButtons}>
                {isOwnRoom ? (
                  <button type="button" className={styles.primaryButton} onClick={() => setEditing(true)}>
                    へやを編集する
                  </button>
                ) : (
                  <button type="button" className={styles.primaryButton} onClick={() => gameRef.current?.goMyRoom()}>
                    マイルームへ
                  </button>
                )}
                <button
                  type="button"
                  className={styles.secondaryButton}
                  aria-expanded={roomsOpen}
                  onClick={() => setRoomsOpen(!roomsOpen)}
                >
                  みんなのへや
                </button>
              </div>
              <div className={styles.roomButtons}>
                <button
                  type="button"
                  className={styles.gardenButton}
                  disabled={snapshot?.isOwnGarden}
                  onClick={() => gameRef.current?.goMyGarden()}
                >
                  🌱 マイガーデンへ
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  aria-expanded={gardensOpen}
                  onClick={() => setGardensOpen(!gardensOpen)}
                >
                  みんなのガーデン
                </button>
              </div>
              {gardensOpen ? (
                <ul className={styles.roomList}>
                  {snapshot?.gardens.length ? (
                    snapshot.gardens.map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          className={styles.roomListButton}
                          aria-current={snapshot.areaId === `garden:${g.id}` ? "location" : undefined}
                          onClick={() => gameRef.current?.visitGarden(g.id)}
                        >
                          <span className={styles.roomListTitle}>
                            🌱 {g.owner}のガーデン
                            {g.mine ? <em>（じぶん）</em> : null}
                          </span>
                          <span className={styles.areaCount}>
                            {g.count > 0 ? `${g.count}人 ・ ` : ""}Lv.{g.level} ・ 畑{g.plots} ・ そだち中{g.growing}
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className={styles.chatSystem}>まだガーデンはありません</li>
                  )}
                </ul>
              ) : null}

              {snapshot?.wallet && snapshot.wallet.rooms.length > 1 ? (
                <ul className={styles.myRooms} aria-label="じぶんのへや">
                  {snapshot.wallet.rooms.map((r, i) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className={styles.chip}
                        data-active={snapshot.areaId === `room:${r.id}`}
                        onClick={() => gameRef.current?.visitRoom(r.id)}
                      >
                        {r.title || `へや${i + 1}`}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {inRoom && snapshot?.room ? (
                <p className={styles.roomInfo}>
                  {snapshot.room.owner ? `${snapshot.room.owner} さんのへや` : "へや"} ・ ★ {snapshot.room.goodPigg ?? 0}
                </p>
              ) : null}

              {roomsOpen ? (
                <ul className={styles.roomList}>
                  {snapshot?.rooms.length ? (
                    snapshot.rooms.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className={styles.roomListButton}
                          aria-current={snapshot.areaId === `room:${r.id}` ? "location" : undefined}
                          onClick={() => gameRef.current?.visitRoom(r.id)}
                        >
                          <span className={styles.roomListTitle}>
                            {r.title || `${r.owner}のへや`}
                            {r.mine ? <em>（じぶん）</em> : null}
                          </span>
                          <span className={styles.areaCount}>
                            {r.count > 0 ? `${r.count}人 ・ ` : ""}家具{r.items} ・ ★{r.goodPigg}
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className={styles.chatSystem}>まだ公開されているへやはありません</li>
                  )}
                </ul>
              ) : null}
            </section>
          )}

          <section className={`${styles.panel} ${styles.chatPanel}`}>
            <h2 className={styles.panelTitle}>チャット</h2>
            <div ref={chatLogRef} className={styles.chatLog} aria-live="polite">
              {snapshot?.chat.length ? (
                snapshot.chat.map((line, i) => (
                  <p key={`${line.at}-${i}`} className={line.system ? styles.chatSystem : styles.chatLine}>
                    {line.system ? line.text : (
                      <>
                        <strong>{line.name}</strong>
                        {line.text}
                      </>
                    )}
                  </p>
                ))
              ) : (
                <p className={styles.chatSystem}>まだ発言はありません</p>
              )}
            </div>
          </section>
        </aside>
      </main>

      {member ? (
        <ProfileCard
          member={member}
          onPraise={() => gameRef.current?.praise(member.id)}
          onWave={() => {
            act("wave");
            setProfileId(null);
          }}
          onVisitRoom={() => {
            gameRef.current?.visitRoom(member.roomId);
            setProfileId(null);
          }}
          onDressUp={() => {
            setProfileId(null);
            setEditorOpen(true);
          }}
          onAddFriend={cloudSession && member.friendId && !member.isSelf && member.friendId !== cloudSession.friendId
            ? () => {
              void addFriend(member.friendId);
              setProfileId(null);
            }
            : undefined}
          onVisitGarden={member.gardenId ? () => {
            gameRef.current?.visitGarden(member.gardenId);
            setProfileId(null);
          } : undefined}
          onClose={() => setProfileId(null)}
        />
      ) : null}

      {pointShop && snapshot?.wallet && gameRef.current && profile ? (
        <PointShop
          game={gameRef.current}
          wallet={snapshot.wallet}
          avatar={profile.avatar}
          coins={casinoBank.bank}
          initialShop={pointShop}
          onClose={() => setPointShop(null)}
        />
      ) : null}

      {petPanel && snapshot?.wallet && gameRef.current ? (
        <PetPanel game={gameRef.current} wallet={snapshot.wallet} initialTab={petPanel} onClose={() => setPetPanel(null)} />
      ) : null}

      {missionsOpen && snapshot?.wallet && gameRef.current ? (
        <MissionPanel game={gameRef.current} wallet={snapshot.wallet} onClose={() => setMissionsOpen(false)} />
      ) : null}

      {gardenBook && snapshot?.wallet && gameRef.current ? (
        <GardenBook game={gameRef.current} wallet={snapshot.wallet} initialTab={gardenBook} onClose={() => setGardenBook(null)} />
      ) : null}

      {gardenPlotPos && snapshot?.garden && snapshot.wallet && gameRef.current ? (() => {
        const plot = gardenPlotAt(snapshot.garden, gardenPlotPos.x, gardenPlotPos.y);
        return plot ? (
          <GardenPlotCard
            game={gameRef.current}
            garden={snapshot.garden}
            plot={plot}
            wallet={snapshot.wallet}
            isOwner={snapshot.isOwnGarden}
            clockOffset={snapshot.clockOffset}
            onClose={() => setGardenPlotPos(null)}
          />
        ) : null;
      })() : null}

      {plotPos && snapshot?.room && gameRef.current ? (() => {
        const item = itemAt(snapshot.room, plotPos.x, plotPos.y);
        return item?.kind === "plot" ? (
          <PlotPopup game={gameRef.current} item={item} wallet={snapshot.wallet} isOwner={snapshot.isOwnRoom} onClose={() => setPlotPos(null)} />
        ) : null;
      })() : null}

      {friendsOpen && gameRef.current ? (
        <FriendsPanel
          game={gameRef.current}
          session={cloudSession}
          shareLocation={shareLocation}
          onShareLocation={handleShareLocation}
          onClose={() => setFriendsOpen(false)}
        />
      ) : null}

      {profileLoaded && editorOpen ? (
        <AvatarEditor
          initialName={profile?.name || defaultName()}
          initialAvatar={profile?.avatar || DEFAULT_AVATAR}
          required={!profile}
          onSave={handleSaveProfile}
          onCancel={() => setEditorOpen(false)}
          ownedParts={new Set(snapshot?.wallet?.owned.parts ?? [])}
          onOpenShop={snapshot?.wallet ? () => setShopTab("shop") : undefined}
          onOpenPointShop={snapshot?.wallet ? (shop) => setPointShop(shop) : undefined}
        />
      ) : null}

      {shopTab && snapshot?.wallet && gameRef.current && profile ? (
        <AmeShop
          game={gameRef.current}
          wallet={snapshot.wallet}
          avatar={profile.avatar}
          currentRoom={snapshot.isOwnRoom && snapshot.room ? { id: snapshot.room.id, size: snapshot.room.size } : null}
          initialTab={shopTab}
          onHoldBalance={setHeldAme}
          onClose={() => setShopTab(null)}
        />
      ) : null}
    </div>
  );
}

