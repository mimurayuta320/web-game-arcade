import type { Metadata } from "next";
import { SlotMachine } from "@/games/casino/components/SlotMachine";

export const metadata: Metadata = { title: "ネオン スロット | Neon Board Arcade" };

export default function SlotsPage() {
  return <SlotMachine />;
}
