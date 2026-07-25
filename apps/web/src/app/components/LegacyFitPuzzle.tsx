"use client";

import { useEffect, useRef, useState } from "react";

type UiLanguage = "ja" | "ko" | "en" | "zh";

type LegacyFitPuzzleProps = {
  onBackToMenu?: () => void;
  language: UiLanguage;
  onFitPuzzleProgressRequest?: () => unknown;
  onFitPuzzleProgressSave?: (progress: unknown) => void;
};

type FitPuzzleController = {
  stop?: () => void;
  configureStandardMode?: () => void;
};

const LABELS: Record<UiLanguage, {
  board: string;
  placed: string;
  score: string;
  time: string;
  start: string;
  nextStage: string;
  rotate: string;
  rotateMode: string;
  rotateAllowed: string;
  rotateDisabled: string;
  noRotateOff: string;
  assist: string;
  reset: string;
  menu: string;
  stageList: string;
  difficulty: string;
  easy: string;
  normal: string;
  hard: string;
  stage: string;
  current: string;
  pieces: string;
  startHint: string;
  stageSelect: string;
  close: string;
  boardAria: string;
  stageModalAria: string;
}> = {
  ja: {
    board: "盤面",
    placed: "配置",
    score: "スコア",
    time: "時間",
    start: "ゲーム開始",
    nextStage: "次ステージ",
    rotate: "回転",
    rotateMode: "回転設定",
    rotateAllowed: "回転あり",
    rotateDisabled: "回転なし",
    noRotateOff: "回転なし OFF",
    assist: "アシスト x1",
    reset: "リセット",
    menu: "メニュー",
    stageList: "ステージ一覧",
    difficulty: "難易度",
    easy: "かんたん",
    normal: "ふつう",
    hard: "むずかしい",
    stage: "ステージ",
    current: "現在選択",
    pieces: "ピース一覧",
    startHint: "ゲーム開始でスタート",
    stageSelect: "ステージ選択",
    close: "閉じる",
    boardAria: "フィットパズル盤面",
    stageModalAria: "ステージ選択モーダル",
  },
  ko: {
    board: "보드",
    placed: "배치",
    score: "점수",
    time: "시간",
    start: "게임 시작",
    nextStage: "다음 스테이지",
    rotate: "회전",
    rotateMode: "회전 설정",
    rotateAllowed: "회전 허용",
    rotateDisabled: "회전 없음",
    noRotateOff: "회전 없음 OFF",
    assist: "도움 x1",
    reset: "리셋",
    menu: "메뉴",
    stageList: "스테이지 목록",
    difficulty: "난이도",
    easy: "쉬움",
    normal: "보통",
    hard: "어려움",
    stage: "스테이지",
    current: "현재 선택",
    pieces: "조각 목록",
    startHint: "게임 시작으로 시작",
    stageSelect: "스테이지 선택",
    close: "닫기",
    boardAria: "핏 퍼즐 보드",
    stageModalAria: "스테이지 선택 모달",
  },
  en: {
    board: "Board",
    placed: "Placed",
    score: "Score",
    time: "Time",
    start: "Start",
    nextStage: "Next Stage",
    rotate: "Rotate",
    rotateMode: "Rotation Mode",
    rotateAllowed: "Rotation ON",
    rotateDisabled: "No Rotation",
    noRotateOff: "No Rotation OFF",
    assist: "Assist x1",
    reset: "Reset",
    menu: "Menu",
    stageList: "Stage List",
    difficulty: "Difficulty",
    easy: "Easy",
    normal: "Normal",
    hard: "Hard",
    stage: "Stage",
    current: "Current",
    pieces: "Pieces",
    startHint: "Press Start to begin",
    stageSelect: "Stage Select",
    close: "Close",
    boardAria: "Fit puzzle board",
    stageModalAria: "Stage selection modal",
  },
  zh: {
    board: "棋盘",
    placed: "已放置",
    score: "分数",
    time: "时间",
    start: "开始游戏",
    nextStage: "下一关",
    rotate: "旋转",
    rotateMode: "旋转设置",
    rotateAllowed: "允许旋转",
    rotateDisabled: "不允许旋转",
    noRotateOff: "无旋转 OFF",
    assist: "辅助 x1",
    reset: "重置",
    menu: "菜单",
    stageList: "关卡列表",
    difficulty: "难度",
    easy: "简单",
    normal: "普通",
    hard: "困难",
    stage: "关卡",
    current: "当前选择",
    pieces: "拼块列表",
    startHint: "点击开始游戏后开始",
    stageSelect: "关卡选择",
    close: "关闭",
    boardAria: "拼图棋盘",
    stageModalAria: "关卡选择弹窗",
  },
};

export default function LegacyFitPuzzle({
  onBackToMenu,
  language,
  onFitPuzzleProgressRequest,
  onFitPuzzleProgressSave,
}: LegacyFitPuzzleProps) {
  const labels = LABELS[language] || LABELS.ja;
  const [noRotateEnabled, setNoRotateEnabled] = useState(false);
  const progressRequestRef = useRef<(() => unknown) | undefined>(onFitPuzzleProgressRequest);
  const progressSaveRef = useRef<((progress: unknown) => void) | undefined>(onFitPuzzleProgressSave);

  useEffect(() => {
    progressRequestRef.current = onFitPuzzleProgressRequest;
  }, [onFitPuzzleProgressRequest]);

  useEffect(() => {
    progressSaveRef.current = onFitPuzzleProgressSave;
  }, [onFitPuzzleProgressSave]);

  const syncNoRotateFromLegacyUi = () => {
    const noRotateBtn = document.getElementById("fitPuzzleNoRotateBtn");
    const text = (noRotateBtn?.textContent || "").toLowerCase();
    setNoRotateEnabled(/\bon\b/i.test(text) || text.includes("켬"));
  };

  const requestNoRotateMode = (nextNoRotate: boolean) => {
    const noRotateBtn = document.getElementById("fitPuzzleNoRotateBtn") as HTMLButtonElement | null;
    if (!noRotateBtn) return;
    const text = (noRotateBtn.textContent || "").toLowerCase();
    const currentNoRotate = /\bon\b/i.test(text) || text.includes("켬");
    if (currentNoRotate === nextNoRotate) return;
    noRotateBtn.click();
  };

  useEffect(() => {
    let disposed = false;
    let controller: FitPuzzleController | null = null;

    const boot = async () => {
      const mod = await import("../../../../../src/scripts/fitPuzzle.js");
      if (disposed) return;
      controller = mod.initFitPuzzle({
        onBackToMenu,
        onFitPuzzleProgressRequest: () => progressRequestRef.current?.(),
        onFitPuzzleProgressSave: (progress: unknown) => {
          progressSaveRef.current?.(progress);
        },
      });
      controller?.configureStandardMode?.();
    };

    void boot();

    return () => {
      disposed = true;
      controller?.stop?.();
    };
  }, [onBackToMenu]);

  useEffect(() => {
    syncNoRotateFromLegacyUi();
    const noRotateBtn = document.getElementById("fitPuzzleNoRotateBtn");
    if (!noRotateBtn) return;
    const observer = new MutationObserver(() => {
      syncNoRotateFromLegacyUi();
    });
    observer.observe(noRotateBtn, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="fit-puzzle-wrap rounded-xl border border-cyan-200/25 p-4 md:p-5">
      <section className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-slate-400/30 bg-slate-900/50 px-3 py-2 text-sm text-slate-200">
          <p className="text-xs text-slate-400">{labels.board}</p>
          <p id="fitPuzzleBoardText">-</p>
        </div>
        <div className="rounded-md border border-slate-400/30 bg-slate-900/50 px-3 py-2 text-sm text-slate-200">
          <p className="text-xs text-slate-400">{labels.placed}</p>
          <p id="fitPuzzlePlacedText">0 / 0</p>
        </div>
        <div className="rounded-md border border-slate-400/30 bg-slate-900/50 px-3 py-2 text-sm text-slate-200">
          <p className="text-xs text-slate-400">{labels.score}</p>
          <p id="fitPuzzleScoreText">0000</p>
        </div>
        <div className="rounded-md border border-slate-400/30 bg-slate-900/50 px-3 py-2 text-sm text-slate-200">
          <p className="text-xs text-slate-400">{labels.time}</p>
          <p id="fitPuzzleTimeText">00:00</p>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4 2xl:grid-cols-8">
        <button id="fitPuzzleStartBtn" type="button" className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950">{labels.start}</button>
        <button id="fitPuzzleRotateBtn" type="button" className={`${noRotateEnabled ? "hidden" : ""} rounded-md border border-cyan-200/40 px-3 py-2 text-sm text-slate-200`}>{labels.rotate}</button>
        <div className="col-span-2 rounded-md border border-cyan-200/30 bg-slate-900/45 px-3 py-2 text-sm text-slate-200 lg:col-span-2 2xl:col-span-2">
          <p className="text-xs text-slate-400">{labels.rotateMode}</p>
          <div className="mt-1 flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="fitPuzzleRotateMode"
                checked={!noRotateEnabled}
                onChange={() => requestNoRotateMode(false)}
              />
              <span>{labels.rotateAllowed}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="fitPuzzleRotateMode"
                checked={noRotateEnabled}
                onChange={() => requestNoRotateMode(true)}
              />
              <span>{labels.rotateDisabled}</span>
            </label>
          </div>
          <button id="fitPuzzleNoRotateBtn" type="button" className="hidden" aria-hidden="true" tabIndex={-1}>{labels.noRotateOff}</button>
        </div>
        <button id="fitPuzzleAssistBtn" type="button" className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm text-slate-200">{labels.assist}</button>
        <button id="fitPuzzleResetBtn" type="button" className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm text-slate-200">{labels.reset}</button>
        <button id="fitPuzzleMenuBtn" type="button" className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm text-slate-200">{labels.menu}</button>
        <button id="fitPuzzleStageScreenBtn" type="button" className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm text-slate-200">{labels.stageList}</button>
      </section>

      <section className="mb-4 grid gap-2 md:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_1fr]">
        <label className="grid gap-1 text-sm text-slate-300">
          <span>{labels.difficulty}</span>
          <select id="fitPuzzleDifficultySelect" className="rounded-md border border-slate-500/50 bg-slate-900/70 px-2 py-2 text-sm text-slate-100">
            <option value="easy">{labels.easy}</option>
            <option value="normal">{labels.normal}</option>
            <option value="hard">{labels.hard}</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-slate-300">
          <span>{labels.stage}</span>
          <select id="fitPuzzleStageSelect" className="rounded-md border border-slate-500/50 bg-slate-900/70 px-2 py-2 text-sm text-slate-100" />
        </label>
        <div className="grid gap-1 rounded-md border border-slate-500/40 bg-slate-900/45 px-3 py-2 text-sm text-slate-300">
          <span className="text-xs text-slate-400">{labels.current}</span>
          <p id="fitPuzzleStageCurrentText" className="text-sm text-slate-200" />
        </div>
      </section>

      <section className="fit-puzzle-layout">
        <div id="fitPuzzleBoard" className="fit-puzzle-board" aria-label={labels.boardAria} />
        <div className="grid content-start gap-2">
          <div className="flex justify-end">
            <button id="fitPuzzleNextBtn" type="button" className="rounded-md border border-cyan-200/40 px-2.5 py-1 text-xs text-slate-200">{labels.nextStage}</button>
          </div>
          <div className="fit-puzzle-side">
            <p className="text-xs font-semibold tracking-wide text-slate-300">{labels.pieces}</p>
            <div id="fitPuzzlePieces" className="fit-puzzle-pieces" />
          </div>
        </div>
      </section>

      <p id="fitPuzzleMessage" className="mt-3 text-sm text-slate-200">{labels.startHint}</p>

      <div id="fitPuzzleStageModal" className="fit-stage-modal hidden">
        <div className="fit-stage-modal-card" role="dialog" aria-modal="true" aria-label={labels.stageModalAria}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-100">{labels.stageSelect}</h3>
            <button id="fitPuzzleStageModalCloseBtn" type="button" className="rounded-md border border-slate-400/40 px-2 py-1 text-xs text-slate-200">{labels.close}</button>
          </div>
          <div id="fitPuzzleStageGrid" className="fit-stage-grid" />
        </div>
      </div>
    </section>
  );
}
