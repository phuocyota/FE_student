import React from "react";
import { X } from "lucide-react";
import StudentAvatar from "../GoldenBell/StudentAvatar";
import { isWaitingAfterGoldenBellRevival } from "../../utils/goldenBellRevival";

export default function GoldenBellArenaStudentCard({ student, isWinner, questionNo }) {
  const isWaiting = isWaitingAfterGoldenBellRevival(student, questionNo);
  const isEliminated = student.status === "eliminated";
  const statusLabel = isWinner ? "Chiến thắng" : isEliminated ? "Hạ bảng" : isWaiting ? "Đã hồi sinh · Chờ câu tiếp theo" : "Đang đấu";

  return (
    <div aria-label={`${student.name || student.fullName || "Thí sinh"} · ${statusLabel}`} className="min-w-0 px-1 py-3">
      <div className="relative mx-auto w-14 max-w-full">
        <StudentAvatar student={student} className={`aspect-square h-auto w-14 max-w-full ${isEliminated && !isWinner ? "opacity-50" : ""}`} />
        {isEliminated && !isWinner && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
            <X role="img" aria-label="Trả lời sai" size={16} strokeWidth={3} className="text-red-600" />
          </span>
        )}
      </div>
    </div>
  );
}
