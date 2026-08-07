"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCombat = applyCombat;
function applyCombat(monsters, invaders, deltaSec) {
    let killedInvaders = 0;
    for (const monster of monsters) {
        if (!monster.isActive || monster.state === "dead")
            continue;
        monster.attackTimer -= deltaSec;
        if (monster.attackTimer > 0)
            continue;
        let target = null;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const invader of invaders) {
            if (invader.state === "dead")
                continue;
            const dx = invader.position.x - monster.position.x;
            const dy = invader.position.y - monster.position.y;
            const d = Math.hypot(dx, dy);
            if (d <= monster.range && d < bestDist) {
                bestDist = d;
                target = invader;
            }
        }
        if (!target)
            continue;
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
