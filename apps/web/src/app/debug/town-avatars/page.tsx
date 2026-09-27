"use client";

import { AVATAR_CATEGORIES, DEFAULT_AVATAR } from "@/games/town/avatar/parts";
import { ACTIONS } from "@/games/town/avatar/actions";
import { AvatarCanvas } from "@/games/town/components/AvatarCanvas";
import { FurnitureIcon } from "@/games/town/components/FurnitureIcon";
import { FURNITURE } from "@/games/town/world/furniture";

/** Visual QA sheet for every avatar part, action and furniture piece. */
export default function TownAvatarsDebugPage() {
  return (
    <main style={{ padding: 16, background: "#fff6ea", color: "#3a2c2c", minHeight: "100dvh", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20 }}>Town avatar parts</h1>
      {AVATAR_CATEGORIES.map((category) => (
        <section key={category.key} style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14 }}>{category.label}（{category.options.length}）</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {category.options.map((option) => (
              <figure key={option.id} style={{ margin: 0, textAlign: "center", fontSize: 11, background: "#fff", borderRadius: 8, padding: 4 }}>
                <AvatarCanvas
                  avatar={{ ...DEFAULT_AVATAR, [category.key]: option.id }}
                  width={130}
                  height={160}
                  facing={category.thumbBack ? "back" : "front"}
                  focus={category.group === "face" && category.key !== "hair" ? "head" : "body"}
                />
                <figcaption>{option.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <h2 style={{ fontSize: 14 }}>アクション（{ACTIONS.length}）</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {ACTIONS.map((a) => (
          <figure key={a.id} style={{ margin: 0, textAlign: "center", fontSize: 11, background: "#fff", borderRadius: 8, padding: 4 }}>
            <AvatarCanvas avatar={DEFAULT_AVATAR} width={130} height={160} action={a.id} />
            <figcaption>{a.label}</figcaption>
          </figure>
        ))}
      </div>
      <h2 style={{ fontSize: 14 }}>家具（{FURNITURE.length}）</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {FURNITURE.map((f) => (
          <figure key={f.kind} style={{ margin: 0, textAlign: "center", fontSize: 11, background: "#fff", borderRadius: 8, padding: 4 }}>
            <FurnitureIcon kind={f.kind} size={96} />
            <figcaption>{f.label}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
