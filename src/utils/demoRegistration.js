const PROFILE_KEY = "golden_bell_demo_profiles";
const ACTIVE_KEY = "golden_bell_demo_active_student";

export const clearActiveDemoStudent = () => {
  sessionStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(ACTIVE_KEY);
};

export const readDemoStudent = () => {
  try {
    const id = sessionStorage.getItem(ACTIVE_KEY) || localStorage.getItem(ACTIVE_KEY);
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
    return profiles.find((profile) => profile.id === id) || null;
  } catch {
    return null;
  }
};

export const saveDemoStudent = async ({ photo, ...values }) => {
  const avatar = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không thể lưu ảnh. Vui lòng chụp lại."));
    reader.readAsDataURL(photo);
  });
  const student = { ...values, id: crypto.randomUUID(), name: values.fullName, avatar, isDemo: true, registeredAt: new Date().toISOString() };
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
    localStorage.setItem(PROFILE_KEY, JSON.stringify([...profiles, student]));
    localStorage.setItem(ACTIVE_KEY, student.id);
    sessionStorage.setItem(ACTIVE_KEY, student.id);
  } catch {
    throw new Error("Không thể lưu dữ liệu demo. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.");
  }
  return student;
};

export const demoRoomKey = (roomId) => `golden_bell_demo_room_${roomId}`;

export const readDemoRoom = (roomId) => {
  try {
    const room = JSON.parse(localStorage.getItem(demoRoomKey(roomId)) || "null");
    if (room?.isDemo && Array.isArray(room.students)) return room;
  } catch { /* Start a new demo room when saved data is invalid. */ }
  return { roomId, code: roomId, isDemo: true, students: [], currentQuestion: null, questionNo: 0, usedQuestionIds: [] };
};

export const joinDemoRoom = (roomId, profile) => {
  const room = readDemoRoom(roomId);
  const previous = room.students.find((student) => student.id === profile.id);
  if (room.status === "FINISHED" || room.status === "EXPIRED") {
    if (previous) return room;
    throw new Error("Phòng demo đã kết thúc. Vui lòng nhập mã phòng khác.");
  }
  const student = { status: "active", joinedAt: new Date().toISOString(), ...previous, ...profile };
  room.students = [...room.students.filter((item) => item.id !== student.id), student];
  localStorage.setItem(demoRoomKey(roomId), JSON.stringify(room));
  return room;
};
