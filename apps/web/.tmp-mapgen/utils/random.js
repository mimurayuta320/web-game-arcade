"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeededRandom = void 0;
exports.randomInt = randomInt;
exports.hashInt = hashInt;
exports.hash2d = hash2d;
exports.randomPick = randomPick;
exports.randomFloat = randomFloat;
exports.weightedPick = weightedPick;
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function hashInt(seed) {
    let x = seed | 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
}
function hash2d(seed, row, col) {
    const mixed = seed ^ Math.imul(row + 1, 374761393) ^ Math.imul(col + 1, 668265263);
    return hashInt(mixed);
}
class SeededRandom {
    constructor(seed) {
        this.state = hashInt(seed) || 1;
    }
    next() {
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
}
exports.SeededRandom = SeededRandom;
function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomFloat() {
    return Math.random();
}
function weightedPick(items) {
    if (items.length === 0) {
        throw new Error("weightedPick requires at least one item");
    }
    const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
    if (total <= 0)
        return items[0];
    let r = randomFloat() * total;
    for (const item of items) {
        r -= Math.max(0, item.weight);
        if (r <= 0)
            return item;
    }
    return items[items.length - 1];
}
