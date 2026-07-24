import "./styles/main.css";
import { cloudApiRequestData } from "./scripts/cloudApiClient.js";

const STORAGE_LANG_KEY = "neon-arcade-lang";
const STORAGE_UI_LANG_KEY = "neon-ui-language";

const messages = {
  ja: {
    pageTitle: "問い合わせ一覧",
    title: "Inquiry Viewer",
    lead: "問い合わせ一覧を確認する管理者向けページです。",
    userIdPlaceholder: "クラウドID",
    passwordPlaceholder: "クラウドパスワード",
    limitPlaceholder: "件数",
    loadBtn: "一覧を取得",
    recentTitle: "Recent Inquiries",
    empty: "問い合わせはまだありません。",
    anonymous: "(anonymous)",
    labelName: "name",
    labelLang: "lang",
    labelUrl: "url",
    labelMessage: "message",
    deleteBtn: "この問い合わせを削除",
    langLabel: "Language",
    authRequired: "クラウドIDとパスワードを入力してください。",
    loading: "問い合わせ一覧を取得中です...",
    loaded: "問い合わせ {count} 件を表示しています。",
    forbidden: "この機能は管理者のみ利用できます。",
    networkError: "ネットワークエラーが発生しました。",
    invalidDeleteTarget: "削除対象のIDが不正です。",
    deleteConfirm: "この問い合わせを削除します。よろしいですか？",
    deleting: "削除中です...",
    deleted: "削除しました。最新の一覧を再取得します...",
  },
  ko: {
    pageTitle: "문의 목록",
    title: "Inquiry Viewer",
    lead: "문의 목록을 확인하는 관리자용 페이지입니다.",
    userIdPlaceholder: "클라우드 ID",
    passwordPlaceholder: "클라우드 비밀번호",
    limitPlaceholder: "건수",
    loadBtn: "목록 불러오기",
    recentTitle: "Recent Inquiries",
    empty: "문의가 아직 없습니다.",
    anonymous: "(anonymous)",
    labelName: "name",
    labelLang: "lang",
    labelUrl: "url",
    labelMessage: "message",
    deleteBtn: "이 문의 삭제",
    langLabel: "Language",
    authRequired: "클라우드 ID와 비밀번호를 입력해 주세요.",
    loading: "문의 목록을 불러오는 중...",
    loaded: "문의 {count}건을 표시 중입니다.",
    forbidden: "이 기능은 관리자만 사용할 수 있습니다.",
    networkError: "네트워크 오류가 발생했습니다.",
    invalidDeleteTarget: "삭제 대상 ID가 잘못되었습니다.",
    deleteConfirm: "이 문의를 삭제하시겠습니까?",
    deleting: "삭제 중...",
    deleted: "삭제했습니다. 최신 목록을 다시 불러옵니다...",
  },
  en: {
    pageTitle: "Inquiry List",
    title: "Inquiry Viewer",
    lead: "Admin page to review submitted inquiries.",
    userIdPlaceholder: "Cloud ID",
    passwordPlaceholder: "Cloud Password",
    limitPlaceholder: "Limit",
    loadBtn: "Load List",
    recentTitle: "Recent Inquiries",
    empty: "No inquiries yet.",
    anonymous: "(anonymous)",
    labelName: "name",
    labelLang: "lang",
    labelUrl: "url",
    labelMessage: "message",
    deleteBtn: "Delete this inquiry",
    langLabel: "Language",
    authRequired: "Please enter cloud ID and password.",
    loading: "Loading inquiries...",
    loaded: "Showing {count} inquiries.",
    forbidden: "This feature is only available to admins.",
    networkError: "A network error occurred.",
    invalidDeleteTarget: "Invalid inquiry id.",
    deleteConfirm: "Delete this inquiry?",
    deleting: "Deleting...",
    deleted: "Deleted. Reloading latest list...",
  },
};

const userIdInput = document.getElementById("viewerUserId");
const passwordInput = document.getElementById("viewerPassword");
const limitInput = document.getElementById("viewerLimit");
const loadBtn = document.getElementById("viewerLoadBtn");
const langLabel = document.getElementById("inquiryViewerLangLabel");
const langSelect = document.getElementById("viewerLangSelect");
const statusEl = document.getElementById("viewerStatus");
const listEl = document.getElementById("viewerList");
const viewerTitle = document.getElementById("inquiryViewerTitle");
const viewerLead = document.getElementById("inquiryViewerLead");
const recentTitle = document.getElementById("inquiryRecentTitle");
let latestItems = [];
let currentLang = "ja";

function readLangFromStorage(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "ja" || value === "ko" || value === "en") return value;
  return "";
}

function resolveLang() {
  const fromArcade = readLangFromStorage(localStorage.getItem(STORAGE_LANG_KEY));
  if (fromArcade) return fromArcade;
  const fromUi = readLangFromStorage(localStorage.getItem(STORAGE_UI_LANG_KEY));
  if (fromUi) return fromUi;
  return "ja";
}

function setLanguage(lang) {
  currentLang = readLangFromStorage(lang) || "ja";
  localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  localStorage.setItem(STORAGE_UI_LANG_KEY, currentLang);
  applyTranslations();
  renderItems(latestItems);
}

function tr(key, vars = {}) {
  const dict = messages[currentLang] || messages.ja;
  let text = String(dict[key] || messages.ja[key] || key);
  Object.entries(vars).forEach(([varKey, varValue]) => {
    text = text.replaceAll(`{${varKey}}`, String(varValue));
  });
  return text;
}

function applyTranslations() {
  if (typeof document !== "undefined") {
    document.title = tr("pageTitle");
    document.documentElement.lang = currentLang;
  }
  if (viewerTitle) viewerTitle.textContent = tr("title");
  if (viewerLead) viewerLead.textContent = tr("lead");
  if (langLabel) langLabel.textContent = tr("langLabel");
  if (userIdInput) userIdInput.placeholder = tr("userIdPlaceholder");
  if (passwordInput) passwordInput.placeholder = tr("passwordPlaceholder");
  if (limitInput) limitInput.placeholder = tr("limitPlaceholder");
  if (loadBtn) loadBtn.textContent = tr("loadBtn");
  if (recentTitle) recentTitle.textContent = tr("recentTitle");
  if (langSelect) langSelect.value = currentLang;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text || "";
}

function normalizeLimit(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(200, Math.floor(n)));
}

function formatDate(isoText) {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ja-JP");
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderItems(items) {
  if (!listEl) return;
  latestItems = Array.isArray(items) ? items : [];
  if (!Array.isArray(items) || items.length === 0) {
    listEl.innerHTML = `<p class="room-menu-message">${escapeHtml(tr("empty"))}</p>`;
    return;
  }

  const html = items
    .map((item, index) => {
      const name = escapeHtml(item?.name || tr("anonymous"));
      const message = escapeHtml(item?.message || "");
      const url = escapeHtml(item?.url || "-");
      const lang = escapeHtml(item?.lang || "-");
      const submittedAt = escapeHtml(formatDate(item?.submittedAt));

      return `
        <section class="inquiry-item">
          <h3>#${index + 1} ${submittedAt}</h3>
          <p><span class="label">${escapeHtml(tr("labelName"))}:</span> ${name}</p>
          <p><span class="label">${escapeHtml(tr("labelLang"))}:</span> ${lang}</p>
          <p><span class="label">${escapeHtml(tr("labelUrl"))}:</span> ${url}</p>
          <p><span class="label">${escapeHtml(tr("labelMessage"))}:</span></p>
          <p>${message}</p>
          <button class="start-btn ghost inquiry-delete-btn" type="button" data-id="${escapeHtml(item?.id || "")}">${escapeHtml(tr("deleteBtn"))}</button>
        </section>
      `;
    })
    .join("\n");

  listEl.innerHTML = html;
}

async function loadInquiryList() {
  const userId = String(userIdInput?.value || "").trim();
  const password = String(passwordInput?.value || "");
  const limit = normalizeLimit(limitInput?.value);

  if (!userId || !password) {
    setStatus(tr("authRequired"));
    return;
  }

  if (loadBtn) loadBtn.disabled = true;
  setStatus(tr("loading"));

  try {
    const data = await cloudApiRequestData("/api/inquiry/list", {
      userId,
      password,
      limit,
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    renderItems(items);
    setStatus(tr("loaded", { count: items.length }));
  } catch (err) {
    renderItems([]);
    if (err?.code === "FORBIDDEN") {
      setStatus(tr("forbidden"));
    } else {
      setStatus(tr("networkError"));
    }
  } finally {
    if (loadBtn) loadBtn.disabled = false;
  }
}

async function deleteInquiry(inquiryId) {
  const userId = String(userIdInput?.value || "").trim();
  const password = String(passwordInput?.value || "");
  const targetId = String(inquiryId || "").trim();

  if (!userId || !password) {
    setStatus(tr("authRequired"));
    return;
  }
  if (!targetId) {
    setStatus(tr("invalidDeleteTarget"));
    return;
  }
  if (!window.confirm(tr("deleteConfirm"))) {
    return;
  }

  setStatus(tr("deleting"));
  try {
    await cloudApiRequestData("/api/inquiry/delete", { userId, password, id: targetId });

    setStatus(tr("deleted"));
    void loadInquiryList();
  } catch (err) {
    if (err?.code === "FORBIDDEN") {
      setStatus(tr("forbidden"));
    } else {
      setStatus(tr("networkError"));
    }
  }
}

setLanguage(resolveLang());

loadBtn?.addEventListener("click", () => {
  void loadInquiryList();
});

listEl?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.classList.contains("inquiry-delete-btn")) return;
  const inquiryId = String(target.dataset.id || "").trim();
  void deleteInquiry(inquiryId);
});

langSelect?.addEventListener("change", () => {
  setLanguage(langSelect.value);
});
