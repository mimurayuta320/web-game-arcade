import type { Metadata } from "next";
import { RouletteTable } from "@/games/casino/components/RouletteTable";

export const metadata: Metadata = { title: "ネオン ルーレット | Neon Board Arcade" };

export default function RoulettePage() {
  return <RouletteTable />;
}
