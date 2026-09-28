// Pigg-style actions: feelings, greetings and moves. Durations in ms;
// 0 = held until the avatar walks away (sit / sleep / lie down).

export type ActionId =
  | "laugh" | "cry" | "angry" | "shy" | "surprise" | "love" | "sweat" | "sleep"
  | "wave" | "bow" | "clap" | "banzai" | "peace" | "heart"
  | "jump" | "spin" | "dance" | "backflip" | "sit" | "lie"
  | "fish";

export type ActionCategory = "feel" | "greet" | "move";

export type ActionDef = {
  id: ActionId; label: string; icon: string; category: ActionCategory; durationMs: number;
  /** Set by the game (e.g. fishing), not offered in the action palette. */
  hidden?: boolean;
};

export const ACTION_CATEGORIES: Array<{ id: ActionCategory; label: string }> = [
  { id: "feel", label: "きもち" },
  { id: "greet", label: "あいさつ" },
  { id: "move", label: "うごき" },
];

export const ACTIONS: ActionDef[] = [
  { id: "laugh", label: "大笑い", icon: "😆", category: "feel", durationMs: 2000 },
  { id: "love", label: "ラブ", icon: "😍", category: "feel", durationMs: 2200 },
  { id: "shy", label: "てれる", icon: "☺️", category: "feel", durationMs: 2200 },
  { id: "surprise", label: "びっくり", icon: "😲", category: "feel", durationMs: 1600 },
  { id: "cry", label: "うるうる", icon: "😢", category: "feel", durationMs: 2600 },
  { id: "angry", label: "ムカッ", icon: "💢", category: "feel", durationMs: 2000 },
  { id: "sweat", label: "あせっ", icon: "💦", category: "feel", durationMs: 2000 },
  { id: "sleep", label: "ねむる", icon: "💤", category: "feel", durationMs: 0 },
  { id: "wave", label: "手をふる", icon: "👋", category: "greet", durationMs: 1600 },
  { id: "bow", label: "おじぎ", icon: "🙇", category: "greet", durationMs: 1600 },
  { id: "clap", label: "はくしゅ", icon: "👏", category: "greet", durationMs: 2000 },
  { id: "banzai", label: "バンザイ", icon: "🙌", category: "greet", durationMs: 1600 },
  { id: "peace", label: "ピース", icon: "✌️", category: "greet", durationMs: 2000 },
  { id: "heart", label: "ハート", icon: "💕", category: "greet", durationMs: 1600 },
  { id: "jump", label: "ジャンプ", icon: "⤴️", category: "move", durationMs: 520 },
  { id: "spin", label: "くるくる", icon: "🌀", category: "move", durationMs: 1200 },
  { id: "dance", label: "ダンス", icon: "🎵", category: "move", durationMs: 3200 },
  { id: "backflip", label: "バク宙", icon: "🤸", category: "move", durationMs: 900 },
  { id: "sit", label: "すわる", icon: "🪑", category: "move", durationMs: 0 },
  { id: "lie", label: "ねころぶ", icon: "🛌", category: "move", durationMs: 0 },
  { id: "fish", label: "つり", icon: "🎣", category: "move", durationMs: 0, hidden: true },
];

const BY_ID = new Map(ACTIONS.map((a) => [a.id, a]));

export function actionDef(id: string): ActionDef | undefined {
  return BY_ID.get(id as ActionId);
}

export function isActionId(id: unknown): id is ActionId {
  return typeof id === "string" && BY_ID.has(id as ActionId);
}

/** Pigg-like auto expressions: chat text nudges the speaker's face. */
export function actionFromChat(text: string): ActionId | null {
  const t = text.toLowerCase();
  if (/(笑|ｗｗ|ww|www|草|lol|haha|ははは|あはは|😆|😂)/.test(t) || /w$/.test(t)) return "laugh";
  if (/(泣|;;|；；|t_t|ｔ＿ｔ|うるうる|かなし|悲し|😢|😭)/.test(t)) return "cry";
  if (/(怒|ムカ|むか|💢|😠|😡)/.test(t)) return "angry";
  if (/(♡|❤|💕|好き|すき|大好き|love)/.test(t)) return "love";
  if (/(照れ|てれ|はずかし|恥ずかし|\/\/\/)/.test(t)) return "shy";
  if (/(びっくり|えっ|ええっ|!\?|！？|まじ[!！?？]|😲|😮)/.test(t)) return "surprise";
  if (/(汗|あせ|💦|;\)|；）)/.test(t)) return "sweat";
  if (/(おやすみ|ねむ|眠|zzz|💤)/.test(t)) return "sleep";
  if (/(こんにちは|こんばんは|おはよう|やあ|はじめまして|hello|hi!|よろしく)/.test(t)) return "wave";
  if (/(ありがとう|ありがと|thx|thanks|すみません|ごめん)/.test(t)) return "bow";
  if (/(おめでとう|すごい|すげー|パチパチ|ぱちぱち|👏)/.test(t)) return "clap";
  if (/(やった|ばんざい|バンザイ|わーい|🙌)/.test(t)) return "banzai";
  return null;
}
