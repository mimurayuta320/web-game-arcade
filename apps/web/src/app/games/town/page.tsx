"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./town.module.css";
import { AvatarEditor } from "@/games/town/components/AvatarEditor";
import { AvatarCanvas } from "@/games/town/components/AvatarCanvas";
import { ActionPalette } from "@/games/town/components/ActionPalette";
import { ProfileCard } from "@/games/town/components/ProfileCard";
import { RoomEditorPanel, type RoomTool } from "@/games/town/components/RoomEditorPanel";
import { AmeShop } from "@/games/town/components/AmeShop";
import { DEFAULT_AVATAR, normalizeAvatar, type AvatarConfig } from "@/games/town/avatar/parts";
import type { ActionId } from "@/games/town/avatar/actions";
import { AREAS, AREA_ORDER } from "@/games/town/world/areas";
import {
  FURNITURE_BY_KIND, FURNITURE_COLORS, canPlaceItem, footprintOf, itemAt, type FurnitureKind,
} from "@/games/town/world/furniture";
import { TownGame, type TownEvent, type TownSnapshot } from "@/games/town/core/TownGame";

const PROFILE_STORAGE_KEY = "neon-town-profile-v1";
const CLOUD_USER_ID_STORAGE_KEY = "neon-cloud-user-id";

type Profile = { name: string; avatar: AvatarConfig };

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
  const [tool, setTool] = useState<RoomTool>("place");
  const [furnitureKind, setFurnitureKind] = useState<FurnitureKind>("sofa");
  const [furnitureColor, setFurnitureColor] = useState(FURNITURE_COLORS[5]);
  const [flash, setFlash] = useState(false);
  const [turned, setTurned] = useState(false);
  const [shopTab, setShopTab] = useState<"scratch" | "shop" | "earn" | null>(null);
  const [heldAme, setHeldAme] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; kind: "ame" | "info" | "error" }>>([]);
  const toastSeq = useRef(0);
  const gameRef = useRef<TownGame | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = loadProfile();
    setProfile(saved);
    setEditorOpen(!saved);
    setProfileLoaded(true);
  }, []);

  // Start the town once a profile exists. The game instance lives for the page.
  const hasProfile = profile !== null;
  useEffect(() => {
    if (!hasProfile || !profile) return;
    const game = new TownGame(profile.name, profile.avatar);
    gameRef.current = game;
    const unsubscribe = game.subscribe(setSnapshot);
    const unsubscribeEvents = game.onEvent((event: TownEvent) => {
      if (event.type === "scratch") return;
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
    };
    tick();
    const timer = window.setInterval(tick, 10000);
    return () => window.clearInterval(timer);
  }, [hasProfile, roomsOpen]);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };

  const updateGhost = (tile: [number, number] | null) => {
    const game = gameRef.current;
    const room = snapshot?.room;
    if (!game || !room || !tile) {
      game?.setGhost(null);
      return;
    }
    if (tool === "remove" || tool === "rotate") {
      const hit = itemAt(room, tile[0], tile[1]);
      if (!hit) {
        game.setGhost(null);
        return;
      }
      if (tool === "rotate") {
        // Preview the turned piece; red when it wouldn't fit.
        const turnedItem = { ...hit, rot: hit.rot ? undefined : (1 as const) };
        const { w, h } = footprintOf(turnedItem);
        game.setGhost({
          object: { ...turnedItem, w, h, flat: FURNITURE_BY_KIND.get(hit.kind)?.flat },
          valid: canPlaceItem(room, turnedItem, hit),
        });
        return;
      }
      const { w, h } = footprintOf(hit);
      game.setGhost({ object: { ...hit, w, h, flat: FURNITURE_BY_KIND.get(hit.kind)?.flat }, valid: false });
      return;
    }
    const item = newItemAt(tile);
    const { w, h } = footprintOf(item);
    game.setGhost({
      object: { ...item, w, h, flat: FURNITURE_BY_KIND.get(furnitureKind)?.flat },
      valid: canPlaceItem(room, item),
    });
  };

  const newItemAt = (tile: [number, number]) => {
    const def = FURNITURE_BY_KIND.get(furnitureKind);
    return {
      kind: furnitureKind,
      x: tile[0],
      y: tile[1],
      color: def?.colorable ? furnitureColor : undefined,
      rot: turned && def && def.w !== def.h ? (1 as const) : undefined,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const game = gameRef.current;
    if (!game) return;
    const [px, py] = pointerPos(e);
    const tile = game.tileAt(px, py);
    if (editing && snapshot?.room) {
      if (!tile) return;
      if (tool === "remove" || tool === "rotate") {
        game.roomEdit({ op: tool, x: tile[0], y: tile[1] });
      } else {
        const item = newItemAt(tile);
        if (canPlaceItem(snapshot.room, item)) game.roomEdit({ op: "place", item });
      }
      return;
    }
    const hit = game.avatarAt(px, py);
    if (hit) {
      setProfileId(hit);
      return;
    }
    if (tile) game.moveTo(tile);
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

  const act = (action: ActionId) => gameRef.current?.act(action);
  const member = profileId ? gameRef.current?.memberInfo(profileId) ?? null : null;
  const inRoom = Boolean(snapshot?.room);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="アーケードへ" onClick={() => { window.location.href = "/"; }}>
          ←<span className={styles.wideOnly}> アーケードへ</span>
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
                  if (editing) updateGhost(tile);
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
            <p className={styles.hint}>
              {editing
                ? tool === "place" ? "床をクリックして家具をおく" : "家具をクリックして片づける"
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
              tool={tool}
              kind={furnitureKind}
              color={furnitureColor}
              turned={turned}
              onTool={setTool}
              onKind={setFurnitureKind}
              onColor={setFurnitureColor}
              onTurned={setTurned}
              onStyle={(style) => gameRef.current?.roomEdit({ op: "style", ...style })}
              onClear={() => gameRef.current?.roomEdit({ op: "clear" })}
              onExpand={() => gameRef.current?.buy("expand", { roomId: snapshot.room?.id })}
              onOpenShop={() => setShopTab("shop")}
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
          onClose={() => setProfileId(null)}
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

