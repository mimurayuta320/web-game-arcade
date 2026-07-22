import { createMahjongEngine } from "./mahjong/engine.js";
import { renderMahjongBoard } from "./mahjong/ui.js";

const PLAYER1 = 1;
const PLAYER2 = 2;
const CPU_THINK_MS = 420;
const MAHJONG_DIFFICULTY = {
  easy: { rows: 6, cols: 8, typeCount: 16, timeSec: 210, hintLimit: 8, shuffleLimit: 8, cpuThinkMs: 620 },
  normal: { rows: 8, cols: 14, typeCount: 34, timeSec: 180, hintLimit: 5, shuffleLimit: 6, cpuThinkMs: 420 },
  hard: { rows: 9, cols: 14, typeCount: 34, timeSec: 150, hintLimit: 3, shuffleLimit: 4, cpuThinkMs: 280 },
  expert: { rows: 10, cols: 14, typeCount: 34, timeSec: 120, hintLimit: 2, shuffleLimit: 2, cpuThinkMs: 160 },
};

function mahjongLang() {
  const langSelect = document.getElementById("langSelect");
  return langSelect?.value === "ko" ? "ko" : "ja";
}

function mahjongText(key) {
  const dict = {
    ja: {
      standby: "GAME STARTで開始",
      pushStart: "GAME STARTを押してください",
      ready: "同じ牌を2枚選んで消してください",
      turnP1: "PLAYER 1",
      turnP2: "PLAYER 2",
      turnCpu: "CPU",
      turnYou: "あなた",
      turnPeer: "相手",
      clear: "クリア! すべての牌を消しました",
      removed: "ペアを消しました",
      removedAndShuffle: "ペアを消しました。手がなくなったため自動シャッフルしました",
      blocked: "同じ牌ですが、2回までに曲がる経路が見つかりません",
      switched: "選択を切り替えました",
      hint: "ヒント: {a} と {b}",
      noHint: "現在消せるペアがありません。シャッフルしてください",
      noHintLeft: "ヒント残数がありません",
      noShuffleLeft: "シャッフル残数がありません",
      shuffled: "牌をシャッフルしました",
      waitingRoom: "ルーム対戦の開始を待っています...",
      roomLocked: "対戦相手を待っています...",
      roomCpuGuestReadOnly: "CPU戦はホストが操作します",
      partnerTurn: "相方の手番です",
      yourTurn: "あなたの手番です",
      opponentTurn: "相手の手番です",
      cpuTurn: "CPUの手番です",
      resultWin: "勝利",
      resultLose: "敗北",
      resultDraw: "引き分け",
      resultPrefix: "対局結果",
      modeCpu: "1P 対 CPU",
      modeLocal: "ローカル2人",
      roomModeCpuCoop: "CPU協力戦",
      roomModeVs: "対人戦",
      coopOwnerHost: "ホスト",
      coopOwnerGuest: "ゲスト",
      coopOwnerNone: "-",
      assistFmt: "H {hint} / S {shuffle}",
      difficultyEasy: "かんたん",
      difficultyNormal: "ふつう",
      difficultyHard: "むずかしい",
      difficultyExpert: "鬼むず",
      timeout: "時間切れです",
      diceRollStart: "サイコロ: {leftName}{leftRoll} / {rightName}{rightRoll} -> 先手 {first}",
      scoreCalcTitle: "本家点数計算（リーチ麻雀）",
      scoreCalcHan: "飜",
      scoreCalcFu: "符",
      scoreCalcSeat: "親子",
      scoreCalcSeatChild: "子",
      scoreCalcSeatDealer: "親",
      scoreCalcRoundWind: "場風",
      scoreCalcPlayerWind: "自風",
      scoreCalcWindEast: "東",
      scoreCalcWindSouth: "南",
      scoreCalcWindWest: "西",
      scoreCalcWindNorth: "北",
      scoreCalcYakuRoundWind: "場風牌（{wind}）",
      scoreCalcYakuSeatWind: "自風牌（{wind}）",
      scoreCalcWin: "和了",
      scoreCalcRon: "ロン",
      scoreCalcTsumo: "ツモ",
      scoreCalcHonba: "本場",
      scoreCalcKyotaku: "供託",
      scoreCalcButton: "点数計算",
      scoreCalcNote: "役判定は手入力（飜/符）です。点数計算は本家ルール準拠です。",
      scoreCalcAutoHan: "役チェックから飜を自動計算",
      scoreCalcOpenHand: "鳴きあり（門前ではない）",
      scoreCalcDoraHan: "ドラ飜",
      scoreCalcAutoHanView: "自動飜: {han}",
      scoreCalcAutoHanManual: "自動飜: 手動入力中",
      scoreCalcNoYaku: "1飜以上を入力してください",
      scoreCalcFuGuardChiitoi: "七対子のため符を25に補正",
      scoreCalcFuGuardPinfuTsumo: "平和ツモのため符を20に補正",
      scoreCalcLimitMangan: "満貫",
      scoreCalcLimitHaneman: "跳満",
      scoreCalcLimitBaiman: "倍満",
      scoreCalcLimitSanbaiman: "三倍満",
      scoreCalcLimitYakuman: "役満",
      scoreCalcLimitDoubleYakuman: "{count}倍役満",
      scoreCalcResultRon: "{limit} {seat}{win}: {point}点",
      scoreCalcResultTsumoDealer: "{limit} 親ツモ: {each}オール（計 {total}点）",
      scoreCalcResultTsumoChild: "{limit} 子ツモ: 親{dealerPay} / 子{childPay}（計 {total}点）",
      scoreCalcResultDetail: "供託込み: {withDeposit}点（本場 {honba} / 供託 {kyotaku}）",
    },
    ko: {
      standby: "GAME START로 시작",
      pushStart: "GAME START를 누르세요",
      ready: "같은 패 2장을 선택해 제거하세요",
      turnP1: "PLAYER 1",
      turnP2: "PLAYER 2",
      turnCpu: "CPU",
      turnYou: "당신",
      turnPeer: "상대",
      clear: "클리어! 모든 패를 제거했습니다",
      removed: "페어를 제거했습니다",
      removedAndShuffle: "페어를 제거했고, 수가 없어 자동 셔플했습니다",
      blocked: "같은 패이지만 2번 이내로 꺾는 경로를 찾지 못했습니다",
      switched: "선택을 변경했습니다",
      hint: "힌트: {a} 와 {b}",
      noHint: "지금 제거 가능한 페어가 없습니다. 셔플하세요",
      noHintLeft: "힌트 잔여 횟수가 없습니다",
      noShuffleLeft: "셔플 잔여 횟수가 없습니다",
      shuffled: "패를 셔플했습니다",
      waitingRoom: "룸 대전 시작을 기다리는 중...",
      roomLocked: "상대를 기다리는 중...",
      roomCpuGuestReadOnly: "CPU전은 호스트가 조작합니다",
      partnerTurn: "팀 동료 턴입니다",
      yourTurn: "당신의 턴입니다",
      opponentTurn: "상대 턴입니다",
      cpuTurn: "CPU 턴입니다",
      resultWin: "승리",
      resultLose: "패배",
      resultDraw: "무승부",
      resultPrefix: "대국 결과",
      modeCpu: "1P vs CPU",
      modeLocal: "2P LOCAL",
      roomModeCpuCoop: "CPU 협동전",
      roomModeVs: "대인전",
      coopOwnerHost: "호스트",
      coopOwnerGuest: "게스트",
      coopOwnerNone: "-",
      assistFmt: "H {hint} / S {shuffle}",
      difficultyEasy: "쉬움",
      difficultyNormal: "보통",
      difficultyHard: "어려움",
      difficultyExpert: "최고난도",
      timeout: "시간 초과입니다",
      diceRollStart: "주사위: {leftName}{leftRoll} / {rightName}{rightRoll} -> 선공 {first}",
      scoreCalcTitle: "정식 점수 계산 (리치 마작)",
      scoreCalcHan: "판",
      scoreCalcFu: "부",
      scoreCalcSeat: "친/자",
      scoreCalcSeatChild: "자",
      scoreCalcSeatDealer: "친",
      scoreCalcRoundWind: "장풍",
      scoreCalcPlayerWind: "자풍",
      scoreCalcWindEast: "동",
      scoreCalcWindSouth: "남",
      scoreCalcWindWest: "서",
      scoreCalcWindNorth: "북",
      scoreCalcYakuRoundWind: "장풍패 ({wind})",
      scoreCalcYakuSeatWind: "자풍패 ({wind})",
      scoreCalcWin: "화료",
      scoreCalcRon: "론",
      scoreCalcTsumo: "쯔모",
      scoreCalcHonba: "본장",
      scoreCalcKyotaku: "공탁",
      scoreCalcButton: "점수 계산",
      scoreCalcNote: "역 판정은 수동 입력(판/부)입니다. 점수 계산은 정식 룰을 따릅니다.",
      scoreCalcAutoHan: "역 체크로 판 자동 계산",
      scoreCalcOpenHand: "울기 있음 (멘젠 아님)",
      scoreCalcDoraHan: "도라 판",
      scoreCalcAutoHanView: "자동 판: {han}",
      scoreCalcAutoHanManual: "자동 판: 수동 입력 중",
      scoreCalcNoYaku: "1판 이상을 입력하세요",
      scoreCalcFuGuardChiitoi: "치또이츠이므로 부를 25로 보정",
      scoreCalcFuGuardPinfuTsumo: "핑후 쯔모이므로 부를 20으로 보정",
      scoreCalcLimitMangan: "만관",
      scoreCalcLimitHaneman: "하네만",
      scoreCalcLimitBaiman: "배만",
      scoreCalcLimitSanbaiman: "삼배만",
      scoreCalcLimitYakuman: "역만",
      scoreCalcLimitDoubleYakuman: "{count}배 역만",
      scoreCalcResultRon: "{limit} {seat}{win}: {point}점",
      scoreCalcResultTsumoDealer: "{limit} 친 쯔모: {each} 올 (합계 {total}점)",
      scoreCalcResultTsumoChild: "{limit} 자 쯔모: 친{dealerPay} / 자{childPay} (합계 {total}점)",
      scoreCalcResultDetail: "공탁 포함: {withDeposit}점 (본장 {honba} / 공탁 {kyotaku})",
    },
  };
  return dict[mahjongLang()][key] || dict.ja[key] || key;
}

function applyTemplate(template, vars = {}) {
  let text = template;
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value));
  });
  return text;
}

export function initMahjong(options = {}) {
  const boardEl = document.getElementById("mahjongBoard");
  const messageEl = document.getElementById("mahjongMessage");
  const overlayEl = document.getElementById("mahjongOverlay");
  const remainEl = document.getElementById("mahjongRemainText");
  const statusEl = document.getElementById("mahjongStatusText");
  const turnEl = document.getElementById("mahjongTurnText");
  const p1ScoreEl = document.getElementById("mahjongP1ScoreText");
  const p2ScoreEl = document.getElementById("mahjongP2ScoreText");
  const roomModeEl = document.getElementById("mahjongRoomModeText");
  const coopOwnerEl = document.getElementById("mahjongCoopOwnerText");
  const modeSelectEl = document.getElementById("mahjongModeSelect");
  const difficultySelectEl = document.getElementById("mahjongDifficultySelect");
  const linkFxEl = document.getElementById("mahjongLinkFx");
  const timeEl = document.getElementById("mahjongTimeText");
  const assistEl = document.getElementById("mahjongAssistText");
  const scoreCalcTitleEl = document.getElementById("mahjongScoreCalcTitle");
  const scoreCalcHanLabelEl = document.getElementById("mahjongCalcHanLabel");
  const scoreCalcFuLabelEl = document.getElementById("mahjongCalcFuLabel");
  const scoreCalcSeatLabelEl = document.getElementById("mahjongCalcSeatLabel");
  const scoreCalcRoundWindLabelEl = document.getElementById("mahjongCalcRoundWindLabel");
  const scoreCalcPlayerWindLabelEl = document.getElementById("mahjongCalcPlayerWindLabel");
  const scoreCalcWinLabelEl = document.getElementById("mahjongCalcWinLabel");
  const scoreCalcHonbaLabelEl = document.getElementById("mahjongCalcHonbaLabel");
  const scoreCalcKyotakuLabelEl = document.getElementById("mahjongCalcKyotakuLabel");
  const scoreCalcHanEl = document.getElementById("mahjongCalcHan");
  const scoreCalcFuEl = document.getElementById("mahjongCalcFu");
  const scoreCalcSeatEl = document.getElementById("mahjongCalcSeat");
  const scoreCalcRoundWindEl = document.getElementById("mahjongCalcRoundWind");
  const scoreCalcPlayerWindEl = document.getElementById("mahjongCalcPlayerWind");
  const scoreCalcWinEl = document.getElementById("mahjongCalcWin");
  const scoreCalcHonbaEl = document.getElementById("mahjongCalcHonba");
  const scoreCalcKyotakuEl = document.getElementById("mahjongCalcKyotaku");
  const scoreCalcAutoHanToggleEl = document.getElementById("mahjongCalcAutoHanToggle");
  const scoreCalcOpenHandEl = document.getElementById("mahjongCalcOpenHand");
  const scoreCalcDoraHanEl = document.getElementById("mahjongCalcDoraHan");
  const scoreCalcAutoHanLabelEl = document.getElementById("mahjongCalcAutoHanLabel");
  const scoreCalcOpenHandLabelEl = document.getElementById("mahjongCalcOpenHandLabel");
  const scoreCalcDoraHanLabelEl = document.getElementById("mahjongCalcDoraHanLabel");
  const scoreCalcAutoHanTextEl = document.getElementById("mahjongCalcHanAutoText");
  const scoreCalcYakuListEl = document.getElementById("mahjongYakuList");
  const scoreCalcYakuRoundWindTextEl = document.getElementById("mahjongCalcYakuRoundWindText");
  const scoreCalcYakuSeatWindTextEl = document.getElementById("mahjongCalcYakuSeatWindText");
  const scoreCalcYakuPinfuEl = document.getElementById("mahjongCalcYakuPinfu");
  const scoreCalcYakuChiitoiEl = document.getElementById("mahjongCalcYakuChiitoi");
  const scoreCalcBtnEl = document.getElementById("mahjongCalcBtn");
  const scoreCalcResultEl = document.getElementById("mahjongCalcResult");
  const scoreCalcNoteEl = document.getElementById("mahjongCalcNote");
  const startBtn = document.getElementById("mahjongStartBtn");
  const shuffleBtn = document.getElementById("mahjongShuffleBtn");
  const hintBtn = document.getElementById("mahjongHintBtn");
  const menuBtn = document.getElementById("mahjongMenuBtn");

  let engine = createMahjongEngine(MAHJONG_DIFFICULTY.normal);
  const state = {
    started: false,
    mode: "cpu",
    difficultyKey: "normal",
    roomMode: false,
    roomCode: null,
    roomRole: null,
    roomPlayer: PLAYER1,
    roomLocked: false,
    roomLockMessage: "",
    currentPlayer: PLAYER1,
    cpuCoopOwner: "host",
    scores: { 1: 0, 2: 0 },
    cpuTimerId: 0,
    cpuThinking: false,
    timerId: 0,
    timeLeftSec: 0,
    hintLeft: 0,
    shuffleLeft: 0,
    coopFlashTimerId: 0,
    lastDisplayedCoopOwner: "",
  };

  function difficultyPreset() {
    return MAHJONG_DIFFICULTY[state.difficultyKey] || MAHJONG_DIFFICULTY.normal;
  }

  function difficultyLabel(key) {
    if (key === "easy") return mahjongText("difficultyEasy");
    if (key === "hard") return mahjongText("difficultyHard");
    if (key === "expert") return mahjongText("difficultyExpert");
    return mahjongText("difficultyNormal");
  }

  function rebuildEngineByDifficulty() {
    const preset = difficultyPreset();
    engine = createMahjongEngine({
      rows: preset.rows,
      cols: preset.cols,
      typeCount: preset.typeCount,
    });
  }

  function toMmSs(totalSec) {
    const sec = Math.max(0, Math.floor(Number(totalSec) || 0));
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function ceil100(value) {
    return Math.ceil(Number(value || 0) / 100) * 100;
  }

  function clampInt(value, min, max) {
    const n = Math.floor(Number(value) || 0);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function windText(value) {
    if (value === "south") return mahjongText("scoreCalcWindSouth");
    if (value === "west") return mahjongText("scoreCalcWindWest");
    if (value === "north") return mahjongText("scoreCalcWindNorth");
    return mahjongText("scoreCalcWindEast");
  }

  function updateWindYakuLabels() {
    if (scoreCalcYakuRoundWindTextEl) {
      scoreCalcYakuRoundWindTextEl.textContent = applyTemplate(mahjongText("scoreCalcYakuRoundWind"), {
        wind: windText(String(scoreCalcRoundWindEl?.value || "east")),
      });
    }
    if (scoreCalcYakuSeatWindTextEl) {
      scoreCalcYakuSeatWindTextEl.textContent = applyTemplate(mahjongText("scoreCalcYakuSeatWind"), {
        wind: windText(String(scoreCalcPlayerWindEl?.value || "east")),
      });
    }
  }

  function syncSeatFromPlayerWind() {
    if (!scoreCalcPlayerWindEl || !scoreCalcSeatEl) return;
    const wind = String(scoreCalcPlayerWindEl.value || "east");
    scoreCalcSeatEl.value = wind === "east" ? "dealer" : "child";
  }

  function setHanSelectValue(value) {
    if (!scoreCalcHanEl) return;
    const han = Math.max(0, Math.floor(Number(value) || 0));
    let option = scoreCalcHanEl.querySelector(`option[value="${han}"]`);
    if (!option) {
      option = document.createElement("option");
      option.value = String(han);
      option.textContent = String(han);
      scoreCalcHanEl.appendChild(option);
    }
    scoreCalcHanEl.value = String(han);
  }

  function setFuSelectValue(value) {
    if (!scoreCalcFuEl) return;
    const fu = Math.max(20, Math.floor(Number(value) || 20));
    let option = scoreCalcFuEl.querySelector(`option[value="${fu}"]`);
    if (!option) {
      option = document.createElement("option");
      option.value = String(fu);
      option.textContent = String(fu);
      scoreCalcFuEl.appendChild(option);
    }
    scoreCalcFuEl.value = String(fu);
  }

  function enforceFuRuleGuards() {
    const isChiitoi = Boolean(scoreCalcYakuChiitoiEl?.checked);
    if (isChiitoi) {
      setFuSelectValue(25);
      return mahjongText("scoreCalcFuGuardChiitoi");
    }

    const isTsumo = String(scoreCalcWinEl?.value || "ron") === "tsumo";
    const isPinfu = Boolean(scoreCalcYakuPinfuEl?.checked);
    if (isTsumo && isPinfu) {
      setFuSelectValue(20);
      return mahjongText("scoreCalcFuGuardPinfuTsumo");
    }
    return "";
  }

  function calculateAutoHanFromYaku() {
    const isOpenHand = Boolean(scoreCalcOpenHandEl?.checked);
    const doraHan = clampInt(scoreCalcDoraHanEl?.value, 0, 20);
    const yakuChecks = scoreCalcYakuListEl
      ? [...scoreCalcYakuListEl.querySelectorAll("input[type='checkbox']")]
      : [];

    let han = 0;
    let yakumanCount = 0;

    yakuChecks.forEach((inputEl) => {
      if (!inputEl.checked) return;
      const yakuman = Number(inputEl.getAttribute("data-yakuman-count") || 0);
      if (yakuman > 0) {
        yakumanCount += Math.floor(yakuman);
        return;
      }
      const closedHan = Number(inputEl.getAttribute("data-yaku-han-closed") || 0);
      const openHan = Number(inputEl.getAttribute("data-yaku-han-open") || 0);
      han += isOpenHand ? openHan : closedHan;
    });

    if (yakumanCount > 0) {
      han = Math.max(han, yakumanCount * 13);
    }
    han += doraHan;
    return Math.max(0, han);
  }

  function riichiLimitBase(han, fu) {
    const h = Math.floor(Number(han) || 0);
    if (h <= 0) return { error: mahjongText("scoreCalcNoYaku") };
    const f = Math.max(20, Math.floor(Number(fu) || 20));
    if (h >= 13) {
      const count = Math.max(1, Math.floor(h / 13));
      const limitName = count === 1
        ? mahjongText("scoreCalcLimitYakuman")
        : applyTemplate(mahjongText("scoreCalcLimitDoubleYakuman"), { count });
      return { base: 8000 * count, limitName };
    }
    if (h >= 11) return { base: 6000, limitName: mahjongText("scoreCalcLimitSanbaiman") };
    if (h >= 8) return { base: 4000, limitName: mahjongText("scoreCalcLimitBaiman") };
    if (h >= 6) return { base: 3000, limitName: mahjongText("scoreCalcLimitHaneman") };

    const mangan = h === 5 || (h === 4 && f >= 40) || (h === 3 && f >= 70);
    if (mangan) return { base: 2000, limitName: mahjongText("scoreCalcLimitMangan") };

    const rawBase = f * (2 ** (h + 2));
    return { base: Math.min(2000, rawBase), limitName: `${h}飜${f}符` };
  }

  function calculateRiichiScore({ han, fu, dealer, tsumo, honba, kyotaku }) {
    const limit = riichiLimitBase(han, fu);
    if (limit.error) {
      return { error: limit.error };
    }
    const { base, limitName } = limit;
    const hb = Math.max(0, Math.floor(Number(honba) || 0));
    const kt = Math.max(0, Math.floor(Number(kyotaku) || 0));

    if (tsumo) {
      if (dealer) {
        const each = ceil100(base * 2) + hb * 100;
        const total = each * 3;
        const totalWithDeposit = total + kt * 1000;
        return {
          limitName,
          total,
          totalWithDeposit,
          each,
          dealerPay: each,
          childPay: each,
          dealer,
          tsumo,
          honba: hb,
          kyotaku: kt,
        };
      }

      const dealerPay = ceil100(base * 2) + hb * 100;
      const childPay = ceil100(base) + hb * 100;
      const total = dealerPay + childPay * 2;
      const totalWithDeposit = total + kt * 1000;
      return {
        limitName,
        total,
        totalWithDeposit,
        each: 0,
        dealerPay,
        childPay,
        dealer,
        tsumo,
        honba: hb,
        kyotaku: kt,
      };
    }

    const ronPoint = ceil100(base * (dealer ? 6 : 4)) + hb * 300;
    const totalWithDeposit = ronPoint + kt * 1000;
    return {
      limitName,
      total: ronPoint,
      totalWithDeposit,
      ronPoint,
      dealer,
      tsumo,
      honba: hb,
      kyotaku: kt,
    };
  }

  function applyScoreCalcTranslations() {
    if (scoreCalcTitleEl) scoreCalcTitleEl.textContent = mahjongText("scoreCalcTitle");
    if (scoreCalcHanLabelEl) scoreCalcHanLabelEl.textContent = mahjongText("scoreCalcHan");
    if (scoreCalcFuLabelEl) scoreCalcFuLabelEl.textContent = mahjongText("scoreCalcFu");
    if (scoreCalcSeatLabelEl) scoreCalcSeatLabelEl.textContent = mahjongText("scoreCalcSeat");
    if (scoreCalcRoundWindLabelEl) scoreCalcRoundWindLabelEl.textContent = mahjongText("scoreCalcRoundWind");
    if (scoreCalcPlayerWindLabelEl) scoreCalcPlayerWindLabelEl.textContent = mahjongText("scoreCalcPlayerWind");
    if (scoreCalcWinLabelEl) scoreCalcWinLabelEl.textContent = mahjongText("scoreCalcWin");
    if (scoreCalcHonbaLabelEl) scoreCalcHonbaLabelEl.textContent = mahjongText("scoreCalcHonba");
    if (scoreCalcKyotakuLabelEl) scoreCalcKyotakuLabelEl.textContent = mahjongText("scoreCalcKyotaku");
    if (scoreCalcBtnEl) scoreCalcBtnEl.textContent = mahjongText("scoreCalcButton");
    if (scoreCalcNoteEl) scoreCalcNoteEl.textContent = mahjongText("scoreCalcNote");
    if (scoreCalcAutoHanLabelEl) scoreCalcAutoHanLabelEl.textContent = mahjongText("scoreCalcAutoHan");
    if (scoreCalcOpenHandLabelEl) scoreCalcOpenHandLabelEl.textContent = mahjongText("scoreCalcOpenHand");
    if (scoreCalcDoraHanLabelEl) scoreCalcDoraHanLabelEl.textContent = mahjongText("scoreCalcDoraHan");

    if (scoreCalcSeatEl) {
      const childOpt = scoreCalcSeatEl.querySelector('option[value="child"]');
      const dealerOpt = scoreCalcSeatEl.querySelector('option[value="dealer"]');
      if (childOpt) childOpt.textContent = mahjongText("scoreCalcSeatChild");
      if (dealerOpt) dealerOpt.textContent = mahjongText("scoreCalcSeatDealer");
    }
    if (scoreCalcRoundWindEl) {
      const eastOpt = scoreCalcRoundWindEl.querySelector('option[value="east"]');
      const southOpt = scoreCalcRoundWindEl.querySelector('option[value="south"]');
      const westOpt = scoreCalcRoundWindEl.querySelector('option[value="west"]');
      const northOpt = scoreCalcRoundWindEl.querySelector('option[value="north"]');
      if (eastOpt) eastOpt.textContent = mahjongText("scoreCalcWindEast");
      if (southOpt) southOpt.textContent = mahjongText("scoreCalcWindSouth");
      if (westOpt) westOpt.textContent = mahjongText("scoreCalcWindWest");
      if (northOpt) northOpt.textContent = mahjongText("scoreCalcWindNorth");
    }
    if (scoreCalcPlayerWindEl) {
      const eastOpt = scoreCalcPlayerWindEl.querySelector('option[value="east"]');
      const southOpt = scoreCalcPlayerWindEl.querySelector('option[value="south"]');
      const westOpt = scoreCalcPlayerWindEl.querySelector('option[value="west"]');
      const northOpt = scoreCalcPlayerWindEl.querySelector('option[value="north"]');
      if (eastOpt) eastOpt.textContent = mahjongText("scoreCalcWindEast");
      if (southOpt) southOpt.textContent = mahjongText("scoreCalcWindSouth");
      if (westOpt) westOpt.textContent = mahjongText("scoreCalcWindWest");
      if (northOpt) northOpt.textContent = mahjongText("scoreCalcWindNorth");
    }
    updateWindYakuLabels();
    if (scoreCalcWinEl) {
      const ronOpt = scoreCalcWinEl.querySelector('option[value="ron"]');
      const tsumoOpt = scoreCalcWinEl.querySelector('option[value="tsumo"]');
      if (ronOpt) ronOpt.textContent = mahjongText("scoreCalcRon");
      if (tsumoOpt) tsumoOpt.textContent = mahjongText("scoreCalcTsumo");
    }
  }

  function updateRiichiScorePreview() {
    if (!scoreCalcResultEl) return;
    const fuGuardText = enforceFuRuleGuards();
    const autoHanEnabled = Boolean(scoreCalcAutoHanToggleEl?.checked);
    if (autoHanEnabled) {
      const autoHan = calculateAutoHanFromYaku();
      setHanSelectValue(autoHan);
      if (scoreCalcAutoHanTextEl) {
        scoreCalcAutoHanTextEl.textContent = applyTemplate(mahjongText("scoreCalcAutoHanView"), { han: autoHan });
      }
    } else if (scoreCalcAutoHanTextEl) {
      scoreCalcAutoHanTextEl.textContent = mahjongText("scoreCalcAutoHanManual");
    }

    const han = Number(scoreCalcHanEl?.value || 1);
    const fu = Number(scoreCalcFuEl?.value || 30);
    const dealer = String(scoreCalcSeatEl?.value || "child") === "dealer";
    const tsumo = String(scoreCalcWinEl?.value || "ron") === "tsumo";
    const honba = Number(scoreCalcHonbaEl?.value || 0);
    const kyotaku = Number(scoreCalcKyotakuEl?.value || 0);

    const result = calculateRiichiScore({ han, fu, dealer, tsumo, honba, kyotaku });
    if (result.error) {
      scoreCalcResultEl.textContent = result.error;
      return;
    }

    if (!tsumo) {
      const line1 = applyTemplate(mahjongText("scoreCalcResultRon"), {
        limit: result.limitName,
        seat: dealer ? mahjongText("scoreCalcSeatDealer") : mahjongText("scoreCalcSeatChild"),
        win: mahjongText("scoreCalcRon"),
        point: result.total,
      });
      const line2 = applyTemplate(mahjongText("scoreCalcResultDetail"), {
        withDeposit: result.totalWithDeposit,
        honba: result.honba,
        kyotaku: result.kyotaku,
      });
      scoreCalcResultEl.textContent = fuGuardText ? `${line1} / ${line2} / ${fuGuardText}` : `${line1} / ${line2}`;
      return;
    }

    if (dealer) {
      const line1 = applyTemplate(mahjongText("scoreCalcResultTsumoDealer"), {
        limit: result.limitName,
        each: result.each,
        total: result.total,
      });
      const line2 = applyTemplate(mahjongText("scoreCalcResultDetail"), {
        withDeposit: result.totalWithDeposit,
        honba: result.honba,
        kyotaku: result.kyotaku,
      });
      scoreCalcResultEl.textContent = fuGuardText ? `${line1} / ${line2} / ${fuGuardText}` : `${line1} / ${line2}`;
      return;
    }

    const line1 = applyTemplate(mahjongText("scoreCalcResultTsumoChild"), {
      limit: result.limitName,
      dealerPay: result.dealerPay,
      childPay: result.childPay,
      total: result.total,
    });
    const line2 = applyTemplate(mahjongText("scoreCalcResultDetail"), {
      withDeposit: result.totalWithDeposit,
      honba: result.honba,
      kyotaku: result.kyotaku,
    });
    scoreCalcResultEl.textContent = fuGuardText ? `${line1} / ${line2} / ${fuGuardText}` : `${line1} / ${line2}`;
  }

  function clearCpuTimer() {
    if (!state.cpuTimerId) return;
    window.clearTimeout(state.cpuTimerId);
    state.cpuTimerId = 0;
    state.cpuThinking = false;
  }

  function clearRoundTimer() {
    if (!state.timerId) return;
    window.clearInterval(state.timerId);
    state.timerId = 0;
  }

  function clearCoopFlashTimer() {
    if (!state.coopFlashTimerId) return;
    window.clearTimeout(state.coopFlashTimerId);
    state.coopFlashTimerId = 0;
  }

  function triggerCoopOwnerFlash() {
    if (!coopOwnerEl) return;
    coopOwnerEl.classList.remove("mahjong-coop-flash");
    // Force reflow so the animation can replay each time owner changes.
    void coopOwnerEl.offsetWidth;
    coopOwnerEl.classList.add("mahjong-coop-flash");
    clearCoopFlashTimer();
    state.coopFlashTimerId = window.setTimeout(() => {
      state.coopFlashTimerId = 0;
      coopOwnerEl.classList.remove("mahjong-coop-flash");
    }, 480);
  }

  function isCpuMode() {
    return state.mode === "cpu";
  }

  function isRoomHost() {
    return state.roomRole === "host";
  }

  function isRoomGuest() {
    return state.roomRole === "guest";
  }

  function isCurrentLocalPlayer() {
    if (state.roomMode) {
      if (isCpuMode()) {
        if (state.currentPlayer !== PLAYER1) return false;
        return state.roomRole === state.cpuCoopOwner;
      }
      return state.currentPlayer === state.roomPlayer;
    }
    if (isCpuMode()) {
      return state.currentPlayer !== PLAYER2;
    }
    return true;
  }

  function turnLabel() {
    if (state.roomMode) {
      if (isCpuMode()) {
        if (state.currentPlayer === PLAYER2) return mahjongText("turnCpu");
        return state.roomRole === state.cpuCoopOwner ? mahjongText("turnYou") : mahjongText("turnPeer");
      }
      if (state.currentPlayer === state.roomPlayer) return mahjongText("turnYou");
      return mahjongText("turnPeer");
    }
    if (isCpuMode()) {
      return state.currentPlayer === PLAYER1 ? mahjongText("turnP1") : mahjongText("turnCpu");
    }
    return state.currentPlayer === PLAYER1 ? mahjongText("turnP1") : mahjongText("turnP2");
  }

  function turnMessage() {
    if (state.roomMode) {
      if (isCpuMode()) {
        if (state.currentPlayer === PLAYER2) return mahjongText("cpuTurn");
        return state.roomRole === state.cpuCoopOwner ? mahjongText("yourTurn") : mahjongText("partnerTurn");
      }
      return state.currentPlayer === state.roomPlayer ? mahjongText("yourTurn") : mahjongText("opponentTurn");
    }
    if (isCpuMode() && state.currentPlayer === PLAYER2) return mahjongText("cpuTurn");
    return state.currentPlayer === PLAYER1 ? mahjongText("turnP1") : mahjongText("turnP2");
  }

  function nextPlayer() {
    state.currentPlayer = state.currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
  }

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function rollPairNoTie() {
    let left = rollDie();
    let right = rollDie();
    while (left === right) {
      left = rollDie();
      right = rollDie();
    }
    return { left, right };
  }

  function openingDiceResult() {
    if (state.roomMode && isCpuMode()) {
      const { left, right } = rollPairNoTie();
      state.cpuCoopOwner = left > right ? "host" : "guest";
      state.currentPlayer = PLAYER1;
      const first = state.cpuCoopOwner === "guest"
        ? mahjongText("coopOwnerGuest")
        : mahjongText("coopOwnerHost");
      return applyTemplate(mahjongText("diceRollStart"), {
        leftName: `${mahjongText("coopOwnerHost")}:`,
        leftRoll: left,
        rightName: `${mahjongText("coopOwnerGuest")}:`,
        rightRoll: right,
        first,
      });
    }

    if (state.roomMode && !isCpuMode()) {
      const { left, right } = rollPairNoTie();
      const firstPlayer = left > right ? PLAYER1 : PLAYER2;
      state.currentPlayer = firstPlayer;
      const youPlayer = state.roomPlayer === PLAYER2 ? PLAYER2 : PLAYER1;
      const first = firstPlayer === youPlayer ? mahjongText("turnYou") : mahjongText("turnPeer");
      return applyTemplate(mahjongText("diceRollStart"), {
        leftName: `${mahjongText("turnP1")}:`,
        leftRoll: left,
        rightName: `${mahjongText("turnP2")}:`,
        rightRoll: right,
        first,
      });
    }

    if (isCpuMode()) {
      const { left, right } = rollPairNoTie();
      state.currentPlayer = left > right ? PLAYER1 : PLAYER2;
      const first = state.currentPlayer === PLAYER1 ? mahjongText("turnP1") : mahjongText("turnCpu");
      return applyTemplate(mahjongText("diceRollStart"), {
        leftName: `${mahjongText("turnP1")}:`,
        leftRoll: left,
        rightName: `${mahjongText("turnCpu")}:`,
        rightRoll: right,
        first,
      });
    }

    const { left, right } = rollPairNoTie();
    state.currentPlayer = left > right ? PLAYER1 : PLAYER2;
    const first = state.currentPlayer === PLAYER1 ? mahjongText("turnP1") : mahjongText("turnP2");
    return applyTemplate(mahjongText("diceRollStart"), {
      leftName: `${mahjongText("turnP1")}:`,
      leftRoll: left,
      rightName: `${mahjongText("turnP2")}:`,
      rightRoll: right,
      first,
    });
  }

  function setOverlay(text) {
    if (!overlayEl) return;
    if (text) {
      overlayEl.textContent = text;
      overlayEl.style.opacity = "1";
    } else {
      overlayEl.textContent = "";
      overlayEl.style.opacity = "0";
    }
  }

  function setMessage(text) {
    if (!messageEl) return;
    messageEl.textContent = text;
  }

  function updateStatus(text) {
    if (statusEl) statusEl.textContent = text;
    if (remainEl) {
      const remainPairs = Math.floor(engine.remainingTileCount() / 2);
      remainEl.textContent = `${remainPairs}`;
    }
    if (turnEl) turnEl.textContent = turnLabel();
    if (p1ScoreEl) p1ScoreEl.textContent = String(state.scores[PLAYER1] || 0);
    if (p2ScoreEl) p2ScoreEl.textContent = String(state.scores[PLAYER2] || 0);
    if (roomModeEl) {
      if (!state.roomMode) {
        roomModeEl.textContent = state.mode === "cpu" ? mahjongText("modeCpu") : mahjongText("modeLocal");
      } else {
        roomModeEl.textContent = state.mode === "cpu" ? mahjongText("roomModeCpuCoop") : mahjongText("roomModeVs");
      }
    }
    if (coopOwnerEl) {
      let ownerText = mahjongText("coopOwnerNone");
      if (!state.roomMode || state.mode !== "cpu") {
        ownerText = mahjongText("coopOwnerNone");
      } else {
        ownerText = state.cpuCoopOwner === "guest"
          ? mahjongText("coopOwnerGuest")
          : mahjongText("coopOwnerHost");
      }
      const shouldFlash =
        state.lastDisplayedCoopOwner
        && state.lastDisplayedCoopOwner !== ownerText
        && state.roomMode
        && state.mode === "cpu"
        && state.started;
      coopOwnerEl.textContent = ownerText;
      if (shouldFlash) {
        triggerCoopOwnerFlash();
      }
      state.lastDisplayedCoopOwner = ownerText;
    }
    if (modeSelectEl) {
      modeSelectEl.value = state.mode;
      modeSelectEl.disabled = state.roomMode
        ? !isRoomHost() || state.started
        : state.started;
      const cpuOption = modeSelectEl.querySelector('option[value="cpu"]');
      const localOption = modeSelectEl.querySelector('option[value="local"]');
      if (cpuOption) cpuOption.textContent = mahjongText("modeCpu");
      if (localOption) localOption.textContent = mahjongText("modeLocal");
    }
    if (difficultySelectEl) {
      difficultySelectEl.value = state.difficultyKey;
      difficultySelectEl.disabled = state.roomMode
        ? !isRoomHost() || state.started
        : state.started;
      const easyOption = difficultySelectEl.querySelector('option[value="easy"]');
      const normalOption = difficultySelectEl.querySelector('option[value="normal"]');
      const hardOption = difficultySelectEl.querySelector('option[value="hard"]');
      const expertOption = difficultySelectEl.querySelector('option[value="expert"]');
      if (easyOption) easyOption.textContent = difficultyLabel("easy");
      if (normalOption) normalOption.textContent = difficultyLabel("normal");
      if (hardOption) hardOption.textContent = difficultyLabel("hard");
      if (expertOption) expertOption.textContent = difficultyLabel("expert");
    }
    if (timeEl) timeEl.textContent = toMmSs(state.timeLeftSec);
    if (assistEl) {
      assistEl.textContent = applyTemplate(mahjongText("assistFmt"), {
        hint: state.hintLeft,
        shuffle: state.shuffleLeft,
      });
    }
    applyScoreCalcTranslations();
    updateRiichiScorePreview();
  }

  function canPlay() {
    if (state.roomLocked) return false;
    if (!state.started) return false;
    if (state.cpuThinking) return false;
    return isCurrentLocalPlayer();
  }

  function composeSnapshot() {
    return {
      started: state.started,
      mode: state.mode,
      roomMode: state.roomMode,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      roomCode: state.roomCode,
      roomPlayer: state.roomPlayer,
      cpuCoopOwner: state.cpuCoopOwner,
      difficultyKey: state.difficultyKey,
      timeLeftSec: state.timeLeftSec,
      hintLeft: state.hintLeft,
      shuffleLeft: state.shuffleLeft,
      currentPlayer: state.currentPlayer,
      scores: { ...state.scores },
      engine: engine.getSnapshot(),
      message: messageEl?.textContent || "",
      overlay: overlayEl?.textContent || "",
      status: statusEl?.textContent || "",
    };
  }

  function emitRoomSync(reason = "sync") {
    if (!state.roomMode) return;
    options.onRoomMove?.({ type: "sync", reason, snapshot: composeSnapshot() });
  }

  function clearPairFx() {
    if (!linkFxEl) return;
    linkFxEl.innerHTML = "";
  }

  function showPairFx(pair) {
    if (!linkFxEl || !pair?.a || !pair?.b || !boardEl) return;
    const fromEl = boardEl.querySelector(`[data-row="${pair.a.row}"][data-col="${pair.a.col}"]`);
    const toEl = boardEl.querySelector(`[data-row="${pair.b.row}"][data-col="${pair.b.col}"]`);
    if (!fromEl || !toEl) return;

    const boardRect = boardEl.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const x1 = (fromRect.left + fromRect.right) * 0.5 - boardRect.left;
    const y1 = (fromRect.top + fromRect.bottom) * 0.5 - boardRect.top;
    const x2 = (toRect.left + toRect.right) * 0.5 - boardRect.left;
    const y2 = (toRect.top + toRect.bottom) * 0.5 - boardRect.top;

    const NS = "http://www.w3.org/2000/svg";
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    line.setAttribute("class", "pair-link");

    linkFxEl.setAttribute("viewBox", `0 0 ${Math.max(1, boardRect.width)} ${Math.max(1, boardRect.height)}`);
    linkFxEl.appendChild(line);
    window.setTimeout(() => {
      if (line.parentNode === linkFxEl) linkFxEl.removeChild(line);
    }, 340);
  }

  function render() {
    renderMahjongBoard({
      boardEl,
      board: engine.board,
      selected: engine.selected,
      onTileClick: handleTileClick,
      disabled: !canPlay(),
    });

    startBtn && (startBtn.disabled = state.roomMode && !isRoomHost());
    shuffleBtn && (shuffleBtn.disabled = !canPlay() || state.shuffleLeft <= 0);
    hintBtn && (hintBtn.disabled = !canPlay() || state.hintLeft <= 0);
  }

  function maybeFinishGame() {
    const remaining = engine.remainingTileCount();
    if (remaining > 0) return false;

    state.started = false;
    clearRoundTimer();
    const p1 = Number(state.scores[PLAYER1] || 0);
    const p2 = Number(state.scores[PLAYER2] || 0);
    let result = mahjongText("resultDraw");
    if (p1 !== p2) {
      const localWin = (state.roomMode && isCpuMode())
        ? p1 > p2
        : state.roomMode
          ? (state.roomPlayer === PLAYER1 ? p1 > p2 : p2 > p1)
          : p1 > p2;
      result = localWin ? mahjongText("resultWin") : mahjongText("resultLose");
    }

    const summary = `${mahjongText("resultPrefix")}: ${result} (P1 ${p1} - P2 ${p2})`;
    updateStatus(summary);
    setOverlay(mahjongText("clear"));
    setMessage(summary);
    return true;
  }

  function handleTimeUp() {
    if (!state.started) return;
    state.started = false;
    clearCpuTimer();
    clearRoundTimer();
    const p1 = Number(state.scores[PLAYER1] || 0);
    const p2 = Number(state.scores[PLAYER2] || 0);
    const localWin = (state.roomMode && isCpuMode())
      ? p1 > p2
      : state.roomMode
        ? (state.roomPlayer === PLAYER1 ? p1 > p2 : p2 > p1)
        : p1 > p2;
    const result = p1 === p2 ? mahjongText("resultDraw") : (localWin ? mahjongText("resultWin") : mahjongText("resultLose"));
    const summary = `${mahjongText("timeout")} / ${mahjongText("resultPrefix")}: ${result} (P1 ${p1} - P2 ${p2})`;
    setOverlay(mahjongText("timeout"));
    setMessage(summary);
    updateStatus(summary);
    render();
    emitRoomSync("timeout");
  }

  function startRoundTimer() {
    clearRoundTimer();
    state.timerId = window.setInterval(() => {
      if (!state.started || state.roomLocked) return;
      state.timeLeftSec = Math.max(0, state.timeLeftSec - 1);
      updateStatus(statusEl?.textContent || "");
      if (state.timeLeftSec <= 0) {
        handleTimeUp();
      }
    }, 1000);
  }

  function maybeRunCpuTurn() {
    clearCpuTimer();
    if (!state.started || state.roomLocked) return;
    if (!isCpuMode()) return;
    if (state.currentPlayer !== PLAYER2) return;
    if (state.roomMode && !isRoomHost()) return;

    state.cpuThinking = true;
    render();

    state.cpuTimerId = window.setTimeout(() => {
      state.cpuTimerId = 0;
      state.cpuThinking = false;
      if (!state.started || state.roomLocked || state.currentPlayer !== PLAYER2) {
        render();
        return;
      }

      let move = engine.getHint();
      if (!move) {
        engine.shuffleRemaining();
        move = engine.getHint();
      }
      if (!move) {
        updateStatus(mahjongText("noHint"));
        render();
        return;
      }

      const result = engine.playPair(move.a, move.b);
      if (!result?.ok) {
        updateStatus(mahjongText("noHint"));
        render();
        return;
      }

      state.scores[PLAYER2] += 1;
      if (!maybeFinishGame()) {
        updateStatus(result.action === "remove+reshuffle" ? mahjongText("removedAndShuffle") : mahjongText("removed"));
        nextPlayer();
        state.cpuCoopOwner = state.cpuCoopOwner === "host" ? "guest" : "host";
        setMessage(turnMessage());
      }
      render();
      showPairFx(result.pair);
      emitRoomSync("cpu-move");
    }, difficultyPreset().cpuThinkMs || CPU_THINK_MS);
  }

  function handleTileClick(row, col) {
    if (!canPlay()) return;
    const result = engine.select(row, col);
    if (!result?.ok) return;

    if (result.action === "remove" || result.action === "remove+reshuffle") {
      state.scores[state.currentPlayer] += 1;
      if (!maybeFinishGame()) {
        updateStatus(result.action === "remove+reshuffle" ? mahjongText("removedAndShuffle") : mahjongText("removed"));
        nextPlayer();
        setMessage(turnMessage());
      }
      render();
      showPairFx(result.pair);
      emitRoomSync("pair");
      maybeRunCpuTurn();
      return;
    } else if (result.action === "blocked") {
      updateStatus(mahjongText("blocked"));
    } else if (result.action === "switch") {
      updateStatus(mahjongText("switched"));
    }

    setMessage(turnMessage());
    render();
  }

  function startNewGame({ fromRemote = false } = {}) {
    clearCpuTimer();
    clearRoundTimer();
    engine.restart();
    state.started = true;
    state.roomLocked = false;
    state.roomLockMessage = "";
    state.currentPlayer = PLAYER1;
    state.cpuCoopOwner = "host";
    state.scores = { 1: 0, 2: 0 };
    state.timeLeftSec = difficultyPreset().timeSec;
    state.hintLeft = difficultyPreset().hintLimit;
    state.shuffleLeft = difficultyPreset().shuffleLimit;
    const skipLocalDice = fromRemote && state.roomMode;
    const openingText = skipLocalDice ? "" : openingDiceResult();
    setOverlay("");
    setMessage(turnMessage());
    updateStatus(openingText ? `${mahjongText("ready")} / ${openingText}` : mahjongText("ready"));
    clearPairFx();
    render();
    if (state.roomMode && !fromRemote) {
      options.onRoomNewGame?.();
    }
    startRoundTimer();
    maybeRunCpuTurn();
  }

  function enterStandby() {
    clearCpuTimer();
    clearRoundTimer();
    engine.restart();
    state.started = false;
    state.currentPlayer = PLAYER1;
    state.cpuCoopOwner = "host";
    state.scores = { 1: 0, 2: 0 };
    state.timeLeftSec = difficultyPreset().timeSec;
    state.hintLeft = difficultyPreset().hintLimit;
    state.shuffleLeft = difficultyPreset().shuffleLimit;
    syncSeatFromPlayerWind();
    setOverlay(mahjongText("standby"));
    setMessage(mahjongText("pushStart"));
    updateStatus(mahjongText("pushStart"));
    clearPairFx();
    render();
  }

  startBtn?.addEventListener("click", () => {
    if (state.roomMode && state.roomRole !== "host") return;
    startNewGame({ fromRemote: false });
  });

  shuffleBtn?.addEventListener("click", () => {
    if (!canPlay()) return;
    if (state.shuffleLeft <= 0) {
      updateStatus(mahjongText("noShuffleLeft"));
      render();
      return;
    }
    const ok = engine.shuffleRemaining();
    state.shuffleLeft = Math.max(0, state.shuffleLeft - 1);
    updateStatus(ok ? mahjongText("shuffled") : mahjongText("noHint"));
    setMessage(turnMessage());
    render();
    emitRoomSync("shuffle");
  });

  hintBtn?.addEventListener("click", () => {
    if (!canPlay()) return;
    if (state.hintLeft <= 0) {
      updateStatus(mahjongText("noHintLeft"));
      render();
      return;
    }
    const hint = engine.getHint();
    if (!hint) {
      updateStatus(mahjongText("noHint"));
      render();
      return;
    }

    state.hintLeft = Math.max(0, state.hintLeft - 1);

    const template = mahjongText("hint");
    updateStatus(applyTemplate(template, {
      a: `(${hint.a.row + 1},${hint.a.col + 1})`,
      b: `(${hint.b.row + 1},${hint.b.col + 1})`,
    }));
    setMessage(turnMessage());
    render();
  });

  scoreCalcBtnEl?.addEventListener("click", () => {
    updateRiichiScorePreview();
  });
  scoreCalcHanEl?.addEventListener("change", updateRiichiScorePreview);
  scoreCalcFuEl?.addEventListener("change", updateRiichiScorePreview);
  scoreCalcSeatEl?.addEventListener("change", updateRiichiScorePreview);
  scoreCalcRoundWindEl?.addEventListener("change", () => {
    updateWindYakuLabels();
    updateRiichiScorePreview();
  });
  scoreCalcPlayerWindEl?.addEventListener("change", () => {
    syncSeatFromPlayerWind();
    updateWindYakuLabels();
    updateRiichiScorePreview();
  });
  scoreCalcWinEl?.addEventListener("change", updateRiichiScorePreview);
  scoreCalcHonbaEl?.addEventListener("input", updateRiichiScorePreview);
  scoreCalcKyotakuEl?.addEventListener("input", updateRiichiScorePreview);
  scoreCalcAutoHanToggleEl?.addEventListener("change", updateRiichiScorePreview);
  scoreCalcOpenHandEl?.addEventListener("change", updateRiichiScorePreview);
  scoreCalcDoraHanEl?.addEventListener("input", updateRiichiScorePreview);
  if (scoreCalcYakuListEl) {
    scoreCalcYakuListEl.addEventListener("change", updateRiichiScorePreview);
  }

  modeSelectEl?.addEventListener("change", () => {
    const nextMode = modeSelectEl.value === "local" ? "local" : "cpu";
    if (state.roomMode && !isRoomHost()) {
      modeSelectEl.value = state.mode;
      return;
    }
    state.mode = nextMode;
    enterStandby();
    if (state.roomMode) {
      emitRoomSync("mode-change");
    }
  });

  difficultySelectEl?.addEventListener("change", () => {
    const next = String(difficultySelectEl.value || "normal");
    if (!MAHJONG_DIFFICULTY[next]) {
      difficultySelectEl.value = state.difficultyKey;
      return;
    }
    if (state.roomMode && !isRoomHost()) {
      difficultySelectEl.value = state.difficultyKey;
      return;
    }
    state.difficultyKey = next;
    rebuildEngineByDifficulty();
    enterStandby();
    if (state.roomMode) {
      emitRoomSync("difficulty-change");
    }
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm(mahjongLang() === "ko" ? "게임 목록으로 돌아갈까요?" : "ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    if (state.roomMode) {
      options.onBackToLobby?.();
    } else {
      options.onBackToMenu?.();
    }
  });

  function applySnapshotInternal(snapshot) {
    clearCpuTimer();
    clearRoundTimer();
    if (!snapshot || typeof snapshot !== "object") return;
    state.started = Boolean(snapshot.started);
    state.mode = snapshot.mode === "local" ? "local" : "cpu";
    state.difficultyKey = MAHJONG_DIFFICULTY[snapshot.difficultyKey] ? snapshot.difficultyKey : state.difficultyKey;
    state.roomMode = Boolean(snapshot.roomMode);
    state.roomLocked = Boolean(snapshot.roomLocked);
    state.roomLockMessage = String(snapshot.roomLockMessage || "");
    state.roomCode = snapshot.roomCode || state.roomCode;
    state.cpuCoopOwner = snapshot.cpuCoopOwner === "guest" ? "guest" : "host";
    state.currentPlayer = snapshot.currentPlayer === PLAYER2 ? PLAYER2 : PLAYER1;
    state.timeLeftSec = Math.max(0, Number(snapshot.timeLeftSec || 0));
    state.hintLeft = Math.max(0, Number(snapshot.hintLeft || 0));
    state.shuffleLeft = Math.max(0, Number(snapshot.shuffleLeft || 0));
    state.scores = {
      1: Number(snapshot.scores?.[1] || 0),
      2: Number(snapshot.scores?.[2] || 0),
    };
    rebuildEngineByDifficulty();
    if (snapshot.engine) {
      engine.applySnapshot(snapshot.engine);
    }
    setMessage(String(snapshot.message || ""));
    setOverlay(String(snapshot.overlay || ""));
    updateStatus(String(snapshot.status || ""));
    render();
    if (state.started) {
      startRoundTimer();
    }
    maybeRunCpuTurn();
  }

  enterStandby();

  return {
    startNewGame,
    enterStandby,
    stop: () => {
      clearCpuTimer();
      clearRoundTimer();
      clearCoopFlashTimer();
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      clearCpuTimer();
      state.roomMode = true;
      state.mode = "cpu";
      state.roomCode = roomCode || null;
      state.roomRole = roomRole || null;
      state.roomPlayer = roomPlayer === PLAYER2 ? PLAYER2 : PLAYER1;
      state.started = false;
      state.currentPlayer = PLAYER1;
      state.cpuCoopOwner = "host";
      state.scores = { 1: 0, 2: 0 };
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      setOverlay(mahjongText("standby"));
      setMessage(mahjongText("waitingRoom"));
      updateStatus(mahjongText("waitingRoom"));
      clearPairFx();
      render();
    },
    configureStandardMode: (mode) => {
      clearCpuTimer();
      state.roomMode = false;
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = PLAYER1;
      state.cpuCoopOwner = "host";
      state.roomLocked = false;
      state.roomLockMessage = "";
      state.mode = mode === "local" ? "local" : "cpu";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      clearPairFx();
      enterStandby();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = String(message || "");
      if (state.roomLocked) {
        const lockText = state.roomLockMessage || mahjongText("waitingRoom");
        setOverlay(lockText);
        setMessage(lockText);
        updateStatus(lockText);
        clearPairFx();
      } else if (state.started) {
        setOverlay("");
        setMessage(turnMessage());
      }
      render();
      maybeRunCpuTurn();
    },
    applyRemoteMove: (payload) => {
      if (!payload || payload.type !== "sync" || !payload.snapshot) return;
      applySnapshotInternal(payload.snapshot);
    },
    getSnapshot: () => composeSnapshot(),
    applySnapshot: applySnapshotInternal,
  };
}
