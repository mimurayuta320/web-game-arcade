import type { Metadata } from "next";
import { VideoPoker } from "@/games/casino/components/VideoPoker";

export const metadata: Metadata = { title: "ビデオポーカー | Neon Board Arcade" };

export default function VideoPokerPage() {
  return <VideoPoker />;
}
