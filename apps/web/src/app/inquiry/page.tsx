"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Language = "ja" | "ko" | "en";

const STORAGE_UI_LANGUAGE_KEY = "neon-ui-language";
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 200;

const LABELS: Record<Language, {
  title: string;
  lead: string;
  name: string;
  message: string;
  send: string;
  sending: string;
  back: string;
  success: string;
  emptyError: string;
  minLengthError: string;
  lengthError: string;
  submitError: string;
}> = {
  ja: {
    title: "問い合わせフォーム",
    lead: "ご意見・不具合報告をこちらから送信できます。",
    name: "お名前（任意）",
    message: "内容",
    send: "送信する",
    sending: "送信中...",
    back: "メニューへ戻る",
    success: "送信しました。ご協力ありがとうございます。",
    emptyError: "内容を入力してください。",
    minLengthError: `内容は ${MIN_MESSAGE_LENGTH} 文字以上で入力してください。`,
    lengthError: `内容は ${MAX_MESSAGE_LENGTH} 文字以内で入力してください。`,
    submitError: "送信に失敗しました。通信状況を確認して再度お試しください。",
  },
  ko: {
    title: "문의 폼",
    lead: "의견 및 버그 제보를 보낼 수 있습니다.",
    name: "이름 (선택)",
    message: "내용",
    send: "보내기",
    sending: "전송 중...",
    back: "메뉴로 돌아가기",
    success: "전송되었습니다. 감사합니다.",
    emptyError: "내용을 입력해 주세요.",
    minLengthError: `${MIN_MESSAGE_LENGTH}자 이상 입력해 주세요.`,
    lengthError: `${MAX_MESSAGE_LENGTH}자 이내로 입력해 주세요.`,
    submitError: "전송에 실패했습니다. 네트워크 상태를 확인해 주세요.",
  },
  en: {
    title: "Inquiry Form",
    lead: "Send feedback or bug reports from here.",
    name: "Name (optional)",
    message: "Message",
    send: "Send",
    sending: "Sending...",
    back: "Back to Menu",
    success: "Submitted. Thank you for your feedback.",
    emptyError: "Please enter a message.",
    minLengthError: `Please enter at least ${MIN_MESSAGE_LENGTH} characters.`,
    lengthError: `Please keep your message within ${MAX_MESSAGE_LENGTH} characters.`,
    submitError: "Submission failed. Please check your connection and try again.",
  },
};

function normalizeLanguage(value: string | null): Language {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "ja" || raw === "ko" || raw === "en") return raw;
  return "ja";
}

export default function InquiryPage() {
  const [language, setLanguage] = useState<Language>("ja");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextLanguage = normalizeLanguage(localStorage.getItem(STORAGE_UI_LANGUAGE_KEY));
    setLanguage(nextLanguage);
    setName("");
  }, []);

  const labels = useMemo(() => LABELS[language], [language]);

  const handleBackToMenu = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    const trimmedName = name.trim();
    const userId = String(localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "").trim();

    if (!trimmedMessage) {
      setStatus(labels.emptyError);
      setIsError(true);
      return;
    }
    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setStatus(labels.minLengthError);
      setIsError(true);
      return;
    }
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setStatus(labels.lengthError);
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    setStatus(labels.sending);
    setIsError(false);

    try {
      const response = await fetch("/api/inquiry/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          message: trimmedMessage,
          lang: language,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      setName("");
      setMessage("");
      setStatus(labels.success);
      setIsError(false);
    } catch {
      setStatus(labels.submitError);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#16213a_0%,#0d1324_45%,#090d18_100%)] px-5 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
          <h1 className="text-2xl font-bold tracking-tight">{labels.title}</h1>
          <p className="mt-2 text-sm text-slate-300">{labels.lead}</p>
        </header>

        <section className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm">
              <span>{labels.name}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 36))}
                maxLength={36}
                className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                placeholder="Player"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span>{labels.message}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                minLength={MIN_MESSAGE_LENGTH}
                maxLength={MAX_MESSAGE_LENGTH}
                required
                className="min-h-44 rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                placeholder="..."
              />
            </label>

            <p className="text-right text-xs text-slate-300">{message.length} / {MAX_MESSAGE_LENGTH}</p>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg border border-amber-300/40 bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                {isSubmitting ? labels.sending : labels.send}
              </button>
              <button
                type="button"
                onClick={handleBackToMenu}
                className="rounded-lg border border-cyan-200/40 px-4 py-2 text-sm"
              >
                {labels.back}
              </button>
            </div>

            {status ? (
              <p className={`text-sm ${isError ? "text-rose-300" : "text-cyan-200"}`}>
                {status}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
