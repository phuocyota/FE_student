import { getGoldenBellWinner } from "../utils/goldenBellWinner.js";

export const completeGoldenBellWinnerRoom = (socket, room) => {
  if (room.status === "FINISHED" || !getGoldenBellWinner(room)) return Promise.resolve(room);
  if (!socket?.connected) return Promise.reject(new Error("Chưa kết nối được phòng để xác nhận kết thúc cuộc thi."));
  const roomId = room.roomId || room.code;
  return new Promise((resolve, reject) => {
    socket.timeout(8000).emit("golden-bell:end-room", { roomId }, (error, response) => {
      if (error || !response?.ok || response.room?.status !== "FINISHED" ||
          (response.room.roomId || response.room.code) !== roomId || !Number.isFinite(Date.parse(response.room.endedAt))) {
        reject(new Error(response?.message || "Chưa xác nhận được kết thúc cuộc thi. Vui lòng thử kết nối lại phòng."));
        return;
      }
      resolve(response.room);
    });
  });
};
