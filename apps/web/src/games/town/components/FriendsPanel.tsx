"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { FriendLocation, TownGame } from "../core/TownGame";
import { AREAS, isStaticAreaId } from "../world/areas";
import {
  friendErrorText, friendsApi, type CloudSession, type FriendEntry, type FriendsSnapshot,
} from "../friends/cloudFriends";

type Props = {
  game: TownGame;
  session: CloudSession | null;
  shareLocation: boolean;
  onShareLocation: (value: boolean) => void;
  onClose: () => void;
};

const REFRESH_LISTS_MS = 30000;
const REFRESH_WHERE_MS = 8000;

function whereText(loc: FriendLocation): string {
  const name = isStaticAreaId(loc.area) ? AREAS[loc.area].name : loc.area.startsWith("room:") ? "へや" : loc.area;
  return `${name}（${loc.channel}）`;
}

/** Pigg-style friends list: who is around, go meet them, and manage requests. */
export function FriendsPanel({ game, session, shareLocation, onShareLocation, onClose }: Props) {
  const [data, setData] = useState<FriendsSnapshot | null>(null);
  const [locations, setLocations] = useState<Map<string, FriendLocation>>(new Map());
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendEntry[] | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!session) return;
    try {
      setData(await friendsApi.load(session));
    } catch (error) {
      setMessage(friendErrorText(error));
    }
  }, [session]);

  useEffect(() => {
    if (!session) return undefined;
    void reload();
    const timer = window.setInterval(() => void reload(), REFRESH_LISTS_MS);
    return () => window.clearInterval(timer);
  }, [reload, session]);

  useEffect(() => game.onEvent((event) => {
    if (event.type !== "where") return;
    setLocations(new Map(event.found.map((loc) => [loc.friendId, loc])));
  }), [game]);

  const friendIds = data?.friends.map((f) => f.friendId).join(",") ?? "";
  useEffect(() => {
    if (!friendIds) return undefined;
    const ids = friendIds.split(",");
    game.whereFriends(ids);
    const timer = window.setInterval(() => game.whereFriends(ids), REFRESH_WHERE_MS);
    return () => window.clearInterval(timer);
  }, [friendIds, game]);

  const run = async (action: () => Promise<void>, done: string) => {
    if (!session || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(done);
      await reload();
    } catch (error) {
      setMessage(friendErrorText(error));
    } finally {
      setBusy(false);
    }
  };

  const search = async () => {
    if (!session || !query.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      setResults(await friendsApi.search(session, query.trim()));
    } catch (error) {
      setMessage(friendErrorText(error));
    } finally {
      setBusy(false);
    }
  };

  const knownIds = new Set([
    ...(data?.friends ?? []), ...(data?.incoming ?? []), ...(data?.outgoing ?? []),
  ].map((f) => f.friendId));

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="ピグとも" onClick={onClose}>
      <div className={styles.friendsPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <h2 className={styles.ameHeading} style={{ margin: 0 }}>ピグとも</h2>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>

        {!session ? (
          <p className={styles.ameNote}>
            ピグともを使うには、ゲームセンター画面でログインしてください。
            <br />
            <a href="/arcade?from=town">ゲームセンターへ</a>
          </p>
        ) : (
          <>
            <label className={styles.friendToggle}>
              <input type="checkbox" checked={shareLocation} onChange={(e) => onShareLocation(e.target.checked)} />
              いる場所をピグともに教える
            </label>

            {message ? <p className={styles.ameNote} role="status">{message}</p> : null}

            {data && data.incoming.length > 0 ? (
              <section>
                <h3 className={styles.ameHeading}>届いている申請</h3>
                <ul className={styles.friendList}>
                  {data.incoming.map((f) => (
                    <li key={f.friendId} className={styles.friendRow}>
                      <span className={styles.friendName}>{f.playerName}</span>
                      <span className={styles.friendActions}>
                        <button type="button" className={styles.buyButton} disabled={busy} onClick={() => run(() => friendsApi.approve(session, f.friendId), "ピグともになりました")}>承認</button>
                        <button type="button" className={styles.friendGhostButton} disabled={busy} onClick={() => run(() => friendsApi.reject(session, f.friendId), "ことわりました")}>ことわる</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h3 className={styles.ameHeading}>ピグとも {data ? `（${data.friends.length}）` : ""}</h3>
              {data && data.friends.length === 0 ? (
                <p className={styles.ameNote}>まだピグともがいません。町で会った人のプロフィールから申請できます。</p>
              ) : null}
              <ul className={styles.friendList}>
                {(data?.friends ?? []).map((f) => {
                  const loc = locations.get(f.friendId);
                  return (
                    <li key={f.friendId} className={styles.friendRow}>
                      <span className={styles.friendName}>
                        <span className={styles.friendDot} data-online={Boolean(loc)} aria-hidden="true" />
                        {f.playerName}
                        <small className={styles.friendWhere}>{loc ? whereText(loc) : "町にいません"}</small>
                      </span>
                      <span className={styles.friendActions}>
                        <button
                          type="button"
                          className={styles.buyButton}
                          disabled={!loc}
                          onClick={() => {
                            if (!loc) return;
                            game.warpToFriend(loc);
                            onClose();
                          }}
                        >
                          会いに行く
                        </button>
                        <button
                          type="button"
                          className={styles.friendGhostButton}
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`${f.playerName} さんをピグともから外しますか？`)) {
                              void run(() => friendsApi.remove(session, f.friendId), "ピグともから外しました");
                            }
                          }}
                        >
                          外す
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {data && data.outgoing.length > 0 ? (
              <section>
                <h3 className={styles.ameHeading}>申請中</h3>
                <ul className={styles.friendList}>
                  {data.outgoing.map((f) => (
                    <li key={f.friendId} className={styles.friendRow}>
                      <span className={styles.friendName}>{f.playerName}</span>
                      <button type="button" className={styles.friendGhostButton} disabled={busy} onClick={() => run(() => friendsApi.cancel(session, f.friendId), "申請を取り消しました")}>取り消す</button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h3 className={styles.ameHeading}>ユーザーをさがす</h3>
              <form
                className={styles.friendSearch}
                onSubmit={(e) => {
                  e.preventDefault();
                  void search();
                }}
              >
                <input
                  className={styles.friendInput}
                  value={query}
                  maxLength={24}
                  placeholder="名前 または フレンドID"
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className={styles.primaryButton} disabled={busy || !query.trim()}>さがす</button>
              </form>
              {results ? (
                results.length === 0 ? (
                  <p className={styles.ameNote}>見つかりませんでした</p>
                ) : (
                  <ul className={styles.friendList}>
                    {results.map((f) => (
                      <li key={f.friendId} className={styles.friendRow}>
                        <span className={styles.friendName}>{f.playerName}<small className={styles.friendWhere}>{f.friendId}</small></span>
                        {knownIds.has(f.friendId) ? (
                          <span className={styles.ownedTag}>申請ずみ・ピグとも</span>
                        ) : (
                          <button type="button" className={styles.buyButton} disabled={busy} onClick={() => run(() => friendsApi.sendRequest(session, f.friendId), "申請しました")}>申請</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </section>

            <p className={styles.ameNote}>ピグともの居場所は、相手が「教える」設定のときだけ表示されます。</p>
          </>
        )}
      </div>
    </div>
  );
}
