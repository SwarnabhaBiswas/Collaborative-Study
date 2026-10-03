const DEFAULT_TIMEOUT_MS = 15000;

export const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeout || DEFAULT_TIMEOUT_MS
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

export const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_URL;

  if (!baseUrl) {
    throw new Error("VITE_API_URL is missing");
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
};
