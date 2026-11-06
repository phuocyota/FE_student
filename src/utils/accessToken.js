export const isUsableAccessToken = (token, now = Date.now()) => {
  if (typeof token !== "string" || !token.trim()) return false;

  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) return false;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return Number.isFinite(payload.exp) && payload.exp * 1000 > now;
  } catch {
    return false;
  }
};
