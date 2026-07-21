let SIZE = 9;
const BLACK = "black";
const WHITE = "white";
const SHOGI_CPU_THINK_MS = 260;
const SHOGI_CPU_SETTINGS = {
  easy: {
    thinkMs: 180,
    randomRate: 0.55,
    lookaheadDepth: 1,
    candidateLimit: 14,
    enemyCandidateLimit: 12,
    selfReplyCandidateLimit: 10,
  },
  normal: {
    thinkMs: 260,
    randomRate: 0.18,
    lookaheadDepth: 1,
    candidateLimit: 22,
    enemyCandidateLimit: 16,
    selfReplyCandidateLimit: 12,
  },
  hard: {
    thinkMs: 420,
    randomRate: 0,
    lookaheadDepth: 2,
    candidateLimit: 32,
    enemyCandidateLimit: 22,
    selfReplyCandidateLimit: 14,
  },
  pro: {
    thinkMs: 700,
    randomRate: 0,
    lookaheadDepth: 3,
    candidateLimit: 42,
    enemyCandidateLimit: 28,
    selfReplyCandidateLimit: 20,
  },
};

const HAND_TYPES = ["R", "B", "G", "S", "N", "L", "P"];
const DISGUISE_TYPES = ["R", "B", "G", "S", "N", "L", "P"];
const CAMP_ORDER_4P = ["north", "east", "south", "west"];
let PIECE_STATE_ID_SEQ = 1;

const PIECE_LABEL = {
  K: "王",
  R: "飛",
  B: "角",
  G: "金",
  S: "銀",
  N: "桂",
  L: "香",
  P: "歩",
};

const PROMOTED_PIECE_LABEL = {
  R: "竜",
  B: "馬",
  S: "成銀",
  N: "成桂",
  L: "成香",
  P: "と",
};

const PIECE_VALUE = {
  K: 100000,
  R: 1000,
  B: 900,
  G: 650,
  S: 560,
  N: 420,
  L: 360,
  P: 110,
};

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function nextPieceStateId() {
  const id = PIECE_STATE_ID_SEQ;
  PIECE_STATE_ID_SEQ += 1;
  return id;
}

function inferCampFromFacing(facing) {
  if (facing === "south") return "north";
  if (facing === "north") return "south";
  if (facing === "west") return "east";
  if (facing === "east") return "west";
  return null;
}

function normalizePieceState(piece) {
  if (!piece) return null;

  const normalizedOwner = piece.owner === WHITE ? WHITE : BLACK;
  const normalizedFacing = piece.facing || defaultFacingByOwner(normalizedOwner);
  const inferredCamp = CAMP_ORDER_4P.includes(piece.camp)
    ? piece.camp
    : inferCampFromFacing(normalizedFacing);

  return {
    ...piece,
    owner: normalizedOwner,
    promoted: Boolean(piece.promoted),
    camp: CAMP_ORDER_4P.includes(inferredCamp) ? inferredCamp : null,
    facing: normalizedFacing,
    stateId: Number.isFinite(piece.stateId) ? piece.stateId : nextPieceStateId(),
    moveCount: Number.isFinite(piece.moveCount) ? piece.moveCount : 0,
    lastMovedTurn: Number.isFinite(piece.lastMovedTurn) ? piece.lastMovedTurn : -1,
  };
}

function normalizeBoardState(board) {
  if (!Array.isArray(board)) return [];
  return board.map((row) =>
    Array.isArray(row) ? row.map((piece) => normalizePieceState(piece)) : [],
  );
}

function createEmptyHands() {
  const template = { R: 0, B: 0, G: 0, S: 0, N: 0, L: 0, P: 0 };
  return { [BLACK]: { ...template }, [WHITE]: { ...template } };
}

function cloneHands(hands) {
  return { [BLACK]: { ...hands[BLACK] }, [WHITE]: { ...hands[WHITE] } };
}

function inside(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function opposite(owner) {
  return owner === BLACK ? WHITE : BLACK;
}

function normalizeRoomPlayer(value) {
  if (value === null || typeof value === "undefined") return null;
  if (value === BLACK || value === WHITE) return value;
  if (value === 1) return BLACK;
  if (value === 2) return WHITE;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["black", "先手", "sente"].includes(normalized)) return BLACK;
    if (["white", "後手", "gote"].includes(normalized)) return WHITE;
    if (["spectator", "watch", "viewer", "観戦"].includes(normalized)) return null;
  }
  return null;
}

function normalizeTurnOrderChoice(value) {
  const raw = String(value ?? "first").trim().toLowerCase();
  if (raw === "one") return "one";
  if (raw === "two") return "two";
  if (raw === "three") return "three";
  if (raw === "four") return "four";
  if (raw === "second") return "second";
  if (raw === "random") return "random";
  return "first";
}

function normalizeMyPieceColor(value) {
  const raw = String(value ?? "amber").trim().toLowerCase();
  if (["amber", "cyan", "lime", "magenta"].includes(raw)) return raw;
  return "amber";
}

function normalizeHandicapChoice(value) {
  const raw = String(value ?? "none").trim();
  if (["none", "rook", "bishop", "rookBishop", "fourPiece"].includes(raw)) return raw;
  return "none";
}

function normalizeHandicapTargetChoice(value) {
  const raw = String(value ?? "opponent").trim();
  if (["opponent", "self", "both", "black", "white"].includes(raw)) return raw;
  return "opponent";
}

function normalizeMineCountChoice(value) {
  const parsed = Number.parseInt(String(value ?? "1"), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(0, Math.min(3, parsed));
}

function normalizeMineCountByCampChoice(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    north: normalizeMineCountChoice(source.north),
    east: normalizeMineCountChoice(source.east),
    south: normalizeMineCountChoice(source.south),
    west: normalizeMineCountChoice(source.west),
  };
}

function normalizeKingAbsorbChoice(value) {
  const raw = String(value ?? "on").trim().toLowerCase();
  return raw === "off" ? "off" : "on";
}

function normalizeChaosPlayerModeChoice(value) {
  const raw = String(value ?? "2p").trim().toLowerCase();
  return raw === "4p" ? "4p" : "2p";
}

function normalizeRoomGameModeChoice(value) {
  const raw = String(value ?? "local").trim().toLowerCase();
  return raw === "chaos" ? "chaos" : "local";
}

function boardSizeForChaosPlayerMode(mode) {
  return normalizeChaosPlayerModeChoice(mode) === "4p" ? 13 : 9;
}

function applyBoardSize(size) {
  const parsed = Number(size);
  if (!Number.isFinite(parsed)) return;
  SIZE = Math.max(9, Math.min(13, Math.floor(parsed)));
}

function randomChoice(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function campOwner(camp) {
  if (camp === "north" || camp === "east") return WHITE;
  if (camp === "south" || camp === "west") return BLACK;
  return null;
}

function defaultFacingByOwner(owner) {
  return owner === WHITE ? "south" : "north";
}

function defaultFacingByCamp(camp, owner) {
  if (camp === "north") return "south";
  if (camp === "south") return "north";
  if (camp === "east") return "west";
  if (camp === "west") return "east";
  return defaultFacingByOwner(owner);
}

function pieceFacingForRender(piece) {
  return piece?.facing || defaultFacingByOwner(piece?.owner);
}

function getKingAbsorbedAbilities(piece) {
  if (!piece || piece.type !== "K") return [];

  const merged = [];
  const pushOrUpgrade = (entryType, promoted) => {
    if (!DISGUISE_TYPES.includes(entryType)) return;
    const existing = merged.find((entry) => entry.type === entryType);
    if (existing) {
      if (promoted) existing.promoted = true;
      return;
    }
    merged.push({ type: entryType, promoted: Boolean(promoted) });
  };

  if (Array.isArray(piece.absorbedAbilities)) {
    piece.absorbedAbilities.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      pushOrUpgrade(entry.type, Boolean(entry.promoted));
    });
  }

  // Backward compatibility for older snapshots with a single absorbed ability.
  if (piece.absorbedType) {
    pushOrUpgrade(piece.absorbedType, Boolean(piece.absorbedPromoted));
  }

  return merged;
}

function mergeKingAbsorbedAbility(piece, target) {
  const abilities = getKingAbsorbedAbilities(piece);
  if (!target || !DISGUISE_TYPES.includes(target.type)) return abilities;

  const existing = abilities.find((entry) => entry.type === target.type);
  if (existing) {
    if (target.promoted) existing.promoted = true;
    return abilities;
  }

  return [...abilities, { type: target.type, promoted: Boolean(target.promoted) }];
}

function hasKingAbsorbedType(piece, type) {
  if (!piece || piece.type !== "K") return false;
  return getKingAbsorbedAbilities(piece).some((entry) => entry.type === type);
}

function normalizeDirection(delta) {
  if (delta > 0) return 1;
  if (delta < 0) return -1;
  return 0;
}

function isKingAllyAbsorbEnabled(piece) {
  if (!piece || piece.type !== "K") return false;
  // Backward compatibility: missing flag means enabled.
  return piece.allyAbsorbEnabled !== false;
}

function facingForwardVector(piece) {
  const facing = piece?.facing || defaultFacingByOwner(piece?.owner);
  if (facing === "south") return [1, 0];
  if (facing === "east") return [0, 1];
  if (facing === "west") return [0, -1];
  return [-1, 0];
}

function collectPieceDirectionVectors(piece, row, col) {
  const vectors = [];
  const seen = new Set();
  const pushUnique = (dr, dc) => {
    const nr = normalizeDirection(dr);
    const nc = normalizeDirection(dc);
    if (nr === 0 && nc === 0) return;
    const key = `${nr}:${nc}`;
    if (seen.has(key)) return;
    seen.add(key);
    vectors.push([nr, nc]);
  };

  const [fr, fc] = facingForwardVector(piece);
  const left = [-fc, fr];
  const right = [fc, -fr];
  const back = [-fr, -fc];

  const add = (r, c) => pushUnique(r, c);
  const addPlus = (a, b) => pushUnique(a[0] + b[0], a[1] + b[1]);

  if (piece.type === "K") {
    [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ].forEach(([r, c]) => add(r, c));
    return vectors;
  }

  if (piece.promoted && ["S", "N", "L", "P"].includes(piece.type)) {
    addPlus([fr, fc], left);
    add(fr, fc);
    addPlus([fr, fc], right);
    add(...left);
    add(...right);
    add(...back);
    return vectors;
  }

  if (piece.type === "G") {
    addPlus([fr, fc], left);
    add(fr, fc);
    addPlus([fr, fc], right);
    add(...left);
    add(...right);
    add(...back);
    return vectors;
  }

  if (piece.type === "S") {
    addPlus([fr, fc], left);
    add(fr, fc);
    addPlus([fr, fc], right);
    addPlus(back, left);
    addPlus(back, right);
    return vectors;
  }

  if (piece.type === "N") {
    addPlus([fr * 2, fc * 2], left);
    addPlus([fr * 2, fc * 2], right);
    return vectors;
  }

  if (piece.type === "P") {
    add(fr, fc);
    return vectors;
  }

  if (piece.type === "R") {
    [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ].forEach(([r, c]) => add(r, c));
    if (piece.promoted) {
      [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].forEach(([r, c]) => add(r, c));
    }
    return vectors;
  }

  if (piece.type === "B") {
    [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ].forEach(([r, c]) => add(r, c));
    if (piece.promoted) {
      [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ].forEach(([r, c]) => add(r, c));
    }
    return vectors;
  }

  if (piece.type === "L") {
    add(fr, fc);
    return vectors;
  }

  return vectors;
}

function forward(owner) {
  return owner === BLACK ? -1 : 1;
}

function standardBandStartCol() {
  return Math.floor((SIZE - 9) / 2);
}

function inPromotionZone(owner, row) {
  return owner === BLACK ? row <= 2 : row >= SIZE - 3;
}

function canPromoteType(type) {
  return ["R", "B", "S", "N", "L", "P"].includes(type);
}

function mustPromote(owner, type, toRow) {
  if (type === "P" || type === "L") {
    return owner === BLACK ? toRow === 0 : toRow === SIZE - 1;
  }
  if (type === "N") {
    return owner === BLACK ? toRow <= 1 : toRow >= SIZE - 2;
  }
  return false;
}

function shouldOfferPromotion(piece, fromRow, toRow) {
  if (piece.promoted || !canPromoteType(piece.type)) return false;
  return inPromotionZone(piece.owner, fromRow) || inPromotionZone(piece.owner, toRow);
}

function handicapSlotToPosition(owner, slot) {
  const backRow = owner === BLACK ? SIZE - 1 : 0;
  const majorRow = owner === BLACK ? SIZE - 2 : 1;
  const bandStart = standardBandStartCol();
  const bandEnd = bandStart + 8;

  if (slot === "R") return { row: majorRow, col: owner === BLACK ? bandEnd - 1 : bandStart + 1 };
  if (slot === "B") return { row: majorRow, col: owner === BLACK ? bandStart + 1 : bandEnd - 1 };
  if (slot === "L-L") return { row: backRow, col: bandStart };
  if (slot === "L-R") return { row: backRow, col: bandEnd };
  return null;
}

function assignMinePieceForOwner(board, owner) {
  const candidates = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== owner) continue;
      if (piece.type === "K" || piece.type === "P") continue;
      candidates.push(piece);
    }
  }

  const pool = [...candidates];
  return {
    pickOne: () => {
      if (pool.length <= 0) return null;
      const index = Math.floor(Math.random() * pool.length);
      const [picked] = pool.splice(index, 1);
      return picked ?? null;
    },
  };
}

function assignMinePieceForCamp(board, camp) {
  const candidates = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.camp !== camp) continue;
      if (piece.type === "K" || piece.type === "P") continue;
      candidates.push(piece);
    }
  }

  const pool = [...candidates];
  return {
    pickOne: () => {
      if (pool.length <= 0) return null;
      const index = Math.floor(Math.random() * pool.length);
      const [picked] = pool.splice(index, 1);
      return picked ?? null;
    },
  };
}

function markPieceAsMine(piece) {
  if (!piece) return;
  const disguiseCandidates = DISGUISE_TYPES.filter((type) => type !== piece.type);
  piece.isMine = true;
  piece.mineDisguiseType = randomChoice(disguiseCandidates) ?? piece.type;
}

function assignMinePieces(board, mineCount = 1, chaosPlayerMode = "2p") {
  const is4p = normalizeChaosPlayerModeChoice(chaosPlayerMode) === "4p";

  if (mineCount && typeof mineCount === "object") {
    const counts = normalizeMineCountByCampChoice(mineCount);
    if (is4p) {
      ["north", "east", "south", "west"].forEach((camp) => {
        const picker = assignMinePieceForCamp(board, camp);
        for (let i = 0; i < counts[camp]; i += 1) {
          const minePiece = picker.pickOne();
          if (!minePiece) break;
          markPieceAsMine(minePiece);
        }
      });
      return;
    }

    const ownerCounts = {
      [BLACK]: counts.north,
      [WHITE]: counts.east,
    };

    [BLACK, WHITE].forEach((owner) => {
      const picker = assignMinePieceForOwner(board, owner);
      for (let i = 0; i < ownerCounts[owner]; i += 1) {
        const minePiece = picker.pickOne();
        if (!minePiece) break;
        markPieceAsMine(minePiece);
      }
    });
    return;
  }

  const count = normalizeMineCountChoice(mineCount);
  [BLACK, WHITE].forEach((owner) => {
    const picker = assignMinePieceForOwner(board, owner);
    if (!picker) return;

    for (let i = 0; i < count; i += 1) {
      const minePiece = picker.pickOne();
      if (!minePiece) break;
      markPieceAsMine(minePiece);
    }
  });
}

function applyFourPlayerPreviewSetup(board, { kingAllyAbsorbEnabled = false } = {}) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      board[row][col] = null;
    }
  }

  // 4P layout on 13x13: each camp has K/G/S/B/R/L/N x1 and Pawns x5.
  const center = Math.floor(SIZE / 2);

  // North camp (WHITE)
  board[0][center] = { owner: WHITE, camp: "north", type: "K", promoted: false, allyAbsorbEnabled: Boolean(kingAllyAbsorbEnabled), facing: "south" };
  board[0][center - 1] = { owner: WHITE, camp: "north", type: "G", promoted: false, facing: "south" };
  board[0][center + 1] = { owner: WHITE, camp: "north", type: "S", promoted: false, facing: "south" };
  board[1][center - 1] = { owner: WHITE, camp: "north", type: "B", promoted: false, facing: "south" };
  board[1][center + 1] = { owner: WHITE, camp: "north", type: "R", promoted: false, facing: "south" };
  board[1][center - 2] = { owner: WHITE, camp: "north", type: "L", promoted: false, facing: "south" };
  board[1][center + 2] = { owner: WHITE, camp: "north", type: "N", promoted: false, facing: "south" };
  for (let col = center - 2; col <= center + 2; col += 1) {
    board[2][col] = { owner: WHITE, camp: "north", type: "P", promoted: false, facing: "south" };
  }

  // South camp (BLACK)
  board[SIZE - 1][center] = { owner: BLACK, camp: "south", type: "K", promoted: false, allyAbsorbEnabled: Boolean(kingAllyAbsorbEnabled), facing: "north" };
  board[SIZE - 1][center + 1] = { owner: BLACK, camp: "south", type: "G", promoted: false, facing: "north" };
  board[SIZE - 1][center - 1] = { owner: BLACK, camp: "south", type: "S", promoted: false, facing: "north" };
  board[SIZE - 2][center + 1] = { owner: BLACK, camp: "south", type: "B", promoted: false, facing: "north" };
  board[SIZE - 2][center - 1] = { owner: BLACK, camp: "south", type: "R", promoted: false, facing: "north" };
  board[SIZE - 2][center + 2] = { owner: BLACK, camp: "south", type: "L", promoted: false, facing: "north" };
  board[SIZE - 2][center - 2] = { owner: BLACK, camp: "south", type: "N", promoted: false, facing: "north" };
  for (let col = center - 2; col <= center + 2; col += 1) {
    board[SIZE - 3][col] = { owner: BLACK, camp: "south", type: "P", promoted: false, facing: "north" };
  }

  // West camp (BLACK side in current 2-color engine)
  board[center][0] = { owner: BLACK, camp: "west", type: "K", promoted: false, allyAbsorbEnabled: Boolean(kingAllyAbsorbEnabled), facing: "east" };
  board[center - 1][0] = { owner: BLACK, camp: "west", type: "G", promoted: false, facing: "east" };
  board[center + 1][0] = { owner: BLACK, camp: "west", type: "S", promoted: false, facing: "east" };
  board[center - 1][1] = { owner: BLACK, camp: "west", type: "B", promoted: false, facing: "east" };
  board[center + 1][1] = { owner: BLACK, camp: "west", type: "R", promoted: false, facing: "east" };
  board[center - 2][1] = { owner: BLACK, camp: "west", type: "L", promoted: false, facing: "east" };
  board[center + 2][1] = { owner: BLACK, camp: "west", type: "N", promoted: false, facing: "east" };
  for (let row = center - 2; row <= center + 2; row += 1) {
    board[row][2] = { owner: BLACK, camp: "west", type: "P", promoted: false, facing: "east" };
  }

  // East camp (WHITE side in current 2-color engine)
  board[center][SIZE - 1] = { owner: WHITE, camp: "east", type: "K", promoted: false, allyAbsorbEnabled: Boolean(kingAllyAbsorbEnabled), facing: "west" };
  board[center + 1][SIZE - 1] = { owner: WHITE, camp: "east", type: "G", promoted: false, facing: "west" };
  board[center - 1][SIZE - 1] = { owner: WHITE, camp: "east", type: "S", promoted: false, facing: "west" };
  board[center + 1][SIZE - 2] = { owner: WHITE, camp: "east", type: "B", promoted: false, facing: "west" };
  board[center - 1][SIZE - 2] = { owner: WHITE, camp: "east", type: "R", promoted: false, facing: "west" };
  board[center + 2][SIZE - 2] = { owner: WHITE, camp: "east", type: "L", promoted: false, facing: "west" };
  board[center - 2][SIZE - 2] = { owner: WHITE, camp: "east", type: "N", promoted: false, facing: "west" };
  for (let row = center - 2; row <= center + 2; row += 1) {
    board[row][SIZE - 3] = { owner: WHITE, camp: "east", type: "P", promoted: false, facing: "west" };
  }
}

function handicapSlotToPositionByCamp(camp, slot) {
  const center = Math.floor(SIZE / 2);

  if (camp === "north") {
    if (slot === "R") return { row: 1, col: center + 1 };
    if (slot === "B") return { row: 1, col: center - 1 };
    if (slot === "L-L") return { row: 1, col: center - 2 };
    if (slot === "L-R") return { row: 1, col: center + 2 };
  }
  if (camp === "east") {
    if (slot === "R") return { row: center - 1, col: SIZE - 2 };
    if (slot === "B") return { row: center + 1, col: SIZE - 2 };
    if (slot === "L-L") return { row: center - 2, col: SIZE - 2 };
    if (slot === "L-R") return { row: center + 2, col: SIZE - 2 };
  }
  if (camp === "south") {
    if (slot === "R") return { row: SIZE - 2, col: center - 1 };
    if (slot === "B") return { row: SIZE - 2, col: center + 1 };
    if (slot === "L-L") return { row: SIZE - 2, col: center - 2 };
    if (slot === "L-R") return { row: SIZE - 2, col: center + 2 };
  }
  if (camp === "west") {
    if (slot === "R") return { row: center + 1, col: 1 };
    if (slot === "B") return { row: center - 1, col: 1 };
    if (slot === "L-L") return { row: center - 2, col: 1 };
    if (slot === "L-R") return { row: center + 2, col: 1 };
  }

  return null;
}

function applyFourPlayerHandicap(board, handicapByCamp = {}) {
  const handicapPreset = {
    none: [],
    rook: ["R"],
    bishop: ["B"],
    rookBishop: ["R", "B"],
    fourPiece: ["R", "B", "L-L", "L-R"],
  };

  CAMP_ORDER_4P.forEach((camp) => {
    const choice = normalizeHandicapChoice(handicapByCamp?.[camp]);
    const slots = handicapPreset[choice] ?? handicapPreset.none;

    slots.forEach((slot) => {
      const pos = handicapSlotToPositionByCamp(camp, slot);
      if (!pos) return;
      const piece = board[pos.row]?.[pos.col];
      if (piece && piece.camp === camp) {
        board[pos.row][pos.col] = null;
      }
    });
  });
}

function makeInitialBoard({ handicapByOwner = {}, handicapByCamp = {}, mineCount = 1, kingAllyAbsorbEnabled = false, chaosPlayerMode = "2p" } = {}) {
  const board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));
  const back = ["L", "N", "S", "G", "K", "G", "S", "N", "L"];
  const bandStart = standardBandStartCol();
  const whiteBackRow = 0;
  const whiteMajorRow = 1;
  const whitePawnRow = 2;
  const blackBackRow = SIZE - 1;
  const blackMajorRow = SIZE - 2;
  const blackPawnRow = SIZE - 3;

  for (let i = 0; i < back.length; i += 1) {
    const col = bandStart + i;
    if (back[i] === "K") {
      board[whiteBackRow][col] = {
        owner: WHITE,
        camp: "north",
        type: back[i],
        promoted: false,
        allyAbsorbEnabled: Boolean(kingAllyAbsorbEnabled),
        facing: "south",
      };
      board[blackBackRow][col] = {
        owner: BLACK,
        camp: "south",
        type: back[i],
        promoted: false,
        allyAbsorbEnabled: Boolean(kingAllyAbsorbEnabled),
        facing: "north",
      };
    } else {
      board[whiteBackRow][col] = { owner: WHITE, camp: "north", type: back[i], promoted: false, facing: "south" };
      board[blackBackRow][col] = { owner: BLACK, camp: "south", type: back[i], promoted: false, facing: "north" };
    }
    board[whitePawnRow][col] = { owner: WHITE, camp: "north", type: "P", promoted: false, facing: "south" };
    board[blackPawnRow][col] = { owner: BLACK, camp: "south", type: "P", promoted: false, facing: "north" };
  }

  board[whiteMajorRow][bandStart + 1] = { owner: WHITE, camp: "north", type: "R", promoted: false, facing: "south" };
  board[whiteMajorRow][bandStart + 7] = { owner: WHITE, camp: "north", type: "B", promoted: false, facing: "south" };
  board[blackMajorRow][bandStart + 1] = { owner: BLACK, camp: "south", type: "B", promoted: false, facing: "north" };
  board[blackMajorRow][bandStart + 7] = { owner: BLACK, camp: "south", type: "R", promoted: false, facing: "north" };

  const handicapPreset = {
    none: [],
    rook: ["R"],
    bishop: ["B"],
    rookBishop: ["R", "B"],
    fourPiece: ["R", "B", "L-L", "L-R"],
  };

  [BLACK, WHITE].forEach((owner) => {
    if (owner !== BLACK && owner !== WHITE) return;
    const choice = normalizeHandicapChoice(handicapByOwner?.[owner]);
    const slots = handicapPreset[choice] ?? handicapPreset.none;
    slots.forEach((slot) => {
      const pos = handicapSlotToPosition(owner, slot);
      if (!pos) return;
      const piece = board[pos.row]?.[pos.col];
      if (piece && piece.owner === owner) {
        board[pos.row][pos.col] = null;
      }
    });
  });

  if (normalizeChaosPlayerModeChoice(chaosPlayerMode) === "4p") {
    applyFourPlayerPreviewSetup(board, { kingAllyAbsorbEnabled });
    applyFourPlayerHandicap(board, handicapByCamp);
  }

  assignMinePieces(board, mineCount, chaosPlayerMode);

  return board;
}

function getGoldLikeMoves(piece, row, col) {
  const [fr, fc] = facingForwardVector(piece);
  const left = [-fc, fr];
  const right = [fc, -fr];
  const back = [-fr, -fc];
  return [
    [row + fr + left[0], col + fc + left[1]],
    [row + fr, col + fc],
    [row + fr + right[0], col + fc + right[1]],
    [row + left[0], col + left[1]],
    [row + right[0], col + right[1]],
    [row + back[0], col + back[1]],
  ];
}

function getStepMoves(piece, row, col) {
  const [fr, fc] = facingForwardVector(piece);
  const left = [-fc, fr];
  const right = [fc, -fr];
  const back = [-fr, -fc];

  if (piece.type === "K") {
    return [
      [row - 1, col - 1],
      [row - 1, col],
      [row - 1, col + 1],
      [row, col - 1],
      [row, col + 1],
      [row + 1, col - 1],
      [row + 1, col],
      [row + 1, col + 1],
    ];
  }

  if (piece.promoted && ["S", "N", "L", "P"].includes(piece.type)) {
    return getGoldLikeMoves(piece, row, col);
  }

  if (piece.type === "G") return getGoldLikeMoves(piece, row, col);

  if (piece.type === "S") {
    return [
      [row + fr + left[0], col + fc + left[1]],
      [row + fr, col + fc],
      [row + fr + right[0], col + fc + right[1]],
      [row + back[0] + left[0], col + back[1] + left[1]],
      [row + back[0] + right[0], col + back[1] + right[1]],
    ];
  }

  if (piece.type === "N") {
    return [
      [row + fr * 2 + left[0], col + fc * 2 + left[1]],
      [row + fr * 2 + right[0], col + fc * 2 + right[1]],
    ];
  }

  if (piece.type === "P") return [[row + fr, col + fc]];

  if (piece.promoted && piece.type === "R") {
    return [
      [row - 1, col - 1],
      [row - 1, col + 1],
      [row + 1, col - 1],
      [row + 1, col + 1],
    ];
  }

  if (piece.promoted && piece.type === "B") {
    return [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
  }

  return [];
}

function getSlideDirs(piece) {
  if (piece.type === "K") return [];
  if (piece.type === "R") return [[-1, 0], [1, 0], [0, -1], [0, 1]];
  if (piece.type === "B") return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (piece.type === "L") return [facingForwardVector(piece)];
  return [];
}

function getPseudoMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  if (piece.type === "K") {
    const moves = [];
    const seen = new Set();
    const pushUniqueMove = (r, c) => {
      const key = `${r}:${c}`;
      if (seen.has(key)) return;
      seen.add(key);
      moves.push({ row: r, col: c });
    };

    const bonusDirectionCounts = new Map();
    const absorbedAbilities = getKingAbsorbedAbilities(piece);
    absorbedAbilities.forEach((ability) => {
      const absorbedPiece = {
        owner: piece.owner,
        type: ability.type,
        promoted: Boolean(ability.promoted),
      };
      collectPieceDirectionVectors(absorbedPiece, row, col).forEach(([dr, dc]) => {
        const key = `${dr}:${dc}`;
        bonusDirectionCounts.set(key, (bonusDirectionCounts.get(key) ?? 0) + 1);
      });
    });

    const kingDirs = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dr, dc] of kingDirs) {
      const bonus = bonusDirectionCounts.get(`${dr}:${dc}`) ?? 0;
      const maxDistance = 1 + bonus;
      for (let dist = 1; dist <= maxDistance; dist += 1) {
        const r = row + dr * dist;
        const c = col + dc * dist;
        if (!inside(r, c)) break;

        const target = board[r][c];
        if (!target) {
          pushUniqueMove(r, c);
          continue;
        }

        if (target.owner !== piece.owner) {
          pushUniqueMove(r, c);
        } else if (
          isKingAllyAbsorbEnabled(piece) &&
          target.type !== "K" &&
          !hasKingAbsorbedType(piece, target.type)
        ) {
          pushUniqueMove(r, c);
        }
        break;
      }
    }

    return moves;
  }

  const moves = [];
  const seen = new Set();
  const pushUniqueMove = (r, c) => {
    const key = `${r}:${c}`;
    if (seen.has(key)) return;
    seen.add(key);
    moves.push({ row: r, col: c });
  };

  for (const [r, c] of getStepMoves(piece, row, col)) {
    if (!inside(r, c)) continue;
    const target = board[r][c];
    if (!target || target.owner !== piece.owner || isKingAllyAbsorbEnabled(piece)) {
      pushUniqueMove(r, c);
    }
  }

  for (const [dr, dc] of getSlideDirs(piece)) {
    let r = row + dr;
    let c = col + dc;
    while (inside(r, c)) {
      const target = board[r][c];
      if (!target) {
        pushUniqueMove(r, c);
      } else {
        if (target.owner !== piece.owner) pushUniqueMove(r, c);
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return moves;
}

function findKing(board, owner) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (piece && piece.owner === owner && piece.type === "K") {
        return { row, col };
      }
    }
  }
  return null;
}

function isInCheck(board, owner) {
  const kingPos = findKing(board, owner);
  if (!kingPos) return true;

  const enemy = opposite(owner);
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== enemy) continue;
      if (getPseudoMoves(board, row, col).some((m) => m.row === kingPos.row && m.col === kingPos.col)) {
        return true;
      }
    }
  }
  return false;
}

function applyMoveOn(board, hands, fromRow, fromCol, toRow, toCol, promote, metadata = null) {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  const pieceState = normalizePieceState(piece);
  const nextMovedState = {
    ...pieceState,
    promoted: promote ? true : pieceState.promoted,
    moveCount: pieceState.moveCount + 1,
    lastMovedTurn:
      metadata && Number.isFinite(metadata.turnIndex) ? metadata.turnIndex : pieceState.lastMovedTurn,
  };

  const target = board[toRow][toCol];
  if (target) {
    const targetState = normalizePieceState(target);

    if (targetState.owner === pieceState.owner && isKingAllyAbsorbEnabled(pieceState)) {
      if (target.type === "K") return false;
      if (hasKingAbsorbedType(pieceState, targetState.type)) return false;
      const absorbedAbilities = mergeKingAbsorbedAbility(pieceState, targetState);
      board[toRow][toCol] = {
        ...nextMovedState,
        promoted: false,
        absorbedAbilities,
        absorbedType: null,
        absorbedPromoted: false,
      };
      board[fromRow][fromCol] = null;
      return "ally-absorbed";
    }

    if (targetState.type === "K") {
      board[toRow][toCol] = { ...nextMovedState };
      board[fromRow][fromCol] = null;
      return "captured-king";
    }

    if (targetState.isMine) {
      // Mine piece is still captured by the mover, but the stepping piece is removed
      // and does not become anyone's hand piece.
      hands[pieceState.owner][targetState.type] += 1;
      board[toRow][toCol] = null;
      board[fromRow][fromCol] = null;
      return "mine-triggered";
    }

    hands[pieceState.owner][targetState.type] += 1;
  }

  board[toRow][toCol] = { ...nextMovedState };
  board[fromRow][fromCol] = null;
  return true;
}

function applyDropOn(board, hands, owner, type, toRow, toCol, camp = null, metadata = null) {
  if (hands[owner][type] <= 0 || board[toRow][toCol]) return false;
  hands[owner][type] -= 1;
  const normalizedCamp = CAMP_ORDER_4P.includes(camp) ? camp : null;
  board[toRow][toCol] = {
    owner,
    type,
    promoted: false,
    camp: normalizedCamp,
    facing: defaultFacingByCamp(normalizedCamp, owner),
    stateId: nextPieceStateId(),
    moveCount: 0,
    lastMovedTurn: metadata && Number.isFinite(metadata.turnIndex) ? metadata.turnIndex : -1,
  };
  return true;
}

function hasUnpromotedPawnOnFile(board, owner, col) {
  for (let row = 0; row < SIZE; row += 1) {
    const piece = board[row][col];
    if (piece && piece.owner === owner && piece.type === "P" && !piece.promoted) return true;
  }
  return false;
}

function canDropTo(board, owner, type, row, col) {
  if (!inside(row, col) || board[row][col]) return false;

  if (type === "P") {
    if ((owner === BLACK && row === 0) || (owner === WHITE && row === SIZE - 1)) return false;
    if (hasUnpromotedPawnOnFile(board, owner, col)) return false;
  }
  if (type === "L") {
    if ((owner === BLACK && row === 0) || (owner === WHITE && row === SIZE - 1)) return false;
  }
  if (type === "N") {
    if ((owner === BLACK && row <= 1) || (owner === WHITE && row >= SIZE - 2)) return false;
  }
  return true;
}

function isIllegalPawnDropMate(board, hands, owner, row, col) {
  const simBoard = cloneBoard(board);
  const simHands = cloneHands(hands);
  const dropped = applyDropOn(simBoard, simHands, owner, "P", row, col);
  if (!dropped) return false;

  const enemy = opposite(owner);
  if (!isInCheck(simBoard, enemy)) return false;

  // Disable pawn-drop-mate rule while searching replies to avoid recursive explosions.
  return !hasAnyLegalAction(simBoard, simHands, enemy, { enforcePawnDropMate: false });
}

function getDropMoves(board, hands, owner, type, options = {}) {
  const { enforcePawnDropMate = true } = options;
  if (hands[owner][type] <= 0) return [];
  const moves = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!canDropTo(board, owner, type, row, col)) continue;
      if (type === "P" && enforcePawnDropMate && isIllegalPawnDropMate(board, hands, owner, row, col)) {
        continue;
      }
      const simBoard = cloneBoard(board);
      const simHands = cloneHands(hands);
      applyDropOn(simBoard, simHands, owner, type, row, col);
      if (!isInCheck(simBoard, owner)) moves.push({ row, col, type });
    }
  }

  return moves;
}

function getLegalMoveOptions(board, hands, owner, fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (!piece || piece.owner !== owner) return [];

  if (!getPseudoMoves(board, fromRow, fromCol).some((m) => m.row === toRow && m.col === toCol)) {
    return [];
  }

  const forcePromote = mustPromote(owner, piece.type, toRow);
  const canPromote = shouldOfferPromotion(piece, fromRow, toRow);
  const candidates = forcePromote ? [true] : canPromote ? [false, true] : [false];

  const options = [];
  for (const promote of candidates) {
    const simBoard = cloneBoard(board);
    const simHands = cloneHands(hands);
    applyMoveOn(simBoard, simHands, fromRow, fromCol, toRow, toCol, promote);
    if (!isInCheck(simBoard, owner)) options.push(promote);
  }

  return options;
}

function hasAnyLegalAction(board, hands, owner, options = {}) {
  const { enforcePawnDropMate = true } = options;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== owner) continue;
      for (const move of getPseudoMoves(board, row, col)) {
        if (getLegalMoveOptions(board, hands, owner, row, col, move.row, move.col).length > 0) {
          return true;
        }
      }
    }
  }

  for (const type of HAND_TYPES) {
    if (getDropMoves(board, hands, owner, type, { enforcePawnDropMate }).length > 0) return true;
  }

  return false;
}

function cloneAction(action) {
  return { ...action };
}

function actionOrderScore(action) {
  let score = 0;
  if (action.captureType) score += (PIECE_VALUE[action.captureType] ?? 0) * 2;
  if (action.kind === "move" && action.promote) score += 120;
  return score;
}

function applyActionSim(board, hands, owner, action) {
  if (action.kind === "drop") {
    return applyDropOn(board, hands, owner, action.type, action.toRow, action.toCol);
  }
  return applyMoveOn(board, hands, action.fromRow, action.fromCol, action.toRow, action.toCol, Boolean(action.promote));
}

function basePieceDisplayLabel(piece, typeOverride = null) {
  const type = typeOverride ?? piece.type;
  if (typeOverride) {
    if (piece.promoted && PROMOTED_PIECE_LABEL[typeOverride]) {
      return PROMOTED_PIECE_LABEL[typeOverride];
    }
    if (PIECE_LABEL[typeOverride]) {
      return PIECE_LABEL[typeOverride];
    }
  }
  if (piece.promoted && !typeOverride && PROMOTED_PIECE_LABEL[piece.type]) {
    return PROMOTED_PIECE_LABEL[piece.type];
  }
  return PIECE_LABEL[type] ?? type;
}

function pieceDisplayLabel(piece, viewerOwner = null) {
  const baseLabel = basePieceDisplayLabel(piece);
  let label = baseLabel;
  if (piece.type === "K") {
    const absorbedAbilities = getKingAbsorbedAbilities(piece);
    if (absorbedAbilities.length > 0) {
      const absorbedLabel = absorbedAbilities
        .map((ability) => basePieceDisplayLabel({ type: ability.type, promoted: Boolean(ability.promoted) }))
        .join(",");
      label = `${baseLabel}(${absorbedLabel})`;
    }
  }

  if (piece.isMine) {
    if (viewerOwner && viewerOwner === piece.owner) {
      return `${label}*`;
    }
  }

  return label;
}

function materialScore(board, hands, owner) {
  const enemy = opposite(owner);
  let myScore = 0;
  let enemyScore = 0;

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const base = PIECE_VALUE[piece.type] ?? 0;
      const promotedBonus = piece.promoted ? Math.max(40, Math.floor(base * 0.2)) : 0;
      if (piece.owner === owner) myScore += base + promotedBonus;
      else enemyScore += base + promotedBonus;
    }
  }

  HAND_TYPES.forEach((type) => {
    const handValue = PIECE_VALUE[type] ?? 0;
    myScore += (hands[owner][type] ?? 0) * handValue;
    enemyScore += (hands[enemy][type] ?? 0) * handValue;
  });

  return myScore - enemyScore;
}

function getAllLegalActions(board, hands, owner) {
  const actions = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== owner) continue;

      for (const move of getPseudoMoves(board, row, col)) {
        const legalOptions = getLegalMoveOptions(board, hands, owner, row, col, move.row, move.col);
        if (legalOptions.length === 0) continue;

        legalOptions.forEach((promote) => {
          const target = board[move.row][move.col];
          const isEnemyCapture = Boolean(target && target.owner !== owner);
          actions.push({
            kind: "move",
            fromRow: row,
            fromCol: col,
            toRow: move.row,
            toCol: move.col,
            promote,
            captureType: isEnemyCapture ? target.type : null,
          });
        });
      }
    }
  }

  HAND_TYPES.forEach((type) => {
    getDropMoves(board, hands, owner, type).forEach((drop) => {
      actions.push({ kind: "drop", type, toRow: drop.row, toCol: drop.col, captureType: null });
    });
  });

  return actions;
}

function evaluateAction(board, hands, owner, action) {
  const enemy = opposite(owner);
  const simBoard = cloneBoard(board);
  const simHands = cloneHands(hands);

  applyActionSim(simBoard, simHands, owner, action);

  if (!findKing(simBoard, enemy)) {
    return Number.POSITIVE_INFINITY;
  }

  let score = materialScore(simBoard, simHands, owner) - materialScore(simBoard, simHands, enemy) * 0.1;

  if (action.captureType) {
    score += (PIECE_VALUE[action.captureType] ?? 0) * 1.25;
  }
  if (action.kind === "move" && action.promote) {
    score += 85;
  }

  if (isInCheck(simBoard, enemy)) score += 280;
  if (isInCheck(simBoard, owner)) score -= 220;

  const myMobility = getAllLegalActions(simBoard, simHands, owner).length;
  const enemyMobility = getAllLegalActions(simBoard, simHands, enemy).length;
  score += (myMobility - enemyMobility) * 4;

  return score;
}

export function initShogi(options = {}) {
  const boardEl = document.getElementById("shogiBoard");
  const turnTextEl = document.getElementById("shogiTurnText");
  const selectTextEl = document.getElementById("shogiSelectText");
  const messageEl = document.getElementById("shogiMessage");
  const overlay = document.getElementById("shogiOverlay");
  const startBtn = document.getElementById("shogiStartBtn");
  const remakeBtn = document.getElementById("shogiRemakeBtn");
  const menuBtn = document.getElementById("shogiMenuBtn");
  const modeSelect = document.getElementById("shogiModeSelect");
  const difficultySelect = document.getElementById("shogiDifficultySelect");
  const turnOrderSelect = document.getElementById("shogiTurnOrderSelect");
  const myPieceColorSelect = document.getElementById("shogiMyPieceColorSelect");
  const blackHandicapSelect = document.getElementById("shogiBlackHandicapSelect");
  const whiteHandicapSelect = document.getElementById("shogiWhiteHandicapSelect");
  const thirdHandicapSelect = document.getElementById("shogiThirdHandicapSelect");
  const fourthHandicapSelect = document.getElementById("shogiFourthHandicapSelect");
  const legacyHandicapSelect = document.getElementById("shogiHandicapSelect");
  const legacyHandicapTargetSelect = document.getElementById("shogiHandicapTargetSelect");
  const blackMineCountSelect = document.getElementById("shogiBlackMineCountSelect");
  const whiteMineCountSelect = document.getElementById("shogiWhiteMineCountSelect");
  const thirdMineCountSelect = document.getElementById("shogiThirdMineCountSelect");
  const fourthMineCountSelect = document.getElementById("shogiFourthMineCountSelect");
  const kingAbsorbSelect = document.getElementById("shogiKingAbsorbSelect");
  const chaosPlayerModeSelect = document.getElementById("shogiChaosPlayerModeSelect");
  const chaosRuleMetric = document.getElementById("shogiChaosRuleMetric");
  const chaosRuleText = document.getElementById("shogiChaosRuleText");
  const blackHandicapMetric = blackHandicapSelect?.closest(".metric");
  const whiteHandicapMetric = whiteHandicapSelect?.closest(".metric");
  const thirdHandicapMetric = thirdHandicapSelect?.closest(".metric");
  const fourthHandicapMetric = fourthHandicapSelect?.closest(".metric");
  const legacyHandicapMetric = legacyHandicapSelect?.closest(".metric");
  const legacyHandicapTargetMetric = legacyHandicapTargetSelect?.closest(".metric");
  const blackMineCountMetric = blackMineCountSelect?.closest(".metric");
  const whiteMineCountMetric = whiteMineCountSelect?.closest(".metric");
  const thirdMineCountMetric = thirdMineCountSelect?.closest(".metric");
  const fourthMineCountMetric = fourthMineCountSelect?.closest(".metric");
  const kingAbsorbMetric = kingAbsorbSelect?.closest(".metric");
  const chaosPlayerModeMetric = chaosPlayerModeSelect?.closest(".metric");
  const turnOrderLabelEl = document.getElementById("shogiTurnOrderLabel");
  const myPieceColorLabelEl = document.getElementById("shogiMyPieceColorLabel");
  const blackHandicapLabelEl = document.getElementById("shogiBlackHandicapLabel");
  const whiteHandicapLabelEl = document.getElementById("shogiWhiteHandicapLabel");
  const thirdHandicapLabelEl = document.getElementById("shogiThirdHandicapLabel");
  const fourthHandicapLabelEl = document.getElementById("shogiFourthHandicapLabel");
  const blackMineCountLabelEl = document.getElementById("shogiBlackMineCountLabel");
  const whiteMineCountLabelEl = document.getElementById("shogiWhiteMineCountLabel");
  const thirdMineCountLabelEl = document.getElementById("shogiThirdMineCountLabel");
  const fourthMineCountLabelEl = document.getElementById("shogiFourthMineCountLabel");
  const playerSetting1El = document.getElementById("shogiPlayerSetting1");
  const playerSetting2El = document.getElementById("shogiPlayerSetting2");
  const playerSetting3El = document.getElementById("shogiPlayerSetting3");
  const playerSetting4El = document.getElementById("shogiPlayerSetting4");
  const blackHandEl = document.getElementById("shogiBlackHand");
  const whiteHandEl = document.getElementById("shogiWhiteHand");
  const i18nLang = () => (document.documentElement.getAttribute("lang") || "ja").toLowerCase();
  const t = (ja, ko) => (i18nLang().startsWith("ko") ? ko : ja);

  function campFromTurnOrderChoice(choice) {
    if (choice === "one") return "north";
    if (choice === "two") return "east";
    if (choice === "three") return "south";
    if (choice === "four") return "west";
    return "north";
  }

  function updateTurnOrderChoicesForMode() {
    if (!turnOrderSelect) return;

    const is4p = isChaosFourPlayerMode();
    const options = is4p
      ? [
          { value: "one", text: "1" },
          { value: "two", text: "2" },
          { value: "three", text: "3" },
          { value: "four", text: "4" },
          { value: "random", text: "ランダム" },
        ]
      : [
          { value: "first", text: "先攻" },
          { value: "second", text: "後攻" },
          { value: "random", text: "ランダム" },
        ];

    const existingValues = Array.from(turnOrderSelect.options).map((entry) => entry.value);
    const needsRebuild =
      existingValues.length !== options.length || options.some((entry, index) => existingValues[index] !== entry.value);

    if (!needsRebuild) return;

    const previousChoice = normalizeTurnOrderChoice(state.turnOrderChoice);
    turnOrderSelect.innerHTML = "";
    options.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.text;
      turnOrderSelect.appendChild(option);
    });

    const fallback = is4p ? "one" : "first";
    const nextChoice = options.some((entry) => entry.value === previousChoice) ? previousChoice : fallback;
    state.turnOrderChoice = nextChoice;
    turnOrderSelect.value = nextChoice;
  }

  function updateChaosOptionLabels() {
    const is4p = isChaosFourPlayerMode();

    if (turnOrderLabelEl) turnOrderLabelEl.textContent = is4p ? "開始プレイヤー" : "先攻後攻";
    if (myPieceColorLabelEl) myPieceColorLabelEl.textContent = is4p ? "駒色テーマ" : "自分の駒色";

    if (blackHandicapLabelEl) blackHandicapLabelEl.textContent = "ハンデ";
    if (whiteHandicapLabelEl) whiteHandicapLabelEl.textContent = "ハンデ";
    if (thirdHandicapLabelEl) thirdHandicapLabelEl.textContent = "ハンデ";
    if (fourthHandicapLabelEl) fourthHandicapLabelEl.textContent = "ハンデ";
    if (blackMineCountLabelEl) blackMineCountLabelEl.textContent = "地雷数";
    if (whiteMineCountLabelEl) whiteMineCountLabelEl.textContent = "地雷数";
    if (thirdMineCountLabelEl) thirdMineCountLabelEl.textContent = "地雷数";
    if (fourthMineCountLabelEl) fourthMineCountLabelEl.textContent = "地雷数";

    if (myPieceColorSelect) {
      myPieceColorSelect.disabled = is4p;
    }
  }

  function resolveLegacyOwnerByTarget(target, context) {
    const mode = context?.gameMode ?? "local";
    const roomPlayer = context?.roomPlayer ?? BLACK;
    const cpuPlayer = context?.cpuPlayer ?? WHITE;
    const normalizedTarget = normalizeHandicapTargetChoice(target);

    if (normalizedTarget === "black") return BLACK;
    if (normalizedTarget === "white") return WHITE;
    if (normalizedTarget === "both") return null;

    if (normalizedTarget === "self") {
      if (mode === "room") return roomPlayer;
      if (mode === "cpu") return opposite(cpuPlayer);
      return BLACK;
    }

    if (mode === "room") return opposite(roomPlayer);
    if (mode === "cpu") return cpuPlayer;
    return WHITE;
  }

  function buildHandicapByOwnerFromLegacy(choice, target, context) {
    const normalizedChoice = normalizeHandicapChoice(choice);
    const owner = resolveLegacyOwnerByTarget(target, context);
    if (owner === null) {
      return {
        [BLACK]: normalizedChoice,
        [WHITE]: normalizedChoice,
      };
    }
    return {
      [BLACK]: owner === BLACK ? normalizedChoice : "none",
      [WHITE]: owner === WHITE ? normalizedChoice : "none",
    };
  }

  const initialLegacyByOwner = buildHandicapByOwnerFromLegacy(
    legacyHandicapSelect?.value,
    legacyHandicapTargetSelect?.value,
    { gameMode: "local", roomPlayer: BLACK, cpuPlayer: WHITE },
  );

  const state = {
    board: normalizeBoardState(makeInitialBoard()),
    hands: createEmptyHands(),
    currentPlayer: BLACK,
    currentCamp: "south",
    turnIndex: 0,
    selectedPiece: null,
    selectedHandType: null,
    validMoves: [],
    gameOver: false,
    gameMode: "local",
    cpuLevel: SHOGI_CPU_SETTINGS[difficultySelect?.value] ? difficultySelect.value : "normal",
    cpuPlayer: WHITE,
    cpuTimerId: null,
    roomCode: null,
    roomRole: null,
    roomPlayer: BLACK,
    roomGameModeChoice: normalizeRoomGameModeChoice(modeSelect?.value),
    roomFirstMoverRole: "host",
    turnOrderChoice: normalizeTurnOrderChoice(turnOrderSelect?.value),
    myPieceColor: normalizeMyPieceColor(myPieceColorSelect?.value),
    blackHandicapChoice: normalizeHandicapChoice(blackHandicapSelect?.value ?? initialLegacyByOwner[BLACK]),
    whiteHandicapChoice: normalizeHandicapChoice(whiteHandicapSelect?.value ?? initialLegacyByOwner[WHITE]),
    thirdHandicapChoice: normalizeHandicapChoice(thirdHandicapSelect?.value),
    fourthHandicapChoice: normalizeHandicapChoice(fourthHandicapSelect?.value),
    mineCountByCampChoice: normalizeMineCountByCampChoice({
      north: blackMineCountSelect?.value,
      east: whiteMineCountSelect?.value,
      south: thirdMineCountSelect?.value,
      west: fourthMineCountSelect?.value,
    }),
    kingAbsorbChoice: normalizeKingAbsorbChoice(kingAbsorbSelect?.value),
    chaosPlayerModeChoice: normalizeChaosPlayerModeChoice(chaosPlayerModeSelect?.value),
    remakeVotes: { [BLACK]: false, [WHITE]: false },
    roomLocked: false,
    roomLockMessage: "",
  };

  function resetRemakeVotes() {
    state.remakeVotes[BLACK] = false;
    state.remakeVotes[WHITE] = false;
  }

  function getRemakePendingMessage() {
    if (!isRoomMode()) return null;
    if (!state.remakeVotes[BLACK] && !state.remakeVotes[WHITE]) return null;
    if (state.remakeVotes[BLACK] && state.remakeVotes[WHITE]) return null;

    const waitingFor = state.remakeVotes[BLACK] ? WHITE : BLACK;
    if (waitingFor === state.roomPlayer) {
      return "相手がリメイクを希望しています（リメイクで承認）";
    }
    return "相手のリメイク承認待ちです";
  }

  function fitBoardToGrid() {
    const wrap = boardEl?.parentElement;
    if (!wrap) return;

    const GAP = 2;
    const PADDING = 2;
    const BORDER = 1;
    const CHROME = GAP * (SIZE - 1) + PADDING * 2 + BORDER * 2;

    const maxBoardByWrap = Math.max(220, wrap.clientWidth - 6);
    const maxBoardByViewport = Math.max(220, Math.floor(window.innerHeight * 0.68));
    const maxBoard = Math.min(maxBoardByWrap, maxBoardByViewport, 780);

    const cellByBoard = Math.floor((maxBoard - CHROME) / SIZE);
    const cellPx = Math.max(18, Math.min(84, cellByBoard));
    const boardPx = cellPx * SIZE + CHROME;

    boardEl.style.setProperty("--shogi-grid-size", String(SIZE));
    boardEl.style.setProperty("--shogi-cell-size", `${cellPx}px`);
    boardEl.style.width = `${boardPx}px`;
    boardEl.style.height = `${boardPx}px`;
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isCpuMode() {
    return state.gameMode === "cpu";
  }

  function isChaosMode() {
    return state.gameMode === "chaos" || (isRoomMode() && normalizeRoomGameModeChoice(state.roomGameModeChoice) === "chaos");
  }

  function isChaosFourPlayerMode() {
    return isChaosMode() && normalizeChaosPlayerModeChoice(state.chaosPlayerModeChoice) === "4p";
  }

  function currentTurnCamp() {
    if (isChaosFourPlayerMode()) return state.currentCamp;
    return state.currentPlayer === BLACK ? "south" : "north";
  }

  function campLabel(camp) {
    if (camp === "north") return "北";
    if (camp === "east") return "東";
    if (camp === "south") return "南";
    if (camp === "west") return "西";
    return "-";
  }

  function isPieceControllableByCurrentTurn(piece) {
    if (!piece) return false;
    if (isChaosFourPlayerMode()) {
      return piece.camp === state.currentCamp;
    }
    return piece.owner === state.currentPlayer;
  }

  function syncTurnState() {
    if (isChaosFourPlayerMode()) {
      const fallbackCamp =
        state.currentPlayer === BLACK ? "south" : state.currentPlayer === WHITE ? "north" : "north";
      const normalizedCamp = CAMP_ORDER_4P.includes(state.currentCamp) ? state.currentCamp : fallbackCamp;
      state.currentCamp = normalizedCamp;
      state.currentPlayer = campOwner(normalizedCamp) ?? state.currentPlayer;
      return;
    }

    state.currentPlayer = state.currentPlayer === WHITE ? WHITE : BLACK;
    state.currentCamp = state.currentPlayer === BLACK ? "south" : "north";
  }

  function advanceTurn() {
    state.turnIndex += 1;
    if (isChaosFourPlayerMode()) {
      const index = Math.max(0, CAMP_ORDER_4P.indexOf(state.currentCamp));
      const nextCamp = CAMP_ORDER_4P[(index + 1) % CAMP_ORDER_4P.length];
      state.currentCamp = nextCamp;
      state.currentPlayer = campOwner(nextCamp) ?? state.currentPlayer;
      return;
    }
    state.currentPlayer = opposite(state.currentPlayer);
    state.currentCamp = state.currentPlayer === BLACK ? "south" : "north";
  }

  function getCpuSetting() {
    return SHOGI_CPU_SETTINGS[state.cpuLevel] ?? SHOGI_CPU_SETTINGS.normal;
  }

  function isCpuTurn() {
    return isCpuMode() && !state.gameOver && state.currentPlayer === state.cpuPlayer;
  }

  function clearCpuTimer() {
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
  }

  function isLocalPlayersTurn() {
    if (isRoomMode()) {
      if (state.roomPlayer !== BLACK && state.roomPlayer !== WHITE) return false;
      return !state.roomLocked && state.currentPlayer === state.roomPlayer;
    }
    if (isCpuMode()) return state.currentPlayer !== state.cpuPlayer;
    return true;
  }

  function turnLabel(owner) {
    return owner === BLACK ? t("先手", "선수") : t("後手", "후수");
  }

  function playerNameFor(owner) {
    if (isRoomMode()) {
      return owner === state.roomPlayer ? t("あなた", "당신") : t("相手", "상대");
    }
    if (isCpuMode()) {
      return owner === state.cpuPlayer ? "CPU" : t("あなた", "당신");
    }
    return turnLabel(owner);
  }

  function outcomeTextForWinner(winnerOwner) {
    const loserOwner = opposite(winnerOwner);
    return `${playerNameFor(winnerOwner)}: 勝ち / ${playerNameFor(loserOwner)}: 負け`;
  }

  function clearSelection() {
    state.selectedPiece = null;
    state.selectedHandType = null;
    state.validMoves = [];
  }

  function localPieceOwner() {
    if (isChaosFourPlayerMode()) {
      const currentCampOwner = campOwner(state.currentCamp);
      return currentCampOwner ?? BLACK;
    }
    if (isRoomMode()) return state.roomPlayer ?? BLACK;
    if (isCpuMode()) return opposite(state.cpuPlayer);
    return BLACK;
  }

  function mineViewerOwner() {
    if (isChaosFourPlayerMode()) {
      const currentCampOwner = campOwner(state.currentCamp);
      return currentCampOwner ?? state.currentPlayer;
    }
    if (isRoomMode()) return state.roomPlayer ?? null;
    if (isCpuMode()) return opposite(state.cpuPlayer);
    // In local/chaos mode, reveal mine marks for the side to move.
    return state.currentPlayer;
  }

  function shouldFlipBoardView() {
    const localOwner = localPieceOwner();
    if (localOwner !== WHITE) return false;
    return isRoomMode() || isCpuMode();
  }

  function applyMyPieceColorTheme() {
    if (!boardEl) return;
    const color = normalizeMyPieceColor(myPieceColorSelect?.value ?? state.myPieceColor);
    state.myPieceColor = color;
    const classes = [
      "shogi-self-color-amber",
      "shogi-self-color-cyan",
      "shogi-self-color-lime",
      "shogi-self-color-magenta",
    ];
    boardEl.classList.remove(...classes);
    boardEl.classList.add(`shogi-self-color-${color}`);
    boardEl.classList.toggle("shogi-four-player-colors", isChaosFourPlayerMode());
  }

  function roomPlayerFromFirstMoverRole(firstMoverRole) {
    if (state.roomRole === "spectator") return null;
    const localIsHost = state.roomRole === "host";
    const localIsFirst = firstMoverRole === "host" ? localIsHost : !localIsHost;
    return localIsFirst ? BLACK : WHITE;
  }

  function updateTurnOrderSelectState() {
    if (!turnOrderSelect) return;
    if (isRoomMode()) {
      turnOrderSelect.disabled = state.roomRole !== "host";
      return;
    }
    turnOrderSelect.disabled = false;
  }

  function updateHandicapControlsState() {
    const handicapEditable = true;
    const mineEditable = isChaosMode();
    const showChaosRules = isChaosMode();

    blackHandicapMetric?.classList.toggle("hidden", !showChaosRules);
    whiteHandicapMetric?.classList.toggle("hidden", !showChaosRules);
    thirdHandicapMetric?.classList.toggle("hidden", !showChaosRules || !isChaosFourPlayerMode());
    fourthHandicapMetric?.classList.toggle("hidden", !showChaosRules || !isChaosFourPlayerMode());
    playerSetting1El?.classList.toggle("hidden", !showChaosRules);
    playerSetting2El?.classList.toggle("hidden", !showChaosRules);
    playerSetting3El?.classList.toggle("hidden", !showChaosRules || !isChaosFourPlayerMode());
    playerSetting4El?.classList.toggle("hidden", !showChaosRules || !isChaosFourPlayerMode());
    legacyHandicapMetric?.classList.toggle("hidden", !showChaosRules);
    legacyHandicapTargetMetric?.classList.toggle("hidden", !showChaosRules);
    blackMineCountMetric?.classList.toggle("hidden", !showChaosRules);
    whiteMineCountMetric?.classList.toggle("hidden", !showChaosRules);
    thirdMineCountMetric?.classList.toggle("hidden", !showChaosRules || !isChaosFourPlayerMode());
    fourthMineCountMetric?.classList.toggle("hidden", !showChaosRules || !isChaosFourPlayerMode());
    kingAbsorbMetric?.classList.toggle("hidden", !showChaosRules);
    chaosPlayerModeMetric?.classList.toggle("hidden", !showChaosRules);
    chaosRuleMetric?.classList.toggle("hidden", !showChaosRules);

    if (blackHandicapSelect) blackHandicapSelect.disabled = !handicapEditable;
    if (whiteHandicapSelect) whiteHandicapSelect.disabled = !handicapEditable;
    if (thirdHandicapSelect) thirdHandicapSelect.disabled = !handicapEditable || !isChaosFourPlayerMode();
    if (fourthHandicapSelect) fourthHandicapSelect.disabled = !handicapEditable || !isChaosFourPlayerMode();
    if (legacyHandicapSelect) legacyHandicapSelect.disabled = !handicapEditable;
    if (legacyHandicapTargetSelect) legacyHandicapTargetSelect.disabled = !handicapEditable;
    if (blackMineCountSelect) blackMineCountSelect.disabled = !mineEditable;
    if (whiteMineCountSelect) whiteMineCountSelect.disabled = !mineEditable;
    if (thirdMineCountSelect) thirdMineCountSelect.disabled = !mineEditable || !isChaosFourPlayerMode();
    if (fourthMineCountSelect) fourthMineCountSelect.disabled = !mineEditable || !isChaosFourPlayerMode();
    if (kingAbsorbSelect) kingAbsorbSelect.disabled = !mineEditable;
    if (chaosPlayerModeSelect) chaosPlayerModeSelect.disabled = !mineEditable;

    updateTurnOrderChoicesForMode();
    updateChaosOptionLabels();
    updateChaosRuleSummary();
  }

  function optionTextForValue(selectEl, value, fallback = "-") {
    if (!selectEl) return fallback;
    const option = Array.from(selectEl.options).find((entry) => entry.value === String(value));
    return option?.textContent?.trim() || fallback;
  }

  function updateChaosRuleSummary() {
    if (!chaosRuleText) return;
    if (!isChaosMode()) {
      chaosRuleText.textContent = "-";
      return;
    }

    const blackLabel = blackHandicapMetric?.querySelector(".label")?.textContent?.trim() || "先手ハンデ";
    const whiteLabel = whiteHandicapMetric?.querySelector(".label")?.textContent?.trim() || "後手ハンデ";
    const thirdLabel = thirdHandicapMetric?.querySelector(".label")?.textContent?.trim() || "3ハンデ";
    const fourthLabel = fourthHandicapMetric?.querySelector(".label")?.textContent?.trim() || "4ハンデ";
    const mineNorthLabel = blackMineCountMetric?.querySelector(".label")?.textContent?.trim() || "1地雷数";
    const mineEastLabel = whiteMineCountMetric?.querySelector(".label")?.textContent?.trim() || "2地雷数";
    const mineSouthLabel = thirdMineCountMetric?.querySelector(".label")?.textContent?.trim() || "3地雷数";
    const mineWestLabel = fourthMineCountMetric?.querySelector(".label")?.textContent?.trim() || "4地雷数";
    const kingAbsorbLabel = kingAbsorbMetric?.querySelector(".label")?.textContent?.trim() || "王吸収";
    const chaosPlayerModeLabel = chaosPlayerModeMetric?.querySelector(".label")?.textContent?.trim() || "対局人数";
    const blackText = optionTextForValue(blackHandicapSelect, state.blackHandicapChoice, "なし");
    const whiteText = optionTextForValue(whiteHandicapSelect, state.whiteHandicapChoice, "なし");
    const thirdText = optionTextForValue(thirdHandicapSelect, state.thirdHandicapChoice, "なし");
    const fourthText = optionTextForValue(fourthHandicapSelect, state.fourthHandicapChoice, "なし");
    const mineNorthText = optionTextForValue(blackMineCountSelect, state.mineCountByCampChoice.north, "0");
    const mineEastText = optionTextForValue(whiteMineCountSelect, state.mineCountByCampChoice.east, "0");
    const mineSouthText = optionTextForValue(thirdMineCountSelect, state.mineCountByCampChoice.south, "0");
    const mineWestText = optionTextForValue(fourthMineCountSelect, state.mineCountByCampChoice.west, "0");
    const kingAbsorbText = optionTextForValue(kingAbsorbSelect, state.kingAbsorbChoice, "OFF");
    const chaosPlayerModeText = optionTextForValue(chaosPlayerModeSelect, state.chaosPlayerModeChoice, "2人");

    if (isChaosFourPlayerMode()) {
      chaosRuleText.textContent = `${blackLabel}: ${blackText} / ${whiteLabel}: ${whiteText} / ${thirdLabel}: ${thirdText} / ${fourthLabel}: ${fourthText} / ${mineNorthLabel}: ${mineNorthText} / ${mineEastLabel}: ${mineEastText} / ${mineSouthLabel}: ${mineSouthText} / ${mineWestLabel}: ${mineWestText} / ${kingAbsorbLabel}: ${kingAbsorbText} / ${chaosPlayerModeLabel}: ${chaosPlayerModeText}`;
      return;
    }

    chaosRuleText.textContent = `${blackLabel}: ${blackText} / ${whiteLabel}: ${whiteText} / ${mineNorthLabel}: ${mineNorthText} / ${mineEastLabel}: ${mineEastText} / ${kingAbsorbLabel}: ${kingAbsorbText} / ${chaosPlayerModeLabel}: ${chaosPlayerModeText}`;
  }

  function syncChaosSelectionsFromControls() {
    if (!isChaosMode()) return;
    if (blackHandicapSelect) state.blackHandicapChoice = normalizeHandicapChoice(blackHandicapSelect.value);
    if (whiteHandicapSelect) state.whiteHandicapChoice = normalizeHandicapChoice(whiteHandicapSelect.value);
    if (thirdHandicapSelect) state.thirdHandicapChoice = normalizeHandicapChoice(thirdHandicapSelect.value);
    if (fourthHandicapSelect) state.fourthHandicapChoice = normalizeHandicapChoice(fourthHandicapSelect.value);
    state.mineCountByCampChoice = normalizeMineCountByCampChoice({
      north: blackMineCountSelect?.value,
      east: whiteMineCountSelect?.value,
      south: thirdMineCountSelect?.value,
      west: fourthMineCountSelect?.value,
    });
    if (kingAbsorbSelect) state.kingAbsorbChoice = normalizeKingAbsorbChoice(kingAbsorbSelect.value);
    if (chaosPlayerModeSelect) state.chaosPlayerModeChoice = normalizeChaosPlayerModeChoice(chaosPlayerModeSelect.value);
  }

  function getEffectiveChaosSettings() {
    syncChaosSelectionsFromControls();

    if (!isChaosMode()) {
      return {
        handicapByOwner: { [BLACK]: "none", [WHITE]: "none" },
        handicapByCamp: { north: "none", east: "none", south: "none", west: "none" },
        mineCount: { north: 0, east: 0, south: 0, west: 0 },
        kingAllyAbsorbEnabled: false,
        chaosPlayerMode: "2p",
        boardSize: 9,
      };
    }

    const chaosPlayerMode = state.chaosPlayerModeChoice;
    const handicapByCamp = {
      north: state.blackHandicapChoice,
      east: state.whiteHandicapChoice,
      south: state.thirdHandicapChoice,
      west: state.fourthHandicapChoice,
    };
    return {
      handicapByOwner: {
        [BLACK]: state.blackHandicapChoice,
        [WHITE]: state.whiteHandicapChoice,
      },
      handicapByCamp,
      mineCount: state.mineCountByCampChoice,
      kingAllyAbsorbEnabled: state.kingAbsorbChoice === "on",
      chaosPlayerMode,
      boardSize: boardSizeForChaosPlayerMode(chaosPlayerMode),
    };
  }

  function syncHandicapSelectValues() {
    if (blackHandicapSelect) blackHandicapSelect.value = state.blackHandicapChoice;
    if (whiteHandicapSelect) whiteHandicapSelect.value = state.whiteHandicapChoice;
    if (thirdHandicapSelect) thirdHandicapSelect.value = state.thirdHandicapChoice;
    if (fourthHandicapSelect) fourthHandicapSelect.value = state.fourthHandicapChoice;

    if (legacyHandicapSelect) {
      const sameChoice = state.blackHandicapChoice === state.whiteHandicapChoice;
      legacyHandicapSelect.value = sameChoice ? state.blackHandicapChoice : "none";
    }
    if (legacyHandicapTargetSelect) {
      if (state.blackHandicapChoice !== "none" && state.whiteHandicapChoice !== "none" && state.blackHandicapChoice === state.whiteHandicapChoice) {
        legacyHandicapTargetSelect.value = "both";
      }
    }

    if (blackMineCountSelect) blackMineCountSelect.value = String(state.mineCountByCampChoice.north);
    if (whiteMineCountSelect) whiteMineCountSelect.value = String(state.mineCountByCampChoice.east);
    if (thirdMineCountSelect) thirdMineCountSelect.value = String(state.mineCountByCampChoice.south);
    if (fourthMineCountSelect) fourthMineCountSelect.value = String(state.mineCountByCampChoice.west);
    if (kingAbsorbSelect) kingAbsorbSelect.value = state.kingAbsorbChoice;
    if (chaosPlayerModeSelect) chaosPlayerModeSelect.value = state.chaosPlayerModeChoice;
    updateHandicapControlsState();
  }

  function broadcastHandicapSettings() {
    if (!isRoomMode()) return;
    const handicapByCampChoice = {
      north: state.blackHandicapChoice,
      east: state.whiteHandicapChoice,
      south: state.thirdHandicapChoice,
      west: state.fourthHandicapChoice,
    };
    options.onRoomModeChange?.({
      kind: "handicap-settings",
      handicapByCampChoice,
      blackHandicapChoice: state.blackHandicapChoice,
      whiteHandicapChoice: state.whiteHandicapChoice,
      thirdHandicapChoice: state.thirdHandicapChoice,
      fourthHandicapChoice: state.fourthHandicapChoice,
      mineCountByCampChoice: state.mineCountByCampChoice,
      mineCountChoice: state.mineCountByCampChoice.north,
      kingAbsorbChoice: state.kingAbsorbChoice,
      chaosPlayerModeChoice: state.chaosPlayerModeChoice,
    });
  }

  function resolveRoomFirstMoverRole({ fromRemote = false } = {}) {
    if (state.roomRole !== "host") return state.roomFirstMoverRole;

    const choice = normalizeTurnOrderChoice(turnOrderSelect?.value ?? state.turnOrderChoice);
    state.turnOrderChoice = choice;

    let firstMoverRole = "host";
    if (choice === "second") {
      firstMoverRole = "guest";
    } else if (choice === "random") {
      firstMoverRole = Math.random() < 0.5 ? "host" : "guest";
    }

    state.roomFirstMoverRole = firstMoverRole;

    if (!fromRemote) {
      options.onRoomModeChange?.({
        kind: "turn-order",
        turnOrderChoice: choice,
        firstMoverRole,
      });
    }

    return firstMoverRole;
  }

  function resolveStartPlayer({ fromRemote = false } = {}) {
    if (isRoomMode()) {
      if (state.roomRole === "spectator") {
        return BLACK;
      }
      const firstMoverRole = resolveRoomFirstMoverRole({ fromRemote });
      state.roomPlayer = roomPlayerFromFirstMoverRole(firstMoverRole);
      return BLACK;
    }

    if (isChaosFourPlayerMode()) {
      const choice = normalizeTurnOrderChoice(turnOrderSelect?.value ?? state.turnOrderChoice);
      state.turnOrderChoice = choice;
      const startCamp = choice === "random" ? CAMP_ORDER_4P[Math.floor(Math.random() * CAMP_ORDER_4P.length)] ?? "north" : campFromTurnOrderChoice(choice);
      state.currentCamp = startCamp;
      return campOwner(startCamp) ?? WHITE;
    }

    const choice = normalizeTurnOrderChoice(turnOrderSelect?.value ?? state.turnOrderChoice);
    state.turnOrderChoice = choice;

    if (isCpuMode()) {
      const playerFirst = choice === "first" ? true : choice === "second" ? false : Math.random() < 0.5;
      state.cpuPlayer = playerFirst ? WHITE : BLACK;
      return BLACK;
    }

    if (choice === "second") return WHITE;
    if (choice === "random") return Math.random() < 0.5 ? BLACK : WHITE;
    return BLACK;
  }

  function updateMessageForTurn() {
    syncTurnState();
    const remakeMessage = getRemakePendingMessage();
    if (remakeMessage) {
      messageEl.textContent = remakeMessage;
      return;
    }

    if (isChaosFourPlayerMode()) {
      const base = `${campLabel(currentTurnCamp())}${t("の手番", " 턴")}`;
      messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}${t("（王手）", " (체크)")}` : base;
      return;
    }

    if (isRoomMode()) {
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || t("対戦相手を待機中...", "상대를 기다리는 중...");
        return;
      }
      if (state.roomPlayer !== BLACK && state.roomPlayer !== WHITE) {
        messageEl.textContent = t("観戦中", "관전 중");
        return;
      }
      const base = state.currentPlayer === state.roomPlayer ? t("あなたの手番", "당신의 턴") : t("相手の手番", "상대의 턴");
      messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}${t("（王手）", " (체크)")}` : base;
      return;
    }

    if (isCpuTurn()) {
      const levelLabel =
        state.cpuLevel === "easy"
          ? "かんたん"
          : state.cpuLevel === "hard"
            ? "つよい"
            : state.cpuLevel === "pro"
              ? "プロ"
              : "ふつう";
      messageEl.textContent = t(`CPU（${levelLabel}）が考えています...`, `CPU (${levelLabel})가 생각 중...`);
      return;
    }

    const base = `${turnLabel(state.currentPlayer)}${t("の手番", " 턴")}`;
    messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}${t("（王手）", " (체크)")}` : base;
  }

  function chooseCpuAction() {
    const setting = getCpuSetting();
    const actions = getAllLegalActions(state.board, state.hands, state.currentPlayer);
    if (actions.length === 0) return null;

    const ordered = [...actions]
      .sort((a, b) => actionOrderScore(b) - actionOrderScore(a))
      .slice(0, setting.candidateLimit ?? actions.length);

    if (Math.random() < (setting.randomRate ?? 0)) {
      return cloneAction(ordered[Math.floor(Math.random() * ordered.length)]);
    }

    let best = ordered[0];
    let bestScore = -Infinity;

    const deadline = performance.now() + Math.max(80, setting.thinkMs ?? SHOGI_CPU_THINK_MS);

    for (const action of ordered) {
      if (performance.now() >= deadline) break;
      const score = evaluateAction(state.board, state.hands, state.currentPlayer, action);

      let finalScore = score;
      if ((setting.lookaheadDepth ?? 1) >= 2) {
        const simBoard = cloneBoard(state.board);
        const simHands = cloneHands(state.hands);
        const ok = applyActionSim(simBoard, simHands, state.currentPlayer, action);
        if (ok) {
          const enemy = opposite(state.currentPlayer);
          const enemyActions = getAllLegalActions(simBoard, simHands, enemy)
            .sort((a, b) => actionOrderScore(b) - actionOrderScore(a))
            .slice(0, setting.enemyCandidateLimit ?? 20);

          let enemyBest = -Infinity;
          let enemyBestAction = null;
          for (const enemyAction of enemyActions) {
            if (performance.now() >= deadline) break;
            const enemyScore = evaluateAction(simBoard, simHands, enemy, enemyAction);
            if (enemyScore > enemyBest) {
              enemyBest = enemyScore;
              enemyBestAction = enemyAction;
            }
          }

          if (enemyBest > -Infinity) {
            finalScore -= enemyBest * 0.72;

            if ((setting.lookaheadDepth ?? 1) >= 3 && enemyBestAction) {
              const simBoard2 = cloneBoard(simBoard);
              const simHands2 = cloneHands(simHands);
              const enemyApplied = applyActionSim(simBoard2, simHands2, enemy, enemyBestAction);
              if (enemyApplied && findKing(simBoard2, state.currentPlayer)) {
                const replyActions = getAllLegalActions(simBoard2, simHands2, state.currentPlayer)
                  .sort((a, b) => actionOrderScore(b) - actionOrderScore(a))
                  .slice(0, setting.selfReplyCandidateLimit ?? 16);

                let selfBestReply = -Infinity;
                for (const replyAction of replyActions) {
                  if (performance.now() >= deadline) break;
                  const replyScore = evaluateAction(simBoard2, simHands2, state.currentPlayer, replyAction);
                  if (replyScore > selfBestReply) selfBestReply = replyScore;
                }

                if (selfBestReply > -Infinity) {
                  finalScore += selfBestReply * 0.46;
                }
              }
            }
          }
        }
      }

      if (finalScore > bestScore) {
        bestScore = finalScore;
        best = action;
      }
    }

    return cloneAction(best);
  }

  function scheduleCpuMove() {
    clearCpuTimer();
    if (!isCpuTurn()) return;

    const setting = getCpuSetting();
    const thinkMs = Math.max(90, setting.thinkMs ?? SHOGI_CPU_THINK_MS);

    state.cpuTimerId = setTimeout(() => {
      if (!isCpuTurn()) return;

      const action = chooseCpuAction();
      if (!action) {
        const mover = state.currentPlayer;
        state.currentPlayer = opposite(state.currentPlayer);
        checkGameStateAfterTurn(mover);
        if (!state.gameOver) updateMessageForTurn();
        render();
        scheduleCpuMove();
        return;
      }

      if (action.kind === "drop") {
        applyDrop(action.type, action.toRow, action.toCol, { isRemote: false, force: true });
      } else {
        applyMove(action.fromRow, action.fromCol, action.toRow, action.toCol, Boolean(action.promote), {
          isRemote: false,
          force: true,
        });
      }
    }, thinkMs);
  }

  function updateHeader() {
    turnTextEl.textContent = isChaosFourPlayerMode() ? campLabel(currentTurnCamp()) : turnLabel(state.currentPlayer);

    if (state.selectedHandType) {
      selectTextEl.textContent = `打: ${PIECE_LABEL[state.selectedHandType]}`;
      return;
    }

    if (!state.selectedPiece) {
      selectTextEl.textContent = "-";
      return;
    }

    const piece = state.board[state.selectedPiece.row][state.selectedPiece.col];
    if (!piece) {
      selectTextEl.textContent = "-";
      return;
    }
    const ownerLabel = isChaosFourPlayerMode() ? campLabel(piece.camp) : turnLabel(piece.owner);
    selectTextEl.textContent = `${ownerLabel} ${pieceDisplayLabel(piece, mineViewerOwner())}`;
  }

  function endGame(winnerOwner, reason) {
    state.gameOver = true;
    const outcomeText = outcomeTextForWinner(winnerOwner);
    overlay.style.opacity = "1";
    overlay.textContent = outcomeText;
    messageEl.textContent = `${reason} / ${outcomeText}`;
    clearSelection();
    render();
  }

  function checkGameStateAfterTurn(prevOwner, context = {}) {
    if (isChaosFourPlayerMode()) return;
    const { mineTriggered = false } = context;
    const enemy = opposite(prevOwner);

    if (!findKing(state.board, prevOwner)) {
      endGame(enemy, mineTriggered ? "地雷を踏んで王が失われました" : "王が取られました");
      return;
    }

    if (!findKing(state.board, enemy)) {
      endGame(prevOwner, "王を取りました");
      return;
    }

    if (!hasAnyLegalAction(state.board, state.hands, enemy)) {
      if (isInCheck(state.board, enemy)) {
        endGame(prevOwner, "詰み");
      } else {
        endGame(prevOwner, "合法手なし");
      }
    }
  }

  function resetGame({ fromRemote = false } = {}) {
    clearCpuTimer();
    const chaosSettings = getEffectiveChaosSettings();
    applyBoardSize(chaosSettings.boardSize);
    fitBoardToGrid();
    resetRemakeVotes();
    state.currentPlayer = resolveStartPlayer({ fromRemote });
    state.turnIndex = 0;
    if (!isChaosFourPlayerMode()) {
      state.currentCamp = state.currentPlayer === BLACK ? "south" : "north";
    }
    state.board = normalizeBoardState(makeInitialBoard({
      handicapByOwner: chaosSettings.handicapByOwner,
      handicapByCamp: chaosSettings.handicapByCamp,
      mineCount: chaosSettings.mineCount,
      kingAllyAbsorbEnabled: chaosSettings.kingAllyAbsorbEnabled,
      chaosPlayerMode: chaosSettings.chaosPlayerMode,
    }));
    state.hands = createEmptyHands();
    state.gameOver = false;
    syncTurnState();
    clearSelection();

    if (isRoomMode() && state.roomLocked) {
      overlay.style.opacity = "1";
      overlay.textContent = state.roomLockMessage || "対戦相手を待機中...";
      messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
    } else {
      overlay.style.opacity = "0";
      overlay.textContent = "";
      updateMessageForTurn();
    }

    updateChaosRuleSummary();

    render();
    scheduleCpuMove();

    if (isRoomMode() && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function enterStandby() {
    clearCpuTimer();
    const chaosSettings = getEffectiveChaosSettings();
    applyBoardSize(chaosSettings.boardSize);
    fitBoardToGrid();
    resetRemakeVotes();
    state.board = normalizeBoardState(makeInitialBoard({
      handicapByOwner: chaosSettings.handicapByOwner,
      handicapByCamp: chaosSettings.handicapByCamp,
      mineCount: chaosSettings.mineCount,
      kingAllyAbsorbEnabled: chaosSettings.kingAllyAbsorbEnabled,
      chaosPlayerMode: chaosSettings.chaosPlayerMode,
    }));
    state.hands = createEmptyHands();
    state.turnIndex = 0;
    if (isChaosFourPlayerMode()) {
      state.currentCamp = "north";
      state.currentPlayer = campOwner("north") ?? WHITE;
    } else {
      state.currentPlayer = BLACK;
      state.currentCamp = "south";
    }
    state.gameOver = true;
    clearSelection();
    overlay.style.opacity = "1";
    overlay.textContent = t("対局準備中", "대국 준비 중");
    messageEl.textContent = t("ゲーム開始ボタンを押してください", "게임 시작 버튼을 눌러 주세요");
    updateChaosRuleSummary();
    render();
  }

  function onRemakeButtonClick() {
    const promptText = isRoomMode() ? "リメイクを提案します。よろしいですか？" : "リメイクします。よろしいですか？";
    const confirmed = window.confirm(promptText);
    if (!confirmed) return;

    if (isRoomMode()) {
      applyRemakeVote(state.roomPlayer, { isRemote: false });
      return;
    }

    enterStandby();
  }

  function applyRemakeVote(voter, { isRemote = false } = {}) {
    if (!isRoomMode()) return;
    if (voter !== BLACK && voter !== WHITE) return;

    if (!state.remakeVotes[voter]) {
      state.remakeVotes[voter] = true;
      if (!isRemote) {
        options.onRoomDrawVote?.({ voter });
      }
    }

    if (state.remakeVotes[BLACK] && state.remakeVotes[WHITE]) {
      resetGame({ fromRemote: isRemote });
      return;
    }

    updateMessageForTurn();
    render();
  }

  function applyMove(fromRow, fromCol, toRow, toCol, promote, { isRemote = false, force = false } = {}) {
    if (state.gameOver) return;
    syncTurnState();

    const piece = state.board[fromRow]?.[fromCol];
    if (!piece) return;
    if (!isRemote && !force && !isLocalPlayersTurn()) return;
    if (!isRemote && !isPieceControllableByCurrentTurn(piece)) return;

    const legalOptions = getLegalMoveOptions(state.board, state.hands, state.currentPlayer, fromRow, fromCol, toRow, toCol);
    if (legalOptions.length === 0) return;

    let usePromote = Boolean(promote);
    if (!isRemote && !force) {
      if (legalOptions.length === 2) {
        usePromote = window.confirm("成りますか?");
      } else {
        usePromote = legalOptions[0];
      }
    } else if (!legalOptions.includes(usePromote)) {
      usePromote = legalOptions[0];
    }

    const ok = applyMoveOn(state.board, state.hands, fromRow, fromCol, toRow, toCol, usePromote, {
      turnIndex: state.turnIndex,
    });
    if (!ok) return;

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ kind: "move", fromRow, fromCol, toRow, toCol, promote: usePromote });
    }

    const mover = state.currentPlayer;
    advanceTurn();
    clearSelection();

    checkGameStateAfterTurn(mover, { mineTriggered: ok === "mine-triggered" });
    if (!state.gameOver) updateMessageForTurn();
    render();
    scheduleCpuMove();
  }

  function applyDrop(type, toRow, toCol, { isRemote = false, force = false } = {}) {
    if (state.gameOver) return;
    syncTurnState();
    if (!isRemote && !force && !isLocalPlayersTurn()) return;

    if (!canDropTo(state.board, state.currentPlayer, type, toRow, toCol)) return;
    if (!getDropMoves(state.board, state.hands, state.currentPlayer, type).some((d) => d.row === toRow && d.col === toCol)) {
      return;
    }

    const ok = applyDropOn(state.board, state.hands, state.currentPlayer, type, toRow, toCol, currentTurnCamp(), {
      turnIndex: state.turnIndex,
    });
    if (!ok) return;

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ kind: "drop", type, toRow, toCol });
    }

    const mover = state.currentPlayer;
    advanceTurn();
    clearSelection();

    checkGameStateAfterTurn(mover);
    if (!state.gameOver) updateMessageForTurn();
    render();
    scheduleCpuMove();
  }

  function selectPiece(row, col) {
    syncTurnState();
    const piece = state.board[row][col];
    if (!piece || !isPieceControllableByCurrentTurn(piece)) {
      clearSelection();
      render();
      return;
    }

    state.selectedPiece = { row, col };
    state.selectedHandType = null;
    state.validMoves = getPseudoMoves(state.board, row, col)
      .filter((m) => getLegalMoveOptions(state.board, state.hands, state.currentPlayer, row, col, m.row, m.col).length > 0)
      .map((m) => ({ ...m, kind: "move" }));
    render();
  }

  function selectHand(type) {
    syncTurnState();
    if (!isLocalPlayersTurn() || state.gameOver) return;
    if (state.hands[state.currentPlayer][type] <= 0) return;

    state.selectedPiece = null;
    state.selectedHandType = type;
    state.validMoves = getDropMoves(state.board, state.hands, state.currentPlayer, type).map((m) => ({
      row: m.row,
      col: m.col,
      kind: "drop",
      type,
    }));
    render();
  }

  function onCellClick(row, col) {
    syncTurnState();
    if (!isLocalPlayersTurn() || state.gameOver) return;

    const valid = state.validMoves.find((m) => m.row === row && m.col === col);
    if (valid && state.selectedPiece && valid.kind === "move") {
      applyMove(state.selectedPiece.row, state.selectedPiece.col, row, col, false, { isRemote: false });
      return;
    }

    if (valid && state.selectedHandType && valid.kind === "drop") {
      applyDrop(state.selectedHandType, row, col, { isRemote: false });
      return;
    }

    const piece = state.board[row][col];
    if (piece && isPieceControllableByCurrentTurn(piece)) {
      selectPiece(row, col);
      return;
    }

    clearSelection();
    render();
  }

  function renderHands() {
    blackHandEl.innerHTML = "";
    whiteHandEl.innerHTML = "";
    const localOwner = localPieceOwner();

    const renderOne = (owner, mount) => {
      HAND_TYPES.forEach((type) => {
        const count = state.hands[owner][type];
        if (count <= 0) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "shogi-hand-btn";
        btn.classList.add(owner === localOwner ? "owner-self" : "owner-opponent");
        if (owner === localOwner) {
          btn.classList.add(`self-color-${state.myPieceColor}`);
        }
        if (state.selectedHandType === type && state.currentPlayer === owner && isLocalPlayersTurn()) {
          btn.classList.add("selected");
        }

        btn.disabled = state.gameOver || owner !== state.currentPlayer || !isLocalPlayersTurn();
        btn.textContent = `${PIECE_LABEL[type]} x${count}`;

        btn.addEventListener("click", () => {
          if (state.selectedHandType === type) {
            clearSelection();
            render();
            return;
          }
          selectHand(type);
        });

        mount.appendChild(btn);
      });
    };

    renderOne(WHITE, whiteHandEl);
    renderOne(BLACK, blackHandEl);
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const localOwner = localPieceOwner();
    const flipView = shouldFlipBoardView();

    for (let viewRow = 0; viewRow < SIZE; viewRow += 1) {
      for (let viewCol = 0; viewCol < SIZE; viewCol += 1) {
        const row = flipView ? SIZE - 1 - viewRow : viewRow;
        const col = flipView ? SIZE - 1 - viewCol : viewCol;
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "shogi-cell";
        cell.disabled = state.gameOver || !isLocalPlayersTurn();

        if (state.selectedPiece && state.selectedPiece.row === row && state.selectedPiece.col === col) {
          cell.classList.add("selected");
        }
        if (state.validMoves.some((m) => m.row === row && m.col === col)) {
          cell.classList.add("valid");
        }

        const piece = state.board[row][col];
        if (piece) {
          const span = document.createElement("span");
          const facingClass = `facing-${pieceFacingForRender(piece)}`;
          const campClass = piece.camp ? `camp-${piece.camp}` : "";
          span.className = `shogi-piece ${facingClass} ${campClass} ${piece.owner === localOwner ? "self" : "opponent"}`;
          span.textContent = pieceDisplayLabel(piece, mineViewerOwner());
          cell.appendChild(span);
        }

        cell.addEventListener("click", () => onCellClick(row, col));
        boardEl.appendChild(cell);
      }
    }
  }

  function render() {
    syncTurnState();
    applyMyPieceColorTheme();
    updateHeader();
    renderHands();
    renderBoard();
  }

  startBtn?.addEventListener("click", () => resetGame());
  remakeBtn?.addEventListener("click", onRemakeButtonClick);
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    clearCpuTimer();
    if (isRoomMode()) {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });

  modeSelect?.addEventListener("change", () => {
    if (isRoomMode()) {
      if (state.roomRole !== "host") {
        modeSelect.value = normalizeRoomGameModeChoice(state.roomGameModeChoice);
        return;
      }

      state.roomGameModeChoice = normalizeRoomGameModeChoice(modeSelect.value);
      modeSelect.value = state.roomGameModeChoice;
      options.onRoomModeChange?.({
        kind: "game-mode",
        gameModeChoice: state.roomGameModeChoice,
      });
      updateTurnOrderSelectState();
      updateHandicapControlsState();
      enterStandby();
      return;
    }
    state.gameMode = modeSelect.value === "cpu" ? "cpu" : modeSelect.value === "chaos" ? "chaos" : "local";
    if (difficultySelect) {
      difficultySelect.disabled = state.gameMode !== "cpu";
    }
    updateTurnOrderSelectState();
    updateHandicapControlsState();
    enterStandby();
  });

  turnOrderSelect?.addEventListener("change", () => {
    state.turnOrderChoice = normalizeTurnOrderChoice(turnOrderSelect.value);

    if (isRoomMode() && state.roomRole === "host" && state.gameOver) {
      const firstMoverRole = resolveRoomFirstMoverRole({ fromRemote: false });
      state.roomPlayer = roomPlayerFromFirstMoverRole(firstMoverRole);
      updateMessageForTurn();
      render();
    }
  });

  myPieceColorSelect?.addEventListener("change", () => {
    state.myPieceColor = normalizeMyPieceColor(myPieceColorSelect.value);
    render();
  });

  blackHandicapSelect?.addEventListener("change", () => {
    state.blackHandicapChoice = normalizeHandicapChoice(blackHandicapSelect.value);
    broadcastHandicapSettings();
    enterStandby();
  });

  whiteHandicapSelect?.addEventListener("change", () => {
    state.whiteHandicapChoice = normalizeHandicapChoice(whiteHandicapSelect.value);
    broadcastHandicapSettings();
    enterStandby();
  });

  thirdHandicapSelect?.addEventListener("change", () => {
    state.thirdHandicapChoice = normalizeHandicapChoice(thirdHandicapSelect.value);
    broadcastHandicapSettings();
    enterStandby();
  });

  fourthHandicapSelect?.addEventListener("change", () => {
    state.fourthHandicapChoice = normalizeHandicapChoice(fourthHandicapSelect.value);
    broadcastHandicapSettings();
    enterStandby();
  });

  legacyHandicapSelect?.addEventListener("change", () => {
    const nextByOwner = buildHandicapByOwnerFromLegacy(legacyHandicapSelect.value, legacyHandicapTargetSelect?.value, {
      gameMode: state.gameMode,
      roomPlayer: state.roomPlayer,
      cpuPlayer: state.cpuPlayer,
    });
    state.blackHandicapChoice = nextByOwner[BLACK];
    state.whiteHandicapChoice = nextByOwner[WHITE];
    broadcastHandicapSettings();
    enterStandby();
  });

  legacyHandicapTargetSelect?.addEventListener("change", () => {
    const nextByOwner = buildHandicapByOwnerFromLegacy(legacyHandicapSelect?.value, legacyHandicapTargetSelect.value, {
      gameMode: state.gameMode,
      roomPlayer: state.roomPlayer,
      cpuPlayer: state.cpuPlayer,
    });
    state.blackHandicapChoice = nextByOwner[BLACK];
    state.whiteHandicapChoice = nextByOwner[WHITE];
    broadcastHandicapSettings();
    enterStandby();
  });

  const onMineCountChange = () => {
    if (!isChaosMode()) return;
    state.mineCountByCampChoice = normalizeMineCountByCampChoice({
      north: blackMineCountSelect?.value,
      east: whiteMineCountSelect?.value,
      south: thirdMineCountSelect?.value,
      west: fourthMineCountSelect?.value,
    });
    broadcastHandicapSettings();
    enterStandby();
  };

  blackMineCountSelect?.addEventListener("change", onMineCountChange);
  whiteMineCountSelect?.addEventListener("change", onMineCountChange);
  thirdMineCountSelect?.addEventListener("change", onMineCountChange);
  fourthMineCountSelect?.addEventListener("change", onMineCountChange);

  kingAbsorbSelect?.addEventListener("change", () => {
    if (!isChaosMode()) return;
    state.kingAbsorbChoice = normalizeKingAbsorbChoice(kingAbsorbSelect.value);
    broadcastHandicapSettings();
    enterStandby();
  });

  chaosPlayerModeSelect?.addEventListener("change", () => {
    if (!isChaosMode()) return;
    state.chaosPlayerModeChoice = normalizeChaosPlayerModeChoice(chaosPlayerModeSelect.value);
    updateHandicapControlsState();
    broadcastHandicapSettings();
    enterStandby();
  });

  difficultySelect?.addEventListener("change", () => {
    state.cpuLevel = SHOGI_CPU_SETTINGS[difficultySelect.value] ? difficultySelect.value : "normal";
    if (isCpuTurn()) {
      updateMessageForTurn();
      scheduleCpuMove();
    }
  });
  window.addEventListener("resize", fitBoardToGrid);

  enterStandby();
  updateTurnOrderSelectState();
  updateHandicapControlsState();

  return {
    startNewGame: (opts) => resetGame(opts),
    enterStandby,
    stop: () => {
      clearCpuTimer();
      window.removeEventListener("resize", fitBoardToGrid);
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      clearCpuTimer();
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayer = normalizeRoomPlayer(roomPlayer);
      resetRemakeVotes();
      state.roomFirstMoverRole =
        roomRole === "host" || roomRole === "guest"
          ? state.roomPlayer === BLACK
            ? roomRole
            : roomRole === "host"
              ? "guest"
              : "host"
          : "host";
      if (modeSelect) {
        const cpuOption = modeSelect.querySelector('option[value="cpu"]');
        if (cpuOption) cpuOption.disabled = true;
        state.roomGameModeChoice = normalizeRoomGameModeChoice(modeSelect.value);
        modeSelect.value = state.roomGameModeChoice;
        modeSelect.disabled = roomRole !== "host";
      }
      if (difficultySelect) {
        difficultySelect.disabled = true;
      }
      updateTurnOrderSelectState();
      updateHandicapControlsState();
      if (roomRole === "host") {
        options.onRoomModeChange?.({
          kind: "game-mode",
          gameModeChoice: state.roomGameModeChoice,
        });
      }
      options.onRoomStatusChange?.({ roomCode, roomRole });
    },
    configureStandardMode: () => {
      clearCpuTimer();
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = BLACK;
      resetRemakeVotes();
      state.roomLocked = false;
      state.roomLockMessage = "";
      if (modeSelect) {
        const cpuOption = modeSelect.querySelector('option[value="cpu"]');
        if (cpuOption) cpuOption.disabled = false;
        modeSelect.disabled = false;
        state.gameMode = modeSelect.value === "cpu" ? "cpu" : modeSelect.value === "chaos" ? "chaos" : "local";
        state.roomGameModeChoice = normalizeRoomGameModeChoice(modeSelect.value);
        modeSelect.value = state.gameMode;
      }
      if (difficultySelect) {
        difficultySelect.disabled = true;
      }
      if (blackHandicapSelect) {
        state.blackHandicapChoice = normalizeHandicapChoice(blackHandicapSelect.value);
      }
      if (whiteHandicapSelect) {
        state.whiteHandicapChoice = normalizeHandicapChoice(whiteHandicapSelect.value);
      }
      if (thirdHandicapSelect) {
        state.thirdHandicapChoice = normalizeHandicapChoice(thirdHandicapSelect.value);
      }
      if (fourthHandicapSelect) {
        state.fourthHandicapChoice = normalizeHandicapChoice(fourthHandicapSelect.value);
      }
      state.mineCountByCampChoice = normalizeMineCountByCampChoice({
        north: blackMineCountSelect?.value,
        east: whiteMineCountSelect?.value,
        south: thirdMineCountSelect?.value,
        west: fourthMineCountSelect?.value,
      });
      if (kingAbsorbSelect) {
        state.kingAbsorbChoice = normalizeKingAbsorbChoice(kingAbsorbSelect.value);
      }
      if (chaosPlayerModeSelect) {
        state.chaosPlayerModeChoice = normalizeChaosPlayerModeChoice(chaosPlayerModeSelect.value);
      }
      updateTurnOrderSelectState();
      updateHandicapControlsState();
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
    },
    setRoomLock: ({ locked, message }) => {
      fitBoardToGrid();
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";

      if (state.roomLocked) {
        overlay.style.opacity = "1";
        overlay.textContent = state.roomLockMessage || "対戦相手を待機中...";
        messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
      } else if (!state.gameOver) {
        overlay.style.opacity = "0";
        overlay.textContent = "";
        updateMessageForTurn();
        scheduleCpuMove();
      }

      render();
    },
    applyRemoteMove: (payload) => {
      if (!payload) return;

      if (payload.kind === "drop") {
        applyDrop(payload.type, payload.toRow, payload.toCol, { isRemote: true });
        return;
      }

      if (payload.kind === "move") {
        applyMove(payload.fromRow, payload.fromCol, payload.toRow, payload.toCol, Boolean(payload.promote), {
          isRemote: true,
        });
        return;
      }

      if (typeof payload.fromRow === "number") {
        applyMove(payload.fromRow, payload.fromCol, payload.toRow, payload.toCol, false, { isRemote: true });
      }
    },
    applyRemoteDrawVote: ({ voter }) => {
      applyRemakeVote(voter, { isRemote: true });
    },
    getSnapshot: () => ({
      board: normalizeBoardState(cloneBoard(state.board)),
      hands: cloneHands(state.hands),
      currentPlayer: state.currentPlayer,
      currentCamp: state.currentCamp,
      turnIndex: state.turnIndex,
      gameOver: state.gameOver,
    }),
    applySnapshot: ({ board, hands, currentPlayer, currentCamp, turnIndex, gameOver }) => {
      fitBoardToGrid();
      if (!board || !Array.isArray(board)) return;
      state.board = normalizeBoardState(cloneBoard(board));
      state.hands = hands ? cloneHands(hands) : createEmptyHands();
      state.currentPlayer = currentPlayer;
      state.currentCamp = CAMP_ORDER_4P.includes(currentCamp) ? currentCamp : state.currentCamp;
      state.turnIndex = Number.isFinite(turnIndex) ? Math.max(0, Math.floor(turnIndex)) : state.turnIndex;
      state.gameOver = Boolean(gameOver);
      syncTurnState();
      clearSelection();
      updateMessageForTurn();
      render();
    },
    applyRoomMode: (payload) => {
      if (!payload) return;

      if (payload.kind === "game-mode") {
        state.roomGameModeChoice = normalizeRoomGameModeChoice(payload.gameModeChoice);
        if (modeSelect) {
          modeSelect.value = state.roomGameModeChoice;
        }
        updateTurnOrderSelectState();
        updateHandicapControlsState();
        if (state.gameOver) {
          enterStandby();
        }
        return;
      }

      if (payload.kind === "turn-order") {
        state.turnOrderChoice = normalizeTurnOrderChoice(payload.turnOrderChoice);
        if (turnOrderSelect) {
          turnOrderSelect.value = state.turnOrderChoice;
        }
        if (payload.firstMoverRole === "host" || payload.firstMoverRole === "guest") {
          state.roomFirstMoverRole = payload.firstMoverRole;
          if (isRoomMode() && state.gameOver && state.roomRole !== "spectator") {
            state.roomPlayer = roomPlayerFromFirstMoverRole(state.roomFirstMoverRole);
            updateMessageForTurn();
            render();
          }
        }
        return;
      }

      if (payload.kind === "handicap-settings") {
        if (payload.handicapByCampChoice && typeof payload.handicapByCampChoice === "object") {
          state.blackHandicapChoice = normalizeHandicapChoice(payload.handicapByCampChoice.north);
          state.whiteHandicapChoice = normalizeHandicapChoice(payload.handicapByCampChoice.east);
          state.thirdHandicapChoice = normalizeHandicapChoice(payload.handicapByCampChoice.south);
          state.fourthHandicapChoice = normalizeHandicapChoice(payload.handicapByCampChoice.west);
        }

        if (typeof payload.blackHandicapChoice !== "undefined") {
          state.blackHandicapChoice = normalizeHandicapChoice(payload.blackHandicapChoice);
        }
        if (typeof payload.whiteHandicapChoice !== "undefined") {
          state.whiteHandicapChoice = normalizeHandicapChoice(payload.whiteHandicapChoice);
        }
        if (typeof payload.thirdHandicapChoice !== "undefined") {
          state.thirdHandicapChoice = normalizeHandicapChoice(payload.thirdHandicapChoice);
        }
        if (typeof payload.fourthHandicapChoice !== "undefined") {
          state.fourthHandicapChoice = normalizeHandicapChoice(payload.fourthHandicapChoice);
        }

        // Backward compatibility for older payload format.
        if (typeof payload.handicapChoice !== "undefined") {
          const legacyByOwner = buildHandicapByOwnerFromLegacy(payload.handicapChoice, payload.handicapTargetChoice, {
            gameMode: state.gameMode,
            roomPlayer: state.roomPlayer,
            cpuPlayer: state.cpuPlayer,
          });
          state.blackHandicapChoice = legacyByOwner[BLACK];
          state.whiteHandicapChoice = legacyByOwner[WHITE];
        }

        if (payload.mineCountByCampChoice && typeof payload.mineCountByCampChoice === "object") {
          state.mineCountByCampChoice = normalizeMineCountByCampChoice(payload.mineCountByCampChoice);
        } else {
          const fallbackCount = normalizeMineCountChoice(payload.mineCountChoice);
          state.mineCountByCampChoice = normalizeMineCountByCampChoice({
            north: fallbackCount,
            east: fallbackCount,
            south: fallbackCount,
            west: fallbackCount,
          });
        }
        if (typeof payload.kingAbsorbChoice !== "undefined") {
          state.kingAbsorbChoice = normalizeKingAbsorbChoice(payload.kingAbsorbChoice);
        }
        if (typeof payload.chaosPlayerModeChoice !== "undefined") {
          state.chaosPlayerModeChoice = normalizeChaosPlayerModeChoice(payload.chaosPlayerModeChoice);
        }
        syncHandicapSelectValues();
        if (state.gameOver) {
          enterStandby();
        }
      }
    },
  };
}
