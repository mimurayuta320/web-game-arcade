import "./styles/main.css";
import { cloudApiRequestData } from "./scripts/cloudApiClient.js";

const STORAGE_LANG_KEY = "neon-arcade-lang";
const STORAGE_UI_LANG_KEY = "neon-ui-language";
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const STORAGE_CLOUD_PASSWORD_KEY = "neon-cloud-password";
const STORAGE_PLAYER_NAME_KEY = "neon-player-name";
const MAX_AVATAR_DATA_URL_LENGTH = 180000;
const MAX_AVATAR_FILE_SIZE = 120 * 1024;

const DEFAULT_PROFILE = {
  bankCoins: 0,
  pityCounter: 0,
  unlockedSkins: ["classic"],
  selectedSkin: "classic",
  playerName: "Player",
  playerAvatar: "",
  matchStats: {
    total: 0,
    win: 0,
    lose: 0,
    draw: 0,
    byGame: {},
  },
  recentMatches: [],
};

const messages = {
  ja: {
    pageTitle: "プロフィール",
    title: "Profile",
    lead: "プレイヤー名とアバターを設定し、戦績を確認できます。",
    userIdLabel: "クラウドID",
    playerNameLabel: "プレイヤー名",
    playerNamePlaceholder: "あなたの名前",
    avatarLabel: "アバター画像",
    avatarClear: "アバター削除",
    save: "保存",
    reload: "再読込",
    logout: "ログアウト",
    backToGame: "ゲームに戻る",
    statsTitle: "戦績",
    recentTitle: "最近の対戦",
    modeCloud: "クラウド接続中: プロフィールはクラウドに保存されます。",
    modeGuest: "ゲストモード: プレイヤー名のみローカル保存できます。",
    noLogin: "(未ログイン)",
    statsTotal: "総試合数",
    statsWin: "勝利",
    statsLose: "敗北",
    statsDraw: "引分",
    statsWinRate: "勝率",
    noRecent: "まだ試合履歴はありません",
    recentRow: "{when} | {game} | {result} | 相手: {opponent} | Room: {roomCode}",
    resultWin: "勝利",
    resultLose: "敗北",
    resultDraw: "引分",
    guestLoaded: "ゲスト情報を表示しています。",
    loadingProfile: "プロフィールを読み込み中...",
    loadedProfile: "プロフィールを読み込みました。",
    loadProfileFailed: "プロフィールの読み込みに失敗しました。",
    localSavedOnly: "プレイヤー名をローカル保存しました。クラウド保存にはログインが必要です。",
    saving: "保存中...",
    savedProfile: "プロフィールを保存しました。",
    saveProfileFailed: "保存に失敗しました。時間をおいて再試行してください。",
    avatarCleared: "アバターを削除しました。保存すると反映されます。",
    avatarTypeError: "PNG/JPEG/WebP/GIF 画像のみアップロードできます。",
    avatarSizeError: "画像サイズが大きすぎます。120KB以下にしてください。",
    avatarReadFailed: "画像の読み込みに失敗しました。",
    avatarLoaded: "アバターを読み込みました。保存すると反映されます。",
    loggedOut: "ログアウトしました。",
  },
  ko: {
    pageTitle: "프로필",
    title: "Profile",
    lead: "플레이어 이름과 아바타를 설정하고 전적을 확인할 수 있습니다.",
    userIdLabel: "클라우드 ID",
    playerNameLabel: "플레이어 이름",
    playerNamePlaceholder: "내 이름",
    avatarLabel: "아바타 이미지",
    avatarClear: "아바타 삭제",
    save: "저장",
    reload: "새로고침",
    logout: "로그아웃",
    backToGame: "게임으로 돌아가기",
    statsTitle: "전적",
    recentTitle: "최근 경기",
    modeCloud: "클라우드 연결됨: 프로필이 클라우드에 저장됩니다.",
    modeGuest: "게스트 모드: 플레이어 이름만 로컬에 저장할 수 있습니다.",
    noLogin: "(미로그인)",
    statsTotal: "총 경기 수",
    statsWin: "승리",
    statsLose: "패배",
    statsDraw: "무승부",
    statsWinRate: "승률",
    noRecent: "아직 경기 기록이 없습니다",
    recentRow: "{when} | {game} | {result} | 상대: {opponent} | Room: {roomCode}",
    resultWin: "승리",
    resultLose: "패배",
    resultDraw: "무승부",
    guestLoaded: "게스트 정보를 표시하고 있습니다.",
    loadingProfile: "프로필을 불러오는 중...",
    loadedProfile: "프로필을 불러왔습니다.",
    loadProfileFailed: "프로필 불러오기에 실패했습니다.",
    localSavedOnly: "플레이어 이름을 로컬에 저장했습니다. 클라우드 저장은 로그인이 필요합니다.",
    saving: "저장 중...",
    savedProfile: "프로필을 저장했습니다.",
    saveProfileFailed: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    avatarCleared: "아바타를 삭제했습니다. 저장하면 반영됩니다.",
    avatarTypeError: "PNG/JPEG/WebP/GIF 이미지 파일만 업로드할 수 있습니다.",
    avatarSizeError: "이미지 크기가 너무 큽니다. 120KB 이하로 맞춰 주세요.",
    avatarReadFailed: "이미지 읽기에 실패했습니다.",
    avatarLoaded: "아바타를 불러왔습니다. 저장하면 반영됩니다.",
    loggedOut: "로그아웃했습니다.",
  },
  en: {
    pageTitle: "Profile",
    title: "Profile",
    lead: "Set your player name and avatar, then check your match stats.",
    userIdLabel: "Cloud ID",
    playerNameLabel: "Player Name",
    playerNamePlaceholder: "Your name",
    avatarLabel: "Avatar Image",
    avatarClear: "Clear Avatar",
    save: "Save",
    reload: "Reload",
    logout: "Logout",
    backToGame: "Back to Game",
    statsTitle: "Stats",
    recentTitle: "Recent Matches",
    modeCloud: "Cloud connected: your profile will be saved to cloud.",
    modeGuest: "Guest mode: only player name can be saved locally.",
    noLogin: "(Not logged in)",
    statsTotal: "Total Matches",
    statsWin: "Wins",
    statsLose: "Losses",
    statsDraw: "Draws",
    statsWinRate: "Win Rate",
    noRecent: "No recent matches yet",
    recentRow: "{when} | {game} | {result} | Opponent: {opponent} | Room: {roomCode}",
    resultWin: "Win",
    resultLose: "Lose",
    resultDraw: "Draw",
    guestLoaded: "Showing guest profile.",
    loadingProfile: "Loading profile...",
    loadedProfile: "Profile loaded.",
    loadProfileFailed: "Failed to load profile.",
    localSavedOnly: "Saved player name locally. Login is required for cloud save.",
    saving: "Saving...",
    savedProfile: "Profile saved.",
    saveProfileFailed: "Failed to save profile. Please try again later.",
    avatarCleared: "Avatar cleared. Save to apply changes.",
    avatarTypeError: "Only PNG/JPEG/WebP/GIF images are allowed.",
    avatarSizeError: "Image is too large. Please keep it under 120KB.",
    avatarReadFailed: "Failed to read image.",
    avatarLoaded: "Avatar loaded. Save to apply changes.",
    loggedOut: "Logged out.",
  },
};

const profileForm = document.getElementById("profileForm");
const profileUserIdInput = document.getElementById("profileUserId");
const profileTitle = document.getElementById("profileTitle");
const profileLead = document.getElementById("profileLead");
const profileUserIdLabel = document.getElementById("profileUserIdLabel");
const profilePlayerNameLabel = document.getElementById("profilePlayerNameLabel");
const profileAvatarLabel = document.getElementById("profileAvatarLabel");
const playerNameInput = document.getElementById("profilePlayerName");
const avatarFileInput = document.getElementById("profileAvatarFile");
const avatarPreview = document.getElementById("profileAvatarPreview");
const avatarPlaceholder = document.getElementById("profileAvatarPlaceholder");
const avatarClearBtn = document.getElementById("profileAvatarClearBtn");
const modeText = document.getElementById("profileModeText");
const statusText = document.getElementById("profileStatus");
const saveBtn = document.getElementById("profileSaveBtn");
const reloadBtn = document.getElementById("profileReloadBtn");
const logoutBtn = document.getElementById("profileLogoutBtn");
const backLink = document.getElementById("profileBackLink");
const profileStatsTitle = document.getElementById("profileStatsTitle");
const profileRecentTitle = document.getElementById("profileRecentTitle");
const statsList = document.getElementById("profileStatsList");
const recentList = document.getElementById("profileRecentList");

let currentProfile = cloneProfile(DEFAULT_PROFILE);
let currentLang = "ja";

function normalizeLang(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "ja" || value === "ko" || value === "en") return value;
  return "ja";
}

function readLangFromStorage(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "ja" || value === "ko" || value === "en") return value;
  return "";
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
  if (profileTitle) profileTitle.textContent = tr("title");
  if (profileLead) profileLead.textContent = tr("lead");
  if (profileUserIdLabel) profileUserIdLabel.textContent = tr("userIdLabel");
  if (profilePlayerNameLabel) profilePlayerNameLabel.textContent = tr("playerNameLabel");
  if (profileAvatarLabel) profileAvatarLabel.textContent = tr("avatarLabel");
  if (playerNameInput) playerNameInput.placeholder = tr("playerNamePlaceholder");
  if (avatarClearBtn) avatarClearBtn.textContent = tr("avatarClear");
  if (saveBtn) saveBtn.textContent = tr("save");
  if (reloadBtn) reloadBtn.textContent = tr("reload");
  if (logoutBtn) logoutBtn.textContent = tr("logout");
  if (backLink) backLink.textContent = tr("backToGame");
  if (profileStatsTitle) profileStatsTitle.textContent = tr("statsTitle");
  if (profileRecentTitle) profileRecentTitle.textContent = tr("recentTitle");
}

function normalizeName(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Player";
  return trimmed.slice(0, 18);
}

function normalizeAvatarDataUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.length > MAX_AVATAR_DATA_URL_LENGTH) return "";
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return "";
  return value;
}

function numberOr(value, fallback = 0) {
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function cloneProfile(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  const matchStats = source.matchStats && typeof source.matchStats === "object" ? source.matchStats : {};

  return {
    bankCoins: Math.max(0, numberOr(source.bankCoins, 0)),
    pityCounter: Math.max(0, Math.min(9, numberOr(source.pityCounter, 0))),
    unlockedSkins: Array.isArray(source.unlockedSkins) ? source.unlockedSkins.filter((row) => typeof row === "string") : ["classic"],
    selectedSkin: typeof source.selectedSkin === "string" ? source.selectedSkin : "classic",
    playerName: normalizeName(source.playerName || "Player"),
    playerAvatar: normalizeAvatarDataUrl(source.playerAvatar),
    matchStats: {
      total: Math.max(0, numberOr(matchStats.total, 0)),
      win: Math.max(0, numberOr(matchStats.win, 0)),
      lose: Math.max(0, numberOr(matchStats.lose, 0)),
      draw: Math.max(0, numberOr(matchStats.draw, 0)),
      byGame: matchStats.byGame && typeof matchStats.byGame === "object" ? matchStats.byGame : {},
    },
    recentMatches: Array.isArray(source.recentMatches) ? source.recentMatches.slice(0, 60) : [],
  };
}

function getCloudAuth() {
  const userId = String(localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "").trim();
  const password = String(localStorage.getItem(STORAGE_CLOUD_PASSWORD_KEY) || "");
  if (!userId || !password) return null;
  return { userId, password };
}

function setStatus(text, isError = false) {
  if (!statusText) return;
  statusText.textContent = text || "";
  statusText.style.color = isError ? "#ffb4b4" : "";
}

function setBusy(busy) {
  if (saveBtn) saveBtn.disabled = busy;
  if (reloadBtn) reloadBtn.disabled = busy;
}

function setAvatarPreview(dataUrl) {
  const avatar = normalizeAvatarDataUrl(dataUrl);
  if (avatar && avatarPreview && avatarPlaceholder) {
    avatarPreview.src = avatar;
    avatarPreview.classList.remove("hidden");
    avatarPlaceholder.classList.add("hidden");
    return;
  }
  if (avatarPreview && avatarPlaceholder) {
    avatarPreview.removeAttribute("src");
    avatarPreview.classList.add("hidden");
    avatarPlaceholder.classList.remove("hidden");
  }
}

function formatPlayedAt(epochMs) {
  const value = Number(epochMs);
  if (!Number.isFinite(value) || value <= 0) return "-";
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

function formatResultLabel(result) {
  const value = String(result || "").toLowerCase();
  if (value === "win") return tr("resultWin");
  if (value === "lose") return tr("resultLose");
  if (value === "draw") return tr("resultDraw");
  return "-";
}

function renderStats(profile) {
  if (!statsList) return;
  const total = Math.max(0, numberOr(profile?.matchStats?.total, 0));
  const win = Math.max(0, numberOr(profile?.matchStats?.win, 0));
  const lose = Math.max(0, numberOr(profile?.matchStats?.lose, 0));
  const draw = Math.max(0, numberOr(profile?.matchStats?.draw, 0));
  const winRate = total > 0 ? ((win / total) * 100).toFixed(1) : "0.0";
  statsList.innerHTML = "";

  const rows = [
    `${tr("statsTotal")}: ${total}`,
    `${tr("statsWin")}: ${win}`,
    `${tr("statsLose")}: ${lose}`,
    `${tr("statsDraw")}: ${draw}`,
    `${tr("statsWinRate")}: ${winRate}%`,
  ];

  rows.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    statsList.appendChild(li);
  });
}

function renderRecentMatches(profile) {
  if (!recentList) return;
  recentList.innerHTML = "";
  const rows = Array.isArray(profile?.recentMatches) ? profile.recentMatches : [];
  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = tr("noRecent");
    recentList.appendChild(li);
    return;
  }

  rows.slice(0, 20).forEach((row) => {
    const li = document.createElement("li");
    const game = String(row?.game || "-");
    const result = formatResultLabel(row?.result);
    const when = formatPlayedAt(row?.playedAt);
    const roomCode = String(row?.roomCode || "-");
    const opponent = String(row?.opponent || "-");
    li.textContent = tr("recentRow", {
      when,
      game,
      result,
      opponent,
      roomCode,
    });
    recentList.appendChild(li);
  });
}

function renderProfile(profile) {
  const safe = cloneProfile(profile);
  currentProfile = safe;

  if (playerNameInput) playerNameInput.value = safe.playerName;
  setAvatarPreview(safe.playerAvatar);
  renderStats(safe);
  renderRecentMatches(safe);

  localStorage.setItem(STORAGE_PLAYER_NAME_KEY, safe.playerName);
}

function updateModeUi(auth) {
  if (!modeText) return;
  if (auth) {
    modeText.textContent = tr("modeCloud");
    if (profileUserIdInput) profileUserIdInput.value = auth.userId;
    if (logoutBtn) logoutBtn.disabled = false;
    return;
  }
  modeText.textContent = tr("modeGuest");
  if (profileUserIdInput) profileUserIdInput.value = tr("noLogin");
  if (logoutBtn) logoutBtn.disabled = true;
}

async function loadProfile() {
  const auth = getCloudAuth();
  updateModeUi(auth);

  if (!auth) {
    const localName = normalizeName(localStorage.getItem(STORAGE_PLAYER_NAME_KEY) || "Player");
    renderProfile({ ...DEFAULT_PROFILE, playerName: localName });
    setStatus(tr("guestLoaded"));
    return;
  }

  setBusy(true);
  setStatus(tr("loadingProfile"));
  try {
    const data = await cloudApiRequestData("/api/profile/load", {
      userId: auth.userId,
      password: auth.password,
    });
    renderProfile(data?.profile || DEFAULT_PROFILE);
    setStatus(tr("loadedProfile"));
  } catch {
    setStatus(tr("loadProfileFailed"), true);
  } finally {
    setBusy(false);
  }
}

async function saveProfile(event) {
  event.preventDefault();
  const auth = getCloudAuth();
  const name = normalizeName(playerNameInput?.value || "Player");

  const nextProfile = {
    ...currentProfile,
    playerName: name,
    playerAvatar: normalizeAvatarDataUrl(currentProfile.playerAvatar),
  };

  localStorage.setItem(STORAGE_PLAYER_NAME_KEY, name);

  if (!auth) {
    renderProfile(nextProfile);
    setStatus(tr("localSavedOnly"));
    return;
  }

  setBusy(true);
  setStatus(tr("saving"));
  try {
    const data = await cloudApiRequestData("/api/profile/save", {
      userId: auth.userId,
      password: auth.password,
      profile: nextProfile,
    });
    renderProfile(data?.profile || nextProfile);
    setStatus(tr("savedProfile"));
  } catch {
    setStatus(tr("saveProfileFailed"), true);
  } finally {
    setBusy(false);
  }
}

function clearAvatar() {
  currentProfile = {
    ...currentProfile,
    playerAvatar: "",
  };
  if (avatarFileInput) avatarFileInput.value = "";
  setAvatarPreview("");
  setStatus(tr("avatarCleared"));
}

function handleAvatarFileChange() {
  const file = avatarFileInput?.files?.[0];
  if (!file) return;

  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
    setStatus(tr("avatarTypeError"), true);
    if (avatarFileInput) avatarFileInput.value = "";
    return;
  }
  if (file.size > MAX_AVATAR_FILE_SIZE) {
    setStatus(tr("avatarSizeError"), true);
    if (avatarFileInput) avatarFileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = normalizeAvatarDataUrl(reader.result);
    if (!dataUrl) {
      setStatus(tr("avatarReadFailed"), true);
      return;
    }
    currentProfile = {
      ...currentProfile,
      playerAvatar: dataUrl,
    };
    setAvatarPreview(dataUrl);
    setStatus(tr("avatarLoaded"));
  };
  reader.onerror = () => {
    setStatus(tr("avatarReadFailed"), true);
  };
  reader.readAsDataURL(file);
}

function logoutCloud() {
  localStorage.removeItem(STORAGE_CLOUD_USER_ID_KEY);
  localStorage.removeItem(STORAGE_CLOUD_PASSWORD_KEY);
  setStatus(tr("loggedOut"), false);
  void loadProfile();
}

function resolveLang() {
  const fromArcadeStorage = readLangFromStorage(localStorage.getItem(STORAGE_LANG_KEY));
  if (fromArcadeStorage) return fromArcadeStorage;
  const fromUiStorage = readLangFromStorage(localStorage.getItem(STORAGE_UI_LANG_KEY));
  if (fromUiStorage) return fromUiStorage;
  return "ja";
}

profileForm?.addEventListener("submit", (event) => {
  void saveProfile(event);
});
avatarFileInput?.addEventListener("change", handleAvatarFileChange);
avatarClearBtn?.addEventListener("click", clearAvatar);
reloadBtn?.addEventListener("click", () => {
  void loadProfile();
});
logoutBtn?.addEventListener("click", logoutCloud);

currentLang = resolveLang();
applyTranslations();
void loadProfile();
