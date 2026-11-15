export const GOLDEN_BELL_QUESTION_SECONDS = 20;

const isRoomClosed = (room) => room?.status === "FINISHED" || room?.status === "EXPIRED";

// Rooms created before the reveal button existed have no `answerRevealed` field and keep the old behaviour.
export const isGoldenBellAnswerPending = (room) =>
  Boolean(room?.currentQuestion) && room.answerRevealed === false && !isRoomClosed(room);

export const isGoldenBellAnswerRevealed = (room) =>
  Boolean(room?.currentQuestion) && (room.answerRevealed === true || isRoomClosed(room));

// Arena view: the answer (and who is eliminated) shows only after the teacher presses "Hiện đáp án",
// even for rooms that carry no `answerRevealed` field.
export const requireGoldenBellAnswerReveal = (room) =>
  room?.currentQuestion ? { ...room, answerRevealed: room.answerRevealed === true } : room;

export const revealGoldenBellAnswer = (room, now = new Date().toISOString()) => {
  if (!room?.currentQuestion) throw new Error("Chưa có câu hỏi để công bố đáp án.");
  return {
    ...room,
    answerRevealed: true,
    answerRevealedAt: room.answerRevealedAt || now,
    // Revealing the answer also closes answering for this question.
    questionEndedAt: room.questionEndedAt || now,
  };
};

const answeredCurrentQuestion = (student, questionNo) =>
  (student.status === "passed" && student.lastQuestionNo === questionNo) ||
  (student.status === "eliminated" && student.eliminatedQuestionNo === questionNo);

// Hides the result of the current question until the teacher reveals the answer.
export const getDisplayedGoldenBellStudents = (room) => {
  const students = Array.isArray(room?.students) ? room.students : [];
  if (!isGoldenBellAnswerPending(room)) return students;
  return students.map((student) => answeredCurrentQuestion(student, room.questionNo)
    ? { ...student, status: "active", hasPendingAnswer: true }
    : student);
};

// The answer a student already gave to `questionNo`, read from the synced room (survives a page reload).
export const getGoldenBellStudentAnswer = (student, questionNo) => {
  if (!student || !questionNo || !answeredCurrentQuestion(student, questionNo)) return null;
  return {
    answerId: student.answerQuestionNo === questionNo ? student.answerId || null : null,
    isCorrect: student.status === "passed",
  };
};

// Applies (or changes) a student's answer for the current question.
// `previousIsCorrect` is the correctness of the answer being replaced, or null for a first answer.
export const applyGoldenBellAnswer = (student, { questionNo, answerId = null, isCorrect, previousIsCorrect = null, now = new Date().toISOString() }) => {
  const correctCount = Math.max(0, (student.correctCount || 0) - (previousIsCorrect === true ? 1 : 0));
  const wrongCount = Math.max(0, (student.wrongCount || 0) - (previousIsCorrect === false ? 1 : 0));
  const answer = { answerId, answerQuestionNo: questionNo };

  if (isCorrect) {
    return {
      ...student,
      ...answer,
      status: "passed",
      lastQuestionNo: questionNo,
      correctCount: correctCount + 1,
      wrongCount,
      eliminatedReason: null,
      eliminatedAt: null,
      eliminatedQuestionNo: null,
    };
  }

  return {
    ...student,
    ...answer,
    status: "eliminated",
    eliminatedReason: "wrong-answer",
    eliminatedAt: now,
    eliminatedQuestionNo: questionNo,
    lastQuestionNo: questionNo,
    correctCount,
    wrongCount: wrongCount + 1,
  };
};
