/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Trophy,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { buildAssetUrl } from "../api/client";
import { createAppSocket } from "../api/socket";
import { getCurrentUser } from "../api/student";
import GoldenBellExamCelebration from "../components/GoldenBellExam/GoldenBellExamCelebration";
import { getGoldenBellWinner } from "../utils/goldenBellWinner";
import { isWaitingAfterGoldenBellRevival } from "../utils/goldenBellRevival";
import GoldenBellWinnerBadge from "../components/GoldenBell/GoldenBellWinnerBadge";
import StudentAvatar from "../components/GoldenBell/StudentAvatar";
import { openGoldenBellRanking, withEliminationHistory } from "../utils/goldenBellRanking";
import {
  buildContentChain,
  getQuestionAnswerOptions,
} from "../utils/questionContent";
import {
  GOLDEN_BELL_QUESTION_SECONDS,
  applyGoldenBellAnswer,
  getDisplayedGoldenBellStudents,
  getGoldenBellStudentAnswer,
  isGoldenBellAnswerPending,
} from "../utils/goldenBellAnswerReveal";

const QUESTION_SECONDS = GOLDEN_BELL_QUESTION_SECONDS;

const getRemainingSeconds = (room) => {
  if (!room?.currentQuestion || room.questionEndedAt) return 0;

  const startedAt = Date.parse(room.questionStartedAt || "");
  if (!Number.isFinite(startedAt)) return QUESTION_SECONDS;

  const durationSeconds = room.questionDurationSeconds || QUESTION_SECONDS;
  return Math.max(
    0,
    Math.ceil((startedAt + durationSeconds * 1000 - Date.now()) / 1000)
  );
};

const createStudentId = () => {
  const authenticatedUserId = localStorage.getItem("userId");
  if (authenticatedUserId) {
    sessionStorage.setItem("golden_bell_student_id", authenticatedUserId);
    return authenticatedUserId;
  }

  const existing = sessionStorage.getItem("golden_bell_student_id");
  if (existing) return existing;

  const nextId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  sessionStorage.setItem("golden_bell_student_id", nextId);
  return nextId;
};

const getDefaultStudentName = () => {
  const fullName = localStorage.getItem("fullName")?.trim();
  if (fullName) return fullName;

  const storedUser = localStorage.getItem("user") || "";

  try {
    const user = JSON.parse(storedUser || "null");
    return user?.fullName || user?.userName || user || "Học sinh";
  } catch {
    return storedUser || "Học sinh";
  }
};

const getInitialRoom = (roomKey, roomId) => {
  try {
    const saved = localStorage.getItem(roomKey);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore invalid local room data.
  }

  return {
    roomId,
    code: roomId,
    currentQuestion: null,
    questionNo: 0,
    usedQuestionIds: [],
    students: [],
  };
};

const GoldenBellLobby = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedCode = roomCode.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      toast.error("Mã phòng gồm 6 chữ số");
      return;
    }

    navigate(`/golden-bell/${normalizedCode}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-b from-green-50 via-gray-100 to-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 text-center shadow-lg md:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
          <Bell size={32} />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Rung chuông vàng</h1>
        <p className="mt-2 text-sm text-gray-600">
          Nhập mã phòng giáo viên đang hiển thị để vào sân thi đấu.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <input
            value={roomCode}
            onChange={(event) =>
              setRoomCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="Nhập mã 6 chữ số"
            className="w-full rounded-xl border-2 border-green-200 px-4 py-4 text-center text-3xl font-black tracking-[0.35em] text-gray-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
          >
            Tham gia phòng
          </button>
        </form>
      </div>
    </div>
  );
};

const GoldenBellRoom = ({ roomId }) => {
  const navigate = useNavigate();
  const roomKey = `golden_bell_room_${roomId}`;

  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionNo, setQuestionNo] = useState(0);
  const [studentId] = useState(createStudentId);
  const [studentName] = useState(getDefaultStudentName);
  const [room, setRoom] = useState(() => getInitialRoom(roomKey, roomId));
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(room)
  );
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [roomError, setRoomError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);

  const socketRef = useRef(null);
  const roomRef = useRef(room);
  const lastQuestionIdRef = useRef(null);
  const eliminationNoticeRef = useRef("");
  const retryConnectionRef = useRef(null);

  const contentChain = useMemo(() => buildContentChain(question), [question]);
  const answers = useMemo(() => {
    return getQuestionAnswerOptions(question);
  }, [question]);
  // When any answer has an image, give the answer grid more room so images can be shown large.
  const hasImageAnswers = useMemo(
    () => answers.some((answer) => buildContentChain(answer).some((item) => item.contentType === "IMAGE")),
    [answers],
  );

  const currentStudent = room.students.find((student) => student.id === studentId);
  // Until the teacher reveals the answer, results of the current question are hidden from everyone.
  const isAnswerPending = isGoldenBellAnswerPending(room);
  const displayedStudents = useMemo(() => getDisplayedGoldenBellStudents(room), [room]);
  const displayedCurrentStudent = displayedStudents.find((student) => student.id === studentId);
  const winner = getGoldenBellWinner(room);
  const isCurrentStudentWinner = winner?.id === studentId;
  // The answer already synced for this question, so a reload cannot answer twice.
  const savedAnswer = getGoldenBellStudentAnswer(currentStudent, room.currentQuestion ? room.questionNo : 0);
  const effectiveSelectedAnswer = selectedAnswer || (savedAnswer
    ? answers.find((answer) => answer.id === savedAnswer.answerId) || { id: savedAnswer.answerId, isCorrect: savedAnswer.isCorrect }
    : null);
  const hasSelected = Boolean(effectiveSelectedAnswer);
  const isCorrect = Boolean(effectiveSelectedAnswer?.isCorrect);
  const selectedAnswerIndex = answers.findIndex((answer) => answer.id === effectiveSelectedAnswer?.id);
  const showAnswerResult = hasSelected && !isAnswerPending;
  const isEliminated = displayedCurrentStudent?.status === "eliminated";
  const isWaitingForNextQuestion = isWaitingAfterGoldenBellRevival(currentStudent, room.questionNo);
  const isQuestionClosed = Boolean(room.questionEndedAt) || Boolean(room.currentQuestion && remainingSeconds <= 0) || room.status === "FINISHED" || room.status === "EXPIRED";
  // Students may change their answer until time is up or the teacher reveals the answer.
  const canChangeAnswer = hasSelected && isAnswerPending && !isQuestionClosed;
  const previousStudentStatusRef = useRef(currentStudent?.status);
  const handledRevivalRef = useRef(currentStudent?.revivalCount || 0);

  useEffect(() => {
    const revision = currentStudent?.revivalCount || 0;
    const wasRevived = revision > handledRevivalRef.current || (previousStudentStatusRef.current === "eliminated" && currentStudent?.status === "active");
    handledRevivalRef.current = revision;
    previousStudentStatusRef.current = currentStudent?.status;
    if (!wasRevived) return;
    setSelectedAnswer(null);
    eliminationNoticeRef.current = "";
    toast.dismiss(`golden-bell-elimination-${studentId}`);
    toast.success("Bạn đã được hồi sinh! Chờ câu hỏi kế tiếp để tiếp tục thi đấu.", { duration: 5000 });
  }, [currentStudent?.revivalCount, currentStudent?.status, studentId]);
  const joinedCount = room.students.length;
  const passedCount = displayedStudents.filter(
    (student) => student.status === "passed" && student.lastQuestionNo === questionNo && (student.resumeFromQuestionNo || 0) <= questionNo
  ).length;
  const eliminatedCount = displayedStudents.filter(
    (student) => student.status === "eliminated"
  ).length;
  const studentStatusLabel = displayedCurrentStudent
    ? displayedCurrentStudent.status === "eliminated"
      ? "Đã hạ bảng"
      : isWaitingForNextQuestion ? "Đã hồi sinh · Chờ câu tiếp theo"
      : displayedCurrentStudent.hasPendingAnswer ? "Đã chọn đáp án · Chờ công bố"
      : displayedCurrentStudent.status === "passed"
        ? "Đã vượt qua câu này"
        : "Đang trong sân"
    : "Chưa vào sân";

  const saveRoom = useCallback(
    (nextRoom, { emitSocket = true } = {}) => {
      nextRoom = withEliminationHistory(roomRef.current, nextRoom);
      roomRef.current = nextRoom;
      setRoom(nextRoom);
      localStorage.setItem(roomKey, JSON.stringify(nextRoom));

      if (emitSocket && socketRef.current?.connected) {
        socketRef.current.emit("golden-bell:sync", {
          roomId,
          room: nextRoom,
        });
      }
    },
    [roomId, roomKey]
  );


  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== roomKey || !event.newValue) return;

      try {
        const nextRoom = JSON.parse(event.newValue);
        roomRef.current = nextRoom;
        setRoom(nextRoom);
        setRemainingSeconds(getRemainingSeconds(nextRoom));
      } catch {
        // Ignore invalid updates.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [roomKey]);

  useEffect(() => {
    const socket = createAppSocket();
    socketRef.current = socket;
    setSocketStatus("connecting");
    let hasJoinedRoom = false;
    let joinRevision = 0;
    let disposed = false;
    let profile = null;
    const profileController = new AbortController();
    const profileTimeout = window.setTimeout(() => profileController.abort(), 5000);
    const profileReady = getCurrentUser({ signal: profileController.signal })
      .then((response) => {
        if (disposed) return;
        profile = response?.data?.data ?? response?.data ?? response;
        if (!profile || typeof profile !== "object") {
          profile = null;
          return;
        }
        localStorage.setItem("studentAvatar", profile.avatar || "");
        localStorage.setItem("studentSchoolName", profile.schoolName || "");
        localStorage.setItem("studentClassName", profile.className || "");
      })
      .catch((error) => {
        if (!disposed) console.error("Unable to refresh Golden Bell profile:", error);
      })
      .finally(() => window.clearTimeout(profileTimeout));

    const handleConnect = async () => {
      const revision = ++joinRevision;
      setSocketStatus("connecting");
      setConnectionError("");
      await profileReady;
      if (disposed || revision !== joinRevision || !socket.connected) return;
      socket.timeout(8000).emit(
        "golden-bell:join",
        {
          roomId,
          student: {
            id: studentId,
            name: studentName,
            avatar: profile ? profile.avatar || "" : localStorage.getItem("studentAvatar") || roomRef.current.students.find((student) => student.id === studentId)?.avatar || "",
            schoolName: localStorage.getItem("studentSchoolName") || "",
            className: localStorage.getItem("studentClassName") || "",
            joinedAt: new Date().toISOString(),
          },
        },
        (error, response) => {
          if (disposed || revision !== joinRevision) return;
          if (error || response?.ok !== true) {
            const message = error
              ? "Socket phòng thi không phản hồi. Vui lòng thử kết nối lại."
              : "Không thể vào lại phòng. Vui lòng thử kết nối lại.";
            setSocketStatus("disconnected");
            if (hasJoinedRoom) setConnectionError(message);
            else setRoomError(error ? message : "Không tìm thấy phòng hoặc phòng đã kết thúc.");
          } else {
            if (response.room) handleRoomState(response.room);
            hasJoinedRoom = true;
            setSocketStatus("connected");
            setRoomError("");
            setConnectionError("");
          }
        }
      );
    };

    const handleDisconnect = () => {
      joinRevision += 1;
      setSocketStatus("disconnected");
      setConnectionError("Mất kết nối phòng thi. Đang chờ kết nối lại để cập nhật câu hỏi.");
    };

    const handleRoomState = (nextRoom) => {
      if (!nextRoom || String(nextRoom.roomId || nextRoom.code) !== String(roomId)) return;
      // A valid room broadcast also confirms admission, even before the join ack.
      hasJoinedRoom = true;
      joinRevision += 1;
      setSocketStatus("connected");
      setRoomError("");
      setConnectionError("");
      nextRoom = withEliminationHistory(roomRef.current, nextRoom);
      // Existing server room entries can still contain the profile from the first join.
      if (profile) {
        nextRoom = {
          ...nextRoom,
          students: nextRoom.students.map((student) => student.id === studentId
            ? { ...student, avatar: profile.avatar || "", schoolName: profile.schoolName || "", className: profile.className || "" }
            : student),
        };
      }

      if (nextRoom.status === "FINISHED" || nextRoom.status === "EXPIRED") {
        const finalRoom = {
          ...roomRef.current,
          ...nextRoom,
          students: nextRoom.students?.length ? nextRoom.students : roomRef.current.students,
          questionNo: nextRoom.questionNo || roomRef.current.questionNo,
        };
        roomRef.current = finalRoom;
        setRoom(finalRoom);
        setRemainingSeconds(0);
        localStorage.setItem(roomKey, JSON.stringify(finalRoom));
        if (nextRoom.status === "FINISHED") {
          setRoomError("");
          return;
        }
        setRoomError(
          nextRoom.status === "EXPIRED"
            ? "Phòng đã hết hạn sau 24 giờ."
            : "Giáo viên đã kết thúc phòng thi đấu."
        );
        return;
      }

      if (!nextRoom.students) return;
      roomRef.current = nextRoom;
      setRoom(nextRoom);
      setRemainingSeconds(getRemainingSeconds(nextRoom));
      localStorage.setItem(roomKey, JSON.stringify(nextRoom));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("golden-bell:room-state", handleRoomState);
    retryConnectionRef.current = () => {
      if (socket.connected) handleConnect();
      else socket.connect();
    };

    return () => {
      disposed = true;
      profileController.abort();
      window.clearTimeout(profileTimeout);
      retryConnectionRef.current = null;
      socket.emit("golden-bell:leave", { roomId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("golden-bell:room-state", handleRoomState);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, roomKey, studentId, studentName]);

  useEffect(() => {
    const currentQuestionId = room.currentQuestion?.id;
    if (!currentQuestionId) return undefined;

    const timer = window.setInterval(() => {
      setRemainingSeconds(
        getRemainingSeconds({
          currentQuestion: { id: currentQuestionId },
          questionStartedAt: room.questionStartedAt,
          questionDurationSeconds: room.questionDurationSeconds,
          questionEndedAt: room.questionEndedAt,
        })
      );
    }, 250);

    return () => window.clearInterval(timer);
  }, [
    room.currentQuestion?.id,
    room.questionDurationSeconds,
    room.questionEndedAt,
    room.questionStartedAt,
  ]);

  useEffect(() => {
    roomRef.current = room;

    if (!room.currentQuestion) return;

    setQuestion(room.currentQuestion);
    setQuestionNo(room.questionNo || 1);

    if (lastQuestionIdRef.current !== room.currentQuestion.id) {
      lastQuestionIdRef.current = room.currentQuestion.id;
      setSelectedAnswer(null);
    }
  }, [room]);

  useEffect(() => {
    setQuestion(null);
    setSelectedAnswer(null);
    setQuestionNo(0);

    if (roomRef.current.currentQuestion) {
      setQuestion(roomRef.current.currentQuestion);
      setQuestionNo(roomRef.current.questionNo || 1);
      lastQuestionIdRef.current = roomRef.current.currentQuestion.id;
    } else {
      lastQuestionIdRef.current = null;
    }
  }, [roomId]);

  useEffect(() => {
    if (!isEliminated || !currentStudent) return;

    const noticeKey = `${roomId}:${currentStudent.id}:${currentStudent.lastQuestionNo || 0}`;
    if (eliminationNoticeRef.current === noticeKey) return;

    eliminationNoticeRef.current = noticeKey;
    toast("Bạn đã hạ bảng. Bạn vẫn có thể ở lại xem các câu hỏi tiếp theo.", { id: `golden-bell-elimination-${studentId}`, duration: 6000 });
  }, [currentStudent, isEliminated, roomId, studentId]);

  const revealNoticeRef = useRef("");
  useEffect(() => {
    if (isAnswerPending || !hasSelected || !isCorrect || !room.answerRevealed) return;
    const noticeKey = `${roomId}:${room.questionNo}`;
    if (revealNoticeRef.current === noticeKey) return;
    revealNoticeRef.current = noticeKey;
    toast.success("Chính xác! Bạn được đi tiếp.");
  }, [hasSelected, isAnswerPending, isCorrect, room.answerRevealed, room.questionNo, roomId]);

  const updateCurrentStudent = useCallback(
    (updater) => {
      const existingStudent = room.students.find((student) => student.id === studentId);
      if (!existingStudent) return;

      saveRoom({
        ...room,
        students: room.students.map((student) =>
          student.id === studentId ? updater(student) : student
        ),
      });
    },
    [room, saveRoom, studentId]
  );

  const handleSelectAnswer = (answer) => {
    if (!answer || (hasSelected && !canChangeAnswer)) return;
    if (effectiveSelectedAnswer?.id === answer.id) return;
    if (socketStatus !== "connected") {
      toast.error("Chờ kết nối lại phòng thi trước khi trả lời.");
      return;
    }

    if (!currentStudent) {
      toast.error("Học sinh cần join phòng trước khi trả lời");
      return;
    }

    if (isEliminated) {
      toast.error("Bạn đã bị loại và không thể tiếp tục trả lời.");
      return;
    }

    if (isWaitingForNextQuestion) {
      toast("Bạn đã được hồi sinh. Chờ giáo viên phát câu hỏi kế tiếp.");
      return;
    }

    if (isQuestionClosed) {
      toast.error("Đã hết thời gian trả lời câu hỏi này.");
      return;
    }

    const previousIsCorrect = hasSelected ? Boolean(effectiveSelectedAnswer.isCorrect) : null;
    setSelectedAnswer(answer);
    updateCurrentStudent((student) => applyGoldenBellAnswer(student, {
      questionNo,
      answerId: answer.id,
      isCorrect: Boolean(answer.isCorrect),
      previousIsCorrect,
    }));

    if (isAnswerPending) {
      toast(hasSelected ? "Đã đổi đáp án." : "Đã chọn đáp án. Bạn có thể đổi trước khi hết giờ.", { id: `golden-bell-answer-${studentId}` });
    } else if (answer.isCorrect) {
      toast.success("Chính xác");
    }
  };

  const renderContent = (chain, emptyMessage = "Nội dung đang được cập nhật.", { imageClassName = "max-h-48 md:max-h-60", textClassName = "text-base md:text-lg font-medium leading-7" } = {}) => {
    if (!chain.length) {
      return <p className="text-gray-500">{emptyMessage}</p>;
    }

    return chain.map((item) => {
      if (item.contentType === "TEXT") {
        return (
          <p key={item.id} className={`whitespace-pre-line break-words ${textClassName}`}>
            {item.content}
          </p>
        );
      }

      if (item.contentType === "IMAGE") {
        return (
          <img
            key={item.id}
            src={buildAssetUrl(item.content)}
            alt=""
            draggable={false}
            className={`mx-auto my-1 block h-auto w-auto max-w-full select-none object-contain rounded-lg border border-gray-200 shadow-sm ${imageClassName}`}
          />
        );
      }

      if (item.contentType === "AUDIO") {
        return <audio key={item.id} controls src={buildAssetUrl(item.content)} className="w-full" />;
      }

      return null;
    });
  };

  if (roomError) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <XCircle className="mx-auto mb-3 text-red-500" size={44} />
          <h1 className="text-xl font-bold text-gray-900">Không vào được phòng</h1>
          <p className="mt-2 text-sm text-gray-600">{roomError}</p>
          <button type="button" onClick={() => retryConnectionRef.current?.()} className="mt-5 mr-2 rounded-lg border border-green-700 px-5 py-2.5 font-bold text-green-700 hover:bg-green-50">Thử kết nối lại</button>
          <button
            type="button"
            onClick={() => navigate("/golden-bell", { replace: true })}
            className="mt-5 rounded-lg bg-green-700 px-5 py-2.5 font-bold text-white hover:bg-green-800"
          >
            Nhập mã phòng khác
          </button>
        </div>
      </div>
    );
  }

  const isTimeLow = Boolean(question) && remainingSeconds <= 5;
  const isAnswerLocked = (hasSelected && !canChangeAnswer) || isEliminated || isQuestionClosed || isWaitingForNextQuestion || socketStatus !== "connected";
  const statusChipClass = displayedCurrentStudent?.status === "eliminated"
    ? "bg-red-100 text-red-700"
    : displayedCurrentStudent?.status === "passed"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-800";

  // Full-screen layout: top bar, question, answers and footer always fit the viewport,
  // so students on a tablet see the whole question and every answer without scrolling.
  return (
    <div className="flex h-[calc(100dvh-env(safe-area-inset-bottom))] flex-col overflow-hidden bg-gradient-to-b from-green-50 via-gray-100 to-white">
      <GoldenBellExamCelebration room={room} roomId={roomId} studentId={studentId} />
      {connectionError && <div role="status" className="shrink-0 bg-amber-50 px-3 py-1.5 text-center text-xs text-amber-900 sm:text-sm">{connectionError} <button type="button" onClick={() => retryConnectionRef.current?.()} className="font-bold underline">Kết nối lại</button></div>}
      {room.status === "FINISHED" && <p role="status" className="shrink-0 bg-green-100 px-3 py-1.5 text-center text-sm font-bold text-green-800">Giáo viên đã kết thúc phòng thi. Bạn có thể xem lại kết quả và xếp hạng.</p>}

      <header className="flex shrink-0 items-center gap-2 bg-green-700 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-white sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          aria-label="Quay lại"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-green-50">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${socketStatus === "connected" ? "bg-lime-300" : socketStatus === "connecting" ? "bg-yellow-300" : "bg-red-400"}`}
              title={socketStatus === "connected" ? "Đã kết nối" : socketStatus === "connecting" ? "Đang kết nối" : "Mất kết nối"}
            />
            <span className="truncate">Phòng {room.code}</span>
          </p>
          <h1 className="text-lg font-black leading-tight sm:text-xl">Câu {questionNo || 0}</h1>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {currentStudent ? (
            <div className={`flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 ${isCurrentStudentWinner ? "bg-yellow-300 text-gray-900" : "bg-white/15"}`}>
              <StudentAvatar student={currentStudent} className="h-8 w-8 shrink-0" />
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-40 truncate text-sm font-bold leading-tight">{currentStudent.name}</p>
                {isCurrentStudentWinner
                  ? <p className="text-[11px] font-bold leading-tight">Chiến thắng</p>
                  : <p className={`mt-0.5 w-fit rounded-full px-1.5 text-[11px] font-bold leading-4 ${statusChipClass}`}>{studentStatusLabel}</p>}
              </div>
            </div>
          ) : (
            <span className="hidden truncate text-sm text-green-50 sm:inline">Đang vào sân…</span>
          )}

          <button
            type="button"
            onClick={() => setIsStudentListOpen(true)}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 text-sm font-bold hover:bg-white/25"
            aria-label="Xem sĩ tử trong sân"
          >
            <Users size={16} />
            {joinedCount}
          </button>

          <div className={`flex h-10 min-w-16 shrink-0 items-center justify-center rounded-full px-3 font-mono text-xl font-black ${isTimeLow ? "animate-pulse bg-red-500" : "bg-white/15"}`} aria-label="Thời gian còn lại">
            {question ? `00:${String(remainingSeconds).padStart(2, "0")}` : "--:--"}
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-3">
        {!question ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-center shadow-sm">
            <Bell className="mb-4 text-yellow-500" size={52} />
            <p className="text-2xl font-normal text-gray-900">Chờ giáo viên phát câu hỏi</p>
            <p className="mt-2 max-w-md px-4 text-sm text-gray-500">Khi giáo viên bấm phát câu, nội dung sẽ tự hiển thị tại đây.</p>
          </div>
        ) : (
          <>
            <section
              translate="no"
              className={`notranslate ${hasImageAnswers ? "max-h-[35%]" : "max-h-[45%]"} min-h-0 shrink overflow-y-auto rounded-2xl border border-green-200 bg-white px-4 py-3 text-gray-900 shadow-sm sm:px-6 sm:py-4`}
            >
              {renderContent(contentChain, undefined, {
                imageClassName: hasImageAnswers ? "max-h-[20dvh]" : "max-h-[26dvh]",
                textClassName: "text-lg font-semibold leading-snug sm:text-xl md:text-2xl",
              })}
            </section>

            <div className={`grid min-h-0 flex-1 auto-rows-fr gap-2 sm:grid-cols-2 sm:gap-3 ${hasImageAnswers ? "grid-cols-2" : "grid-cols-1"}`}>
              {answers.length === 0 ? (
                <p className="text-sm text-gray-500">Câu hỏi chưa có đáp án.</p>
              ) : (
                answers.map((answer, index) => {
                  const label = String.fromCharCode(65 + index);
                  const answerChain = buildContentChain(answer);
                  const answerImages = answerChain.filter((item) => item.contentType === "IMAGE");
                  const answerExtras = answerChain.filter((item) => item.contentType !== "IMAGE");
                  const isSelectedAnswer = effectiveSelectedAnswer?.id === answer.id;
                  const showCorrect = showAnswerResult && answer.isCorrect;
                  const showWrong = showAnswerResult && isSelectedAnswer && !answer.isCorrect;

                  const answerClass = showCorrect
                    ? "border-green-600 bg-green-50 ring-2 ring-green-500"
                    : showWrong
                      ? "border-red-500 bg-red-50 ring-2 ring-red-400"
                      : isSelectedAnswer
                        ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-400"
                        : "border-gray-200 bg-white enabled:hover:border-green-300 enabled:hover:bg-green-50 enabled:active:scale-[0.99]";
                  const labelClass = showCorrect
                    ? "border-green-600 bg-green-600 text-white"
                    : showWrong
                      ? "border-red-500 bg-red-500 text-white"
                      : isSelectedAnswer
                        ? "border-yellow-500 bg-yellow-400 text-gray-900"
                        : "border-green-600 bg-green-50 text-green-700";

                  // Answers with images: the image fills the whole button, label and result icon float on top.
                  if (answerImages.length > 0) {
                    return (
                      <button
                        key={answer.id}
                        type="button"
                        disabled={isAnswerLocked}
                        aria-pressed={isSelectedAnswer}
                        onClick={() => handleSelectAnswer(answer)}
                        className={`relative flex h-full min-h-0 w-full touch-manipulation flex-col gap-1 overflow-hidden rounded-2xl border-2 p-1.5 text-left shadow-sm transition sm:p-2 ${answerClass}`}
                      >
                        <span translate="no" lang="en" className={`absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-base font-black shadow-md sm:h-11 sm:w-11 sm:text-lg ${labelClass}`}>
                          {label}
                        </span>
                        {showCorrect && <CheckCircle2 className="absolute right-2 top-2 z-10 rounded-full bg-white text-green-600 shadow-md" size={30} />}
                        {showWrong && <XCircle className="absolute right-2 top-2 z-10 rounded-full bg-white text-red-500 shadow-md" size={30} />}
                        <div className="flex min-h-0 w-full flex-1 gap-1.5">
                          {answerImages.map((item) => (
                            <div key={item.id} className="relative min-h-0 min-w-0 flex-1">
                              <img
                                src={buildAssetUrl(item.content)}
                                alt=""
                                draggable={false}
                                className="absolute inset-0 h-full w-full select-none rounded-xl object-contain"
                              />
                            </div>
                          ))}
                        </div>
                        {answerExtras.length > 0 && (
                          <div translate="no" className="notranslate max-h-[35%] min-h-0 shrink-0 overflow-y-auto px-1 text-center text-gray-900">
                            {renderContent(answerExtras, undefined, {
                              textClassName: "text-sm font-bold leading-snug sm:text-base md:text-lg",
                            })}
                          </div>
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={answer.id}
                      type="button"
                      disabled={isAnswerLocked}
                      aria-pressed={isSelectedAnswer}
                      onClick={() => handleSelectAnswer(answer)}
                      className={`flex h-full min-h-0 w-full touch-manipulation items-center gap-3 overflow-hidden rounded-2xl border-2 px-3 py-2 text-left shadow-sm transition sm:px-4 ${answerClass}`}
                    >
                      <span translate="no" lang="en" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg font-black sm:h-12 sm:w-12 sm:text-xl ${labelClass}`}>
                        {label}
                      </span>
                      <div translate="no" className="notranslate max-h-full min-w-0 flex-1 overflow-y-auto text-gray-900">
                        {renderContent(answerChain, "Đáp án chưa có nội dung.", {
                          textClassName: "text-base font-bold leading-snug sm:text-lg md:text-xl",
                        })}
                      </div>
                      {showCorrect && <CheckCircle2 className="shrink-0 text-green-600" size={26} />}
                      {showWrong && <XCircle className="shrink-0 text-red-500" size={26} />}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white px-3 py-2 sm:px-4">
        <div className="min-w-0 text-sm font-semibold">
          {isEliminated ? (
            <p className="flex items-center gap-1.5 text-red-700"><XCircle size={18} className="shrink-0" />Bạn đã hạ bảng. Bạn vẫn có thể xem các câu tiếp theo.</p>
          ) : isWaitingForNextQuestion ? (
            <p className="text-green-700">Bạn đã được hồi sinh. Chờ câu tiếp theo để tiếp tục thi đấu.</p>
          ) : hasSelected && isAnswerPending ? (
            <p className="flex items-center gap-1.5 text-yellow-800">
              <CheckCircle2 size={18} className="shrink-0" />
              {canChangeAnswer
                ? `Đã chọn đáp án${selectedAnswerIndex >= 0 ? ` ${String.fromCharCode(65 + selectedAnswerIndex)}` : ""}. Có thể chọn lại trước khi hết giờ.`
                : "Đã chốt đáp án. Chờ giáo viên công bố."}
            </p>
          ) : hasSelected ? (
            <p className={`flex items-center gap-1.5 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
              {isCorrect ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
              {isCorrect ? "Bạn được đi tiếp" : "Bạn đã trả lời sai"}
            </p>
          ) : (
            <p className="text-gray-500">{question ? "Chạm vào một đáp án để trả lời." : "Chọn đáp án sau khi giáo viên phát câu hỏi."}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => openGoldenBellRanking(navigate, room, `/golden-bell/${roomId}`)} className="flex items-center gap-1 rounded-xl border border-green-700 px-3 py-1.5 text-sm font-bold text-green-700 hover:bg-green-50"><Trophy size={16} /><span className="hidden sm:inline">Xếp hạng</span></button>
          <button type="button" onClick={() => navigate("/")} className="rounded-xl bg-green-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-800">Trang chủ</button>
        </div>
      </footer>

      {isStudentListOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={() => setIsStudentListOpen(false)}>
          <aside
            role="dialog"
            aria-label="Sĩ tử trong sân"
            className="flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="flex items-center gap-2 font-bold text-gray-900"><Users size={18} className="text-green-700" />Sĩ tử trong sân</h2>
              <button type="button" onClick={() => setIsStudentListOpen(false)} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Đóng"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-gray-200 p-3 text-center">
              <div className="rounded-lg bg-gray-50 py-1.5"><p className="text-[11px] text-gray-500">Đã join</p><p className="text-lg font-black text-gray-900">{joinedCount}</p></div>
              <div className="rounded-lg bg-green-50 py-1.5"><p className="text-[11px] text-green-700">Vượt qua</p><p className="text-lg font-black text-green-700">{passedCount}</p></div>
              <div className="rounded-lg bg-red-50 py-1.5"><p className="text-[11px] text-red-600">Bị loại</p><p className="text-lg font-black text-red-600">{eliminatedCount}</p></div>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {displayedStudents.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">Chưa có học sinh join.</p>
              ) : (
                displayedStudents.map((student) => {
                  const isWinner = winner?.id === student.id;
                  const isWaiting = isWaitingAfterGoldenBellRevival(student, room.questionNo);
                  return (
                    <div key={student.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${isWinner ? "border-yellow-400 bg-yellow-50" : student.id === studentId ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <StudentAvatar student={student} className="h-9 w-9" />
                        {isWinner && <GoldenBellWinnerBadge iconOnly />}
                        <span className="truncate text-sm font-semibold text-gray-800">{student.name}</span>
                      </div>
                      <span className={`shrink-0 text-xs font-bold ${isWinner ? "text-amber-800" : isWaiting ? "text-blue-700" : student.status === "passed" ? "text-green-700" : student.status === "eliminated" ? "text-red-600" : "text-gray-500"}`}>
                        {isWinner ? "Chiến thắng" : isWaiting ? "Chờ câu tiếp" : student.status === "passed" ? "Qua" : student.status === "eliminated" ? "Hạ bảng" : "Đang thi"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

const GoldenBellExam = () => {
  const { id } = useParams();
  const roomId = (id || "").trim().toUpperCase();

  return roomId ? <GoldenBellRoom roomId={roomId} /> : <GoldenBellLobby />;
};

export default GoldenBellExam;
