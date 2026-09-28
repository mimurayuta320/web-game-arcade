"use client";

import { Blackjack } from "./Blackjack";
import { HighLow } from "./HighLow";
import { SicBo } from "./SicBo";
import { RouletteTable } from "./RouletteTable";
import { SlotMachine } from "./SlotMachine";
import { VideoPoker } from "./VideoPoker";

export type OverlayGame = "slots" | "roulette" | "blackjack" | "poker" | "highlow" | "sicbo";

/** A casino game played inside the town: a dialog over the world, the avatar stays where it stands. */
export function CasinoOverlay({ game, onClose }: { game: OverlayGame; onClose: () => void }) {
  switch (game) {
    case "slots": return <SlotMachine embedded onClose={onClose} />;
    case "roulette": return <RouletteTable embedded onClose={onClose} />;
    case "blackjack": return <Blackjack embedded onClose={onClose} />;
    case "poker": return <VideoPoker embedded onClose={onClose} />;
    case "highlow": return <HighLow embedded onClose={onClose} />;
    case "sicbo": return <SicBo embedded onClose={onClose} />;
    default: return null;
  }
}
