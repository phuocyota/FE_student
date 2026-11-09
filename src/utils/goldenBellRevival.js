export const isWaitingAfterGoldenBellRevival = (student, questionNo) =>
  student?.status === "active" && (student.resumeFromQuestionNo || 0) > (questionNo || 0);

export const reviveGoldenBellStudent = (room, studentId) => {
  if (room.status === "FINISHED" || room.status === "EXPIRED") throw new Error("Phòng đã kết thúc, không thể hồi sinh thí sinh.");
  const student = room.students?.find((item) => item.id === studentId);
  if (!student || student.status !== "eliminated") throw new Error("Chỉ hồi sinh được thí sinh đã bị loại.");
  return {
    ...room,
    podiumSelections: {},
    students: room.students.map((item) => item.id !== studentId ? item : {
      ...item,
      status: "active",
      // The current round stays handled; participation resumes at the next question.
      lastQuestionNo: room.questionNo || 0,
      resumeFromQuestionNo: (room.questionNo || 0) + 1,
      eliminatedAt: null,
      eliminatedQuestionNo: null,
      eliminatedReason: null,
      revivedAt: new Date().toISOString(),
      revivalCount: (item.revivalCount || 0) + 1,
    }),
  };
};
