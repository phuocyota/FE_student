import React from "react";
import { Trophy, X } from "lucide-react";
import StudentAvatar from "../GoldenBell/StudentAvatar";

export default function GoldenBellArenaStudentCard({ student, isWinner }) {
  const isEliminated = student.status === "eliminated";
  const isPassed = student.status === "passed";

  return (
    <div className={`relative flex h-10 min-w-0 items-center gap-2 rounded-lg border px-2 ${
      isWinner ? "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-100 shadow-sm"
        : isEliminated ? "border-red-500 bg-gray-100 ring-1 ring-red-500"
          : isPassed ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"
    }`}>
      {isEliminated && !isWinner && (
        <X
          role="img"
          aria-label="Trả lời sai"
          size={16}
          strokeWidth={3}
          className="absolute right-1 top-1 text-red-600"
        />
      )}
      <div className={`flex min-w-0 flex-1 items-center gap-2 ${isEliminated && !isWinner ? "opacity-60" : ""}`}>
        <div className="relative shrink-0">
          <StudentAvatar student={student} className="h-7 w-7 text-xs" />
          {isWinner && <Trophy role="img" aria-label="Cúp chiến thắng" size={14} className="absolute -bottom-1 -right-1 fill-yellow-400 text-amber-700" />}
        </div>
        <div className="min-w-0 flex-1">
          <div title={student.name || student.fullName} className={`truncate text-[11px] leading-4 text-gray-900 ${isWinner ? "font-bold" : "font-medium"}`}>
            {student.name || student.fullName}
          </div>
          <div className={`text-[9px] font-semibold leading-3 ${isWinner ? "text-amber-800" : isEliminated ? "text-red-600" : "text-green-700"}`}>
            {isWinner ? "Chiến thắng" : isEliminated ? "Hạ bảng" : isPassed ? "Trả lời đúng" : "Đang đấu"}
          </div>
        </div>
      </div>
    </div>
  );
}
