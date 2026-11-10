export const podiumDraftKey = (roomId) => `golden_bell_podium_draft_${roomId}`;

export const readPodiumDraft = (roomId, storage = localStorage) => {
  try {
    const saved = JSON.parse(storage.getItem(podiumDraftKey(roomId)) || "null");
    if ((saved?.room?.roomId || saved?.room?.code) !== roomId || saved.room.status !== "FINISHED" ||
        !Number.isFinite(Date.parse(saved.room.endedAt)) || !Array.isArray(saved.room.students)) return null;
    return saved;
  } catch { return null; }
};

export const writePodiumDraft = (room, finalized = false, storage = localStorage) => {
  storage.setItem(podiumDraftKey(room.roomId || room.code), JSON.stringify({ room, finalized }));
};
