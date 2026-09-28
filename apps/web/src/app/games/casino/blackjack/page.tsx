import type { Metadata } from "next";
import { Blackjack } from "@/games/casino/components/Blackjack";

export const metadata: Metadata = { title: "ブラックジャック | Neon Board Arcade" };

export default function BlackjackPage() {
  return <Blackjack />;
}
