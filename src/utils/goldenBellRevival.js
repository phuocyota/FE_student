export const reviveGoldenBellStudent = (room, studentId) => {
  if (room.status === "FINISHED" || room.status === "EXPIRED") throw new Error("Phòng đã kết thúc, không thể hồi sinh thí sinh.");
  const student = room.students?.find((item) => item.id === studentId);
  if (!student || student.status !== "eliminated") throw new Error("Chỉ hồi sinh được thí sinh đã bị loại.");
  const startedAt = Date.parse(room.questionStartedAt || "");
  const deadlinePassed = Number.isFinite(startedAt) && Date.now() >= startedAt + (room.questionDurationSeconds || 15) * 1000;
  const waitForNextQuestion = Boolean(room.questionEndedAt) || deadlinePassed;
  return {
    ...room,
    podiumSelections: {},
    students: room.students.map((item) => item.id !== studentId ? item : {
      ...item,
      status: "active",
      // Mark the expired round as handled so the server does not time this student out again.
      lastQuestionNo: waitForNextQuestion ? room.questionNo || 0 : 0,
      resumeFromQuestionNo: waitForNextQuestion ? (room.questionNo || 0) + 1 : room.questionNo || 1,
      eliminatedAt: null,
      eliminatedQuestionNo: null,
      eliminatedReason: null,
      revivedAt: new Date().toISOString(),
      revivalCount: (item.revivalCount || 0) + 1,
    }),
  };
};
