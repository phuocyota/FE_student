const RAW_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const RAW_API_PREFIX = import.meta.env.VITE_API_PREFIX || "";

const normalizeBaseUrl = (url) => url.replace(/\/$/, "");

export const BASE_URL = normalizeBaseUrl(RAW_BASE_URL);

const API_PREFIX = normalizeBaseUrl(RAW_API_PREFIX);

export const API_BASE_URL = API_PREFIX
  ? `${BASE_URL}${API_PREFIX}`
  : BASE_URL;

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
};

export const buildAssetUrl = (path) => {
  if (!path) return "";

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${BASE_URL}${normalizedPath}`;
};

// export const buildAssetUrl = (path) => {
//   if (!path) return "";

//   // fix thiếu dấu /
//   if (!path.startsWith("/")) {
//     path = "/" + path;
//   }

//   return `${BASE_URL}${path}`;
// };

export const fetch = async (
  url,
  options = {},
  token = localStorage.getItem("accessToken")
) => {
  return window.fetch(url, {
    cache: options.cache || "no-store",
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
};

export const parseResponse = async (response) => {
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

const buildUrl = (path) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return buildApiUrl(path);
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  return parseResponse(response);
};
