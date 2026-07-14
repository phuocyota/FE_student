import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Play,
  PlusCircle,
  RotateCcw,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginTeacher } from "../api/auth";
import { buildAssetUrl } from "../api/client";
import {
  getQuestionBankDetail,
  getRandomQuestion,
} from "../api/questionBank";
import { createAppSocket } from "../api/socket";

const DEFAULT_QUESTION_BANK_ID = "37b64ed4-0e46-4a00-9ae2-92b707d9a4ce";
const TEACHER_STORAGE_KEYS = [
  "teacherAccessToken",
  "teacherName",
  "teacherUserId",
];

const clearTeacherStorage = () => {
  TEACHER_STORAGE_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

const decodeJwtPayload = (token) => {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;

    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
};

const isValidTeacherToken = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || payload.userType !== "TEACHER") return false;

  return !payload.exp || payload.exp * 1000 > Date.now();
};

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const buildContentChain = (node) => {
  if (!node) return [];

  const current =
    node.contentType && node.content
      ? [{ id: node.id, contentType: node.contentType, content: node.content }]
      : [];

  return [
    ...current,
    ...toArray(node.nextContentDetails).flatMap((item) =>
      buildContentChain(item)
    ),
  ];
};

const createEmptyRoom = (roomId = "", questionBankId = "") => ({
  roomId,
  code: roomId,
  questionBankId,
  currentQuestion: null,
  questionNo: 0,
  usedQuestionIds: [],
  students: [],
});

const getInitialTeacher = () => {
  const token = sessionStorage.getItem("teacherAccessToken") || "";

  if (!isValidTeacherToken(token)) {
    clearTeacherStorage();
    return { token: "", name: "" };
  }

  return {
    token,
    name: sessionStorage.getItem("teacherName") || "",
  };
};

const TeacherGoldenBell = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const questionBankId = id || DEFAULT_QUESTION_BANK_ID;
  const roomId = (searchParams.get("room") || "").trim().toUpperCase();

  const [teacher, setTeacher] = useState(getInitialTeacher);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [room, setRoom] = useState(() =>
    createEmptyRoom(roomId, questionBankId)
  );
  const [questionBankInfo, setQuestionBankInfo] = useState({
    id: "",
    name: "",
  });
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isEndingRoom, setIsEndingRoom] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isOutOfQuestions, setIsOutOfQuestions] = useState(false);

  const socketRef = useRef(null);
  const roomRef = useRef(room);

  const students = useMemo(() => toArray(room.students), [room.students]);
  const activeStudents = students.filter((student) => student.status === "active");
  const passedStudents = students.filter(
    (student) =>
      student.status === "passed" && student.lastQuestionNo === room.questionNo
  );
  const eliminatedStudents = students.filter(
    (student) => student.status === "eliminated"
  );
  const currentContent = useMemo(
    () => buildContentChain(room.currentQuestion),
    [room.currentQuestion]
  );
  const answers = useMemo(() => {
    return toArray(room.currentQuestion?.answers).sort((a, b) => {
      const orderA = a.orderNo ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderNo ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) return orderA - orderB;
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
  }, [room.currentQuestion]);

  const isAuthenticated = Boolean(teacher.token);
  const questionBankName =
    questionBankInfo.id === questionBankId
      ? questionBankInfo.name
      : "Đang tải tên đề thi...";

  const syncRoom = useCallback(
    (nextRoom) => {
      roomRef.current = nextRoom;
      setRoom(nextRoom);
      if (!roomId) return;
      socketRef.current?.emit("golden-bell:sync", {
        roomId,
        room: nextRoom,
      });
    },
    [roomId]
  );

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    if (!teacher.token) return undefined;

    let isCancelled = false;

    getQuestionBankDetail(questionBankId, teacher.token)
      .then((response) => {
        if (isCancelled) return;
        const payload = response?.data?.data || response?.data || response;
        setQuestionBankInfo({
          id: questionBankId,
          name: payload?.name || payload?.code || "Đề thi chưa có tên",
        });
      })
      .catch(() => {
        if (isCancelled) return;
        setQuestionBankInfo({
          id: questionBankId,
          name: "Không tải được tên đề thi",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [questionBankId, teacher.token]);

  useEffect(() => {
    if (!teacher.token) return;

    const socket = createAppSocket(teacher.token);
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketStatus("connected");
      if (!roomId) return;

      socket.emit("golden-bell:join", {
        roomId,
      }, (response) => {
        if (response?.ok === false) {
          toast.error("Phòng không tồn tại hoặc đã kết thúc");
          navigate(`/teacher/${questionBankId}`, { replace: true });
        }
      });
    };

    const handleDisconnect = () => {
      setSocketStatus("disconnected");
      setIsCreatingRoom(false);
    };

    const handleConnectError = () => {
      setSocketStatus("disconnected");
      setIsCreatingRoom(false);
    };

    const handleRoomState = (nextRoom) => {
      if (!nextRoom) return;

      if (nextRoom.status === "FINISHED" || nextRoom.status === "EXPIRED") {
        setRoom(createEmptyRoom("", questionBankId));
        navigate(`/teacher/${questionBankId}`, { replace: true });
        if (nextRoom.status === "EXPIRED") {
          toast.error("Phòng đã hết hạn sau 24 giờ");
        }
        return;
      }

      const normalizedRoom = {
        ...createEmptyRoom(roomId, questionBankId),
        ...nextRoom,
        students: toArray(nextRoom.students),
        usedQuestionIds: toArray(nextRoom.usedQuestionIds),
      };

      roomRef.current = normalizedRoom;
      setRoom(normalizedRoom);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("golden-bell:room-state", handleRoomState);

    return () => {
      if (roomId) socket.emit("golden-bell:leave", { roomId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("golden-bell:room-state", handleRoomState);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [navigate, questionBankId, roomId, teacher.token]);

  const handleCreateRoom = () => {
    if (!socketRef.current?.connected) {
      toast.error("Socket chưa kết nối, vui lòng thử lại");
      return;
    }

    setIsCreatingRoom(true);
    socketRef.current.timeout(8000).emit(
      "golden-bell:create-room",
      { questionBankId },
      (error, response) => {
        setIsCreatingRoom(false);

        if (error) {
          toast.error(
            "Socket tạo phòng không phản hồi. Vui lòng kiểm tra cấu hình máy chủ."
          );
          return;
        }

        if (!response?.ok || !response.roomId) {
          toast.error(response?.message || "Không thể tạo phòng");
          return;
        }

        roomRef.current = response.room;
        setRoom(response.room);
        navigate(`/teacher/${questionBankId}?room=${response.roomId}`, {
          replace: true,
        });
        toast.success(`Đã tạo phòng ${response.roomId}`);
      }
    );
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await loginTeacher({
        username: loginForm.username.trim(),
        password: loginForm.password,
        deviceId: "web-teacher",
      });
      const payload = response?.data?.data || response?.data || response;
      const accessToken = payload?.accessToken;

      if (!accessToken) {
        throw new Error("Không nhận được token giáo viên");
      }

      if (!isValidTeacherToken(accessToken)) {
        throw new Error("Tài khoản không có quyền giáo viên");
      }

      const name = payload?.fullName || payload?.userName || loginForm.username;
      sessionStorage.setItem("teacherAccessToken", accessToken);
      sessionStorage.setItem("teacherName", name);
      sessionStorage.setItem("teacherUserId", payload?.userId || "");
      setTeacher({ token: accessToken, name });
      toast.success("Đăng nhập giáo viên thành công");
    } catch (error) {
      toast.error(error.message || "Không thể đăng nhập giáo viên");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearTeacherStorage();
    setTeacher({ token: "", name: "" });
    setRoom(createEmptyRoom("", questionBankId));
  };

  const fetchQuestion = async ({ reset = false } = {}) => {
    setIsLoadingQuestion(true);
    setIsOutOfQuestions(false);

    try {
      if (!roomId) {
        toast.error("Vui lòng tạo phòng trước khi phát câu hỏi");
        return;
      }

      const currentRoom =
        roomRef.current || createEmptyRoom(roomId, questionBankId);
      const currentUsedIds = toArray(currentRoom.usedQuestionIds);
      const excludedIds = reset ? [] : currentUsedIds;
      const response = await getRandomQuestion(questionBankId, excludedIds);
      const nextQuestion = response?.data || response;

      if (!nextQuestion?.id) {
        throw new Error("Không nhận được dữ liệu câu hỏi");
      }

      const nextRoom = {
        ...currentRoom,
        roomId,
        code: currentRoom.code || roomId,
        questionBankId,
        currentQuestion: nextQuestion,
        questionNo: reset ? 1 : (currentRoom.questionNo || 0) + 1,
        questionStartedAt: new Date().toISOString(),
        questionDurationSeconds: 15,
        questionEndedAt: null,
        usedQuestionIds: reset
          ? [nextQuestion.id]
          : [...currentUsedIds, nextQuestion.id],
        students: toArray(currentRoom.students).map((student) => ({
          ...student,
          status: student.status === "eliminated" ? "eliminated" : "active",
          lastQuestionNo:
            reset || student.status !== "eliminated" ? 0 : student.lastQuestionNo,
        })),
      };

      syncRoom(nextRoom);
    } catch (error) {
      if (error.status === 404 || error.message?.toLowerCase().includes("not found")) {
        setIsOutOfQuestions(true);
        toast("Đã hết câu hỏi trong ngân hàng");
        return;
      }

      toast.error(error.message || "Không thể lấy câu hỏi");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleResetRoom = () => {
    syncRoom({
      ...createEmptyRoom(roomId, questionBankId),
      students: students.map((student) => ({
        ...student,
        status: "active",
        lastQuestionNo: 0,
        correctCount: 0,
        wrongCount: 0,
      })),
    });
    setIsOutOfQuestions(false);
    toast.success("Đã reset phòng");
  };

  const handleEndRoom = () => {
    if (!roomId || !socketRef.current?.connected) return;

    const shouldEndRoom = window.confirm(
      `Kết thúc phòng ${roomId}? Học sinh sẽ không thể tiếp tục tham gia hoặc trả lời.`
    );
    if (!shouldEndRoom) return;

    setIsEndingRoom(true);
    socketRef.current.timeout(8000).emit(
      "golden-bell:end-room",
      { roomId },
      (error, response) => {
        setIsEndingRoom(false);

        if (error || !response?.ok) {
          toast.error(response?.message || "Không thể kết thúc phòng");
          return;
        }

        setRoom(createEmptyRoom("", questionBankId));
        navigate(`/teacher/${questionBankId}`, { replace: true });
        toast.success(`Đã kết thúc phòng ${roomId}`);
      }
    );
  };

  const handleCopyStudentLink = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/golden-bell/${roomId}`);
    toast.success("Đã copy link học sinh");
  };

  const handleOpenArena = () => {
    if (!roomId) return;
    window.open(`/golden-bell-arena/${roomId}`, "_blank", "noopener,noreferrer");
  };
  const renderContent = (chain, emptyMessage = "Chưa có nội dung.") => {
    if (!chain.length) {
      return <p className="text-gray-500">{emptyMessage}</p>;
    }

    return chain.map((item) => {
      if (item.contentType === "TEXT") {
        return (
          <p key={item.id} className="text-base font-medium text-gray-900 leading-7">
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
            className="my-3 max-w-full rounded-lg border border-gray-200"
          />
        );
      }

      if (item.contentType === "AUDIO") {
        return <audio key={item.id} controls src={buildAssetUrl(item.content)} className="w-full" />;
      }

      return null;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              <Bell size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Giáo viên đăng nhập</h1>
            <p className="mt-1 text-sm text-gray-500">Điều khiển phòng Rung chuông vàng</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tài khoản giáo viên
              </label>
              <input
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, username: event.target.value }))
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Nhập tài khoản"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Nhập mật khẩu"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 font-semibold text-white hover:bg-yellow-700 disabled:opacity-60"
            >
              {isLoggingIn && <Loader2 className="animate-spin" size={16} />}
              {isLoggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-yellow-700 font-semibold">
              <Bell size={18} />
              <span>Rung chuông vàng</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  socketStatus === "connected"
                    ? "bg-green-100 text-green-700"
                    : socketStatus === "connecting"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {socketStatus === "connected"
                  ? "Socket online"
                  : socketStatus === "connecting"
                    ? "Đang kết nối"
                    : "Mất kết nối"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Xin chào Thầy/Cô {teacher.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Cảm ơn Thầy/Cô đã đồng hành cùng cuộc thi Rung chuông vàng!
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div
              className="min-w-72 max-w-full rounded-lg border border-yellow-300 bg-white px-4 py-2"
              title={`Question bank: ${questionBankId}`}
            >
              <p className="text-xs font-medium text-gray-500">Đề thi</p>
              <p className="max-w-80 truncate font-semibold text-gray-900">
                {questionBankName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isCreatingRoom || socketStatus !== "connected"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 font-semibold text-white hover:bg-yellow-700 disabled:opacity-60"
            >
              {isCreatingRoom ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <PlusCircle size={16} />
              )}
              {roomId ? "Tạo phòng khác" : "Tạo phòng mới"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-700 hover:bg-white"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>

        {!roomId && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
            <Bell className="mx-auto mb-3 text-yellow-600" size={36} />
            <h2 className="text-xl font-bold text-gray-900">Chưa mở phòng thi đấu</h2>
            <p className="mt-1 text-sm text-gray-600">
              Bấm “Tạo phòng mới” để nhận mã ngẫu nhiên cho học sinh tham gia.
            </p>
          </div>
        )}

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Mã phòng</p>
            <p className="mt-1 text-2xl font-bold tracking-wider text-gray-900">
              {room.code || "------"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Đã join</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Qua câu hiện tại</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{passedStudents.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Bị loại</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{eliminatedStudents.length}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Câu hiện tại: {room.questionNo || 0}</p>
                  <h2 className="text-lg font-bold text-gray-900">Nội dung câu hỏi</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyStudentLink}
                    disabled={!roomId}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Copy size={16} />
                    Copy link học sinh
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenArena}
                    disabled={!roomId}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink size={16} />
                    Mở sân thi đấu
                  </button>
                  <button
                    type="button"
                    onClick={handleResetRoom}
                    disabled={!roomId}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw size={16} />
                    Reset phòng
                  </button>
                  <button
                    type="button"
                    onClick={handleEndRoom}
                    disabled={!roomId || isEndingRoom}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {isEndingRoom ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Kết thúc phòng
                  </button>
                  <button
                    type="button"
                    disabled={!roomId || isLoadingQuestion}
                    onClick={() => fetchQuestion()}
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-60"
                  >
                    {isLoadingQuestion ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                    {room.currentQuestion ? "Câu tiếp theo" : "Phát câu đầu"}
                  </button>
                </div>
              </div>

              {isOutOfQuestions && (
                <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  Đã hết câu hỏi trong ngân hàng. Có thể reset phòng để bắt đầu lại.
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="mb-5 space-y-4">{renderContent(currentContent, "Giáo viên chưa phát câu hỏi.")}</div>
              <div className="grid gap-3">
                {answers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={`rounded-lg border p-3 ${
                      answer.isCorrect
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
                      <span>{String.fromCharCode(65 + index)}.</span>
                      {answer.isCorrect && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                    <div>{renderContent(buildContentChain(answer), "Đáp án chưa có nội dung.")}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-700" />
                <h2 className="font-semibold text-gray-900">Tổng quan</h2>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-600">Đang thi</span>
                  <span className="font-bold">{activeStudents.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <span className="text-sm text-gray-600">Qua câu</span>
                  <span className="font-bold text-green-700">{passedStudents.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                  <span className="text-sm text-gray-600">Bị loại</span>
                  <span className="font-bold text-red-600">{eliminatedStudents.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-200 p-4">
                <Users size={18} className="text-yellow-700" />
                <h2 className="font-semibold text-gray-900">Học sinh</h2>
              </div>
              <div className="max-h-[520px] overflow-y-auto p-3">
                {students.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Chưa có học sinh join.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">
                              Câu cuối: {student.lastQuestionNo || 0}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                              student.status === "passed"
                                ? "bg-green-100 text-green-700"
                                : student.status === "eliminated"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {student.status === "passed" ? (
                              <CheckCircle2 size={14} />
                            ) : student.status === "eliminated" ? (
                              <XCircle size={14} />
                            ) : (
                              <Users size={14} />
                            )}
                            {student.status === "passed"
                              ? "Qua"
                              : student.status === "eliminated"
                                ? "Bị loại"
                                : "Đang thi"}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded bg-green-50 px-2 py-1 text-green-700">
                            Đúng: {student.correctCount || 0}
                          </div>
                          <div className="rounded bg-red-50 px-2 py-1 text-red-600">
                            Sai: {student.wrongCount || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TeacherGoldenBell;
