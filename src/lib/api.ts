const LOCALHOST_API_PREFIXES = ["http://localhost", "http://127.0.0.1", "http://::1"];

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const isBrowser = typeof window !== "undefined";
  const currentOrigin = isBrowser ? window.location.origin : "";

  if (configured) {
    const normalized = normalizeBaseUrl(configured);
    const isLocalhostConfigured = LOCALHOST_API_PREFIXES.some((prefix) => normalized.startsWith(prefix));

    if (!isLocalhostConfigured) {
      return normalized;
    }

    if (isBrowser) {
      const host = window.location.hostname;
      const isLocalPage = host === "localhost" || host === "127.0.0.1" || host === "::1";
      if (!isLocalPage) {
        return normalizeBaseUrl(currentOrigin);
      }
    }

    return normalized;
  }

  if (isBrowser) {
    return normalizeBaseUrl(currentOrigin);
  }

  return "http://localhost:5000";
};

