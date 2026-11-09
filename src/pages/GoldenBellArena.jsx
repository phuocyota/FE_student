import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, Gift, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { buildAssetUrl } from "../api/client";
import { createAppSocket } from "../api/socket";
import GoldenBellArenaCelebration from "../components/GoldenBellArena/GoldenBellArenaCelebration";
import GoldenBellArenaStudentCard from "../components/GoldenBellArena/GoldenBellArenaStudentCard";
import { getGoldenBellWinner } from "../utils/goldenBellWinner";
import { getGoldenBellRanking } from "../utils/goldenBellRanking";
import RankingPodium from "../components/GoldenBellRanking/RankingPodium";
import { applyLocalPodium, localPodiumKey, readLocalPodiumRoom, rememberPodiumResult } from "../utils/goldenBellLocalPodium";
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

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const createEmptyRoom = (roomId) => ({
  roomId,
  code: roomId,
  currentQuestion: null,
  questionNo: 0,
  usedQuestionIds: [],
  students: [],
});

const GoldenBellArena = () => {
  const { id } = useParams();
  const roomId = (id || "").trim().toUpperCase();
  const [room, setRoom] = useState(() => readLocalPodiumRoom(roomId) || createEmptyRoom(roomId));
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [roomError, setRoomError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(QUESTION_SECONDS);
  const socketRef = useRef(null);

  const students = useMemo(() => toArray(room.students), [room.students]);
  const ranking = useMemo(() => getGoldenBellRanking(room), [room]);
  const winner = room.status === "FINISHED" ? ranking.find((student) => student.isWinner) : getGoldenBellWinner(room);
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
    return getQuestionAnswerOptions(room.currentQuestion);
  }, [room.currentQuestion]);
  const currentQuestionId = room.currentQuestion?.id;
  const questionStartedAt = room.questionStartedAt;
  const questionDurationSeconds = room.questionDurationSeconds;
  const questionEndedAt = room.questionEndedAt;
  const isTimeUp = Boolean(room.currentQuestion) && remainingSeconds <= 0;
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
          if (response?.hasPodiumResult && response.room?.status === "FINISHED") {
            handlePodiumResult({ roomId, room: response.room });
          } else if (response?.room) handleRoomState(response.room);
        }
      });
    };

    const handleDisconnect = () => {
      setSocketStatus("disconnected");
    };

    const handleRoomState = (nextRoom) => {
      if (!nextRoom || (nextRoom.roomId || nextRoom.code) !== roomId) return;

      if (nextRoom.status === "FINISHED" || nextRoom.status === "EXPIRED") {
        setRoomError(
          nextRoom.status === "EXPIRED"
            ? "Phòng đã hết hạn sau 24 giờ."
            : "Giáo viên đã kết thúc phòng thi đấu."
        );
        setRoom((previousRoom) => applyLocalPodium({
          ...previousRoom,
          ...nextRoom,
          students: nextRoom.students?.length ? toArray(nextRoom.students) : previousRoom.students,
          questionNo: nextRoom.questionNo || previousRoom.questionNo,
          questionEndedAt: nextRoom.questionEndedAt || new Date().toISOString(),
        }));
        setRemainingSeconds(0);
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
    const handlePodiumResult = (payload) => {
      if (payload?.roomId !== roomId || payload.room?.status !== "FINISHED") return;
      let result = payload.room;
      try { result = rememberPodiumResult(result); } catch { /* Keep the live result if browser storage is full. */ }
      handleRoomState(result);
    };
    socket.on("golden-bell:podium-result", handlePodiumResult);
    const handleLocalPodium = (event) => {
      if (event.key !== localPodiumKey(roomId)) return;
      setRoom((previous) => {
        const saved = readLocalPodiumRoom(roomId);
        // The arena may have missed the final room event while disconnected.
        if (saved && previous.status !== "FINISHED" && previous.status !== "EXPIRED") return saved;
        return applyLocalPodium(previous);
      });
    };
    window.addEventListener("storage", handleLocalPodium);

    return () => {
      if (roomId) socket.emit("golden-bell:leave", { roomId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("golden-bell:room-state", handleRoomState);
      socket.off("golden-bell:podium-result", handlePodiumResult);
      window.removeEventListener("storage", handleLocalPodium);
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
      <GoldenBellArenaCelebration room={room} roomId={roomId} />
      {room.status === "FINISHED" && <p role="status" className="bg-green-100 px-4 py-3 text-center font-bold text-green-800">Phòng thi đã kết thúc.</p>}
      {room.status === "FINISHED" && <div className="mx-auto w-full max-w-5xl px-4 py-6" aria-live="polite"><RankingPodium ranking={ranking} /></div>}
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-col items-center gap-5 border-b border-green-200 pb-6 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-green-700 sm:text-sm">
              <Bell size={18} />
              Đấu trường kiến thức Rung chuông vàng
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Sàn thi đấu trực tuyến
            </h1>
          </div>

          <div className="grid w-full max-w-xl grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="rounded-xl border border-green-200 bg-white px-2 py-3 shadow-sm sm:px-5">
              <p className="text-xs font-bold uppercase text-gray-500">Câu hiện tại</p>
              <p className="text-2xl font-black text-green-700">
                {room.questionNo || 0}
              </p>
            </div>
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-2 py-3 shadow-sm sm:px-5">
              <p className="text-xs font-bold uppercase text-gray-500">Cứu trợ</p>
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-yellow-700">
                <Gift size={16} />
                Sẵn sàng
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-white px-2 py-3 shadow-sm sm:px-5">
              <p className="text-xs font-bold uppercase text-gray-500">Đồng hồ</p>
              <p className="font-mono text-2xl font-black text-red-600">
                00:{String(remainingSeconds).padStart(2, "0")}
              </p>
            </div>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <section aria-label="Nội dung câu hỏi" className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 inline-flex rounded-md bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-gray-900">
              Lĩnh vực: Trắc nghiệm
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
                  {answers.map((answer, index) => {
                    const showCorrectAnswer = isTimeUp && answer.isCorrect;

                    return (
                      <div
                        key={answer.id}
                        className={`flex min-h-20 items-center gap-4 rounded-xl border px-5 py-4 shadow-sm transition-colors ${
                          showCorrectAnswer
                            ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                            showCorrectAnswer
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-green-600 bg-green-50 text-green-700"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="min-w-0 flex-1 text-base font-bold text-gray-800">
                          {showCorrectAnswer && (
                            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
                              <CheckCircle2 size={14} />
                              Đáp án đúng
                            </div>
                          )}
                          {renderContent(
                            buildContentChain(answer),
                            "text-base font-bold text-gray-800"
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                    : `Màn hình sẽ cập nhật trực tiếp theo phòng ${room.code}.`}
                </p>
              </div>
            )}
          </section>

          <section aria-label="Danh sách thí sinh" className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-green-700">
                <Users size={18} />
                Thí sinh trong phòng
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-gray-900">{activeCount}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900">{students.length}</span>
                <span className="text-gray-900">còn trụ</span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded border border-green-200 bg-green-50 px-2 py-1 text-green-700">
                  Đang đấu
                </span>
                <span className="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-gray-700">
                  Hạ bảng: {eliminatedCount}
                </span>
                <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">
                  {socketStatus === "connected" ? "Trực tuyến" : socketStatus === "connecting" ? "Đang kết nối" : "Mất kết nối"}
                </span>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="flex min-h-28 flex-col items-center justify-center text-center text-gray-500">
                <Users className="mb-2 text-gray-400" size={30} />
                <p className="text-sm font-medium">Chưa có học sinh tham gia phòng.</p>
              </div>
            ) : (
              <div className="grid max-h-[65vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-2">
                {students.map((student) => (
                    <GoldenBellArenaStudentCard
                      key={student.id}
                      student={student}
                      questionNo={room.questionNo}
                      isWinner={winner?.id === student.id}
                    />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default GoldenBellArena;
