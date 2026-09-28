import type { Metadata } from "next";
import { CasinoLobby } from "@/games/casino/components/CasinoLobby";

export const metadata: Metadata = { title: "ネオン カジノ | Neon Board Arcade" };

export default function CasinoPage() {
  return <CasinoLobby />;
}
