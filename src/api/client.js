const API_PROXY_PREFIX = import.meta.env.VITE_API_PROXY_PREFIX || "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const getBaseUrl = () => {
  if (API_PROXY_PREFIX) {
    return API_PROXY_PREFIX;
  }

  return API_BASE_URL;
};

const buildUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getBaseUrl().replace(/\/$/, "");

  return `${baseUrl}${normalizedPath}`;
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      (typeof payload === "string" && payload) ||
      "Request failed";

    throw new Error(message);
  }

  return payload;
};
