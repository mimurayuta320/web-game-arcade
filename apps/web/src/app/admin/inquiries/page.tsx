"use client";

import { useMemo, useState } from "react";

type InquiryItem = {
  id?: string;
  name?: string;
  message?: string;
  url?: string;
  lang?: string;
  userId?: string;
  submittedAt?: string;
};

const MAX_LIMIT = 200;
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const STORAGE_CLOUD_PASSWORD_KEY = "neon-cloud-password";
const STORAGE_CLOUD_SESSION_ID_KEY = "neon-cloud-session-id";

type ViewerLabels = {
  title: string;
  lead: string;
  limit: string;
  load: string;
  loading: string;
  deleteItem: string;
  deleteConfirm: string;
  backToMenu: string;
  authRequired: string;
  forbidden: string;
  loadFailed: string;
  deleteFailed: string;
  deleteDone: string;
  deleting: string;
  empty: string;
  showing: string;
};

const LABELS: ViewerLabels = {
  title: "問い合わせ管理ページ",
  lead: "管理者アカウントのみ一覧表示・削除ができます。",
  limit: "表示件数 (1-200)",
  load: "問い合わせ一覧を取得",
  loading: "問い合わせ一覧を取得中です...",
  deleteItem: "この問い合わせを削除",
  deleteConfirm: "この問い合わせを削除します。よろしいですか？",
  backToMenu: "メニューに戻る",
  authRequired: "先にメニュー画面でクラウドログインしてください。",
  forbidden: "この機能は管理者のみ利用できます。",
  loadFailed: "問い合わせ一覧の取得に失敗しました。",
  deleteFailed: "問い合わせの削除に失敗しました。",
  deleteDone: "問い合わせを削除しました。",
  deleting: "削除中です...",
  empty: "問い合わせはまだありません。",
  showing: "問い合わせ {count} 件を表示中です。",
};

function normalizeLimit(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(n)));
}

function formatDate(isoText: string | undefined) {
  const date = new Date(String(isoText || ""));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ja-JP");
}

export default function AdminInquiryViewerPage() {
  const [limit, setLimit] = useState("50");
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canLoad = useMemo(() => !isLoading, [isLoading]);

  const handleBackToMenu = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/arcade";
  };

  const readCloudAuth = () => {
    if (typeof window === "undefined") {
      return { userId: "", password: "", sessionId: "" };
    }
    return {
      userId: String(localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "").trim(),
      password: String(localStorage.getItem(STORAGE_CLOUD_PASSWORD_KEY) || ""),
      sessionId: String(localStorage.getItem(STORAGE_CLOUD_SESSION_ID_KEY) || "").trim(),
    };
  };

  const loadList = async () => {
    const auth = readCloudAuth();
    if (!auth.userId || !auth.password) {
      setStatus(LABELS.authRequired);
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setStatus(LABELS.loading);
    setIsError(false);

    try {
      const response = await fetch("/api/inquiry/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.userId,
          password: auth.password,
          sessionId: auth.sessionId,
          limit: normalizeLimit(limit),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        message?: string;
        items?: InquiryItem[];
      };

      if (!response.ok || data.ok !== true) {
        if (data.code === "FORBIDDEN") {
          setStatus(LABELS.forbidden);
        } else {
          setStatus(data.message || LABELS.loadFailed);
        }
        setIsError(true);
        setItems([]);
        return;
      }

      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);
      setStatus(LABELS.showing.replace("{count}", String(nextItems.length)));
      setIsError(false);
    } catch {
      setStatus(LABELS.loadFailed);
      setIsError(true);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!id) return;
    if (!window.confirm(LABELS.deleteConfirm)) return;

    const auth = readCloudAuth();
    if (!auth.userId || !auth.password) {
      setStatus(LABELS.authRequired);
      setIsError(true);
      return;
    }

    setStatus(LABELS.deleting);
    setIsError(false);
    try {
      const response = await fetch("/api/inquiry/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.userId,
          password: auth.password,
          sessionId: auth.sessionId,
          id,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        message?: string;
      };

      if (!response.ok || data.ok !== true) {
        if (data.code === "FORBIDDEN") {
          setStatus(LABELS.forbidden);
        } else {
          setStatus(data.message || LABELS.deleteFailed);
        }
        setIsError(true);
        return;
      }

      setStatus(LABELS.deleteDone);
      setIsError(false);
      await loadList();
    } catch {
      setStatus(LABELS.deleteFailed);
      setIsError(true);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#16213a_0%,#0d1324_45%,#090d18_100%)] px-5 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
          <h1 className="text-2xl font-bold tracking-tight">{LABELS.title}</h1>
          <p className="mt-2 text-sm text-slate-300">{LABELS.lead}</p>
        </header>

        <section className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
          <label className="grid gap-1 text-sm sm:max-w-xs">
            <span>{LABELS.limit}</span>
            <input
              type="number"
              min={1}
              max={MAX_LIMIT}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void loadList();
              }}
              disabled={!canLoad}
              className="rounded-lg border border-amber-300/40 bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
            >
              {isLoading ? LABELS.loading : LABELS.load}
            </button>
            <button
              type="button"
              onClick={handleBackToMenu}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {LABELS.backToMenu}
            </button>
          </div>

          {status ? (
            <p className={`mt-3 text-sm ${isError ? "text-rose-300" : "text-cyan-200"}`}>
              {status}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          {items.length === 0 ? (
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-sm text-slate-300">
              {LABELS.empty}
            </article>
          ) : (
            items.map((item, index) => (
              <article
                key={item.id || `inquiry-${index}`}
                className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                    #{index + 1} {formatDate(item.submittedAt)}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteItem(String(item.id || ""));
                    }}
                    className="rounded-md border border-rose-300/40 px-3 py-1 text-xs"
                  >
                    {LABELS.deleteItem}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-300">name: {item.name || "anonymous"}</p>
                <p className="mt-1 text-xs text-slate-300">lang: {item.lang || "-"}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.message || ""}</p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
