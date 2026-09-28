"use client";

import Link from "next/link";
import styles from "../casino.module.css";
import { CasinoShell } from "./CasinoShell";
import { useCasinoBank } from "../useCasinoBank";

const GAMES = [
  { href: "/games/casino/slots", icon: "🎰", name: "スロット", desc: "3リール・5ライン。7が揃えば最大300倍。", meta: "1人プレイ" },
  { href: "/games/casino/roulette", icon: "🎡", name: "ルーレット", desc: "ヨーロピアン(0が1つ)。数字・赤黒・ダースなど自由に賭けられます。", meta: "1人プレイ" },
  { href: "/games/casino/blackjack", icon: "🃏", name: "ブラックジャック", desc: "ヒット・スタンド・ダブルダウンで21を目指す定番。ブラックジャックは3:2。", meta: "1人プレイ" },
  { href: "/games/casino/videopoker", icon: "♠️", name: "ビデオポーカー", desc: "5枚配って1回だけ引き直し。ジャックス・オア・ベター。", meta: "1人プレイ" },
  { href: "/games/casino/highlow", icon: "⬆️", name: "ハイ＆ロー", desc: "次のカードは大きい？小さい？ 連勝するほどポットが育ち、いつでもうけとれます。", meta: "1人プレイ" },
  { href: "/games/casino/sicbo", icon: "🎲", name: "サイコロ（大小）", desc: "3つのサイコロ。大・小は1:1、数字はその目の数だけ配当。", meta: "1人プレイ" },
  { href: "/arcade?panel=blackjack", icon: "🎴", name: "ブラックジャック（ルーム対戦）", desc: "ゲームセンター側の対戦ルーム対応版です。", meta: "ゲームセンター" },
  { href: "/arcade?panel=poker", icon: "🃏", name: "ポーカー（対人・CPU戦）", desc: "ゲームセンター側で遊びます。", meta: "ゲームセンター" },
] as const;

export function CasinoLobby() {
  const { ready, bank, refillIfBroke } = useCasinoBank();
  return (
    <CasinoShell title="ネオン カジノ" bank={bank} ready={ready} showLobbyLink={false}>
      <section className={styles.lobbyGrid} aria-label="ゲーム一覧">
        {GAMES.map((game) => (
          <Link className={styles.lobbyCard} href={game.href} key={game.href}>
            <span className={styles.lobbyIcon} aria-hidden="true">{game.icon}</span>
            <span className={styles.lobbyName}>{game.name}</span>
            <span className={styles.lobbyDesc}>{game.desc}</span>
            <span className={styles.lobbyMeta}>{game.meta}</span>
          </Link>
        ))}
      </section>
      {ready && bank < 10 ? (
        <button className={styles.button} onClick={() => refillIfBroke()}>コインがなくなりました — 1,000枚もらう</button>
      ) : null}
    </CasinoShell>
  );
}
