"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digDurationByType = digDurationByType;
exports.canDigCell = canDigCell;
const balance_1 = require("../data/balance");
const grid_1 = require("../utils/grid");
const DIRECTIONS = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
];
function digDurationByType(type) {
    if (type === "normalSoil")
        return balance_1.DIG_BALANCE.normalSoilSec;
    if (type === "magicSoil")
        return balance_1.DIG_BALANCE.magicSoilSec;
    if (type === "moistSoil")
        return balance_1.DIG_BALANCE.moistSoilSec;
    if (type === "mineralSoil")
        return balance_1.DIG_BALANCE.mineralSoilSec;
    if (type === "toxicSoil")
        return balance_1.DIG_BALANCE.toxicSoilSec;
    return 0;
}
function isAdjacentDigSpace(cell) {
    if (cell.type === "trap") {
        return (0, grid_1.isPassableCellType)(cell.baseType);
    }
    return (0, grid_1.isPassableCellType)(cell.type);
}
function canDigCell(row, column, map, remainingDigCount) {
    if (remainingDigCount < 1)
        return false;
    if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, row, column))
        return false;
    const target = map[row][column];
    if (!target)
        return false;
    if (!(0, grid_1.isDiggableSoil)(target.type))
        return false;
    if (target.type === "hardRock")
        return false;
    if (target.digging)
        return false;
    const hasAdjacentEmptyCell = DIRECTIONS.some(([dr, dc]) => {
        const nextRow = row + dr;
        const nextCol = column + dc;
        if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, nextRow, nextCol))
            return false;
        const adjacentCell = map[nextRow][nextCol];
        if (!adjacentCell)
            return false;
        return isAdjacentDigSpace(adjacentCell);
    });
    return hasAdjacentEmptyCell;
}
