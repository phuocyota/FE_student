import { useCallback, useMemo, useSyncExternalStore } from "react";
import { normalizeSeating, seatingKey } from "../utils/goldenBellSeating";

export default function useGoldenBellSeating(roomId) {
  const key = seatingKey(roomId);
  const subscribe = useCallback((notify) => {
    const listener = (event) => {
      if (event.key === key || event.key === null) notify();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [key]);
  const snapshot = useCallback(() => {
    try { return localStorage.getItem(key); } catch { return null; }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, snapshot);
  return useMemo(() => {
    try { return { ...normalizeSeating(JSON.parse(raw)), isConfigured: raw !== null }; }
    catch { return { ...normalizeSeating(null), isConfigured: false }; }
  }, [raw]);
}
