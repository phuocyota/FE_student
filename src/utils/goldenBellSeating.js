export const seatingKey = (roomId) => `goldenBellSeating:${roomId}`;

export const normalizeSeating = (value) => ({
  columns: Math.min(8, Math.max(1, Math.trunc(Number(value?.columns)) || 2)),
  studentIds: Array.isArray(value?.studentIds)
    ? [...new Set(value.studentIds.filter((id) => typeof id === "string" || typeof id === "number").map(String))]
    : [],
});

export const readSeating = (roomId, storage = localStorage) => {
  try { return normalizeSeating(JSON.parse(storage.getItem(seatingKey(roomId)))); }
  catch { return normalizeSeating(null); }
};

export const orderSeatedStudents = (students, seating) => {
  const byId = new Map(students.map((student) => [String(student.id), student]));
  const ordered = [];
  for (const id of normalizeSeating(seating).studentIds) {
    if (byId.has(id)) {
      ordered.push(byId.get(id));
      byId.delete(id);
    }
  }
  return [...ordered, ...byId.values()];
};
