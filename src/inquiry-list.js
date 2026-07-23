import "./styles/main.css";
import { cloudApiRequestData } from "./scripts/cloudApiClient.js";

const userIdInput = document.getElementById("viewerUserId");
const passwordInput = document.getElementById("viewerPassword");
const limitInput = document.getElementById("viewerLimit");
const loadBtn = document.getElementById("viewerLoadBtn");
const statusEl = document.getElementById("viewerStatus");
const listEl = document.getElementById("viewerList");
let latestItems = [];

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
    listEl.innerHTML = '<p class="room-menu-message">問い合わせはまだありません。</p>';
    return;
  }

  const html = items
    .map((item, index) => {
      const name = escapeHtml(item?.name || "(anonymous)");
      const message = escapeHtml(item?.message || "");
      const url = escapeHtml(item?.url || "-");
      const lang = escapeHtml(item?.lang || "-");
      const submittedAt = escapeHtml(formatDate(item?.submittedAt));

      return `
        <section class="inquiry-item">
          <h3>#${index + 1} ${submittedAt}</h3>
          <p><span class="label">name:</span> ${name}</p>
          <p><span class="label">lang:</span> ${lang}</p>
          <p><span class="label">url:</span> ${url}</p>
          <p><span class="label">message:</span></p>
          <p>${message}</p>
          <button class="start-btn ghost inquiry-delete-btn" type="button" data-id="${escapeHtml(item?.id || "")}">この問い合わせを削除</button>
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
    setStatus("クラウドIDとパスワードを入力してください。");
    return;
  }

  if (loadBtn) loadBtn.disabled = true;
  setStatus("問い合わせ一覧を取得中です...");

  try {
    const data = await cloudApiRequestData("/api/inquiry/list", {
      userId,
      password,
      limit,
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    renderItems(items);
    setStatus(`問い合わせ ${items.length} 件を表示しています。`);
  } catch {
    renderItems([]);
    setStatus("ネットワークエラーが発生しました。");
  } finally {
    if (loadBtn) loadBtn.disabled = false;
  }
}

async function deleteInquiry(inquiryId) {
  const userId = String(userIdInput?.value || "").trim();
  const password = String(passwordInput?.value || "");
  const targetId = String(inquiryId || "").trim();

  if (!userId || !password) {
    setStatus("クラウドIDとパスワードを入力してください。");
    return;
  }
  if (!targetId) {
    setStatus("削除対象のIDが不正です。");
    return;
  }
  if (!window.confirm("この問い合わせを削除します。よろしいですか？")) {
    return;
  }

  setStatus("削除中です...");
  try {
    await cloudApiRequestData("/api/inquiry/delete", { userId, password, id: targetId });

    setStatus("削除しました。最新の一覧を再取得します...");
    void loadInquiryList();
  } catch {
    setStatus("ネットワークエラーが発生しました。");
  }
}

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
