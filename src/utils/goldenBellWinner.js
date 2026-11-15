import { isGoldenBellAnswerPending } from "./goldenBellAnswerReveal.js";

export const getGoldenBellWinner = (room) => {
  if (!room?.questionNo || room.status === "EXPIRED") return null;
  // The winner is only known once the teacher reveals the answer.
  if (isGoldenBellAnswerPending(room)) return null;
  const students = Array.isArray(room.students) ? room.students : [];
  if (students.length < 2) return null;
  const remaining = students.filter((student) =>
    student.status === "active" || student.status === "passed"
  );
  if (remaining.length !== 1) return null;

  const candidate = remaining[0];
  // The last contestant must pass this round before being declared the winner.
  return candidate.status === "passed" && candidate.lastQuestionNo === room.questionNo && (candidate.resumeFromQuestionNo || 0) <= room.questionNo
    ? candidate
    : null;
};
