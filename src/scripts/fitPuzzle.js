const STAGES = [
  {
    rows: 4,
    cols: 4,
    pieceCount: 4,
    title: "イントロ",
    profile: { bias: "balanced", mutationSteps: 20, minComplex: 0, minBranch: 0 },
    openingRotation: "mixed",
    assistLimit: 1,
    seed: 101,
  },
  {
    rows: 5,
    cols: 5,
    pieceCount: 6,
    title: "ロングストリップ",
    profile: { bias: "long", mutationSteps: 80, minComplex: 2, minBranch: 0 },
    openingRotation: "mixed",
    assistLimit: 1,
    seed: 203,
  },
  {
    rows: 6,
    cols: 6,
    pieceCount: 8,
    title: "ブロックミックス",
    profile: { bias: "blocks", mutationSteps: 170, minComplex: 4, minBranch: 1 },
    openingRotation: "mixed",
    assistLimit: 1,
    seed: 307,
  },
  {
    rows: 6,
    cols: 6,
    pieceCount: 10,
    title: "ツイストラッシュ",
    profile: { bias: "balanced", mutationSteps: 240, minComplex: 5, minBranch: 1 },
    openingRotation: "mixed",
    assistLimit: 1,
    seed: 409,
  },
  {
    rows: 7,
    cols: 7,
    pieceCount: 10,
    title: "ローテーション",
    profile: { bias: "balanced", mutationSteps: 320, minComplex: 7, minBranch: 2 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 503,
  },
  {
    rows: 7,
    cols: 7,
    pieceCount: 12,
    title: "スパイラル",
    profile: { bias: "long", mutationSteps: 400, minComplex: 8, minBranch: 3 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 601,
  },
  {
    rows: 8,
    cols: 8,
    pieceCount: 13,
    title: "カオスブリッジ",
    profile: { bias: "blocks", mutationSteps: 480, minComplex: 10, minBranch: 3 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 709,
  },
  {
    rows: 8,
    cols: 8,
    pieceCount: 14,
    title: "グランドマスター",
    profile: { bias: "long", mutationSteps: 560, minComplex: 12, minBranch: 4 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 809,
  },
  {
    rows: 8,
    cols: 8,
    pieceCount: 15,
    title: "ラビリンス",
    profile: { bias: "balanced", mutationSteps: 620, minComplex: 13, minBranch: 4 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 907,
  },
  {
    rows: 8,
    cols: 8,
    pieceCount: 16,
    title: "トリックループ",
    profile: { bias: "blocks", mutationSteps: 680, minComplex: 13, minBranch: 4 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1009,
  },
  {
    rows: 9,
    cols: 9,
    pieceCount: 16,
    title: "ナインゲート",
    profile: { bias: "balanced", mutationSteps: 740, minComplex: 14, minBranch: 4 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1103,
  },
  {
    rows: 9,
    cols: 9,
    pieceCount: 17,
    title: "クロスストーム",
    profile: { bias: "long", mutationSteps: 780, minComplex: 14, minBranch: 5 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1201,
  },
  {
    rows: 9,
    cols: 9,
    pieceCount: 18,
    title: "ブランチフォール",
    profile: { bias: "blocks", mutationSteps: 820, minComplex: 15, minBranch: 5 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1301,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 18,
    title: "テンジグザグ",
    profile: { bias: "balanced", mutationSteps: 860, minComplex: 15, minBranch: 5 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1409,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 19,
    title: "フォークロード",
    profile: { bias: "long", mutationSteps: 900, minComplex: 16, minBranch: 5 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1511,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 20,
    title: "カラミティ",
    profile: { bias: "blocks", mutationSteps: 940, minComplex: 16, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1601,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 21,
    title: "オーバードライブ",
    profile: { bias: "balanced", mutationSteps: 980, minComplex: 17, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1709,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 22,
    title: "メイズハリケーン",
    profile: { bias: "long", mutationSteps: 1020, minComplex: 17, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1801,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 23,
    title: "ラストゲート",
    profile: { bias: "blocks", mutationSteps: 1060, minComplex: 18, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 1901,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 24,
    title: "インフィニティクラウン",
    profile: { bias: "balanced", mutationSteps: 1100, minComplex: 18, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2003,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 25,
    title: "ヴォイドランナー",
    profile: { bias: "long", mutationSteps: 1160, minComplex: 19, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2111,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 26,
    title: "グラビティノット",
    profile: { bias: "blocks", mutationSteps: 1220, minComplex: 19, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2207,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 27,
    title: "ブレイクスパイラル",
    profile: { bias: "balanced", mutationSteps: 1280, minComplex: 20, minBranch: 6 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2309,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 28,
    title: "ゼロホライズン",
    profile: { bias: "long", mutationSteps: 1340, minComplex: 20, minBranch: 7 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2411,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 29,
    title: "ハイパーフラクチャ",
    profile: { bias: "blocks", mutationSteps: 1400, minComplex: 21, minBranch: 7 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2503,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 30,
    title: "ストームメッシュ",
    profile: { bias: "balanced", mutationSteps: 1460, minComplex: 21, minBranch: 7 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2617,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 31,
    title: "クオンタムレーン",
    profile: { bias: "long", mutationSteps: 1520, minComplex: 22, minBranch: 7 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2707,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 32,
    title: "ネクサスエンド",
    profile: { bias: "blocks", mutationSteps: 1580, minComplex: 22, minBranch: 7 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2801,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 33,
    title: "ルインコード",
    profile: { bias: "balanced", mutationSteps: 1640, minComplex: 22, minBranch: 7 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 2903,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 34,
    title: "シャドウウェブ",
    profile: { bias: "long", mutationSteps: 1700, minComplex: 23, minBranch: 7 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3001,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 35,
    title: "フラクタルノイズ",
    profile: { bias: "blocks", mutationSteps: 1760, minComplex: 23, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3119,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 36,
    title: "ヘルメッシュ",
    profile: { bias: "balanced", mutationSteps: 1820, minComplex: 24, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3203,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 37,
    title: "デッドロック",
    profile: { bias: "long", mutationSteps: 1880, minComplex: 24, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3301,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 38,
    title: "ブレイジングノット",
    profile: { bias: "blocks", mutationSteps: 1940, minComplex: 25, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3407,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 39,
    title: "アビスライン",
    profile: { bias: "balanced", mutationSteps: 2000, minComplex: 25, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3511,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 40,
    title: "アルティメットコア",
    profile: { bias: "long", mutationSteps: 2060, minComplex: 26, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3607,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 41,
    title: "カオティックルート",
    profile: { bias: "blocks", mutationSteps: 2120, minComplex: 26, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3701,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 42,
    title: "ノイズキャニオン",
    profile: { bias: "balanced", mutationSteps: 2180, minComplex: 27, minBranch: 8 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3803,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 43,
    title: "ファントムマトリクス",
    profile: { bias: "long", mutationSteps: 2240, minComplex: 27, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 3907,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 44,
    title: "グリッチスパイン",
    profile: { bias: "blocks", mutationSteps: 2300, minComplex: 28, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4001,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 45,
    title: "ヘビーラビリンス",
    profile: { bias: "balanced", mutationSteps: 2360, minComplex: 28, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4111,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 46,
    title: "ブロークンアーク",
    profile: { bias: "long", mutationSteps: 2420, minComplex: 29, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4201,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 47,
    title: "ディープフォーク",
    profile: { bias: "blocks", mutationSteps: 2480, minComplex: 29, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4327,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 48,
    title: "エンドレスブレイカー",
    profile: { bias: "balanced", mutationSteps: 2540, minComplex: 30, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4409,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 49,
    title: "ヴォイドスレッド",
    profile: { bias: "long", mutationSteps: 2600, minComplex: 30, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4513,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 50,
    title: "グリッドカタストロフ",
    profile: { bias: "blocks", mutationSteps: 2660, minComplex: 31, minBranch: 9 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4603,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 51,
    title: "ループインフェルノ",
    profile: { bias: "balanced", mutationSteps: 2720, minComplex: 31, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4703,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 52,
    title: "シンギュラーフォーク",
    profile: { bias: "long", mutationSteps: 2780, minComplex: 32, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4801,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 53,
    title: "フラクチャードスカイ",
    profile: { bias: "blocks", mutationSteps: 2840, minComplex: 32, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 4903,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 54,
    title: "マグネティックメイズ",
    profile: { bias: "balanced", mutationSteps: 2900, minComplex: 33, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5003,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 55,
    title: "アークブラスト",
    profile: { bias: "long", mutationSteps: 2960, minComplex: 33, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5101,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 56,
    title: "カオスシンフォニー",
    profile: { bias: "blocks", mutationSteps: 3020, minComplex: 34, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5209,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 57,
    title: "ダークウェイブ",
    profile: { bias: "balanced", mutationSteps: 3080, minComplex: 34, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5303,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 58,
    title: "ボルテックスリンク",
    profile: { bias: "long", mutationSteps: 3140, minComplex: 35, minBranch: 10 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5413,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 59,
    title: "クラックドコア",
    profile: { bias: "blocks", mutationSteps: 3200, minComplex: 35, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5501,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 60,
    title: "メテオブランチ",
    profile: { bias: "balanced", mutationSteps: 3260, minComplex: 36, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5609,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 61,
    title: "イグナイトラビリンス",
    profile: { bias: "long", mutationSteps: 3320, minComplex: 36, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5701,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 62,
    title: "ナイトメアグリッド",
    profile: { bias: "blocks", mutationSteps: 3380, minComplex: 37, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5801,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 63,
    title: "ディザスターレーン",
    profile: { bias: "balanced", mutationSteps: 3440, minComplex: 37, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 5903,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 64,
    title: "オメガフラクタル",
    profile: { bias: "long", mutationSteps: 3500, minComplex: 38, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6007,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 65,
    title: "ヴォイドカレント",
    profile: { bias: "blocks", mutationSteps: 3560, minComplex: 38, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6101,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 66,
    title: "ブリッツフォーク",
    profile: { bias: "balanced", mutationSteps: 3620, minComplex: 39, minBranch: 11 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6203,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 67,
    title: "エコーラビリンス",
    profile: { bias: "long", mutationSteps: 3680, minComplex: 39, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6301,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 68,
    title: "フレアメッシュ",
    profile: { bias: "blocks", mutationSteps: 3740, minComplex: 40, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6407,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 69,
    title: "クロノノット",
    profile: { bias: "balanced", mutationSteps: 3800, minComplex: 40, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6503,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 70,
    title: "インパクトウェーブ",
    profile: { bias: "long", mutationSteps: 3860, minComplex: 41, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6607,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 71,
    title: "グラビティフォージ",
    profile: { bias: "blocks", mutationSteps: 3920, minComplex: 41, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6701,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 72,
    title: "ネビュラエンド",
    profile: { bias: "balanced", mutationSteps: 3980, minComplex: 42, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6803,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 73,
    title: "ヴォイドスパーク",
    profile: { bias: "long", mutationSteps: 4040, minComplex: 42, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 6907,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 74,
    title: "カラミティリンク",
    profile: { bias: "blocks", mutationSteps: 4100, minComplex: 43, minBranch: 12 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7001,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 75,
    title: "フラクタルテンペスト",
    profile: { bias: "balanced", mutationSteps: 4160, minComplex: 43, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7103,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 76,
    title: "ブレイズフォーク",
    profile: { bias: "long", mutationSteps: 4220, minComplex: 44, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7207,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 77,
    title: "ノヴァメッシュ",
    profile: { bias: "blocks", mutationSteps: 4280, minComplex: 44, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7307,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 78,
    title: "ルインハリケーン",
    profile: { bias: "balanced", mutationSteps: 4340, minComplex: 45, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7403,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 79,
    title: "シャドウフラクチャ",
    profile: { bias: "long", mutationSteps: 4400, minComplex: 45, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7507,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 80,
    title: "アポカリプスコア",
    profile: { bias: "blocks", mutationSteps: 4460, minComplex: 46, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7603,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 81,
    title: "ブラックアウトノード",
    profile: { bias: "balanced", mutationSteps: 4520, minComplex: 46, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7703,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 82,
    title: "メイズエクリプス",
    profile: { bias: "long", mutationSteps: 4580, minComplex: 47, minBranch: 13 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7801,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 83,
    title: "ハイパークラック",
    profile: { bias: "blocks", mutationSteps: 4640, minComplex: 47, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 7901,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 84,
    title: "カオスドミノ",
    profile: { bias: "balanced", mutationSteps: 4700, minComplex: 48, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8009,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 85,
    title: "ヴォイドギャラクシー",
    profile: { bias: "long", mutationSteps: 4760, minComplex: 48, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8101,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 86,
    title: "メルトフォーク",
    profile: { bias: "blocks", mutationSteps: 4820, minComplex: 49, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8209,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 87,
    title: "レイジンググリッド",
    profile: { bias: "balanced", mutationSteps: 4880, minComplex: 49, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8303,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 88,
    title: "インフィニティルイン",
    profile: { bias: "long", mutationSteps: 4940, minComplex: 50, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8401,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 89,
    title: "オブリビオンゲート",
    profile: { bias: "blocks", mutationSteps: 5000, minComplex: 50, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8501,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 90,
    title: "カオスフルクラム",
    profile: { bias: "balanced", mutationSteps: 5060, minComplex: 51, minBranch: 14 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8603,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 91,
    title: "ナイトスパイラル",
    profile: { bias: "long", mutationSteps: 5120, minComplex: 51, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8707,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 92,
    title: "フォールアウトメイズ",
    profile: { bias: "blocks", mutationSteps: 5180, minComplex: 52, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8803,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 93,
    title: "ブレイズシンギュラ",
    profile: { bias: "balanced", mutationSteps: 5240, minComplex: 52, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 8903,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 94,
    title: "シャッタードノヴァ",
    profile: { bias: "long", mutationSteps: 5300, minComplex: 53, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9001,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 95,
    title: "グラビティリーパー",
    profile: { bias: "blocks", mutationSteps: 5360, minComplex: 53, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9103,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 96,
    title: "エターナルカタストロフ",
    profile: { bias: "balanced", mutationSteps: 5420, minComplex: 54, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9203,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 97,
    title: "ディープオブリビオン",
    profile: { bias: "long", mutationSteps: 5480, minComplex: 54, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9301,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 98,
    title: "ヘルフォーク",
    profile: { bias: "blocks", mutationSteps: 5540, minComplex: 55, minBranch: 15 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9403,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 99,
    title: "ラグナロクメイズ",
    profile: { bias: "balanced", mutationSteps: 5600, minComplex: 55, minBranch: 16 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9509,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 100,
    title: "アークディザスター",
    profile: { bias: "long", mutationSteps: 5660, minComplex: 56, minBranch: 16 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9601,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 100,
    title: "クロノカラミティ",
    profile: { bias: "blocks", mutationSteps: 5720, minComplex: 56, minBranch: 16 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9703,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 100,
    title: "ブレイクヴォイド",
    profile: { bias: "balanced", mutationSteps: 5780, minComplex: 57, minBranch: 16 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9803,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 100,
    title: "ノクターンフォージ",
    profile: { bias: "long", mutationSteps: 5840, minComplex: 57, minBranch: 16 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 9901,
  },
  {
    rows: 10,
    cols: 10,
    pieceCount: 100,
    title: "セレスティアルエンド",
    profile: { bias: "blocks", mutationSteps: 5900, minComplex: 58, minBranch: 16 },
    openingRotation: "mostly-rotated",
    assistLimit: 0,
    seed: 10007,
  },
];

const PALETTE = ["#ff6b35", "#16db93", "#ffd166", "#4cc9f0", "#f72585", "#b5179e", "#7209b7", "#f77f00"];
const BUILTIN_STAGE_COUNT = STAGES.length;
const ALLOWED_BIAS = new Set(["balanced", "long", "blocks"]);
const ALLOWED_OPENING_ROTATION = new Set(["mixed", "mostly-rotated"]);

function createSeededRandom(seed) {
  let t = (seed >>> 0) || 1;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(array, random = Math.random) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createEmptyBoard(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function generateRectsOnce(rows, cols, pieceCount, profile = {}, random = Math.random) {
  let rects = [{ row: 0, col: 0, h: rows, w: cols }];
  const bias = profile.bias || "balanced";

  while (rects.length < pieceCount) {
    const candidates = rects.filter((r) => r.h >= 2 || r.w >= 2);
    if (candidates.length === 0) break;

    const target = candidates[Math.floor(random() * candidates.length)];
    const idx = rects.indexOf(target);

    const canSplitH = target.h >= 2;
    const canSplitW = target.w >= 2;

    let splitHorizontal = false;
    if (canSplitH && canSplitW) {
      if (bias === "long") {
        splitHorizontal = random() < (target.h >= target.w ? 0.72 : 0.28);
      } else {
        splitHorizontal = random() < 0.5;
      }
    } else {
      splitHorizontal = canSplitH;
    }

    if (splitHorizontal) {
      let cut;
      if (bias === "long") {
        cut = random() < 0.7 ? 1 : target.h - 1;
      } else if (bias === "blocks") {
        cut = Math.max(1, Math.min(target.h - 1, Math.round(target.h / 2)));
      } else {
        cut = 1 + Math.floor(random() * (target.h - 1));
      }
      const a = { row: target.row, col: target.col, h: cut, w: target.w };
      const b = { row: target.row + cut, col: target.col, h: target.h - cut, w: target.w };
      rects.splice(idx, 1, a, b);
    } else {
      let cut;
      if (bias === "long") {
        cut = random() < 0.7 ? 1 : target.w - 1;
      } else if (bias === "blocks") {
        cut = Math.max(1, Math.min(target.w - 1, Math.round(target.w / 2)));
      } else {
        cut = 1 + Math.floor(random() * (target.w - 1));
      }
      const a = { row: target.row, col: target.col, h: target.h, w: cut };
      const b = { row: target.row, col: target.col + cut, h: target.h, w: target.w - cut };
      rects.splice(idx, 1, a, b);
    }
  }

  return rects;
}

function cardinalNeighbors(rows, cols, row, col) {
  const out = [];
  if (row > 0) out.push({ row: row - 1, col });
  if (row + 1 < rows) out.push({ row: row + 1, col });
  if (col > 0) out.push({ row, col: col - 1 });
  if (col + 1 < cols) out.push({ row, col: col + 1 });
  return out;
}

function buildOwnerGrid(rects, rows, cols) {
  const owners = Array.from({ length: rows }, () => Array.from({ length: cols }, () => -1));
  rects.forEach((rect, pieceIndex) => {
    for (let r = rect.row; r < rect.row + rect.h; r += 1) {
      for (let c = rect.col; c < rect.col + rect.w; c += 1) {
        owners[r][c] = pieceIndex;
      }
    }
  });
  return owners;
}

function countPieceSizes(owners, pieceCount) {
  const sizes = Array.from({ length: pieceCount }, () => 0);
  owners.forEach((row) => {
    row.forEach((pieceIndex) => {
      if (pieceIndex >= 0 && pieceIndex < pieceCount) sizes[pieceIndex] += 1;
    });
  });
  return sizes;
}

function remainsConnectedAfterRemove(owners, pieceIndex, removeRow, removeCol, pieceSize) {
  if (pieceSize <= 1) return false;
  const rows = owners.length;
  const cols = owners[0]?.length || 0;
  let start = null;

  for (let r = 0; r < rows && !start; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (r === removeRow && c === removeCol) continue;
      if (owners[r][c] === pieceIndex) {
        start = { row: r, col: c };
        break;
      }
    }
  }
  if (!start) return false;

  const queue = [start];
  const visited = new Set([`${start.row}-${start.col}`]);

  while (queue.length > 0) {
    const current = queue.shift();
    cardinalNeighbors(rows, cols, current.row, current.col).forEach((next) => {
      if (next.row === removeRow && next.col === removeCol) return;
      if (owners[next.row][next.col] !== pieceIndex) return;
      const key = `${next.row}-${next.col}`;
      if (visited.has(key)) return;
      visited.add(key);
      queue.push(next);
    });
  }

  return visited.size === pieceSize - 1;
}

function mutateOwnersToShapes(owners, pieceCount, mutationSteps, random = Math.random) {
  const rows = owners.length;
  const cols = owners[0]?.length || 0;
  const sizes = countPieceSizes(owners, pieceCount);

  for (let i = 0; i < mutationSteps; i += 1) {
    const row = Math.floor(random() * rows);
    const col = Math.floor(random() * cols);
    const donor = owners[row][col];
    const targets = cardinalNeighbors(rows, cols, row, col)
      .map((p) => owners[p.row][p.col])
      .filter((pieceIndex) => pieceIndex !== donor);

    if (targets.length === 0) continue;

    const target = targets[Math.floor(random() * targets.length)];
    if (sizes[donor] <= 2) continue;
    if (!remainsConnectedAfterRemove(owners, donor, row, col, sizes[donor])) continue;

    owners[row][col] = target;
    sizes[donor] -= 1;
    sizes[target] += 1;
  }
}

function collectPieceShapes(owners, pieceCount) {
  const byPiece = Array.from({ length: pieceCount }, () => []);

  for (let r = 0; r < owners.length; r += 1) {
    for (let c = 0; c < owners[r].length; c += 1) {
      const pieceIndex = owners[r][c];
      if (pieceIndex >= 0 && pieceIndex < pieceCount) {
        byPiece[pieceIndex].push({ row: r, col: c });
      }
    }
  }

  return byPiece.map((cells) => {
    const minRow = Math.min(...cells.map((p) => p.row));
    const maxRow = Math.max(...cells.map((p) => p.row));
    const minCol = Math.min(...cells.map((p) => p.col));
    const maxCol = Math.max(...cells.map((p) => p.col));
    const baseH = maxRow - minRow + 1;
    const baseW = maxCol - minCol + 1;
    const baseCells = cells.map((p) => ({ row: p.row - minRow, col: p.col - minCol }));
    return {
      baseH,
      baseW,
      baseCells,
      area: baseCells.length,
      isComplex: baseCells.length < baseH * baseW,
      hasBranch: false,
    };
  });
}

function enrichShapeStats(shapes) {
  shapes.forEach((shape) => {
    const set = new Set(shape.baseCells.map((cell) => `${cell.row}-${cell.col}`));
    shape.hasBranch = shape.baseCells.some((cell) => {
      let degree = 0;
      if (set.has(`${cell.row - 1}-${cell.col}`)) degree += 1;
      if (set.has(`${cell.row + 1}-${cell.col}`)) degree += 1;
      if (set.has(`${cell.row}-${cell.col - 1}`)) degree += 1;
      if (set.has(`${cell.row}-${cell.col + 1}`)) degree += 1;
      return degree >= 3;
    });
  });
}

function profileSatisfied(shapes, profile = {}) {
  const minComplex = profile.minComplex ?? 0;
  const minBranch = profile.minBranch ?? 0;
  const complexCount = shapes.filter((shape) => shape.isComplex).length;
  const branchCount = shapes.filter((shape) => shape.hasBranch).length;
  return complexCount >= minComplex && branchCount >= minBranch;
}

function generateShapes(rows, cols, pieceCount, profile = {}, random = Math.random) {
  let fallback = null;
  const mutationSteps = profile.mutationSteps ?? rows * cols * 4;

  for (let i = 0; i < 140; i += 1) {
    const rects = generateRectsOnce(rows, cols, pieceCount, profile, random);
    const owners = buildOwnerGrid(rects, rows, cols);
    mutateOwnersToShapes(owners, pieceCount, mutationSteps, random);
    const shapes = collectPieceShapes(owners, pieceCount);
    enrichShapeStats(shapes);
    fallback = shapes;
    if (profileSatisfied(shapes, profile)) return shapes;
  }

  return fallback;
}

export function initFitPuzzle(options = {}) {
  const ASSIST_PER_STAGE = 1;
  const DRAG_GHOST_UNIT = 14;
  const DRAG_GHOST_GAP = 2;
  const DRAG_GHOST_PADDING = 6;

  const boardEl = document.getElementById("fitPuzzleBoard");
  const piecesEl = document.getElementById("fitPuzzlePieces");
  const boardTextEl = document.getElementById("fitPuzzleBoardText");
  const placedTextEl = document.getElementById("fitPuzzlePlacedText");
  const scoreTextEl = document.getElementById("fitPuzzleScoreText");
  const timeTextEl = document.getElementById("fitPuzzleTimeText");
  const difficultySelect = document.getElementById("fitPuzzleDifficultySelect");
  const stageSelect = document.getElementById("fitPuzzleStageSelect");
  const stageCurrentTextEl = document.getElementById("fitPuzzleStageCurrentText");
  const stageScreenBtn = document.getElementById("fitPuzzleStageScreenBtn");
  const stageModalEl = document.getElementById("fitPuzzleStageModal");
  const stageModalGridEl = document.getElementById("fitPuzzleStageGrid");
  const stageModalCloseBtn = document.getElementById("fitPuzzleStageModalCloseBtn");
  const messageEl = document.getElementById("fitPuzzleMessage");
  const startBtn = document.getElementById("fitPuzzleStartBtn");
  const nextBtn = document.getElementById("fitPuzzleNextBtn");
  const rotateBtn = document.getElementById("fitPuzzleRotateBtn");
  const noRotateBtn = document.getElementById("fitPuzzleNoRotateBtn");
  const assistBtn = document.getElementById("fitPuzzleAssistBtn");
  const resetBtn = document.getElementById("fitPuzzleResetBtn");
  const menuBtn = document.getElementById("fitPuzzleMenuBtn");
  const stageBuilderTitleInput = document.getElementById("fitStageBuilderTitleInput");
  const stageBuilderRowsInput = document.getElementById("fitStageBuilderRowsInput");
  const stageBuilderColsInput = document.getElementById("fitStageBuilderColsInput");
  const stageBuilderPiecesInput = document.getElementById("fitStageBuilderPiecesInput");
  const stageBuilderBiasSelect = document.getElementById("fitStageBuilderBiasSelect");
  const stageBuilderMutationInput = document.getElementById("fitStageBuilderMutationInput");
  const stageBuilderComplexInput = document.getElementById("fitStageBuilderComplexInput");
  const stageBuilderBranchInput = document.getElementById("fitStageBuilderBranchInput");
  const stageBuilderRotationSelect = document.getElementById("fitStageBuilderRotationSelect");
  const stageBuilderAssistInput = document.getElementById("fitStageBuilderAssistInput");
  const stageBuilderSeedInput = document.getElementById("fitStageBuilderSeedInput");
  const stageBuilderUseCurrentBtn = document.getElementById("fitStageBuilderUseCurrentBtn");
  const stageBuilderAddBtn = document.getElementById("fitStageBuilderAddBtn");
  const stageBuilderMessageEl = document.getElementById("fitStageBuilderMessage");
  const i18nLang = () => (document.documentElement.getAttribute("lang") || "ja").toLowerCase();
  const t = (ja, ko) => (i18nLang().startsWith("ko") ? ko : ja);

  let timerId = null;

  const state = {
    board: createEmptyBoard(STAGES[0].rows, STAGES[0].cols),
    pieces: [],
    selectedId: null,
    started: false,
    cleared: false,
    stageIndex: 0,
    rows: STAGES[0].rows,
    cols: STAGES[0].cols,
    stageTitle: STAGES[0].title,
    assistRemaining: ASSIST_PER_STAGE,
    assistUsedCount: 0,
    moveCount: 0,
    failCount: 0,
    elapsedSec: 0,
    stageStartAt: 0,
    totalScore: 0,
    hintKeys: new Set(),
    dragPreviewKeys: new Set(),
    dragPreviewValid: false,
    pointerDrag: null,
    clickCarry: null,
    clickCarryRafId: 0,
    cursorClientX: window.innerWidth / 2,
    cursorClientY: window.innerHeight / 2,
    suppressClickUntil: 0,
    noRotateMode: false,
    difficulty: "normal",
    highestUnlockedStage: 0,
    selectedStageIndex: 0,
    stageModalOpen: false,
    gameMode: "local",
    roomRole: null,
    roomLocked: false,
    roomLockMessage: "",
  };

  const DIFFICULTY_PRESETS = {
    easy: {
      pieceDelta: -1,
      mutationScale: 0.6,
      complexDelta: -1,
      branchDelta: -1,
      assistDelta: 1,
    },
    normal: {
      pieceDelta: 0,
      mutationScale: 1,
      complexDelta: 0,
      branchDelta: 0,
      assistDelta: 0,
    },
    hard: {
      pieceDelta: 2,
      mutationScale: 1.45,
      complexDelta: 2,
      branchDelta: 1,
      assistDelta: -1,
    },
  };

  function currentDifficultyPreset() {
    return DIFFICULTY_PRESETS[state.difficulty] || DIFFICULTY_PRESETS.normal;
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isRoomHost() {
    return isRoomMode() && state.roomRole === "host";
  }

  function canLocalControl() {
    if (state.roomLocked) return false;
    if (!isRoomMode()) return true;
    return state.roomRole === "host";
  }

  function composeRoomSnapshot() {
    return {
      board: state.board.map((row) => [...row]),
      pieces: state.pieces.map((piece) => ({
        ...piece,
        baseCells: piece.baseCells.map((cell) => ({ ...cell })),
      })),
      selectedId: state.selectedId,
      started: state.started,
      cleared: state.cleared,
      stageIndex: state.stageIndex,
      rows: state.rows,
      cols: state.cols,
      stageTitle: state.stageTitle,
      assistRemaining: state.assistRemaining,
      assistUsedCount: state.assistUsedCount,
      moveCount: state.moveCount,
      failCount: state.failCount,
      elapsedSec: state.elapsedSec,
      stageStartAt: state.stageStartAt,
      totalScore: state.totalScore,
      noRotateMode: state.noRotateMode,
      difficulty: state.difficulty,
      highestUnlockedStage: state.highestUnlockedStage,
      selectedStageIndex: state.selectedStageIndex,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      message: messageEl?.textContent || "",
    };
  }

  function applyRoomSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    stopTimer();
    clearClickCarry();
    clearDragPreview();
    clearHints();
    state.pointerDrag = null;

    if (Array.isArray(snapshot.board)) {
      state.board = snapshot.board.map((row) => (Array.isArray(row) ? [...row] : []));
    }
    if (Array.isArray(snapshot.pieces)) {
      state.pieces = snapshot.pieces.map((piece) => ({
        ...piece,
        baseCells: Array.isArray(piece.baseCells)
          ? piece.baseCells.map((cell) => ({ row: Number(cell.row) || 0, col: Number(cell.col) || 0 }))
          : [],
      }));
    }
    state.selectedId = typeof snapshot.selectedId === "string" ? snapshot.selectedId : null;
    state.started = Boolean(snapshot.started);
    state.cleared = Boolean(snapshot.cleared);
    state.stageIndex = Number.isFinite(snapshot.stageIndex) ? Math.max(0, Math.floor(snapshot.stageIndex)) : state.stageIndex;
    state.rows = Number.isFinite(snapshot.rows) ? Math.max(1, Math.floor(snapshot.rows)) : state.rows;
    state.cols = Number.isFinite(snapshot.cols) ? Math.max(1, Math.floor(snapshot.cols)) : state.cols;
    state.stageTitle = typeof snapshot.stageTitle === "string" ? snapshot.stageTitle : state.stageTitle;
    state.assistRemaining = Number.isFinite(snapshot.assistRemaining) ? Math.max(0, Math.floor(snapshot.assistRemaining)) : state.assistRemaining;
    state.assistUsedCount = Number.isFinite(snapshot.assistUsedCount) ? Math.max(0, Math.floor(snapshot.assistUsedCount)) : state.assistUsedCount;
    state.moveCount = Number.isFinite(snapshot.moveCount) ? Math.max(0, Math.floor(snapshot.moveCount)) : state.moveCount;
    state.failCount = Number.isFinite(snapshot.failCount) ? Math.max(0, Math.floor(snapshot.failCount)) : state.failCount;
    state.elapsedSec = Number.isFinite(snapshot.elapsedSec) ? Math.max(0, Math.floor(snapshot.elapsedSec)) : state.elapsedSec;
    state.stageStartAt = Number.isFinite(snapshot.stageStartAt) ? snapshot.stageStartAt : state.stageStartAt;
    state.totalScore = Number.isFinite(snapshot.totalScore) ? Math.max(0, Math.floor(snapshot.totalScore)) : state.totalScore;
    state.noRotateMode = Boolean(snapshot.noRotateMode);
    state.difficulty = snapshot.difficulty === "easy" || snapshot.difficulty === "hard" ? snapshot.difficulty : "normal";
    state.highestUnlockedStage = Number.isFinite(snapshot.highestUnlockedStage)
      ? Math.max(0, Math.floor(snapshot.highestUnlockedStage))
      : state.highestUnlockedStage;
    state.selectedStageIndex = Number.isFinite(snapshot.selectedStageIndex)
      ? Math.max(0, Math.floor(snapshot.selectedStageIndex))
      : state.selectedStageIndex;
    state.roomLocked = Boolean(snapshot.roomLocked);
    state.roomLockMessage = typeof snapshot.roomLockMessage === "string" ? snapshot.roomLockMessage : "";
    if (messageEl && typeof snapshot.message === "string") {
      messageEl.textContent = snapshot.message;
    }

    if (state.started && !state.cleared && !state.roomLocked) {
      startTimer();
    }
    render();
  }

  function emitRoomSnapshot() {
    if (!isRoomHost()) return;
    options.onRoomSnapshot?.();
  }

  function parseInteger(raw, fallback = 0) {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.floor(n) : fallback;
  }

  function nextStageSeed() {
    let maxSeed = 0;
    STAGES.forEach((stage) => {
      const seed = parseInteger(stage?.seed, 0);
      if (seed > maxSeed) maxSeed = seed;
    });
    return Math.max(1, maxSeed + 101);
  }

  function stageToSerializable(stage, idx = STAGES.length) {
    const rows = Math.max(4, Math.min(12, parseInteger(stage?.rows, 10)));
    const cols = Math.max(4, Math.min(12, parseInteger(stage?.cols, 10)));
    const maxCells = rows * cols;
    const pieceCount = Math.max(2, Math.min(maxCells, parseInteger(stage?.pieceCount, Math.max(2, Math.floor(maxCells / 2)))));
    const bias = ALLOWED_BIAS.has(stage?.profile?.bias) ? stage.profile.bias : "balanced";
    const mutationSteps = Math.max(0, Math.min(20000, parseInteger(stage?.profile?.mutationSteps, rows * cols * 6)));
    const minComplex = Math.max(0, Math.min(200, parseInteger(stage?.profile?.minComplex, 0)));
    const minBranch = Math.max(0, Math.min(200, parseInteger(stage?.profile?.minBranch, 0)));
    const openingRotation = ALLOWED_OPENING_ROTATION.has(stage?.openingRotation) ? stage.openingRotation : "mixed";
    const assistLimit = Math.max(0, Math.min(10, parseInteger(stage?.assistLimit, 0)));
    const seed = Math.max(1, parseInteger(stage?.seed, nextStageSeed() + idx));
    const title = String(stage?.title || `カスタム-${idx + 1}`).trim().slice(0, 40) || `カスタム-${idx + 1}`;
    return {
      rows,
      cols,
      pieceCount,
      title,
      profile: {
        bias,
        mutationSteps,
        minComplex,
        minBranch,
      },
      openingRotation,
      assistLimit,
      seed,
    };
  }

  function customStagesSnapshot() {
    return STAGES.slice(BUILTIN_STAGE_COUNT).map((stage, idx) => stageToSerializable(stage, BUILTIN_STAGE_COUNT + idx));
  }

  function rebuildCustomStages(customStages) {
    STAGES.splice(BUILTIN_STAGE_COUNT);
    customStages.forEach((stage, idx) => {
      STAGES.push(stageToSerializable(stage, BUILTIN_STAGE_COUNT + idx));
    });
  }

  function reflectStageInBuilder(stage) {
    if (!stage) return;
    if (stageBuilderTitleInput) stageBuilderTitleInput.value = stage.title || "";
    if (stageBuilderRowsInput) stageBuilderRowsInput.value = String(stage.rows);
    if (stageBuilderColsInput) stageBuilderColsInput.value = String(stage.cols);
    if (stageBuilderPiecesInput) stageBuilderPiecesInput.value = String(stage.pieceCount);
    if (stageBuilderBiasSelect) stageBuilderBiasSelect.value = stage.profile?.bias || "balanced";
    if (stageBuilderMutationInput) stageBuilderMutationInput.value = String(stage.profile?.mutationSteps ?? stage.rows * stage.cols * 6);
    if (stageBuilderComplexInput) stageBuilderComplexInput.value = String(stage.profile?.minComplex ?? 0);
    if (stageBuilderBranchInput) stageBuilderBranchInput.value = String(stage.profile?.minBranch ?? 0);
    if (stageBuilderRotationSelect) stageBuilderRotationSelect.value = stage.openingRotation || "mixed";
    if (stageBuilderAssistInput) stageBuilderAssistInput.value = String(stage.assistLimit ?? 0);
    if (stageBuilderSeedInput) stageBuilderSeedInput.value = String(Math.max(1, parseInteger(stage.seed, nextStageSeed())));
  }

  function readStageBuilderInput() {
    const rows = Math.max(4, Math.min(12, parseInteger(stageBuilderRowsInput?.value, 10)));
    const cols = Math.max(4, Math.min(12, parseInteger(stageBuilderColsInput?.value, 10)));
    const maxCells = rows * cols;
    const pieceCount = Math.max(2, Math.min(maxCells, parseInteger(stageBuilderPiecesInput?.value, Math.max(2, Math.floor(maxCells / 2)))));
    const bias = ALLOWED_BIAS.has(stageBuilderBiasSelect?.value) ? stageBuilderBiasSelect.value : "balanced";
    const mutationSteps = Math.max(0, Math.min(20000, parseInteger(stageBuilderMutationInput?.value, rows * cols * 6)));
    const minComplex = Math.max(0, Math.min(200, parseInteger(stageBuilderComplexInput?.value, 0)));
    const minBranch = Math.max(0, Math.min(200, parseInteger(stageBuilderBranchInput?.value, 0)));
    const openingRotation = ALLOWED_OPENING_ROTATION.has(stageBuilderRotationSelect?.value) ? stageBuilderRotationSelect.value : "mixed";
    const assistLimit = Math.max(0, Math.min(10, parseInteger(stageBuilderAssistInput?.value, 0)));
    const seed = Math.max(1, parseInteger(stageBuilderSeedInput?.value, nextStageSeed()));
    const title = String(stageBuilderTitleInput?.value || `カスタム-${STAGES.length + 1}`).trim().slice(0, 40) || `カスタム-${STAGES.length + 1}`;
    return {
      rows,
      cols,
      pieceCount,
      title,
      profile: {
        bias,
        mutationSteps,
        minComplex,
        minBranch,
      },
      openingRotation,
      assistLimit,
      seed,
    };
  }

  function clampStageIndex(index) {
    const n = Number(index);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(STAGES.length - 1, Math.floor(n)));
  }

  function normalizeProgress(raw) {
    const fallback = {
      highestUnlockedStage: 0,
      selectedStageIndex: 0,
      difficulty: "normal",
      noRotateMode: false,
      customStages: [],
      updatedAt: null,
    };

    if (!raw || typeof raw !== "object") return fallback;
    const difficulty = raw.difficulty === "easy" || raw.difficulty === "normal" || raw.difficulty === "hard" ? raw.difficulty : "normal";
    const customStages = Array.isArray(raw.customStages) ? raw.customStages.map((stage, idx) => stageToSerializable(stage, BUILTIN_STAGE_COUNT + idx)) : [];
    rebuildCustomStages(customStages);
    const highestUnlockedStage = clampStageIndex(raw.highestUnlockedStage);
    const selectedStageIndex = Math.min(highestUnlockedStage, clampStageIndex(raw.selectedStageIndex));
    const updatedAt = typeof raw.updatedAt === "string" && raw.updatedAt.trim() ? raw.updatedAt.trim() : null;
    return {
      highestUnlockedStage,
      selectedStageIndex,
      difficulty,
      noRotateMode: Boolean(raw.noRotateMode),
      customStages,
      updatedAt,
    };
  }

  function currentProgressSnapshot() {
    return {
      highestUnlockedStage: clampStageIndex(state.highestUnlockedStage),
      selectedStageIndex: Math.min(clampStageIndex(state.highestUnlockedStage), clampStageIndex(state.selectedStageIndex)),
      difficulty: state.difficulty,
      noRotateMode: state.noRotateMode,
      customStages: customStagesSnapshot(),
      updatedAt: new Date().toISOString(),
    };
  }

  function saveProgress() {
    if (typeof options.onFitPuzzleProgressSave !== "function") return;
    options.onFitPuzzleProgressSave(currentProgressSnapshot());
  }

  function applyProgress(rawProgress) {
    const progress = normalizeProgress(rawProgress);
    rebuildCustomStages(progress.customStages || []);
    state.highestUnlockedStage = progress.highestUnlockedStage;
    state.selectedStageIndex = progress.selectedStageIndex;
    state.difficulty = progress.difficulty;
    state.noRotateMode = progress.noRotateMode;
    if (!state.started) {
      const stage = STAGES[state.selectedStageIndex] || STAGES[0];
      state.stageIndex = state.selectedStageIndex;
      state.rows = stage.rows;
      state.cols = stage.cols;
      state.stageTitle = stage.title;
      state.board = createEmptyBoard(stage.rows, stage.cols);
      state.pieces = [];
      state.selectedId = null;
    }
  }

  function stageForDifficulty(baseStage) {
    const preset = currentDifficultyPreset();
    const maxCells = baseStage.rows * baseStage.cols;
    const pieceCount = Math.max(2, Math.min(maxCells, baseStage.pieceCount + preset.pieceDelta));
    return {
      ...baseStage,
      pieceCount,
      profile: {
        ...baseStage.profile,
        mutationSteps: Math.max(0, Math.round((baseStage.profile?.mutationSteps ?? 0) * preset.mutationScale)),
        minComplex: Math.max(0, (baseStage.profile?.minComplex ?? 0) + preset.complexDelta),
        minBranch: Math.max(0, (baseStage.profile?.minBranch ?? 0) + preset.branchDelta),
      },
      assistLimit: ASSIST_PER_STAGE,
    };
  }

  if (assistBtn) {
    assistBtn.dataset.baseLabel = (assistBtn.textContent || "ASSIST").replace(/\sx\d+$/i, "").trim() || "ASSIST";
  }
  if (noRotateBtn) {
    noRotateBtn.dataset.baseLabel = (noRotateBtn.textContent || "NO ROTATION").replace(/\s+(ON|OFF)$/i, "").trim() || "NO ROTATION";
  }

  function pieceShape(piece) {
    const rot = ((piece.rot % 4) + 4) % 4;
    const h = piece.baseH;
    const w = piece.baseW;

    if (rot === 0) {
      return { h, w, cells: piece.baseCells };
    }

    if (rot === 1) {
      return {
        h: w,
        w: h,
        cells: piece.baseCells.map((cell) => ({ row: cell.col, col: h - 1 - cell.row })),
      };
    }

    if (rot === 2) {
      return {
        h,
        w,
        cells: piece.baseCells.map((cell) => ({ row: h - 1 - cell.row, col: w - 1 - cell.col })),
      };
    }

    return {
      h: w,
      w: h,
      cells: piece.baseCells.map((cell) => ({ row: w - 1 - cell.col, col: cell.row })),
    };
  }

  function placedCount() {
    return state.pieces.filter((p) => p.placed).length;
  }

  function updateHud() {
    boardTextEl.textContent = `${t("ステージ", "스테이지")} ${state.stageIndex + 1} / ${STAGES.length} ${state.stageTitle} (${state.rows} x ${state.cols})`;
    placedTextEl.textContent = `${placedCount()} / ${state.pieces.length}`;
    if (scoreTextEl) scoreTextEl.textContent = String(state.totalScore).padStart(4, "0");
    if (timeTextEl) timeTextEl.textContent = formatTime(state.elapsedSec);
    if (assistBtn) {
      const baseLabel = (assistBtn.textContent || assistBtn.dataset.baseLabel || t("アシスト", "도움")).replace(/\sx\d+$/i, "").trim() || t("アシスト", "도움");
      assistBtn.dataset.baseLabel = baseLabel;
      const remaining = Math.max(0, state.assistRemaining);
      assistBtn.textContent = `${baseLabel} x${remaining}`;
      assistBtn.disabled = state.roomLocked || !state.started || state.assistRemaining <= 0;
    }
    if (startBtn) startBtn.disabled = state.roomLocked;
    if (nextBtn) {
      nextBtn.disabled = state.roomLocked || !state.started || !state.cleared;
    }
    if (rotateBtn) {
      rotateBtn.disabled = state.roomLocked || !state.started || state.noRotateMode;
    }
    if (resetBtn) resetBtn.disabled = state.roomLocked || !state.started;
    if (noRotateBtn) noRotateBtn.disabled = state.roomLocked;
    if (noRotateBtn) {
      const baseLabel = (noRotateBtn.textContent || noRotateBtn.dataset.baseLabel || t("回転なし", "회전 없음")).replace(/\s+(ON|OFF)$/i, "").trim() || t("回転なし", "회전 없음");
      noRotateBtn.dataset.baseLabel = baseLabel;
      noRotateBtn.textContent = `${baseLabel} ${state.noRotateMode ? t("ON", "켬") : t("OFF", "끔")}`;
    }
    if (difficultySelect) {
      difficultySelect.value = state.difficulty;
      difficultySelect.disabled = state.roomLocked || (state.started && !state.cleared);
    }
    if (stageSelect) {
      const maxUnlocked = clampStageIndex(state.highestUnlockedStage);
      stageSelect.innerHTML = "";
      for (let i = 0; i <= maxUnlocked; i += 1) {
        const stage = STAGES[i] || STAGES[0];
        const option = document.createElement("option");
        option.value = String(i);
        option.textContent = `${t("ステージ", "스테이지")} ${i + 1}: ${stage.title}`;
        stageSelect.appendChild(option);
      }
      const selected = Math.min(maxUnlocked, clampStageIndex(state.selectedStageIndex));
      state.selectedStageIndex = selected;
      stageSelect.value = String(selected);
      stageSelect.disabled = state.roomLocked || (state.started && !state.cleared);
    }
    if (stageCurrentTextEl) {
      const selectedStage = STAGES[state.selectedStageIndex] || STAGES[0];
      stageCurrentTextEl.textContent = `${t("ステージ", "스테이지")} ${state.selectedStageIndex + 1}: ${selectedStage.title}`;
    }
    if (stageScreenBtn) {
      stageScreenBtn.disabled = state.roomLocked || (state.started && !state.cleared);
    }
    if (state.stageModalOpen) {
      renderStageSelectionModal();
    }
  }

  function selectStageIndex(nextIndex, source = "direct") {
    if (isRoomMode() && !isRoomHost()) return;
    const next = Math.min(clampStageIndex(state.highestUnlockedStage), clampStageIndex(nextIndex));
    state.selectedStageIndex = next;
    const selectedStage = STAGES[next] || STAGES[STAGES.length - 1] || STAGES[0];
    reflectStageInBuilder(selectedStage);
    if (source === "modal") {
      messageEl.textContent = t(`ステージ ${next + 1} を選択しました（選択画面）`, `스테이지 ${next + 1}을(를) 선택했습니다 (선택 화면)`);
    } else {
      messageEl.textContent = t(`ステージ ${next + 1} を選択しました`, `스테이지 ${next + 1}을(를) 선택했습니다`);
    }
    saveProgress();
    render();
    emitRoomSnapshot();
  }

  function closeStageSelectionModal() {
    state.stageModalOpen = false;
    stageModalEl?.classList.add("hidden");
  }

  function renderStageSelectionModal() {
    if (!stageModalGridEl) return;
    const highest = clampStageIndex(state.highestUnlockedStage);
    stageModalGridEl.innerHTML = "";
    for (let i = 0; i < STAGES.length; i += 1) {
      const stage = STAGES[i] || STAGES[0];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "fit-stage-card";
      const locked = i > highest;
      if (locked) card.classList.add("is-locked");
      if (i === state.selectedStageIndex) card.classList.add("is-selected");
      card.disabled = locked;
      const indexEl = document.createElement("div");
      indexEl.className = "fit-stage-card-index";
      indexEl.textContent = `${t("ステージ", "스테이지")} ${i + 1}`;
      const titleEl = document.createElement("div");
      titleEl.className = "fit-stage-card-title";
      titleEl.textContent = stage.title;
      const metaEl = document.createElement("div");
      metaEl.className = "fit-stage-card-meta";
      metaEl.textContent = t(`${stage.rows} x ${stage.cols} / ${stage.pieceCount} ピース`, `${stage.rows} x ${stage.cols} / ${stage.pieceCount} 조각`);
      card.append(indexEl, titleEl, metaEl);
      card.addEventListener("click", () => {
        selectStageIndex(i, "modal");
        closeStageSelectionModal();
      });
      stageModalGridEl.appendChild(card);
    }
  }

  function openStageSelectionModal() {
    if (!canLocalControl()) return;
    if (state.started && !state.cleared) {
      messageEl.textContent = "進行中はステージ変更できません";
      render();
      return;
    }
    state.stageModalOpen = true;
    renderStageSelectionModal();
    stageModalEl?.classList.remove("hidden");
  }

  function handleStageModalKeydown(event) {
    if (!state.stageModalOpen) return;
    if (event.key !== "Escape") return;
    closeStageSelectionModal();
  }

  function addStageFromBuilder() {
    if (isRoomMode() && !isRoomHost()) return;
    const stage = readStageBuilderInput();
    STAGES.push(stageToSerializable(stage, STAGES.length));
    state.highestUnlockedStage = STAGES.length - 1;
    state.selectedStageIndex = state.highestUnlockedStage;
    if (!state.started) {
      const selectedStage = STAGES[state.selectedStageIndex];
      state.stageIndex = state.selectedStageIndex;
      state.rows = selectedStage.rows;
      state.cols = selectedStage.cols;
      state.stageTitle = selectedStage.title;
      state.board = createEmptyBoard(state.rows, state.cols);
      state.pieces = [];
      state.selectedId = null;
    }
    if (stageBuilderMessageEl) {
      stageBuilderMessageEl.textContent = `ステージ ${STAGES.length} を追加しました`;
    }
    if (stageBuilderSeedInput) {
      stageBuilderSeedInput.value = String(nextStageSeed());
    }
    saveProgress();
    render();
    emitRoomSnapshot();
  }

  function clearHints() {
    state.hintKeys.clear();
  }

  function clearClickCarry() {
    if (state.clickCarry?.ghostEl) {
      state.clickCarry.ghostEl.remove();
    }
    state.clickCarry = null;
    if (state.clickCarryRafId) {
      cancelAnimationFrame(state.clickCarryRafId);
      state.clickCarryRafId = 0;
    }
    clearDragPreview();
  }

  function updateCursorPoint(clientX, clientY) {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    state.cursorClientX = clientX;
    state.cursorClientY = clientY;
  }

  function tickClickCarry() {
    if (!state.clickCarry) {
      state.clickCarryRafId = 0;
      return;
    }
    updateClickCarryPosition(state.cursorClientX, state.cursorClientY);
    updateClickCarryPreview(state.cursorClientX, state.cursorClientY);
    state.clickCarryRafId = requestAnimationFrame(tickClickCarry);
  }

  function startClickCarry(pieceId, anchorRow = 0, anchorCol = 0, clientX = null, clientY = null) {
    const piece = getPieceById(pieceId);
    if (!piece) return;
    if (state.clickCarry?.pieceId !== piece.id) {
      clearClickCarry();
    }
    state.selectedId = piece.id;
    const ghostEl = createDragGhost(piece.id);
    if (ghostEl) ghostEl.classList.add("click-carry");
    state.clickCarry = {
      pieceId: piece.id,
      anchorRow,
      anchorCol,
      ghostEl,
      grabOffsetX: DRAG_GHOST_PADDING + anchorCol * (DRAG_GHOST_UNIT + DRAG_GHOST_GAP) + DRAG_GHOST_UNIT / 2,
      grabOffsetY: DRAG_GHOST_PADDING + anchorRow * (DRAG_GHOST_UNIT + DRAG_GHOST_GAP) + DRAG_GHOST_UNIT / 2,
    };
    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      updateCursorPoint(clientX, clientY);
      updateClickCarryPosition(clientX, clientY);
      updateClickCarryPreview(clientX, clientY);
    }
    if (!state.clickCarryRafId) {
      state.clickCarryRafId = requestAnimationFrame(tickClickCarry);
    }
    clearHints();
    messageEl.textContent = "クリックでピースを掴みました。置きたいマスをクリックしてください";
    render();
  }

  function resolveClientPoint(event, fallbackElement = null) {
    const eventX = Number(event?.clientX);
    const eventY = Number(event?.clientY);
    if (Number.isFinite(eventX) && Number.isFinite(eventY) && (eventX !== 0 || eventY !== 0)) {
      return { x: eventX, y: eventY };
    }

    const rectSource = fallbackElement || event?.currentTarget || event?.target;
    const rect = rectSource?.getBoundingClientRect?.();
    if (rect && Number.isFinite(rect.left) && Number.isFinite(rect.top)) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  function clearDragPreview() {
    state.dragPreviewKeys.clear();
    state.dragPreviewValid = false;
    boardEl?.querySelectorAll(".fit-cell.drop-valid, .fit-cell.drop-invalid")?.forEach((cell) => {
      cell.classList.remove("drop-valid", "drop-invalid");
    });
  }

  function canPlacePreview(piece, row, col) {
    const shape = pieceShape(piece);
    if (row < 0 || col < 0 || row + shape.h > state.rows || col + shape.w > state.cols) return false;
    for (let i = 0; i < shape.cells.length; i += 1) {
      const cell = shape.cells[i];
      const rr = row + cell.row;
      const cc = col + cell.col;
      const occupant = state.board[rr][cc];
      if (occupant !== null && occupant !== piece.id) return false;
    }
    return true;
  }

  function applyDragPreviewToBoard() {
    boardEl?.querySelectorAll(".fit-cell.drop-valid, .fit-cell.drop-invalid")?.forEach((cell) => {
      cell.classList.remove("drop-valid", "drop-invalid");
    });
    if (state.dragPreviewKeys.size === 0) return;
    const className = state.dragPreviewValid ? "drop-valid" : "drop-invalid";
    state.dragPreviewKeys.forEach((key) => {
      const [row, col] = key.split("-");
      const target = boardEl?.querySelector(`.fit-cell[data-row='${row}'][data-col='${col}']`);
      if (target) target.classList.add(className);
    });
  }

  function updatePlacementPreview(pieceId, anchorRow, anchorCol, clientX, clientY) {
    const piece = getPieceById(pieceId);
    if (!piece) {
      clearDragPreview();
      return;
    }

    const target = document.elementFromPoint(clientX, clientY);
    const boardCell = target?.closest?.(".fit-cell");
    if (!boardCell) {
      clearDragPreview();
      return;
    }

    const row = Number(boardCell.dataset.row);
    const col = Number(boardCell.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      clearDragPreview();
      return;
    }

    const dropRow = row - (anchorRow ?? 0);
    const dropCol = col - (anchorCol ?? 0);

    const shape = pieceShape(piece);
    const keys = new Set();
    shape.cells.forEach((cell) => {
      keys.add(`${dropRow + cell.row}-${dropCol + cell.col}`);
    });
    state.dragPreviewKeys = keys;
    state.dragPreviewValid = canPlacePreview(piece, dropRow, dropCol);
    applyDragPreviewToBoard();
  }

  function updateDragPreview(clientX, clientY) {
    const drag = state.pointerDrag;
    if (!drag) return;
    updatePlacementPreview(drag.pieceId, drag.anchorRow, drag.anchorCol, clientX, clientY);
  }

  function destroyDragGhost() {
    if (!state.pointerDrag?.ghostEl) return;
    state.pointerDrag.ghostEl.remove();
    state.pointerDrag.ghostEl = null;
  }

  function createDragGhost(pieceId) {
    const piece = getPieceById(pieceId);
    if (!piece) return null;
    const shape = pieceShape(piece);
    const ghost = document.createElement("div");
    ghost.className = "fit-drag-ghost";
    ghost.style.setProperty("--piece-h", String(shape.h));
    ghost.style.setProperty("--piece-w", String(shape.w));
    ghost.style.setProperty("--piece-color", piece.color);
    shape.cells.forEach((cell) => {
      const unit = document.createElement("span");
      unit.className = "fit-drag-ghost-unit";
      unit.style.gridRow = String(cell.row + 1);
      unit.style.gridColumn = String(cell.col + 1);
      ghost.appendChild(unit);
    });
    document.body.appendChild(ghost);
    return ghost;
  }

  function updateDragGhostPosition(clientX, clientY) {
    const ghost = state.pointerDrag?.ghostEl;
    if (!ghost) return;
    const offsetX = state.pointerDrag?.grabOffsetX ?? 0;
    const offsetY = state.pointerDrag?.grabOffsetY ?? 0;
    ghost.style.transform = `translate(${clientX - offsetX}px, ${clientY - offsetY}px)`;
  }

  function updateClickCarryPosition(clientX, clientY) {
    const carry = state.clickCarry;
    if (!carry?.ghostEl) return;
    const offsetX = carry.grabOffsetX ?? 0;
    const offsetY = carry.grabOffsetY ?? 0;
    carry.ghostEl.style.transform = `translate(${clientX - offsetX}px, ${clientY - offsetY}px)`;
  }

  function updateClickCarryPreview(clientX, clientY) {
    const carry = state.clickCarry;
    if (!carry) return;
    updatePlacementPreview(carry.pieceId, carry.anchorRow, carry.anchorCol, clientX, clientY);
  }

  function resolveAnchorInPiece(event, piece, shape, options = {}) {
    if (Number.isInteger(options.boardRow) && Number.isInteger(options.boardCol) && piece.placed) {
      return {
        row: options.boardRow - piece.row,
        col: options.boardCol - piece.col,
      };
    }

    const directCell = event.target?.closest?.(".fit-piece-unit");
    if (directCell?.dataset) {
      const row = Number(directCell.dataset.cellRow);
      const col = Number(directCell.dataset.cellCol);
      if (Number.isInteger(row) && Number.isInteger(col)) return { row, col };
    }

    const units = Array.from(event.currentTarget?.querySelectorAll?.(".fit-piece-unit") || []);
    if (units.length === 0) {
      const fallback = shape.cells[0] || { row: 0, col: 0 };
      return { row: fallback.row, col: fallback.col };
    }

    let nearest = null;
    let minDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      const rect = unit.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - event.clientX;
      const dy = cy - event.clientY;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        nearest = unit;
      }
    }

    const row = Number(nearest?.dataset?.cellRow);
    const col = Number(nearest?.dataset?.cellCol);
    if (Number.isInteger(row) && Number.isInteger(col)) return { row, col };

    const fallback = shape.cells[0] || { row: 0, col: 0 };
    return { row: fallback.row, col: fallback.col };
  }

  function updateElapsedFromClock() {
    if (!state.stageStartAt) return;
    state.elapsedSec = Math.max(0, Math.floor((Date.now() - state.stageStartAt) / 1000));
  }

  function stopTimer() {
    if (!timerId) return;
    clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      if (!state.started || state.cleared) return;
      updateElapsedFromClock();
      updateHud();
    }, 1000);
  }

  function rankFor(score, maxScore) {
    const ratio = maxScore <= 0 ? 0 : score / maxScore;
    if (ratio >= 0.85) return "S";
    if (ratio >= 0.7) return "A";
    if (ratio >= 0.5) return "B";
    return "C";
  }

  function completeStage() {
    updateElapsedFromClock();
    state.cleared = true;
    stopTimer();
    const stage = STAGES[state.stageIndex] || STAGES[0];
    const maxScore = stage.rows * stage.cols * 20 + stage.pieceCount * 120;
    const penalty = state.moveCount * 7 + state.failCount * 25 + state.elapsedSec * 2 + state.assistUsedCount * 140;
    const stageScore = Math.max(120, maxScore - penalty);
    state.totalScore += stageScore;
    const rank = rankFor(stageScore, maxScore);

    if (state.stageIndex + 1 < STAGES.length) {
      state.highestUnlockedStage = Math.max(state.highestUnlockedStage, state.stageIndex + 1);
      state.selectedStageIndex = Math.min(state.highestUnlockedStage, state.stageIndex + 1);
      messageEl.textContent = t(
        `ステージ ${state.stageIndex + 1} クリア! ランク ${rank} / +${stageScore}点 次ステージへ進めます`,
        `스테이지 ${state.stageIndex + 1} 클리어! 랭크 ${rank} / +${stageScore}점 다음 스테이지로 이동할 수 있습니다`,
      );
    } else {
      state.highestUnlockedStage = STAGES.length - 1;
      state.selectedStageIndex = state.highestUnlockedStage;
      messageEl.textContent = t(
        `全ステージクリア! ランク ${rank} / +${stageScore}点 合計 ${state.totalScore}点 次ステージで最初から再挑戦できます`,
        `모든 스테이지 클리어! 랭크 ${rank} / +${stageScore}점 총 ${state.totalScore}점 다음 스테이지 버튼으로 처음부터 재도전할 수 있습니다`,
      );
    }
    saveProgress();
  }

  function findPlaceablePosition(piece) {
    if (!piece || piece.placed) return null;
    const shape = pieceShape(piece);
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        if (!canPlace(shape, r, c)) continue;
        if (!assistPlacementKeepsSingleCellReachable(piece, shape, r, c)) continue;
        return { row: r, col: c };
      }
    }
    return null;
  }

  function assistPlacementKeepsSingleCellReachable(piece, shape, row, col) {
    const unplacedAfter = state.pieces.filter((p) => !p.placed && p.id !== piece.id);
    const hasSingleCellPiece = unplacedAfter.some((p) => p.baseCells.length === 1);
    if (hasSingleCellPiece) return true;

    const occupied = new Set();
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        if (state.board[r][c] !== null) occupied.add(`${r}-${c}`);
      }
    }
    shape.cells.forEach((cell) => {
      occupied.add(`${row + cell.row}-${col + cell.col}`);
    });

    const visited = new Set();
    const neighbors = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        const key = `${r}-${c}`;
        if (occupied.has(key) || visited.has(key)) continue;
        let regionSize = 0;
        const queue = [[r, c]];
        visited.add(key);
        while (queue.length > 0) {
          const [cr, cc] = queue.shift();
          regionSize += 1;
          for (let i = 0; i < neighbors.length; i += 1) {
            const [dr, dc] = neighbors[i];
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr < 0 || nc < 0 || nr >= state.rows || nc >= state.cols) continue;
            const nextKey = `${nr}-${nc}`;
            if (occupied.has(nextKey) || visited.has(nextKey)) continue;
            visited.add(nextKey);
            queue.push([nr, nc]);
          }
        }
        if (regionSize === 1) return false;
      }
    }

    return true;
  }

  function findAssistTarget() {
    const selected = getPieceById(state.selectedId);
    if (selected && !selected.placed) {
      const selectedPos = findPlaceablePosition(selected);
      if (selectedPos) {
        return { piece: selected, pos: selectedPos };
      }
    }

    for (let i = 0; i < state.pieces.length; i += 1) {
      const piece = state.pieces[i];
      if (!piece || piece.placed) continue;
      const pos = findPlaceablePosition(piece);
      if (!pos) continue;
      return { piece, pos };
    }

    return null;
  }

  function useAssist() {
    if (!canLocalControl()) return;
    if (!state.started || state.cleared) return;
    if (state.assistRemaining <= 0) {
      messageEl.textContent = t("アシストはこのステージで使用済みです", "도움은 이 스테이지에서 이미 사용했습니다");
      render();
      return;
    }

    const target = findAssistTarget();
    if (!target) {
      messageEl.textContent = "配置可能なピースがありません";
      render();
      return;
    }

    const { piece, pos } = target;
    state.selectedId = piece.id;
    clearHints();
    const shape = pieceShape(piece);
    shape.cells.forEach((cell) => {
      state.hintKeys.add(`${pos.row + cell.row}-${pos.col + cell.col}`);
    });
    state.assistRemaining -= 1;
    state.assistUsedCount += 1;
    messageEl.textContent = t(
      `アシスト: 推奨位置を表示しました (${pos.row + 1}, ${pos.col + 1})`,
      `도움: 추천 위치를 표시했습니다 (${pos.row + 1}, ${pos.col + 1})`,
    );
    render();
    emitRoomSnapshot();
  }

  function beginPointerDrag(event, pieceId, options = {}) {
    if (!canLocalControl()) return;
    if (!state.started || state.cleared) return;
    if (event.button !== 0) return;
    const piece = getPieceById(pieceId);
    if (!piece) return;
    const shape = pieceShape(piece);
    const anchor = resolveAnchorInPiece(event, piece, shape, options);
    event.preventDefault();
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    const ghostEl = createDragGhost(pieceId);
    state.pointerDrag = {
      pieceId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghostEl,
      anchorRow: anchor.row,
      anchorCol: anchor.col,
      grabOffsetX: DRAG_GHOST_PADDING + anchor.col * (DRAG_GHOST_UNIT + DRAG_GHOST_GAP) + DRAG_GHOST_UNIT / 2,
      grabOffsetY: DRAG_GHOST_PADDING + anchor.row * (DRAG_GHOST_UNIT + DRAG_GHOST_GAP) + DRAG_GHOST_UNIT / 2,
    };
  }

  function handlePointerMove(event) {
    updateCursorPoint(event.clientX, event.clientY);
    if (state.pointerDrag) {
      const dx = event.clientX - state.pointerDrag.startX;
      const dy = event.clientY - state.pointerDrag.startY;
      if (dx * dx + dy * dy >= 16) {
        state.pointerDrag.moved = true;
      }
      if (state.pointerDrag.moved) {
        updateDragGhostPosition(event.clientX, event.clientY);
        updateDragPreview(event.clientX, event.clientY);
      }
      return;
    }

    if (!state.clickCarry) return;
    updateClickCarryPosition(event.clientX, event.clientY);
    updateClickCarryPreview(event.clientX, event.clientY);
  }

  function handleMouseMove(event) {
    updateCursorPoint(event.clientX, event.clientY);
    if (state.pointerDrag) return;
    if (!state.clickCarry) return;
    updateClickCarryPosition(event.clientX, event.clientY);
    updateClickCarryPreview(event.clientX, event.clientY);
  }

  function handleTouchMove(event) {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    if (!touch) return;
    updateCursorPoint(touch.clientX, touch.clientY);
    if (!state.clickCarry) return;
    updateClickCarryPosition(touch.clientX, touch.clientY);
    updateClickCarryPreview(touch.clientX, touch.clientY);
  }

  function shouldIgnoreClick() {
    return Date.now() < state.suppressClickUntil;
  }

  function handlePointerUp(event) {
    const drag = state.pointerDrag;
    if (drag && drag.pointerId !== undefined && event.pointerId !== drag.pointerId) return;
    if (drag) {
      destroyDragGhost();
    }
    state.pointerDrag = null;
    if (!drag || !drag.moved || !state.started) return;
    clearClickCarry();
    state.suppressClickUntil = Date.now() + 180;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!target) return;

    const boardCell = target.closest?.(".fit-cell");
    if (boardCell) {
      const row = Number(boardCell.dataset.row);
      const col = Number(boardCell.dataset.col);
      if (Number.isInteger(row) && Number.isInteger(col)) {
        handlePieceDropOnBoard(drag.pieceId, row - (drag.anchorRow ?? 0), col - (drag.anchorCol ?? 0));
      }
      return;
    }

    const tray = target.closest?.("#fitPuzzlePieces");
    if (tray) {
      const piece = getPieceById(drag.pieceId);
      if (!piece) return;
      removePlacedPiece(piece);
      state.selectedId = piece.id;
      messageEl.textContent = "ピースを手元に戻しました";
      render();
      clearDragPreview();
      return;
    }

    clearDragPreview();
  }

  function handlePointerCancel(event) {
    const drag = state.pointerDrag;
    if (!drag) return;
    if (drag.pointerId !== undefined && event.pointerId !== drag.pointerId) return;
    destroyDragGhost();
    state.pointerDrag = null;
    clearDragPreview();
  }

  function handleBoardClickDrop(row, col) {
    const carry = state.clickCarry;
    if (!carry) return false;
    clearClickCarry();
    handlePieceDropOnBoard(carry.pieceId, row - (carry.anchorRow ?? 0), col - (carry.anchorCol ?? 0));
    return true;
  }

  function handlePieceDropOnBoard(pieceId, row, col) {
    if (!canLocalControl()) return;
    if (!state.started) return;
    const piece = getPieceById(pieceId);
    if (!piece) return;

    clearHints();
    const original = piece.placed ? { row: piece.row, col: piece.col } : null;
    if (piece.placed) {
      removePlacedPiece(piece);
    }

    if (placePiece(piece, row, col)) {
      state.moveCount += 1;
      state.selectedId = null;
      if (isClear()) {
        completeStage();
      } else {
        messageEl.textContent = "ドラッグで配置しました";
      }
      render();
      clearDragPreview();
      emitRoomSnapshot();
      return;
    }

    if (original) {
      placePiece(piece, original.row, original.col);
      messageEl.textContent = "そこには移動できません";
    } else {
      state.failCount += 1;
      messageEl.textContent = "ここには置けません";
    }
    render();
    clearDragPreview();
    emitRoomSnapshot();
  }

  function clearBoardOf(pieceId) {
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        if (state.board[r][c] === pieceId) state.board[r][c] = null;
      }
    }
  }

  function getPieceById(id) {
    return state.pieces.find((p) => p.id === id) || null;
  }

  function removePlacedPiece(piece) {
    if (!piece || !piece.placed) return;
    clearBoardOf(piece.id);
    piece.placed = false;
    piece.row = null;
    piece.col = null;
  }

  function canPlace(shape, row, col) {
    if (row < 0 || col < 0 || row + shape.h > state.rows || col + shape.w > state.cols) return false;
    for (let i = 0; i < shape.cells.length; i += 1) {
      const cell = shape.cells[i];
      const rr = row + cell.row;
      const cc = col + cell.col;
      if (state.board[rr][cc] !== null) return false;
    }
    return true;
  }

  function placePiece(piece, row, col) {
    const shape = pieceShape(piece);
    if (!canPlace(shape, row, col)) return false;

    shape.cells.forEach((cell) => {
      state.board[row + cell.row][col + cell.col] = piece.id;
    });

    piece.placed = true;
    piece.row = row;
    piece.col = col;
    return true;
  }

  function isClear() {
    if (!state.started) return false;
    return state.pieces.length > 0 && state.pieces.every((p) => p.placed);
  }

  function renderBoard() {
    boardEl.style.setProperty("--fit-cols", String(state.cols));
    boardEl.innerHTML = "";

    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "fit-cell";
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        const pieceId = state.board[r][c];
        if (state.hintKeys.has(`${r}-${c}`)) cell.classList.add("hint");
        if (state.dragPreviewKeys.has(`${r}-${c}`)) {
          cell.classList.add(state.dragPreviewValid ? "drop-valid" : "drop-invalid");
        }

        if (pieceId) {
          const piece = getPieceById(pieceId);
          if (piece) {
            cell.classList.add("filled");
            cell.style.setProperty("--piece-color", piece.color);
            if (state.clickCarry?.pieceId === pieceId) {
              cell.classList.add("carrying-source");
            }
          }
          cell.draggable = false;
          cell.addEventListener("pointerdown", (event) => beginPointerDrag(event, pieceId, { boardRow: r, boardCol: c }));
          cell.addEventListener("dblclick", () => {
            if (!canLocalControl()) return;
            if (!state.started) return;
            if (shouldIgnoreClick()) return;
            const existingPiece = getPieceById(pieceId);
            if (!existingPiece) return;
            removePlacedPiece(existingPiece);
            clearHints();
            state.selectedId = existingPiece.id;
            messageEl.textContent = "ダブルクリックで配置済みブロックを戻しました";
            render();
            emitRoomSnapshot();
          });
        }

        cell.addEventListener("click", (event) => {
          if (!canLocalControl()) return;
          if (!state.started) return;
          if (shouldIgnoreClick()) return;
          const point = resolveClientPoint(event, cell);

          if (handleBoardClickDrop(r, c)) return;

          if (pieceId) {
            const piece = getPieceById(pieceId);
            if (!piece) return;
            startClickCarry(piece.id, r - piece.row, c - piece.col, point.x, point.y);
            return;
          }

          const selected = getPieceById(state.selectedId);
          if (!selected || selected.placed) return;
          clearHints();

          if (placePiece(selected, r, c)) {
            state.moveCount += 1;
            state.selectedId = null;
            if (isClear()) {
              completeStage();
            } else {
              messageEl.textContent = "配置しました";
            }
          } else {
            state.failCount += 1;
            messageEl.textContent = "ここには置けません";
          }
          render();
          emitRoomSnapshot();
        });

        boardEl.appendChild(cell);
      }
    }
  }

  function renderPieces() {
    piecesEl.innerHTML = "";

    if (state.clickCarry?.pieceId) {
      const carryPiece = getPieceById(state.clickCarry.pieceId);
      if (carryPiece) {
        const carryWrap = document.createElement("div");
        carryWrap.className = "fit-carry-indicator";

        const carryLabel = document.createElement("div");
        carryLabel.className = "fit-carry-label";
        carryLabel.textContent = "保持中";

        const carryShape = pieceShape(carryPiece);
        const carryPieceEl = document.createElement("div");
        carryPieceEl.className = "fit-carry-piece";
        carryPieceEl.style.setProperty("--piece-color", carryPiece.color);
        carryPieceEl.style.setProperty("--piece-h", String(carryShape.h));
        carryPieceEl.style.setProperty("--piece-w", String(carryShape.w));
        carryShape.cells.forEach((cell) => {
          const unit = document.createElement("span");
          unit.className = "fit-piece-unit";
          unit.style.gridRow = String(cell.row + 1);
          unit.style.gridColumn = String(cell.col + 1);
          carryPieceEl.appendChild(unit);
        });

        const carryGhostEl = document.createElement("div");
        carryGhostEl.className = "fit-carry-ghost";
        carryGhostEl.style.setProperty("--piece-color", carryPiece.color);
        carryGhostEl.style.setProperty("--piece-h", String(carryShape.h));
        carryGhostEl.style.setProperty("--piece-w", String(carryShape.w));
        carryShape.cells.forEach((cell) => {
          const unit = document.createElement("span");
          unit.className = "fit-drag-ghost-unit";
          unit.style.gridRow = String(cell.row + 1);
          unit.style.gridColumn = String(cell.col + 1);
          carryGhostEl.appendChild(unit);
        });

        carryWrap.append(carryLabel, carryPieceEl, carryGhostEl);
        piecesEl.appendChild(carryWrap);
      }
    }

    state.pieces.forEach((piece) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "fit-piece";
      if (piece.placed) item.classList.add("placed");
      if (state.selectedId === piece.id) item.classList.add("selected");
      if (state.clickCarry?.pieceId === piece.id) item.classList.add("carrying");
      item.style.setProperty("--piece-color", piece.color);

      const shape = pieceShape(piece);
      item.style.setProperty("--piece-h", String(shape.h));
      item.style.setProperty("--piece-w", String(shape.w));
      item.disabled = false;
      item.draggable = false;
      item.addEventListener("pointerdown", (event) => beginPointerDrag(event, piece.id));

      shape.cells.forEach((cell) => {
        const unit = document.createElement("span");
        unit.className = "fit-piece-unit";
        unit.style.gridRow = String(cell.row + 1);
        unit.style.gridColumn = String(cell.col + 1);
        unit.dataset.cellRow = String(cell.row);
        unit.dataset.cellCol = String(cell.col);
        item.appendChild(unit);
      });

      item.addEventListener("click", (event) => {
        if (!canLocalControl()) return;
        if (!state.started) return;
        if (shouldIgnoreClick()) return;
        const point = resolveClientPoint(event, item);
        if (state.clickCarry?.pieceId === piece.id) {
          clearClickCarry();
          state.selectedId = piece.id;
          messageEl.textContent = "ピースの掴みを解除しました";
          render();
          return;
        }

        const shape = pieceShape(piece);
        const anchor = resolveAnchorInPiece(event, piece, shape);
        startClickCarry(piece.id, anchor.row, anchor.col, point.x, point.y);
      });

      piecesEl.appendChild(item);
    });

  }
  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("touchmove", handleTouchMove, { passive: true });
  document.addEventListener("pointerup", handlePointerUp);
  document.addEventListener("pointercancel", handlePointerCancel);

  function render() {
    updateHud();
    renderBoard();
    renderPieces();
  }

  function newPuzzle(stageIndex = state.stageIndex) {
    const clampedStageIndex = Math.max(0, Math.min(stageIndex, STAGES.length - 1));
    const stage = stageForDifficulty(STAGES[clampedStageIndex]);
    const difficultySeedOffset = { easy: 11, normal: 37, hard: 73 };
    const baseSeed = (stage.seed ?? clampedStageIndex + 1) + (difficultySeedOffset[state.difficulty] ?? 37);
    const stageRandom = createSeededRandom(baseSeed + (state.noRotateMode ? 1009 : 0));
    const solutionShapes = generateShapes(stage.rows, stage.cols, stage.pieceCount, stage.profile, stageRandom);
    const pieces = solutionShapes.map((shape, idx) => ({
      id: `piece-${idx + 1}`,
      baseH: shape.baseH,
      baseW: shape.baseW,
      baseCells: shape.baseCells,
      rot:
        state.noRotateMode
          ? 0
          : stage.openingRotation === "mostly-rotated"
            ? 1 + Math.floor(stageRandom() * 3)
            : Math.floor(stageRandom() * 4),
      color: PALETTE[idx % PALETTE.length],
      placed: false,
      row: null,
      col: null,
    }));

    state.stageIndex = clampedStageIndex;
    state.selectedStageIndex = clampedStageIndex;
    state.rows = stage.rows;
    state.cols = stage.cols;
    state.stageTitle = stage.title;
    state.cleared = false;
    state.assistRemaining = ASSIST_PER_STAGE;
    state.assistUsedCount = 0;
    state.moveCount = 0;
    state.failCount = 0;
    state.elapsedSec = 0;
    state.stageStartAt = Date.now();
    state.pointerDrag = null;
    clearClickCarry();
    clearDragPreview();
    clearHints();
    state.board = createEmptyBoard(stage.rows, stage.cols);
    state.pieces = shuffle(pieces, stageRandom);
    state.selectedId = state.pieces[0]?.id ?? null;
    state.started = true;
      messageEl.textContent = t(
        `ステージ ${state.stageIndex + 1} ${stage.title}${state.noRotateMode ? " [回転なし]" : ""}: ピースを選んで枠内に配置してください`,
        `스테이지 ${state.stageIndex + 1} ${stage.title}${state.noRotateMode ? " [회전 없음]" : ""}: 조각을 선택해 틀 안에 배치하세요`,
      );
    startTimer();
    saveProgress();
    render();
    emitRoomSnapshot();
  }

  function startButtonAction() {
    if (!canLocalControl()) return;
    if (!state.started) {
      state.totalScore = 0;
      newPuzzle(state.selectedStageIndex);
      return;
    }

    newPuzzle(state.selectedStageIndex);
  }

  function changeDifficulty(nextDifficulty) {
    if (!canLocalControl()) return;
    const allowed = nextDifficulty === "easy" || nextDifficulty === "normal" || nextDifficulty === "hard";
    if (!allowed) return;
    if (state.difficulty === nextDifficulty) return;
    state.difficulty = nextDifficulty;
    saveProgress();
    if (state.started) {
      messageEl.textContent = "難易度を変更したため現在ステージを再開始します";
      newPuzzle(state.stageIndex);
      return;
    }
    render();
    emitRoomSnapshot();
  }

  function nextStageAction() {
    if (!canLocalControl()) return;
    if (!state.started) {
      messageEl.textContent = t("まずゲーム開始で開始してください", "먼저 게임 시작 버튼을 눌러 시작하세요");
      render();
      return;
    }
    if (!state.cleared) {
      messageEl.textContent = t("ステージをクリアすると次ステージへ進めます", "스테이지를 클리어하면 다음 스테이지로 진행할 수 있습니다");
      render();
      return;
    }

    if (state.stageIndex + 1 < STAGES.length) {
      newPuzzle(state.stageIndex + 1);
      return;
    }

    state.totalScore = 0;
    newPuzzle(0);
  }

  function toggleNoRotateMode() {
    if (!canLocalControl()) return;
    state.noRotateMode = !state.noRotateMode;
    saveProgress();
    if (state.started) {
      messageEl.textContent = state.noRotateMode ? "回転なしモードをONにしてステージを再開始します" : "回転なしモードをOFFにしてステージを再開始します";
      newPuzzle(state.stageIndex);
      return;
    }
    messageEl.textContent = state.noRotateMode ? "回転なしモード: ON" : "回転なしモード: OFF";
    render();
    emitRoomSnapshot();
  }

  function resetCurrent() {
    if (!canLocalControl()) return;
    if (!state.started) return;
    stopTimer();
    state.board = createEmptyBoard(state.rows, state.cols);
    state.cleared = false;
    state.assistRemaining = ASSIST_PER_STAGE;
    state.assistUsedCount = 0;
    state.moveCount = 0;
    state.failCount = 0;
    state.elapsedSec = 0;
    state.stageStartAt = Date.now();
    state.pointerDrag = null;
    clearClickCarry();
    clearDragPreview();
    clearHints();
    state.pieces.forEach((p) => {
      p.placed = false;
      p.row = null;
      p.col = null;
      p.rot = 0;
    });
    state.selectedId = state.pieces[0]?.id ?? null;
    messageEl.textContent = "配置をリセットしました";
    startTimer();
    render();
    emitRoomSnapshot();
  }

  function rotateSelected() {
    if (!canLocalControl()) return;
    if (!state.started) return;
    if (state.noRotateMode) {
      messageEl.textContent = "回転なしモードではROTATEを使用できません";
      render();
      return;
    }
    const piece = getPieceById(state.selectedId);
    if (!piece || piece.placed) return;
    piece.rot = (piece.rot + 1) % 4;
    clearHints();
    messageEl.textContent = "回転しました";
    render();
    emitRoomSnapshot();
  }

  function enterStandby() {
    stopTimer();
    closeStageSelectionModal();
    state.started = false;
    state.cleared = false;
    const selectedStage = STAGES[state.selectedStageIndex] || STAGES[0];
    state.stageIndex = clampStageIndex(state.selectedStageIndex);
    state.rows = selectedStage.rows;
    state.cols = selectedStage.cols;
    state.stageTitle = selectedStage.title;
    state.assistRemaining = ASSIST_PER_STAGE;
    state.assistUsedCount = 0;
    state.moveCount = 0;
    state.failCount = 0;
    state.elapsedSec = 0;
    state.stageStartAt = 0;
    state.totalScore = 0;
    state.pointerDrag = null;
    clearClickCarry();
    clearDragPreview();
    clearHints();
    state.board = createEmptyBoard(state.rows, state.cols);
    state.pieces = [];
    state.selectedId = null;
    messageEl.textContent = "GAME STARTで開始";
    render();
  }

  startBtn?.addEventListener("click", () => startButtonAction());
  nextBtn?.addEventListener("click", () => nextStageAction());
  rotateBtn?.addEventListener("click", () => rotateSelected());
  noRotateBtn?.addEventListener("click", () => toggleNoRotateMode());
  difficultySelect?.addEventListener("change", () => changeDifficulty(difficultySelect.value));
  stageSelect?.addEventListener("change", () => {
    selectStageIndex(stageSelect.value, "select");
  });
  stageScreenBtn?.addEventListener("click", () => openStageSelectionModal());
  stageModalCloseBtn?.addEventListener("click", () => closeStageSelectionModal());
  stageModalEl?.addEventListener("click", (event) => {
    if (event.target === stageModalEl) closeStageSelectionModal();
  });
  document.addEventListener("keydown", handleStageModalKeydown);
  stageBuilderUseCurrentBtn?.addEventListener("click", () => {
    if (isRoomMode() && !isRoomHost()) return;
    const base = STAGES[state.selectedStageIndex] || STAGES[STAGES.length - 1] || STAGES[0];
    const template = {
      ...stageToSerializable(base, STAGES.length),
      title: `${base.title}-copy`,
      seed: nextStageSeed(),
    };
    reflectStageInBuilder(template);
    if (stageBuilderMessageEl) {
      stageBuilderMessageEl.textContent = `ステージ ${state.selectedStageIndex + 1} を基準に入力しました`;
    }
  });
  stageBuilderAddBtn?.addEventListener("click", () => addStageFromBuilder());
  assistBtn?.addEventListener("click", () => useAssist());
  resetBtn?.addEventListener("click", () => resetCurrent());
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });

  if (typeof options.onFitPuzzleProgressRequest === "function") {
    applyProgress(options.onFitPuzzleProgressRequest());
  }
  reflectStageInBuilder(STAGES[state.selectedStageIndex] || STAGES[STAGES.length - 1] || STAGES[0]);
  if (stageBuilderSeedInput) stageBuilderSeedInput.value = String(nextStageSeed());
  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => {
      if (isRoomMode() && !fromRemote && !isRoomHost()) return;
      if (fromRemote && isRoomMode()) {
        state.roomLocked = false;
        state.roomLockMessage = "";
      }
      newPuzzle(state.selectedStageIndex);
    },
    applyProgress,
    getProgress: () => currentProgressSnapshot(),
    enterStandby,
    stop: () => {
      stopTimer();
      destroyDragGhost();
      clearDragPreview();
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("keydown", handleStageModalKeydown);
    },
    configureRoomMode: ({ roomCode, roomRole }) => {
      state.gameMode = "room";
      state.roomRole = roomRole || "guest";
      state.roomLocked = state.roomRole !== "host";
      state.roomLockMessage = state.roomLocked ? t("ホストの開始を待っています...", "호스트의 시작을 기다리는 중...") : "";
      options.onRoomStatusChange?.({ roomCode, roomRole: state.roomRole });
      enterStandby();
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage;
        render();
      }
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomRole = null;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      enterStandby();
    },
    setRoomLock: ({ locked, message } = {}) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = String(message || "");
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || t("ホストの開始を待っています...", "호스트의 시작을 기다리는 중...");
      }
      render();
    },
    applyRemoteMove: () => {},
    getSnapshot: () => composeRoomSnapshot(),
    applySnapshot: (snapshot) => {
      if (!isRoomMode()) return;
      applyRoomSnapshot(snapshot);
    },
  };
}
