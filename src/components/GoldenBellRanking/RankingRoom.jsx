import React, { useEffect, useMemo, useState } from "react";
import RankingHeader from "./RankingHeader";
import RankingPodium from "./RankingPodium";
import RankingParticipants from "./RankingParticipants";
import useGoldenBellRankingRoom from "../../hooks/useGoldenBellRankingRoom";
import { getRankingSelectionView, getPodiumEditSecondsRemaining } from "../../utils/goldenBellRanking";

export default function RankingRoom({ roomId, snapshot, returnTo, canManage }) {
  const { room, connection, error, choosePodiumRank, submitPodium, submissionState, hasDraftChanges } = useGoldenBellRankingRoom(roomId, snapshot, canManage);
  const { ranking, participants, assignable } = useMemo(() => getRankingSelectionView(room), [room]);
  const [draggedStudentId, setDraggedStudentId] = useState(null);
  const draggedStudent = participants.find((student) => student.id === draggedStudentId);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);
  const editSeconds = getPodiumEditSecondsRemaining(room, now);
  const canEdit = canManage && editSeconds > 0 && submissionState !== "sending" && submissionState !== "sent";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <RankingHeader room={room} connection={connection} returnTo={returnTo} />
      {canManage && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-50 px-4 py-3">
        <p role="status" className="text-sm font-semibold text-green-900">{submissionState === "sent" ? "Đã chốt và gửi kết quả lên sân thi đấu." : submissionState === "sending" ? "Đang gửi kết quả cuối cùng..." : room.status !== "FINISHED" ? "Chỉ được sắp xếp thứ hạng sau khi sàn đấu kết thúc." : editSeconds > 0 ? `Còn ${editSeconds} giây để chỉnh trên FE. Bấm Chốt & gửi khi xong; hết giờ sẽ tự gửi bản cuối.` : hasDraftChanges ? "Đã hết thời gian chỉnh sửa. Bản cuối sẽ được gửi lên sân thi đấu." : "Đã hết thời gian chỉnh sửa. Không có thay đổi cần gửi."}</p>
        {room.status === "FINISHED" && submissionState !== "sent" && <button type="button" onClick={() => { void submitPodium(); }} disabled={!hasDraftChanges || submissionState === "sending"} className="shrink-0 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40">{submissionState === "sending" ? "Đang gửi..." : submissionState === "error" ? "Gửi lại kết quả" : "Chốt & gửi kết quả"}</button>}
      </div>}
      {canManage && hasDraftChanges && submissionState !== "sending" && <p role="status" className="min-h-5 text-sm text-gray-500">Bản đang chỉnh chỉ hiển thị trên FE này; sân thi đấu nhận kết quả khi chốt.</p>}
      {error && <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <RankingParticipants ranking={participants} canManage={canManage} onSelect={choosePodiumRank} onDragStudent={setDraggedStudentId} canChooseRanks={assignable[1] || assignable[2] || assignable[3]} disabled={!canEdit} />
        <div className="min-w-0 space-y-5">
          <RankingPodium ranking={ranking} draggedStudent={draggedStudent} canManage={canEdit} onSelect={choosePodiumRank} onDragStudent={setDraggedStudentId} />
        </div>
      </div>
    </div>
  );
}
