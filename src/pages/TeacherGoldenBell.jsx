import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Play,
  PlusCircle,
  RotateCcw,
  Search,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginTeacher } from "../api/auth";
import { buildAssetUrl } from "../api/client";
import {
  getCurrentGoldenBellQuestionBank,
  getQuestionBankDetail,
  getQuestionBankOptions,
  getRandomQuestion,
} from "../api/questionBank";
import { createAppSocket } from "../api/socket";
import TeacherGoldenBellCelebration from "../components/TeacherGoldenBell/TeacherGoldenBellCelebration";
import { getGoldenBellWinner } from "../utils/goldenBellWinner";
import GoldenBellWinnerBadge from "../components/GoldenBell/GoldenBellWinnerBadge";
import StudentAvatar from "../components/GoldenBell/StudentAvatar";
import { openGoldenBellRanking, podiumSelectionsKey, withEliminationHistory } from "../utils/goldenBellRanking";
import { reviveGoldenBellStudentOnServer } from "../api/goldenBell";
import { isWaitingAfterGoldenBellRevival } from "../utils/goldenBellRevival";
import {
  buildContentChain,
  getQuestionAnswerOptions,
} from "../utils/questionContent";

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
  const questionBankId = id || "";
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
    totalQuestions: null,
  });
  const [questionBankOptions, setQuestionBankOptions] = useState([]);
  const [isQuestionBankMenuOpen, setIsQuestionBankMenuOpen] = useState(false);
  const [isLoadingQuestionBanks, setIsLoadingQuestionBanks] = useState(false);
  const [questionBankSearch, setQuestionBankSearch] = useState("");
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isEndingRoom, setIsEndingRoom] = useState(false);
  const [revivingStudentId, setRevivingStudentId] = useState(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isOutOfQuestions, setIsOutOfQuestions] = useState(false);

  const socketRef = useRef(null);
  const roomRef = useRef(room);
  const questionBankMenuRef = useRef(null);

  const students = useMemo(() => toArray(room.students), [room.students]);
  const activeStudents = students.filter((student) => student.status === "active");
  const passedStudents = students.filter(
    (student) =>
      student.status === "passed" && student.lastQuestionNo === room.questionNo && (student.resumeFromQuestionNo || 0) <= room.questionNo
  );
  const eliminatedStudents = students.filter(
    (student) => student.status === "eliminated"
  );
  const currentContent = useMemo(
    () => buildContentChain(room.currentQuestion),
    [room.currentQuestion]
  );
  const answers = useMemo(() => {
    return getQuestionAnswerOptions(room.currentQuestion);
  }, [room.currentQuestion]);

  const isAuthenticated = Boolean(teacher.token);
  const winner = getGoldenBellWinner(room);
  const isRoomFinished = room.status === "FINISHED" || room.status === "EXPIRED";
  const questionBankName =
    questionBankInfo.id === questionBankId
      ? questionBankInfo.name
      : "Đang tải tên đề thi...";
  const filteredQuestionBankOptions = useMemo(() => {
    const keyword = questionBankSearch.trim().toLocaleLowerCase("vi");
    if (!keyword) return questionBankOptions;

    return questionBankOptions.filter((option) =>
      [
        option.name,
        option.examSetName,
        option.gradeName,
        option.subjectName,
      ]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword))
    );
  }, [questionBankOptions, questionBankSearch]);

  const syncRoom = useCallback(
    (nextRoom) => {
      nextRoom = withEliminationHistory(roomRef.current, nextRoom);
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
    if (!teacher.token || questionBankId) return undefined;

    let isCancelled = false;

    getCurrentGoldenBellQuestionBank(teacher.token)
      .then((questionBank) => {
        if (isCancelled) return;
        const roomQuery = roomId ? `?room=${encodeURIComponent(roomId)}` : "";
        navigate(`/teacher/${questionBank.id}${roomQuery}`, { replace: true });
      })
      .catch((error) => {
        if (isCancelled) return;
        toast.error(error.message || "Không thể tải đề Rung chuông vàng");
      });

    return () => {
      isCancelled = true;
    };
  }, [navigate, questionBankId, roomId, teacher.token]);

  useEffect(() => {
    if (!teacher.token || !questionBankId) return undefined;

    let isCancelled = false;

    getQuestionBankDetail(questionBankId, teacher.token)
      .then((response) => {
        if (isCancelled) return;
        const payload = response?.data?.data || response?.data || response;
        setQuestionBankInfo({
          id: questionBankId,
          name:
            payload?.title ||
            payload?.name ||
            payload?.code ||
            "Đề thi chưa có tên",
          totalQuestions: Number(payload?.totalQuestions) || null,
        });
      })
      .catch(() => {
        if (isCancelled) return;
        setQuestionBankInfo({
          id: questionBankId,
          name: "Không tải được tên đề thi",
          totalQuestions: null,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [questionBankId, teacher.token]);

  useEffect(() => {
    if (!isQuestionBankMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!questionBankMenuRef.current?.contains(event.target)) {
        setIsQuestionBankMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsQuestionBankMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isQuestionBankMenuOpen]);

  const loadQuestionBankOptions = useCallback(async () => {
    if (questionBankOptions.length || isLoadingQuestionBanks) return;

    setIsLoadingQuestionBanks(true);

    try {
      const options = await getQuestionBankOptions(teacher.token);
      const includesCurrentQuestionBank = options.some(
        (option) => option.id === questionBankId
      );

      setQuestionBankOptions(
        includesCurrentQuestionBank
          ? options
          : [
              {
                id: questionBankId,
                name: questionBankName,
                examSetName: "Đề thi hiện tại",
                gradeName: "",
                subjectName: "",
              },
              ...options,
            ]
      );
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách đề thi");
    } finally {
      setIsLoadingQuestionBanks(false);
    }
  }, [
    isLoadingQuestionBanks,
    questionBankId,
    questionBankName,
    questionBankOptions.length,
    teacher.token,
  ]);

  const handleToggleQuestionBankMenu = () => {
    setIsQuestionBankMenuOpen((isOpen) => {
      const nextIsOpen = !isOpen;
      if (nextIsOpen) void loadQuestionBankOptions();
      return nextIsOpen;
    });
  };

  const handleSelectQuestionBank = (option) => {
    if (option.id === questionBankId) {
      setIsQuestionBankMenuOpen(false);
      return;
    }

    if (roomId) {
      toast.error("Vui lòng kết thúc phòng hiện tại trước khi đổi đề thi");
      return;
    }

    setQuestionBankInfo({
      id: option.id,
      name: option.name,
      totalQuestions: Number(option.totalQuestions) || null,
    });
    setIsQuestionBankMenuOpen(false);
    setQuestionBankSearch("");
    navigate(`/teacher/${option.id}`);
  };

  useEffect(() => {
    if (!teacher.token || !questionBankId) return undefined;

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
      nextRoom = withEliminationHistory(roomRef.current, nextRoom);

      if (nextRoom.status === "FINISHED" || nextRoom.status === "EXPIRED") {
        if (nextRoom.status === "FINISHED" &&
          (getGoldenBellWinner(nextRoom) || getGoldenBellWinner(roomRef.current))) {
          const finalRoom = { ...roomRef.current, ...nextRoom };
          if (!getGoldenBellWinner(finalRoom)) finalRoom.students = roomRef.current.students;
          if (!finalRoom.questionNo) finalRoom.questionNo = roomRef.current.questionNo;
          roomRef.current = finalRoom;
          setRoom(finalRoom);
          return;
        }
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

  const markRoomFinished = useCallback(() => {
    const finalRoom = { ...roomRef.current, status: "FINISHED" };
    roomRef.current = finalRoom;
    setRoom(finalRoom);
  }, []);

  const handleCreateRoom = () => {
    if (!questionBankId) {
      toast.error("Đề Rung chuông vàng đang được tải, vui lòng thử lại");
      return;
    }

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
    if (isRoomFinished || getGoldenBellWinner(roomRef.current)) return;
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
      let response;

      try {
        response = await getRandomQuestion(questionBankId, excludedIds);
      } catch (error) {
        const totalQuestions = questionBankInfo.totalQuestions;
        const stoppedBeforeExpectedTotal =
          !reset &&
          error.status === 404 &&
          totalQuestions &&
          currentUsedIds.length < totalQuestions;

        if (!stoppedBeforeExpectedTotal) throw error;

        const usedIds = new Set(currentUsedIds);
        const compactExcludedIds = currentUsedIds.slice(-35);

        for (let attempt = 0; attempt < 80; attempt += 1) {
          const candidateResponse = await getRandomQuestion(
            questionBankId,
            compactExcludedIds
          );
          const candidate =
            candidateResponse?.data?.data ||
            candidateResponse?.data ||
            candidateResponse;

          if (candidate?.id && !usedIds.has(candidate.id)) {
            response = candidateResponse;
            break;
          }
        }

        if (!response) throw error;
      }

      const nextQuestion =
        response?.data?.data || response?.data || response;

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
    if (isRoomFinished || getGoldenBellWinner(roomRef.current)) return;
    syncRoom({
      ...createEmptyRoom(roomId, questionBankId),
      students: students.map((student) => ({
        ...student,
        status: "active",
        lastQuestionNo: 0,
        correctCount: 0,
        wrongCount: 0,
        resumeFromQuestionNo: 0,
        revivalCount: 0,
        revivedAt: null,
      })),
    });
    setIsOutOfQuestions(false);
    toast.success("Đã reset phòng");
  };

  const handleReviveStudent = async (studentId) => {
    if (revivingStudentId || isLoadingQuestion || isEndingRoom || isRoomFinished) return;
    if (!socketRef.current?.connected) {
      toast.error("Cần kết nối phòng để hồi sinh thí sinh.");
      return;
    }
    setRevivingStudentId(studentId);
    try {
      const nextRoom = await reviveGoldenBellStudentOnServer(socketRef.current, roomRef.current, studentId);
      localStorage.setItem(podiumSelectionsKey(roomId, false), "{}");
      roomRef.current = nextRoom;
      setRoom(nextRoom);
      const student = nextRoom.students.find((item) => item.id === studentId);
      toast.success(`Đã hồi sinh ${student.name}. Thí sinh sẽ tiếp tục từ câu hỏi kế tiếp.`);
    } catch (error) {
      toast.error(error.message || "Không thể hồi sinh thí sinh.");
    } finally {
      setRevivingStudentId(null);
    }
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

        if (getGoldenBellWinner(roomRef.current)) {
          markRoomFinished();
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
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

  if (!questionBankId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={22} />
          Đang tải đề Rung chuông vàng...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TeacherGoldenBellCelebration room={room} roomId={roomId} />
      {isRoomFinished && <p role="status" className="bg-green-100 px-4 py-3 text-center font-bold text-green-800">Phòng {roomId} đã kết thúc. Thầy/Cô có thể tạo phòng khác để bắt đầu cuộc thi mới.</p>}
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
            <div ref={questionBankMenuRef} className="relative min-w-72 max-w-full">
              <button
                type="button"
                onClick={handleToggleQuestionBankMenu}
                aria-expanded={isQuestionBankMenuOpen}
                aria-haspopup="listbox"
                className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-2 text-left transition hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                  isQuestionBankMenuOpen
                    ? "border-yellow-500 ring-2 ring-yellow-100"
                    : "border-yellow-300"
                }`}
                title={`Question bank: ${questionBankId}`}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-gray-500">Đề thi</span>
                  <span className="block max-w-72 truncate font-semibold text-gray-900">
                    {questionBankName}
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-yellow-700 transition-transform ${
                    isQuestionBankMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isQuestionBankMenuOpen && (
                <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:right-auto sm:w-[420px]">
                  <div className="border-b border-gray-100 p-3">
                    <p className="mb-2 text-sm font-semibold text-gray-900">
                      Chọn đề thi
                    </p>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-100">
                      <Search size={16} className="shrink-0 text-gray-400" />
                      <input
                        autoFocus
                        value={questionBankSearch}
                        onChange={(event) => setQuestionBankSearch(event.target.value)}
                        placeholder="Tìm theo tên đề, môn hoặc khối..."
                        className="w-full bg-transparent py-2 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2" role="listbox">
                    {isLoadingQuestionBanks ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                        <Loader2 className="animate-spin" size={18} />
                        Đang tải danh sách đề thi...
                      </div>
                    ) : filteredQuestionBankOptions.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-500">
                        {questionBankOptions.length
                          ? "Không tìm thấy đề thi phù hợp"
                          : "Chưa có đề thi để lựa chọn"}
                      </p>
                    ) : (
                      filteredQuestionBankOptions.map((option) => {
                        const isSelected = option.id === questionBankId;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectQuestionBank(option)}
                            className={`mb-1 flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition last:mb-0 ${
                              isSelected
                                ? "bg-yellow-50 text-yellow-900"
                                : "text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {option.name}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-gray-500">
                                {[option.gradeName, option.subjectName, option.examSetName]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>
                            {isSelected && (
                              <Check size={17} className="mt-0.5 shrink-0 text-yellow-700" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {roomId && (
                    <p className="border-t border-yellow-100 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                      Kết thúc phòng hiện tại trước khi đổi đề thi.
                    </p>
                  )}
                </div>
              )}
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
                  <button type="button" disabled={!roomId} onClick={() => openGoldenBellRanking(navigate, { ...room, questionBankName, teacherName: teacher.name }, `/teacher/${questionBankId}?room=${roomId}`)} className="inline-flex items-center gap-2 rounded-lg border border-green-300 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"><Trophy size={16} />Xếp hạng</button>
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
                    disabled={!roomId || isRoomFinished || Boolean(revivingStudentId) || Boolean(getGoldenBellWinner(room))}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw size={16} />
                    Reset phòng
                  </button>
                  <button
                    type="button"
                    onClick={handleEndRoom}
                    disabled={!roomId || isEndingRoom || isRoomFinished || Boolean(revivingStudentId)}
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
                    disabled={!roomId || isLoadingQuestion || isRoomFinished || Boolean(revivingStudentId) || Boolean(getGoldenBellWinner(room))}
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
                        className={`rounded-lg border p-3 ${winner?.id === student.id ? "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-100" : "border-gray-200"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <StudentAvatar student={student} />
                            <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            {(student.className || student.schoolName) && <p className="text-xs text-gray-500">{[student.className, student.schoolName].filter(Boolean).join(" · ")}</p>}
                            <p className="text-xs text-gray-500">
                              Câu cuối: {student.lastQuestionNo || 0}
                            </p>
                            </div>
                          </div>
                          {winner?.id === student.id ? <GoldenBellWinnerBadge /> : <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                              isWaitingAfterGoldenBellRevival(student, room.questionNo)
                                ? "bg-blue-100 text-blue-700"
                                : student.status === "passed"
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
                            {isWaitingAfterGoldenBellRevival(student, room.questionNo) ? "Đã hồi sinh · Chờ câu tiếp theo" : student.status === "passed"
                              ? "Qua"
                              : student.status === "eliminated"
                                ? "Bị loại"
                                : "Đang thi"}
                          </span>}
                        </div>
                        <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-center gap-2 text-sm">
                          <div className="rounded bg-green-50 px-2 py-1 text-green-700">
                            Đúng: {student.correctCount || 0}
                          </div>
                          <div className="rounded bg-red-50 px-2 py-1 text-red-600">
                            Sai: {student.wrongCount || 0}
                          </div>
                          {student.status === "eliminated" && <button type="button" aria-label={`Hồi sinh ${student.name}`} onClick={() => handleReviveStudent(student.id)} aria-busy={revivingStudentId === student.id} disabled={isRoomFinished || isLoadingQuestion || isEndingRoom || socketStatus !== "connected" || Boolean(revivingStudentId)} className="inline-flex items-center justify-center gap-1 rounded border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={13} aria-hidden="true" />{revivingStudentId === student.id ? "Đang hồi sinh..." : "Hồi sinh"}</button>}
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
