import type { Metadata } from "next";
import { SicBo } from "@/games/casino/components/SicBo";

export const metadata: Metadata = { title: "サイコロ（大小） | Neon Board Arcade" };

export default function SicBoPage() {
  return <SicBo />;
}
