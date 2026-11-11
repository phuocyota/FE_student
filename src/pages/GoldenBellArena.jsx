import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, Gift, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { buildAssetUrl } from "../api/client";
import { createAppSocket } from "../api/socket";
import GoldenBellArenaCelebration from "../components/GoldenBellArena/GoldenBellArenaCelebration";
import GoldenBellArenaStudentCard from "../components/GoldenBellArena/GoldenBellArenaStudentCard";
import useGoldenBellSeating from "../hooks/useGoldenBellSeating";
import { orderSeatedStudents } from "../utils/goldenBellSeating";
import "./GoldenBellArena.css";
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
  const seating = useGoldenBellSeating(roomId);
  const seatedStudents = useMemo(() => orderSeatedStudents(students, seating), [students, seating]);
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
            className="arena-content-image"
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
    <div className={`arena-page min-h-screen bg-gradient-to-b from-green-50 via-gray-100 to-white text-gray-900 ${room.status === "FINISHED" ? "arena-page--finished" : ""}`}>
      <GoldenBellArenaCelebration room={room} roomId={roomId} />
      {room.status === "FINISHED" && <p role="status" className="bg-green-100 px-4 py-3 text-center font-bold text-green-800">Phòng thi đã kết thúc.</p>}
      {room.status === "FINISHED" && <div className="mx-auto w-full max-w-5xl px-4 py-6" aria-live="polite"><RankingPodium ranking={ranking} /></div>}
      <div className="arena-shell">
        <header className="arena-header text-center">
          <div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-green-700 sm:text-sm">
              <Bell size={18} />
              Đấu trường kiến thức Rung chuông vàng
            </div>
            <h1 className="arena-title font-bold tracking-tight text-gray-900">
              Sàn thi đấu trực tuyến
            </h1>
          </div>

        </header>
          <div className="arena-status grid grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="arena-status-item rounded-xl border border-green-200 bg-white shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Câu hiện tại</p>
              <p className="text-2xl font-black text-green-700">
                {room.questionNo || 0}
              </p>
            </div>
            <div className="arena-status-item rounded-xl border border-yellow-200 bg-yellow-50 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Cứu trợ</p>
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-yellow-700">
                <Gift size={16} />
                Sẵn sàng
              </p>
            </div>
            <div className="arena-status-item rounded-xl border border-red-200 bg-white shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Đồng hồ</p>
              <p className="font-mono text-2xl font-black text-red-600">
                00:{String(remainingSeconds).padStart(2, "0")}
              </p>
            </div>
          </div>
        <main className="arena-main">
          <section aria-label="Nội dung câu hỏi" className="arena-card arena-question-card rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="arena-category inline-flex rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-gray-900">
              Lĩnh vực: Trắc nghiệm
            </div>

            {room.currentQuestion ? (
              <div className={`arena-question-body ${questionContent.some((item) => item.contentType === "IMAGE" || item.contentType === "AUDIO") ? "arena-question-body--media" : ""}`}>
                <div className="arena-question-stage">
                  <div className="arena-question-text">
                    {renderContent(
                      questionContent.filter((item) => item.contentType === "TEXT"),
                      "arena-question-paragraph"
                    )}
                  </div>
                  {questionContent.some((item) => item.contentType === "IMAGE" || item.contentType === "AUDIO") && (
                    <div className="arena-question-media">
                      {questionContent.filter((item) => item.contentType !== "TEXT").map((item) => (
                        <div key={item.id} className={`arena-media-item ${item.contentType === "AUDIO" ? "arena-media-item--audio" : ""}`}>{renderContent([item])}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`arena-answers ${answers.length > 2 ? "arena-answers--multiple" : ""}`}>
                  {answers.map((answer, index) => {
                    const showCorrectAnswer = isTimeUp && answer.isCorrect;
                    const answerContent = buildContentChain(answer);
                    const answerImages = answerContent.filter((item) => item.contentType === "IMAGE");

                    return (
                      <div
                        key={answer.id}
                        className={`arena-answer rounded-xl border shadow-sm transition-colors ${
                          showCorrectAnswer
                            ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="arena-answer-heading">
                          <span className={`arena-answer-letter ${showCorrectAnswer ? "text-green-700" : "text-gray-800"}`}>
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <div className="arena-answer-content min-w-0 text-gray-800">
                            {renderContent(
                              answerContent.filter((item) => item.contentType !== "IMAGE"),
                              "arena-answer-text"
                            )}
                          </div>
                        </div>
                        {answerImages.length > 0 && (
                          <div className="arena-answer-media">
                            {renderContent(answerImages)}
                          </div>
                        )}
                        {showCorrectAnswer && (
                          <span className="arena-answer-correct-badge inline-flex items-center gap-1 rounded-full bg-green-600 text-xs font-bold text-white">
                            <CheckCircle2 size={12} aria-hidden="true" />
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="arena-empty flex flex-col items-center justify-center text-center">
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

          <section aria-label="Danh sách thí sinh" className="arena-card arena-students-card rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="arena-students-header flex flex-col gap-2 border-b border-gray-200 pb-3">
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
                <span className="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-gray-700">
                  Hạ bảng: {eliminatedCount}
                </span>
                <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">
                  {socketStatus === "connected" ? "Trực tuyến" : socketStatus === "connecting" ? "Đang kết nối" : "Mất kết nối"}
                </span>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="arena-empty flex flex-col items-center justify-center text-center text-gray-500">
                <Users className="mb-2 text-gray-400" size={30} />
                <p className="text-sm font-medium">Chưa có học sinh tham gia phòng.</p>
              </div>
            ) : (
              <div className={`arena-students-grid ${seating.isConfigured ? "arena-students-grid--seated" : ""}`} style={seating.isConfigured ? { "--seat-columns": seating.columns } : undefined}>
                {seatedStudents.map((student) => (
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
        <footer className="arena-footer" aria-hidden="true" />
      </div>
    </div>
  );
};

export default GoldenBellArena;
