import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Gift, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { buildAssetUrl } from "../api/client";
import { createAppSocket } from "../api/socket";

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

const createEmptyRoom = (roomId) => ({
  roomId,
  code: roomId,
  currentQuestion: null,
  questionNo: 0,
  usedQuestionIds: [],
  students: [],
});

const getSeatColor = (index) => {
  const colors = [
    "bg-rose-500",
    "bg-pink-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-400",
    "bg-indigo-500",
    "bg-teal-400",
    "bg-orange-500",
    "bg-fuchsia-500",
  ];

  return colors[index % colors.length];
};

const GoldenBellArena = () => {
  const { id } = useParams();
  const roomId = (id || "").trim().toUpperCase();
  const [room, setRoom] = useState(() => createEmptyRoom(roomId));
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [roomError, setRoomError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(QUESTION_SECONDS);
  const socketRef = useRef(null);

  const students = useMemo(() => toArray(room.students), [room.students]);
  const activeCount = students.filter(
    (student) => student.status !== "eliminated"
  ).length;
  const eliminatedCount = students.filter(
    (student) => student.status === "eliminated"
  ).length;
  const questionContent = useMemo(
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
  const currentQuestionId = room.currentQuestion?.id;
  const questionStartedAt = room.questionStartedAt;
  const questionDurationSeconds = room.questionDurationSeconds;
  const questionEndedAt = room.questionEndedAt;
  useEffect(() => {
    const socket = createAppSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketStatus("connected");
      if (!roomId) {
        setRoomError("Thiếu mã phòng thi đấu.");
        return;
      }

      socket.emit("golden-bell:join", { roomId }, (response) => {
        if (response?.ok === false) {
          setRoomError("Không tìm thấy phòng hoặc phòng đã kết thúc.");
        } else {
          setRoomError("");
        }
      });
    };

    const handleDisconnect = () => {
      setSocketStatus("disconnected");
    };

    const handleRoomState = (nextRoom) => {
      if (!nextRoom) return;

      if (nextRoom.status === "FINISHED" || nextRoom.status === "EXPIRED") {
        setRoomError(
          nextRoom.status === "EXPIRED"
            ? "Phòng đã hết hạn sau 24 giờ."
            : "Giáo viên đã kết thúc phòng thi đấu."
        );
        setRoom({
          ...createEmptyRoom(roomId),
          status: nextRoom.status,
        });
        return;
      }

      setRoomError("");

      const normalizedRoom = {
        ...createEmptyRoom(roomId),
        ...nextRoom,
        students: toArray(nextRoom.students),
        usedQuestionIds: toArray(nextRoom.usedQuestionIds),
      };

      setRemainingSeconds(getRemainingSeconds(normalizedRoom));
      setRoom(normalizedRoom);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("golden-bell:room-state", handleRoomState);

    return () => {
      if (roomId) socket.emit("golden-bell:leave", { roomId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("golden-bell:room-state", handleRoomState);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    if (!currentQuestionId) return undefined;

    const updateRemainingSeconds = () => {
      setRemainingSeconds(
        getRemainingSeconds({
          currentQuestion: { id: currentQuestionId },
          questionStartedAt,
          questionDurationSeconds,
          questionEndedAt,
        })
      );
    };

    const timer = window.setInterval(updateRemainingSeconds, 250);

    return () => window.clearInterval(timer);
  }, [
    currentQuestionId,
    questionDurationSeconds,
    questionEndedAt,
    questionStartedAt,
  ]);

  const renderContent = (chain, className = "") => {
    if (!chain.length) return null;

    return chain.map((item) => {
      if (item.contentType === "TEXT") {
        return (
          <p key={item.id} className={className}>
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
            className="max-h-56 rounded-lg border border-gray-200 object-contain"
          />
        );
      }

      if (item.contentType === "AUDIO") {
        return (
          <audio
            key={item.id}
            controls
            src={buildAssetUrl(item.content)}
            className="w-full"
          />
        );
      }

      return null;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-100 to-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-green-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-green-700">
              <Bell size={18} />
              Đấu trường kiến thức Rung chuông vàng
            </div>
            <h1 className="mt-2 text-3xl font-normal tracking-tight text-gray-900">
              Sàn thi đấu trực tiếp
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-green-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Cau hien tai</p>
              <p className="text-2xl font-black text-green-700">
                {room.questionNo || 0}
              </p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-5 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Cuu tro</p>
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-yellow-700">
                <Gift size={16} />
                San sang
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Dong ho</p>
              <p className="font-mono text-2xl font-black text-red-600">
                00:{String(remainingSeconds).padStart(2, "0")}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-5 inline-flex rounded-md bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-gray-900">
              Linh vuc: Trac nghiem bon phuong an
            </div>

            {room.currentQuestion ? (
              <>
                <div className="mb-8 text-2xl font-normal leading-9 text-gray-900">
                  {renderContent(
                    questionContent,
                    "text-2xl font-normal leading-9 text-gray-900"
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {answers.map((answer, index) => (
                    <div
                      key={answer.id}
                      className="flex min-h-20 items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-green-600 bg-green-50 text-sm font-black text-green-700">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {renderContent(
                          buildContentChain(answer),
                          "text-base font-bold text-gray-800"
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <Bell className="mb-4 text-yellow-500" size={52} />
                <p className="text-2xl font-normal">
                  {roomError || "Chờ giáo viên phát câu hỏi"}
                </p>
                <p className="mt-2 text-gray-500">
                  {roomError
                    ? "Vui lòng mở lại sân thi đấu từ bảng điều khiển giáo viên."
                    : `Màn hình sẽ cập nhật realtime theo phòng ${room.code}.`}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-green-700">
                <Users size={18} />
                Thí sinh trong phòng:
                <span className="text-gray-900">{activeCount}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900">{students.length}</span>
                <span className="text-gray-900">còn trụ</span>
              </div>

              <div className="flex gap-2 text-xs font-bold">
                <span className="rounded border border-green-200 bg-green-50 px-3 py-1 text-green-700">
                  Đang đấu
                </span>
                <span className="rounded border border-gray-200 bg-gray-100 px-3 py-1 text-gray-700">
                  Hạ bảng: {eliminatedCount}
                </span>
                <span className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                  {socketStatus === "connected" ? "Online" : "Dang ket noi"}
                </span>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="flex min-h-28 flex-col items-center justify-center text-center text-gray-500">
                <Users className="mb-2 text-gray-400" size={30} />
                <p className="text-sm font-medium">Chưa có học sinh tham gia phòng.</p>
              </div>
            ) : (
              <div className="grid max-h-[38vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10">
                {students.map((student, index) => {
                  const isEliminated = student.status === "eliminated";
                  const isPassed = student.status === "passed";

                  return (
                    <div
                      key={student.id}
                      className={`rounded-lg border px-3 py-3 text-center ${
                        isEliminated
                          ? "border-gray-200 bg-gray-100 opacity-50"
                          : isPassed
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 bg-white"
                      }`}
                    >
                      <div
                        className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${getSeatColor(index)}`}
                      >
                        {index + 1}
                      </div>
                      <div className="truncate text-xs font-normal text-gray-900">
                        {student.name}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase text-gray-500">
                        {isEliminated ? "Hạ bảng" : "Đang đấu"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default GoldenBellArena;
