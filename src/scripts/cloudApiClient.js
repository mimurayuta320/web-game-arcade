const CLOUD_API_PRIMARY_BASE = window.location.origin;
const CLOUD_API_HOST_FALLBACK_BASE = `${window.location.protocol}//${window.location.hostname || "localhost"}:8787`;
const CLOUD_API_LOCALHOST_FALLBACK_BASE = "http://localhost:8787";
const CLOUD_API_STORAGE_KEY = "neon-cloud-api-base-url";
const CLOUD_API_QUERY_PARAM_KEY = "cloudApi";

function isMixedContentBlockedUrl(baseUrl) {
  return window.location.protocol === "https:" && String(baseUrl || "").startsWith("http://");
}

function normalizeCloudApiBase(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) ? value : `http://${value}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function resolveCloudApiBase() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = normalizeCloudApiBase(params.get(CLOUD_API_QUERY_PARAM_KEY));
  if (fromQuery) {
    localStorage.setItem(CLOUD_API_STORAGE_KEY, fromQuery);
    return fromQuery;
  }

  const fromStorage = normalizeCloudApiBase(localStorage.getItem(CLOUD_API_STORAGE_KEY));
  if (fromStorage) {
    if (isMixedContentBlockedUrl(fromStorage)) {
      localStorage.removeItem(CLOUD_API_STORAGE_KEY);
      return "";
    }
    return fromStorage;
  }
  return "";
}

export function cloudApiCandidates() {
  const list = [];
  list.push(CLOUD_API_PRIMARY_BASE);

  const preferred = resolveCloudApiBase();
  if (preferred && preferred !== CLOUD_API_PRIMARY_BASE && !isMixedContentBlockedUrl(preferred)) {
    list.push(preferred);
  }

  if (
    CLOUD_API_HOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE
    && !isMixedContentBlockedUrl(CLOUD_API_HOST_FALLBACK_BASE)
  ) {
    list.push(CLOUD_API_HOST_FALLBACK_BASE);
  }

  if (
    CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE
    && CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_HOST_FALLBACK_BASE
    && !isMixedContentBlockedUrl(CLOUD_API_LOCALHOST_FALLBACK_BASE)
  ) {
    list.push(CLOUD_API_LOCALHOST_FALLBACK_BASE);
  }

  return [...new Set(list)];
}

export async function cloudApiRequest(path, payload) {
  let lastError = null;

  for (const base of cloudApiCandidates()) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      // Unknown /api routes can return HTML with 200 from static hosts.
      // Only accept explicit JSON success payloads.
      if (!res.ok || data?.ok !== true) {
        const err = new Error(data?.message || `Cloud API request failed at ${base}`);
        err.code = data?.code || (res.ok ? "INVALID_API_RESPONSE" : "CLOUD_REQUEST_ERROR");
        err.status = res.status;
        lastError = err;
        continue;
      }

      return { res, data };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Cloud API request failed");
}

export async function cloudApiRequestData(path, payload) {
  const { data } = await cloudApiRequest(path, payload);
  return data;
}
