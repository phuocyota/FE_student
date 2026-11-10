import { useEffect, useRef } from "react";
import { getGoldenBellWinner } from "../utils/goldenBellWinner";
import { completeGoldenBellWinnerRoom } from "../api/goldenBellCompletion";

export default function useGoldenBellWinnerCompletion({ room, socketRef, connection, enabled, onStart, onFinished, onError }) {
  const callbacks = useRef(null);
  const pending = useRef(null);
  const winnerId = getGoldenBellWinner(room)?.id;
  const roomId = room.roomId || room.code;
  useEffect(() => { callbacks.current = { onStart, onFinished, onError }; }, [onStart, onFinished, onError]);
  useEffect(() => {
    if (connection !== "connected") {
      pending.current = null;
      return;
    }
    if (!enabled || connection !== "connected" || room.status === "FINISHED" || !winnerId || !roomId) return;
    const key = `${roomId}:${room.questionNo}:${winnerId}`;
    if (pending.current === key) return;
    pending.current = key;
    callbacks.current.onStart?.();
    completeGoldenBellWinnerRoom(socketRef.current, room).then((finished) => {
      callbacks.current.onFinished(finished);
    }).catch((error) => {
      callbacks.current.onError?.(error);
    });
  }, [enabled, connection, room, roomId, winnerId, socketRef]);
}
