"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cellKey = cellKey;
exports.isInside = isInside;
exports.isPassableCellType = isPassableCellType;
exports.isDiggableSoil = isDiggableSoil;
exports.cloneMap = cloneMap;
function cellKey(row, col) {
    return `${row}:${col}`;
}
function isInside(rows, cols, row, col) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}
function isPassableCellType(type) {
    return type === "empty" || type === "entrance" || type === "coreRoom" || type === "nest" || type === "trap";
}
function isDiggableSoil(type) {
    return type === "normalSoil" || type === "magicSoil" || type === "moistSoil" || type === "mineralSoil" || type === "toxicSoil";
}
function cloneMap(map) {
    return map.map((row) => row.map((cell) => ({ ...cell })));
}
