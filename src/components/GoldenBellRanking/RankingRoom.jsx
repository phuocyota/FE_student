import React, { useEffect, useMemo, useState } from "react";
import RankingHeader from "./RankingHeader";
import RankingPodium from "./RankingPodium";
import RankingParticipants from "./RankingParticipants";
import useGoldenBellRankingRoom from "../../hooks/useGoldenBellRankingRoom";
import { getRankingSelectionView, getPodiumEditSecondsRemaining } from "../../utils/goldenBellRanking";

export default function RankingRoom({ roomId, snapshot, returnTo, canManage }) {
  const { room, connection, error, choosePodiumRank, isSavingPodium } = useGoldenBellRankingRoom(roomId, snapshot, canManage);
  const { ranking, participants, assignable } = useMemo(() => getRankingSelectionView(room), [room]);
  const [draggedStudentId, setDraggedStudentId] = useState(null);
  const draggedStudent = participants.find((student) => student.id === draggedStudentId);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);
  const editSeconds = getPodiumEditSecondsRemaining(room, now);
  const canEdit = canManage && editSeconds > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <RankingHeader room={room} connection={connection} returnTo={returnTo} />
      {canManage && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-900">{room.status !== "FINISHED" ? "Chỉ được sắp xếp thứ hạng sau khi sàn đấu kết thúc." : editSeconds > 0 ? `Còn ${editSeconds} giây để điều chỉnh thứ hạng. Kết quả được cập nhật lên sân thi đấu.` : "Đã hết 1 phút điều chỉnh. Thứ hạng đã được khóa."}</p>}
      {isSavingPodium && <p role="status" className="text-sm text-green-800">Đang lưu thứ hạng...</p>}
      {error && <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <RankingParticipants ranking={participants} canManage={canManage} onSelect={choosePodiumRank} onDragStudent={setDraggedStudentId} canChooseRanks={assignable[1] || assignable[2] || assignable[3]} disabled={!canEdit || isSavingPodium} />
        <div className="min-w-0 space-y-5">
          <RankingPodium ranking={ranking} draggedStudent={draggedStudent} canManage={canEdit && !isSavingPodium} onSelect={choosePodiumRank} onDragStudent={setDraggedStudentId} />
        </div>
      </div>
    </div>
  );
}
