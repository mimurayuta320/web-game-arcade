export type MahjongSeatPosition = "bottom" | "top" | "left" | "right";

export type MahjongDiscardSeat = "bottom" | "top" | "left" | "right";

export type MahjongDiscardAnimationView = {
  id: string;
  seat: MahjongDiscardSeat;
  tile: number;
  sourceIndex: number | null;
  isTsumogiri: boolean;
  durationMs: number;
  startedAt: number;
};

export type MahjongTileCode =
  | "1m" | "2m" | "3m" | "4m" | "5m" | "6m" | "7m" | "8m" | "9m"
  | "1p" | "2p" | "3p" | "4p" | "5p" | "6p" | "7p" | "8p" | "9p"
  | "1s" | "2s" | "3s" | "4s" | "5s" | "6s" | "7s" | "8s" | "9s"
  | "east" | "south" | "west" | "north"
  | "white" | "green" | "red"
  | "0m" | "0p" | "0s"
  | "back";

export type MahjongRulePreset = "beginner" | "standard" | "competition" | "casual" | "custom";

export type MahjongActionKey =
  | "tsumo"
  | "ron"
  | "pon"
  | "chi"
  | "kan"
  | "kita"
  | "riichi"
  | "kyuushu"
  | "pass"
  | "cancel"
  | "sort"
  | "autoWin"
  | "noCall"
  | "effects"
  | "diag";

export type MahjongActionOption = {
  key: string;
  label: string;
  tiles?: number[];
  onClick: () => void;
};

export type MahjongPlayerView = {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  score: number;
  rank: number;
  wind: "東" | "南" | "西" | "北";
  isDealer: boolean;
  isRiichi: boolean;
  isTurn: boolean;
  isConnected: boolean;
  thinkingSec: number;
  handBackCount: number;
  drawnBackActive?: boolean;
  discards: number[];
  melds: MahjongMeldView[];
};

export type MahjongMeldView = {
  id: string;
  type: "chi" | "pon" | "ankan" | "minkan" | "kakan";
  tiles: number[];
  calledTileIndex?: number;
  concealed?: boolean;
};

export type MahjongTileInstanceView = {
  instanceId: string;
  tile: number;
};

export type MahjongActionButton = {
  key: MahjongActionKey;
  label: string;
  tone: "primary" | "accent" | "normal" | "subtle";
  priority?: number;
  emphasis?: "critical" | "high" | "normal";
  options?: MahjongActionOption[];
  onClick: () => void;
};

export type MahjongCenterInfoView = {
  roundLabel: string;
  honba: number;
  kyotaku: number;
  remainingTiles: number;
  doraIndicators: number[];
  uraDoraIndicators: number[];
  wallPreviewCount: number;
  dealerName: string;
  tableWind: "東" | "南" | "西" | "北";
  turnPlayerName: string;
};

export type MahjongResultView = {
  winner: string;
  loser?: string;
  handTiles: number[];
  winTile?: number | null;
  dora: number[];
  uraDora: number[];
  yaku: string[];
  hanText: string;
  fuText: string;
  scoreLabel: string;
  scoreDeltaLines: string[];
};

export type MahjongRuleCategory = {
  id: string;
  title: string;
  description: string;
  fields: MahjongRuleField[];
};

export type MahjongRuleField = {
  id: string;
  label: string;
  help: string;
  value: string;
};

export type MahjongLogEvent = {
  id: string;
  ts: string;
  text: string;
  tone?: "normal" | "warn" | "success";
};
