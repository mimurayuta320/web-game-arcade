// Balance check for the reel model: a simulated player holds and lets go when the shrinking circle should be
// inside the frame. Human timing error is modelled as a per-round offset (in shrink progress) with some spread.
// Run: node --no-warnings scripts/reel-sim.mjs
import { newReel, stepReel, perfectRatio, sizeForRadius, SHRINK_TIME } from "../apps/web/src/games/town/fishing/reel.ts";

const rods = { bamboo: { zone: 1, drain: 1 }, carbon: { zone: 1.3, drain: 0.8 }, master: { zone: 1.65, drain: 0.6 } };
const fishes = {
  haze: { power: 0.3, speed: 1.0, frame: 1.35 },
  saba: { power: 0.55, speed: 1.1, frame: 1.0 },
  tai: { power: 0.75, speed: 1.2, frame: 0.8 },
  maguro: { power: 1.0, speed: 1.5, frame: 0.7 },
};

const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());

// sigma: timing error in seconds when letting go (a fast fish shrinks the circle faster, so the same error costs more).
function play(fish, rod, sigma) {
  let s = newReel();
  const dt = 1 / 60;
  let releaseAt = null;
  while (!s.done) {
    if (s.mode === "hold" && releaseAt === null) releaseAt = sizeForRadius(s.target) + gauss() * sigma * Math.max(0.5, fish.speed) * s.pace / SHRINK_TIME;
    if (s.mode !== "hold") releaseAt = null;
    const holding = s.mode === "hold" ? s.size < releaseAt : true;
    s = stepReel(s, dt, { holding }, fish, rod, Math.random);
  }
  return { caught: s.done === "caught", time: s.elapsed, perfect: perfectRatio(s), rounds: s.rounds };
}

for (const [fn, fish] of Object.entries(fishes)) {
  for (const [rn, rod] of Object.entries(rods)) {
    for (const [label, spread] of [["sloppy", 0.22], ["decent", 0.13], ["sharp", 0.07]]) {
      let c = 0, t = 0, p = 0, n = 0;
      const N = 300;
      for (let i = 0; i < N; i++) {
        const r = play(fish, rod, spread);
        c += r.caught; t += r.time; p += r.perfect; n += r.rounds;
      }
      console.log(fn.padEnd(7), rn.padEnd(7), label.padEnd(7), "catch", `${((c / N) * 100).toFixed(0)}%`, "avgTime", `${(t / N).toFixed(1)}s`, "rounds", (n / N).toFixed(1), "perfect", `${((p / N) * 100).toFixed(0)}%`);
    }
  }
}
let idle = newReel();
while (!idle.done) idle = stepReel(idle, 1 / 60, { holding: false }, fishes.haze, rods.bamboo, Math.random);
console.log("never hold ->", idle.done, `${idle.elapsed.toFixed(1)}s`);
let hold = newReel();
while (!hold.done) hold = stepReel(hold, 1 / 60, { holding: true }, fishes.saba, rods.bamboo, Math.random);
console.log("hold forever ->", hold.done, `${hold.elapsed.toFixed(1)}s`);
let tap = newReel();
while (!tap.done) { tap = stepReel(tap, 1 / 60, { holding: tap.mode !== "hold" || tap.size < 0.05 }, fishes.saba, rods.bamboo, Math.random); }
console.log("tap spam ->", tap.done, `${tap.elapsed.toFixed(1)}s`);
