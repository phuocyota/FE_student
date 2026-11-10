export const submitGoldenBellPodiumResult = (socket, room) => {
  if (!socket?.connected) return Promise.reject(new Error("Chưa kết nối được sân thi đấu. Bản chỉnh sửa vẫn được giữ trên FE."));
  const roomId = room.roomId || room.code;
  return new Promise((resolve, reject) => {
    socket.timeout(8000).emit("golden-bell:podium-result", {
      roomId, endedAt: room.endedAt, selections: room.podiumSelections,
    }, (failure, response) => {
      if (failure || !response?.ok || !response.room ||
          (response.room.roomId || response.room.code) !== roomId || response.room.endedAt !== room.endedAt) {
        reject(new Error(response?.message || "Chưa xác nhận được kết quả đã gửi. Bản chỉnh sửa vẫn được giữ trên FE để gửi lại."));
        return;
      }
      resolve(response.room);
    });
  });
};
