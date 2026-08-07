"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialFromSoil = materialFromSoil;
function materialFromSoil(type) {
    if (type === "magicSoil")
        return "manaCrystal";
    if (type === "moistSoil")
        return "lifeWater";
    if (type === "mineralSoil")
        return "voidIron";
    if (type === "toxicSoil")
        return "toxinSpore";
    return null;
}
