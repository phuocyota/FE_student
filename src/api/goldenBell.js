export const reviveGoldenBellStudentOnServer = (socket, room, studentId, { timeoutMs = 8000 } = {}) => {
  const revivalErrors = {
    "Teacher authentication is required": "Phiên đăng nhập giáo viên không hợp lệ. Vui lòng đăng nhập lại.",
    "Join the room before reviving a student": "Vui lòng kết nối lại phòng trước khi hồi sinh học sinh.",
    "Room not found": "Không tìm thấy phòng thi.",
    "Room expired": "Phòng đã hết hạn, không thể hồi sinh học sinh.",
    "Room has ended": "Phòng đã kết thúc, không thể hồi sinh học sinh.",
    "Student not found": "Không tìm thấy học sinh trong phòng.",
    "Only eliminated students can be revived": "Chỉ có thể hồi sinh học sinh đang bị loại.",
  };
  if (!socket?.connected) return Promise.reject(new Error("Cần kết nối phòng để hồi sinh thí sinh."));
  const roomId = room?.roomId || room?.code;
  if (!roomId || !studentId) return Promise.reject(new Error("Thiếu mã phòng hoặc học sinh cần hồi sinh."));

  return new Promise((resolve, reject) => {
    socket.timeout(timeoutMs).emit("golden-bell:revive-student", { roomId, studentId }, (error, response) => {
      if (error) {
        reject(new Error("Chưa nhận được xác nhận hồi sinh từ máy chủ. Vui lòng kiểm tra lại trạng thái phòng."));
        return;
      }
      const student = response?.room?.students?.find((item) => item.id === studentId);
      if (!response?.ok || (response.room?.roomId || response.room?.code) !== roomId || !student || student.status !== "active" ||
          student.resumeFromQuestionNo !== (response.room.questionNo || 0) + 1) {
        reject(new Error(revivalErrors[response?.message] || response?.message || "Máy chủ chưa xác nhận hồi sinh học sinh."));
        return;
      }
      resolve(response.room);
    });
  });
};
