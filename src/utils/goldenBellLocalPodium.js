import { getPodiumEditSecondsRemaining, getPodiumSelections } from "./goldenBellRanking.js";

export const localPodiumKey = (roomId) => `golden_bell_local_podium_${roomId}`;

export const readLocalPodiumRoom = (roomId, storage = localStorage) => {
  try {
    const record = JSON.parse(storage.getItem(localPodiumKey(roomId)) || "null");
    const room = record?.room;
    if (record?.roomId !== roomId || room?.status !== "FINISHED" ||
        (room.roomId || room.code) !== roomId || !room.endedAt || !Array.isArray(room.students)) return null;
    return { ...room, podiumSelections: getPodiumSelections(room) };
  } catch { return null; }
};

export const applyLocalPodium = (room, storage = localStorage) => {
  const saved = readLocalPodiumRoom(room.roomId || room.code, storage);
  if (room.status !== "FINISHED" || !saved || saved.endedAt !== room.endedAt) return room;
  return { ...room, podiumSelections: saved.podiumSelections };
};

export const saveLocalPodium = (room, storage = localStorage) => {
  if (!getPodiumEditSecondsRemaining(room)) throw new Error("Đã hết thời gian điều chỉnh thứ hạng.");
  return rememberPodiumResult(room, storage);
};

export const rememberPodiumResult = (room, storage = localStorage) => {
  const roomId = room.roomId || room.code;
  if (!roomId) throw new Error("Thiếu mã phòng.");
  const next = { ...room, podiumSelections: getPodiumSelections(room) };
  storage.setItem(localPodiumKey(roomId), JSON.stringify({ roomId, room: next }));
  return next;
};
