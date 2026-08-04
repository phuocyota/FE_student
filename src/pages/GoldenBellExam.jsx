/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { buildAssetUrl } from "../api/client";
import { createAppSocket } from "../api/socket";
import {
  buildContentChain,
  getQuestionAnswerOptions,
} from "../utils/questionContent";

const QUESTION_SECONDS = 15;

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

  const socketRef = useRef(null);
  const roomRef = useRef(room);
  const lastQuestionIdRef = useRef(null);
  const eliminationNoticeRef = useRef("");

  const contentChain = useMemo(() => buildContentChain(question), [question]);
  const answers = useMemo(() => {
    return getQuestionAnswerOptions(question);
  }, [question]);

  const currentStudent = room.students.find((student) => student.id === studentId);
  const hasSelected = Boolean(selectedAnswer);
  const isCorrect = Boolean(selectedAnswer?.isCorrect);
  const isEliminated = currentStudent?.status === "eliminated";
  const isQuestionClosed = Boolean(room.questionEndedAt);
  const joinedCount = room.students.length;
  const passedCount = room.students.filter(
    (student) => student.status === "passed" && student.lastQuestionNo === questionNo
  ).length;
  const eliminatedCount = room.students.filter(
    (student) => student.status === "eliminated"
  ).length;
  const studentStatusLabel = currentStudent
    ? currentStudent.status === "eliminated"
      ? "Đã hạ bảng"
      : currentStudent.status === "passed"
        ? "Đã vượt qua câu này"
        : "Đang trong sân"
    : "Chưa vào sân";

  const saveRoom = useCallback(
    (nextRoom, { emitSocket = true } = {}) => {
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
    const nextRoom = getInitialRoom(roomKey, roomId);
    roomRef.current = nextRoom;
    setRoom(nextRoom);
  }, [roomId, roomKey]);

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

    const handleConnect = () => {
      setSocketStatus("connected");
      socket.timeout(8000).emit(
        "golden-bell:join",
        {
          roomId,
          student: {
            id: studentId,
            name: studentName,
            joinedAt: new Date().toISOString(),
          },
        },
        (error, response) => {
          if (error) {
            setRoomError("Socket phòng thi không phản hồi. Vui lòng thử lại.");
          } else if (response?.ok === false) {
            setRoomError("Không tìm thấy phòng hoặc phòng đã kết thúc.");
          } else {
            setRoomError("");
          }
        }
      );
    };

    const handleDisconnect = () => {
      setSocketStatus("disconnected");
    };

    const handleRoomState = (nextRoom) => {
      if (!nextRoom?.students) return;

      if (nextRoom.status === "FINISHED" || nextRoom.status === "EXPIRED") {
        setRoomError(
          nextRoom.status === "EXPIRED"
            ? "Phòng đã hết hạn sau 24 giờ."
            : "Giáo viên đã kết thúc phòng thi đấu."
        );
        return;
      }

      roomRef.current = nextRoom;
      setRoom(nextRoom);
      setRemainingSeconds(getRemainingSeconds(nextRoom));
      localStorage.setItem(roomKey, JSON.stringify(nextRoom));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("golden-bell:room-state", handleRoomState);

    return () => {
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
    toast.error("Rất tiếc, bạn đã bị loại.", { duration: 6000 });
  }, [currentStudent, isEliminated, roomId]);

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
    if (!answer || hasSelected) return;

    if (!currentStudent) {
      toast.error("Học sinh cần join phòng trước khi trả lời");
      return;
    }

    if (isEliminated) {
      toast.error("Bạn đã bị loại và không thể tiếp tục trả lời.");
      return;
    }

    if (isQuestionClosed) {
      toast.error("Đã hết thời gian trả lời câu hỏi này.");
      return;
    }

    setSelectedAnswer(answer);

    if (answer.isCorrect) {
      updateCurrentStudent((student) => ({
        ...student,
        status: "passed",
        lastQuestionNo: questionNo,
        correctCount: (student.correctCount || 0) + 1,
      }));
      toast.success("Chính xác");
    } else {
      updateCurrentStudent((student) => ({
        ...student,
        status: "eliminated",
        eliminatedReason: "wrong-answer",
        lastQuestionNo: questionNo,
        wrongCount: (student.wrongCount || 0) + 1,
      }));
    }
  };

  const renderContent = (chain, emptyMessage = "Nội dung đang được cập nhật.") => {
    if (!chain.length) {
      return <p className="text-gray-500">{emptyMessage}</p>;
    }

    return chain.map((item) => {
      if (item.contentType === "TEXT") {
        return (
          <p key={item.id} className="text-base md:text-lg font-medium leading-7">
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
            className="my-3 max-w-full rounded-lg border border-gray-200 shadow-sm"
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-green-50 via-gray-100 to-white">
      <div className="max-w-6xl mx-auto px-4 py-5 md:py-8">
        <div className="mb-5 overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
          <div className="bg-green-700 px-5 py-4 text-white md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  aria-label="Quay lại"
                >
                  <ArrowLeft size={18} />
                </button>

                <div>
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-green-50">
                    <Bell size={18} />
                    <span>Rung chuông vàng</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        socketStatus === "connected"
                          ? "bg-white text-green-700"
                          : socketStatus === "connecting"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {socketStatus === "connected"
                        ? "Socket online"
                        : socketStatus === "connecting"
                          ? "Đang kết nối"
                          : "Local fallback"}
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-normal md:text-3xl">
                    Sân thi đấu - Câu {questionNo || 0}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div className="rounded-lg bg-white/15 px-4 py-2">
                  <p className="text-xs text-green-50">Đã join</p>
                  <p className="text-xl font-black">{joinedCount}</p>
                </div>
                <div className="rounded-lg bg-white/15 px-4 py-2">
                  <p className="text-xs text-green-50">Vượt qua</p>
                  <p className="text-xl font-black text-yellow-200">{passedCount}</p>
                </div>
                <div className="rounded-lg bg-white/15 px-4 py-2">
                  <p className="text-xs text-green-50">Bị loại</p>
                  <p className="text-xl font-black text-red-200">{eliminatedCount}</p>
                </div>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    question && remainingSeconds <= 5
                      ? "bg-red-500/80"
                      : "bg-white/15"
                  }`}
                >
                  <p className="text-xs text-green-50">Thời gian</p>
                  <p className="font-mono text-xl font-black text-white">
                    {question
                      ? `00:${String(remainingSeconds).padStart(2, "0")}`
                      : "--:--"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-[1fr_280px] md:p-6">
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-green-800">Mã phòng</p>
                  <p className="text-3xl font-black tracking-wider text-gray-900">{room.code}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                  <Trophy size={24} />
                </div>
              </div>

              {currentStudent ? (
                <div className="rounded-lg border border-green-200 bg-white px-4 py-3">
                  <p className="text-sm text-gray-600">Thí sinh</p>
                  <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-bold text-gray-900">{currentStudent.name}</span>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        currentStudent.status === "eliminated"
                          ? "bg-red-100 text-red-700"
                          : currentStudent.status === "passed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {studentStatusLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-white px-4 py-3">
                  <p className="text-sm text-gray-500">Đang tự động vào sân</p>
                  <p className="mt-1 font-bold text-gray-900">{studentName}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users size={18} className="text-green-700" />
                <h2 className="font-bold text-gray-900">Sĩ tử trong sân</h2>
              </div>
              <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                {room.students.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">Chưa có học sinh join.</p>
                ) : (
                  room.students.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-black text-green-700">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-semibold text-gray-800">
                          {student.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          student.status === "passed"
                            ? "text-green-700"
                            : student.status === "eliminated"
                              ? "text-red-600"
                              : "text-gray-500"
                        }`}
                      >
                        {student.status === "passed"
                          ? "Qua"
                          : student.status === "eliminated"
                            ? "Hạ bảng"
                            : "Đang thi"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-white p-5 md:p-8">
            {!question ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <Bell className="mb-4 text-yellow-500" size={52} />
                <p className="text-2xl font-normal text-gray-900">Chờ giáo viên phát câu hỏi</p>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Khi giáo viên bấm phát câu, nội dung sẽ tự hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-7">
                <div className="rounded-xl border border-green-100 bg-green-50 p-5 md:p-6">
                  <div className="mb-3 inline-flex rounded-md bg-yellow-400 px-3 py-1 text-xs font-normal uppercase tracking-wide text-gray-900">
                    Câu hỏi hiện tại
                  </div>
                  <div translate="no" className="notranslate space-y-4 text-xl font-normal leading-8 text-gray-900 md:text-2xl">
                    {renderContent(contentChain)}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {answers.length === 0 ? (
                    <p className="text-sm text-gray-500">Câu hỏi chưa có đáp án.</p>
                  ) : (
                    answers.map((answer, index) => {
                      const label = String.fromCharCode(65 + index);
                      const isSelectedAnswer = selectedAnswer?.id === answer.id;
                      const showCorrect = hasSelected && answer.isCorrect;
                      const showWrong = hasSelected && isSelectedAnswer && !answer.isCorrect;

                      const answerClass = showCorrect
                        ? "border-green-600 bg-green-50 shadow-green-100"
                        : showWrong
                          ? "border-red-500 bg-red-50 shadow-red-100"
                          : isSelectedAnswer
                            ? "border-yellow-500 bg-yellow-50 shadow-yellow-100"
                            : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50";

                      return (
                        <button
                          key={answer.id}
                          type="button"
                          disabled={hasSelected || isEliminated || isQuestionClosed}
                          onClick={() => handleSelectAnswer(answer)}
                          className={`min-h-24 w-full rounded-xl border p-4 text-left shadow-sm transition ${answerClass}`}
                        >
                          <div className="flex items-start gap-4">
                            <span translate="no" lang="en" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-green-600 bg-green-50 font-black text-green-700">
                              {label}
                            </span>
                            <div translate="no" className="notranslate flex-1 space-y-2 text-base font-bold text-gray-900">
                              {renderContent(buildContentChain(answer), "Đáp án chưa có nội dung.")}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-16 items-center border-t border-gray-200 bg-gray-50 px-5 py-4">
            {isEliminated ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
                <XCircle size={18} />
                Rất tiếc, bạn đã bị loại và không thể tiếp tục trả lời.
              </div>
            ) : hasSelected ? (
              <div
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                  isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {isCorrect ? "Bạn được đi tiếp" : "Bạn đã trả lời sai"}
              </div>
            ) : (
              <p className="text-sm font-medium text-gray-500">
                Chọn một đáp án sau khi giáo viên phát câu hỏi.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GoldenBellExam = () => {
  const { id } = useParams();
  const roomId = (id || "").trim().toUpperCase();

  return roomId ? <GoldenBellRoom roomId={roomId} /> : <GoldenBellLobby />;
};

export default GoldenBellExam;
