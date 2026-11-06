import { useCallback, useEffect, useRef, useState } from "react";
import { createAppSocket } from "../api/socket";
import { getQuestionBankDetail } from "../api/questionBank";
import { hasTeacherRankingSession, podiumSelectionsKey, rankingCacheKey, updatePodiumSelection, withEliminationHistory } from "../utils/goldenBellRanking";

const readSelections = (roomId) => {
  try { return JSON.parse(localStorage.getItem(podiumSelectionsKey(roomId)) || "null"); }
  catch { return null; }
};

const readRoom = (roomId, snapshot) => {
  const keys = [rankingCacheKey(roomId), `golden_bell_room_${roomId}`];
  for (const key of keys) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && Array.isArray(saved.students)) return { ...saved, podiumSelections: saved.questionNo === 0 ? {} : readSelections(roomId) || saved.podiumSelections };
    } catch { /* Ignore damaged cached snapshots. */ }
  }
  return snapshot?.roomId === roomId ? snapshot : { roomId, code: roomId, students: [], questionNo: 0 };
};

export default function useGoldenBellRankingRoom(roomId, snapshot, canManage) {
  const [room, setRoom] = useState(() => readRoom(roomId, snapshot));
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const roomRef = useRef(room);
  const cachedSnapshotRef = useRef(null);
  const pendingSyncRef = useRef(null);
  const syncFrameRef = useRef(null);

  useEffect(() => { roomRef.current = room; }, [room]);

  const flushPodiumSync = useCallback(() => {
    const pending = pendingSyncRef.current;
    if (pending && socketRef.current?.connected) {
      socketRef.current.emit("golden-bell:sync", pending);
      pendingSyncRef.current = null;
    }
  }, []);

  const choosePodiumRank = useCallback((rank, studentId) => {
    try {
      if (!canManage || !hasTeacherRankingSession()) throw new Error("Chỉ giáo viên được chọn thứ hạng.");
      if (!socketRef.current?.connected) throw new Error("Cần kết nối phòng để lưu lựa chọn của giáo viên.");
      const current = roomRef.current;
      const next = updatePodiumSelection(current, rank, studentId);
      localStorage.setItem(podiumSelectionsKey(roomId), JSON.stringify(next.podiumSelections));
      roomRef.current = next;
      setRoom(next);
      setError("");
      pendingSyncRef.current = { roomId, room: next };
      if (syncFrameRef.current !== null) window.cancelAnimationFrame(syncFrameRef.current);
      // Paint the selected row before serializing the room for the socket.
      syncFrameRef.current = window.requestAnimationFrame(() => {
        syncFrameRef.current = window.requestAnimationFrame(() => {
          syncFrameRef.current = null;
          flushPodiumSync();
        });
      });
    } catch (selectionError) {
      setError(selectionError.message || "Không thể lưu lựa chọn. Vui lòng thử lại.");
    }
  }, [roomId, canManage, flushPodiumSync]);

  useEffect(() => {
    const key = rankingCacheKey(roomId);
    const acceptRoom = (next) => {
      if (!next || (next.roomId || next.code) !== roomId) return;
      if (next.podiumSelections || next.questionNo === 0) {
        try {
          const selectionKey = podiumSelectionsKey(roomId);
          const json = JSON.stringify(next.questionNo === 0 ? {} : next.podiumSelections);
          if (localStorage.getItem(selectionKey) !== json) localStorage.setItem(selectionKey, json);
        } catch { /* Continue displaying live data if storage is unavailable. */ }
      }
      setRoom((previous) => {
        const ended = next.status === "FINISHED" || next.status === "EXPIRED";
        const merged = withEliminationHistory(previous, {
          ...previous, ...next,
          podiumSelections: next.podiumSelections ?? previous.podiumSelections,
          students: ended && !next.students?.length ? previous.students : (next.students || []),
          questionNo: ended ? next.questionNo || previous.questionNo : next.questionNo,
        });
        return merged;
      });
    };
    const handleStorage = (event) => {
      if (event.key === podiumSelectionsKey(roomId)) {
        try { setRoom((previous) => ({ ...previous, podiumSelections: JSON.parse(event.newValue || "{}") })); } catch { /* Ignore malformed selections. */ }
        return;
      }
      if (event.key !== key && event.key !== `golden_bell_room_${roomId}`) return;
      try { if (event.newValue) acceptRoom(JSON.parse(event.newValue)); } catch { /* Ignore malformed cross-tab updates. */ }
    };
    window.addEventListener("storage", handleStorage);

    const socket = createAppSocket(sessionStorage.getItem("teacherAccessToken") || undefined);
    socketRef.current = socket;
    const handleConnect = () => {
      setConnection("connected");
      socket.timeout(8000).emit("golden-bell:join", { roomId }, (joinError, response) => {
        if (joinError) setError("Chưa nhận được phản hồi phòng. Đang hiển thị dữ liệu đã lưu.");
        else if (response?.ok === false) setError(response.message || "Không tìm thấy phòng đang hoạt động. Đang hiển thị kết quả đã lưu.");
        else {
          setError("");
          if (response?.room) acceptRoom(response.room);
        }
      });
    };
    const handleDisconnect = () => setConnection("disconnected");
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("golden-bell:room-state", acceptRoom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (syncFrameRef.current !== null) window.cancelAnimationFrame(syncFrameRef.current);
      syncFrameRef.current = null;
      flushPodiumSync();
      socket.emit("golden-bell:leave", { roomId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("golden-bell:room-state", acceptRoom);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, flushPodiumSync]);

  useEffect(() => {
    const snapshot = { ...room };
    delete snapshot.podiumSelections;
    const previous = cachedSnapshotRef.current;
    if (previous && Object.keys(snapshot).length === Object.keys(previous).length && Object.keys(snapshot).every((key) => snapshot[key] === previous[key])) return;
    const timer = window.setTimeout(() => {
      const key = rankingCacheKey(roomId);
      try {
        const json = JSON.stringify(snapshot);
        if (localStorage.getItem(key) !== json) localStorage.setItem(key, json);
        cachedSnapshotRef.current = snapshot;
      } catch { /* Keep viewing if the cache is full. */ }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [room, roomId]);

  useEffect(() => {
    if (!room.questionBankId || room.questionBankName) return;
    let cancelled = false;
    getQuestionBankDetail(room.questionBankId, sessionStorage.getItem("teacherAccessToken") || undefined)
      .then((response) => {
        const data = response?.data?.data || response?.data || response;
        if (!cancelled && (data?.name || data?.title)) setRoom((current) => ({ ...current, questionBankName: data.title || data.name }));
      }).catch(() => {});
    return () => { cancelled = true; };
  }, [room.questionBankId, room.questionBankName]);

  return { room, connection, error, choosePodiumRank };
}
