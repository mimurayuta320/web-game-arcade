import type { Metadata } from "next";
import { HighLow } from "@/games/casino/components/HighLow";

export const metadata: Metadata = { title: "ハイ＆ロー | Neon Board Arcade" };

export default function HighLowPage() {
  return <HighLow />;
}
