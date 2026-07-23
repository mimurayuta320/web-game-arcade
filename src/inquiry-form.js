import "./styles/main.css";
import { cloudApiRequestData } from "./scripts/cloudApiClient.js";

const STORAGE_NAME_KEY = "neon-inquiry-name";
const STORAGE_LANG_KEY = "neon-arcade-lang";
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const MAX_MESSAGE_LENGTH = 2000;

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

async function submitInquiry(event) {
  event.preventDefault();

  const name = String(nameInput?.value || "").trim();
  const message = String(messageInput?.value || "").trim();
  const url = String(sourceInput?.value || "").trim();
  const lang = normalizeLang(localStorage.getItem(STORAGE_LANG_KEY));
  const userId = String(localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "").trim();

  if (!message) {
    setStatus("内容を入力してください。", true);
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

    localStorage.setItem(STORAGE_NAME_KEY, name);
    if (messageInput) messageInput.value = "";
    updateCounter();
    setStatus("送信しました。ご協力ありがとうございます。");
  } catch {
    setStatus("送信に失敗しました。通信状況を確認して再度お試しください。", true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

if (nameInput) {
  nameInput.value = String(localStorage.getItem(STORAGE_NAME_KEY) || "");
}
if (sourceInput) {
  sourceInput.value = resolveSourceUrl();
}

messageInput?.addEventListener("input", updateCounter);
formEl?.addEventListener("submit", (event) => {
  void submitInquiry(event);
});

updateCounter();
