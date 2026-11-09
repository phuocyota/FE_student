import { useCallback, useEffect, useRef, useState } from "react";
import { createAppSocket } from "../api/socket";
import { getQuestionBankDetail } from "../api/questionBank";
import { hasTeacherRankingSession, rankingCacheKey, updatePodiumSelection, withEliminationHistory } from "../utils/goldenBellRanking";
import { applyLocalPodium, localPodiumKey, readLocalPodiumRoom, rememberPodiumResult, saveLocalPodium } from "../utils/goldenBellLocalPodium";

const readRoom = (roomId, snapshot) => {
  const localResult = readLocalPodiumRoom(roomId);
  if (localResult) return localResult;
  const keys = [rankingCacheKey(roomId), `golden_bell_room_${roomId}`];
  for (const key of keys) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && Array.isArray(saved.students)) return applyLocalPodium(saved);
    } catch { /* Ignore damaged cached snapshots. */ }
  }
  return snapshot?.roomId === roomId ? applyLocalPodium(snapshot) : { roomId, code: roomId, students: [], questionNo: 0 };
};

export default function useGoldenBellRankingRoom(roomId, snapshot, canManage) {
  const [room, setRoom] = useState(() => readRoom(roomId, snapshot));
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const [isSavingPodium, setIsSavingPodium] = useState(false);
  const publishingRef = useRef(false);
  const socketRef = useRef(null);
  const roomRef = useRef(room);
  const cachedSnapshotRef = useRef(null);

  useEffect(() => { roomRef.current = room; }, [room]);

  const choosePodiumRank = useCallback((rank, studentId) => {
    if (publishingRef.current) return;
    try {
      if (!canManage || !hasTeacherRankingSession()) throw new Error("Chỉ giáo viên được chọn thứ hạng.");
      const current = roomRef.current;
      const next = saveLocalPodium(updatePodiumSelection(applyLocalPodium(current), rank, studentId));
      roomRef.current = next;
      setRoom(next);
      setError("");
      if (!socketRef.current?.connected) {
        setError("Đã lưu trên trình duyệt này. Chưa thể gửi kết quả sang sân thi đấu do mất kết nối.");
        return;
      }
      publishingRef.current = true;
      setIsSavingPodium(true);
      socketRef.current.timeout(8000).emit("golden-bell:podium-result", {
        roomId, endedAt: next.endedAt, selections: next.podiumSelections,
      }, (failure, response) => {
        publishingRef.current = false;
        setIsSavingPodium(false);
        if (failure || !response?.ok) setError(response?.message || "Đã lưu trên FE nhưng chưa xác nhận được kết quả đã gửi sang sân thi đấu.");
      });
    } catch (selectionError) {
      setError(selectionError.message || "Không thể lưu lựa chọn. Vui lòng thử lại.");
    }
  }, [roomId, canManage]);

  useEffect(() => {
    const key = rankingCacheKey(roomId);
    const acceptRoom = (next) => {
      if (!next || (next.roomId || next.code) !== roomId) return;
      setRoom((previous) => {
        const ended = next.status === "FINISHED" || next.status === "EXPIRED";
        const merged = withEliminationHistory(previous, {
          ...previous, ...next,
          podiumSelections: next.podiumSelections ?? previous.podiumSelections,
          students: ended && !next.students?.length ? previous.students : (next.students || []),
          questionNo: ended ? next.questionNo || previous.questionNo : next.questionNo,
        });
        return applyLocalPodium(merged);
      });
    };
    const handleStorage = (event) => {
      if (event.key === localPodiumKey(roomId)) {
        setRoom((previous) => applyLocalPodium(previous));
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
          if (response?.hasPodiumResult && response.room?.status === "FINISHED") {
            handlePodiumResult({ roomId, room: response.room });
          } else if (response?.room) acceptRoom(response.room);
        }
      });
    };
    const handleDisconnect = () => setConnection("disconnected");
    const handlePodiumResult = (payload) => {
      if (payload?.roomId !== roomId || payload.room?.status !== "FINISHED") return;
      let result = payload.room;
      try { result = rememberPodiumResult(result); } catch { /* Show live results even if storage is full. */ }
      acceptRoom(result);
    };
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("golden-bell:room-state", acceptRoom);
    socket.on("golden-bell:podium-result", handlePodiumResult);
    return () => {
      window.removeEventListener("storage", handleStorage);
      socket.emit("golden-bell:leave", { roomId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("golden-bell:room-state", acceptRoom);
      socket.off("golden-bell:podium-result", handlePodiumResult);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

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

  return { room, connection, error, choosePodiumRank, isSavingPodium };
}
