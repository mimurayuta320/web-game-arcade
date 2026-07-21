const CLOUD_API_PRIMARY_BASE = window.location.origin;
const CLOUD_API_HOST_FALLBACK_BASE = `${window.location.protocol}//${window.location.hostname || "localhost"}:8787`;
const CLOUD_API_LOCALHOST_FALLBACK_BASE = "http://localhost:8787";

export function cloudApiCandidates() {
  const list = [CLOUD_API_PRIMARY_BASE];

  if (CLOUD_API_HOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE) {
    list.push(CLOUD_API_HOST_FALLBACK_BASE);
  }

  if (
    CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE
    && CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_HOST_FALLBACK_BASE
  ) {
    list.push(CLOUD_API_LOCALHOST_FALLBACK_BASE);
  }

  return list;
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

      if (!res.ok || data?.ok === false) {
        const err = new Error(data?.message || `Cloud API request failed at ${base}`);
        err.code = data?.code || "CLOUD_REQUEST_ERROR";
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
