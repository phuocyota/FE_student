import { reviveGoldenBellStudent } from "../utils/goldenBellRevival.js";

export const reviveGoldenBellStudentOnServer = (socket, room, studentId, { timeoutMs = 8000 } = {}) => {
  if (!socket?.connected) return Promise.reject(new Error("Cần kết nối phòng để hồi sinh thí sinh."));
  const nextRoom = reviveGoldenBellStudent(room, studentId);
  const revivedStudent = nextRoom.students.find((student) => student.id === studentId);
  const roomId = room.roomId || room.code;

  return new Promise((resolve, reject) => {
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("golden-bell:room-state", handleState);
      socket.off("disconnect", handleDisconnect);
    };
    const fail = (error) => { cleanup(); reject(error); };
    const handleDisconnect = () => fail(new Error("Mất kết nối khi hồi sinh. Vui lòng kiểm tra lại trạng thái phòng."));
    const handleState = (confirmedRoom) => {
      if ((confirmedRoom?.roomId || confirmedRoom?.code) !== roomId) return;
      const student = confirmedRoom.students?.find((item) => item.id === studentId);
      if (!student) return;
      if (student.status === "active") {
        cleanup();
        resolve(confirmedRoom);
      } else if (student.revivalCount >= revivedStudent.revivalCount || student.revivedAt === revivedStudent.revivedAt) {
        fail(new Error(student.eliminatedReason === "timeout"
          ? "Máy chủ vẫn đánh dấu thí sinh hết giờ sau khi hồi sinh. Chưa hồi sinh thành công; cần kiểm tra xử lý timeout ở backend."
          : "Máy chủ chưa chấp nhận trạng thái hồi sinh của thí sinh."));
      }
    };
    socket.on("golden-bell:room-state", handleState);
    socket.on("disconnect", handleDisconnect);
    timer = setTimeout(() => fail(new Error("Chưa nhận được xác nhận hồi sinh từ máy chủ. Vui lòng kiểm tra lại trạng thái phòng.")), timeoutMs);
    try { socket.emit("golden-bell:sync", { roomId, room: nextRoom }); }
    catch (error) { fail(error); }
  });
};
