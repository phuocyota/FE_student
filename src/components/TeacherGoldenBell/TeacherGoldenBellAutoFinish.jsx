import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { getGoldenBellWinner } from "../../utils/goldenBellWinner";

export default function TeacherGoldenBellAutoFinish({ room, roomId, socketRef, socketStatus, onFinished }) {
  const winnerId = getGoldenBellWinner(room)?.id;
  const finished = room.status === "FINISHED" || room.status === "EXPIRED";

  useEffect(() => {
    if (!winnerId || !roomId || finished || socketStatus !== "connected") return;
    let cancelled = false;
    let timer;
    let attempts = 0;
    const finish = () => {
      if (cancelled || !socketRef.current?.connected) return;
      attempts += 1;
      socketRef.current.timeout(8000).emit("golden-bell:end-room", { roomId }, (error, response) => {
        if (cancelled) return;
        if (!error && response?.ok) {
          onFinished();
        } else if (attempts < 3) {
          timer = window.setTimeout(finish, 2000);
        } else {
          toast.error("Chưa thể tự kết thúc phòng. Thầy/Cô vui lòng bấm Kết thúc phòng để thử lại.");
        }
      });
    };
    // Allow all subscribed displays to receive the final contestant state first.
    timer = window.setTimeout(finish, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [winnerId, roomId, finished, socketRef, socketStatus, onFinished]);

  return null;
}
