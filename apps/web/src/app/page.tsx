import type { Metadata } from "next";

export const metadata: Metadata = { title: "ネオンタウン | Neon Board Arcade" };

// The town is the front door; the old arcade menu lives at /arcade (the "ゲームセンター").
export { default } from "./games/town/page";
