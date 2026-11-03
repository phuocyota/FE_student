export const getGoldenBellWinner = (room) => {
  if (!room?.questionNo || room.status === "EXPIRED") return null;
  const students = Array.isArray(room.students) ? room.students : [];
  if (students.length < 2) return null;
  const remaining = students.filter((student) =>
    student.status === "active" || student.status === "passed"
  );
  return remaining.length === 1 ? remaining[0] : null;
};
