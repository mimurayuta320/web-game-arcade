import type { Invader, Monster } from "../types/game";

const INVADER_BUCKET_SIZE = 3;

function bucketKey(x: number, y: number): string {
  const bx = Math.floor(x / INVADER_BUCKET_SIZE);
  const by = Math.floor(y / INVADER_BUCKET_SIZE);
  return `${bx}:${by}`;
}

export function applyCombat(monsters: Monster[], invaders: Invader[], deltaSec: number): number {
  let killedInvaders = 0;
  const invaderBuckets = new Map<string, Invader[]>();

  for (const invader of invaders) {
    if (invader.state === "dead") continue;
    const key = bucketKey(invader.position.x, invader.position.y);
    const list = invaderBuckets.get(key);
    if (list) list.push(invader);
    else invaderBuckets.set(key, [invader]);
  }

  for (const monster of monsters) {
    if (!monster.isActive || monster.state === "dead") continue;
    monster.attackTimer -= deltaSec;
    if (monster.attackTimer > 0) continue;

    let target: Invader | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    const rangeBucket = Math.max(1, Math.ceil(monster.range / INVADER_BUCKET_SIZE));
    const centerBx = Math.floor(monster.position.x / INVADER_BUCKET_SIZE);
    const centerBy = Math.floor(monster.position.y / INVADER_BUCKET_SIZE);

    for (let by = centerBy - rangeBucket; by <= centerBy + rangeBucket; by += 1) {
      for (let bx = centerBx - rangeBucket; bx <= centerBx + rangeBucket; bx += 1) {
        const near = invaderBuckets.get(`${bx}:${by}`);
        if (!near) continue;
        for (const invader of near) {
          if (invader.state === "dead") continue;
          const dx = invader.position.x - monster.position.x;
          const dy = invader.position.y - monster.position.y;
          const d = Math.hypot(dx, dy);
          if (d <= monster.range && d < bestDist) {
            bestDist = d;
            target = invader;
          }
        }
      }
    }

    if (!target) continue;
    target.hp -= monster.attack;
    monster.attackTimer = monster.attackCooldown;
    monster.state = "attack";
    if (target.hp <= 0 && target.state !== "dead") {
      target.state = "dead";
      killedInvaders += 1;
    }
  }

  return killedInvaders;
}
