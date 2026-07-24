import "./styles/main.css";
import { cloudApiRequestData } from "./scripts/cloudApiClient.js";

const STORAGE_LANG_KEY = "neon-arcade-lang";
const STORAGE_UI_LANG_KEY = "neon-ui-language";
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 200;

const formEl = document.getElementById("inquiryForm");
const nameInput = document.getElementById("inquiryName");
const messageInput = document.getElementById("inquiryMessage");
const sourceInput = document.getElementById("inquirySource");
const counterEl = document.getElementById("inquiryCounter");
const submitBtn = document.getElementById("inquirySubmitBtn");
const statusEl = document.getElementById("inquiryStatus");

function normalizeLang(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "ja" || value === "ko" || value === "en") return value;
  return "ja";
}

function resolveLang() {
  const arcade = String(localStorage.getItem(STORAGE_LANG_KEY) || "").trim().toLowerCase();
  if (arcade === "ja" || arcade === "ko" || arcade === "en") return arcade;
  return normalizeLang(localStorage.getItem(STORAGE_UI_LANG_KEY));
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveSourceUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = String(params.get("source") || "").trim();
  if (isHttpUrl(fromQuery)) return fromQuery;

  const fromReferrer = String(document.referrer || "").trim();
  if (isHttpUrl(fromReferrer)) return fromReferrer;

  return window.location.origin;
}

function setStatus(text, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = text || "";
  statusEl.style.color = isError ? "#ffb4b4" : "";
}

function updateCounter() {
  if (!messageInput || !counterEl) return;
  const length = String(messageInput.value || "").length;
  counterEl.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;
}

function resetFormOnOpen() {
  if (nameInput) nameInput.value = "";
  if (messageInput) messageInput.value = "";
  if (sourceInput) sourceInput.value = resolveSourceUrl();
  setStatus("");
  updateCounter();
}

async function submitInquiry(event) {
  event.preventDefault();

  const name = String(nameInput?.value || "").trim();
  const message = String(messageInput?.value || "").trim();
  const url = String(sourceInput?.value || "").trim();
  const lang = resolveLang();
  const userId = String(localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "").trim();

  if (!message) {
    setStatus("内容を入力してください。", true);
    return;
  }
  if (message.length < MIN_MESSAGE_LENGTH) {
    setStatus(`内容は ${MIN_MESSAGE_LENGTH} 文字以上で入力してください。`, true);
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    setStatus(`内容は ${MAX_MESSAGE_LENGTH} 文字以内で入力してください。`, true);
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  setStatus("送信中です...");

  try {
    await cloudApiRequestData("/api/inquiry/submit", {
      name,
      message,
      url,
      lang,
      userId,
    });

    if (nameInput) nameInput.value = "";
    if (messageInput) messageInput.value = "";
    updateCounter();
    setStatus("送信しました。ご協力ありがとうございます。");
  } catch {
    setStatus("送信に失敗しました。通信状況を確認して再度お試しください。", true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

messageInput?.addEventListener("input", updateCounter);
formEl?.addEventListener("submit", (event) => {
  void submitInquiry(event);
});

window.addEventListener("pageshow", () => {
  resetFormOnOpen();
});

resetFormOnOpen();
