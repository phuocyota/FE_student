import { useCallback, useEffect, useRef, useState } from "react";
import { createAppSocket } from "../api/socket";
import { getQuestionBankDetail } from "../api/questionBank";
import useGoldenBellWinnerCompletion from "./useGoldenBellWinnerCompletion";
import { hasTeacherRankingSession, rankingCacheKey, updatePodiumSelection, withEliminationHistory } from "../utils/goldenBellRanking";
import { applyLocalPodium, localPodiumKey, readLocalPodiumRoom, rememberPodiumResult } from "../utils/goldenBellLocalPodium";
import { readPodiumDraft, writePodiumDraft } from "../utils/goldenBellPodiumDraft";
import { submitGoldenBellPodiumResult } from "../api/goldenBellPodium";

const readRoom = (roomId, snapshot, canManage) => {
  const draft = canManage ? readPodiumDraft(roomId) : null;
  if (draft) return draft.room;
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
  const [room, setRoom] = useState(() => readRoom(roomId, snapshot, canManage));
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const [initialDraft] = useState(() => canManage ? readPodiumDraft(roomId) : null);
  const [submissionState, setSubmissionState] = useState(initialDraft?.finalized ? "sent" : "idle");
  const [hasDraftChanges, setHasDraftChanges] = useState(Boolean(initialDraft && !initialDraft.finalized));
  const draftRef = useRef(initialDraft && !initialDraft.finalized ? initialDraft.room : null);
  const submittingRef = useRef(false);
  const socketRef = useRef(null);
  const roomRef = useRef(room);
  const cachedSnapshotRef = useRef(null);

  useEffect(() => { roomRef.current = room; }, [room]);

  useGoldenBellWinnerCompletion({
    room, socketRef, connection, enabled: canManage && hasTeacherRankingSession(),
    onFinished: (finished) => {
      const next = applyLocalPodium(finished);
      roomRef.current = next;
      setRoom(next);
      setError("");
    },
    onError: (failure) => setError(failure.message),
  });

  const choosePodiumRank = useCallback((rank, studentId) => {
    try {
      if (submittingRef.current || submissionState === "sent") return;
      if (!canManage || !hasTeacherRankingSession()) throw new Error("Chỉ giáo viên được chọn thứ hạng.");
      const current = roomRef.current;
      const next = updatePodiumSelection(current, rank, studentId);
      roomRef.current = next;
      draftRef.current = next;
      setRoom(next);
      setHasDraftChanges(true);
      setError("");
    } catch (selectionError) {
      setError(selectionError.message || "Không thể lưu lựa chọn. Vui lòng thử lại.");
    }
  }, [canManage, submissionState]);

  const submitPodium = useCallback(async () => {
    if (submittingRef.current || !draftRef.current) return;
    if (!canManage || !hasTeacherRankingSession()) {
      setError("Chỉ giáo viên được gửi kết quả.");
      return;
    }
    submittingRef.current = true;
    setSubmissionState("sending");
    setError("");
    try {
      const result = await submitGoldenBellPodiumResult(socketRef.current, draftRef.current);
      roomRef.current = result;
      draftRef.current = null;
      setRoom(result);
      setHasDraftChanges(false);
      setSubmissionState("sent");
      try {
        rememberPodiumResult(result);
        writePodiumDraft(result, true);
      } catch { setError("Đã gửi kết quả lên sân thi đấu nhưng không lưu được trên trình duyệt."); }
    } catch (failure) {
      setSubmissionState("error");
      setError(failure.message);
    } finally { submittingRef.current = false; }
  }, [canManage]);

  useEffect(() => {
    if (!hasDraftChanges || room.status !== "FINISHED") return;
    const timer = window.setTimeout(() => { void submitPodium(); }, Math.max(0, Date.parse(room.endedAt) + 60_000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [hasDraftChanges, room.status, room.endedAt, submitPodium]);

  useEffect(() => {
    if (hasDraftChanges && connection === "connected" && Date.now() >= Date.parse(room.endedAt) + 60_000) void submitPodium();
  }, [connection, hasDraftChanges, room.endedAt, submitPodium]);

  useEffect(() => {
    if (!hasDraftChanges) return;
    const timer = window.setTimeout(() => {
      if (draftRef.current) {
        try { writePodiumDraft(draftRef.current); }
        catch { setError("Không lưu được bản chỉnh sửa trên trình duyệt. Hãy chốt và gửi trước khi rời trang."); }
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [room, hasDraftChanges]);

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
        return draftRef.current?.endedAt === merged.endedAt
          ? { ...merged, podiumSelections: draftRef.current.podiumSelections }
          : applyLocalPodium(merged);
      });
    };
    const handleStorage = (event) => {
      if (event.key === localPodiumKey(roomId)) {
        if (!draftRef.current) setRoom((previous) => applyLocalPodium(previous));
        return;
      }
      if (event.key !== key && event.key !== `golden_bell_room_${roomId}`) return;
      try { if (event.newValue) acceptRoom(JSON.parse(event.newValue)); } catch { /* Ignore malformed cross-tab updates. */ }
    };
    window.addEventListener("storage", handleStorage);

    const socket = createAppSocket(sessionStorage.getItem("teacherAccessToken") || undefined);
    socketRef.current = socket;
    const handleConnect = () => {
      setConnection("connecting");
      socket.timeout(8000).emit("golden-bell:join", { roomId }, (joinError, response) => {
        if (joinError) setError("Chưa nhận được phản hồi phòng. Đang hiển thị dữ liệu đã lưu.");
        else if (response?.ok === false) setError(response.message || "Không tìm thấy phòng đang hoạt động. Đang hiển thị kết quả đã lưu.");
        else {
          setConnection("connected");
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
      if (draftRef.current) return;
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
      if (draftRef.current) {
        try { writePodiumDraft(draftRef.current); } catch { /* Retain the in-memory draft if storage is unavailable. */ }
      }
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

  return { room, connection, error, choosePodiumRank, submitPodium, submissionState, hasDraftChanges };
}
