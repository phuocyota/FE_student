import React, { useMemo, useState } from "react";
import RankingHeader from "./RankingHeader";
import RankingPodium from "./RankingPodium";
import RankingParticipants from "./RankingParticipants";
import useGoldenBellRankingRoom from "../../hooks/useGoldenBellRankingRoom";
import { getRankingSelectionView } from "../../utils/goldenBellRanking";

export default function RankingRoom({ roomId, snapshot, returnTo, canManage }) {
  const { room, connection, error, choosePodiumRank } = useGoldenBellRankingRoom(roomId, snapshot, canManage);
  const { ranking, participants, secondResolved, assignable } = useMemo(() => getRankingSelectionView(room), [room]);
  const [draggedStudentId, setDraggedStudentId] = useState(null);
  const draggedStudent = participants.find((student) => student.id === draggedStudentId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <RankingHeader room={room} connection={connection} returnTo={returnTo} />
      {error && <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <RankingParticipants ranking={participants} canManage={canManage} onSelect={choosePodiumRank} onDragStudent={setDraggedStudentId} secondResolved={secondResolved} canChooseRanks={assignable[2] || assignable[3]} disabled={connection !== "connected"} />
        <div className="min-w-0 space-y-5">
          <RankingPodium ranking={ranking} draggedStudent={draggedStudent} canManage={canManage && connection === "connected"} secondResolved={secondResolved} onSelect={choosePodiumRank} onDragStudent={setDraggedStudentId} />
        </div>
      </div>
    </div>
  );
}
