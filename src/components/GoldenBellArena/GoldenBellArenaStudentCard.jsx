import React from "react";
import { Trophy, X } from "lucide-react";
import StudentAvatar from "../GoldenBell/StudentAvatar";
import { isWaitingAfterGoldenBellRevival } from "../../utils/goldenBellRevival";

export default function GoldenBellArenaStudentCard({ student, isWinner, questionNo }) {
  const isWaiting = isWaitingAfterGoldenBellRevival(student, questionNo);
  const isEliminated = student.status === "eliminated";
  const isPassed = student.status === "passed";

  return (
    <div className={`relative rounded-lg border px-3 py-3 text-center ${
      isWinner ? "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-100 shadow-sm"
        : isEliminated ? "border-red-500 bg-gray-100 ring-1 ring-red-500"
          : isWaiting ? "border-blue-300 bg-blue-50" : isPassed ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"
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
      <div className={isEliminated && !isWinner ? "opacity-50" : undefined}>
        <div className="mb-2 flex justify-center"><StudentAvatar student={student} className="h-12 w-12" /></div>
        {isWinner && (
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-200">
            <Trophy role="img" aria-label="Cúp chiến thắng" size={30} strokeWidth={1.8} className="fill-yellow-400 text-amber-700 drop-shadow-sm" />
          </div>
        )}
        <div title={student.name} className={`w-full break-words text-center text-xs text-gray-900 ${isWinner ? "font-bold" : "font-normal"}`}>
          {student.name}
        </div>
        <div className={`mt-1 text-[10px] font-bold uppercase ${isWinner ? "text-amber-800" : "text-gray-500"}`}>
          {isWinner ? "Chiến thắng" : isEliminated ? "Hạ bảng" : isWaiting ? "Đã hồi sinh · Chờ câu tiếp theo" : "Đang đấu"}
        </div>
      </div>
    </div>
  );
}
